import {fillWithFollowups} from './fill-sequence.mjs';
import {setupAccounts} from './account-panel.mjs';
import {addPortfolioEvidence} from './portfolio-ui.mjs';
import {applicationSeason} from './answer-rules.mjs';
import {cleanProfile,employerSites} from './application-core.mjs';
import {suggestField,formBridge} from './application-autofill.mjs';
import {employerAccountForm} from './account-form.mjs';
import {attachResume} from './resume-attachment.mjs';
import {reviewAnswers} from './memory-panel.mjs';
const $=id=>document.getElementById(id);let profile=null,review=null,employerContext='',activeApplicationTab=null;
const scanAccount=setupAccounts(()=>profile?.values.email,()=>employerContext);
$('prepare-resume').onclick=async()=>{try{const tab=activeApplicationTab;if(!tab?.id||!/^https:\/\//.test(tab.url||''))throw new Error('Open the employer application first.');const origin=new URL(tab.url).origin+'/*';if(!await chrome.permissions.request({origins:[origin]}))throw new Error('Access was not granted. You can still attach a PDF manually.');const result=await chrome.runtime.sendMessage({type:'link-current-application',tabId:tab.id});if(!result.ok)throw new Error(result.error);await chrome.tabs.create({url:result.url});}catch(error){say(error.message);}};
const say=text=>{$('status').textContent=text;};
let portfolioState=null;
async function readPortfolio(force=false){
 try{const response=await chrome.runtime.sendMessage({type:'portfolio-read',force});portfolioState=response?.portfolio||null;}catch{portfolioState=null;}
 const p=portfolioState;
 $('portfolio-status').textContent=p?.knowledge?(p.knowledge.projects.length+' projects · '+(p.state==='cached'?'cached copy':p.state==='bundled'?'included in helper':'checked '+new Date(p.fetchedAt).toLocaleDateString())+' · source review '+p.knowledge.reviewedOn):(p?.notice||'Portfolio unavailable; saved answers still work.');
 return p?.knowledge||null;
}
$('refresh-portfolio').onclick=async()=>{$('refresh-portfolio').disabled=true;await readPortfolio(true);$('refresh-portfolio').disabled=false;reset();say('Portfolio checked. Scan again to review new suggestions.');};
readPortfolio();
async function savedAnswers(){const result=await chrome.runtime.sendMessage({type:'memory-list'});if(!result.ok)throw new Error(result.error);return result.items;}
$('remember').onclick=async()=>{try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id||!/^https:\/\//.test(tab.url||''))throw new Error('Open an HTTPS employer application first.');const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:formBridge,args:[{action:'remember'}]});reset();const area=$('memory-review');area.hidden=false;reviewAnswers(area,{...result,profile,memory:await savedAnswers(),context:employerContext||'page:'+new URL(result.url).origin+new URL(result.url).pathname,onSave:async items=>{const saved=await chrome.runtime.sendMessage({type:'memory-save',items});if(!saved.ok)throw new Error(saved.error);area.hidden=true;say(items.length+' answers saved for next time.');showMemoryCount();},onCancel:()=>{area.hidden=true;}});}catch(error){say(error.message);}};
function reset(){$('allow-chat').hidden=true;review=null;$('suggestions').replaceChildren();$('fill').hidden=true;}
function showProfile(){reset();if(profile)$('profile-status').textContent=profile.answers.length+' profile answers on this device';$('scan').disabled=!profile;$('connect-card').hidden=!!profile;$('saved-profile').hidden=!profile;$('forget').hidden=!profile;$('profile-name').textContent=profile?[profile.values.firstName,profile.values.lastName].filter(Boolean).join(' '):'';$('profile-initials').textContent=profile?((profile.values.firstName[0]||'')+(profile.values.lastName[0]||'')):'';$('settings-label').textContent=profile?'Profile settings':'Use a profile file instead';$('profile-settings').open=false;}
$('version').textContent=chrome.runtime.getManifest().version;
$('import-trigger').onclick=()=>$('profile-file').click();
async function showMemoryCount(){try{const items=await savedAnswers();$('memory-count').textContent=items.length+' saved · view & edit ↗';}catch{$('memory-count').textContent='View & edit ↗';}}
showMemoryCount();
try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});activeApplicationTab=tab;const handoff=tab?.id?await chrome.runtime.sendMessage({type:'get-handoff',tabId:tab.id}):null;const saved=handoff?.entry?.profile||(await chrome.storage.local.get('profile')).profile;if(saved){profile=cleanProfile(saved);say('Ready. Open an employer form, then scan.');}if(handoff?.entry?.resume)$('resume-status').textContent='Connected PDF: '+handoff.entry.resume.name+(handoff.entry.autoResume?' · attaches when a supported upload appears.':' · choose it when filling.');if(handoff?.entry)employerContext=handoff.entry.job.company.trim().toLowerCase();if(handoff?.entry)say('Connected to '+handoff.entry.job.company+'. Scan this form to review answers from Application Studio.');}catch{say('Saved profile is invalid. Start again from Application Studio or import a fresh copy.');}showProfile();
$('profile-file').onchange=async()=>{try{const file=$('profile-file').files[0];if(!file||file.size>1400000)throw new Error('Choose an Application Studio profile JSON under 1.4 MB.');const data=JSON.parse(await file.text());if(data.manifest_version)throw new Error('That is the extension manifest. Choose Duc_Application_Profile.json, exported from your saved profile in Studio.');if(data.format!=='duc-application-profile-v1')throw new Error('Choose Duc_Application_Profile.json from Studio’s Export profile button. Or connect through Studio without a file.');profile=cleanProfile(data.profile);const savedSites=(await chrome.storage.local.get('employerSites')).employerSites;await chrome.storage.local.set({employerSites:employerSites(savedSites,data.employerAccounts),profile,studioProfile:{...profile,confirmedAt:data.profile.confirmedAt||profile.confirmedAt}});showProfile();say('Profile saved. It will still be here after restarting your computer.');}catch(error){say(error.message);}finally{$('profile-file').value='';}};
$('forget').onclick=async()=>{await chrome.storage.local.remove('profile');await chrome.storage.local.remove('studioProfile');profile=null;showProfile();say('Profile removed from this browser. Your saved answers and online profile are unchanged.');};
async function scanDocument(tab){
 const target={tabId:tab.id};
 const [main]=await chrome.scripting.executeScript({target,func:formBridge,args:[{action:'scan'}]});
 const visibleFields=fields=>fields.some(f=>f.label&&!f.disabled&&!f.filled&&['text','email','tel','month','number','select-one','combobox','radio-group','textarea','skill-list','language-list'].includes(f.type));
 if(main.result.applicationFrames?.length&&!visibleFields(main.result.fields)){
  const frames=await chrome.scripting.executeScript({target:{...target,allFrames:true},func:formBridge,args:[{action:'scan-frame',origins:main.result.applicationFrames}]}).catch(()=>[]);
  const matches=frames.filter(f=>f.frameId!==0&&f.documentId&&f.result&&!f.result.hasPasswordField&&visibleFields(f.result.fields));
  if(matches.length===1)return {...matches[0],applicationFrame:true};
 }
 const origins=[...new Set(main.result.chatFrames||[])];
 if(!origins.length||main.result.fields.some(f=>f.type==='chat-reply'&&f.label))return main;
 const pageOrigin=new URL(tab.url).origin,allowed=[];
 for(const origin of origins){
  if(origin===pageOrigin||await chrome.permissions.contains({origins:[origin+'/*']})){allowed.push(origin);continue;}
  if(origins.length===1){
   const button=$('allow-chat');button.hidden=false;button.textContent='Enable chat on '+new URL(origin).hostname;
   button.onclick=async()=>{
    if(await chrome.permissions.request({origins:[origin+'/*']}))await $('scan').onclick();
   };
  }
 }
 if(!allowed.length)return main;
 const frames=await chrome.scripting.executeScript({target:{...target,allFrames:true},func:formBridge,args:[{action:'scan-chat',origins:allowed}]}).catch(()=>[]);
 const chats=frames.filter(f=>f.frameId!==0&&f.documentId&&f.result?.fields?.some(field=>field.label));
 return chats.length===1?{...chats[0],chatOnly:true}:main;
}
let continuing=false,remainingSteps=0;
async function verifyEmployerEmail(tab,email){
 const origin=new URL(tab.url).origin, host=new URL(tab.url).hostname;
 if(!/^[\w.+-]+@[\w.-]+$/.test(email))return false;
 const query='to:'+email+' after:'+Math.floor(Date.now()/1000-1800)+' {subject:verify subject:verification subject:activate} "'+host+'"';
 const mailbox=await chrome.tabs.create({active:false,url:'https://mail.google.com/mail/u/4/#search/'+encodeURIComponent(query)});
 let opened=false;
 try{
  for(let i=0;i<35;i++){
   await new Promise(r=>setTimeout(r,900));
   const [probe]=await chrome.scripting.executeScript({target:{tabId:mailbox.id},func:(expected,opened)=>{
    if(location.origin!=='https://mail.google.com'||!location.pathname.startsWith('/mail/u/4/'))return null;
    if(!opened){
     const rows=[...document.querySelectorAll('tr.zA')].filter(n=>n.getClientRects().length);
     if(rows.length!==1)return null;
     rows[0].click();return {opened:true};
    }
    const bodies=[...document.querySelectorAll('.a3s')].filter(n=>n.getClientRects().length);
    if(bodies.length!==1)return null;
    const links=[...bodies[0].querySelectorAll('a[href]')].map(a=>a.href).filter(h=>{try{const u=new URL(h);return u.origin===expected&&!u.username&&!u.password&&/(?:verify|verification|activate)/i.test(u.pathname+u.search)&&!/reset|recover|change.?email|redirect|returnurl/i.test(h);}catch{return false;}});
    const unique=[...new Set(links)];return unique.length===1?{link:unique[0]}:null;
   },args:[origin,opened]}).catch(()=>[]);
   if(probe?.result?.opened)opened=true;
   if(probe?.result?.link){
    const confirmation=await chrome.tabs.create({url:probe.result.link,active:false});
    for(let n=0;n<20;n++){await new Promise(r=>setTimeout(r,500));const t=await chrome.tabs.get(confirmation.id);if(t.status==='complete')break;}
    return true;
   }
  }
  return false;
 }finally{await chrome.tabs.remove(mailbox.id).catch(()=>{});}
}
const verificationAttempts=new Set();
async function resumeAfterChange(tab,signature){
 for(let i=0;i<16&&remainingSteps>0;i++){
  await new Promise(r=>setTimeout(r,450));
  const [active]=await chrome.tabs.query({active:true,currentWindow:true});
  if(active?.id!==tab.id||!active.url||new URL(active.url).origin!==new URL(tab.url).origin)return;
  try{
   const {result}=await scanDocument(active);
   if(signature===stepSignature(result))continue;
   remainingSteps--;continuing=true;
   try{await $('scan').onclick();if(review&&review.fields.length)await $('fill').onclick();}finally{continuing=false;}
   return;
  }catch{continue;}
 }
}
const stepSignature=form=>JSON.stringify([form.url,form.needsEmailVerification,form.fields.map(f=>[f.id,f.label,f.type])]);
$('scan').onclick=async()=>{if(!continuing)remainingSteps=10;reset();$('scan').disabled=true;try{if(!profile)throw new Error('Import a confirmed profile first.');const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id||!/^https?:\/\//.test(tab.url||''))throw new Error('Open an employer’s application form in a normal browser tab first.');if(profile.values.school)await chrome.scripting.executeScript({target:{tabId:tab.id},func:formBridge,args:[{action:'prepare-education'}]});const {result,documentId,chatOnly,applicationFrame}=await scanDocument(tab);if(result.needsEmailVerification&&!verificationAttempts.has(tab.id)){
  const access={origins:['https://mail.google.com/*']};
  const verify=async()=>{
   verificationAttempts.add(tab.id);say('Looking for the recent employer verification email…');
   if(await verifyEmployerEmail(tab,profile.values.email)){say('Verification link opened. Checking sign-in…');await $('scan').onclick();}
   else{verificationAttempts.delete(tab.id);say('Could not identify one recent verification link for this employer. Open the verification email to continue.');}
  };
  if(await chrome.permissions.contains(access))await verify();
  else{const button=$('allow-chat');button.hidden=false;button.textContent='Allow Gmail verification';button.onclick=async()=>{if(await chrome.permissions.request(access)){button.hidden=true;try{await verify();}catch(e){say(e.message);}}};say('Allow Gmail access to verify this employer account.');}
  return;
 }const mixedAccount=result.hasPasswordField&&documentId&&result.url===tab.url&&(await chrome.scripting.executeScript({target:{tabId:tab.id,documentIds:[documentId]},func:employerAccountForm,args:[{url:tab.url,email:profile.values.email,embedded:true,inspectOnly:true}]}))[0]?.result;
 if(!mixedAccount&&(result.hasPasswordField||new URL(result.url).hostname==='passport.amazon.jobs')){
 try{const accountStatus=await scanAccount(tab);if(accountStatus){say(accountStatus);if(/registration requested|sign-in requested/i.test(accountStatus))await resumeAfterChange(tab,stepSignature(result));return;}}
 catch(error){say(error.message||'Check the employer account form.');return;}
 }const handoff=await chrome.runtime.sendMessage({type:'get-handoff',tabId:tab.id});const resume=!chatOnly&&!applicationFrame&&handoff?.entry?.origin===new URL(result.url).origin?handoff.entry.resume:null;const memory=await savedAnswers();const knowledge=await readPortfolio();let automaticUpload=null;if(resume&&handoff.entry.autoResume&&!handoff.entry.resumeUploaded){const response=await chrome.scripting.executeScript({target:{tabId:tab.id},func:attachResume,args:[{url:result.url,resume}]});automaticUpload=response[0].result;if(automaticUpload.attached)handoff.entry.resumeUploaded=true;if(automaticUpload.attached)await chrome.runtime.sendMessage({type:'resume-attached',tabId:tab.id,sha256:resume.sha256});$('resume-status').textContent=automaticUpload.message;}else if(!resume)$('resume-status').textContent='No tailored PDF is connected to this tab. Use Connect a tailored resume to choose the matching job in Studio.';const fields=result.fields.map(field=>({field,answer:suggestField({...field,jobLocation:$('job-country').value||handoff?.entry?.job?.location||result.jobLocation,applicationSeason:$('application-season').value||applicationSeason(handoff?.entry?.job?.title)},profile,memory,new URL(result.url).origin,employerContext||'page:'+new URL(result.url).origin+new URL(result.url).pathname,knowledge)})).filter(item=>item.answer);if(mixedAccount?.available)fields.push({field:{type:'account-pair',label:'Employer account email and password'},answer:{display:'Use your saved employer login',reason:'Fill both password fields',sourceQuestion:'Employer account'}});review={signature:stepSignature(result),documentId,suggest:(f,form)=>chatOnly&&f.type!=='chat-reply'?null:suggestField({...f,jobLocation:$('job-country').value||handoff?.entry?.job?.location||form.jobLocation,applicationSeason:$('application-season').value||applicationSeason(handoff?.entry?.job?.title)},profile,memory,new URL(result.url).origin,employerContext||'page:'+new URL(result.url).origin+new URL(result.url).pathname,knowledge),tabId:tab.id,url:result.url,createdAt:Date.now(),resume,fields:fields.map(item=>({...item.field,...item.answer}))};for(const [i,f] of review.fields.entries()){const label=document.createElement('label');label.className='answer';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.value=String(i);const text=document.createElement('span');text.textContent=f.label;const value=document.createElement('small');value.textContent=f.display;text.append(value);if(f.reason){const reason=document.createElement('small');reason.textContent=f.reason+' · '+f.sourceQuestion;text.append(reason);}label.append(checkbox,text);$('suggestions').append(label);addPortfolioEvidence($('suggestions'),f);}if(resume&&!handoff.entry.resumeUploaded){const label=document.createElement('label');label.className='answer';const check=document.createElement('input');check.type='checkbox';check.checked=true;check.value='resume';const text=document.createElement('span');text.textContent='Attach tailored resume: '+resume.name;label.append(check,text);$('suggestions').append(label);}$('fill').hidden=!fields.length&&(!resume||handoff.entry.resumeUploaded);say(fields.length?fields.length+' suggested answers. Check the values and unselect anything you do not want to share.':'No supported empty fields found. Open the application form (not just the job description), or use the copy buttons in Application Studio.');if(automaticUpload?.attached)say(automaticUpload.message+' Nothing was submitted.');if(result.embeddedForms)say($('status').textContent+'\nEmbedded forms may need to be opened directly.');}catch{say('This page could not be scanned. Some pages block extensions. Open the actual employer form or use Application Studio’s copy buttons.');}finally{$('scan').disabled=!profile;}};
$('fill').onclick=async()=>{$('fill').disabled=true;try{if(!review||Date.now()-review.createdAt>120000)throw new Error('Scan the current form again before filling.');const [active]=await chrome.tabs.query({active:true,currentWindow:true});if(active.id!==review.tabId)throw new Error('The active tab changed. Scan again.');const fields=[...$('suggestions').querySelectorAll('input')].filter(c=>c.checked).filter(c=>c.value!=='resume').map(c=>review.fields[Number(c.value)]);const withResume=!!$('suggestions').querySelector('input[value="resume"]:checked');if(!fields.length&&!withResume)throw new Error('Select an answer or the tailored PDF.');const run=review;
 const bridge=async(action,data={})=>{const [response]=await chrome.scripting.executeScript({target:{tabId:run.tabId,...(run.documentId?{documentIds:[run.documentId]}:{})},func:formBridge,args:[{action,...data}]});return response.result;};
 const ordinary=fields.filter(f=>f.type!=='account-pair');const result=await fillWithFollowups({url:run.url,reviewed:run.fields,selected:ordinary,scan:()=>bridge('scan'),fill:data=>bridge('fill',data),suggest:run.suggest,active:()=>review===run});let accountNote='';if(fields.some(f=>f.type==='account-pair')&&!result.changed&&active.url===run.url){try{const status=await scanAccount(active,run.documentId);if(status){result.filled++;accountNote=status;}else result.skipped++;}catch(error){result.skipped++;accountNote=error.message;}}let upload=null;if(withResume&&review.resume){const response=await chrome.scripting.executeScript({target:{tabId:review.tabId},func:attachResume,args:[{url:review.url,resume:review.resume}]});upload=response[0].result;}if(result.filled&&!result.changed&&!result.skipped&&!accountNote&&fields.length===run.fields.length&&(!withResume||upload?.attached)&&remainingSteps>0&&active.url===run.url&&await bridge('advance',{url:run.url})){reset();say('Continuing to the next section…');await resumeAfterChange(active,run.signature);return;}reset();say(result.changed?'The page changed. Scan again.':result.filled+' answers filled; '+result.skipped+' fields could not be filled or changed. '+(upload?.message||'Review the completed form.')+' '+accountNote+' Nothing was submitted.');}catch(error){say(error.message);}finally{$('fill').disabled=false;}};

$('job-country').onchange=()=>{reset();say('Job location changed. Scan again.');};
$('application-season').onchange=()=>{reset();say('Season updated. Scan again to review availability. Edit summer dates in Saved answers.');};
