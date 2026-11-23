import {accountCredential} from './account-vault.mjs';
import {employerAccountForm} from './account-form.mjs';

export function setupAccounts(getEmail,getEmployer){
 const el=id=>document.getElementById(id);
 const panel=el('employer-account'),status=el('account-status'),create=el('account-create'),login=el('account-login');
 let destination='';
 panel.ontoggle=async()=>{
  if(!panel.open)return;
  try{
   const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
   destination=new URL(tab.url).origin;
   el('account-site').textContent=destination;
   if(!el('account-email').value)el('account-email').value=getEmail()||'';
   if(!el('account-employer').value)el('account-employer').value=getEmployer()||new URL(tab.url).hostname;
   el('account-setup').hidden=!!(await chrome.storage.local.get('employer-vault-v1'))['employer-vault-v1'];
  }catch{status.textContent='Open the employer website first.';}
 };
 async function useAccount(signup){
  create.disabled=login.disabled=true;
  try{
   const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
   const url=new URL(tab.url);
   if(url.protocol!=='https:'||url.origin!==destination)throw Error('Reopen the helper on the intended HTTPS employer website.');
   const email=el('account-email').value.trim(),employer=el('account-employer').value.trim(),phrase=el('account-passphrase').value;
   if(!email||!el('account-email').checkValidity()||!employer||!phrase)throw Error('Enter the employer name, email and vault passphrase.');
   const target={tabId:tab.id},base={url:url.href,signup,email};
   const [scan]=await chrome.scripting.executeScript({target,func:employerAccountForm,args:[{...base,inspectOnly:true,password:el('account-password').value}]});
   if(scan?.result?.error)throw Error(scan.result.error);
   if(!scan?.documentId||!scan?.result)throw Error('Could not identify the account form on this page.');
   const password=await navigator.locks.request('employer-vault-write',()=>accountCredential(chrome.storage.local,{
    origin:url.origin,employer,email,phrase,repeat:el('account-confirm').value,sitePassword:el('account-password').value,signup
   }));
   el('account-setup').hidden=true;
   const [result]=await chrome.scripting.executeScript({target:{...target,documentIds:[scan.documentId]},func:employerAccountForm,args:[{...base,password}]});
   if(result?.result?.error)throw Error(result.result.error);
   status.textContent=result?.result||'Check the employer website for the result.';
  }catch(error){status.textContent=error.message||'Could not complete the account action.';}
  finally{
   for(const id of ['account-passphrase','account-password','account-confirm'])el(id).value='';
   create.disabled=login.disabled=false;
  }
 }
 create.onclick=()=>useAccount(true);login.onclick=()=>useAccount(false);
}
