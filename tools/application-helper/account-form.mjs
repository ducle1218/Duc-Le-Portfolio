// Executed in the active tab only after an account action in the popup.
export function employerAccountForm({url,signup,email,password,inspectOnly=false,automatic=false}){
 try{return run();}catch(error){return {error:error.message};}
 function run(){
 if(location.href!==url||location.protocol!=='https:')throw Error('The page changed. Reopen the helper on the employer website.');
 const visible=el=>!el.disabled&&!el.readOnly&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
 const passwords=[...document.querySelectorAll('input[type=password]')].filter(visible);
 const shown=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
 const scopes=new Set(passwords.map(el=>el.form||el.closest('[role="dialog"],main,[role="main"]')||document.body));
 const candidates=[];
 for(const scope of scopes){
  const fields=passwords.filter(el=>(el.form||el.closest('[role="dialog"],main,[role="main"]')||document.body)===scope);
  if(fields.length>2)continue;
  const inputs=[...scope.querySelectorAll('input')].filter(el=>shown(el)&&(!el.form||el.form===scope));
  const emails=inputs.filter(el=>el.type==='email'||(['text',''].includes(el.type)&&/email|user.?name/i.test([el.name,el.id,el.autocomplete,el.getAttribute('aria-label')].join(' '))));
  if(emails.length!==1)continue;
  if(scope.action&&new URL(scope.action,url).origin!==location.origin)continue;
  const controls=[...scope.querySelectorAll('button,input[type=submit],[role=button]')].filter(el=>shown(el)&&(!el.form||el.form===scope));
  const title=el=>(el.innerText||el.textContent||el.value||el.getAttribute('aria-label')||'').trim();
  const heading=[...scope.querySelectorAll('legend,h1,h2,[role=heading]')].map(title).join(' ');
  if(/(?:reset|forgot|recover|change)[-_ /]*(?:your[-_ /]*)?password/i.test(heading+' '+location.pathname))continue;
  const create=controls.filter(el=>/^(?:create (?:an? |my )?account|register|sign up)$/i.test(title(el)));
  const login=controls.filter(el=>/^(?:sign ?in|log ?in)$/i.test(title(el)));
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
  candidates.push({fields,emailField:emails[0],buttons,registration});
 }
 if(automatic&&candidates.length!==1)return null;
 if(candidates.length!==1)throw Error(signup?'Open a registration form with an email, password and confirmation field.':'Open a sign-in form with an email and password field.');
 const {fields,emailField,buttons,registration}=candidates[0];
 if((emailField.readOnly||emailField.disabled)&&!emailField.value.trim())throw Error('The employer must populate the account email before scanning.');
 if(emailField.value.trim()&&emailField.value.trim().toLowerCase()!==email.toLowerCase())throw Error('The form contains a different email. Check the account before continuing.');
 const max=Math.min(...fields.map(el=>el.maxLength>=0?el.maxLength:Infinity));
 const min=Math.max(1,...fields.map(el=>el.minLength||0));
 if(!password)return automatic?{signup:registration,min,max:Number.isFinite(max)?max:128}:true;
 if(registration&&(password.length>max||password.length<min||fields.some(el=>{
  const probe=el.cloneNode(false);probe.value=password;return probe.validity?.patternMismatch;
 })))throw Error('This site rejects the shared password format. Review its password requirements.');
 if(inspectOnly)return true;
 if(fields.some(el=>el.value&&el.value!==password))throw Error('A password field already has a different value. Clear it before using this account.');
 function fill(el,value){
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);
  for(const event of ['input','change'])el.dispatchEvent(new Event(event,{bubbles:true}));
 }
 if(!emailField.readOnly&&!emailField.disabled)fill(emailField,email);
 for(const field of fields)fill(field,password);
 if(!fields.every(el=>el.isConnected&&el.value===password)||!emailField.isConnected||emailField.value.trim().toLowerCase()!==email.toLowerCase())throw Error('The form changed while filling. Review the account fields.');
 const button=buttons[0];
 if((registration||automatic)&&buttons.length===1&&visible(button)&&button.getAttribute('aria-disabled')!=='true'&&(!button.formAction||new URL(button.formAction,url).origin===location.origin)&&(!button.form||button.form.checkValidity())){
  button.click();if(!registration)return 'Sign-in requested. Check the website for verification or the next step.';return 'Registration requested. Check the website for confirmation or email verification.';
 }
 return registration?'Account fields filled. Review any required fields and use the website’s Create account button.':'Saved login filled. Choose Sign in on the website.';
 }
}
