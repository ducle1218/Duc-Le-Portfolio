import {scanCredential} from './account-vault.mjs';
import {employerAccountForm} from './account-form.mjs';

function accountScope(url,employer){
 const parts=url.pathname.split('/').filter(Boolean);
 if(/\.(?:myworkdayjobs\.com|eightfold\.ai|icims\.com)$/.test(url.hostname))return url.hostname;
 if(url.hostname.endsWith('.taleo.net')&&parts[0]==='careersection'&&parts[1])return 'careersection/'+parts[1];
 if(url.hostname.endsWith('.myworkdaysite.com')&&parts[0]==='recruiting'&&parts[1])return 'recruiting/'+parts[1];
 if(/^(?:jobs\.lever\.co|jobs\.ashbyhq\.com|job-boards\.greenhouse\.io)$/.test(url.hostname)&&parts[0])return 'tenant/'+parts[0];
 return employer.toLowerCase();
}

export function setupAccounts(getEmail,getEmployer){
 const el=id=>document.getElementById(id);
 const panel=el('employer-account'),status=el('account-status'),create=el('account-create'),login=el('account-login');
 panel.ontoggle=async()=>{
  if(!panel.open)return;
  try{
   const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
   const url=new URL(tab.url);
   el('account-site').textContent=url.origin;
   if(!el('account-email').value)el('account-email').value=getEmail()||'';
   if(!el('account-employer').value)el('account-employer').value=getEmployer()||url.hostname;
  }catch{status.textContent='Open the employer website first.';}
 };
 async function useAccount(tab,signup,automatic,afterEmail=false,embeddedDocument=''){
  const url=new URL(tab.url);
  if(url.protocol!=='https:')return null;
  const email=(el('account-email').value||getEmail()||'').trim();
  const employer=(el('account-employer').value||getEmployer()||url.hostname).trim();
  const base={url:url.href,signup,email,automatic,afterEmail,embedded:!!embeddedDocument};
  const [scan]=await chrome.scripting.executeScript({target:{tabId:tab.id,...(embeddedDocument?{documentIds:[embeddedDocument]}:{})},func:employerAccountForm,args:[{...base,inspectOnly:true}]});
  if(scan?.result?.error)throw Error(scan.result.error);
  if(!scan?.result||scan.result.available===false)return null;
  if(!scan.documentId||!email||!employer)throw Error('Check the email and employer in Employer account before scanning.');
  if(scan.result.filledLogin){
   const [sent]=await chrome.scripting.executeScript({target:{tabId:tab.id,documentIds:[scan.documentId]},func:employerAccountForm,args:[{...base,useFilledLogin:true}]});
   return typeof sent?.result==='string'?sent.result:'Review the saved login on the sign-in form.';
  }
  if(scan.result.emailStep){
   const [advanced]=await chrome.scripting.executeScript({target:{tabId:tab.id,documentIds:[scan.documentId]},func:employerAccountForm,args:[base]});
   if(advanced?.result?.error)throw Error(advanced.result.error);
   if(!advanced?.result?.emailStep)return 'Check the employer email step.';
   for(let attempt=0;attempt<15;attempt++){
    await new Promise(resolve=>setTimeout(resolve,400));
    const [current]=await chrome.tabs.query({active:true,currentWindow:true});
    if(current?.id!==tab.id||!current.url||new URL(current.url).origin!==url.origin)break;
    if(current.status==='loading')continue;
    const next=await useAccount(current,undefined,true,true);
    if(next)return next;
   }
   return 'Email entered. Complete any verification or social sign-in shown by the employer.';
  }
  const registration=automatic?scan.result.signup:signup;
  let password;
  try{
   password=await navigator.locks.request('employer-vault-write',()=>scanCredential(chrome.storage.local,{
    origin:url.origin,scope:accountScope(url,employer),employer,email,phrase:el('account-passphrase').value,
    signup:registration,min:scan.result.min,max:scan.result.max,alphanumeric:scan.result.alphanumeric
   }));
  }catch(error){
   if(error.code==='NO_SAVED_ACCOUNT'&&automatic&&!registration&&signup===undefined&&!afterEmail){
    const saved=(await chrome.storage.local.get('employerSites')).employerSites||[];
    if(saved.some(row=>row.origin===url.origin&&row.email===email.toLowerCase()&&row.scope===accountScope(url,employer)))return 'This profile lists an existing account here. Sign in with its saved password.';
    const [opened]=await chrome.scripting.executeScript({target:{tabId:tab.id,documentIds:[scan.documentId]},func:employerAccountForm,args:[{...base,openRegistration:true}]});
    if(opened?.result?.opened){
     for(let i=0;i<15;i++){
      await new Promise(r=>setTimeout(r,350));
      const [current]=await chrome.tabs.query({active:true,currentWindow:true});
      if(current?.id!==tab.id||!current.url||new URL(current.url).origin!==url.origin)break;
      if(current.status==='loading')continue;
      const next=await useAccount(current,true,true);
      if(next)return next;
     }
     return 'Opened registration. Complete the next step on the employer website.';
    }
   }
   if(error.code==='LEGACY_VAULT'){panel.open=true;el('legacy-unlock').hidden=false;el('account-passphrase').focus();}
   throw error;
  }finally{el('account-passphrase').value='';}
  el('legacy-unlock').hidden=true;
  const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id,documentIds:[scan.documentId]},func:employerAccountForm,args:[{...base,signup:registration,password}]});
  if(result?.result?.error)throw Error(result.result.error);
  return result?.result||'The account form changed. Check the website for the next step.';
 }
 async function manual(signup){
  create.disabled=login.disabled=true;
  try{
   const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
   status.textContent=await useAccount(tab,signup,false)||'Open an HTTPS employer account form.';
  }catch(error){status.textContent=error.message;}
  finally{create.disabled=login.disabled=false;}
 }
 create.onclick=()=>manual(true);login.onclick=()=>manual(false);
 return (tab,embeddedDocument)=>embeddedDocument?useAccount(tab,true,false,false,embeddedDocument):useAccount(tab,undefined,true);
}
