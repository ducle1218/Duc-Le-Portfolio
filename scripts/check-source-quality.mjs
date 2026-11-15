import assert from 'node:assert/strict';
import {sourceDetails} from '../resume/generator/job-source.mjs';
import {sortJobs} from '../resume/generator/job-insights.mjs';
for(const url of ['https://jooble.org/rjdp/5259189272434855135','https://us.bebee.com/job/123','https://jobleads.com/job/abc','https://drakesconsultinggr.com/job/1','https://www.linkedin.com.evil.test/jobs/view/123','https://www.indeed.com/rc/clk?jk=abc'])assert(!sourceDetails({url}).allowed,url);
for(const url of ['https://www.linkedin.com/jobs/view/123/','https://www.indeed.com/viewjob?jk=abc123','https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/Intern/123','https://job-boards.greenhouse.io/spacex/jobs/123'])assert(sourceDetails({url}).allowed,url);
const entry=(company,rank,date)=>({job:{company,title:'Intern',datePosted:date},company:{rank},fit:{score:50},fresh:{tier:0}});
const results=sortJobs([entry('Small',null,'2026-11-13'),entry('Large',16,'2026-11-12')],'newest-priority');assert.equal(results[0].job.company,'Large');
assert.equal(sortJobs(results,'newest')[0].job.company,'Small');
console.log('PASS source allowlist, redirect/repost exclusion, same-week company ordering and exact-date ordering.');

assert(sourceDetails({url:'https://lockheedmartin.eightfold.ai/careers?pid=996477737507'}).allowed);
assert(!sourceDetails({url:'https://lockheedmartin.eightfold.ai/careers'}).allowed);
assert(!sourceDetails({url:'https://other.eightfold.ai/careers?pid=123'}).allowed);

const {postingDate}=await import('../resume/generator/job-core.mjs');
const previousTZ=process.env.TZ;process.env.TZ='America/New_York';
assert.equal(postingDate('2026-11-13','en-US'),'11/13/2026');
assert.equal(postingDate('not-a-date','en-US'),'Unknown');
if(previousTZ===undefined)delete process.env.TZ;else process.env.TZ=previousTZ;
console.log('PASS employer calendar dates do not shift to the previous day in New York.');
