import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {root,loadRecords,lockFor,checkLock,writeArtifacts,json} from './portfolio-data.mjs';

export async function buildPortfolioData({reviewSources=false}={}){
  const records=await loadRecords();
  const lockPath=new URL('src/content/evidence-lock.json',root);
  if(reviewSources)await writeFile(lockPath,json(lockFor(records)));
  else checkLock(records,JSON.parse(await readFile(lockPath,'utf8')));
  const outputs=await writeArtifacts(records);
  return {records,outputs};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const {records}=await buildPortfolioData({reviewSources:process.argv.includes('--review-sources')});
  console.log('Portfolio data: '+records.facts.projects.length+' projects; '+records.facts.projects.reduce((n,p)=>n+p.claims.length,0)+' sourced claims.');
}
