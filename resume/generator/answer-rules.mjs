import {questionKey,commonQuestion} from './common-questions.mjs?v=20261123.3';

// Editable memories, seeded once by the helper. Dates are for summer 2027 only.
// Rutgers New Brunswick: final exams end May 12; fall begins September 1.
export const PREFERENCE_ANSWERS=[
 {question:'Summer internship start date',answer:'2027-05-13'},
 {question:'Summer internship end date',answer:'2027-08-31'},
 {question:'Full-time internship availability',answer:'Summer only; not fall or winter'},
 {question:'Preferred application source',answer:'Company website or university'},
];
export function ageThreshold(q){
 const s=questionKey(q);
 const m=s.match(/^are you (?:at least )?(\d{1,2})(?: years)?(?: of age| old)?(?: or (?:older|over|above))?$/)||s.match(/^are you (\d{1,2}) years old or older$/);
 return m?Number(m[1]):null;
}
export function dateConcept(q){
 const s=questionKey(String(q||'').split('?')[0]).replace(/ date year month day$| date year month$| yyyy mm dd$| yyyy mm$/,'');
 if(/^(what is your |when is your )?(expected |anticipated )?graduation (date|day month year)$/.test(s))return 'graduation';
 if(/^(summer internship start date|when (can|could) you start|when are you available to start|(?:what is your |please (?:provide|indicate) your )?(earliest (?:(?:available|possible) )?(?:internship )?start date|(?:internship )?start date|availability to start))( for an internship)?$/.test(s))return 'start';
 if(/^(summer internship end date|(?:what is your |please (?:provide|indicate) your )?(latest (?:(?:available|possible) )?(?:internship )?end date|(?:internship )?end date))( for an internship)?$/.test(s))return 'end';
 return null;
}
export const fullTimeQuestion=q=>/^are you (able|available) to work full time\b/.test(questionKey(q));
export function applicationSeason(title=''){
 const s=questionKey(title);const seasons=['summer','fall','autumn','winter','spring'].filter(x=>new RegExp('\\b'+x+'\\b').test(s));
 if(seasons.length!==1)return '';
 if(seasons[0]==='summer'){const years=s.match(/\b20\d{2}\b/g)||[];return years.length===1?'summer-'+years[0]:'';}
 return seasons[0];
}
const stateCodes=new Set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '));
const stateNames=new Set('alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|district of columbia|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming'.split('|'));
const regionNames=new Intl.DisplayNames(['en'],{type:'region',fallback:'none'});
const countryNames=new Set();
for(const a of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')for(const b of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
 const name=regionNames.of(a+b);if(name)countryNames.add(questionKey(name));
}
export function jobJurisdiction(location=''){
 const value=location.trim().replace(/\s*\((?:remote|hybrid|on[- ]site)\)$/i,'').replace(/^remote[\s:–-]+/i,'');
 if(!value||/[;/]|\sor\s/i.test(value))return '';
 if(value==='Outside the United States')return 'foreign';
 const parts=value.split(/\s*,\s*|\s+[-–·]\s+/),last=parts.at(-1).replace(/\s+\d{5}(?:-\d{4})?$/,'');
 const name=questionKey(last);
 if(['us','u s','usa','u s a','united states','united states of america'].includes(name))return 'us';
 if(last==='Georgia'||last==='GA'&&parts.length===1)return '';
 if(stateNames.has(name)||(parts.length>1&&stateCodes.has(last)))return 'us';
 if(countryNames.has(name)||['uk','united kingdom','south korea'].includes(name))return 'foreign';
 return '';
}
export function answerRule(field,profile,memory=[],origin='',context='',now=new Date()){
 const entries=[...(profile.answers||[]),...memory.filter(a=>a.scope==='*'||a.scope===origin&&a.context===context)];
 const unique=q=>{const values=entries.filter(a=>questionKey(a.question)===questionKey(q)).map(a=>a.answer.trim());return new Set(values).size===1?values[0]:null;};
 const result=(value,reason,aliases)=>({value,display:value,reason,sourceQuestion:'Saved preferences',requiresReview:false,...(aliases?{aliases}:{} )});
 const q=questionKey(field.label),fact=name=>{const values=entries.filter(a=>commonQuestion(a.question)?.question===name).map(a=>a.answer.trim());return new Set(values).size===1?values[0]:null;};
 const prescreen='Willing to complete a U.S. Government Security Prescreen Questionnaire';
 const prescreenQuestion=q.split(' your no answer')[0];
 if(/(?:^| )are you willing to (?:complete|fill out) (?:a |the )?security pre ?screen(?:ing)? questionnaire$/.test(prescreenQuestion)&&unique(prescreen))
  return result(unique(prescreen),'Your saved security prescreen preference');
 const privateRules=[
  ['Preferred first name',/^(preferred first name|what is your preferred first name)$/],
  ['Military service',/^have you (ever )?served in (the )?(u s |united states )?(military|armed forces)$/],
  ['Government employment',/^have you (ever )?(held a (u s |united states )?government position|been (a |an )?(u s |united states )?government employee)$/],
  ['Belgian work visa',/^do you have a visa to work in belgium$/],
  ['Belgian residence',/^do you (currently )?(live|reside) in belgium$/],
  ['Active security clearance',/^(security clearance active|do you (currently )?(have|hold) an active security clearance)$/],
  ['Previous security clearance',/^(security clearance inactive within 2 years|have you ever held a security clearance)$/]
 ];
 const confirmed=(value,sourceQuestion,aliases)=>({...result(value,'From your application profile',aliases),sourceQuestion,requiresReview:true});
 if(/^(?:(?:please )?(?:confirm|verify|repeat|re ?enter)(?: your)? e ?mail(?: address)?|e ?mail(?: address)? confirmation)$/.test(q)){
  const email=profile.values?.email;
  if(!email||field.primaryEmail&&field.primaryEmail.trim().toLowerCase()!==email.trim().toLowerCase())return {blocked:true};
  return confirmed(email,'Profile email');
 }
 if(/^(?:title|salutation|honorific|name prefix)$/.test(q)&&unique('Personal title')&&(
  (field.options||[]).some(o=>/^(?:mr|mrs|ms|dr|miss|doctor)$/.test(questionKey(o.label)))||q!=='title'))return confirmed(unique('Personal title'),'Personal title');
 if(/^preferred (?:last name|surname|family name)$/.test(q)&&unique('Preferred last name'))return confirmed(unique('Preferred last name'),'Preferred last name');
 if(q==='current professional title'&&fact('Employment experience')==='None'&&profile.values?.major&&fact('Full-time student enrollment')==='Yes')return confirmed(profile.values.major+' Student','Full-time student enrollment');
 if(/^(?:home |residence )?county$/.test(q)&&unique('Home county'))return confirmed(unique('Home county'),'Home county',[questionKey(unique('Home county')),questionKey(unique('Home county')).replace(/ county$/,'')]);
 const options=(field.options||[]).map(o=>questionKey(o.label));
 if(field.type==='checkbox-group'&&/^(?:select (?:the |all )?races? you identify with|race|ethnicity|race ethnicity)$/.test(q)&&/^asian(?:$| not hispanic)/.test(questionKey(fact('Race / ethnic background'))))return {...confirmed('Asian','Race / ethnic background'),raceSelection:true};
 // Match the subject before applying facts. A relative's employment and a candidate's
 // employment are separate, as are clearance history and willingness to be screened.
 const prompt=q.replace(/^\d+ /,'');
 const sources=[
  ['Polygraph history',/^(?:which|what) types?(?: s)? of polygraph (?:have you had|have you taken)$/],
  ['Government debarment or proposed debarment',/^have you been suspended or debarred\b.*\bfrom doing business with (?:any |a )?government(?:al)? entit/],
  ['Civil False Claims Act liability',/^have you (?:ever )?been found liable for (?:a violation of )?the civil false claims act\b/],
  ['Known relatives employed by government',/^do you have (?:any )?(?:family members|relatives) (?:working (?:in|for)|employed by) (?:the |a )?(?:us |u s |federal )?government$/],
  ['Hispanic or Latino identification',/^(?:are you )?hispanic or latino$/],
  ['Previous security clearance',/^have you (?:ever|previously) (?:had|held|possessed) (?:a |an )?(?:government |federal )?security clearance$/]
 ];
 for(const [source,pattern] of sources){
  const value=unique(source);
  if(value&&pattern.test(prompt))return confirmed(value,source,source==='Polygraph history'&&value==='None'?['none','no','n a','not applicable','no polygraph','none of the above']:undefined);
 }
 const contacts=/^do you have (?:any )?relatives or acquaintances (?:employed (?:at|by)|working (?:at|for)) (.+?)(?: or (?:its|their) (?:subsidiaries|affiliates)(?: affiliates)?)?$/.exec(prompt);
 if(contacts){
  const source=contacts[1]+' relatives or acquaintances',value=unique(source);
  return value?confirmed(value,source):{blocked:true};
 }
 const nationalities=new Set((unique('Citizenships')||'').split(/[,;]/).map(questionKey).filter(Boolean));
 if(nationalities.size>1&&/^(?:are you (?:also )?a citizen of (?:any |an? )?(?:other|another|second) countr(?:y|ies)|do you (?:hold|have) dual citizenship)$/.test(prompt))return confirmed('Yes','Citizenships');
 if(unique('Government employment')==='No'&&/^(?:current )?government civilian (?:status|start date|separation from service date|transition leave date)(?: if applicable)?$/.test(prompt))
  return prompt.endsWith('status')?confirmed('N/A','Government employment',['n a','not applicable','none','never employed']):{blocked:true};
 // Time windows and narrower exclusions cannot introduce past work into an empty history.
 const employmentClause=prompt.replace(/^are you currently employed or have you been employed /,'have you been employed ').replace(/^in the (?:past|last) (?:\w+ )?years?(?: from today s date)? /,'').replace(/ other than temporary .*$/,'');
 if(/\b(?:worked|employed)\b.*\bor (?:volunteer(?:ed|ing)?|applied|served on|owned)\b/.test(employmentClause))return {blocked:true};
 if(questionKey(fact('Employment experience'))==='none'&&/^have you been employed (?:in the past \w+ years? )?by (?:a |an |the )?(?:private sector|state or local government)\b/.test(employmentClause)&&!/(?:\bor (?!local government|competition for)|\b(?:family|relative|spouse|never|not)\b)/.test(employmentClause))
  return confirmed('No','Employment experience');
 if(unique('Consideration for other domestic positions')==='Yes'&&/^i understand that i may be considered for other open positions in my country in addition to the role s? ?to which i apply$/.test(prompt)&&field.type==='radio-group'&&field.options?.length===1)
  return confirmed('Yes','Consideration for other domestic positions',[questionKey(field.options[0].label)]);
 const negativeDisability='no i do not have a disability and have not had one in the past';
 if(unique('Current or past disability')==='No'&&options.includes(negativeDisability)&&options.some(o=>o.startsWith('yes i have a disability')))return confirmed('No, I do not have a disability and have not had one in the past','Current or past disability',[negativeDisability]);
 if(/^(?:do you (?:currently )?have a disability|do you have or have you ever had a disability)$/.test(q)&&unique('Current or past disability')==='No')return confirmed('No','Current or past disability');
 if(/^are you willing to (?:undergo|submit to) (?:a |an? employment )?background check(?: in accordance with local (?:law|laws)(?: regulations)?)?$/.test(q)&&fact('Post-offer federal background check, physical and drug screen')==='Yes')return confirmed('Yes','Post-offer federal background check, physical and drug screen');
 if(commonQuestion(q)?.question==='Phone device type'&&fact('Phone device type')==='Mobile')return confirmed('Mobile','Phone device type',['personal mobile','mobile','mobile phone','cell','cell phone','cellular']);
 if(commonQuestion(q)?.question==='Preferred contact method'&&fact('Preferred contact method')==='Email')
  return confirmed('Email','Preferred contact method',['email','e mail','email address','by email']);
 const mainQuestion=questionKey(String(field.label).split('?')[0]);
 const employment=mainQuestion.replace(/^are you (?:a |an )?former employee of /,'have you worked for ').replace(/^are you currently or have you (?:previously |ever )?worked (for|at) /,'have you worked $1 ').replace(/ this does not include contractor consultant or vendor roles$/,'');
 if(/^(?:were you (?:ever |previously )?employed (?:by|at)|have you (?:ever |previously )?(?:been employed by|worked (?:at|for))|are you (?:currently employed by|(?:an? )?current employee of)) .+/.test(employment)&&
    !/\b(?:family|relatives?|spouse|applied|volunteer(?:ed|ing)?|board|shareholder|friends?|anyone|not|except|other than|or (?:are|have|will|do|did|would|can|could|is))\b/.test(employment)&&questionKey(fact('Employment experience'))==='none')
  return confirmed('No','Employment experience');
 const sms='SMS contact about my job application';
 if(/\b(?:sms|text messages?)\b/.test(q)&&/\b(?:application|recruiting|recruitment)\b/.test(q)&&/\b(?:approve|consent|agree|opt in|permission|receive|may we|can we)\b/.test(q)&&!/\b(?:opt out|decline|marketing|advertising|not|sales)\b/.test(q)&&unique(sms))
  return confirmed(unique(sms),sms);
 const active='Active security clearance',previous='Previous security clearance';
 const clearanceLevel=/^security clearance (active|inactive within (the past )?2 years)$/.exec(q);
 if(clearanceLevel){
  const source=clearanceLevel[1]==='active'?active:previous;
  if(unique(source)==='No')return confirmed('None of the Above',source,['none of the above','no clearance','none','no']);
 }
 const parent=questionKey(field.parentQuestion),parentValue=questionKey(field.parentAnswer);
 if(/^(security clearance )?date granted$/.test(q)&&(parent.includes('security clearance')||q.includes('clearance'))&&unique(previous)==='No')return {blocked:true};
 const na=['n a','na','not applicable','not applicable n a','none','did not serve','no military service'];
 if(/^(?:current )?(?:us |u s )?military (branch|status)$/.test(q)&&unique('Military service')==='No'&&parentValue!=='yes')return result('N/A','No military service',na);
 const gov=q.replace(/^including your current position /,'');
 if(/^have you (?:ever |previously )?(?:served as|been|worked as) (?:a |an )?(?:u s |united states )(?:federal )?government employee\b/.test(gov)&&!/\b(?:family|relative|spouse|or contractor|or worked)\b/.test(gov)&&
    (unique('Government employment')==='No'||!entries.some(entry=>questionKey(entry.question)==='government employment')&&fact('Employment experience')==='None'))return result('No','Your employment history');
 if(/^have you (ever )?served in (the )?(u s |united states )?(military|armed forces)$/.test(gov)&&unique('Military service')==='No')return result('No','Your military service history');
 if(/^have you ever worked for lockheed martin\b/.test(q)&&q.endsWith('as a contractor vendor that provided services to us')&&fact('Employment experience')==='None')return confirmed('No','Employment experience');
 if(/^have you (ever |previously )?worked (for|at) (us|our company|this company)$/.test(q)&&fact('Employment experience')==='None')return confirmed('No','Employment experience');
 if(/\bif (?:you (?:selected|answered) )?no (?:please )?(?:enter|type|write|select|put) (?:n a|not applicable)$/.test(q)){
  if(parent&&parentValue==='no')return result('N/A','The preceding answer is No and this field requests N/A',na);
  return {blocked:true};
 }
 if(/^(?:source )?details?$/.test(q)&&/^how (did|do) you (hear|learn|find out) about/.test(parent)&&/website|career site/.test(parentValue)){
  return {...result('Company career site','The preceding source is Company Website',['company website','company career site','our website']),careerSiteDetail:true};
 }
 if(/^please indicate the ethnic group with which you identify\b/.test(q)||commonQuestion(q)?.question==='Race / ethnic background'){
  const race=fact('Race / ethnic background');
  if(questionKey(race)==='asian not hispanic or latino')return confirmed(race,'Race / ethnic background',['asian not hispanic latino','asian not hispanic or latino','asian']);
 }
 if((/^(?:protected )?veteran (?:self identification )?status$/.test(q)||/^please select your protected veteran status\b/.test(q))&&unique('Protected veteran status')==='I am not a protected veteran')
  return confirmed('I am not a protected veteran','Protected veteran status',['i am not a protected veteran','i am not a protected veteran i prefer not to answer','not a protected veteran','i am not a veteran','not a veteran','i am not a protected veteran or veteran']);
 const agreement='I have read and understand and I agree to the above';
 if(q===questionKey(agreement)&&unique(agreement)==='Yes')return result('Yes','Your saved answer for this acknowledgment');
 const citizen=String(unique('Citizenships')||'').split(';').some(v=>['united states','united states of america','us','usa'].includes(questionKey(v)));
 if(q==='please review the question again to confirm your response is correct'&&field.parentIncludesCitizenCategory&&parentValue==='yes'&&citizen)
  return {...confirmed('Confirming my response to the US Persons question is correct.','Previous US Persons answer'),confirmUSPersons:true};
 if(/^please indicate if you belong to one of the categories above$/.test(q)){
  if(citizen&&field.includesCitizenCategory)return confirmed('Yes','Citizenships',['yes','u s citizen','us citizen','united states citizen']);
  return {blocked:true};
 }
 if(/^are you (a |an )?(u s|us|united states) citizen$/.test(q)&&citizen)return confirmed('Yes','Citizenships');
 const auth='Are you legally authorized to work in the United States?';
 if(citizen&&/\bare you a (?:u s|us|united states) citizen lawful permanent resident refugee or asylee$/.test(q))return confirmed('Yes','Citizenships');
 const proof='Can provide a valid US passport, US birth certificate or certificate of naturalization on request';
 if(/^(?:if hired )?can you (?:submit|provide) (?:verification|proof|documentation) of your (?:legal )?right to work in (?:the )?(?:us|u s|united states)$/.test(q)&&citizen&&unique(proof)==='Yes')return confirmed('Yes',proof);
 if(/\bexport control(?:led)?\b/.test(q)&&/\b(?:select|choose) (?:among |one of )?(?:the following|an option|which statement)/.test(q)){
  if(!citizen||unique(proof)!=='Yes')return {blocked:true};
  const option='I am a US Person and can provide a valid, unexpired US Passport or US birth certificate or certificate of naturalization upon request.';
  return confirmed(option,proof,[questionKey(option),questionKey(option).replaceAll('us ','u s ')]);
 }
 if(/^are you (?:legally )?(?:authorized|eligible) to work (?:for (?:any|an?) (?:us|u s|united states) employer|in (?:the )?(?:us|u s|united states))$/.test(q)&&(fact(auth)||citizen))
  return confirmed(fact(auth)||'Yes',fact(auth)?auth:'Citizenships');
 const sponsor='Will you now or in the future require sponsorship for employment visa status?';
 if(/^are you (?:legally )?authorized to work in (?:the )?(?:united states|u s|us) without (?:any |employer |visa )?sponsorship$/.test(q)){
  if(fact(auth)==='No'||fact(sponsor)==='Yes')return confirmed('No',fact(auth)==='No'?auth:sponsor);
  if(citizen||fact(auth)==='Yes'&&fact(sponsor)==='No')return confirmed('Yes',citizen?'Citizenships':auth);
  return {blocked:true};
 }
 const region=jobJurisdiction(field.jobLocation||field.workQuestionCountry||'');
 if(/^do you (?:have|hold) a valid driver(?: s)? licen[cs]e for (?:the )?country (?:in which|where) (?:this|the) job (?:resides|is located|is based)$/.test(q)&&unique('Valid driver’s license')==='Yes'&&unique('Driver license issuing country')==='United States'){
  if(region==='us')return confirmed('Yes','Driver license issuing country');
  if(region==='foreign'&&unique('Driver license valid for jobs outside the US')==='No')return confirmed('No','Driver license valid for jobs outside the US');
  return {blocked:true};
 }
 if(/^if hired can you (?:furnish|provide) proof that you are eligible to work in the country where (?:the|this) job resides$/.test(q))return region==='us'&&citizen&&unique(proof)==='Yes'?confirmed('Yes',proof):{blocked:true};
 if(field.languageRow==='english'&&/^(reading|speaking|writing|understanding|listening)$/.test(q)&&unique('English proficiency')==='Fluent')return confirmed('Fluent','English proficiency',['fluent']);
 const collegeStart=unique('University start month'),collegeEnd=unique('Expected graduation date');
 if(field.educationSchool&&questionKey(field.educationSchool)===questionKey(profile.values.school)&&['from','to actual or expected','start date','end date actual or expected'].includes(q)){
  const month=/^(?:from|start date)$/.test(q)?collegeStart:collegeEnd;
  if(/^\d{4}-\d{2}$/.test(month||'')&&(field.type==='month'||/^yyyy$/i.test(field.placeholder||'')))return confirmed(field.type==='month'?month:month.slice(0,4),'University attendance dates');
 }
 const countryDependent=/^(?:are you|will you be) (?:legally )?(?:authorized|eligible) to work in (?:the|this) country (?:of the job for which you are applying|where (?:this|the) (?:job|role|position) is (?:located|based))$/.test(q)||/^(?:will|do) you (?:now or in the future )?(?:require|need) (?:employer )?sponsorship for an? (?:employment|work) visa$/.test(q);
 const visaAssistance=q==='will you now or in the future require sponsorship for an immigration related employment benefit'||/^(?:will|do) you (?:require|need) (?:employment |work )?visa assistance(?: now or in the future)?(?: from (?:us|our company))?$/.test(q);
 if(visaAssistance||countryDependent||commonQuestion(q)?.question===sponsor){
  const source=visaAssistance||q.includes('sponsorship')?sponsor:auth,region=jobJurisdiction(field.jobLocation||field.workQuestionCountry||'');
  if(region==='us'&&fact(source))return result(fact(source),'Your U.S. work profile and this job’s location');
  const foreign='Do you require employment visa sponsorship for jobs outside the United States?';
  if(region==='foreign'&&source===sponsor&&unique(foreign))return result(unique(foreign),'Your international sponsorship preference');
  return {blocked:true};
 }
 if(/^if yes please indicate visa status$/.test(q)){
  if(citizen&&jobJurisdiction(field.jobLocation||'')==='us'&&field.required&&parent.includes('sponsorship')&&parentValue==='no')
   return confirmed('A citizen of the U.S.','Citizenships',['a citizen of the u s','u s citizen','us citizen']);
  return {blocked:true};
 }
 for(const [name,pattern] of privateRules){
  const wording=q.replace(/^including your current position /,'');
  if(pattern.test(wording)&&unique(name))return {...result(unique(name),'Your confirmed private answer'),requiresReview:true};
 }
 if(q==='country of citizenship'||commonQuestion(field.label)?.question==='Country of citizenship'){
  if(unique('Citizenships')&&unique('Citizenships').includes(';'))return {blocked:true};
 }
 // Full addresses may have been saved in a question rather than a profile field.
 // Split only a confirmed city/state/ZIP suffix; never guess a missing street.
 const address=fact('Street address'),city=profile.values?.city||'',state=profile.values?.state||'';
 let street=address,zip='';
 if(address&&city&&state){
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const stateNames=questionKey(state)==='new jersey'?'(?:NJ|New Jersey)':escape(state);
  const suffix=new RegExp('[,\\s]+'+escape(city)+'[,\\s]+'+stateNames+'[,\\s]+(\\d{5}(?:-\\d{4})?)$','i');
  const match=address.match(suffix);if(match){street=address.slice(0,match.index).replace(/[,\s]+$/,'');zip=match[1];}
 }
 if(commonQuestion(field.label)?.question==='Street address'&&address){
  if(/\b\d{5}(?:-\d{4})?$/.test(address)&&!zip)return {blocked:true};
  return result(street,'Street from your saved address');
 }
 if(/^(zip|postal|zip postal)( code)?$/.test(q)&&zip)return result(zip,'ZIP from your saved address');
 const pursued=fact('Degree being pursued'),school=questionKey(field.educationSchool),college=school&&school===questionKey(profile.values?.school),highSchool=school&&school===questionKey(fact('High school name'));
 if(/^(?:do you (?:have|hold) (?:a )?(?:completed |earned )?bachelor(?: s|s)? degree|have you (?:already )?(?:completed|earned|obtained) (?:a |your )?bachelor(?: s|s)? degree)$/.test(q)){
  const highest=questionKey(fact('Highest completed degree'));
  if(/^(high school diploma|associate(?: s)? degree|some college)$/.test(highest))return confirmed('No','Highest completed degree');
  if(/^bachelor(?: s)?(?: degree| of .+)$/.test(highest))return confirmed('Yes','Highest completed degree');
  return {blocked:true};
 }
 if(q==='from'&&college&&/^\d{4}$/.test(fact('University start year')||''))return result(fact('University start year'),'Start year at this school');
 if(q==='to actual or expected'&&college&&/^\d{4}$/.test(profile.values.graduationYear))return result(profile.values.graduationYear,'Expected graduation year at this school');
 const pendingDegree=field.degreePair&&pursued&&(!school||college)&&!field.highestEducation;
 if(q==='not completed'&&field.type==='checkbox-group'){
  const degree=questionKey(field.rowDegree);
  const current=degree===questionKey(pursued)||/^bachelor/.test(questionKey(pursued))&&['bachelor','bachelors','bachelor s','bachelor s degree','bachelor degree','bachelor of science','bs','b s'].includes(degree);
  if(pendingDegree&&degree&&current&&field.options?.length===1)return {...confirmed('Not Completed','Degree being pursued'),markIncomplete:true};
  return {blocked:true};
 }
 if(q==='degree'||q==='degree type'||commonQuestion(field.label)?.question==='Degree being pursued'){
  if(field.highestEducation&&fact('Highest completed degree'))return confirmed(fact('Highest completed degree'),'Highest completed degree',questionKey(fact('Highest completed degree'))==='high school diploma'?['high school or equivalent','high school diploma ged','high school diploma','secondary education diploma']:undefined);
  if(highSchool)return result(fact('Highest completed degree'),'Completed high-school education',['high school diploma ged','high school diploma','full high school education']);
  if(pursued&&(pendingDegree||college||commonQuestion(field.label)?.question==='Degree being pursued'))return result(pursued,'Degree in progress, not a completed degree',[questionKey(pursued),...(/^bachelor/.test(questionKey(pursued))?['bachelors','bachelor','bachelor s','bachelor degree','bachelor s degree','bachelor of science','b s','bs']:[])]);
  return {blocked:true};
 }
 if(/gpa|grade point average|overall result/.test(q)){
  if(/^(what is your )?(college |university )?gpa scale$/.test(q)&&(college||/college|university/.test(q)))return result(fact('College GPA scale'),'University GPA scale');
  if(highSchool&&fact('High school GPA')&&!/4 0 scale/.test(q))return result(fact('High school GPA'),'High-school GPA only');
  // The resume has no college GPA yet. Never reuse high-school GPA in a college field.
  const gpa=fact('College GPA');if(college&&/^\d(?:\.\d+)?$/.test(gpa||'')&&Number(gpa)<=4)return result(gpa,'Confirmed college GPA');
  if(gpa==='Not available yet'&&(college||/college|university|cumulative/.test(q))&&['select-one','combobox'].includes(field.type))return {...result(gpa,'No college GPA yet; high-school GPA is separate',['not available yet','not available','n a','no gpa yet','not applicable']),requiresReview:true};
  return {blocked:true};
 }
 if(commonQuestion(field.label)?.question==='Current academic standing'&&fact('Current academic standing')==='Freshman')return result('Freshman','Current standing; freshman year is not yet completed',['freshman','first year','first year undergraduate','freshman first year','other please specify','other']);
 if(/^(academic standing details|please specify|other please specify)$/.test(q)&&commonQuestion(field.parentQuestion)?.question==='Current academic standing'&&/other/.test(questionKey(field.parentAnswer))&&fact('Current academic standing'))return result(fact('Current academic standing'),'Current academic standing');
 if(commonQuestion(field.label)?.question==='Preferred work regions'&&fact('Preferred work regions'))return result(fact('Preferred work regions'),'Your preferred work regions');
 if(/^are you available for a summer intern co op may aug$/.test(q)&&unique('Full-time internship availability')==='Summer only; not fall or winter')return {...result('Yes','Available during summer break; check exact start/end dates'),requiresReview:true};
 if(/^source details?$|^if .+ please specify$/.test(q)&&unique('Preferred application source')==='Company website or university'){
  const parent=questionKey(field.parentAnswer);
  if(/university|college/.test(parent)&&profile.values?.school)return result(profile.values.school,'Your university for the selected university source',[questionKey(profile.values.school),'rutgers university new brunswick','rutgers university','rutgers']);
  if(/website|career site|amazon career/.test(parent))return result('Company Website','Details for the selected company source',['company website','our website','company careers website','careers website','amazon jobs']);
  return {blocked:true};
 }
 if(/please indicate your availability for the internship.*select multiple/i.test(field.label)&&unique('Summer internship end date'))return {blocked:true};
 const threshold=ageThreshold(field.label);
 if(threshold!==null){
  const proofs=entries.map(a=>({n:ageThreshold(a.question),yes:questionKey(a.answer)==='yes',no:questionKey(a.answer)==='no'})).filter(a=>a.n!==null);
  if(proofs.some(a=>a.no&&a.n<=threshold)&&proofs.some(a=>a.yes&&a.n>=threshold))return {blocked:true};
  if(proofs.some(a=>a.yes&&a.n>=threshold))return result('Yes','Confirmed age meets this lower or equal threshold',['yes']);
 }
 if(fullTimeQuestion(field.label)&&unique('Full-time internship availability')==='Summer only; not fall or winter'){
  const season=field.applicationSeason||applicationSeason(field.label);
  if(season==='summer-2027')return {...result('Yes','Full-time during summer only'),requiresReview:true};
  if(['fall','autumn','winter'].includes(season))return result('No','Not available full-time in fall or winter');
  return {blocked:true}; // Do not reuse an unconditional old Yes/No for an unknown season.
 }
 if((commonQuestion(q)?.question==='How did you hear about this position?'||/^how (did|do) you (hear|learn|find out) about (this (position|job|role)|us)$/.test(q))&&unique('Preferred application source')==='Company website or university')return result('Company Website','Your preferred application source',['company website','corporate website','our website','company careers website','company career site','employer website','amazon career site','amazon jobs','university college','university recruiting','university','university career center','college university']);
 const date=dateConcept(field.label);
 if(date==='start'||date==='end'){
  if(field.applicationSeason&&field.applicationSeason!=='summer-2027')return {blocked:true};
  const value=unique(date==='start'?'Summer internship start date':'Summer internship end date');
  if(!value)return null;
  if(!/^2027-\d{2}-\d{2}$/.test(value)||now.toISOString().slice(0,10)>value)return {blocked:true};
  return {...result(value,'Summer 2027 availability · review dates for this role'),requiresReview:true};
 }
 if(date==='graduation'){
  const values=entries.filter(a=>dateConcept(a.question)==='graduation').map(a=>a.answer.trim());
  // Never invent a graduation day from a known month or year.
  const months=values.filter(v=>/^\d{4}-\d{2}(?:-\d{2})?$/.test(v)).map(v=>v.slice(0,7));
  if(new Set(months).size===1&&['text','textarea'].includes(field.type)&&!field.placeholder)return result(months[0],'Confirmed expected graduation month');
  if(new Set(months).size===1&&(field.type==='month'||/^YYYY-MM$/i.test(field.placeholder||'')))return {...result(months[0],'Expected graduation month'),requiresReview:true};
 }
 return null;
}
