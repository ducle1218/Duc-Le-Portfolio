"""Build the public internship index from unauthenticated employer APIs.

Runs locally or on GitHub's hosted runner; no applicant data or credentials.
A failed board is reported, never presented as a successful fresh search.
"""
import concurrent.futures
import datetime as dt
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import urllib.request
import urllib.error
from urllib.parse import urlencode, urlparse, urljoin

ROOT = Path(__file__).resolve().parents[1]
INTERNSHIP = re.compile(r"\bintern(?:ship)?s?\b|co[ -]?op", re.I)
DISCOVERY_ROLES = ('mechanical', 'CAD', 'robotics', 'manufacturing', 'engineering', 'engineer')
DISCOVERY_EXCLUSIONS = ('senior', 'principal', 'director', 'manager')


def contains_word(text, term):
    return bool(re.search(r'(^|[^a-z0-9])' + re.escape(term) + r'(?=$|[^a-z0-9])', text, re.I))


def discovery_candidate(job):
    """Mirror job-core.mjs DEFAULTS ready matches, excluding uncertain locations."""
    title, location = job.get('title', ''), job.get('location', '')
    if not INTERNSHIP.search(title) or not any(contains_word(title, word) for word in DISCOVERY_ROLES):
        return False
    if any(contains_word(title, word) for word in DISCOVERY_EXCLUSIONS):
        return False
    local = any(contains_word(location, word) for word in ('New Jersey', 'NJ', 'New York', 'NY', 'Pennsylvania', 'PA'))
    remote = bool(job.get('remote')) or contains_word(location, 'remote')
    us = any(contains_word(location, word) for word in ('US', 'USA', 'United States'))
    return local or (remote and us)


def discovery_index(index):
    # Absence from this filtered subset must never be used as evidence of closure.
    return {**index, 'scope': 'engineering-internships-nj-ny-pa-us-remote',
            'completeForClosureChecks': False,
            'jobs': [job for job in index['jobs'] if discovery_candidate(job)]}


def write_discovery_index(index, output):
    compact = discovery_index(index)
    output.write_text(json.dumps(compact, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f"Wrote {len(compact['jobs'])} regional discovery candidates to {output}")


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip += 1
        if tag in ('p', 'li', 'br', 'div', 'h1', 'h2', 'h3', 'h4'):
            self.parts.append('\n')

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)
        if tag in ('p', 'li', 'div', 'h1', 'h2', 'h3', 'h4'):
            self.parts.append('\n')

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def plain(value):
    parser = PlainText()
    parser.feed(html.unescape(str(value or '')))
    return '\n'.join(line.strip() for line in ''.join(parser.parts).splitlines() if line.strip())


def get_text(url, body=None):
    request = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
        headers={'User-Agent': 'DucLe-Portfolio-JobIndex/1.0', 'Accept': 'application/json', 'Content-Type': 'application/json'})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                data = response.read(20_000_001)
                if len(data) > 20_000_000:
                    raise ValueError('Source exceeds size limit')
                return data.decode('utf-8')
        except urllib.error.HTTPError as error:
            if attempt or error.code < 500: raise
        except (urllib.error.URLError, TimeoutError):
            if attempt: raise


def get_json(url, body=None):
    return json.loads(get_text(url, body))


def direct_job(item, source, checked_at):
    """Normalize employer detail responses, never search snippets or relative dates."""
    if source['provider'] == 'eightfold':
        title, description = item['name'], plain(item.get('jobDescription'))
        locations = item.get('standardizedLocations') or item.get('locations') or []
        location = '; '.join(locations)
        remote = item.get('workLocationOption') in ('remote', 'remote_local')
        stamp = item.get('postedTs')
        posted = dt.datetime.fromtimestamp(stamp, dt.timezone.utc).isoformat() if stamp else ''
        url = source['careersUrl'] + '?pid=' + str(int(item['id']))
        identity, expires = str(item['id']), ''
        employment = ', '.join(item.get('efcustomTextLevelofexperience') or [])
        closed = False
        verified = item.get('positionUserActions', {}).get('applyAction', {}).get('status') == 'allowed'
    else:
        title, description = item['title'], plain(item.get('jobDescription'))
        locations = [item.get('location', ''), *(item.get('additionalLocations') or [])]
        country = (item.get('country') or {}).get('descriptor', '')
        location = '; '.join(dict.fromkeys(filter(None, locations)))
        if country and country not in location:
            location += ' · ' + country
        remote = bool(re.search(r'\bremote\b|fully virtual', item.get('remoteType', '') + ' ' + location, re.I))
        posted, expires = item.get('startDate', ''), item.get('endDate', '')
        url, identity = item['externalUrl'], item['jobReqId']
        employment = item.get('timeType', '')
        closed = item.get('canApply') is False or item.get('posted') is False
        verified = item.get('canApply') is True and item.get('posted') is True
    expected = urlparse(source['careersUrl']).hostname
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname != expected or parsed.username or len(description) < 80:
        raise ValueError('Incomplete or off-domain employer posting')
    return {'id': source['provider'] + ':' + source['board'] + ':' + identity,
        'title': title, 'company': source['company'], 'location': location,
        'description': description[:65000], 'url': url, 'datePosted': posted,
        'validThrough': expires, 'checkedAt': checked_at, 'remote': remote,
        'source': source['provider'], 'board': source['board'], 'employmentType': employment,
        'closed': closed, 'availability': 'closed' if closed else 'active' if verified else 'unknown',
        'statusCheckedAt': checked_at, 'statusReason': 'The employer’s careers system was checked.',
        'statusEvidenceUrl': url}


def collect_direct(source, checked_at, fetch, status):
    jobs, seen = [], set()
    if source['provider'] == 'eightfold':
        host = source['careersUrl'].split('/careers')[0]
        domain = source.get('domain', 'lockheedmartin.com')
        # Hosts come from the reviewed configuration, never user-provided URLs.
        for query in ('intern', 'co-op'):
            offset = 0
            total, pages_seen = 0, set()
            for page in range(40):
                data = fetch(host + '/api/pcsx/search?' + urlencode({'domain': domain,
                    'query': query, 'start': offset, 'sort_by': 'timestamp'}))['data']
                items = data['positions']
                total = max(total, data['count'])
                if not items:
                    if offset < total: status['truncated'] = True
                    break
                signature = tuple(str(item['id']) for item in items)
                if signature in pages_seen:
                    status['truncated'] = True
                    break
                pages_seen.add(signature)
                for item in items:
                    identity = str(item['id'])
                    if identity in seen or not INTERNSHIP.search(item['name']): continue
                    seen.add(identity)
                    try:
                        detail = fetch(host + '/api/pcsx/position_details?' + urlencode({
                            'domain': domain, 'position_id': identity}))['data']
                        if str(detail['id']) != identity: raise ValueError('Mismatched posting')
                        if INTERNSHIP.search(detail['name']): jobs.append(direct_job(detail, source, checked_at))
                    except Exception: status['omitted'] += 1
                offset += len(items)
                if offset >= total: break
            else: status['truncated'] = True
    else:
        base = source['careersUrl'].split('/' + source['board'])[0] + '/wday/cxs/' + source['tenant'] + '/' + source['board']
        probe = fetch(base + '/jobs', {'limit': 20, 'offset': 0, 'searchText': '', 'appliedFacets': {}})
        values = next((f['values'] for f in probe.get('facets', []) if f.get('facetParameter') == 'workerSubType'), [])
        interns = [v['id'] for v in values if INTERNSHIP.search(v.get('descriptor', ''))]
        # Use the employer's internship classification where available, but still
        # require an internship/co-op title. A regular role mentioning interns is excluded.
        queries = [''] if interns else ['intern', 'co-op']
        for query in queries:
            offset = 0
            total, pages_seen = 0, set()
            for page in range(50):
                data = fetch(base + '/jobs', {'limit': 20, 'offset': offset, 'searchText': query,
                    'appliedFacets': {'workerSubType': interns} if interns else {}})
                # Workday commonly sends total=0 after page one, even while returning
                # more jobs. Preserve the first page's count across pagination.
                total = max(total, data['total'])
                items = data['jobPostings']
                if not items:
                    if offset < total: status['truncated'] = True
                    break
                signature = tuple(item['externalPath'] for item in items)
                if signature in pages_seen:
                    status['truncated'] = True
                    break
                pages_seen.add(signature)
                fresh = [item for item in items if item['externalPath'] not in seen]
                for item in fresh:
                    path = item['externalPath']; seen.add(path)
                    if not INTERNSHIP.search(item['title']): continue
                    if not path.startswith('/job/') or '..' in path: raise ValueError('Invalid job path')
                    try:
                        detail = fetch(base + path)['jobPostingInfo']
                        requested_id = re.sub(r'-\d+$', '', path.rsplit('_', 1)[-1])
                        if detail.get('jobReqId') != requested_id: raise ValueError('Mismatched posting')
                        if not INTERNSHIP.search(detail['title']): continue
                        jobs.append(direct_job(detail, source, checked_at))
                    except Exception: status['omitted'] += 1
                offset += len(items)
                if offset >= total: break
            else: status['truncated'] = True
    return jobs


def google_listing(page):
    """Read the JSON data embedded in Google's public rendered search page; never execute scripts."""
    records = None
    for match in re.finditer(r"AF_initDataCallback\(\{key: '[^']+'.*?data:", page):
        data, _ = json.JSONDecoder().raw_decode(page[match.end():])
        if (isinstance(data, list) and len(data) == 4 and isinstance(data[2], int)
                and isinstance(data[3], int) and (data[0] is None or isinstance(data[0], list))):
            records = data
            break
    if records is None:
        raise ValueError('Google search data format unavailable')
    links = {}
    for href in re.findall(r'href="([^"]+)"', page):
        href = html.unescape(href)
        match = re.search(r'(?:^|/)jobs/results/(\d+)-', href)
        if match:
            url = urljoin('https://www.google.com/about/careers/applications/', href).split('?')[0]
            if url.startswith('https://www.google.com/about/careers/applications/jobs/results/'):
                links[match[1]] = url
    return records[0] or [], records[2], links


def tech_job(source, checked_at, identity, title, description, location, url, posted='', remote=False):
    if urlparse(url).hostname != urlparse(source['careersUrl']).hostname or len(description) < 80:
        raise ValueError('Incomplete or off-domain employer posting')
    return {'id': source['provider'] + ':' + source['board'] + ':' + str(identity),
        'title': title, 'company': source['company'], 'description': description[:65000],
        'location': location, 'url': url, 'datePosted': posted, 'checkedAt': checked_at,
        'remote': remote, 'source': source['provider'], 'board': source['board'],
        'availability': 'unknown', 'statusCheckedAt': checked_at,
        'statusReason': 'Listed on the employer’s career search; application availability is not independently confirmed.',
        'statusEvidenceUrl': url}


def collect_tech(source, checked_at, fetch, fetch_text, status):
    jobs, seen = [], set()
    for query in ('intern', 'co-op'):
        offset, total, pages_seen = 0, 0, set()
        for page in range(1, 31):
            if source['provider'] == 'google':
                listing = fetch_text(source['careersUrl'] + '?' + urlencode({'q': query, 'page': page}))
                items, count, links = google_listing(listing)
                ids = tuple(str(item[0]) for item in items)
            else:
                data = fetch('https://www.amazon.jobs/en/search.json?' + urlencode({
                    'base_query': query, 'offset': offset, 'result_limit': 100}))
                if data.get('error'): raise ValueError('Amazon search unavailable')
                items, count = data['jobs'], data['hits']
                ids = tuple(str(item['id_icims']) for item in items)
            total = max(total, count)
            if not items:
                if offset < total: status['truncated'] = True
                break
            if ids in pages_seen:
                status['truncated'] = True
                break
            pages_seen.add(ids)
            for item, identity in zip(items, ids):
                title = item[1] if source['provider'] == 'google' else item['title']
                if identity in seen or not INTERNSHIP.search(title): continue
                seen.add(identity)
                try:
                    if source['provider'] == 'google':
                        if item[7] != 'Google' or not identity.isdigit(): raise ValueError('Unexpected Google employer identity')
                        description = plain('\n'.join(item[i][1] for i in (15, 10, 4, 3, 18)
                            if len(item) > i and isinstance(item[i], list) and len(item[i]) > 1 and isinstance(item[i][1], str)))
                        # Keep regional locations first so brief displays retain the matching region.
                        locations = [loc[0] for loc in item[9]]
                        locations.sort(key=lambda loc: not bool(re.search(r', (NJ|NY|PA),', loc)))
                        location = '; '.join(locations)
                        # Undocumented internal timestamps are NOT treated as original posting dates.
                        job = tech_job(source, checked_at, identity, title, description, location, links[identity])
                    else:
                        path = item['job_path']
                        if not re.match(r'^/en/jobs/' + re.escape(identity) + r'(?:/|$)', path): raise ValueError('Mismatched Amazon posting')
                        description = plain('\n'.join(item.get(key) or '' for key in
                            ('description', 'basic_qualifications', 'preferred_qualifications')))
                        locations = [item.get('location', '')]
                        for raw in item.get('locations') or []:
                            loc = json.loads(raw) if isinstance(raw, str) else raw
                            locations.append(loc.get('location') or loc.get('normalizedLocation', ''))
                        location = '; '.join(dict.fromkeys(filter(None, locations)))
                        stamp = item.get('posted_date')
                        posted = dt.datetime.strptime(stamp, '%B %d, %Y').date().isoformat() if stamp else ''
                        job = tech_job(source, checked_at, identity, title, description, location,
                            'https://www.amazon.jobs' + path, posted, bool(re.search(r'\bremote\b', location, re.I)))
                    jobs.append(job)
                except Exception: status['omitted'] += 1
            offset += len(items)
            if offset >= total: break
        else: status['truncated'] = True
    return jobs


def normalize(item, source, checked_at):
    greenhouse = source['provider'] == 'greenhouse'
    if greenhouse:
        title = item['title']
        location = (item.get('location') or {}).get('name', '')
        description = plain(item.get('content'))
        url = item['absolute_url']
    else:
        title = item['text']
        categories = item.get('categories') or {}
        location = categories.get('location', '')
        if item.get('workplaceType') == 'remote' and 'remote' not in location.lower():
            location += ' · Remote'
        sections = [item.get('description', '')]
        for section in item.get('lists', []):
            sections.extend([section.get('text', ''), section.get('content', '')])
        sections.extend([item.get('additional', ''), item.get('salaryDescription', '')])
        description = plain('\n'.join(sections))
        url = item['hostedUrl']
    if len(description) < 80 or not url.startswith('https://'):
        raise ValueError('Incomplete job description or invalid source URL')
    return {
        'id': source['provider'] + ':' + source['board'] + ':' + str(item['id']),
        'title': title, 'company': source['company'], 'location': location,
        'description': description[:65000], 'url': url,
        'datePosted': item.get('first_published', '') if greenhouse else '',
        # Greenhouse updated_at and Lever createdAt do not prove original publication date.
        'updatedAt': item.get('updated_at', '') if greenhouse else '',
        'checkedAt': checked_at, 'remote': bool(re.search(r'\bremote\b', location, re.I)),
        'source': source['provider'], 'board': source['board'],
        'salary': None if greenhouse else item.get('salaryRange'),
        'employmentType': '' if greenhouse else (item.get('categories') or {}).get('commitment', ''),
    }


def collect_source(source, checked_at, fetch=get_json, fetch_text=get_text):
    board, provider = source['board'], source['provider']
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', board):
        raise ValueError('Invalid configured board')
    status = dict(source, status='ok', checkedAt=checked_at, count=0, omitted=0)
    jobs = []
    try:
        if provider == 'greenhouse':
            base = 'https://boards-api.greenhouse.io/v1/boards/' + board + '/jobs'
            listing = fetch(base)['jobs']
            for item in listing:
                if not INTERNSHIP.search(item['title']):
                    continue
                try:
                    jobs.append(normalize({**item, **fetch(base + '/' + str(int(item['id'])))}, source, checked_at))
                except Exception:
                    status['omitted'] += 1
        elif provider == 'lever':
            listing = fetch('https://api.lever.co/v0/postings/' + board + '?mode=json')
            for item in listing:
                if INTERNSHIP.search(item['text']):
                    try:
                        jobs.append(normalize(item, source, checked_at))
                    except Exception:
                        status['omitted'] += 1
        elif provider in ('workday', 'eightfold'):
            jobs = collect_direct(source, checked_at, fetch, status)
        elif provider in ('google', 'amazon'):
            jobs = collect_tech(source, checked_at, fetch, fetch_text, status)
        else:
            raise ValueError('Unsupported provider')
        status['count'] = len(jobs)
        if status['omitted'] or status.get('truncated'):
            status['status'] = 'partial'
    except Exception as error:
        status.update(status='unavailable', error=type(error).__name__ + (':' + str(error.code) if isinstance(error, urllib.error.HTTPError) else ''))
    return status, jobs


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--discovery-only':
        # Refresh the compact artifact without making any employer API requests.
        output = ROOT / 'data/jobs-discovery.json'
        write_discovery_index(json.loads((ROOT / 'data/jobs.json').read_text(encoding='utf-8')), output)
        return
    sources = json.loads((ROOT / 'scripts/job-sources.json').read_text())
    checked_at = dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z')
    statuses, jobs = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for status, items in pool.map(lambda source: collect_source(source, checked_at), sources):
            statuses.append(status)
            jobs.extend(items)
            print(f"{status['company']}: {status['status']}, {len(items)} internships, {status['omitted']} omitted", flush=True)
    if not any(s['status'] in ('ok', 'partial') for s in statuses):
        # Fail the deployment; the last successfully published index remains intact.
        raise RuntimeError('All feeds unavailable; preserving the last published site')
    unique = {job['url']: job for job in jobs}
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'data/jobs.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    index = {'version': 1, 'checkedAt': checked_at, 'sources': statuses,
        'jobs': sorted(unique.values(), key=lambda job: (job['company'], job['title'], job['id']))}
    output.write_text(json.dumps(index, ensure_ascii=False), encoding='utf-8')
    write_discovery_index(index, output.with_name('jobs-discovery.json'))
    print(f'Wrote {len(unique)} internships to {output}')


if __name__ == '__main__':
    main()
