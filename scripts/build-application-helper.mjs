import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {makeZip} from '../resume/generator/zip.mjs';
const root=new URL('../tools/application-helper/',import.meta.url);
for(const file of ['application-core.mjs','application-autofill.mjs'])await copyFile(new URL('../resume/generator/'+file,import.meta.url),new URL(file,root));
const names=['manifest.json','popup.html','popup.css','popup.mjs','application-core.mjs','application-autofill.mjs','README.md'];
const files=await Promise.all(names.map(async name=>({name,data:await readFile(new URL(name,root))})));
const output=new URL('../resume/generator/downloads/',import.meta.url);await mkdir(output,{recursive:true});await writeFile(new URL('Application-Helper.zip',output),makeZip(files));
console.log('Application Helper ZIP prepared, with no profile data or credentials.');
