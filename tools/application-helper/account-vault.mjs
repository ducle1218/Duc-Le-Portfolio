const encoder=new TextEncoder();
const encode=bytes=>Array.from(new Uint8Array(bytes));
const random=length=>crypto.getRandomValues(new Uint8Array(length));
const vaultKey='employer-vault-v1';
async function derive(phrase,salt){
 const material=await crypto.subtle.importKey('raw',encoder.encode(phrase),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt),iterations:600000},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
// The popup alone unlocks the vault. Only the selected account leaves it.
export async function accountCredential(storage,{origin,employer,email,phrase,repeat,signup,sitePassword}){
 const entry=(await storage.get(vaultKey))[vaultKey];
 if(!entry&&!signup)throw Error('Create an account with the helper first.');
 if(!entry&&(phrase.length<12||phrase!==repeat))throw Error('Choose a vault passphrase of at least 12 characters and enter it twice.');
 const salt=entry?.salt||encode(random(16)),key=await derive(phrase,salt);
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
 const saved=vault.accounts.some(a=>a.origin===origin&&a.label===label&&a.email===identity);
 if(saved)return vault.password;
 if(!signup)throw Error('No saved login matches this website, employer name and email.');
 vault.accounts.push({origin,label,email:identity});
 const iv=random(12),data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(JSON.stringify(vault)));
 await storage.set({[vaultKey]:{salt,iv:encode(iv),data:encode(data)}});
 return vault.password;
}
