(() => {
  // tools/application-helper/answer-memory.mjs
  var normalizeQuestion = (value) => String(value || "").toLowerCase().replace(/[’']/g, "").replace(/\+/g, " plus ").replace(/#/g, " sharp ").replace(/%/g, " percent ").replace(/-(?=\d)/g, " minus ").replace(/(\d)\.(?=\d)/g, "$1 decimal ").replace(/[^a-z0-9]+/g, " ").replace(/\b(required|optional)\b/g, "").replace(/\s+/g, " ").trim();
  var privateQuestion = (q) => /password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(normalizeQuestion(q));
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
  function employerSpecific(question) {
    return /\b(this|our|your) (company|organization|organisation|role|position|team)|why.*(join|work|interested)|how.*hear|job.*(id|reference)/i.test(question);
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
  function scanAnsweredFields() {
    const blocked = /password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/i;
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

  // tools/application-helper/application-autofill.mjs
  var normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function suggestField(field, profile, memory = [], origin = "", context = "") {
    if (!profile?.confirmed) return null;
    const label = normalize(field.label).replace(/\b(required|optional)\b/g, "").trim();
    if (!label || /password|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|gender|race|ethnic|pronoun|birth|social security|consent|agree|certify|signature|salary|compensation|gpa|completed|previous|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(label)) return null;
    if (!["text", "email", "tel", "url", "textarea", "select-one", "number"].includes(field.type) || field.filled || field.disabled) return null;
    const patterns = { firstName: /^(legal )?(first|given) name$/, lastName: /^(legal )?(last name|family name|surname)$/, fullName: /^(legal |full |legal full )?name$/, email: /^(personal |primary |contact )?e ?mail( address)?$/, phone: /^(primary |contact |mobile |cell )?(phone|telephone)( number)?$/, city: /^(current |home )?city$/, state: /^(current |home )?(state|province|state province)$/, postalCode: /^(zip|postal|zip postal)( code)?$/, country: /^(current |home )?country( of residence)?$/, school: /^(current )?(university|school|college|school university|university college)( name)?$/, major: /^(major|field of study|academic major)$/, graduationYear: /^(expected |anticipated )graduation year$/, portfolio: /^(portfolio|personal website|portfolio website)( url| link)?$/, linkedin: /^linkedin( profile)?( url| link)?$/, github: /^github( profile)?( url| link)?$/ };
    const key = Object.keys(patterns).find((k) => patterns[k].test(label));
    const custom = (profile.answers || []).filter((a) => normalize(a.question) === label);
    const remembered = !key && !custom.length ? memoryMatch(field.label, memory, origin, context) : null;
    const value = key === "fullName" ? [profile.values.firstName, profile.values.lastName].filter(Boolean).join(" ") : key ? profile.values[key] : custom.length === 1 ? custom[0].answer : remembered?.value;
    if (!value || field.maxLength > 0 && value.length > field.maxLength) return null;
    if (field.type === "select-one") {
      const aliases = key === "state" && normalize(value) === "new jersey" ? ["new jersey", "nj"] : key === "country" && ["us", "usa", "united states"].includes(normalize(value)) ? ["united states", "united states of america", "us", "usa"] : [normalize(value)];
      const matches = (field.options || []).filter((o) => !o.disabled && (aliases.includes(normalize(o.label)) || aliases.includes(normalize(o.value))));
      if (matches.length !== 1) return null;
      return { value: matches[0].value, display: matches[0].label, reason: remembered?.reason, sourceQuestion: remembered?.question };
    }
    return { value, display: value, reason: remembered?.reason, sourceQuestion: remembered?.question };
  }
  function scanForm() {
    const label = (e) => ([...e.labels || []].map((l) => l.innerText).join(" ") || e.getAttribute("aria-label") || (e.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => document.getElementById(id)?.innerText || "").join(" ") || e.placeholder || "").trim().slice(0, 250);
    const fields = [...document.querySelectorAll("input,select,textarea")].map((e, index) => ({ index, label: label(e), type: e.type || e.tagName.toLowerCase(), name: e.name || "", id: e.id || "", maxLength: e.maxLength, filled: !!e.value && !(e.tagName === "SELECT" && e.selectedIndex === 0 && /select|choose|please/i.test(e.options[0]?.textContent || "")), disabled: e.disabled || e.readOnly, visible: !!e.getClientRects().length && getComputedStyle(e).visibility !== "hidden", options: e.tagName === "SELECT" ? [...e.options].map((o) => ({ value: o.value, label: o.textContent, disabled: o.disabled })) : void 0 })).filter((e) => e.visible).slice(0, 150);
    return { url: location.href, fields, embeddedForms: document.querySelectorAll("iframe").length };
  }
  function fillForm({ url, fields }) {
    if (location.href !== url) return { filled: 0, skipped: fields.length, changed: true };
    const elements = [...document.querySelectorAll("input,select,textarea")];
    let filled = 0, skipped = 0;
    for (const f of fields) {
      const e = elements[f.index];
      const label = e && ([...e.labels || []].map((l) => l.innerText).join(" ") || e.getAttribute("aria-label") || (e.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => document.getElementById(id)?.innerText || "").join(" ") || e.placeholder || "").trim().slice(0, 250);
      const empty = e && (!e.value || e.tagName === "SELECT" && e.selectedIndex === 0 && /select|choose|please/i.test(e.options[0]?.textContent || ""));
      if (!e || !empty || e.disabled || e.readOnly || !e.getClientRects().length || getComputedStyle(e).visibility === "hidden" || label !== f.label || (e.type || e.tagName.toLowerCase()) !== f.type || (e.name || "") !== f.name || (e.id || "") !== f.id) {
        skipped++;
        continue;
      }
      const proto = e.tagName === "SELECT" ? HTMLSelectElement.prototype : e.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(e, f.value);
      e.dispatchEvent(new Event("input", { bubbles: true }));
      e.dispatchEvent(new Event("change", { bubbles: true }));
      filled++;
    }
    return { filled, skipped };
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
    for (const item of candidates.filter((a) => !privateQuestion(a.question))) {
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
      content.append(job, company, status, list, footer, remember, memoryArea, memoryNote, el("small", "Review every answer. Upload your PDF and submit on the employer\u2019s form."));
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
        if (remembering) return;
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
          check.checked = true;
          check.value = String(i);
          const text = el("span", f.label);
          text.append(el("small", f.display));
          if (f.reason) text.append(el("small", f.reason + " \xB7 " + f.sourceQuestion));
          label.append(check, text);
          list.append(label);
        }
        fill.hidden = !review.fields.length;
        status.textContent = review.fields.length ? `${review.fields.length} suggested answers. Review and uncheck any you don\u2019t want to fill.` : "Open the employer\u2019s application form or sign in. Supported empty fields will appear here.";
        if (found.embeddedForms) status.textContent += " Embedded forms may need opening directly and scanning with the extension button.";
      }
      scan.onclick = () => scanNow();
      fill.onclick = () => {
        if (!review || Date.now() - review.createdAt > 12e4) {
          scanNow();
          status.textContent = "Suggestions refreshed. Review them again before filling.";
          return;
        }
        const fields = [...list.querySelectorAll("input:checked")].map((c) => review.fields[Number(c.value)]);
        if (!fields.length) {
          status.textContent = "Select an answer to fill.";
          return;
        }
        const result = fillForm({ url: review.url, fields });
        list.replaceChildren();
        fill.hidden = true;
        review = null;
        status.textContent = result.changed ? "The page changed. Scan the form again." : `${result.filled} answers filled; ${result.skipped} changed fields skipped. Check the form before continuing. Nothing was submitted.`;
        lastSignature = JSON.stringify([location.href, scanForm().fields]);
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
    let entry, host, root, review, timer, observer, debounce, lastSignature = "", remembering = false;
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
