// Isolated content script: this channel exists only on Application Studio routes.
(()=>{
 if(location.origin!=='https://ducle1218.github.io'||!/^\/Duc-Le-Portfolio\/(applications|generator|resume\/generator)\/(index\.html)?$/.test(location.pathname))return;
 if(globalThis.ducStudioBridgeInstalled)return;
 globalThis.ducStudioBridgeInstalled=true;
 let busy=false;
 window.addEventListener('message',async event=>{
  const msg=event.data;if(event.source!==window||event.origin!==location.origin||msg?.channel!=='duc-application-studio-v1'||!['hello','start','sync-profile'].includes(msg.action)||typeof msg.id!=='string'||msg.id.length>80)return;
  if(busy&&msg.action==='start')return;
  try{if(msg.action==='start')busy=true;const result=await chrome.runtime.sendMessage({type:'studio-'+msg.action,payload:msg.payload});window.postMessage({channel:'duc-application-helper-v1',id:msg.id,result},location.origin);}
  catch{window.postMessage({channel:'duc-application-helper-v1',id:msg.id,result:{ok:false,error:'Reload the extension and this page, then try again.'}},location.origin);}
  finally{if(msg.action==='start')busy=false;}
 });
 window.dispatchEvent?.(new Event('duc-helper-ready'));
})();
