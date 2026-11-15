import {PROFILE_FIELDS,APPLICATION_STATES,cleanProfile} from './application-core.mjs?v=20261114.8';
import {cloudRequest,connected} from './cloud.mjs?v=20261114.8';
import {buildResume} from './studio.mjs?v=20261114.8';
import {filename,canonical} from './job-core.mjs?v=20261114.8';
import {helperRequest} from './extension-client.mjs?v=20261114.8';
const $=id=>document.getElementById(id),node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
let profile=null,applications=[],dialog=null,pdfURL=null;
let helperReady=false;
let profileEdited=false;
const exportStatus=text=>{$('profile-download-status').textContent=text;};
function reviewForDownload(){
 $('application-profile').open=true;
 exportStatus('Review your details below, check the confirmation box, then choose Confirm & download. No owner key needed.');
 $('application-profile').scrollIntoView({behavior:'smooth',block:'start'});
 $('app-firstName').focus();
}
function downloadProfile(confirmed){
 const url=URL.createObjectURL(new Blob([JSON.stringify({format:'duc-application-profile-v1',exportedAt:new Date().toISOString(),profile:confirmed},null,2)],{type:'application/json'}));
 const link=node('a');link.href=url;link.download='Duc_Application_Profile.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 exportStatus('Downloaded Duc_Application_Profile.json. In the helper, open Profile settings → Choose exported profile and select this file.');
 $('profile-download-status').scrollIntoView({behavior:'smooth',block:'center'});
}
function readProfile(){return cleanProfile({values:Object.fromEntries(PROFILE_FIELDS.map(([key])=>[key,$('app-'+key).value])),answers:[...$('reusable-answers').children].map(row=>({question:row.querySelector('.answer-question').value,answer:row.querySelector('.answer-value').value})),confirmed:$('profile-confirm').checked});}
async function detectHelper(){try{const result=await helperRequest('hello');helperReady=Number(result.version?.split('.')[0])>=1&&result.version!=='1.0.0';}catch{helperReady=false;}const status=$('helper-connection');if(status)status.textContent=helperReady?'Extension connected · ready to start applications':'Install or reload Application Helper 1.2, then refresh this page to connect.';return helperReady;}
if(typeof window!=='undefined'){detectHelper();window.addEventListener('focus',detectHelper);}
const message=text=>{$('application-status').textContent=text;};
function needOwner(){if(connected())return true;message('Unlock owner access in Online library to save your profile and applications.');const library=$('cloud-library');library.open=true;library.scrollIntoView({behavior:'smooth',block:'center'});$('cloud-key').focus();return false;}
function addAnswer(question='',answer=''){
 if($('reusable-answers').children.length>=12){message('You can save up to 12 reusable answers.');return;}
 const row=node('div',undefined,'reusable-answer');const qLabel=node('label','Question'),q=node('input');q.className='answer-question';q.value=question;q.maxLength=160;q.placeholder='e.g. When are you available to start?';qLabel.append(q);
 const aLabel=node('label','Your answer'),a=node('textarea');a.className='answer-value';a.value=answer;a.maxLength=1500;a.rows=2;aLabel.append(a);const remove=node('button','Remove','quiet');remove.type='button';remove.onclick=()=>row.remove();row.append(qLabel,aLabel,remove);$('reusable-answers').append(row);
}
function fillProfile(){for(const [key,,seed] of PROFILE_FIELDS)$('app-'+key).value=profile?.values[key]??seed;$('profile-confirm').checked=false;$('reusable-answers').replaceChildren();for(const answer of profile?.answers||[])addAnswer(answer.question,answer.answer);profileEdited=false;$('profile-origin').textContent=profile?'Saved online · confirmed '+new Date(profile.confirmedAt).toLocaleDateString():'Starting values come from your published resume. Review them before using them.';exportStatus(profile?'Your confirmed profile is ready to download.':'First time? Review your details, confirm, and download. No owner key needed.');}
for(const [key,label] of PROFILE_FIELDS){const wrap=node('label',label),input=node('input');input.id='app-'+key;input.name=key;input.maxLength=220;input.type=key==='email'?'email':['portfolio','linkedin','github'].includes(key)?'url':'text';input.autocomplete='off';wrap.append(input);$('app-profile-fields').append(wrap);}
fillProfile();$('add-answer').onclick=()=>addAnswer();
$('export-profile').onclick=$('download-profile').onclick=()=>{if(profile&&!profileEdited)downloadProfile(profile);else reviewForDownload();};
$('profile-form').addEventListener('input',()=>{profileEdited=true;});
$('reusable-answers').addEventListener('click',e=>{if(e.target.closest('button'))profileEdited=true;});
$('add-answer').addEventListener('click',()=>{profileEdited=true;});
$('profile-form').onsubmit=async e=>{e.preventDefault();if(e.submitter?.id==='download-reviewed-profile'){try{downloadProfile(readProfile());}catch(error){message(error.message);exportStatus(error.message);}return;}if(!needOwner())return;const button=$('save-profile');button.disabled=true;try{const result=await cloudRequest('/application-profile','PUT',readProfile());profile=result.profile;fillProfile();message('Profile and reusable answers saved online. They are ready in each application kit.');}catch(error){message(error.message);}finally{button.disabled=false;}};
function renderHistory(){const container=$('application-history');container.replaceChildren();$('application-count').textContent=connected()?applications.length+' saved applications':'Owner access required';if(!applications.length)container.append(node('p','Choose “Prepare application” beside a job to start. Save drafts here to find them again on your phone.','hint'));
 for(const app of applications){const row=node('div',undefined,'application-history-row'),text=node('div');text.append(node('strong',app.title),node('p',app.company+' · '+app.status+' · '+new Date(app.updatedAt).toLocaleDateString(),'hint'));const open=node('button','Continue ↗','quiet');open.onclick=()=>openApplication(app);row.append(text,open);container.append(row);}}
async function refresh(){if(!connected()){profile=null;applications=[];fillProfile();renderHistory();return;}try{const [p,a]=await Promise.all([cloudRequest('/application-profile'),cloudRequest('/applications')]);profile=p.profile;applications=a.applications;fillProfile();renderHistory();message('Private application workspace connected.');}catch(error){message(error.message);}}
document.addEventListener('application-auth',refresh);
$('refresh-applications').onclick=()=>{if(needOwner())refresh();};
$('edit-profile').onclick=()=>{$('application-profile').open=!$('application-profile').open;if($('application-profile').open)$('app-firstName').focus();};
document.addEventListener('prepare-application',e=>openApplication(e.detail));renderHistory();
async function originalDescription(job){
 if(job.description)return job.description;
 const response=await fetch('../../data/jobs.json',{signal:AbortSignal.timeout(15000)});if(response.ok){const feed=await response.json();const found=feed.jobs?.find(j=>canonical(j.url)===canonical(job.url));if(found)return found.description;}
 if(connected()){let cursor='',seen=new Set();do{const page=await cloudRequest('/jobs'+(cursor?'?cursor='+encodeURIComponent(cursor):''));const found=page.jobs.find(j=>canonical(j.url)===canonical(job.url));if(found)return found.description;cursor=page.nextCursor||'';if(seen.has(cursor))break;seen.add(cursor);}while(cursor);}
 throw new Error('The saved posting text is no longer available. Import its link again, or paste its description in the resume section.');
}
async function openApplication(job){
 if(dialog){dialog.focus();return;}const previous=applications.find(a=>a.url===canonical(job.url)),app={...job,...previous};let dirty=false;
 const d=dialog=node('dialog',undefined,'application-dialog');d.setAttribute('aria-labelledby','application-dialog-title');
 const top=node('div',undefined,'application-toolbar'),close=node('button','Close ×','quiet');top.append(node('span','APPLICATION STUDIO / YOUR KIT','eyebrow'),close);
 const title=node('h2',app.title);title.id='application-dialog-title';const steps=node('div',undefined,'application-steps');for(const label of ['01 Tailor your resume','02 Copy confirmed answers','03 Apply with the employer'])steps.append(node('span',label));
 const body=node('div',undefined,'application-layout'),kit=node('aside',undefined,'application-kit'),answersPanel=node('section',undefined,'application-answers');
 const status=node('p','Prepare here, then complete and submit the application on the employer’s website.','hint');status.setAttribute('role','status');
 const resume=node('button','Prepare tailored PDF ↓','primary');resume.type='button';const preview=node('a','Review PDF ↗','quiet'),download=node('a','Download PDF ↓','quiet');preview.hidden=download.hidden=true;preview.target='_blank';preview.rel='noopener';
 resume.onclick=async()=>{resume.disabled=true;try{status.textContent='Preparing your original resume template…';const description=await originalDescription(job),result=await buildResume(description);if(pdfURL)URL.revokeObjectURL(pdfURL);pdfURL=URL.createObjectURL(new Blob([result.output],{type:'application/pdf'}));preview.href=download.href=pdfURL;download.download=filename(job);preview.hidden=download.hidden=false;status.textContent='PDF ready. Review its wording, download it, and attach it on the employer’s form.';}catch(error){status.textContent=error.message;}finally{resume.disabled=false;}};
 kit.append(node('h3','Your resume'),resume,preview,download);
 const stageLabel=node('label','Application status'),stage=node('select');for(const s of APPLICATION_STATES){const option=node('option',s);option.value=s;stage.append(option);}stage.value=app.status||'Preparing';stageLabel.append(stage);
 const notesLabel=node('label','Private notes'),notes=node('textarea');notes.rows=3;notes.maxLength=3000;notes.value=app.notes||'';notesLabel.append(notes);stage.onchange=notes.oninput=()=>{dirty=true;};
 const save=node('button','Save draft online','quiet');save.onclick=async()=>{if(!connected()){status.textContent='Close this kit and unlock owner access in Online library to save your draft.';return;}save.disabled=true;try{const result=await cloudRequest('/applications','PUT',{...app,status:stage.value,notes:notes.value});applications=[result.application,...applications.filter(a=>a.url!==result.application.url)];dirty=false;discard.hidden=true;renderHistory();status.textContent=stage.value==='Submitted'?'Marked submitted based on your confirmation. Application Studio has not submitted anything.':'Draft saved online. It will be here after clearing browser data.';}catch(error){status.textContent=error.message;}finally{save.disabled=false;}};
 const original=node('a','Open employer application ↗','primary');original.href=job.url;original.target='_blank';original.rel='noopener noreferrer';
 const helperHint=node('p',profile?'Checking for Application Helper…':'Save and confirm your profile to use the connected extension. You can still open the employer’s page.','hint');
 const updateHelper=()=>{if(!profile)return;original.textContent=helperReady?'Start application with helper ↗':'Open employer application ↗';helperHint.textContent=helperReady?'Your confirmed profile follows this job. Review suggested answers on the employer’s form.':'Extension not connected. Install or reload Application Helper 1.2 and refresh this page, or open the employer normally.';};updateHelper();if(typeof window!=='undefined')detectHelper().then(updateHelper);
 let starting=false;
 original.onclick=async e=>{
  if(!helperReady||!profile)return;e.preventDefault();if(starting)return;starting=true;original.setAttribute('aria-disabled','true');
  try{status.textContent='Opening the employer with your confirmed profile…';await helperRequest('start',{job:{url:job.url,title:job.title,company:job.company},profile},15000);status.textContent='Application opened. Allow access to this employer if prompted, then review the helper’s suggestions. Attach your PDF and submit on the employer’s form.';
   if(connected()){const nextStage=stage.value==='Preparing'?'In progress':stage.value;try{const result=await cloudRequest('/applications','PUT',{...app,status:nextStage,notes:notes.value});applications=[result.application,...applications.filter(a=>a.url!==result.application.url)];stage.value=nextStage;dirty=false;discard.hidden=true;renderHistory();}catch(error){status.textContent+=' Your draft could not be saved: '+error.message;}}
  }catch(error){status.textContent=error.message+' You can use the original link below.';fallback.hidden=false;}finally{starting=false;original.removeAttribute('aria-disabled');}
 };
 const fallback=node('a','Open without helper ↗','quiet');fallback.href=job.url;fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.hidden=true;
 kit.append(stageLabel,notesLabel,save,node('p','Only mark Submitted after the employer confirms receipt. Your notes and status remain private.','hint'),original,fallback,helperHint);
 answersPanel.append(node('h3','Answers, ready to use'),node('p','Copy a confirmed answer into the matching employer question. Check the question’s wording before using it.','hint'));
 const grid=node('div',undefined,'answer-grid');
 const copyAnswer=(label,value,wide=false)=>{const row=node('div',undefined,'answer-card'+(wide?' answer-wide':'')),text=node('div');text.append(node('small',label),node('p',value));const copy=node('button','Copy','quiet');copy.type='button';copy.setAttribute('aria-label','Copy '+label);copy.onclick=async()=>{try{await navigator.clipboard.writeText(value);status.textContent=label+' copied. Paste it into the matching employer field.';}catch{status.textContent='Select the answer text to copy it.';}};row.append(text,copy);grid.append(row);};
 if(profile){for(const [key,label] of PROFILE_FIELDS)if(profile.values[key])copyAnswer(label,profile.values[key]);for(const a of profile.answers||[])copyAnswer(a.question,a.answer,true);}
 else{const empty=node('div',undefined,'answers-empty');empty.append(node('p','Confirm your profile once. Reuse it for every application.'));const edit=node('button','Review my profile ↗','quiet');edit.onclick=()=>{if(dirty){status.textContent='Save your draft before leaving this kit.';return;}d.close();$('application-profile').open=true;$('application-profile').scrollIntoView({behavior:'smooth',block:'start'});$('app-firstName').focus();};empty.append(edit);grid.append(empty);}
 answersPanel.append(grid,node('p','No qualifications or personal answers are guessed. Add your own recurring questions in Reusable profile.','hint'));body.append(kit,answersPanel);
 const discard=node('button','Close without saving changes','quiet');discard.hidden=true;discard.onclick=()=>d.close();
 d.append(top,title,node('p',app.company,'muted'),steps,body,status,discard);document.body.append(d);
 const finish=()=>{if(dirty){status.textContent='Your status or notes have unsaved changes. Save the draft, or close without saving.';discard.hidden=false;discard.focus();return;}d.close();};close.onclick=finish;d.addEventListener('cancel',e=>{e.preventDefault();finish();});d.addEventListener('close',()=>{if(pdfURL)URL.revokeObjectURL(pdfURL);pdfURL=null;d.remove();dialog=null;});d.showModal();close.focus();
}
