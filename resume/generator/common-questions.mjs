// Explicitly confirmed answers only. Different age thresholds and sponsorship
// timeframes intentionally remain separate questions.
export const COMMON_QUESTIONS=[
 {question:'Valid driver’s license',aliases:['valid driver s license','do you possess a valid driver s license','do you have a valid drivers license','do you have a valid driver s license'],options:['Yes','No'],review:true},
 {question:'Reliable transportation to project sites and offices',aliases:['reliable transportation to project sites and offices','do you have reliable transportation to project sites and office locations'],options:['Yes','No'],review:true},
 {question:'Compensation expectations',aliases:['compensation expectations','compensation expectations you may provide a range','what are your compensation expectations','what are your salary expectations'],review:true},
 {question:'Street address',aliases:['address','address line','address line 1','street address','street address line 1','address 1']},
 {question:'Degree being pursued',aliases:['degree being pursued','current degree program','what degree are you pursuing'],defaultAnswer:'Bachelor of Science in Mechanical Engineering'},
 {question:'Current academic standing',aliases:['current academic standing','academic standing','class standing','current year of study','please indicate your current academic standing select one'],defaultAnswer:'Freshman'},
 {question:'Preferred work regions',aliases:['preferred work regions','in which of the following u s geographic locations are you willing to work'],defaultAnswer:'Northeast; Mid-Atlantic; Southeast'},
 {question:'College GPA',aliases:['college gpa','university gpa','current college gpa'],defaultAnswer:'Not available yet'},
 {question:'College GPA scale',aliases:['college gpa scale','university gpa scale'],defaultAnswer:'4.0'},
 {question:'High school GPA',aliases:['high school gpa'],defaultAnswer:'4.2'},
 {question:'Full-time student enrollment',aliases:['full time student enrollment','will you be enrolled full time in college university at the time of the internship or co op assignment'],options:['Yes','No'],defaultAnswer:'Yes',review:true},
 {question:'Summer internship start date',aliases:['summer internship start date'],defaultAnswer:'2027-05-13'},
 {question:'Summer internship end date',aliases:['summer internship end date'],defaultAnswer:'2027-08-31'},
 {question:'Full-time internship availability',aliases:['full time internship availability'],defaultAnswer:'Summer only; not fall or winter'},
 {question:'Preferred application source',aliases:['preferred application source'],defaultAnswer:'Company website or university'},
 {question:'Preferred contact method',aliases:['preferred contact method','preferred method of contact','preferred method of communication','how would you prefer to be contacted','how do you prefer to be contacted','how should we contact you','how would you like us to contact you'],options:['Email','Mobile Phone','Home Phone']},
 {question:'Do you have reliable transportation?',aliases:['do you have reliable transportation','do you have a reliable means of transportation','do you have reliable transportation to work','do you have reliable transportation to and from work'],options:['Yes','No']},
 {question:'Post-offer federal background check, physical and drug screen',aliases:['post offer federal background check physical and drug screen','if extended a job offer are you willing to submit to a detailed federal background check pre employment physical and drug screen'],options:['Yes','No']},
 {question:'Sex',options:['Male','Female','I do not wish to self-identify'],aliases:['sex','what is your sex','gender','what is your gender'],review:true},
 {question:'Race / ethnic background',aliases:['race','ethnicity','race ethnicity','race ethnic background','what is your race ethnic background','what is your race ethnicity','what is your race','what is your ethnicity','what is your racial ethnic background'],review:true},
 {question:'Country of citizenship',aliases:['country of citizenship','in which country region do you have citizenship','in which country do you have citizenship','which country are you a citizen of'],review:true},
 {question:'Preferred pronouns',options:['He/Him/His','She/Her/Hers','They/Them/Theirs','Prefer not to say'],aliases:['preferred pronoun','preferred pronouns','pronouns','what are your pronouns'],review:true},
 {question:'Preferred name',aliases:['preferred name','what is your preferred name','what name do you prefer to go by']},
 {question:'Are you 16 years or older?',options:['Yes','No'],aliases:['are you 16 years or older','are you at least 16 years old','are you 16 years of age or older'],review:true},
 {question:'Are you 18 years or older?',options:['Yes','No'],aliases:['are you 18 years or older','are you at least 18 years old','are you 18 years of age or older'],review:true},
 {question:'Are you legally authorized to work in the United States?',options:['Yes','No'],aliases:['are you legally authorized to work in the united states','are you authorized to work in the united states','are you legally authorized to work in the us'],review:true},
 {question:'Will you now or in the future require sponsorship for employment visa status?',options:['Yes','No'],aliases:['will you now or in the future require sponsorship for employment visa status','do you now or will you in the future require sponsorship for employment visa status'],review:true},
 {question:'Are you willing to relocate?',options:['Yes','No'],aliases:['are you willing to relocate','are you open to relocation','would you be willing to relocate']},
 {question:'Are you willing to travel?',options:['Yes','No'],aliases:['are you willing to travel','are you open to travel','would you be willing to travel']},
 {question:'When are you available to start?',aliases:['when are you available to start','when can you start','earliest start date','what is your earliest available start date']},
 {question:'How did you hear about this position?',options:['LinkedIn','Indeed','Company careers website','University career center','Employee referral','Other'],aliases:['how did you hear about this position','how did you hear about this job','how did you hear about us','how did you hear about this role'],review:true},
 {question:'Are you currently enrolled in a university?',options:['Yes','No'],aliases:['are you currently enrolled in a university','are you currently enrolled in college','are you currently enrolled at a university'],review:true},
 {question:'Current university',aliases:['current university','which university are you currently attending','what university do you currently attend']},
 {question:'High school name',aliases:['high school name','name of high school','which high school did you graduate from'],defaultAnswer:'Atlantic County Institute of Technology'},
 {question:'High school graduation year',aliases:['high school graduation year','year of high school graduation','what year did you graduate from high school'],defaultAnswer:'2026'},
 {question:'Highest completed degree',aliases:['highest completed degree','highest degree earned','highest degree obtained','highest level of education completed','what is your highest completed degree'],options:['High school diploma','Associate degree','Bachelor degree','Master degree','Doctorate'],defaultAnswer:'High school diploma'},
 {question:'Employment experience',aliases:['employment experience','work experience','professional experience','employment history','work history'],defaultAnswer:'None'},
 {question:'Research positions',aliases:['research positions','research experience','research employment history'],defaultAnswer:'None'},
 {question:'Residence history',aliases:['residence history','describe your residence history','where have you lived'],defaultAnswer:'I lived in Vietnam before moving to the United States in 2014. I have lived in New Jersey since then.'},
];
export const questionKey=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\b(required|optional)\b/g,'').replace(/\s+/g,' ').trim();
export const commonQuestion=q=>{
 const key=questionKey(q);
 if(key==='will you now or will you in the future require employment visa sponsorship')return COMMON_QUESTIONS.find(item=>item.question.startsWith('Will you now or in the future require sponsorship'));
 if(/^do you have the legal right to work in the u s(?: note .*)?$/.test(key))return COMMON_QUESTIONS.find(item=>item.question==='Are you legally authorized to work in the United States?');
 if(/^will you now or in the future require sponsorship of a temporary work visa(?: e g .*)?$/.test(key))return COMMON_QUESTIONS.find(item=>item.question==='Will you now or in the future require sponsorship for employment visa status?');
 return COMMON_QUESTIONS.find(item=>item.aliases.includes(key));
};

// Derivations are deliberately narrow. No employment does not mean no projects,
// no prior applications, no agreements, or any particular legal eligibility.
export function backgroundAnswer(question,profile,memory=[]){
 const q=questionKey(question),answers=[...(profile.answers||[]),...memory];
 const fact=canonical=>{const matches=answers.filter(a=>commonQuestion(a.question)?.question===canonical);return matches.length&&new Set(matches.map(a=>a.answer.trim())).size===1?matches[0].answer:null;};
 const residence=fact('Residence history');
 const states=[profile.values?.state,...answers.filter(a=>/^(state|province state|state province|current state|state of residence)$/.test(questionKey(a.question))).map(a=>a.answer)].filter(Boolean).map(questionKey);
 const countries=[profile.values?.country,...answers.filter(a=>/^(country|country region|country of residence)$/.test(questionKey(a.question))).map(a=>a.answer)].filter(Boolean).map(questionKey);
 const inNJ=states.length>0&&states.every(s=>['nj','new jersey'].includes(s));
 const noCountryConflict=countries.every(c=>['us','usa','united states','united states of america'].includes(c));
 if(inNJ&&noCountryConflict){
  if(/^(country( region| of residence)?|current country|home country|what country do you (live|reside) in|in (what|which) country do you (live|reside)|where do you currently reside country)$/.test(q))return {value:'United States',sourceQuestion:'Confirmed state: New Jersey → United States'};
  if(/^(do you (currently )?(live|reside) in (the )?(united states|us|usa)|are you (currently )?(living|located|residing) in (the )?(united states|us|usa)|have you (ever )?lived in (the )?(united states|us|usa))$/.test(q))return {value:'Yes',sourceQuestion:'Confirmed state: New Jersey → United States'};
 }
 if(residence===COMMON_QUESTIONS.find(a=>a.question==='Residence history').defaultAnswer&&/^have you (ever )?lived in (the )?(united states|us|usa)$/.test(q))return {value:'Yes',sourceQuestion:'Residence history: New Jersey since 2014 → United States'};
 if(residence===COMMON_QUESTIONS.find(a=>a.question==='Residence history').defaultAnswer&&/^(current |home )?country( of residence)?$/.test(q))return {value:'United States',sourceQuestion:'Residence history'};
 const noWork=questionKey(fact('Employment experience'))==='none',noResearch=questionKey(fact('Research positions'))==='none';
 if(noWork&&/^(do you have (any )?(work|employment|professional work|professional) experience|have you (ever |previously )?been employed( by [a-z0-9 ]+)?|are you currently employed( by [a-z0-9 ]+)?|do you have previous [a-z0-9 ]+ intern co op experience)$/.test(q))return {value:'No',sourceQuestion:'Employment experience'};
 if(noWork&&/^(years of (work|employment|professional work|professional) experience|how many years of (work|employment|professional work|professional) experience do you have)$/.test(q))return {value:'0',sourceQuestion:'Employment experience'};
 if(noWork&&/^(current employer|most recent employer|previous employer|current job title|most recent job title)$/.test(q))return {value:'None',sourceQuestion:'Employment experience'};
 if(noResearch&&/^(do you have (any )?research experience|have you (ever )?held (a |any )research positions?|do you (currently )?hold a research position)$/.test(q))return {value:'No',sourceQuestion:'Research positions'};
 return null;
}
