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

ROOT = Path(__file__).resolve().parents[1]
INTERNSHIP = re.compile(r"\bintern(?:ship)?s?\b|co[ -]?op", re.I)


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


def get_json(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'DucLe-Portfolio-JobIndex/1.0', 'Accept': 'application/json'})
    with urllib.request.urlopen(request, timeout=25) as response:
        data = response.read(20_000_001)
        if len(data) > 20_000_000:
            raise ValueError('Source exceeds size limit')
        return json.loads(data)


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


def collect_source(source, checked_at, fetch=get_json):
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
        else:
            raise ValueError('Unsupported provider')
        status['count'] = len(jobs)
        if status['omitted']:
            status['status'] = 'partial'
    except Exception as error:
        status.update(status='unavailable', error=type(error).__name__)
    return status, jobs


def main():
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
    output.write_text(json.dumps({'version': 1, 'checkedAt': checked_at, 'sources': statuses,
        'jobs': sorted(unique.values(), key=lambda job: (job['company'], job['title'], job['id']))}, ensure_ascii=False), encoding='utf-8')
    print(f'Wrote {len(unique)} internships to {output}')


if __name__ == '__main__':
    main()
