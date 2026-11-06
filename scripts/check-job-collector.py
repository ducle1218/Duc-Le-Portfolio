import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location('collector', Path(__file__).with_name('collect-jobs.py'))
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)
source = {'provider': 'greenhouse', 'board': 'example', 'company': 'Example'}
job = {'id': 1, 'title': 'Mechanical Engineer Intern', 'absolute_url': 'https://example.com/jobs/1',
       'location': {'name': 'Newark, NJ'}, 'content': '&lt;p&gt;Design &amp; test mechanisms with CAD. Build prototypes and review engineering drawings with the team.&lt;/p&gt;',
       'updated_at': '2026-11-01T10:00:00Z'}
normalized = collector.normalize(job, source, 'checked')
assert 'Design & test' in normalized['description']
assert '<p>' not in normalized['description']
assert normalized['datePosted'] == ''  # An update date is not a posting date.
assert normalized['updatedAt'] == job['updated_at']
assert collector.normalize(dict(job, first_published='2026-10-01T10:00:00Z'), source, 'checked')['datePosted'] == '2026-10-01T10:00:00Z'
assert collector.plain('<script>bad()</script><p>Good</p>') == 'Good'
status, jobs = collector.collect_source(source, 'checked', lambda url: job if url.endswith('/1') else {'jobs': [job, dict(job, id=2, title='Director')]})
assert status['status'] == 'ok' and len(jobs) == 1
def broken(url):
    raise TimeoutError('offline')
status, jobs = collector.collect_source(source, 'checked', broken)
assert status['status'] == 'unavailable' and not jobs
def partial(url):
    if url.endswith('/1'):
        raise TimeoutError('offline')
    return {'jobs': [job]}
status, jobs = collector.collect_source(source, 'checked', partial)
assert status['status'] == 'partial' and status['omitted'] == 1 and not jobs
lever = {'id': 'abc', 'text': 'Engineering Intern', 'categories': {'location': 'United States'},
         'workplaceType': 'remote', 'hostedUrl': 'https://jobs.lever.co/example/abc',
         'description': '<p>Design and test engineering prototypes. Work on manufacturing processes and technical documentation.</p>',
         'createdAt': 1234, 'lists': [{'text': 'Requirements', 'content': '<li>CAD</li>'}]}
normalized = collector.normalize(lever, dict(source, provider='lever'), 'checked')
assert normalized['remote'] and normalized['datePosted'] == '' and 'Requirements' in normalized['description']
candidate = dict(normalized, title='Mechanical Engineering Intern', location='Newark, NJ', remote=False)
for location in ('Newark, NJ', 'Philadelphia, Pennsylvania', 'Pittsburgh, PA', 'Buffalo, New York', 'Remote — United States'):
    assert collector.discovery_candidate(dict(candidate, location=location)), location
assert collector.discovery_candidate(dict(candidate, location='United States', remote=True))
for location in ('Austin, TX', 'Remote', 'Remote — Canada', ''):
    assert not collector.discovery_candidate(dict(candidate, location=location)), location
for title in ('Mechanical Engineer', 'Senior Mechanical Engineering Intern', 'Engineering Intern Manager', 'Marketing Intern'):
    assert not collector.discovery_candidate(dict(candidate, title=title)), title
index = {'version': 1, 'checkedAt': 'original-check', 'sources': [source], 'jobs': [candidate, dict(candidate, location='Austin, TX')]}
compact = collector.discovery_index(index)
assert compact['checkedAt'] == index['checkedAt'] and compact['sources'] == index['sources']
assert compact['jobs'] == [candidate] and compact['jobs'][0]['description'] == candidate['description']
assert compact['completeForClosureChecks'] is False
# Guard parity with the JavaScript defaults against real current feed records.
from subprocess import check_output
import shutil
node = shutil.which('node')
if node:
    root = Path(__file__).resolve().parents[1]
    current = json.loads((root / 'data/jobs.json').read_text(encoding='utf-8'))
    code = "import{readFileSync}from'node:fs';import{DEFAULTS,filterJob}from'./resume/generator/job-core.mjs';let i=JSON.parse(readFileSync('data/jobs.json'));console.log(JSON.stringify(i.jobs.filter(j=>filterJob(j,DEFAULTS).status==='ready').map(j=>j.url).sort()));"
    expected = json.loads(check_output([node, '--input-type=module', '-e', code], cwd=root, text=True, encoding='utf-8'))
    assert sorted(job['url'] for job in collector.discovery_index(current)['jobs']) == expected
print('PASS: employer normalization, HTML decoding, internship scope, publication-date honesty, and source failure isolation.')
print('PASS: compact regional discovery, uncertain-location exclusion, full descriptions, and filtered-index closure protection.')
