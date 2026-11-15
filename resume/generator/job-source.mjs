// Source identity is not proof that an employer or vacancy is genuine.
const within=(host,domain)=>host===domain||host.endsWith('.'+domain);
export function sourceDetails(job){
 let u;try{u=new URL(job.url);}catch{return {allowed:false,label:'Invalid link'};}
 const host=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||u.username||u.password||u.port)return {allowed:false,label:'Invalid link'};
 if(['bebee.com','jobleads.com','jooble.org','drakesconsultinggr.com'].some(d=>within(host,d))||/drakesconsultinggr/i.test(host))return {allowed:false,label:'Unverified repost / redirect'};
 if(host==='lockheedmartin.eightfold.ai')return {allowed:u.pathname==='/careers'&&/^\d+$/.test(u.searchParams.get('pid')||'')||/^\/careers\/job\/\d+\/?$/.test(u.pathname),board:false,label:'Employer careers',host};
 if(within(host,'linkedin.com'))return {allowed:/^\/jobs\/view\/(?:[^/]*-)?\d+\/?$/.test(u.pathname),board:true,label:'LinkedIn'};
 if(within(host,'indeed.com'))return {allowed:u.pathname==='/viewjob'&&/^[a-f0-9]+$/i.test(u.searchParams.get('jk')||''),board:true,label:'Indeed'};
 if(['greenhouse.io','lever.co','myworkdayjobs.com','smartrecruiters.com','ashbyhq.com','careers.google.com','www.google.com','nvidia.com','lockheedmartinjobs.com'].some(d=>within(host,d)))return {allowed:true,board:false,label:'Employer careers',host};
 return {allowed:false,label:'Source not reviewed',host};
}
export const DEFAULT_PRIORITIES='Google, NVIDIA, Lockheed Martin, SpaceX';
