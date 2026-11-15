import {originPattern} from './handoff-core.mjs';
const $=id=>document.getElementById(id);let entry;
const tab=await chrome.tabs.getCurrent(),tabId=tab.id;
const response=await chrome.runtime.sendMessage({type:'get-handoff',tabId});entry=response.entry;
if(entry){$('title').textContent=entry.job.title;$('company').textContent=entry.job.company;$('host').textContent=entry.origin;$('enable').disabled=false;$('manual').href=entry.job.url;$('manual').hidden=false;}
else $('status').textContent=location.search?'This handoff expired. Start again from Application Studio.':'Connecting to Application Studio…';
$('enable').onclick=async()=>{try{const granted=await chrome.permissions.request({origins:[originPattern(entry.job.url)]});if(!granted){$('status').textContent='Access was not granted. You can still open the original application below.';return;}const result=await chrome.runtime.sendMessage({type:'open-handoff',tabId});if(!result.ok)throw new Error(result.error);}catch(error){$('status').textContent=error.message;}};
$('manual').onclick=async e=>{e.preventDefault();await chrome.runtime.sendMessage({type:'stop-handoff',tabId});location.href=entry.job.url;};
