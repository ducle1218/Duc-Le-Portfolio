const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function suggestField(field,profile){
 if(!profile?.confirmed)return null;
 const label=normalize(field.label).replace(/\b(required|optional)\b/g,'').trim();
 if(!label||/password|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|gender|race|ethnic|pronoun|birth|social security|consent|agree|certify|signature|salary|compensation|gpa|completed|previous|reference|emergency|guardian|parent|referr|manager|supervisor/.test(label))return null;
 if(!['text','email','tel','url','textarea','select-one','number'].includes(field.type)||field.filled||field.disabled)return null;
 const patterns={firstName:/^(legal )?(first|given) name$/,lastName:/^(legal )?(last name|family name|surname)$/,fullName:/^(legal |full |legal full )?name$/,email:/^(personal |primary |contact )?e ?mail( address)?$/,phone:/^(primary |contact |mobile |cell )?(phone|telephone)( number)?$/,city:/^(current |home )?city$/,state:/^(current |home )?(state|province|state province)$/,postalCode:/^(zip|postal|zip postal)( code)?$/,country:/^(current |home )?country( of residence)?$/,school:/^(current )?(university|school|college|school university|university college)( name)?$/,major:/^(major|field of study|academic major)$/,graduationYear:/^(expected |anticipated )graduation year$/,portfolio:/^(portfolio|personal website|portfolio website)( url| link)?$/,linkedin:/^linkedin( profile)?( url| link)?$/,github:/^github( profile)?( url| link)?$/};
 const key=Object.keys(patterns).find(k=>patterns[k].test(label));const custom=(profile.answers||[]).filter(a=>normalize(a.question)===label);
 const value=key==='fullName'?[profile.values.firstName,profile.values.lastName].filter(Boolean).join(' '):key?profile.values[key]:custom.length===1?custom[0].answer:null;
 if(!value||(field.maxLength>0&&value.length>field.maxLength))return null;
 if(field.type==='select-one'){
  const aliases=key==='state'&&normalize(value)==='new jersey'?['new jersey','nj']:key==='country'&&['us','usa','united states'].includes(normalize(value))?['united states','united states of america','us','usa']:[normalize(value)];
  const matches=(field.options||[]).filter(o=>!o.disabled&&(aliases.includes(normalize(o.label))||aliases.includes(normalize(o.value))));if(matches.length!==1)return null;return {value:matches[0].value,display:matches[0].label};
 }
 return {value,display:value};
}
export function scanForm(){
 const label=e=>([...(e.labels||[])].map(l=>l.innerText).join(' ')||e.getAttribute('aria-label')||(e.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.innerText||'').join(' ')||e.placeholder||'').trim().slice(0,250);
 const fields=[...document.querySelectorAll('input,select,textarea')].map((e,index)=>({index,label:label(e),type:e.type||e.tagName.toLowerCase(),name:e.name||'',id:e.id||'',maxLength:e.maxLength,filled:!!e.value&&!(e.tagName==='SELECT'&&e.selectedIndex===0&&/select|choose|please/i.test(e.options[0]?.textContent||'')),disabled:e.disabled||e.readOnly,visible:!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden',options:e.tagName==='SELECT'?[...e.options].map(o=>({value:o.value,label:o.textContent,disabled:o.disabled})):undefined})).filter(e=>e.visible).slice(0,150);
 return {url:location.href,fields,embeddedForms:document.querySelectorAll('iframe').length};
}
export function fillForm({url,fields}){
 if(location.href!==url)return {filled:0,skipped:fields.length,changed:true};
 const elements=[...document.querySelectorAll('input,select,textarea')];let filled=0,skipped=0;
 for(const f of fields){const e=elements[f.index];const label=e&&([...(e.labels||[])].map(l=>l.innerText).join(' ')||e.getAttribute('aria-label')||(e.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.innerText||'').join(' ')||e.placeholder||'').trim().slice(0,250);
  const empty=e&&(!e.value||(e.tagName==='SELECT'&&e.selectedIndex===0&&/select|choose|please/i.test(e.options[0]?.textContent||'')));
  if(!e||!empty||e.disabled||e.readOnly||!e.getClientRects().length||getComputedStyle(e).visibility==='hidden'||label!==f.label||(e.type||e.tagName.toLowerCase())!==f.type||(e.name||'')!==f.name||(e.id||'')!==f.id){skipped++;continue;}
  const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,'value').set.call(e,f.value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));filled++;
 }
 return {filled,skipped};
}
