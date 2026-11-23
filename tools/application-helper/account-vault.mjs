import {employerSites} from './application-core.mjs';
const encoder=new TextEncoder();
const encode=bytes=>Array.from(new Uint8Array(bytes));
const random=length=>crypto.getRandomValues(new Uint8Array(length));
const unknown=message=>Object.assign(Error(message),{code:'NO_SAVED_ACCOUNT'});
const vaultKey='employer-vault-v1';
async function derive(phrase,salt){
 const material=await crypto.subtle.importKey('raw',encoder.encode(phrase),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt),iterations:600000},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
function generatedPassword(min=0,max=80,alphanumeric=false){
 const groups=['ABCDEFGHJKLMNPQRSTUVWXYZ','abcdefghijkmnopqrstuvwxyz','23456789','!@#$%'];
 if(alphanumeric)groups.pop();
 const length=Math.min(max,Math.max(20,min));
 if(length<12||length<min||length>128)throw Error('This form needs a different password length. Review its requirements.');
 const pick=n=>{let x;do{x=random(1)[0];}while(x>=256-256%n);return x%n;};
 const alphabet=groups.join(''),chars=groups.map(group=>group[pick(group.length)]);
 while(chars.length<length)chars.push(alphabet[pick(alphabet.length)]);
 for(let i=chars.length-1;i>0;i--){const j=pick(i+1);[chars[i],chars[j]]=[chars[j],chars[i]];}
 return chars.join('');
}

// Chromium persists the non-exportable key inside the extension's own origin.
async function deviceKey(value){
 const db=await new Promise((resolve,reject)=>{
  const open=indexedDB.open('employer-account-keys',1);
  open.onupgradeneeded=()=>open.result.createObjectStore('keys');
  open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);
 });
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('keys',value?'readwrite':'readonly'),store=tx.objectStore('keys');
  const req=value?store.put(value,'account-key'):store.get('account-key');
  tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error);
 });}finally{db.close();}
}
export async function scanCredential(storage,options,keyStore=deviceKey){
 const entry=(await storage.get(vaultKey))[vaultKey];
 if(!entry&&!options.signup)throw unknown('No saved login for this employer. Open its Create account form and scan it.');
 let key=await keyStore();
 if(!key&&entry){
  if(entry.deviceOnly)throw Error('This browser no longer has the key to its employer vault.');
  if(!options.phrase)throw Object.assign(Error('Enter your existing vault passphrase once to unlock passwords saved by the older helper.'),{code:'LEGACY_VAULT'});
  key=await derive(options.phrase,entry.salt);
  const password=await accountCredential(storage,{...options,key});
  await keyStore(key);
  return password;
 }
 if(!key){
  key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  await keyStore(key);
 }
 return accountCredential(storage,{...options,key,sitePassword:entry?'':generatedPassword(options.min,options.max,options.alphanumeric)});
}
export async function accountCredential(storage,{origin,employer,email,phrase,repeat,signup,sitePassword,key:device,scope='',alphanumeric=false}){
 const entry=(await storage.get(vaultKey))[vaultKey];
 if(!entry&&!signup)throw unknown('Create an account with the helper first.');
 if(!entry&&!device&&(phrase.length<12||phrase!==repeat))throw Error('Choose a vault passphrase of at least 12 characters and enter it twice.');
 const salt=entry?.salt||(!device&&encode(random(16))),key=device||await derive(phrase,salt);
 let vault;
 if(entry){
  try{
   const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(entry.iv)},key,new Uint8Array(entry.data));
   vault=JSON.parse(new TextDecoder().decode(clear));
  }catch{throw Error('Could not unlock your saved accounts. Check your vault passphrase.');}
 }else{
  const password=sitePassword;
  if(!password)throw Error('Enter the shared password to use for your employer accounts.');
  if(password===phrase)throw Error('Choose a separate passphrase to unlock the vault.');
  vault={password,accounts:[]};
 }
 const label=employer.trim().toLowerCase(),identity=email.trim().toLowerCase();
 if(!label||!identity)throw Error('Enter the employer name and your account email.');
 const saved=vault.accounts.some(a=>a.origin===origin&&a.email===identity&&(a.scope&&scope?a.scope===scope:a.label===label));
 if(alphanumeric&&(!/^[a-zA-Z0-9]{8,30}$/.test(vault.password)||!/[A-Z]/.test(vault.password)))throw Error('Your saved shared password does not meet SilkRoad’s letters-and-numbers rule. Enter a site-specific password manually.');
 if(saved)return vault.password;
 if(!signup)throw unknown('No saved login matches this website, employer name and email.');
 vault.accounts.push({origin,label,email:identity,scope});
 const iv=random(12),data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(JSON.stringify(vault)));
 await storage.set({[vaultKey]:{...(salt?{salt}:{deviceOnly:true}),iv:encode(iv),data:encode(data)}});
 return vault.password;
}

export async function savedEmployerSites(storage,keyStore=deviceKey){
 const entry=(await storage.get(vaultKey))[vaultKey];
 const imported=(await storage.get('employerSites')).employerSites;
 if(!entry)return employerSites(imported);
 const key=await keyStore();
 if(!key)throw Error('Unlock your older employer logins in the helper before exporting the site list.');
 const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(entry.iv)},key,new Uint8Array(entry.data));
 return employerSites(imported,JSON.parse(new TextDecoder().decode(bytes)).accounts);
}
