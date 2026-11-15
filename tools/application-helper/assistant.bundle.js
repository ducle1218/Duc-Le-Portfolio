(() => {
  // tools/application-helper/answer-memory.mjs?v=20261115.2
  var normalizeQuestion = (value) => String(value || "").toLowerCase().replace(/[’']/g, "").replace(/\+/g, " plus ").replace(/#/g, " sharp ").replace(/%/g, " percent ").replace(/-(?=\d)/g, " minus ").replace(/(\d)\.(?=\d)/g, "$1 decimal ").replace(/[^a-z0-9]+/g, " ").replace(/\b(required|optional)\b/g, "").replace(/\s+/g, " ").trim();
  var privateQuestion = (q) => /password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(normalizeQuestion(q));
  var equivalents = [
    ["when can you start", "when are you available to start", "what is your earliest start date", "what is your earliest available start date", "earliest start date", "available start date", "availability to start", "when would you be available to start"],
    ["are you willing to relocate", "are you open to relocation", "would you be willing to relocate", "willing to relocate", "open to relocation"],
    ["are you willing to travel", "are you open to travel", "would you be willing to travel", "willing to travel"],
    ["what is your preferred name", "preferred name", "what name do you prefer to go by"],
    ["what is your preferred contact method", "preferred contact method", "how do you prefer to be contacted"]
  ];
  function questionConcept(question) {
    const q = normalizeQuestion(question);
    const i = equivalents.findIndex((group) => group.includes(q));
    return i < 0 ? null : "equivalent-" + i;
  }
  function memoryMatch(question, entries, origin, context = "") {
    if (privateQuestion(question)) return null;
    const q = normalizeQuestion(question), concept = questionConcept(question);
    const available = entries.filter((a) => a.scope === "*" || a.scope === origin && a.context && a.context === context);
    let matches = available.filter((a) => normalizeQuestion(a.question) === q), kind = "Saved answer \xB7 same question";
    if (!matches.length && concept) {
      matches = available.filter((a) => questionConcept(a.question) === concept);
      kind = "Saved answer \xB7 equivalent wording";
    }
    const scoped = matches.filter((a) => a.scope === origin);
    if (scoped.length) matches = scoped;
    if (!matches.length || new Set(matches.map((a) => a.answer.trim())).size !== 1) return null;
    return { value: matches[0].answer, question: matches[0].question, reason: kind };
  }

  // tools/application-helper/common-questions.mjs?v=20261115.2
  var COMMON_QUESTIONS = [
    { question: "Sex", options: ["Male", "Female", "I do not wish to self-identify"], aliases: ["sex", "what is your sex"], review: true },
    { question: "Preferred pronouns", options: ["He/Him/His", "She/Her/Hers", "They/Them/Theirs", "Prefer not to say"], aliases: ["preferred pronoun", "preferred pronouns", "pronouns", "what are your pronouns"], review: true },
    { question: "Preferred name", aliases: ["preferred name", "what is your preferred name", "what name do you prefer to go by"] },
    { question: "Are you 16 years or older?", options: ["Yes", "No"], aliases: ["are you 16 years or older", "are you at least 16 years old", "are you 16 years of age or older"], review: true },
    { question: "Are you 18 years or older?", options: ["Yes", "No"], aliases: ["are you 18 years or older", "are you at least 18 years old", "are you 18 years of age or older"], review: true },
    { question: "Are you legally authorized to work in the United States?", options: ["Yes", "No"], aliases: ["are you legally authorized to work in the united states", "are you authorized to work in the united states", "are you legally authorized to work in the us"], review: true },
    { question: "Will you now or in the future require sponsorship for employment visa status?", options: ["Yes", "No"], aliases: ["will you now or in the future require sponsorship for employment visa status", "do you now or will you in the future require sponsorship for employment visa status"], review: true },
    { question: "Are you willing to relocate?", options: ["Yes", "No"], aliases: ["are you willing to relocate", "are you open to relocation", "would you be willing to relocate"] },
    { question: "Are you willing to travel?", options: ["Yes", "No"], aliases: ["are you willing to travel", "are you open to travel", "would you be willing to travel"] },
    { question: "When are you available to start?", aliases: ["when are you available to start", "when can you start", "earliest start date", "what is your earliest available start date"] },
    { question: "How did you hear about this position?", options: ["LinkedIn", "Indeed", "Company careers website", "University career center", "Employee referral", "Other"], aliases: ["how did you hear about this position", "how did you hear about this job", "how did you hear about us"], review: true },
    { question: "Are you currently enrolled in a university?", options: ["Yes", "No"], aliases: ["are you currently enrolled in a university", "are you currently enrolled in college"], review: true }
  ];
  var questionKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\b(required|optional)\b/g, "").replace(/\s+/g, " ").trim();
  var commonQuestion = (q) => COMMON_QUESTIONS.find((item) => item.aliases.includes(questionKey(q)));

  // tools/application-helper/application-autofill.mjs
  var normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function suggestField(field, profile, memory = [], origin = "", context = "") {
    if (!profile?.confirmed) return null;
    const label = normalize(field.label).replace(/\b(required|optional)\b/g, "").trim();
    const common = commonQuestion(label);
    if (!label || !common && /password|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|birth|social security|consent|agree|certify|signature|salary|compensation|gpa|completed|previous|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(label)) return null;
    if (!["text", "email", "tel", "url", "textarea", "select-one", "combobox", "number"].includes(field.type) || field.filled || field.disabled) return null;
    const patterns = { firstName: /^(legal )?(first|given) name$/, lastName: /^(legal )?(last name|family name|surname)$/, fullName: /^(legal |full |legal full )?name$/, email: /^(personal |primary |contact )?e ?mail( address)?$/, phone: /^(primary |contact |mobile |cell )?(phone|telephone)( number)?$/, city: /^(current |home )?city$/, state: /^(current |home )?(state|province|state province)$/, postalCode: /^(zip|postal|zip postal)( code)?$/, country: /^(current |home )?country( of residence)?$/, school: /^(current )?(university|school|college|school university|university college)( name)?$/, major: /^(major|field of study|academic major)$/, graduationYear: /^(expected |anticipated )graduation year$/, portfolio: /^(portfolio|personal website|portfolio website)( url| link)?$/, linkedin: /^linkedin( profile)?( url| link)?$/, github: /^github( profile)?( url| link)?$/ };
    const key = Object.keys(patterns).find((k) => patterns[k].test(label));
    const custom = (profile.answers || []).filter((a) => normalize(a.question) === label || common && commonQuestion(a.question)?.question === common.question);
    const remembered = !key && !custom.length ? memoryMatch(field.label, memory, origin, context) : null;
    const value = key === "fullName" ? [profile.values.firstName, profile.values.lastName].filter(Boolean).join(" ") : key ? profile.values[key] : custom.length && new Set(custom.map((a) => a.answer.trim())).size === 1 ? custom[0].answer : remembered?.value;
    if (!value || field.maxLength > 0 && value.length > field.maxLength) return null;
    const review = { reason: common?.review ? "Confirm this answer for this application" : remembered?.reason, sourceQuestion: common?.review ? common.question : remembered?.question, requiresReview: !!common?.review };
    if (field.type === "select-one" || field.type === "combobox") {
      const aliases = key === "state" && normalize(value) === "new jersey" ? ["new jersey", "nj"] : key === "country" && ["us", "usa", "united states"].includes(normalize(value)) ? ["united states", "united states of america", "us", "usa"] : [normalize(value)];
      if (field.type === "combobox") return { value, display: value, aliases, ...review };
      const matches = (field.options || []).filter((o) => !o.disabled && (aliases.includes(normalize(o.label)) || aliases.includes(normalize(o.value))));
      if (matches.length !== 1) return null;
      return { value: matches[0].value, display: matches[0].label, ...review };
    }
    return { value, display: value, ...review };
  }
  function formBridge({ action = "scan", url, fields = [] } = {}) {
    const text = (e) => (e?.innerText || e?.textContent || "").trim();
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const visible = (e) => !!e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
    const custom = (e) => e.tagName !== "SELECT" && (e.getAttribute("role") === "combobox" || e.getAttribute("aria-haspopup") === "listbox");
    const type = (e) => custom(e) ? "combobox" : e.type || e.tagName.toLowerCase();
    const selectedValue = (e) => {
      let parent = e.parentElement;
      for (let n = 0; n < 3 && parent; n++, parent = parent.parentElement) {
        if (parent.querySelectorAll('[role="combobox"],[aria-haspopup="listbox"]').length > 1) break;
        const selected = parent.querySelector('[class*="singleValue"],[data-selected-value]');
        if (selected) return selected;
      }
      return null;
    };
    const elements = () => [...document.querySelectorAll('input,select,textarea,[role="combobox"],[aria-haspopup="listbox"]')].filter((e) => !e.parentElement?.closest('[role="combobox"],[aria-haspopup="listbox"]'));
    const labelText = (e) => {
      if (!e) return "";
      const copy = e.cloneNode(true);
      for (const control of copy.querySelectorAll('input,select,textarea,button,[role="combobox"],[role="listbox"]')) control.remove();
      return text(copy);
    };
    const label = (e) => (e.getAttribute("aria-label") || (e.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => labelText(document.getElementById(id))).join(" ") || [...e.labels || []].map(labelText).join(" ") || labelText(e.closest("label")) || e.placeholder || "").trim().slice(0, 250);
    const empty = (e) => {
      if (!custom(e)) return !e.value || e.tagName === "SELECT" && e.selectedIndex === 0 && /select|choose|please/i.test(text(e.options[0]));
      const selected = selectedValue(e);
      if (selected && text(selected)) return false;
      const value = (e.value || text(e)).trim();
      return !value || /^(select|choose|please select|select an? option|select one)(\.\.\.)?$/i.test(value);
    };
    const disabled = (e) => e.disabled || e.readOnly && !custom(e) || e.getAttribute("aria-disabled") === "true";
    const snapshot = (e, index) => ({ index, label: label(e), type: type(e), name: e.name || "", id: e.id || "", maxLength: e.maxLength, filled: !empty(e), disabled: !!disabled(e), options: e.tagName === "SELECT" ? [...e.options].map((o) => ({ value: o.value, label: text(o), disabled: o.disabled })) : void 0 });
    if (action === "scan") {
      const all = elements();
      return { url: location.href, fields: all.map(snapshot).filter((f) => visible(all[f.index])).slice(0, 150), embeddedForms: document.querySelectorAll("iframe").length };
    }
    return (async () => {
      if (location.href !== url) return { filled: 0, skipped: fields.length, changed: true };
      const all = elements(), targets = fields.map((f) => [f, all[f.index]]);
      let filled = 0, skipped = 0;
      for (const [f, e] of targets) {
        if (location.href !== url) {
          skipped++;
          continue;
        }
        if (!e || !e.isConnected || !empty(e) || disabled(e) || !visible(e) || label(e) !== f.label || type(e) !== f.type || (e.name || "") !== f.name || (e.id || "") !== f.id) {
          skipped++;
          continue;
        }
        if (custom(e)) {
          const before = new Set([...document.querySelectorAll('[role="listbox"]')].filter(visible));
          e.focus();
          e.click();
          if (e.getAttribute("aria-expanded") !== "true") e.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true }));
          let boxes = [];
          for (let attempt = 0; attempt < 10; attempt++) {
            if (location.href !== url || !e.isConnected) break;
            const ids = ((e.getAttribute("aria-controls") || "") + " " + (e.getAttribute("aria-owns") || "")).trim().split(/\s+/).filter(Boolean);
            boxes = ids.map((id) => document.getElementById(id)).filter((n) => n && visible(n));
            if (!boxes.length) boxes = [...document.querySelectorAll('[role="listbox"]')].filter((n) => visible(n) && !before.has(n));
            if (boxes.length === 1 && boxes[0].querySelector('[role="option"]')) break;
            await new Promise((r) => setTimeout(r, 80));
          }
          const aliases = f.aliases || [norm(f.value)], options = boxes.length === 1 ? [...boxes[0].querySelectorAll('[role="option"]')].filter((o) => visible(o) && o.getAttribute("aria-disabled") !== "true" && aliases.includes(norm(text(o)))) : [];
          if (location.href !== url || !e.isConnected || !empty(e) || options.length !== 1) {
            e.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            skipped++;
            continue;
          }
          options[0].click();
          await new Promise((r) => setTimeout(r, 60));
          const selected = selectedValue(e);
          const displayed = norm(e.value || text(selected) || text(e));
          if (aliases.includes(displayed) || options[0].isConnected && options[0].getAttribute("aria-selected") === "true") filled++;
          else skipped++;
        } else {
          if (e.tagName === "SELECT" && ![...e.options].some((o) => o.value === f.value && !o.disabled && text(o) === f.display)) {
            skipped++;
            continue;
          }
          const proto = e.tagName === "SELECT" ? HTMLSelectElement.prototype : e.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, "value").set.call(e, f.value);
          e.dispatchEvent(new Event("input", { bubbles: true }));
          e.dispatchEvent(new Event("change", { bubbles: true }));
          filled++;
        }
      }
      return { filled, skipped };
    })();
  }
  var scanForm = () => formBridge({ action: "scan" });
  var fillForm = (options) => formBridge({ ...options, action: "fill" });

  // tools/application-helper/answer-memory.mjs
  var normalizeQuestion2 = (value) => String(value || "").toLowerCase().replace(/[’']/g, "").replace(/\+/g, " plus ").replace(/#/g, " sharp ").replace(/%/g, " percent ").replace(/-(?=\d)/g, " minus ").replace(/(\d)\.(?=\d)/g, "$1 decimal ").replace(/[^a-z0-9]+/g, " ").replace(/\b(required|optional)\b/g, "").replace(/\s+/g, " ").trim();
  var privateQuestion2 = (q) => /password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(normalizeQuestion2(q));
  function employerSpecific(question) {
    return /\b(this|our|your) (company|organization|organisation|role|position|team)|why.*(join|work|interested)|how.*hear|job.*(id|reference)/i.test(question);
  }
  function scanAnsweredFields() {
    const blocked = /password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/i;
    const candidates = [];
    for (const e of document.querySelectorAll("input,textarea,select")) {
      const type = e.type || e.tagName.toLowerCase();
      if (!["text", "email", "tel", "url", "textarea", "select-one", "number"].includes(type) || e.disabled || e.readOnly || !e.getClientRects().length || getComputedStyle(e).visibility === "hidden") continue;
      const question = ([...e.labels || []].map((l) => l.innerText).join(" ") || e.getAttribute("aria-label") || (e.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => document.getElementById(id)?.innerText || "").join(" ") || e.placeholder || "").trim();
      if (!question || question.length > 250 || blocked.test(question + " " + e.name + " " + e.id) || /one-time-code|cc-|current-password|new-password/.test(e.autocomplete || "")) continue;
      const answer = (e.tagName === "SELECT" ? e.selectedOptions[0]?.textContent : e.value || "")?.trim();
      if (!answer || answer.length > 1500 || e.tagName === "SELECT" && (!e.value || /^(select|choose|please select)/i.test(answer))) continue;
      candidates.push({ question, answer });
      if (candidates.length >= 100) break;
    }
    return { url: location.href, origin: location.origin, candidates };
  }

  // tools/application-helper/resume-attachment.mjs
  async function attachResume({ url, resume }) {
    if (location.href !== url) return { attached: false, message: "The page changed. Scan again before attaching." };
    const text = (e) => (e?.innerText || e?.textContent || "").trim();
    const label = (e) => [...e.labels || []].map(text).join(" ") || e.getAttribute("aria-label") || (e.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => text(document.getElementById(id))).join(" ") || e.name || e.id || "";
    const candidates = [...document.querySelectorAll('input[type="file"]')].filter((e) => {
      if (e.disabled || e.multiple) return false;
      const nearby = e.closest("fieldset") || e.closest('[role="group"]') || e.parentElement?.parentElement;
      const words = label(e) + " " + text(nearby).slice(0, 500);
      return /\b(resume|résumé|cv|curriculum vitae)\b/i.test(words) && !/cover letter|transcript|passport|photo|certificate/i.test(words);
    });
    if (candidates.length !== 1) return { attached: false, message: "No single supported resume upload found. Use the PDF download to attach it manually." };
    const input = candidates[0];
    if (input.files?.length) return { attached: false, message: "A file is already selected; it was left unchanged." };
    const accept = (input.accept || "").toLowerCase().split(",").map((s) => s.trim());
    if (input.accept && !accept.some((s) => [".pdf", "application/pdf", "application/*", "*/*"].includes(s))) return { attached: false, message: "This upload does not accept PDF. Attach a supported format manually." };
    if (!resume || typeof resume.base64 !== "string" || resume.base64.length > 2e6) return { attached: false, message: "Start this job from Studio with its tailored PDF first." };
    const bytes = Uint8Array.from(atob(resume.base64), (c) => c.charCodeAt(0));
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((v) => v.toString(16).padStart(2, "0")).join("");
    if (digest !== resume.sha256 || String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") return { attached: false, message: "Resume verification failed. Prepare it again in Studio." };
    if (location.href !== url || !input.isConnected || input.files?.length || input.disabled) return { attached: false, message: "The upload changed; no file was replaced." };
    try {
      const transfer = new DataTransfer();
      transfer.items.add(new File([bytes], resume.name, { type: "application/pdf" }));
      input.files = transfer.files;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return { attached: true, message: resume.name + " attached. Check the employer\u2019s upload status before continuing." };
    } catch {
      return { attached: false, message: "This uploader needs a manual file selection. Download the tailored PDF from Studio." };
    }
  }

  // tools/application-helper/memory-panel.mjs
  function reviewAnswers(container, { origin, context, candidates, onSave, onCancel }) {
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    container.replaceChildren();
    const hint = el("p", "Choose answers to remember. Edit them now and choose where they may be reused. Nothing is saved until you click Save selected.");
    container.append(hint);
    const rows = [];
    for (const item of candidates.filter((a) => !privateQuestion2(a.question))) {
      const row = el("div");
      row.className = "memory-row";
      const label = el("label"), check = el("input");
      check.type = "checkbox";
      check.checked = true;
      label.append(check, document.createTextNode(" " + item.question));
      const answer = el("textarea");
      answer.value = item.answer;
      answer.rows = 2;
      answer.maxLength = 1500;
      answer.setAttribute("aria-label", "Answer: " + item.question);
      const scope = el("select");
      scope.setAttribute("aria-label", "Reuse: " + item.question);
      for (const [value, text] of [[origin, context?.startsWith("page:") ? "This page only" : "This employer only"], ["*", "All employers"]]) {
        const option = el("option", text);
        option.value = value;
        scope.append(option);
      }
      scope.value = employerSpecific(item.question) ? origin : "*";
      row.append(label, answer, scope);
      container.append(row);
      rows.push({ item, check, answer, scope });
    }
    const status = el("p");
    status.setAttribute("role", "status");
    const save = el("button", "Save selected answers"), cancel = el("button", "Cancel");
    save.type = cancel.type = "button";
    save.disabled = !rows.length;
    if (!rows.length) hint.textContent = "No supported completed fields found. Answer a question on this page first. Passwords, sensitive and legal questions are excluded.";
    save.onclick = async () => {
      const selected = rows.filter((r) => r.check.checked).map((r) => ({ question: r.item.question, answer: r.answer.value, scope: r.scope.value, sourceOrigin: origin, context }));
      if (!selected.length) {
        status.textContent = "Select an answer to remember.";
        return;
      }
      save.disabled = true;
      try {
        await onSave(selected);
      } catch (error) {
        status.textContent = error.message;
      } finally {
        save.disabled = false;
      }
    };
    cancel.onclick = onCancel;
    container.append(status, save, cancel);
  }

  // tools/application-helper/assistant.mjs
  if (!globalThis.__ducApplicationHelper) {
    let mount = function(next) {
      stop();
      entry = next;
      remembering = false;
      lastSignature = "";
      if (entry.expiresAt <= Date.now() || location.origin !== entry.origin) return;
      host = el("div");
      host.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:2147483647;";
      root = host.attachShadow({ mode: "closed" });
      const style = el("style");
      style.textContent = `:host{all:initial}*{box-sizing:border-box}.panel{width:350px;max-width:calc(100vw - 32px);color:#f1f0ed;background:#151719;border:1px solid #62686c;border-radius:16px;box-shadow:0 12px 50px #0006;font:14px/1.5 system-ui;padding:18px}header{display:flex;align-items:center;gap:8px}header strong{flex:1}button{font:inherit;cursor:pointer;border:1px solid #555d62;background:#252a2e;color:inherit;border-radius:7px;padding:8px 12px}button:hover{background:#363e44}button:focus-visible{outline:2px solid #a9d5ed}button:disabled{opacity:.5;cursor:default}small{display:block;color:#b8bfc4}p{margin:10px 0}h3{font-size:15px;margin:12px 0 0}.answers{max-height:240px;overflow:auto;margin:12px 0}.answer{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #383e42}.answer span{overflow-wrap:anywhere}input{accent-color:#c4dbea}footer{display:flex;gap:8px}.fill{background:#edf1f3;color:#151719} [hidden]{display:none!important}`;
      const panel = el("section");
      panel.className = "panel";
      panel.setAttribute("aria-label", "Application Helper");
      const header = el("header"), title = el("strong", "Application Helper"), minimize = el("button", "\u2212"), close = el("button", "\xD7");
      minimize.setAttribute("aria-label", "Collapse application helper");
      close.setAttribute("aria-label", "End application helper");
      header.append(title, minimize, close);
      const content = el("div"), job = el("h3", entry.job.title), company = el("small", entry.job.company), status = el("p");
      status.setAttribute("role", "status");
      const list = el("div");
      list.className = "answers";
      const footer = el("footer"), scan = el("button", "Scan form"), fill = el("button", "Fill selected");
      fill.className = "fill";
      fill.hidden = true;
      footer.append(scan, fill);
      const remember = el("button", "Remember my answers"), memoryArea = el("div");
      memoryArea.className = "answers";
      memoryArea.hidden = true;
      const memoryNote = el("small", "Saved answers stay in this extension, even after clearing browser cache.");
      style.textContent += " .memory-row{padding:12px 0;border-bottom:1px solid #444}.memory-row label{display:block}textarea,select{font:inherit;width:100%;margin:6px 0;background:#202528;color:#f1f0ed;border:1px solid #62686c;border-radius:4px;padding:7px}";
      content.append(job, company, status, list, footer, remember, memoryArea, memoryNote, el("small", "Review answers and PDF. You submit on the employer\u2019s form."));
      panel.append(header, content);
      root.append(style, panel);
      document.documentElement.append(host);
      remember.onclick = () => {
        remembering = true;
        memoryArea.hidden = false;
        list.hidden = footer.hidden = true;
        const found = scanAnsweredFields();
        reviewAnswers(memoryArea, { origin: found.origin, context: entry.job.company.trim().toLowerCase(), candidates: found.candidates, onSave: async (items) => {
          const result = await chrome.runtime.sendMessage({ type: "memory-save", items });
          if (!result.ok) throw new Error(result.error);
          entry.memory = result.items;
          remembering = false;
          memoryArea.hidden = true;
          list.hidden = footer.hidden = false;
          scanNow();
          status.textContent = items.length + " answers saved for future applications. Review them whenever they are suggested.";
        }, onCancel: () => {
          remembering = false;
          memoryArea.hidden = true;
          list.hidden = footer.hidden = false;
          scanNow();
        } });
      };
      minimize.onclick = () => {
        content.hidden = !content.hidden;
        minimize.textContent = content.hidden ? "+" : "\u2212";
        minimize.setAttribute("aria-label", content.hidden ? "Expand application helper" : "Collapse application helper");
      };
      close.onclick = () => {
        stop();
        chrome.runtime.sendMessage({ type: "stop-handoff" }).catch(() => {
        });
      };
      function scanNow(automatic = false) {
        if (!entry || Date.now() >= entry.expiresAt) {
          stop();
          return;
        }
        if (remembering || filling) return;
        const found = scanForm(), signature = JSON.stringify([found.url, found.fields]);
        if (automatic && signature === lastSignature) return;
        lastSignature = signature;
        review = { url: found.url, createdAt: Date.now(), fields: found.fields.flatMap((f) => {
          const answer = suggestField(f, entry.profile, entry.memory || [], location.origin, entry.job.company.trim().toLowerCase());
          return answer ? [{ ...f, ...answer }] : [];
        }) };
        list.replaceChildren();
        for (const [i, f] of review.fields.entries()) {
          const label = el("label");
          label.className = "answer";
          const check = el("input");
          check.type = "checkbox";
          check.checked = !f.requiresReview;
          check.value = String(i);
          const text = el("span", f.label);
          text.append(el("small", f.display));
          if (f.reason) text.append(el("small", f.reason + " \xB7 " + f.sourceQuestion));
          label.append(check, text);
          list.append(label);
        }
        if (entry.resume) {
          const label = el("label");
          label.className = "answer";
          const check = el("input");
          check.type = "checkbox";
          check.checked = true;
          check.value = "resume";
          const text = el("span", "Attach tailored resume");
          text.append(el("small", entry.resume.name));
          label.append(check, text);
          list.append(label);
        }
        fill.hidden = !review.fields.length && !entry.resume;
        status.textContent = review.fields.length ? `${review.fields.length} suggested answers. Review and uncheck any you don\u2019t want to fill.` : "Open the employer\u2019s application form or sign in. Supported empty fields will appear here.";
        if (found.embeddedForms) status.textContent += " Embedded forms may need opening directly and scanning with the extension button.";
      }
      scan.onclick = () => scanNow();
      fill.onclick = async () => {
        if (filling) return;
        if (!review || Date.now() - review.createdAt > 12e4) {
          scanNow();
          status.textContent = "Suggestions refreshed. Review them again before filling.";
          return;
        }
        const checked = [...list.querySelectorAll("input:checked")], fields = checked.filter((c) => c.value !== "resume").map((c) => review.fields[Number(c.value)]), withResume = checked.some((c) => c.value === "resume");
        if (!fields.length && !withResume) {
          status.textContent = "Select an answer or the tailored PDF.";
          return;
        }
        filling = true;
        fill.disabled = scan.disabled = remember.disabled = true;
        try {
          const result = await fillForm({ url: review.url, fields });
          const upload = withResume && entry?.resume ? await attachResume({ url: review.url, resume: entry.resume }) : null;
          list.replaceChildren();
          fill.hidden = true;
          review = null;
          status.textContent = result.changed ? "The page changed. Scan again." : `${result.filled} answers filled; ${result.skipped} skipped. ${upload?.message || ""} Nothing was submitted.`;
          lastSignature = JSON.stringify([location.href, scanForm().fields]);
        } catch {
          status.textContent = "Some controls need manual entry. Check the form and scan again.";
        } finally {
          filling = false;
          fill.disabled = scan.disabled = remember.disabled = false;
        }
      };
      scanNow();
      observer = new MutationObserver(() => {
        clearTimeout(debounce);
        debounce = setTimeout(() => scanNow(true), 700);
      });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
      timer = setTimeout(() => {
        stop();
        chrome.runtime.sendMessage({ type: "stop-handoff" }).catch(() => {
        });
      }, Math.max(0, entry.expiresAt - Date.now()));
    };
    globalThis.__ducApplicationHelper = true;
    let entry, host, root, review, timer, observer, debounce, lastSignature = "", remembering = false, filling = false;
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    const stop = () => {
      clearTimeout(timer);
      clearTimeout(debounce);
      observer?.disconnect();
      host?.remove();
      entry = null;
      review = null;
    };
    chrome.runtime.onMessage.addListener((message, sender) => {
      if (sender.id === chrome.runtime.id && message?.type === "application-handoff") mount(message.entry);
    });
  }
})();
