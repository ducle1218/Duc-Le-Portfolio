// Executed in the active tab only after an account action in the popup.
export function employerAccountForm({url,signup,email,password,inspectOnly=false}){
 try{return run();}catch(error){return {error:error.message};}
 function run(){
 if(location.href!==url||location.protocol!=='https:')throw Error('The page changed. Reopen the helper on the employer website.');
 const visible=el=>!el.disabled&&!el.readOnly&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
 const passwords=[...document.querySelectorAll('input[type=password]')].filter(visible);
 const expected=signup?2:1;
 const scopes=new Set(passwords.map(el=>el.form||el.closest('[role="dialog"],main,[role="main"]')||document.body));
 const candidates=[];
 for(const scope of scopes){
  const fields=passwords.filter(el=>(el.form||el.closest('[role="dialog"],main,[role="main"]')||document.body)===scope);
  if(fields.length!==expected||fields.some(el=>el.autocomplete===(signup?'current-password':'new-password')))continue;
  const inputs=[...scope.querySelectorAll('input')].filter(el=>visible(el)&&(!el.form||el.form===scope));
  const emails=inputs.filter(el=>el.type==='email'||(['text',''].includes(el.type)&&/email|user.?name/i.test([el.name,el.id,el.autocomplete,el.getAttribute('aria-label')].join(' '))));
  if(emails.length!==1)continue;
  const createButtons=[...scope.querySelectorAll('button,input[type=submit],[role=button]')].filter(el=>/^(?:create (?:an? |my )?account|register|sign up)$/i.test((el.innerText||el.textContent||el.value||el.getAttribute('aria-label')||'').trim()));
  if(scope.action&&new URL(scope.action,url).origin!==location.origin)continue;
  candidates.push({scope,fields,emailField:emails[0],createButtons});
 }
 if(candidates.length!==1)throw Error(signup?'Open a registration form with an email, password and confirmation field.':'Open a sign-in form with an email and password field.');
 const {fields,emailField,createButtons}=candidates[0];
 if(emailField.value.trim()&&emailField.value.trim().toLowerCase()!==email.toLowerCase())throw Error('The form contains a different email. Check the account before continuing.');
 const max=Math.min(...fields.map(el=>el.maxLength>=0?el.maxLength:Infinity));
 const min=Math.max(1,...fields.map(el=>el.minLength||0));
 if(!password)return true;
 if(signup&&(password.length>max||password.length<min||fields.some(el=>{
  const probe=el.cloneNode(false);probe.value=password;return probe.validity?.patternMismatch;
 })))throw Error('This site rejects the shared password format. Review its password requirements.');
 if(inspectOnly)return true;
 if(fields.some(el=>el.value&&el.value!==password))throw Error('A password field already has a different value. Clear it before using this account.');
 function fill(el,value){
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);
  for(const event of ['input','change'])el.dispatchEvent(new Event(event,{bubbles:true}));
 }
 fill(emailField,email);for(const field of fields)fill(field,password);
 if(!fields.every(el=>el.isConnected&&el.value===password)||!emailField.isConnected||emailField.value!==email)throw Error('The form changed while filling. Review the account fields.');
 const button=createButtons[0];
 if(signup&&createButtons.length===1&&visible(button)&&button.getAttribute('aria-disabled')!=='true'&&(!button.formAction||new URL(button.formAction,url).origin===location.origin)&&(!button.form||button.form.checkValidity())){
  button.click();return 'Registration requested. Check the website for confirmation or email verification.';
 }
 return signup?'Account fields filled. Review any required fields and use the website’s Create account button.':'Saved login filled. Choose Sign in on the website.';
 }
}
