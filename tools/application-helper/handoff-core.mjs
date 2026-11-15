import {cleanProfile} from './application-core.mjs';
import {validateResumeAttachment} from './resume-attachment.mjs';
export const STUDIO_ORIGIN='https://ducle1218.github.io';
export function studioURL(value){try{const u=new URL(value);return u.origin===STUDIO_ORIGIN&&/^\/Duc-Le-Portfolio\/(applications|generator|resume\/generator)\/(index\.html)?$/.test(u.pathname);}catch{return false;}}
export function employerURL(value){try{const u=new URL(value);const host=u.hostname.toLowerCase();return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&host.includes('.')&&!/^\d+(\.\d+){3}$/.test(host)&&!host.includes(':')&&!/(^|\.)(localhost|local|internal|test|invalid)$/.test(host)&&host!=='ducle1218.github.io'?u.href:null;}catch{return null;}}
export function prepareHandoff(input){
 const url=employerURL(input?.job?.url);if(!url)throw new Error('Choose a public HTTPS employer application link.');
 const title=String(input.job.title||'').trim().slice(0,220),company=String(input.job.company||'').trim().slice(0,160);if(!title||!company)throw new Error('Job details are missing.');
 return {job:{url,title,company},profile:cleanProfile(input.profile),...(input.resume?{resume:validateResumeAttachment(input.resume,url),autoResume:input.autoResume===true}:{}),origin:new URL(url).origin,createdAt:Date.now(),expiresAt:Date.now()+30*60*1000};
}
export const originPattern=url=>new URL(url).origin+'/*';
