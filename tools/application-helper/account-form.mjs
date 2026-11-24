// Executed in the active tab only after an account action in the popup.
export function employerAccountForm({url,signup,email,password,inspectOnly=false,automatic=false,afterEmail=false,openRegistration=false,openLogin=false,useFilledLogin=false,embedded=false,identity={},recruiterVisibility}){
 try{return run();}catch(error){return {error:error.message};}
 function run(){
 if(location.href!==url||location.protocol!=='https:')throw Error('The page changed. Reopen the helper on the employer website.');
 const visible=el=>!el.disabled&&!el.readOnly&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
 if(embedded){
  const caption=el=>[el.name,el.id,el.getAttribute('aria-label'),...[...(el.labels||[])].map(l=>l.textContent)].join(' ').toLowerCase();
  const forms=[...document.forms].filter(form=>form.querySelectorAll('input[type=password]').length===2&&[...form.querySelectorAll('input,select,textarea')].some(el=>visible(el)&&!(/e.?mail/i.test(caption(el)))&&/\b(?:address|city|postal|state|degree|school|resume|contact method)\b/i.test(caption(el))));
  if(forms.length!==1)return null;
  const form=forms[0],pair=[...form.querySelectorAll('input[type=password]')];
  const confirmations=pair.filter(el=>/confirm|repeat|verify|re.?type|re.?enter/i.test(caption(el)));
  if(confirmations.length!==1||pair.some(el=>el.autocomplete==='current-password'||/\b(?:current|old|previous) password\b/.test(caption(el))))return null;
  const confirm=confirmations[0],first=pair.find(el=>el!==confirm);
  if(!form.contains(first)||confirm.form!==form||first.form!==form||new URL(form.action||url,url).origin!==location.origin||[...form.querySelectorAll('[formaction]')].some(b=>new URL(b.formAction,url).origin!==location.origin))return null;
  const emails=[...form.querySelectorAll('input')].filter(el=>el.form===form&&visible(el)&&(el.type==='email'||el.type==='text'&&/e.?mail/i.test(caption(el))));
  const repeats=emails.filter(el=>/re.?type|confirm|repeat|verify|re.?enter/i.test(caption(el)));
  const primary=emails.filter(el=>!repeats.includes(el));
  if(primary.length!==1||repeats.length>1||!email)return null;
  const identity=primary[0];
  if(repeats.some(el=>el.value&&el.value.trim().toLowerCase()!==email.toLowerCase()))return {mixed:true,available:false};
  if(inspectOnly&&(first.value||confirm.value||identity.value&&identity.value.trim().toLowerCase()!==email.toLowerCase()))return {mixed:true,available:false};
  if(identity.value&&identity.value.trim().toLowerCase()!==email.toLowerCase())throw Error('The application uses a different email from your employer account.');
  if(first.value||confirm.value)return null;
  const rules=form.innerText||form.textContent||'';
  const alphanumeric=/only (?:contain|use) letters and numbers/i.test(rules)||first.id==='ohpassword'&&confirm.id==='ohconfirmpassword';
  const statedMin=Number(rules.match(/(?:at least|minimum of) (\d+) characters/i)?.[1]||0);
  const min=Math.max(statedMin,alphanumeric?8:1,...pair.map(el=>el.minLength||0));
  const statedMax=Number(rules.match(/(?:not be longer than|maximum of|no more than) (\d+)\b/i)?.[1]||128);
  const max=Math.min(statedMax,alphanumeric?30:128,...pair.map(el=>el.maxLength>0?el.maxLength:128));
  if(inspectOnly)return {mixed:true,available:true,signup:true,min,max,alphanumeric};
  if(!password||password.length<min||password.length>max||alphanumeric&&(!/^[A-Za-z0-9]+$/.test(password)||!/[A-Z]/.test(password))||pair.some(el=>{const copy=el.cloneNode(false);copy.value=password;return copy.validity.patternMismatch;}))throw Error('The saved password does not match the password requirements on this form.');
  fill(identity,email);for(const repeat of repeats)fill(repeat,email);identity.focus();identity.blur();first.focus();
  if(!visible(first)||!visible(confirm))throw Error('The employer has not enabled both password fields yet.');
  for(const el of [first,confirm])fill(el,password);
  return first.value===password&&confirm.value===password?'Employer email and password filled.':null;
 }
 const passwords=[...document.querySelectorAll('input[type=password]')].filter(visible);
 const shown=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
 const amazon=location.hostname==='passport.amazon.jobs';
 const headings=[...document.querySelectorAll('h1,h2,h3,[role=heading]')].filter(h=>shown(h)&&/^(?:sign in|log in|log in or create (?:an? )?account)$/i.test(h.textContent.trim()));
 if(!passwords.length&&!afterEmail&&headings.length===1){
  const authScope=headings[0].closest('[role=dialog],dialog,form,main')||document;
  const emails=[...authScope.querySelectorAll('input[type=email],input[autocomplete=username],input[name=email],input[id=email]')].filter(visible);
  if(emails.length!==1||!email)return null;
  const input=emails[0],scope=input.form||input.closest('dialog,[role=dialog],main,[role=main]')||document.body;
  const buttons=[...scope.querySelectorAll('button,input[type=submit]')].filter(b=>shown(b)&&/^continue$/i.test((b.textContent||b.value||'').trim()));
  if(buttons.length!==1||scope.action&&new URL(scope.action,url).origin!==location.origin||buttons[0].hasAttribute('formaction')&&new URL(buttons[0].formAction,url).origin!==location.origin)return null;
  if(input.value&&input.value.trim().toLowerCase()!==email.toLowerCase())throw Error('The form contains a different email.');
  if(inspectOnly)return {emailStep:true};
  fill(input,email);
  if(input.value!==email||!visible(buttons[0])||buttons[0].getAttribute('aria-disabled')==='true'||input.form&&!input.form.checkValidity())throw Error('Check the email on the sign-in page and choose Continue.');
  buttons[0].click();return {emailStep:true};
 }
 const scopes=new Set(passwords.map(el=>el.form||el.closest('[role="dialog"],main,[role="main"]')||document.body));
 const candidates=[];
 for(const scope of scopes){
  const fields=passwords.filter(el=>(el.form||el.closest('[role="dialog"],main,[role="main"]')||document.body)===scope);
  if(fields.length>2)continue;
  const inputs=[...scope.querySelectorAll('input')].filter(el=>shown(el)&&(!el.form||el.form===scope));
  const emails=inputs.filter(el=>el.type==='email'||(['text',''].includes(el.type)&&/email|user.?name/i.test([el.name,el.id,el.autocomplete,el.getAttribute('aria-label'),...[...(el.labels||[])].map(l=>l.textContent)].join(' '))));
  const repeatEmails=emails.filter(el=>/re.?type|confirm|repeat|verify|re.?enter/i.test([el.name,el.id,el.getAttribute('aria-label'),...[...(el.labels||[])].map(l=>l.textContent)].join(' ')));
  const primaryEmails=emails.filter(el=>!repeatEmails.includes(el));
  if(repeatEmails.length>1||primaryEmails.length!==1&&!(amazon&&afterEmail&&emails.length===0))continue;
  if(scope.action&&new URL(scope.action,url).origin!==location.origin)continue;
  const controls=[...scope.querySelectorAll('button,input[type=submit],[role=button]')].filter(el=>shown(el)&&(!el.form||el.form===scope));
  const title=el=>(el?.innerText||el?.textContent||el?.value||el?.getAttribute?.('aria-label')||'').trim();
  const heading=[...scope.querySelectorAll('legend,h1,h2,[role=heading]')].map(title).join(' ')||title(document.querySelector('h1')||scope.querySelector('legend')||{});
  if(/(?:reset|forgot|recover|change)[-_ /]*(?:your[-_ /]*)?password/i.test(heading+' '+location.pathname))continue;
  function actions(pattern){
   const matches=controls.filter(el=>pattern.test(title(el)));
   // Some forms expose both a styled button wrapper and its native submitter.
   const submitters=matches.filter(el=>el.form===scope&&el.type==='submit');
   if(submitters.length===1&&matches.every(el=>el===submitters[0]||!el.matches('button,input')))return submitters;
   return matches.filter(el=>!matches.some(child=>child!==el&&el.contains(child)));
  }
  const create=actions(/^(?:create (?:an? |my |your )?(?:amazon jobs? )?account|register|sign up)$/i);
  const login=actions(/^(?:sign ?in|log ?in)$/i);
  if(!create.length&&/\b(?:create|register) (?:an? |your )?(?:new )?account\b/i.test(heading)){
   const next=actions(/^continue$/i);if(next.length===1)create.push(next[0]);
  }
  if(amazon&&afterEmail&&!create.length&&!login.length){
   const next=controls.filter(el=>/^continue$/i.test(title(el)));
   if(next.length===1){
    if(fields.length===2&&fields.some(el=>el.autocomplete==='new-password')||/create (?:an? |your )?(?:amazon jobs? )?(?:account|password)/i.test(heading))create.push(next[0]);
    else if(fields.length===1&&fields[0].autocomplete==='current-password')login.push(next[0]);
   }
  }
  let registration=signup;
  if(automatic){
   const submits=el=>el.form===scope&&el.type==='submit';
   if(create.length===1&&(!login.length||fields.length===2||submits(create[0])&&!login.some(submits)))registration=true;
   else if(login.length===1&&(!create.length||submits(login[0])&&!create.some(submits)))registration=false;
   else continue;
   if(signup!==undefined&&registration!==signup)continue;
  }
  if(!registration&&fields.length!==1||fields.some(el=>el.autocomplete===(registration?'current-password':'new-password')))continue;
  if(!automatic&&registration&&fields.length!==2)continue;
  const buttons=registration?create:login;
  if(buttons.some(el=>el.hasAttribute('formaction')&&new URL(el.getAttribute('formaction'),url).origin!==location.origin))continue;
  if(repeatEmails.length&&!registration)continue;
  candidates.push({fields,emailField:primaryEmails[0],repeatEmail:repeatEmails[0],buttons,registration});
 }
 if(automatic&&candidates.length!==1)return null;
 if(candidates.length!==1)throw Error(signup?'Open a registration form with an email, password and confirmation field.':'Open a sign-in form with an email and password field.');
 const {fields,emailField,repeatEmail,buttons,registration}=candidates[0];
 if(emailField&&(emailField.readOnly||emailField.disabled)&&!emailField.value.trim())throw Error('The employer must populate the account email before scanning.');
 if(emailField?.value.trim()&&emailField.value.trim().toLowerCase()!==email.toLowerCase())throw Error('The form contains a different email. Check the account before continuing.');
 if(automatic&&!registration&&emailField?.value.trim().toLowerCase()===email.toLowerCase()&&fields[0].value&&buttons.length===1){
  if(inspectOnly)return {filledLogin:true};
  if(useFilledLogin&&visible(buttons[0])&&buttons[0].getAttribute('aria-disabled')!=='true'&&(!buttons[0].form||buttons[0].form.checkValidity())){
   buttons[0].click();return 'Sign-in requested using the login already filled in this browser.';
  }
 }
 if(useFilledLogin)return null;
 if(repeatEmail?.value&&repeatEmail.value.trim().toLowerCase()!==email.toLowerCase())throw Error('The confirmation email differs from the account email.');
 if(openRegistration||openLogin){
  if(openLogin!==registration)return null;
  const links=[...document.querySelectorAll('a[href],button,input[type=button],[role=button]')].filter(b=>{
   if(!visible(b)||b.getAttribute('aria-disabled')==='true'||b.form&&b.type==='submit')return false;
   if(b.href&&new URL(b.href,url).origin!==location.origin)return false;
   const pattern=openLogin?/^(?:sign in|log in)$/i:/^(?:new user|create (?:an? )?account|sign up|register)$/i;
   return pattern.test((b.innerText||b.textContent||b.value||'').trim());
  });
  if(links.length!==1)return null;
  links[0].click();return {opened:true};
 }
 const statedMaximum=Number((fields[0].form?.innerText||'').match(/(?:not be longer than|maximum of|no more than) (\d+)\b/i)?.[1]||128);
 const max=Math.min(statedMaximum,...fields.map(el=>el.maxLength>=0?el.maxLength:Infinity));
 const min=Math.max(1,...fields.map(el=>el.minLength||0));
 const rules=fields[0].form?.innerText||'';
 const alphanumeric=/only (?:contain|use) letters and numbers|letters and numbers only/i.test(rules);
 if(!password)return automatic?{signup:registration,min,max:Number.isFinite(max)?max:128,alphanumeric}:true;
 if(registration&&(password.length>max||password.length<min||fields.some(el=>{
  const probe=el.cloneNode(false);probe.value=password;return probe.validity?.patternMismatch;
 })))throw Error('This site rejects the shared password format. Review its password requirements.');
 if(inspectOnly)return true;
 if(fields.some(el=>el.value&&el.value!==password))throw Error('A password field already has a different value. Clear it before using this account.');
 function fill(el,value){
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);
  for(const event of ['input','change'])el.dispatchEvent(new Event(event,{bubbles:true}));
 }
 if(emailField&&!emailField.readOnly&&!emailField.disabled)fill(emailField,email);
 if(repeatEmail)fill(repeatEmail,email);
 for(const field of fields)fill(field,password);
 if(!fields.every(el=>el.isConnected&&el.value===password)||emailField&&(!emailField.isConnected||emailField.value.trim().toLowerCase()!==email.toLowerCase()))throw Error('The form changed while filling. Review the account fields.');
 if(registration&&buttons.length===1){
  const scope=fields[0].form||buttons[0].closest('[role=dialog],main,[role=main]')||[...scopes][0];
  const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z]+/g,' ').trim();
  for(const el of scope.querySelectorAll('input,select')){
   if(!visible(el))continue;
   const name=normalize([...(el.labels||[])].map(l=>l.textContent).join(' ')||el.getAttribute('aria-label')||el.name);
   if(el.tagName==='SELECT'&&/^(?:country|country region)(?: of residence)?$/.test(name)&&identity.country&&(!el.value||/select|choose/i.test(el.selectedOptions?.[0]?.textContent||''))){
    const options=[...el.options].filter(o=>!o.disabled&&normalize(o.textContent).replace(/ of america$/,'')===normalize(identity.country).replace(/ of america$/,''));
    if(options.length===1){el.value=options[0].value;el.dispatchEvent(new Event('change',{bubbles:true}));}
   }else if(el.tagName==='INPUT'&&!el.value&&/^(?:legal )?(first|last) name$/.test(name)){
    const value=name.includes('first')?identity.firstName:identity.lastName;if(value)fill(el,value);
   }
  }
  if(recruiterVisibility==='Only recruiters managing jobs I apply to'){
   const choices=[...scope.querySelectorAll('input[type=radio]')].filter(radio=>
    [...radio.labels||[]].some(label=>label.textContent.trim().toLowerCase()===recruiterVisibility.toLowerCase())||
    radio.getAttribute('aria-label')?.trim().toLowerCase()===recruiterVisibility.toLowerCase());
   if(choices.length===1&&!choices[0].checked){
    choices[0].click();
    if(!choices[0].checked)throw Error('Select your recruiter visibility before creating this account.');
   }
  }
  for(const box of scope.querySelectorAll('input[type=checkbox]')){
   const words=([...(box.labels||[])].map(l=>l.textContent.trim()).join(' ')||box.getAttribute('aria-label')||(box.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' ')||box.closest('label')?.textContent||'').replace(/\s+/g,' ').trim();
   if(!box.checked&&!box.disabled&&/^(?:yes,? )?i (?:have read and (?:consent|agree) to|agree to|accept) (?:the |these )?terms (?:and conditions|of use|of service)[. *]*$/i.test(words))box.click();
  }
 }
 const button=buttons[0];
 if((registration||automatic)&&buttons.length===1&&visible(button)&&button.getAttribute('aria-disabled')!=='true'&&(!button.formAction||new URL(button.formAction,url).origin===location.origin)&&(!button.form||button.form.checkValidity())){
  button.click();if(!registration)return 'Sign-in requested. Check the website for verification or the next step.';return 'Registration requested. Check the website for confirmation or email verification.';
 }
 return registration?'Account fields filled. Review any required fields and use the website’s Create account button.':'Saved login filled. Choose Sign in on the website.';
 }
}
