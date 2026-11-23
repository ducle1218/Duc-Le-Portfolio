import {scanCredential} from './account-vault.mjs';
import {employerAccountForm} from './account-form.mjs';

function accountScope(url,employer){
 const parts=url.pathname.split('/').filter(Boolean);
 if(/\.(?:myworkdayjobs\.com|eightfold\.ai|icims\.com)$/.test(url.hostname))return url.hostname;
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
 async function useAccount(tab,signup,automatic){
  const url=new URL(tab.url);
  if(url.protocol!=='https:')return null;
  const email=(el('account-email').value||getEmail()||'').trim();
  const employer=(el('account-employer').value||getEmployer()||url.hostname).trim();
  const base={url:url.href,signup,email,automatic};
  const [scan]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:employerAccountForm,args:[{...base,inspectOnly:true}]});
  if(scan?.result?.error)throw Error(scan.result.error);
  if(!scan?.result)return null;
  if(!scan.documentId||!email||!employer)throw Error('Check the email and employer in Employer account before scanning.');
  const registration=automatic?scan.result.signup:signup;
  let password;
  try{
   password=await navigator.locks.request('employer-vault-write',()=>scanCredential(chrome.storage.local,{
    origin:url.origin,scope:accountScope(url,employer),employer,email,phrase:el('account-passphrase').value,
    signup:registration,min:scan.result.min,max:scan.result.max
   }));
  }finally{el('account-passphrase').value='';}
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
 return tab=>useAccount(tab,undefined,true);
}
