// Public resume values are starting points. The owner confirms their private copy.
export const PROFILE_FIELDS = [
 ['firstName','First name','Duc'],['lastName','Last name','Le'],
 ['email','Email','ducle12182007@gmail.com'],['phone','Phone','(609) 289-6897'],
 ['city','City','Piscataway'],['state','State / province','New Jersey'],
 ['postalCode','Postal code',''],['country','Country',''],
 ['school','Current university','Rutgers University–New Brunswick'],
 ['major','Field of study','Mechanical Engineering'],
 ['graduationYear','Expected graduation year','2030'],
 ['portfolio','Portfolio','https://ducle1218.github.io/Duc-Le-Portfolio/'],
 ['linkedin','LinkedIn','https://www.linkedin.com/in/duc-le-35a330412/'],
 ['github','GitHub','https://github.com/ducle1218']
];
export const APPLICATION_STATES=['Preparing','In progress','Submitted','Interview','Offer','Not proceeding'];
export function cleanProfile(input){
 if(new TextEncoder().encode(JSON.stringify(input)).length>1000000)throw new Error('This profile exceeds the 1 MB storage size. Export a backup and shorten long answers.');
 if(!input||input.confirmed!==true)throw new Error('Review and confirm your profile first.');
 const values={};for(const [key] of PROFILE_FIELDS){const value=String(input.values?.[key]||'').trim();if(value.length>220||/[\u0000-\u001f]/.test(value))throw new Error('Profile field is too long or invalid.');values[key]=value;}
 if(!values.firstName||!values.lastName)throw new Error('Add your first and last name.');
 if(values.email.toLowerCase()==='ducle1218@gmail.com')values.email='ducle12182007@gmail.com';
 if(values.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))throw new Error('Check your email.');
 for(const key of ['portfolio','linkedin','github'])if(values[key]){const u=new URL(values[key]);if(u.protocol!=='https:'||u.username||u.password)throw new Error('Profile links must use HTTPS.');}
 const answers=(Array.isArray(input.answers)?input.answers:[]).map(a=>({question:String(a.question||'').trim(),answer:String(a.answer||'').trim()})).filter(a=>a.question||a.answer);
 if(answers.some(a=>!a.question||!a.answer||a.question.length>160||a.answer.length>1500))throw new Error('Add a question and answer for each reusable answer without empty questions or answers.');
 return {values,answers,confirmed:true,confirmedAt:new Date().toISOString()};
}

// Portable metadata only. Ignore extra properties, including credentials.
export function employerSites(...lists){
 const entries=new Map();
 for(const row of lists.filter(Array.isArray).flat()){
  if(typeof row?.origin!=='string'||typeof row.email!=='string')continue;
  let url;try{url=new URL(row.origin);}catch{continue;}
  const email=row.email.trim().toLowerCase();
  if(url.protocol!=='https:'||url.origin!==row.origin||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))continue;
  const scope=typeof row.scope==='string'?row.scope.slice(0,240):'';
  entries.set(JSON.stringify([url.origin,scope,email]),{origin:url.origin,scope,email});
 }
 return [...entries.values()];
}
