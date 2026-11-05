import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {selectProjects,projectSlots} from '../resume/generator/project-selection.mjs';
import {composePdf} from '../resume/generator/engine.mjs';
const root=new URL('../resume/generator/assets/',import.meta.url),library=JSON.parse(await readFile(new URL('projects.json',root)));
const feed=JSON.parse(await readFile(new URL('../data/portfolio.json',import.meta.url)));
assert.equal(library.projects.length,12);assert.equal(library.baselineSha256,feed.resume.sha256);
const claims=new Map(feed.projects.flatMap(p=>p.claims.map(c=>[c.id,c])));
for(const project of library.projects)for(const source of project.sources)for(const key of ['text','owner','state'])assert.equal(source[key],claims.get(source.id)[key]);
const electrical=selectProjects(library,'Arduino electronics circuit analog embedded breadboard');assert.equal(electrical[0].id,'box-5');
const structural=selectProjects(library,'civil structural structures load testing AutoCAD');assert.equal(structural[0].id,'box-8');
assert.equal(selectProjects(library,'unrelated hospital nursing')[0].id,'box-11');
const require=createRequire(import.meta.url),{PDFDocument}=require('../resume/generator/pdf-lib.min.js');
await mkdir(new URL('../../tmp/web-resume/',import.meta.url),{recursive:true});
for(const [name,selected] of [['electronics',electrical],['structural',structural]]){
 const bytes=await composePdf(PDFDocument,projectSlots(selected),file=>readFile(new URL(file,root)));
 const pdf=await PDFDocument.load(bytes);assert.equal(pdf.getPageCount(),1);assert.equal(pdf.getPage(0).node.Annots().size(),4);
 await writeFile(new URL('../../tmp/web-resume/'+name+'-selection.pdf',import.meta.url),bytes);
}
console.log('PASS: all 12 projects source-locked; electronics and civil jobs select different projects; one-page PDFs retain four links.');
