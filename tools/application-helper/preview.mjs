const tabId=Number(new URL(location.href).searchParams.get('tab'));
const {resume}=await chrome.runtime.sendMessage({type:'preview-pdf',tabId});
if(resume){
 const bytes=Uint8Array.from(atob(resume.base64),c=>c.charCodeAt(0));
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
 const frame=document.createElement('iframe');
 frame.title=document.title=resume.name;
 frame.src=url;
 document.body.replaceChildren(frame);
 addEventListener('pagehide',()=>URL.revokeObjectURL(url),{once:true});
}else document.querySelector('p').textContent='This résumé is no longer available for this application.';
