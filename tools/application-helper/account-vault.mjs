const encoder=new TextEncoder();
const encode=bytes=>Array.from(new Uint8Array(bytes));
const random=length=>crypto.getRandomValues(new Uint8Array(length));
const vaultKey='employer-vault-v1';
async function derive(phrase,salt){
 const material=await crypto.subtle.importKey('raw',encoder.encode(phrase),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt),iterations:600000},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
function generatedPassword(min=0,max=80){
 const groups=['ABCDEFGHJKLMNPQRSTUVWXYZ','abcdefghijkmnopqrstuvwxyz','23456789','!@#$%'];
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
 if(!entry&&!options.signup)throw Error('No saved login for this employer. Open its Create account form and scan it.');
 let key=await keyStore();
 if(!key&&entry){
  if(entry.deviceOnly)throw Error('This browser no longer has the key to its employer vault.');
  if(!options.phrase)throw Error('Enter your existing vault passphrase in Employer account, then scan once to unlock it on this browser.');
  key=await derive(options.phrase,entry.salt);
  const password=await accountCredential(storage,{...options,key});
  await keyStore(key);
  return password;
 }
 if(!key){
  key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  await keyStore(key);
 }
 return accountCredential(storage,{...options,key,sitePassword:entry?'':generatedPassword(options.min,options.max)});
}
export async function accountCredential(storage,{origin,employer,email,phrase,repeat,signup,sitePassword,key:device,scope=''}){
 const entry=(await storage.get(vaultKey))[vaultKey];
 if(!entry&&!signup)throw Error('Create an account with the helper first.');
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
 if(saved)return vault.password;
 if(!signup)throw Error('No saved login matches this website, employer name and email.');
 vault.accounts.push({origin,label,email:identity,scope});
 const iv=random(12),data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(JSON.stringify(vault)));
 await storage.set({[vaultKey]:{...(salt?{salt}:{deviceOnly:true}),iv:encode(iv),data:encode(data)}});
 return vault.password;
}
