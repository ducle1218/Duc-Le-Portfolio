const outbound='duc-application-studio-v1',inbound='duc-application-helper-v1';
export function helperRequest(action,payload,timeout=2000){
 return new Promise((resolve,reject)=>{
  const id=crypto.randomUUID();let timer;
  const receive=event=>{if(event.source!==window||event.origin!==location.origin||event.data?.channel!==inbound||event.data.id!==id)return;finish();const result=event.data.result;if(result?.ok)resolve(result);else reject(new Error(result?.error||'The extension could not start this application.'));};
  const finish=()=>{clearTimeout(timer);window.removeEventListener('message',receive);};
  window.addEventListener('message',receive);timer=setTimeout(()=>{finish();reject(new Error('Application Helper did not respond. Reload version 1.1 or newer and refresh this page.'));},timeout);
  window.postMessage({channel:outbound,id,action,payload},location.origin);
 });
}
