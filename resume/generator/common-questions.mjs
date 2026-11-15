// Explicitly confirmed answers only. Different age thresholds and sponsorship
// timeframes intentionally remain separate questions.
export const COMMON_QUESTIONS=[
 {question:'Sex',options:['Male','Female','I do not wish to self-identify'],aliases:['sex','what is your sex'],review:true},
 {question:'Preferred pronouns',options:['He/Him/His','She/Her/Hers','They/Them/Theirs','Prefer not to say'],aliases:['preferred pronoun','preferred pronouns','pronouns','what are your pronouns'],review:true},
 {question:'Preferred name',aliases:['preferred name','what is your preferred name','what name do you prefer to go by']},
 {question:'Are you 16 years or older?',options:['Yes','No'],aliases:['are you 16 years or older','are you at least 16 years old','are you 16 years of age or older'],review:true},
 {question:'Are you 18 years or older?',options:['Yes','No'],aliases:['are you 18 years or older','are you at least 18 years old','are you 18 years of age or older'],review:true},
 {question:'Are you legally authorized to work in the United States?',options:['Yes','No'],aliases:['are you legally authorized to work in the united states','are you authorized to work in the united states','are you legally authorized to work in the us'],review:true},
 {question:'Will you now or in the future require sponsorship for employment visa status?',options:['Yes','No'],aliases:['will you now or in the future require sponsorship for employment visa status','do you now or will you in the future require sponsorship for employment visa status'],review:true},
 {question:'Are you willing to relocate?',options:['Yes','No'],aliases:['are you willing to relocate','are you open to relocation','would you be willing to relocate']},
 {question:'Are you willing to travel?',options:['Yes','No'],aliases:['are you willing to travel','are you open to travel','would you be willing to travel']},
 {question:'When are you available to start?',aliases:['when are you available to start','when can you start','earliest start date','what is your earliest available start date']},
 {question:'How did you hear about this position?',options:['LinkedIn','Indeed','Company careers website','University career center','Employee referral','Other'],aliases:['how did you hear about this position','how did you hear about this job','how did you hear about us'],review:true},
 {question:'Are you currently enrolled in a university?',options:['Yes','No'],aliases:['are you currently enrolled in a university','are you currently enrolled in college'],review:true},
];
export const questionKey=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\b(required|optional)\b/g,'').replace(/\s+/g,' ').trim();
export const commonQuestion=q=>COMMON_QUESTIONS.find(item=>item.aliases.includes(questionKey(q)));
