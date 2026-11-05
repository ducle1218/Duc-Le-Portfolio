import {canonical,validateJob,safeUrl} from './job-core.mjs';
export function apiEndpoint(value){
 const url=safeUrl(value);if(!url)return null;
 const parts=url.pathname.split('/').filter(Boolean);
 if(['job-boards.greenhouse.io','boards.greenhouse.io'].includes(url.hostname)&&parts.length===3&&parts[1]==='jobs'&&/^[\w-]+$/.test(parts[0])&&/^\d+$/.test(parts[2]))return {provider:'greenhouse',board:parts[0],url:`https://boards-api.greenhouse.io/v1/boards/${parts[0]}/jobs/${parts[2]}`};
 if(url.hostname==='jobs.lever.co'&&parts.length===2&&/^[\w-]+$/.test(parts[0])&&/^[\w-]+$/.test(parts[1]))return {provider:'lever',board:parts[0],url:`https://api.lever.co/v0/postings/${parts[0]}/${parts[1]}?mode=json`};
 return null;
}
function plain(value){const parsed=new DOMParser().parseFromString(String(value||''),'text/html');let text=parsed.body.textContent||'';if(/&lt;|<\/?(?:p|div|li|br)[ >]/i.test(text))return plain(text);parsed.querySelectorAll('script,style').forEach(n=>n.remove());parsed.querySelectorAll('p,div,li,br,h1,h2,h3,h4').forEach(n=>n.append('\n'));return parsed.body.textContent.replace(/\n\s*\n/g,'\n').trim();}
export async function importJob(value,known){
 const url=canonical(value);if(!url)throw new Error('Enter a public HTTPS job link.');
 const found=known.find(job=>canonical(job.url)===url);if(found)return found;
 const endpoint=apiEndpoint(url);if(!endpoint)throw new Error('This link is not in the employer index. For LinkedIn or other sites, paste the description or a screenshot below.');
 const response=await fetch(endpoint.url,{signal:AbortSignal.timeout(20000),credentials:'omit'});if(!response.ok)throw new Error('The posting is unavailable. It may have closed; paste its description if you still want a draft.');
 const item=await response.json(),gh=endpoint.provider==='greenhouse';
 const description=gh?plain(item.content):plain([item.description,...(item.lists||[]).flatMap(s=>[s.text,s.content]),item.additional].join('\n'));
 const company=gh?(item.company_name||endpoint.board):endpoint.board;
 return {...validateJob({url:gh?item.absolute_url:item.hostedUrl,title:gh?item.title:item.text,company,location:gh?item.location?.name:item.categories?.location,description,datePosted:gh?item.first_published:undefined,remote:item.workplaceType==='remote'}),source:endpoint.provider,checkedAt:new Date().toISOString()};
}
