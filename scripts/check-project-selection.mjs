import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {searchQueries} from '../resume/generator/cloud.mjs';
import {selectProjects,projectSlots,projectFooterRect} from '../resume/generator/project-selection.mjs';
import {composePdf} from '../resume/generator/engine.mjs';
const root=new URL('../resume/generator/assets/',import.meta.url),library=JSON.parse(await readFile(new URL('projects.json',root)));
const feed=JSON.parse(await readFile(new URL('../data/portfolio.json',import.meta.url)));
assert.deepEqual(searchQueries({include:'mechanical, CAD, robotics, engineering',locations:'New Jersey, New York, Pennsylvania',remote:true}),['engineering internship New Jersey','engineering internship New York','engineering internship Pennsylvania','engineering internship remote United States']);
assert.equal(library.projects.length,12);assert.equal(library.baselineSha256,feed.resume.sha256);
const claims=new Map(feed.projects.flatMap(p=>p.claims.map(c=>[c.id,c])));
for(const project of library.projects)for(const source of project.sources)for(const key of ['text','owner','state'])assert.equal(source[key],claims.get(source.id)[key]);
const electrical=selectProjects(library,'Arduino electronics circuit analog embedded breadboard');assert.equal(electrical[0].id,'box-5');
const structural=selectProjects(library,'civil structural structures load testing AutoCAD');assert.equal(structural[0].id,'box-8');
assert.equal(selectProjects(library,'unrelated hospital nursing')[0].id,'box-11');
// Check the densest possible five-project selection, not just two keyword cases.
const tallest=[...library.projects].sort((a,b)=>b.height-a.height).slice(0,5);
const denseSlots=projectSlots(tallest),footerRect=projectFooterRect(denseSlots);
assert(footerRect[1]<=573 && footerRect[3]<=738,'Every five-project combination must fit above the original page bottom');
for(let i=1;i<denseSlots.length;i++)assert.equal(denseSlots[i].rect[1]-denseSlots[i-1].rect[3],12,'Project spacing must follow content height');
assert(projectSlots(library.projects.filter(p=>p.id==='box-3'))[0].rect[3]-223<57,'Short entries must not retain a full-height empty slot');
const require=createRequire(import.meta.url),{PDFDocument}=require('../resume/generator/pdf-lib.min.js');
await mkdir(new URL('../../tmp/web-resume/',import.meta.url),{recursive:true});
for(const [name,selected] of [['electronics',electrical],['structural',structural]]){
 const bytes=await composePdf(PDFDocument,projectSlots(selected),file=>readFile(new URL(file,root)));
 const pdf=await PDFDocument.load(bytes);assert.equal(pdf.getPageCount(),1);assert.equal(pdf.getPage(0).node.Annots().size(),4);
 await writeFile(new URL('../../tmp/web-resume/'+name+'-selection.pdf',import.meta.url),bytes);
}
console.log('PASS: all 12 projects source-locked; electronics and civil jobs select different projects; one-page PDFs retain four links.');
