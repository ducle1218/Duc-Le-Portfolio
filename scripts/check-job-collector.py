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

# Workday pagination retains the first total even when later pages report zero.
wd = {'provider':'workday','board':'External','tenant':'intel','company':'Intel','careersUrl':'https://intel.wd1.myworkdayjobs.com/External'}
def wd_detail(i):
    return {'title':'Mechanical Engineering Intern', 'jobDescription':job['content'], 'location':'Newark, NJ',
        'additionalLocations':['New York, NY'], 'country':{'descriptor':'United States'}, 'jobReqId':'JR'+str(i),
        'startDate':'2026-11-13','externalUrl':wd['careersUrl']+'/job/Test/Intern_JR'+str(i), 'canApply':True,'posted':True}
def wd_fetch(url, body=None):
    if body is None: return {'jobPostingInfo':wd_detail(int(url.rsplit('JR',1)[1]))}
    if not body['appliedFacets']: return {'facets':[{'facetParameter':'workerSubType','values':[{'id':'intern','descriptor':'Intern (Fixed Term)'}]}]}
    offset=body['offset']
    return {'total':41 if offset==0 else 0,'jobPostings':[{'title':'Mechanical Engineering Intern','externalPath':'/job/Test/Intern_JR'+str(i)} for i in range(offset,min(offset+20,41))]}
status, jobs=collector.collect_source(wd,'2026-11-14T12:00:00Z',wd_fetch)
assert status['status']=='ok' and len(jobs)==41
assert jobs[-1]['datePosted']=='2026-11-13' and 'New York, NY' in jobs[-1]['location']
assert collector.direct_job(dict(wd_detail(1),canApply=False),wd,'checked')['closed']
assert collector.direct_job(dict(wd_detail(1),canApply=None),wd,'checked')['availability']=='unknown'
try: collector.direct_job(dict(wd_detail(1),externalUrl='https://evil.example/job/1'),wd,'checked'); raise AssertionError('off-domain accepted')
except ValueError: pass
lm={'provider':'eightfold','board':'lockheedmartin','company':'Lockheed Martin','careersUrl':'https://lockheedmartin.eightfold.ai/careers'}
lm_item={'id':123,'name':'Engineering Intern','jobDescription':job['content'],'standardizedLocations':['Moorestown, NJ, US'],'postedTs':1794601470,'positionUserActions':{'applyAction':{'status':'allowed'}}}
def lm_fetch(url, body=None):
    if 'position_details' in url: return {'data':lm_item}
    return {'data':{'count':2,'positions':[lm_item,dict(lm_item,id=456,name='Materials Engineer - E2')]}}
status,jobs=collector.collect_source(lm,'checked',lm_fetch)
assert status['status']=='ok' and len(jobs)==1 and jobs[0]['url'].endswith('?pid=123')
assert jobs[0]['availability']=='active' and collector.discovery_candidate(jobs[0])
assert jobs[0]['datePosted'].startswith('2026-11-13')
print('PASS: direct employer pagination, detail identity, original dates, multiple locations, closed roles and internship-only titles.')

# Public Google pages contain full JSON data, not executable code for us to run.
google={'provider':'google','board':'google','company':'Google','careersUrl':'https://www.google.com/about/careers/applications/jobs/results/'}
record=['123','Mechanical Engineering Intern',None,[None,job['content']],[None,'Required: mechanical engineering.'],None,None,'Google',None,[['Seattle, WA, USA'],['New York, NY, USA']],[None,'Overview.'],None,[123],None,None,[None,'Apply early.']]
page="<script>AF_initDataCallback({key: 'ds:1', data:"+json.dumps([[record],None,1,20])+", sideChannel: {}});</script><a href=\"jobs/results/123-mechanical-intern?q=intern\">Details</a>"
status,jobs=collector.collect_source(google,'checked',fetch_text=lambda url:page)
assert status['status']=='ok' and len(jobs)==1
assert jobs[0]['datePosted']=='' and jobs[0]['location'].startswith('New York')
assert 'Required:' in jobs[0]['description'] and jobs[0]['url']==google['careersUrl']+'123-mechanical-intern'
try: collector.google_listing('<html>Verify you are human</html>'); raise AssertionError('Blocked page accepted')
except ValueError: pass
amazon={'provider':'amazon','board':'amazon','company':'Amazon','careersUrl':'https://www.amazon.jobs/en/search'}
amazon_item={'id_icims':'55','title':'Robotics Engineering Intern','job_path':'/en/jobs/55/robotics-intern',
 'description':job['content'],'basic_qualifications':'CAD required','preferred_qualifications':'Python preferred',
 'location':'US, NJ, Newark','posted_date':'November 14, 2026','locations':[]}
def amazon_fetch(url):
 from urllib.parse import parse_qs,urlparse
 offset=int(parse_qs(urlparse(url).query)['offset'][0])
 return {'hits':2,'jobs':[dict(amazon_item,id_icims=str(55+offset),job_path='/en/jobs/'+str(55+offset)+'/intern')]}
status,jobs=collector.collect_source(amazon,'checked',amazon_fetch)
assert status['status']=='ok' and len(jobs)==2 and jobs[0]['datePosted']=='2026-11-14'
assert 'CAD required' in jobs[0]['description'] and 'Python preferred' in jobs[0]['description']
bad=dict(amazon_item,job_path='https://evil.test/55')
status,jobs=collector.collect_source(amazon,'checked',lambda url:{'hits':1,'jobs':[bad]})
assert status['status']=='partial' and not jobs
ms=dict(lm,board='microsoft',company='Microsoft',domain='microsoft.com',careersUrl='https://apply.careers.microsoft.com/careers')
def ms_fetch(url,body=None):
 assert url.startswith('https://apply.careers.microsoft.com/api/pcsx/') and 'domain=microsoft.com' in url
 return lm_fetch(url,body)
status,jobs=collector.collect_source(ms,'checked',ms_fetch)
assert status['status']=='ok' and jobs[0]['url']=='https://apply.careers.microsoft.com/careers?pid=123'
print('PASS: Google embedded JSON, full descriptions, honest unknown dates, Amazon pagination and original dates, off-domain rejection, Microsoft identity.')
