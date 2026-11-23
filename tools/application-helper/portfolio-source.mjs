import {preparePortfolio,PORTFOLIO_URL} from './portfolio-answers.mjs';
import bundledKnowledge from './portfolio-snapshot.mjs';
const SIX_HOURS=6*60*60*1000,SEVEN_DAYS=7*24*60*60*1000;
const urls=['data/portfolio.json','data/resume-match-profile.json'].map(p=>PORTFOLIO_URL+p);
let pending;
export const includedPortfolio=()=>({state:'bundled',knowledge:bundledKnowledge,notice:'Using the portfolio included with this helper.'});
async function readJSON(url,fetcher){
 const response=await fetcher(url,{credentials:'omit',redirect:'error',cache:'no-cache',signal:AbortSignal.timeout(8000)});
 if(!response.ok||Number(response.headers.get('content-length'))>2_000_000)throw Error('Portfolio source unavailable.');
 const reader=response.body.getReader();let bytes=0,text='',decoder=new TextDecoder();
 for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>2_000_000){await reader.cancel();throw Error('Portfolio source is too large.');}text+=decoder.decode(value,{stream:true});}
 return JSON.parse(text+decoder.decode());
}
export async function loadPortfolio({force=false,storage=chrome.storage.local,fetcher=fetch,now=Date.now()}={}){
 const cached=(await storage.get('portfolioEvidence')).portfolioEvidence;
 const age=now-Number(cached?.fetchedAt),validCache=age>=0&&age<SEVEN_DAYS&&cached?.knowledge?.format==='duc-portfolio-knowledge-v1'&&Object.hasOwn(cached.knowledge,'careerInterest');
 if(validCache&&!force&&age<SIX_HOURS)return {...cached,state:'ready'};
 if(pending)return pending;
 pending=(async()=>{
  try{
   // Fixed public endpoints only. No employer form, private profile, or key is sent.
   const [feed,resumeResult]=await Promise.all([readJSON(urls[0],fetcher),readJSON(urls[1],fetcher).catch(()=>null)]);
   const result={knowledge:preparePortfolio(feed,resumeResult),fetchedAt:now};await storage.set({portfolioEvidence:result});return {...result,state:'ready'};
  }catch{return validCache?{...cached,state:'cached',notice:'Refresh failed; using the previously checked portfolio.'}:includedPortfolio();}
 })();try{return await pending;}finally{pending=null;}
}
