(() => {
  // tools/application-helper/application-autofill.mjs
  var normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function suggestField(field, profile) {
    if (!profile?.confirmed) return null;
    const label = normalize(field.label).replace(/\b(required|optional)\b/g, "").trim();
    if (!label || /password|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|gender|race|ethnic|pronoun|birth|social security|consent|agree|certify|signature|salary|compensation|gpa|completed|previous|reference|emergency|guardian|parent|referr|manager|supervisor/.test(label)) return null;
    if (!["text", "email", "tel", "url", "textarea", "select-one", "number"].includes(field.type) || field.filled || field.disabled) return null;
    const patterns = { firstName: /^(legal )?(first|given) name$/, lastName: /^(legal )?(last name|family name|surname)$/, fullName: /^(legal |full |legal full )?name$/, email: /^(personal |primary |contact )?e ?mail( address)?$/, phone: /^(primary |contact |mobile |cell )?(phone|telephone)( number)?$/, city: /^(current |home )?city$/, state: /^(current |home )?(state|province|state province)$/, postalCode: /^(zip|postal|zip postal)( code)?$/, country: /^(current |home )?country( of residence)?$/, school: /^(current )?(university|school|college|school university|university college)( name)?$/, major: /^(major|field of study|academic major)$/, graduationYear: /^(expected |anticipated )graduation year$/, portfolio: /^(portfolio|personal website|portfolio website)( url| link)?$/, linkedin: /^linkedin( profile)?( url| link)?$/, github: /^github( profile)?( url| link)?$/ };
    const key = Object.keys(patterns).find((k) => patterns[k].test(label));
    const custom = (profile.answers || []).filter((a) => normalize(a.question) === label);
    const value = key === "fullName" ? [profile.values.firstName, profile.values.lastName].filter(Boolean).join(" ") : key ? profile.values[key] : custom.length === 1 ? custom[0].answer : null;
    if (!value || field.maxLength > 0 && value.length > field.maxLength) return null;
    if (field.type === "select-one") {
      const aliases = key === "state" && normalize(value) === "new jersey" ? ["new jersey", "nj"] : key === "country" && ["us", "usa", "united states"].includes(normalize(value)) ? ["united states", "united states of america", "us", "usa"] : [normalize(value)];
      const matches = (field.options || []).filter((o) => !o.disabled && (aliases.includes(normalize(o.label)) || aliases.includes(normalize(o.value))));
      if (matches.length !== 1) return null;
      return { value: matches[0].value, display: matches[0].label };
    }
    return { value, display: value };
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

  // tools/application-helper/assistant.mjs
  if (!globalThis.__ducApplicationHelper) {
    let mount = function(next) {
      stop();
      entry = next;
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
      content.append(job, company, status, list, footer, el("small", "Review every answer. Upload your PDF and submit on the employer\u2019s form."));
      panel.append(header, content);
      root.append(style, panel);
      document.documentElement.append(host);
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
        const found = scanForm(), signature = JSON.stringify([found.url, found.fields]);
        if (automatic && signature === lastSignature) return;
        lastSignature = signature;
        review = { url: found.url, createdAt: Date.now(), fields: found.fields.flatMap((f) => {
          const answer = suggestField(f, entry.profile);
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
    let entry, host, root, review, timer, observer, debounce, lastSignature = "";
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
