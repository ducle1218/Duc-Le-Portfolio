import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {selectWording,composePdf} from '../resume/generator/engine.mjs';
const require=createRequire(import.meta.url);
const {PDFDocument}=require('../resume/generator/pdf-lib.min.js');
const root=new URL('../resume/generator/assets/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',root)));
const feed=JSON.parse(await readFile(new URL('../data/portfolio.json',import.meta.url)));
assert.equal(manifest.baselineSha256,feed.resume.sha256);
const claims=new Map(feed.projects.flatMap(p=>p.claims.map(c=>[c.id,c])));
for(const slot of manifest.slots)for(const v of slot.variants)for(const source of v.sources){const claim=claims.get(source.id);for(const k of ['text','owner','state'])assert.equal(claim[k],source[k]);}
const none=selectWording(manifest,'Nursing license and hospital experience');
assert(none.every(s=>!s.choice));
assert(selectWording(manifest,'SolidWorks CAD assembly').filter(s=>s.choice).length>=3);
assert(selectWording(manifest,'finite element analysis').some(s=>s.choice));
assert(selectWording(manifest,'cascade').every(s=>!s.choice));
const cache=new Map();
const bytes=async file=>{if(!cache.has(file))cache.set(file,await readFile(new URL(file,root)));return cache.get(file);};
const selected=selectWording(manifest,'Mechanical engineering internship using SolidWorks CAD, assembly, collaborative design, documentation, Excel and structural analysis.');
for(const selection of [none,selected]){const data=await composePdf(PDFDocument,selection,bytes);const pdf=await PDFDocument.load(data);assert.equal(pdf.getPageCount(),1);assert.equal(pdf.getPages()[0].node.Annots().size(),4);}
const folder=new URL('../../tmp/web-resume/',import.meta.url);await mkdir(folder,{recursive:true});
await writeFile(new URL('browser-test.pdf',folder),await composePdf(PDFDocument,selected,bytes));
await writeFile(new URL('browser-test-selection.json',folder),JSON.stringify(selected));
await writeFile(new URL('browser-original.pdf',folder),await composePdf(PDFDocument,none,bytes));
console.log('PASS: sourced wording, aliases, unmatched input, 1-page PDF, and 4 hyperlinks.');
