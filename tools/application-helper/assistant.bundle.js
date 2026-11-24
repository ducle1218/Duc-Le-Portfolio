(() => {
  // tools/application-helper/fill-sequence.mjs
  var questionId = (field) => JSON.stringify([field.type, field.label]);
  async function fillWithFollowups({ url, reviewed, selected, scan, fill, suggest, active = () => true }) {
    const excluded = new Set(reviewed.filter((field) => !selected.includes(field)).map(questionId));
    const attempts = /* @__PURE__ */ new Map();
    const identity = (field) => JSON.stringify([field.type, field.label, field.id, field.name]);
    const total = { filled: 0, skipped: 0, changed: false };
    let pending = selected;
    for (let pass = 0; pass < 10 && pending.length && active(); pass++) {
      for (const field of pending) {
        const key2 = identity(field);
        attempts.set(key2, (attempts.get(key2) || 0) + 1);
      }
      const batch = await fill({ url, fields: pending });
      total.filled += batch.filled;
      total.skipped += batch.skipped;
      if (batch.changed) {
        total.changed = true;
        break;
      }
      if (!batch.filled) break;
      pending = [];
      for (const delay of [80, 200, 400, 700]) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (!active()) return total;
        const form = await scan();
        if (form.url !== url) {
          total.changed = true;
          return total;
        }
        pending = form.fields.filter((field) => field.type !== "chat-reply" && (!field.filled || field.languageRow === "english" && field.currentLevel === "basic") && !excluded.has(questionId(field)) && (attempts.get(identity(field)) || 0) < (field.type === "combobox" ? 2 : 1)).flatMap((field) => {
          const answer = suggest(field, form);
          return answer ? [{ ...field, ...answer }] : [];
        });
        if (pending.length) break;
      }
    }
    return total;
  }

  // tools/application-helper/portfolio-answers.mjs
  var PORTFOLIO_URL = "https://ducle1218.github.io/Duc-Le-Portfolio/";
  var aliases = { cad: ["cad", "computer aided design", "computer aided drafting"], solidworks: ["solidworks", "solid works"], onshape: ["onshape"], autocad: ["autocad", "auto cad"], fea: ["fea", "finite element analysis"], matlab: ["matlab"], python: ["python"], cplusplus: ["cplusplus"], excel: ["excel", "microsoft excel"], "3d printing": ["3d printing", "additive manufacturing", "fdm"], "mechanical design": ["mechanical design"], assembly: ["assembly", "mechanical assembly"], "structural analysis": ["structural analysis"], documentation: ["documentation", "technical documentation"], "arduino uno": ["arduino", "arduino uno"], pneumatics: ["pneumatics", "pneumatic systems"], "hand fabrication": ["hand fabrication"] };
  Object.assign(aliases, { robotics: ["robotics", "robotics projects"], electronics: ["electronics", "electronic circuits"], simulation: ["simulation", "engineering simulation"], prototyping: ["prototyping", "physical prototyping"] });

  // tools/application-helper/portfolio-ui.mjs
  function addPortfolioEvidence(container, suggestion) {
    if (!suggestion.portfolioDerived || !suggestion.sources?.length) return;
    const details2 = document.createElement("details"), summary = document.createElement("summary");
    details2.className = "portfolio-evidence";
    summary.textContent = "Why this answer \xB7 portfolio sources";
    details2.append(summary);
    for (const source of suggestion.sources) {
      if (!source.url.startsWith(PORTFOLIO_URL)) continue;
      const a = document.createElement("a");
      a.href = source.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = source.title + " \u2197";
      const quote = document.createElement("small");
      quote.textContent = source.quote;
      const item = document.createElement("div");
      item.append(a, quote);
      details2.append(item);
    }
    container.append(details2);
  }

  // tools/application-helper/common-questions.mjs?v=20261123.3
  var COMMON_QUESTIONS = [
    { question: "Valid driver\u2019s license", aliases: ["valid driver s license", "do you possess a valid driver s license", "do you have a valid drivers license", "do you have a valid driver s license"], options: ["Yes", "No"], review: true },
    { question: "Reliable transportation to project sites and offices", aliases: ["reliable transportation to project sites and offices", "do you have reliable transportation to project sites and office locations"], options: ["Yes", "No"], review: true },
    { question: "Compensation expectations", aliases: ["compensation expectations", "compensation expectations you may provide a range", "what are your compensation expectations", "what are your salary expectations"], review: true },
    { question: "Street address", aliases: ["address", "address line", "address line 1", "street address", "street address line 1", "address 1"] },
    { question: "Degree being pursued", aliases: ["degree being pursued", "current degree program", "what degree are you pursuing"], defaultAnswer: "Bachelor of Science in Mechanical Engineering" },
    { question: "Current academic standing", aliases: ["current academic standing", "academic standing", "class standing", "current year of study", "please indicate your current academic standing select one"], defaultAnswer: "Freshman" },
    { question: "Preferred work regions", aliases: ["preferred work regions", "in which of the following u s geographic locations are you willing to work"], defaultAnswer: "Northeast; Mid-Atlantic; Southeast" },
    { question: "College GPA", aliases: ["college gpa", "university gpa", "current college gpa"], defaultAnswer: "Not available yet" },
    { question: "College GPA scale", aliases: ["college gpa scale", "university gpa scale"], defaultAnswer: "4.0" },
    { question: "High school GPA", aliases: ["high school gpa"], defaultAnswer: "4.2" },
    { question: "Full-time student enrollment", aliases: ["full time student enrollment", "will you be enrolled full time in college university at the time of the internship or co op assignment"], options: ["Yes", "No"], defaultAnswer: "Yes", review: true },
    { question: "Summer internship start date", aliases: ["summer internship start date"], defaultAnswer: "2027-05-13" },
    { question: "Summer internship end date", aliases: ["summer internship end date"], defaultAnswer: "2027-08-31" },
    { question: "Full-time internship availability", aliases: ["full time internship availability"], defaultAnswer: "Summer only; not fall or winter" },
    { question: "Preferred application source", aliases: ["preferred application source"], defaultAnswer: "Company website or university" },
    { question: "Phone device type", aliases: ["phone device type", "phone type", "primary phone type", "telephone type"], options: ["Mobile", "Landline"] },
    { question: "Languages spoken", aliases: ["languages spoken", "which languages do you speak", "what languages do you speak", "languages you speak"] },
    { question: "Expected graduation date", aliases: ["expected graduation date", "expected graduation month", "anticipated graduation date"] },
    { question: "University start year", aliases: ["university start year", "college start year"] },
    { question: "Application source fallbacks", aliases: ["application source fallbacks"] },
    { question: "Preferred contact method", aliases: ["primary contact method", "preferred contact method", "preferred method of contact", "preferred method of communication", "how would you prefer to be contacted", "how do you prefer to be contacted", "how should we contact you", "how would you like us to contact you"], options: ["Email", "Mobile Phone", "Home Phone"] },
    { question: "Do you have reliable transportation?", aliases: ["do you have reliable transportation", "do you have a reliable means of transportation", "do you have reliable transportation to work", "do you have reliable transportation to and from work"], options: ["Yes", "No"] },
    { question: "Post-offer federal background check, physical and drug screen", aliases: ["post offer federal background check physical and drug screen", "if extended a job offer are you willing to submit to a detailed federal background check pre employment physical and drug screen"], options: ["Yes", "No"] },
    { question: "Sex", options: ["Male", "Female", "I do not wish to self-identify"], aliases: ["sex", "what is your sex", "gender", "what is your gender"], review: true },
    { question: "Race / ethnic background", aliases: ["race", "ethnicity", "race ethnicity", "race ethnic background", "what is your race ethnic background", "what is your race ethnicity", "what is your race", "what is your ethnicity", "what is your racial ethnic background"], review: true },
    { question: "Country of citizenship", aliases: ["country of citizenship", "in which country region do you have citizenship", "in which country do you have citizenship", "which country are you a citizen of"], review: true },
    { question: "Preferred pronouns", options: ["He/Him/His", "She/Her/Hers", "They/Them/Theirs", "Prefer not to say"], aliases: ["preferred pronoun", "preferred pronouns", "pronouns", "what are your pronouns"], review: true },
    { question: "Preferred name", aliases: ["preferred name", "what is your preferred name", "what name do you prefer to go by"] },
    { question: "Are you 16 years or older?", options: ["Yes", "No"], aliases: ["are you 16 years or older", "are you at least 16 years old", "are you 16 years of age or older"], review: true },
    { question: "Are you 18 years or older?", options: ["Yes", "No"], aliases: ["are you 18 years or older", "are you at least 18 years old", "are you 18 years of age or older"], review: true },
    { question: "Are you legally authorized to work in the United States?", options: ["Yes", "No"], aliases: ["are you legally authorized to work in the united states", "are you authorized to work in the united states", "are you legally authorized to work in the us"], review: true },
    { question: "Will you now or in the future require sponsorship for employment visa status?", options: ["Yes", "No"], aliases: ["will you now or in the future require sponsorship for employment visa status", "do you now or will you in the future require sponsorship for employment visa status"], review: true },
    { question: "Are you willing to relocate?", options: ["Yes", "No"], aliases: ["are you willing to relocate", "are you open to relocation", "would you be willing to relocate"] },
    { question: "Are you willing to travel?", options: ["Yes", "No"], aliases: ["are you willing to travel", "are you open to travel", "would you be willing to travel"] },
    { question: "When are you available to start?", aliases: ["when are you available to start", "when can you start", "earliest start date", "what is your earliest available start date"] },
    { question: "How did you hear about this position?", options: ["LinkedIn", "Indeed", "Company careers website", "University career center", "Employee referral", "Other"], aliases: ["how did you hear about this position", "how did you hear about this job", "how did you hear about us", "how did you hear about this role"], review: true },
    { question: "Are you currently enrolled in a university?", options: ["Yes", "No"], aliases: ["are you currently enrolled in a university", "are you currently enrolled in college", "are you currently enrolled at a university"], review: true },
    { question: "Current university", aliases: ["current university", "which university are you currently attending", "what university do you currently attend"] },
    { question: "High school name", aliases: ["high school name", "name of high school", "which high school did you graduate from"], defaultAnswer: "Atlantic County Institute of Technology" },
    { question: "High school graduation year", aliases: ["high school graduation year", "year of high school graduation", "what year did you graduate from high school"], defaultAnswer: "2026" },
    { question: "Highest completed degree", aliases: ["highest completed degree", "highest degree earned", "highest degree obtained", "highest level of education completed", "what is your highest completed degree"], options: ["High school diploma", "Associate degree", "Bachelor degree", "Master degree", "Doctorate"], defaultAnswer: "High school diploma" },
    { question: "Employment experience", aliases: ["employment experience", "work experience", "professional experience", "employment history", "work history"], defaultAnswer: "None" },
    { question: "Research positions", aliases: ["research positions", "research experience", "research employment history"], defaultAnswer: "None" },
    { question: "Residence history", aliases: ["residence history", "describe your residence history", "where have you lived"], defaultAnswer: "I lived in Vietnam before moving to the United States in 2014. I have lived in New Jersey since then." }
  ];
  var questionKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\b(required|optional)\b/g, "").replace(/\s+/g, " ").trim();
  var commonQuestion = (q) => {
    const key2 = questionKey(q);
    if (/^(?:please (?:indicate|specify|tell us) )?how (?:you heard|did you hear) about (?:this|the) (?:job|position|role)(?: at .+)?$/.test(key2)) return COMMON_QUESTIONS.find((item) => item.question === "How did you hear about this position?");
    if (key2 === "will you now or will you in the future require employment visa sponsorship") return COMMON_QUESTIONS.find((item) => item.question.startsWith("Will you now or in the future require sponsorship"));
    if (/^do you have the legal right to work in the u s(?: note .*)?$/.test(key2)) return COMMON_QUESTIONS.find((item) => item.question === "Are you legally authorized to work in the United States?");
    if (/^will you now or in the future require sponsorship of a temporary work visa(?: e g .*)?$/.test(key2)) return COMMON_QUESTIONS.find((item) => item.question === "Will you now or in the future require sponsorship for employment visa status?");
    return COMMON_QUESTIONS.find((item) => item.aliases.includes(key2));
  };
  function backgroundAnswer(question, profile, memory = []) {
    const q = questionKey(question), answers = [...profile.answers || [], ...memory];
    const fact = (canonical) => {
      const matches = answers.filter((a) => commonQuestion(a.question)?.question === canonical);
      return matches.length && new Set(matches.map((a) => a.answer.trim())).size === 1 ? matches[0].answer : null;
    };
    const residence = fact("Residence history");
    const states = [profile.values?.state, ...answers.filter((a) => /^(state|province state|state province|current state|state of residence)$/.test(questionKey(a.question))).map((a) => a.answer)].filter(Boolean).map(questionKey);
    const countries = [profile.values?.country, ...answers.filter((a) => /^(country|country region|country of residence)$/.test(questionKey(a.question))).map((a) => a.answer)].filter(Boolean).map(questionKey);
    const inNJ = states.length > 0 && states.every((s) => ["nj", "new jersey"].includes(s));
    const noCountryConflict = countries.every((c) => ["us", "usa", "united states", "united states of america"].includes(c));
    if (inNJ && noCountryConflict) {
      if (/^(country( region| of residence)?|current country|home country|what country do you (live|reside) in|in (what|which) country do you (live|reside)|where do you currently reside country)$/.test(q)) return { value: "United States", sourceQuestion: "Confirmed state: New Jersey \u2192 United States" };
      if (/^(do you (currently )?(live|reside) in (the )?(united states|us|usa)|are you (currently )?(living|located|residing) in (the )?(united states|us|usa)|have you (ever )?lived in (the )?(united states|us|usa))$/.test(q)) return { value: "Yes", sourceQuestion: "Confirmed state: New Jersey \u2192 United States" };
    }
    if (residence === COMMON_QUESTIONS.find((a) => a.question === "Residence history").defaultAnswer && /^have you (ever )?lived in (the )?(united states|us|usa)$/.test(q)) return { value: "Yes", sourceQuestion: "Residence history: New Jersey since 2014 \u2192 United States" };
    if (residence === COMMON_QUESTIONS.find((a) => a.question === "Residence history").defaultAnswer && /^(current |home )?country( of residence)?$/.test(q)) return { value: "United States", sourceQuestion: "Residence history" };
    const noWork = questionKey(fact("Employment experience")) === "none", noResearch = questionKey(fact("Research positions")) === "none";
    if (noWork && /^(do you have (any )?(work|employment|professional work|professional) experience|have you (ever |previously )?been employed( by [a-z0-9 ]+)?|are you currently employed( by [a-z0-9 ]+)?|do you have previous [a-z0-9 ]+ intern co op experience)$/.test(q)) return { value: "No", sourceQuestion: "Employment experience" };
    if (noWork && /^(years of (work|employment|professional work|professional) experience|how many years of (work|employment|professional work|professional) experience do you have)$/.test(q)) return { value: "0", sourceQuestion: "Employment experience" };
    if (noWork && /^(current employer|most recent employer|previous employer|current job title|most recent job title)$/.test(q)) return { value: "None", sourceQuestion: "Employment experience" };
    if (noResearch && /^(do you have (any )?research experience|have you (ever )?held (a |any )research positions?|do you (currently )?hold a research position)$/.test(q)) return { value: "No", sourceQuestion: "Research positions" };
    return null;
  }

  // tools/application-helper/history-reasoner.mjs?v=20261123.3
  var includes = [
    ["currentJob", "employment"],
    ["governmentJob", "employment"],
    ["currentGovernmentJob", "governmentJob"],
    ["currentGovernmentJob", "currentJob"],
    ["activeClearance", "clearance"],
    ["currentService", "service"]
  ];
  var historyNames = { employment: "paid employment", currentJob: "current employment", governmentJob: "government employment", currentGovernmentJob: "current government employment", activeClearance: "an active clearance", clearance: "clearance history", service: "military service", currentService: "current military service", polygraph: "polygraph history" };
  var facts = /* @__PURE__ */ new Map([
    ["employment experience", "employment"],
    ["government employment", "governmentJob"],
    ["military service", "service"],
    ["active security clearance", "activeClearance"],
    ["previous security clearance", "clearance"],
    ["polygraph history", "polygraph"]
  ]);
  function truth(answer, concept) {
    const value = questionKey(answer);
    if (value === "yes") return true;
    if (value === "no" || ["employment", "polygraph"].includes(concept) && value === "none") return false;
    return void 0;
  }
  function evidenceFor(entries, field) {
    const evidence = /* @__PURE__ */ new Map(), queue = [];
    function add(concept, value2, source, path) {
      if (!evidence.has(concept)) evidence.set(concept, /* @__PURE__ */ new Map());
      const witnesses = evidence.get(concept);
      if (witnesses.has(value2)) return;
      witnesses.set(value2, { value: value2, source, path });
      queue.push({ concept, value: value2, source, path });
    }
    for (const row of entries) {
      const name = questionKey(row.question);
      const concept = facts.get(name) || facts.get(questionKey(commonQuestion(name)?.question)) || predicate(name);
      if (!concept) continue;
      const value2 = truth(row.answer, concept);
      if (value2 !== void 0) add(concept, value2, row.question, []);
    }
    const parent = predicate(questionKey(field.parentQuestion)), value = questionKey(field.parentAnswer);
    if (parent && ["yes", "no"].includes(value)) add(parent, value === "yes", "Preceding form answer", []);
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      for (const [narrow, broad] of includes) {
        const from = item.value ? narrow : broad, to = item.value ? broad : narrow;
        if (item.concept === from) add(to, item.value, item.source, [...item.path.length ? item.path : [from], to]);
      }
    }
    return evidence;
  }
  function predicate(clause) {
    const s = clause.replace(/^(?:please )?(?:indicate|specify|confirm) (?:if|whether) (?:or not )?/, "").replace(/^(?:including your current position |at any (?:point|time) in your career )/, "").replace(/^(?:(?:have|did|do|are|were) you |you (?:have |are )?)/, "").replace(/^(?:ever |previously |at any time )/, "");
    if (/^(?:been employed|held (?:a|any) (?:job|paid position)|had (?:a|any) job|worked for pay)$/.test(s)) return "employment";
    if (/^(?:currently employed|employed (?:right now|at present)|currently hold a paid position)$/.test(s)) return "currentJob";
    const govt = "(?:a |an |the )?government";
    if (new RegExp("^(?:currently (?:work for|employed by) " + govt + "|(?:a |an )?current government (?:civilian )?employee)$").test(s)) return "currentGovernmentJob";
    if (new RegExp("^(?:(?:been employed by|worked for) " + govt + "|(?:held|had) (?:a |any )?government (?:civilian )?(?:job|position)|(?:been|served as) (?:a |an )?government (?:civilian )?employee)$").test(s)) return "governmentJob";
    if (/^(?:(?:currently )?(?:hold|have|possess) (?:a |an )?(?:current |active |valid )?(?:security clearance)|currently cleared)$/.test(s)) return "activeClearance";
    if (/^(?:held|had|possessed|been granted) (?:a |an |any )?(?:government |federal )?security clearance$/.test(s)) return "clearance";
    if (/^(?:currently (?:serve|serving) in|an active member of) (?:the )?(?:military|armed forces)$/.test(s)) return "currentService";
    if (/^(?:served in|been a member of) (?:the )?(?:military|armed forces)$/.test(s)) return "service";
    if (/^(?:taken|undergone|completed|had) (?:a |an |any )?polygraph(?: examination| test)?$/.test(s)) return "polygraph";
    return null;
  }
  var details = [
    ["governmentJob", /^(?:(?:your )?current )?government civilian (?:employment )?status$/],
    ["service", /^(?:(?:your )?current )?(?:military (?:service )?(?:branch|status)|branch of (?:military )?service)$/],
    ["clearance", /^(?:(?:what is|indicate|select) (?:your |the )?)?(?:highest |current )?(?:security clearance level|level of security clearance)(?: (?:held|you (?:have )?held))?$/],
    ["polygraph", /^(?:which|what) (?:type|types|type s|kind) of polygraph (?:have you (?:had|taken)|did you (?:take|undergo))$/]
  ];
  var statementForms = [
    ["employment", "employment", false, /^(?:i have never (?:held a job|been employed|worked for pay)|no (?:prior |previous )?(?:paid employment|employment history))$/],
    ["employment", "employment", true, /^(?:i have (?:held a job|been employed|worked for pay)(?: before)?|previously employed)$/],
    ["employment", "currentJob", true, /^(?:i am (?:currently )?employed|currently employed)$/],
    ["employment", "currentJob", false, /^(?:i am (?:currently )?(?:unemployed|not employed)|currently unemployed)$/],
    ["clearance", "clearance", false, /^(?:i have never (?:held|had) (?:a )?(?:security )?clearance|never (?:held|granted) a security clearance)$/],
    ["clearance", "clearance", true, /^i have (?:held|previously held) a security clearance$/],
    ["clearance", "activeClearance", true, /^(?:i (?:have|hold) (?:an? )?(?:active|current) security clearance|active security clearance)$/],
    ["clearance", "activeClearance", false, /^(?:i do not (?:have|hold) an active security clearance|no active security clearance)$/],
    ["service", "service", false, /^(?:i have never served in (?:the )?(?:military|armed forces)|no (?:prior )?military service)$/],
    ["service", "service", true, /^(?:i have served in (?:the )?(?:military|armed forces)|prior military service)$/],
    ["service", "currentService", true, /^i (?:currently serve|am currently serving) in (?:the )?(?:military|armed forces)$/],
    ["government", "governmentJob", false, /^(?:i have never worked for (?:the )?government|no (?:prior )?government employment)$/],
    ["government", "governmentJob", true, /^(?:i have worked for (?:the )?government|prior government employment)$/]
  ];
  var choiceTopics = [
    ["employment", /^(?:paid )?employment (?:status|background|history|experience)$/],
    ["clearance", /^(?:security )?clearance (?:status|background|history)$/],
    ["government", /^government employment (?:status|background|history)$/],
    ["service", /^military (?:status|background|service|history)$/]
  ];
  var neutralChoice = /^(?:(?:please )?(?:choose|select|pick|indicate) (?:the |one |a )?(?:applicable |most accurate |appropriate |following )?(?:option|statement|answer)(?: that (?:best )?(?:applies to|describes) you)?|which (?:of (?:the following|these) )?(?:(?:options?|statements?|answers?) )?(?:best |most accurately )?(?:applies to|describes) you)$/;
  function reasonFromChoices(field, entries, question) {
    if (!["select-one", "combobox", "radio-group"].includes(field.type) || !field.options?.length) return null;
    const prompt = question.replace(/^(?:which (?:statement|option) (?:best|most accurately) describes|(?:please )?(?:select|indicate|describe|specify)|what is) (?:your )?/, "").replace(/^your /, "");
    const topic = choiceTopics.find(([, pattern]) => pattern.test(prompt))?.[0];
    if (!topic && !neutralChoice.test(question)) return null;
    const options = field.options.filter((o) => !o.disabled && !/^(?:|select|select one|select an option|choose one|prefer not to (?:say|answer)|i (?:prefer|do) not (?:wish )?to answer)$/.test(questionKey(o.label)));
    if (options.length < 2) return null;
    const claims = options.map((option2) => {
      const clauses = questionKey(option2.label).split(/ (?:and|but) /);
      const parts = clauses.map((clause) => statementForms.find((form) => form[3].test(clause)));
      return parts.every(Boolean) ? parts : null;
    });
    if (!claims.some(Boolean)) return null;
    if (claims.some((c) => !c) || new Set(claims.flat().map((c) => c[0])).size !== 1 || topic && claims[0][0][0] !== topic) return { blocked: true };
    const evidence = evidenceFor(entries, field);
    const matches = [];
    for (let i = 0; i < claims.length; i++) {
      const proofs2 = claims[i].map(([, concept, expected]) => {
        const witnesses = evidence.get(concept);
        if (witnesses?.size !== 1) return null;
        const witness = witnesses.values().next().value;
        return { witness, satisfied: witness.value === expected };
      });
      if (proofs2.some((p) => p && !p.satisfied)) continue;
      if (proofs2.some((p) => !p)) return { blocked: true };
      matches.push({ option: options[i], proofs: proofs2 });
    }
    if (matches.length !== 1) return { blocked: true };
    const { option, proofs } = matches[0];
    const sources = [...new Set(proofs.map((p) => p.witness.source))];
    return {
      value: option.label,
      display: option.label,
      sourceQuestion: sources.join(" + "),
      requiresReview: true,
      reason: "Supported by " + sources.join(" and "),
      aliases: [questionKey(option.label)]
    };
  }
  function reasonFromHistory(field, entries) {
    const question = questionKey(field.label).replace(/^\d+ /, "");
    const isDefenseHistory = /\bdo you now or did you at any time in the past \d+ months serve as an official or employee of (?:the )?(?:dod|department of defense)(?: for more information see [\w ]+)?$/.test(question);
    const isHistoryChoice = question.includes("post government employment") && question.includes("former military personnel") && question.includes("government employees") && ["select-one", "combobox", "radio-group"].includes(field.type);
    if (isDefenseHistory || isHistoryChoice) {
      const facts3 = evidenceFor(entries, field);
      const absent = (c) => facts3.get(c)?.size === 1 && facts3.get(c).has(false);
      if (!absent("governmentJob") || !absent("service")) return { blocked: true };
      const statement = "I have never been employed by the U.S. government or the U.S. Armed Forces.";
      return { value: isDefenseHistory ? "No" : statement, display: isDefenseHistory ? "No" : statement, reason: "No prior government employment or military service", sourceQuestion: [facts3.get("governmentJob").get(false).source, facts3.get("service").get(false).source].join(" + "), requiresReview: true, aliases: isDefenseHistory ? ["no"] : [questionKey(statement), questionKey(statement).replaceAll("u s", "us")] };
    }
    const detail = details.find(([, pattern]) => pattern.test(question));
    if (/^are you currently employed or have you been employed in the past \w+ years? by /.test(question)) return null;
    const parts = question.split(/\b(and|or)\b/).map((s) => s.trim());
    const concepts = detail ? [detail[0]] : parts.filter((_, i) => i % 2 === 0).map(predicate);
    if (!concepts.some(Boolean)) return reasonFromChoices(field, entries, question);
    const operators = parts.filter((_, i) => i % 2 === 1);
    if (!detail && (new Set(operators).size > 1 || concepts.some((c) => !c))) return { blocked: true };
    const facts2 = evidenceFor(entries, field);
    const known = concepts.map((c) => facts2.get(c));
    if (known.some((values) => values?.size > 1)) return { blocked: true };
    const proofs = known.map((values) => values?.values().next().value);
    let proof;
    if (!detail && operators.length) {
      const decisive = operators[0] === "or";
      const witness = proofs.find((p) => p?.value === decisive);
      if (!witness && proofs.some((p) => !p)) return { blocked: true };
      proof = witness ? [witness] : proofs;
    } else if (proofs[0]) proof = [proofs[0]];
    if (!proof || detail && proof[0].value) {
      const exact = entries.filter((row) => questionKey(row.question) === question);
      const values = new Set(exact.map((row) => row.answer.trim()));
      if (values.size === 1 && exact.length) return { value: exact[0].answer, display: exact[0].answer, sourceQuestion: exact[0].question, reason: "Your saved answer to this question", requiresReview: true };
      return { blocked: true };
    }
    const absentLevel = detail && ["clearance", "polygraph"].includes(detail[0]);
    const value = detail ? absentLevel ? "None" : "N/A" : proof[0].value ? "Yes" : "No";
    const sources = [...new Set(proof.map((p) => p.source))];
    const path = proof.find((p) => p.path.length)?.path;
    const reason = detail ? "No applicable history for this field" : operators.length ? "Resolved from the component questions" : path ? "Based on " + path.map((c) => historyNames[c]).join(" \u2192 ") : "From your recorded history";
    return {
      value,
      display: value,
      sourceQuestion: sources.join(" + "),
      requiresReview: true,
      reason,
      ...detail ? { aliases: absentLevel ? ["none", detail[0] === "clearance" ? "no clearance" : "no polygraph", "none of the above", "not applicable", "n a", "no"] : ["n a", "not applicable", "none", "did not serve", "no military service", "not applicable n a"] } : {}
    };
  }

  // tools/application-helper/answer-rules.mjs
  function applicationSeason(title = "") {
    const s = questionKey(title);
    const seasons = ["summer", "fall", "autumn", "winter", "spring"].filter((x) => new RegExp("\\b" + x + "\\b").test(s));
    if (seasons.length !== 1) return "";
    if (seasons[0] === "summer") {
      const years = s.match(/\b20\d{2}\b/g) || [];
      return years.length === 1 ? "summer-" + years[0] : "";
    }
    return seasons[0];
  }
  var stateCodes = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" "));
  var stateNames = new Set("alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|district of columbia|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming".split("|"));
  var regionNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
  var countryNames = /* @__PURE__ */ new Set();
  for (const a of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") for (const b of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    const name = regionNames.of(a + b);
    if (name) countryNames.add(questionKey(name));
  }

  // tools/application-helper/answer-rules.mjs?v=20261123.3
  function ageThreshold(q) {
    const s = questionKey(q);
    const m = s.match(/^are you (?:at least )?(\d{1,2})(?: years)?(?: of age| old)?(?: or (?:older|over|above))?$/) || s.match(/^are you (\d{1,2}) years old or older$/);
    return m ? Number(m[1]) : null;
  }
  function dateConcept(q) {
    const s = questionKey(String(q || "").split("?")[0]).replace(/ date year month day$| date year month$| yyyy mm dd$| yyyy mm$/, "");
    if (/^(?:when (?:do you (?:expect|plan) to|will you) graduate|(?:what is your |please (?:provide|enter) your )?(?:expected|anticipated) (?:date of graduation|graduation month and year))$/.test(s)) return "graduation";
    if (/^(what is your |when is your )?(expected |anticipated )?graduation (date|day month year)$/.test(s)) return "graduation";
    if (/^(summer internship start date|when (can|could) you start|when are you available to start|(?:what is your |please (?:provide|indicate) your )?(earliest (?:(?:available|possible) )?(?:internship )?start date|(?:internship )?start date|availability to start))( for an internship)?$/.test(s)) return "start";
    if (/^(summer internship end date|(?:what is your |please (?:provide|indicate) your )?(latest (?:(?:available|possible) )?(?:internship )?end date|(?:internship )?end date))( for an internship)?$/.test(s)) return "end";
    return null;
  }
  var fullTimeQuestion = (q) => /^are you (able|available) to work full time\b/.test(questionKey(q));
  function applicationSeason2(title = "") {
    const s = questionKey(title);
    const seasons = ["summer", "fall", "autumn", "winter", "spring"].filter((x) => new RegExp("\\b" + x + "\\b").test(s));
    if (seasons.length !== 1) return "";
    if (seasons[0] === "summer") {
      const years = s.match(/\b20\d{2}\b/g) || [];
      return years.length === 1 ? "summer-" + years[0] : "";
    }
    return seasons[0];
  }
  var stateCodes2 = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" "));
  var stateNames2 = new Set("alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|district of columbia|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming".split("|"));
  var regionNames2 = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
  var countryNames2 = /* @__PURE__ */ new Set();
  for (const a of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") for (const b of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    const name = regionNames2.of(a + b);
    if (name) countryNames2.add(questionKey(name));
  }
  function jobJurisdiction(location2 = "") {
    const value = location2.trim().replace(/\s*\((?:remote|hybrid|on[- ]site)\)$/i, "").replace(/^remote[\s:–-]+/i, "");
    if (!value || /[;/]|\sor\s/i.test(value)) return "";
    if (value === "Outside the United States") return "foreign";
    const parts = value.split(/\s*,\s*|\s+[-–·]\s+/), last = parts.at(-1).replace(/\s+\d{5}(?:-\d{4})?$/, "");
    const name = questionKey(last);
    if (["us", "u s", "usa", "u s a", "united states", "united states of america"].includes(name)) return "us";
    if (last === "Georgia" || last === "GA" && parts.length === 1) return "";
    if (stateNames2.has(name) || parts.length > 1 && stateCodes2.has(last)) return "us";
    if (countryNames2.has(name) || ["uk", "united kingdom", "south korea"].includes(name)) return "foreign";
    return "";
  }
  function analogousQuestion(label) {
    const q = questionKey(label).replace(/^\d+ /, "");
    const templates = [
      ["preference", /^(?:what is your preferred|please select your preferred|preferred) (.+)$/],
      ["preference", /^(?:which|what) (.+) (?:do|would) you prefer$/],
      ["pursuing", /^(?:which|what) (.+) are you (?:currently )?(?:pursuing|working toward|studying for)$/],
      ["pursuing", /^(.+) (?:currently )?being pursued$/]
    ];
    for (const [slot, pattern] of templates) {
      const object = q.match(pattern)?.[1];
      if (object && !/\b(?:not|except|excluding|or|and)\b/.test(object)) return slot + " " + object;
    }
    return "";
  }
  function numericChoice(label, value) {
    const s = String(label).toLowerCase().trim().replace(/years?\b/g, "").replace(/\s+/g, " ").trim();
    if (/^\d+$/.test(s)) return value === Number(s);
    let m = s.match(/^(\d+)\s*(?:[-–—]|to|through)\s*(\d+)$/);
    if (m && +m[1] <= +m[2]) return +m[1] <= value && value <= +m[2];
    m = s.match(/^(\d+)\s*(?:\+|or (?:more|later)|and (?:above|over))$/);
    if (m) return value >= +m[1];
    m = s.match(/^(?:before|less than|under|<)\s*(\d+)$/);
    if (m) return value < +m[1];
    m = s.match(/^(?:after|more than|over|>)\s*(\d+)$/);
    if (m) return value > +m[1];
    return void 0;
  }
  function answerRule(field, profile, memory = [], origin = "", context = "", now = /* @__PURE__ */ new Date()) {
    const entries = [...profile.answers || [], ...memory.filter((a) => a.scope === "*" || a.scope === origin && a.context === context)];
    const unique = (q2) => {
      const values = entries.filter((a) => questionKey(a.question) === questionKey(q2)).map((a) => a.answer.trim());
      return new Set(values).size === 1 ? values[0] : null;
    };
    const result = (value, reason, aliases3) => ({ value, display: value, reason, sourceQuestion: "Saved preferences", requiresReview: false, ...aliases3 ? { aliases: aliases3 } : {} });
    const q = questionKey(field.label), fact = (name) => {
      const values = entries.filter((a) => commonQuestion(a.question)?.question === name).map((a) => a.answer.trim());
      return new Set(values).size === 1 ? values[0] : null;
    };
    const stem = questionKey(String(field.label || "").split("?")[0]).replace(/^\d+ /, "");
    const saved = (value, name, aliases3) => ({ ...result(value, "From your application profile", aliases3), sourceQuestion: name });
    const channels = { sms: /\b(?:sms|text(?:ing|s| messages?)?)\b/.test(stem), email: /\be ?mail\b/.test(stem) };
    const contact = /\b(?:consent|may we|can we|opt in|permission|agree|approve|would you like|allow|authorize|may i contact)\b/.test(stem);
    const policy = "SMS employer policy";
    if (contact && (channels.email || channels.sms) && (unique(policy) || unique("Email recruiting contact"))) {
      if (/\b(?:opt out|withdraw|decline|not|unsubscribe|marketing|promotional)\b/.test(stem)) return { blocked: true };
      let sms2;
      if (channels.sms && unique(policy) === "Tech or major defense only; exclude Leidos") {
        let hostname = "";
        try {
          hostname = new URL(origin).hostname;
        } catch {
        }
        const tenant = hostname.match(/^([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com$/i)?.[1];
        const employerDomain = hostname.match(/(?:^|\.)(amazon|google|microsoft|leidos|lockheedmartin|northropgrumman|boeing|raytheon|nvidia|apple)\.(?:com|jobs)$/i)?.[1];
        const company2 = questionKey(field.jobEmployer || !context.startsWith("page:") && context || tenant || employerDomain).replace(/ (?:corporation|corp|inc|llc|company)$/, "");
        const recognized = /^(?:lockheed(?: ?martin)?|northrop ?grumman|boeing|general dynamics|bae systems|raytheon|rtx|l3harris(?: technologies)?|anduril(?: industries)?|amazon(?: web services| com)?|aws|google|alphabet|microsoft|apple|meta(?: platforms)?|nvidia)$/.test(company2);
        const technology = /^(?:big tech|tech(?:nology)?|information technology(?: and services)?|software(?: development| publishing)?|computer software|semiconductors|computer hardware(?: manufacturing)?|technology information and internet)$/i.test(questionKey(field.jobIndustry));
        const excluded = /^leidos\b/.test(company2) || /^leidos/i.test(tenant || employerDomain || "");
        sms2 = !excluded && (recognized || technology) ? "Yes" : "No";
      }
      const email = unique("Email recruiting contact");
      if (channels.email && channels.sms && sms2 !== email) return { blocked: true };
      const answer = channels.sms ? sms2 : email;
      if (answer === "Yes" || answer === "No") return saved(answer, channels.sms ? policy : "Email recruiting contact", [questionKey(answer), answer === "Yes" ? "yes i consent" : "no i do not consent"]);
      return { blocked: true };
    }
    if (/^are you (?:willing|open|prepared) to relocate(?: if(?: necessary)?(?: (?:by|for) (?:the|this) (?:role|position|job))?)?$/.test(stem) && unique("Relocation states")) {
      const location2 = field.relocationLocation || field.jobLocation || "";
      if (/[;/]|\sor\s/i.test(location2)) return { blocked: true };
      const regions = location2.replace(/,\s*(?:USA|US|United States(?: of America)?)$/i, "").split(/,\s*/);
      const state2 = regions.at(-1).trim().replace(/\s+\d{5}(?:-\d{4})?$/, "");
      const names = [...stateNames2], codes = [...stateCodes2];
      const code = stateCodes2.has(state2) ? state2 : codes[names.indexOf(questionKey(state2))];
      if (!code) return { blocked: true };
      return saved(unique("Relocation states").split(/,\s*/).includes(code) ? "Yes" : "No", "Relocation states");
    }
    const relationships = /\b(?:spouse|family|relative|relationship|married)\b/.test(stem);
    if (/\b(?:non us|non u s|foreign) government official\b/.test(stem)) {
      const source = relationships ? "Family or close relationship with a non-US government official" : "Current or previous non-US government official";
      if (unique(source) === "No" && /^(?:are|have|do) you\b/.test(stem)) return saved("No", source);
    }
    if (/\b(?:military spouse|spouse of (?:a |an )?(?:current or former )?(?:service member|military member))\b/.test(stem) && unique("Current or former military spouse") === "No") return saved("No", "Current or former military spouse");
    if (/\b(?:family members?|immediate family|relatives?)\b/.test(stem) && /\b(?:serve|served|serving|in)\b.*\b(?:military|armed forces)\b/.test(stem) && unique("Family military service") === "No") return saved("No", "Family military service");
    if (/\bhighest (?:level of education|degree|diploma|qualification)\b/.test(stem) && /\b(?:received|completed|awarded|earned|attained)\b/.test(stem) && unique("Highest completed degree")) return saved(unique("Highest completed degree"), "Highest completed degree");
    if (/^(?:are you|are you currently) (?:working (?:toward|towards|on)|pursuing|studying for) (?:a |an? )?bachelor(?: s|s)?(?: degree)?(?: or (?:a )?master(?: s|s)?(?: degree)?)?$/.test(stem) && /^bachelor\b/i.test(unique("Degree being pursued") || "") && unique("Full-time student enrollment") === "Yes") return saved("Yes", "Degree being pursued");
    const usEligible = /^are you (?:legally )?eligible for employment in (?:the )?(?:united states|u s|us)$/.test(stem);
    const usProof = /^(?:if hired )?(?:can|could|will|are) you (?:be able to |able to )?(?:provide|submit|furnish|present) (?:proof|verification|documentation|evidence) (?:of|that) .*\b(?:employment eligibility|eligible (?:for employment|to work)|right to work|authorized to work)\b/.test(stem);
    const usCitizen = (unique("Citizenships") || "").split(/[,;]/).some((v) => ["united states", "usa", "us", "united states of america"].includes(questionKey(v)));
    const proofOnly = /^(?:if hired )?(?:can|could|will) you (?:provide|submit|furnish|present) (?:proof|verification|documentation|evidence) of (?:your )?(?:employment eligibility|eligibility (?:for employment|to work))(?: in (?:the )?(?:united states|us|u s))?$/.test(stem);
    const proofFact = "Can provide a valid US passport, US birth certificate or certificate of naturalization on request";
    if (proofOnly && usCitizen && unique(proofFact) === "Yes" && (/\b(?:united states|u s|us)$/.test(stem) || jobJurisdiction(field.jobLocation) === "us")) return saved("Yes", proofFact);
    if (usEligible && usCitizen) return saved("Yes", "Citizenships");
    if (usProof && usCitizen && unique(proofFact) === "Yes" && /\bin (?:the )?(?:united states|u s|us)$/.test(stem)) return saved("Yes", proofFact);
    const alternatives = stem.replace(/^(do you (?:have|hold|possess)|are you) (?:an? )?/, "").replace(/\b(?:an?|either)\b/g, " ").replace(/\s+/g, " ").trim();
    const diplomaOption = /^(?:high school diploma|ged|general equivalency diploma)(?: or (?:high school diploma|ged|equivalent|general equivalency diploma))*$/;
    if (/^do you (?:have|hold|possess) /.test(stem) && diplomaOption.test(alternatives) && alternatives.includes("high school diploma") && questionKey(unique("Highest completed degree")) === "high school diploma") return saved("Yes", "Highest completed degree");
    const statuses = alternatives.replace(/\bu s\b|\bunited states\b/g, "us");
    if (stem.startsWith("are you ") && usCitizen && /\bus citizen\b/.test(statuses) && /^(?:us citizen)(?: (?:or )?(?:us national|national|lawful permanent resident|permanent resident|asylee|refugee))+$/.test(statuses) && /\bor\b/.test(alternatives)) return saved("Yes", "Citizenships");
    const familyEmployer = /^(?:do you have (?:any )?(?:relatives?|family members?) (?:who |that )?(?:work(?:s|ing)? (?:for|at)|(?:are )?employed (?:by|at))|(?:are|is) (?:any of )?your (?:relatives?|family members?) (?:currently )?(?:employed (?:by|at)|working (?:at|for))) (.+)$/.exec(stem);
    const company = field.jobEmployer || !context.startsWith("page:") && context;
    if (familyEmployer && (/^(?:us|here|(?:our|this|the) (?:company|organization))$/.test(familyEmployer[1]) || company && familyEmployer[1] === questionKey(company))) {
      const explicit = memory.filter((a) => questionKey(a.question) === stem && a.scope === origin && a.context === context);
      if (explicit.length) {
        const answers = new Set(explicit.map((a) => a.answer));
        return answers.size === 1 ? saved(explicit[0].answer, explicit[0].question) : { blocked: true };
      }
      const source = company && [company + " relatives", company + " relatives or acquaintances"].find((key2) => unique(key2));
      const pref = source || "Relatives working for the prospective employer";
      return unique(pref) ? saved(unique(pref), pref) : { blocked: true };
    }
    if (field.options?.length && ["combobox", "select-one", "radio-group"].includes(field.type)) {
      const year = /^(?:(?:what is your |select your |indicate your )?(?:anticipated|expected|projected) (?:graduation year|year of graduation)|(?:in )?(?:which|what) year (?:will you|do you (?:expect|plan) to) graduate)$/.test(stem);
      const tenure = /^(?:(?:how many|number of) years of (?:paid (?:work|employment)|professional (?:employment|work)) experience(?: do you have)?|years of paid employment)$/.test(stem);
      if (year || tenure) {
        const source = year ? "Expected graduation date" : "Employment experience", value = unique(source);
        const number = year && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(value || "") ? Number(value.slice(0, 4)) : tenure && questionKey(value) === "none" ? 0 : null;
        if (number === null) return { blocked: true };
        const options2 = field.options.filter((o) => !o.disabled && o.value !== "" && !/^(?:select(?: one| an option)?|choose one|prefer not to answer)$/.test(questionKey(o.label)));
        const verdicts = options2.map((o) => tenure && /^(?:none|no (?:paid )?experience)$/i.test(o.label.trim()) ? number === 0 : numericChoice(o.label, number));
        const matches = options2.filter((_, i) => verdicts[i] === true);
        if (matches.length !== 1 || verdicts.includes(void 0)) return { blocked: true };
        return saved(matches[0].label, source);
      }
    }
    const inference = reasonFromHistory(field, entries);
    if (inference) return inference;
    const prescreen = "Willing to complete a U.S. Government Security Prescreen Questionnaire";
    const prescreenQuestion = q.split(" your no answer")[0];
    if (/(?:^| )are you willing to (?:complete|fill out) (?:a |the )?security pre ?screen(?:ing)? questionnaire$/.test(prescreenQuestion) && unique(prescreen))
      return result(unique(prescreen), "Your saved security prescreen preference");
    const privateRules = [
      ["Preferred first name", /^(preferred first name|what is your preferred first name)$/],
      ["Military service", /^have you (ever )?served in (the )?(u s |united states )?(military|armed forces)$/],
      ["Government employment", /^have you (ever )?(held a (u s |united states )?government position|been (a |an )?(u s |united states )?government employee)$/],
      ["Belgian work visa", /^do you have a visa to work in belgium$/],
      ["Belgian residence", /^do you (currently )?(live|reside) in belgium$/],
      ["Active security clearance", /^(security clearance active|do you (currently )?(have|hold) an active security clearance)$/],
      ["Previous security clearance", /^(security clearance inactive within 2 years|have you ever held a security clearance)$/]
    ];
    const confirmed = (value, sourceQuestion, aliases3) => ({ ...result(value, "From your application profile", aliases3), sourceQuestion, requiresReview: true });
    if (/^(?:(?:please )?(?:confirm|verify|repeat|re ?type|re ?enter)(?: your)? e ?mail(?: address)?|e ?mail(?: address)? confirmation)$/.test(q)) {
      const email = profile.values?.email;
      if (!email || field.primaryEmail && field.primaryEmail.trim().toLowerCase() !== email.trim().toLowerCase()) return { blocked: true };
      return confirmed(email, "Profile email");
    }
    if (/^(?:title|salutation|honorific|name prefix)$/.test(q) && unique("Personal title") && ((field.options || []).some((o) => /^(?:mr|mrs|ms|dr|miss|doctor)$/.test(questionKey(o.label))) || q !== "title")) return confirmed(unique("Personal title"), "Personal title");
    if (/^preferred (?:last name|surname|family name)$/.test(q) && unique("Preferred last name")) return confirmed(unique("Preferred last name"), "Preferred last name");
    if (q === "current professional title" && fact("Employment experience") === "None" && profile.values?.major && fact("Full-time student enrollment") === "Yes") return confirmed(profile.values.major + " Student", "Full-time student enrollment");
    if (/^(?:home |residence )?county$/.test(q) && unique("Home county")) return confirmed(unique("Home county"), "Home county", [questionKey(unique("Home county")), questionKey(unique("Home county")).replace(/ county$/, "")]);
    const options = (field.options || []).map((o) => questionKey(o.label));
    if (field.type === "checkbox-group" && /^(?:select (?:the |all )?races? you identify with|race|ethnicity|race ethnicity)$/.test(q) && /^asian(?:$| not hispanic)/.test(questionKey(fact("Race / ethnic background")))) return { ...confirmed("Asian", "Race / ethnic background"), raceSelection: true };
    const prompt = q.replace(/^\d+ /, "");
    const sources = [
      ["Polygraph history", /^(?:which|what) types?(?: s)? of polygraph (?:have you had|have you taken)$/],
      ["Government debarment or proposed debarment", /^have you been suspended or debarred\b.*\bfrom doing business with (?:any |a )?government(?:al)? entit/],
      ["Civil False Claims Act liability", /^have you (?:ever )?been found liable for (?:a violation of )?the civil false claims act\b/],
      ["Known relatives employed by government", /^do you have (?:any )?(?:family members|relatives) (?:working (?:in|for)|employed by) (?:the |a )?(?:us |u s |federal )?government$/],
      ["Hispanic or Latino identification", /^(?:are you )?hispanic or latino$/],
      ["Previous security clearance", /^have you (?:ever|previously) (?:had|held|possessed) (?:a |an )?(?:government |federal )?security clearance$/]
    ];
    for (const [source, pattern] of sources) {
      const value = unique(source);
      if (value && pattern.test(prompt)) return confirmed(value, source, source === "Polygraph history" && value === "None" ? ["none", "no", "n a", "not applicable", "no polygraph", "none of the above"] : void 0);
    }
    const contacts = /^do you have (?:any )?relatives or acquaintances (?:employed (?:at|by)|working (?:at|for)) (.+?)(?: or (?:its|their) (?:subsidiaries|affiliates)(?: affiliates)?)?$/.exec(prompt);
    if (contacts) {
      const source = contacts[1] + " relatives or acquaintances", value = unique(source);
      return value ? confirmed(value, source) : { blocked: true };
    }
    const nationalities = new Set((unique("Citizenships") || "").split(/[,;]/).map(questionKey).filter(Boolean));
    if (nationalities.size > 1 && /^(?:are you (?:also )?a citizen of (?:any |an? )?(?:other|another|second) countr(?:y|ies)|do you (?:hold|have) dual citizenship)$/.test(prompt)) return confirmed("Yes", "Citizenships");
    if (unique("Government employment") === "No" && /^(?:current )?government civilian (?:status|start date|separation from service date|transition leave date)(?: if applicable)?$/.test(prompt))
      return prompt.endsWith("status") ? confirmed("N/A", "Government employment", ["n a", "not applicable", "none", "never employed"]) : { blocked: true };
    const employmentClause = prompt.replace(/^are you currently employed or have you been employed /, "have you been employed ").replace(/^in the (?:past|last) (?:\w+ )?years?(?: from today s date)? /, "").replace(/ other than temporary .*$/, "");
    if (/\b(?:worked|employed)\b.*\bor (?:volunteer(?:ed|ing)?|applied|served on|owned)\b/.test(employmentClause)) return { blocked: true };
    if (questionKey(fact("Employment experience")) === "none" && /^have you been employed (?:in the past \w+ years? )?by (?:a |an |the )?(?:private sector|state or local government)\b/.test(employmentClause) && !/(?:\bor (?!local government|competition for)|\b(?:family|relative|spouse|never|not)\b)/.test(employmentClause))
      return confirmed("No", "Employment experience");
    if (unique("Consideration for other domestic positions") === "Yes" && /^i understand that i may be considered for other open positions in my country in addition to the role s? ?to which i apply$/.test(prompt) && field.type === "radio-group" && field.options?.length === 1)
      return confirmed("Yes", "Consideration for other domestic positions", [questionKey(field.options[0].label)]);
    const negativeDisability = "no i do not have a disability and have not had one in the past";
    if (unique("Current or past disability") === "No" && options.includes(negativeDisability) && options.some((o) => o.startsWith("yes i have a disability"))) return confirmed("No, I do not have a disability and have not had one in the past", "Current or past disability", [negativeDisability]);
    if (/^(?:do you (?:currently )?have a disability|do you have or have you ever had a disability)$/.test(q) && unique("Current or past disability") === "No") return confirmed("No", "Current or past disability");
    if (/^are you willing to (?:undergo|submit to) (?:a |an? employment )?background check(?: in accordance with local (?:law|laws)(?: regulations)?)?$/.test(q) && fact("Post-offer federal background check, physical and drug screen") === "Yes") return confirmed("Yes", "Post-offer federal background check, physical and drug screen");
    if (commonQuestion(q)?.question === "Phone device type" && fact("Phone device type") === "Mobile") return confirmed("Mobile", "Phone device type", ["personal mobile", "mobile", "mobile phone", "cell", "cell phone", "cellular"]);
    if (commonQuestion(q)?.question === "Preferred contact method" && fact("Preferred contact method") === "Email")
      return confirmed("Email", "Preferred contact method", ["email", "e mail", "email address", "by email"]);
    const mainQuestion = questionKey(String(field.label).split("?")[0]);
    const employment = mainQuestion.replace(/^are you (?:a |an )?former employee of /, "have you worked for ").replace(/^are you currently or have you (?:previously |ever )?worked (for|at) /, "have you worked $1 ").replace(/ this does not include contractor consultant or vendor roles$/, "");
    if (/^(?:were you (?:ever |previously )?employed (?:by|at)|have you (?:ever |previously )?(?:been employed by|worked (?:at|for))|are you (?:currently employed by|(?:an? )?current employee of)) .+/.test(employment) && !/\b(?:family|relatives?|spouse|applied|volunteer(?:ed|ing)?|board|shareholder|friends?|anyone|not|except|other than|or (?:are|have|will|do|did|would|can|could|is))\b/.test(employment) && questionKey(fact("Employment experience")) === "none")
      return confirmed("No", "Employment experience");
    const sms = "SMS contact about my job application";
    if (/\b(?:sms|text messages?)\b/.test(q) && /\b(?:application|recruiting|recruitment)\b/.test(q) && /\b(?:approve|consent|agree|opt in|permission|receive|may we|can we)\b/.test(q) && !/\b(?:opt out|decline|marketing|advertising|not|sales)\b/.test(q) && unique(sms))
      return confirmed(unique(sms), sms);
    const active = "Active security clearance", previous = "Previous security clearance";
    const clearanceLevel = /^security clearance (active|inactive within (the past )?2 years)$/.exec(q);
    if (clearanceLevel) {
      const source = clearanceLevel[1] === "active" ? active : previous;
      if (unique(source) === "No") return confirmed("None of the Above", source, ["none of the above", "no clearance", "none", "no"]);
    }
    const parent = questionKey(field.parentQuestion), parentValue = questionKey(field.parentAnswer);
    if (/^(security clearance )?date granted$/.test(q) && (parent.includes("security clearance") || q.includes("clearance")) && unique(previous) === "No") return { blocked: true };
    const na = ["n a", "na", "not applicable", "not applicable n a", "none", "did not serve", "no military service"];
    if (/^(?:current )?(?:us |u s )?military (branch|status)$/.test(q) && unique("Military service") === "No" && parentValue !== "yes") return result("N/A", "No military service", na);
    const gov = q.replace(/^including your current position /, "");
    if (/^have you (?:ever |previously )?(?:served as|been|worked as) (?:a |an )?(?:u s |united states )(?:federal )?government employee\b/.test(gov) && !/\b(?:family|relative|spouse|or contractor|or worked)\b/.test(gov) && (unique("Government employment") === "No" || !entries.some((entry) => questionKey(entry.question) === "government employment") && fact("Employment experience") === "None")) return result("No", "Your employment history");
    if (/^have you (ever )?served in (the )?(u s |united states )?(military|armed forces)$/.test(gov) && unique("Military service") === "No") return result("No", "Your military service history");
    if (/^have you ever worked for lockheed martin\b/.test(q) && q.endsWith("as a contractor vendor that provided services to us") && fact("Employment experience") === "None") return confirmed("No", "Employment experience");
    if (/^have you (ever |previously )?worked (for|at) (us|our company|this company)$/.test(q) && fact("Employment experience") === "None") return confirmed("No", "Employment experience");
    if (/\bif (?:you (?:selected|answered) )?no (?:please )?(?:enter|type|write|select|put) (?:n a|not applicable)$/.test(q)) {
      if (parent && parentValue === "no") return result("N/A", "The preceding answer is No and this field requests N/A", na);
      return { blocked: true };
    }
    if (/^(?:source )?details?$/.test(q) && /^how (did|do) you (hear|learn|find out) about/.test(parent) && /website|career site/.test(parentValue)) {
      return { ...result("Company career site", "The preceding source is Company Website", ["company website", "company career site", "our website"]), careerSiteDetail: true };
    }
    if (/^please indicate the ethnic group with which you identify\b/.test(q) || commonQuestion(q)?.question === "Race / ethnic background") {
      const race = fact("Race / ethnic background");
      if (questionKey(race) === "asian not hispanic or latino") return confirmed(race, "Race / ethnic background", ["asian not hispanic latino", "asian not hispanic or latino", "asian"]);
    }
    const restricted = "Only recruiters managing jobs I apply to";
    if ((/^(?:make my profile visible to|profile visibility|who can (?:see|view) (?:my|your) profile)$/.test(q) || (field.options || []).some((o) => questionKey(o.label) === questionKey(restricted))) && unique("Recruiter profile visibility") === restricted) return confirmed(restricted, "Recruiter profile visibility");
    if (/^are you (?:a |an? )?protected veteran$/.test(q) && unique("Protected veteran status") === "I am not a protected veteran") return confirmed("No", "Protected veteran status", ["no", "no i am not a protected veteran", "i am not a protected veteran", "not a protected veteran"]);
    if ((/^(?:protected )?veteran (?:self identification )?status$/.test(q) || /^please select your protected veteran status\b/.test(q)) && unique("Protected veteran status") === "I am not a protected veteran")
      return confirmed("I am not a protected veteran", "Protected veteran status", ["i am not a protected veteran", "i am not a protected veteran i prefer not to answer", "not a protected veteran", "i am not a veteran", "not a veteran", "i am not a protected veteran or veteran"]);
    const agreement = "I have read and understand and I agree to the above";
    if (q === questionKey(agreement) && unique(agreement) === "Yes") return result("Yes", "Your saved answer for this acknowledgment");
    const citizen = String(unique("Citizenships") || "").split(";").some((v) => ["united states", "united states of america", "us", "usa"].includes(questionKey(v)));
    if (q === "please review the question again to confirm your response is correct" && field.parentIncludesCitizenCategory && parentValue === "yes" && citizen)
      return { ...confirmed("Confirming my response to the US Persons question is correct.", "Previous US Persons answer"), confirmUSPersons: true };
    if (/^please indicate if you belong to one of the categories above$/.test(q)) {
      if (citizen && field.includesCitizenCategory) return confirmed("Yes", "Citizenships", ["yes", "u s citizen", "us citizen", "united states citizen"]);
      return { blocked: true };
    }
    if (/^are you (a |an )?(u s|us|united states) citizen$/.test(q) && citizen) return confirmed("Yes", "Citizenships");
    const auth = "Are you legally authorized to work in the United States?";
    if (citizen && /\bare you a (?:u s|us|united states) citizen lawful permanent resident refugee or asylee$/.test(q)) return confirmed("Yes", "Citizenships");
    const proof = "Can provide a valid US passport, US birth certificate or certificate of naturalization on request";
    if (/^(?:if hired )?can you (?:submit|provide) (?:verification|proof|documentation) of your (?:legal )?right to work in (?:the )?(?:us|u s|united states)$/.test(q) && citizen && unique(proof) === "Yes") return confirmed("Yes", proof);
    if (/\bexport control(?:led)?\b/.test(q) && /\b(?:select|choose) (?:among |one of )?(?:the following|an option|which statement)/.test(q)) {
      if (!citizen || unique(proof) !== "Yes") return { blocked: true };
      const option = "I am a US Person and can provide a valid, unexpired US Passport or US birth certificate or certificate of naturalization upon request.";
      return confirmed(option, proof, [questionKey(option), questionKey(option).replaceAll("us ", "u s ")]);
    }
    if (/^are you (?:legally )?(?:authorized|eligible) to work (?:for (?:any|an?) (?:us|u s|united states) employer|in (?:the )?(?:us|u s|united states))$/.test(q) && (fact(auth) || citizen))
      return confirmed(fact(auth) || "Yes", fact(auth) ? auth : "Citizenships");
    const sponsor = "Will you now or in the future require sponsorship for employment visa status?";
    if (/^are you (?:legally )?authorized to work in (?:the )?(?:united states|u s|us) without (?:any |employer |visa )?sponsorship$/.test(q)) {
      if (fact(auth) === "No" || fact(sponsor) === "Yes") return confirmed("No", fact(auth) === "No" ? auth : sponsor);
      if (citizen || fact(auth) === "Yes" && fact(sponsor) === "No") return confirmed("Yes", citizen ? "Citizenships" : auth);
      return { blocked: true };
    }
    const region = jobJurisdiction(field.jobLocation || field.workQuestionCountry || "");
    if (/^do you (?:have|hold) a valid driver(?: s)? licen[cs]e for (?:the )?country (?:in which|where) (?:this|the) job (?:resides|is located|is based)$/.test(q) && unique("Valid driver\u2019s license") === "Yes" && unique("Driver license issuing country") === "United States") {
      if (region === "us") return confirmed("Yes", "Driver license issuing country");
      if (region === "foreign" && unique("Driver license valid for jobs outside the US") === "No") return confirmed("No", "Driver license valid for jobs outside the US");
      return { blocked: true };
    }
    if (/^if hired can you (?:furnish|provide) proof that you are eligible to work in the country where (?:the|this) job resides$/.test(q)) return region === "us" && citizen && unique(proof) === "Yes" ? confirmed("Yes", proof) : { blocked: true };
    if (field.languageRow === "english" && /^(reading|speaking|writing|understanding|listening)$/.test(q) && unique("English proficiency") === "Fluent") return confirmed("Fluent", "English proficiency", ["fluent"]);
    if (/^(?:current (?:or |and )?last|current or most recent|last held) (?:position|job) title$/.test(q) && fact("Employment experience") === "None") return confirmed("Not Applicable", "Employment experience");
    if (/^(?:primary )?country(?: region)? of citizenship$/.test(q) && ["combobox", "select-one"].includes(field.type)) {
      const chosen = unique("Single-country citizenship preference");
      if (chosen && nationalities.has(questionKey(chosen))) return confirmed(chosen, "Single-country citizenship preference", chosen === "United States" ? ["united states", "united states of america", "usa", "us"] : void 0);
    }
    const collegeStart = unique("University start month"), collegeEnd = unique("Expected graduation date");
    if (field.educationSchool && questionKey(field.educationSchool) === questionKey(profile.values.school) && ["from", "to actual or expected", "start date", "end date actual or expected"].includes(q)) {
      const month = /^(?:from|start date)$/.test(q) ? collegeStart : collegeEnd;
      if (/^\d{4}-\d{2}$/.test(month || "") && (field.type === "month" || /^yyyy$/i.test(field.placeholder || ""))) return confirmed(field.type === "month" ? month : month.slice(0, 4), "University attendance dates");
    }
    const savedSchool = questionKey(profile.values?.school), rowSchool = questionKey(field.educationSchool);
    const universityRow = !!rowSchool && (rowSchool === savedSchool || savedSchool.startsWith(rowSchool + " ") && / university$/.test(rowSchool));
    const secondaryRow = !!rowSchool && rowSchool === questionKey(fact("High school name"));
    if (field.educationEntry) {
      if (/^(?:start date|end date|from|to actual or expected)$/.test(q)) {
        const start = /^(?:start date|from)$/.test(q);
        const source = universityRow ? start ? "University start month" : "Expected graduation date" : secondaryRow && !start ? "High school graduation month" : "";
        const month = source && unique(source);
        if (!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month || "")) return { blocked: true };
        if (field.type === "month") return confirmed(month, source);
        if (field.type === "date" && unique("Day for month-only school dates") === "First of the month") return confirmed(month + "-01", source);
        if (field.yearOnly || /^yyyy$/i.test(field.placeholder || "") || field.maxLength === 4 || field.type === "number" && Number(field.min) >= 1900 && Number(field.max) <= 2200 && Number(field.max) >= 2e3) return confirmed(month.slice(0, 4), source);
        return { blocked: true };
      }
      if (/^(?:school |campus )?location$/.test(q)) {
        const source = universityRow ? "University location" : secondaryRow ? "High school location" : "";
        return source && unique(source) ? confirmed(unique(source), source) : { blocked: true };
      }
      if (/^(?:is current study|currently studying|currently attending)$/.test(q)) {
        if (universityRow && fact("Full-time student enrollment") === "Yes") return confirmed("Yes", "Full-time student enrollment");
        if (secondaryRow && unique("High school graduation month") && unique("High school graduation month") < now.toISOString().slice(0, 7)) return confirmed("No", "High school graduation month");
        return { blocked: true };
      }
      if (!universityRow && /^(?:major|field of study)$/.test(q)) return { blocked: true };
    }
    const countryDependent = /^(?:are you|will you be) (?:legally )?(?:authorized|eligible) to work in (?:the|this) country (?:of the job for which you are applying|where (?:this|the) (?:job|role|position) is (?:located|based))$/.test(q) || /^(?:will|do) you (?:now or in the future )?(?:require|need) (?:employer )?sponsorship for an? (?:employment|work) visa$/.test(q);
    const visaAssistance = q === "will you now or in the future require sponsorship for an immigration related employment benefit" || /^(?:will|do) you (?:require|need) (?:employment |work )?visa assistance(?: now or in the future)?(?: from (?:us|our company))?$/.test(q);
    if (visaAssistance || countryDependent || commonQuestion(q)?.question === sponsor) {
      const source = visaAssistance || q.includes("sponsorship") ? sponsor : auth, region2 = jobJurisdiction(field.jobLocation || field.workQuestionCountry || "");
      if (region2 === "us" && fact(source)) return result(fact(source), "Your U.S. work profile and this job\u2019s location");
      const foreign = "Do you require employment visa sponsorship for jobs outside the United States?";
      if (region2 === "foreign" && source === sponsor && unique(foreign)) return result(unique(foreign), "Your international sponsorship preference");
      return { blocked: true };
    }
    if (/^if yes please indicate visa status$/.test(q)) {
      if (citizen && jobJurisdiction(field.jobLocation || "") === "us" && field.required && parent.includes("sponsorship") && parentValue === "no")
        return confirmed("A citizen of the U.S.", "Citizenships", ["a citizen of the u s", "u s citizen", "us citizen"]);
      return { blocked: true };
    }
    for (const [name, pattern] of privateRules) {
      const wording = q.replace(/^including your current position /, "");
      if (pattern.test(wording) && unique(name)) return { ...result(unique(name), "Your confirmed private answer"), requiresReview: true };
    }
    if (q === "country of citizenship" || commonQuestion(field.label)?.question === "Country of citizenship") {
      if (unique("Citizenships") && unique("Citizenships").includes(";")) return { blocked: true };
    }
    const address = fact("Street address"), city = profile.values?.city || "", state = profile.values?.state || "";
    let street = address, zip = "";
    if (address && city && state) {
      const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const stateNames3 = questionKey(state) === "new jersey" ? "(?:NJ|New Jersey)" : escape(state);
      const suffix = new RegExp("[,\\s]+" + escape(city) + "[,\\s]+" + stateNames3 + "[,\\s]+(\\d{5}(?:-\\d{4})?)$", "i");
      const match = address.match(suffix);
      if (match) {
        street = address.slice(0, match.index).replace(/[,\s]+$/, "");
        zip = match[1];
      }
    }
    if (commonQuestion(field.label)?.question === "Street address" && address) {
      if (/\b\d{5}(?:-\d{4})?$/.test(address) && !zip) return { blocked: true };
      return result(street, "Street from your saved address");
    }
    if (/^(zip|postal|zip postal)( code)?$/.test(q) && zip) return result(zip, "ZIP from your saved address");
    const pursued = fact("Degree being pursued"), school = questionKey(field.educationSchool), college = universityRow, highSchool = school && school === questionKey(fact("High school name"));
    if (/^(?:do you (?:have|hold) (?:a )?(?:completed |earned )?bachelor(?: s|s)? degree|have you (?:already )?(?:completed|earned|obtained) (?:a |your )?bachelor(?: s|s)? degree)$/.test(q)) {
      const highest = questionKey(fact("Highest completed degree"));
      if (/^(high school diploma|associate(?: s)? degree|some college)$/.test(highest)) return confirmed("No", "Highest completed degree");
      if (/^bachelor(?: s)?(?: degree| of .+)$/.test(highest)) return confirmed("Yes", "Highest completed degree");
      return { blocked: true };
    }
    if (q === "from" && college && /^\d{4}$/.test(fact("University start year") || "")) return result(fact("University start year"), "Start year at this school");
    if (q === "to actual or expected" && college && /^\d{4}$/.test(profile.values.graduationYear)) return result(profile.values.graduationYear, "Expected graduation year at this school");
    const pendingDegree = field.degreePair && pursued && (!school || college) && !field.highestEducation;
    if (q === "not completed" && field.type === "checkbox-group") {
      const degree = questionKey(field.rowDegree);
      const current = degree === questionKey(pursued) || /^bachelor/.test(questionKey(pursued)) && ["bachelor", "bachelors", "bachelor s", "bachelor s degree", "bachelor degree", "bachelor of science", "bs", "b s"].includes(degree);
      if (pendingDegree && degree && current && field.options?.length === 1) return { ...confirmed("Not Completed", "Degree being pursued"), markIncomplete: true };
      return { blocked: true };
    }
    if (q === "degree" || q === "degree type" || commonQuestion(field.label)?.question === "Degree being pursued") {
      if (field.highestEducation && fact("Highest completed degree")) return confirmed(fact("Highest completed degree"), "Highest completed degree", questionKey(fact("Highest completed degree")) === "high school diploma" ? ["high school or equivalent", "high school diploma ged", "high school diploma", "secondary education diploma"] : void 0);
      if (highSchool) return result(fact("Highest completed degree"), "Completed high-school education", ["high school diploma ged", "high school diploma", "full high school education"]);
      if (pursued && (pendingDegree || college || commonQuestion(field.label)?.question === "Degree being pursued")) return result(pursued, "Degree in progress, not a completed degree", [questionKey(pursued), .../^bachelor/.test(questionKey(pursued)) ? ["bachelors", "bachelor", "bachelor s", "bachelor degree", "bachelor s degree", "bachelor of science", "b s", "bs"] : []]);
      return { blocked: true };
    }
    if (/gpa|grade point average|overall result/.test(q)) {
      if (/^(what is your )?(college |university )?gpa scale$/.test(q) && (college || /college|university/.test(q))) return result(fact("College GPA scale"), "University GPA scale");
      if (highSchool && fact("High school GPA") && !/4 0 scale/.test(q)) return result(fact("High school GPA"), "High-school GPA only");
      const gpa = fact("College GPA");
      if (college && /^\d(?:\.\d+)?$/.test(gpa || "") && Number(gpa) <= 4) return result(gpa, "Confirmed college GPA");
      if (gpa === "Not available yet" && (college || /college|university|cumulative/.test(q)) && ["select-one", "combobox"].includes(field.type)) return { ...result(gpa, "No college GPA yet; high-school GPA is separate", ["not available yet", "not available", "n a", "no gpa yet", "not applicable"]), requiresReview: true };
      return { blocked: true };
    }
    if (commonQuestion(field.label)?.question === "Current academic standing" && fact("Current academic standing") === "Freshman") return result("Freshman", "Current standing; freshman year is not yet completed", ["freshman", "first year", "first year undergraduate", "freshman first year", "other please specify", "other"]);
    if (/^(academic standing details|please specify|other please specify)$/.test(q) && commonQuestion(field.parentQuestion)?.question === "Current academic standing" && /other/.test(questionKey(field.parentAnswer)) && fact("Current academic standing")) return result(fact("Current academic standing"), "Current academic standing");
    if (commonQuestion(field.label)?.question === "Preferred work regions" && fact("Preferred work regions")) return result(fact("Preferred work regions"), "Your preferred work regions");
    if (/^are you available for a summer intern co op may aug$/.test(q) && unique("Full-time internship availability") === "Summer only; not fall or winter") return { ...result("Yes", "Available during summer break; check exact start/end dates"), requiresReview: true };
    if (/^source details?$|^if .+ please specify$/.test(q) && unique("Preferred application source") === "Company website or university") {
      const parent2 = questionKey(field.parentAnswer);
      if (/university|college/.test(parent2) && profile.values?.school) return result(profile.values.school, "Your university for the selected university source", [questionKey(profile.values.school), "rutgers university new brunswick", "rutgers university", "rutgers"]);
      if (/website|career site|amazon career/.test(parent2)) return result("Company Website", "Details for the selected company source", ["company website", "our website", "company careers website", "careers website", "amazon jobs"]);
      return { blocked: true };
    }
    if (/please indicate your availability for the internship.*select multiple/i.test(field.label) && unique("Summer internship end date")) return { blocked: true };
    const threshold = ageThreshold(field.label);
    if (threshold !== null) {
      const proofs = entries.map((a) => ({ n: ageThreshold(a.question), yes: questionKey(a.answer) === "yes", no: questionKey(a.answer) === "no" })).filter((a) => a.n !== null);
      if (proofs.some((a) => a.no && a.n <= threshold) && proofs.some((a) => a.yes && a.n >= threshold)) return { blocked: true };
      if (proofs.some((a) => a.yes && a.n >= threshold)) return result("Yes", "Confirmed age meets this lower or equal threshold", ["yes"]);
    }
    if (fullTimeQuestion(field.label) && unique("Full-time internship availability") === "Summer only; not fall or winter") {
      const season = field.applicationSeason || applicationSeason2(field.label);
      if (season === "summer-2027") return { ...result("Yes", "Full-time during summer only"), requiresReview: true };
      if (["fall", "autumn", "winter"].includes(season)) return result("No", "Not available full-time in fall or winter");
      return { blocked: true };
    }
    if ((commonQuestion(q)?.question === "How did you hear about this position?" || /^how (did|do) you (hear|learn|find out) about (this (position|job|role)|us)$/.test(q)) && unique("Preferred application source") === "Company website or university") return result("Company Website", "Your preferred application source", ["company website", "corporate website", "our website", "company careers website", "company career site", "employer website", "amazon career site", "amazon jobs", "university college", "university recruiting", "university", "university career center", "college university"]);
    const date = dateConcept(field.label);
    if (date === "start" || date === "end") {
      if (field.applicationSeason && field.applicationSeason !== "summer-2027") return { blocked: true };
      const value = unique(date === "start" ? "Summer internship start date" : "Summer internship end date");
      if (!value) return null;
      if (!/^2027-\d{2}-\d{2}$/.test(value) || now.toISOString().slice(0, 10) > value) return { blocked: true };
      return { ...result(value, "Summer 2027 availability \xB7 review dates for this role"), requiresReview: true };
    }
    if (date === "graduation") {
      const values = entries.filter((a) => dateConcept(a.question) === "graduation").map((a) => a.answer.trim());
      const months = values.filter((v) => /^\d{4}-\d{2}(?:-\d{2})?$/.test(v)).map((v) => v.slice(0, 7));
      if (new Set(months).size === 1) {
        if (field.type === "date" && unique("Day for month-only school dates") === "First of the month") return confirmed(months[0] + "-01", "Expected graduation date");
        if (/^yyyy$/i.test(field.placeholder || "") || field.maxLength === 4) return confirmed(months[0].slice(0, 4), "Expected graduation date");
        if (/^mm\s*\/\s*yyyy$/i.test(field.placeholder || "")) return confirmed(months[0].slice(5) + "/" + months[0].slice(0, 4), "Expected graduation date");
      }
      if (new Set(months).size === 1 && ["text", "textarea"].includes(field.type) && !field.placeholder) return result(months[0], "Confirmed expected graduation month");
      if (new Set(months).size === 1 && (field.type === "month" || /^YYYY-MM$/i.test(field.placeholder || ""))) return { ...result(months[0], "Expected graduation month"), requiresReview: true };
    }
    if (["radio-group", "select-one", "combobox"].includes(field.type) && field.options?.length) {
      const key2 = analogousQuestion(field.label);
      const evidence = key2 ? entries.filter((a) => analogousQuestion(a.question) === key2) : [];
      if (evidence.length) {
        const answers = new Set(evidence.map((a) => questionKey(a.answer)));
        const options2 = field.options.filter((o) => !o.disabled && o.value !== "" && answers.has(questionKey(o.label)));
        if (answers.size !== 1 || options2.length !== 1) return { blocked: true };
        return saved(options2[0].label, evidence[0].question);
      }
    }
    return null;
  }

  // tools/application-helper/portfolio-answers.mjs?v=20261123.3
  var key = (s) => String(s || "").toLowerCase().replace(/c\+\+/g, "cplusplus").replace(/c#/g, "csharp").replace(/[^a-z0-9]+/g, " ").trim();
  var aliases2 = { cad: ["cad", "computer aided design", "computer aided drafting"], solidworks: ["solidworks", "solid works"], onshape: ["onshape"], autocad: ["autocad", "auto cad"], fea: ["fea", "finite element analysis"], matlab: ["matlab"], python: ["python"], cplusplus: ["cplusplus"], excel: ["excel", "microsoft excel"], "3d printing": ["3d printing", "additive manufacturing", "fdm"], "mechanical design": ["mechanical design"], assembly: ["assembly", "mechanical assembly"], "structural analysis": ["structural analysis"], documentation: ["documentation", "technical documentation"], "arduino uno": ["arduino", "arduino uno"], pneumatics: ["pneumatics", "pneumatic systems"], "hand fabrication": ["hand fabrication"] };
  Object.assign(aliases2, { robotics: ["robotics", "robotics projects"], electronics: ["electronics", "electronic circuits"], simulation: ["simulation", "engineering simulation"], prototyping: ["prototyping", "physical prototyping"] });
  var skillKey = (s) => Object.entries(aliases2).find(([, names]) => names.includes(key(s)))?.[0] || key(s);
  var uniqueSources = (items) => [...new Map(items.map((s) => [s.url + "\n" + s.quote, s])).values()].slice(0, 4);
  var projectTopics = [
    { topic: /\b(teamwork|team project|on a team|with a team|team contribution)\b/, evidence: /\b(team.s|team project|team competition)\b/i },
    { topic: /\b(leadership|led a team|led a project|leadership role)\b/, evidence: /\bled (?:chassis|assembly)\b/i },
    { topic: /\b(documentation|technical drawing|technical drawings|engineering drawings|documented your work)\b/, evidence: /\b(notebook|drawings)\b/i },
    { topic: /\b(testing|tested a design|validated a design|measured results|evaluated a prototype)\b/, evidence: /\b(trials|baseline|measured)\b/i, state: "tested" },
    { topic: /\b(design iteration|design constraint|design constraints|design tradeoff|design for manufacturability|adapted a design|redesigned a part)\b/, evidence: /\b(build envelope|printable sections|to integrate|within the robot envelope)\b/i }
  ];
  function projectExample(q, knowledge) {
    const prompt = q.replace(/^please /, "");
    if (!/^(?:how (?:have you|did you)|what (?:was|were|did you)|describe|tell (?:me|us) about|give (?:me |us )?an example|provide an example|can you (?:describe|give))\b/.test(prompt)) return null;
    const topics = projectTopics.filter((t) => t.topic.test(prompt));
    const named = knowledge.projects.filter((p) => (" " + q + " ").includes(" " + key(p.title) + " "));
    if (topics.length > 1 || named.length > 1 || /\b(?:conflict|failed|failure|why|budget|deadline|certification|years|salary|safety|medical|aerospace|weapon|confidential|manager|customers?|employers?|coworkers?|clients?)\b/.test(prompt)) return null;
    const topic = topics[0];
    if (!topic && !named.length) return null;
    const qualifier = prompt.match(/\b(?:using|with experience in) (.+)$/);
    if (qualifier && !qualifier[1].split(/ and /).every((term) => Object.hasOwn(aliases2, skillKey(term)))) return null;
    const mentioned = Object.entries(aliases2).filter(([, names]) => names.some((n) => (" " + q + " ").includes(" " + n + " "))).map(([k]) => k);
    for (const project of named.length ? named : knowledge.projects) {
      if (mentioned.some((k) => !project.tools.some((t) => t.key === k || k === "cad" && ["onshape", "solidworks", "autocad"].includes(t.key)) && k !== "documentation")) continue;
      const matched = project.claims.filter((c) => !topic || (!topic.state || topic.state === c.state) && topic.evidence.test(c.text));
      if (!matched.length) continue;
      const claims = topic?.state === "tested" ? [project.claims[0], matched[0]] : matched.slice(0, 2);
      const selected = [...new Set(claims)];
      return { text: project.title + " \u2014 " + selected.map((c) => c.text).join(" "), sources: selected.flatMap((c) => c.sources) };
    }
    return null;
  }
  function portfolioAnswer(field, knowledge) {
    if (knowledge?.format !== "duc-portfolio-knowledge-v1") return null;
    const q = key(field.label).replace(/^professional summary$/, "summary").replace(/\b(required|optional)\b/g, "").trim().replace(/^(?:what (?:hands on |project )?experience do you have (?:with|using)|tell (?:me|us) about your experience using) (.+)$/, "describe your experience with $1");
    if (/\b(not|never|without|lack|professional|professionally|commercial|industry|industrial|paid|employed|employment|years|months|year|month|expert|expertise|proficient|advanced|certified|certification|license|licensed|citizen|citizenship|visa|sponsor|authorized|authorization|gpa|salary|gender|race|ethnicity|disability|veteran|birth|age|agree|certify|completed|successful|successfully|production|productionized|fluent|fully|functional|deployed|operational|independently|alone|sole)\b/.test(q) || /\d/.test(q.replace(/3d/g, ""))) return null;
    const answer = (value, sources, reason = "Draft from documented portfolio evidence") => sources.length && (!field.maxLength || field.maxLength < 0 || value.length <= field.maxLength) ? { value, display: value, requiresReview: true, reason, sourceQuestion: "Portfolio \xB7 " + knowledge.reviewedOn, sources: uniqueSources(sources), portfolioDerived: true } : null;
    const allSkills = /* @__PURE__ */ new Map();
    if (/^(?:what (?:technical |engineering |relevant )?skills (?:would|can|could) you bring to (?:this|the) (?:role|position|internship|team)|summarize your hands on engineering experience)$/.test(q)) {
      const examples = [];
      for (const skill of ["solidworks", "arduino uno", "hand fabrication"]) {
        const p2 = knowledge.projects.find((p3) => p3.tools.some((t) => t.key === skill) && p3.claims.some((c) => ["modeled", "built", "tested"].includes(c.state)));
        if (!p2) continue;
        const tool2 = p2.tools.find((t) => t.key === skill);
        const claim = p2.claims.find((c) => c.evidenceIds.some((id) => tool2.evidenceIds.includes(id))) || p2.claims[0];
        examples.push({ text: tool2.name + " (" + p2.title + ") \u2014 " + claim.text, sources: [...tool2.sources, ...claim.sources] });
      }
      return examples.length ? answer(examples.map((x) => x.text).join("\n"), [...examples.map((x) => x.sources[0]), ...examples.flatMap((x) => x.sources)]) : null;
    }
    if (knowledge.careerInterest && /^(?:what (?:type|kind) of (?:role|internship|opportunity|work) are you (?:looking for|seeking)|what are your career interests)$/.test(q))
      return answer(knowledge.careerInterest.text, knowledge.careerInterest.sources);
    const example = projectExample(q, knowledge);
    if (example) return answer(example.text, example.sources);
    if (/^(summary|professional summary|cover letter|tell us about yourself|tell me about yourself|briefly introduce yourself)( required)?$/.test(q)) {
      const project = knowledge.projects.find((p2) => p2.claims.length);
      if (!project || !knowledge.educationSources?.length || !/^mechanical engineering student at rutgers university/i.test(knowledge.education)) return null;
      const claim = project.claims[0];
      const intro = "I am studying mechanical engineering at Rutgers University.";
      const experience = "My project experience includes " + project.title + ". " + claim.text;
      const draft = q.startsWith("cover letter") ? "Dear Hiring Team,\n\n" + intro + " I am applying for your internship. " + experience + "\n\nThank you for considering my application." : intro + " " + experience;
      return answer(draft, [...knowledge.educationSources, ...claim.sources], "Portfolio draft for your review");
    }
    for (const s of knowledge.skills) allSkills.set(s.key, { ...s, project: false });
    for (const p2 of knowledge.projects) for (const t of p2.tools) {
      const previous = allSkills.get(t.key);
      allSkills.set(t.key, { ...t, project: true, sources: uniqueSources([...previous?.sources || [], ...t.sources]) });
    }
    {
      const cad = [...allSkills.values()].filter((s) => ["solidworks", "onshape", "autocad"].includes(s.key));
      if (cad.length) allSkills.set("cad", { name: "CAD", key: "cad", project: cad.some((s) => s.project), sources: cad.flatMap((s) => s.sources) });
    }
    const domainRules = [
      ["robotics", "Robotics project work", (p2) => /\brobot\b|\brobotics\b/.test(key(p2.title)), (c) => true],
      ["electronics", "Electronics projects", (p2) => /\belectronics\b|\barduino\b/.test(key(p2.title)), (c) => c.state === "built"],
      ["simulation", "Engineering simulation", (p2) => true, (c) => c.state === "simulated"],
      ["prototyping", "Physical prototyping", (p2) => true, (c) => c.state === "built"]
    ];
    for (const [name, label, projectTest, claimTest] of domainRules) {
      const claims2 = knowledge.projects.filter(projectTest).flatMap((p2) => p2.claims.filter(claimTest));
      if (claims2.length && !allSkills.has(name)) allSkills.set(name, { key: name, name: label, project: true, sources: claims2.flatMap((c) => c.sources) });
    }
    const rearranged = q.replace(/^do you have (any )?(.+) experience$/, "do you have experience with $2");
    const yes = rearranged.match(/^(?:do you have (?:any |hands on |project )?(?:experience|knowledge|working knowledge) (?:with|in|of|using)|have you (?:ever )?(?:used|worked with|worked on)|are you familiar with) (.+)$/);
    if (yes) {
      let subject = yes[1].replace(/\s+(software|tools|tool)$/, "");
      const either = subject.includes(" or ");
      if (either && subject.includes(" and ")) return null;
      const terms2 = subject.split(either ? /\s+or\s+/ : /\s+and\s+|\s*,\s*/).map((s) => skillKey(s)).filter(Boolean);
      const found = terms2.map((t) => allSkills.get(t));
      const valid = (s) => s && (!q.includes("project experience") || s.project);
      if (!terms2.length || terms2.length > 5 || (either ? !found.some(valid) : !found.every(valid))) return null;
      return answer("Yes", found.filter(valid).flatMap((s) => s.sources), "Supported skill overlap \xB7 confirm the employer\u2019s wording");
    }
    if (/^(?:what (?:are|is)|list|which) (?:your )?(?:technical skills|engineering skills|cad tools|cad software|design software)(?: do you (?:use|know|have experience with))?$/.test(q)) {
      const chosen = [...allSkills.values()].filter((s) => !/cad tools|cad software|design software/.test(q) || ["solidworks", "onshape", "autocad"].includes(s.key));
      return chosen.length ? answer(chosen.map((s) => s.name).join(", "), chosen.flatMap((s) => s.sources), "Skills documented in the portfolio or current resume") : null;
    }
    const edu = knowledge.education.match(/^Mechanical engineering student at (Rutgers University)/i);
    if (edu && knowledge.educationSources.length) {
      if (/^(what are you (currently )?studying|what is your (major|field of study)|field of study)$/.test(q)) return answer("Mechanical Engineering", knowledge.educationSources);
      if (/^(which university are you currently attending|what university do you (currently )?attend)$/.test(q)) return answer(edu[1], knowledge.educationSources);
      if (/^(describe|summarize|tell us about) your (education|educational background|academic background)$/.test(q)) return answer("I am a mechanical engineering student at " + edu[1] + ".", knowledge.educationSources);
    }
    const applied = q.match(/^(?:how (?:have you|did you) (?:use|used|apply|applied)|give (?:us )?an example of (?:how you (?:used|applied)|using)) (.+?)(?: (?:in|on|for) (?:a|an|your) (?:engineering |design |academic )?project)?$/);
    if (applied) {
      const skills = applied[1].split(/ and /).map(skillKey);
      if (!skills.every((s) => Object.hasOwn(aliases2, s))) return null;
      return portfolioAnswer({ ...field, label: "Describe your experience with " + skills.join(" and ") }, knowledge);
    }
    const narrative = /^(?:please )?(describe|summarize|tell us about|tell me about|give (?:us )?an example of|provide an example of)\b/.test(q) && /\b(project|projects|experience|work|design|designing|built|building)\b/.test(q);
    if (!narrative || /\b(why|failure|failed|conflict|difficult|challenge|challenging|proud|leadership|led|lead|managed|manage|greatest|best|favorite|budget|deadline|overcame)\b/.test(q)) return null;
    const requestedSkills = [...Object.entries(aliases2)].filter(([, names]) => names.some((n) => (" " + q + " ").includes(" " + n + " "))).map(([k]) => k);
    const specific = q.match(/(?:experience|work) (?:with|using|in) (.+)$/);
    if (specific && !specific[1].split(/\s+and\s+|\s*,\s*/).every((t) => Object.hasOwn(aliases2, skillKey(t)))) return null;
    const using = q.match(/\busing (.+)$/);
    if (using && !using[1].split(/\s+and\s+|\s*,\s*/).every((t) => Object.hasOwn(aliases2, skillKey(t)))) return null;
    const themes = ["robot", "robotics", "electronics", "turbine", "boat", "tower", "launch", "display", "structural", "prototyping", "fabrication"];
    const terms = [...requestedSkills, ...themes.filter((t) => q.includes(t))];
    if (!terms.length && !/^(describe|summarize|tell us about|tell me about|give(?: us)? an example of|provide an example of) (?:your |a |an |one of your )?(?:engineering |technical |mechanical )?(?:project|projects|project experience|experience|work)(?: you (?:have )?(?:worked on|built|designed))?$/.test(q)) return null;
    const ranked = knowledge.projects.filter((p2) => p2.claims.length).map((p2) => {
      const toolKeys = p2.tools.map((t) => t.key);
      const hay = key(p2.title + " " + p2.claims.map((c) => c.text).join(" ") + " " + p2.tools.map((t) => t.usage).join(" "));
      const covers = (k) => toolKeys.includes(k) || k === "cad" && toolKeys.some((t) => ["solidworks", "onshape", "autocad"].includes(t)) || k === "fea" && p2.claims.some((c) => c.state === "simulated") && /analysis|stress|load/.test(hay) || domainRules.some(([name, , projectTest, claimTest]) => name === k && projectTest(p2) && p2.claims.some(claimTest));
      if (requestedSkills.length && !requestedSkills.every(covers)) return null;
      const score = requestedSkills.length * 10 + terms.reduce((n, t) => n + (hay.includes(t.replace("robotics", "robot")) ? 3 : 0), 0);
      return { p: p2, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    if (!ranked.length || terms.length && ranked[0].score === 0) return null;
    const p = ranked[0].p, tool = p.tools.find((t) => requestedSkills.includes(t.key) || requestedSkills.includes("cad") && ["onshape", "solidworks", "autocad"].includes(t.key));
    const linked = tool ? p.claims.filter((c) => c.evidenceIds.some((id) => tool.evidenceIds.includes(id))) : [];
    const claims = (linked.length ? linked : p.claims).slice(0, 2);
    const status = p.completionState.replace(/-/g, " ");
    const text = "My work on " + p.title + " included:\n" + claims.map((c) => "\u2022 " + c.text).join("\n") + (status ? "\nProject status: " + status + "." : "");
    const use = tool ? "\n" + tool.name + " \u2014 " + tool.usage : "";
    return answer(text + use, [...claims.flatMap((c) => c.sources), ...tool?.sources || []]);
  }

  // tools/application-helper/application-autofill.mjs?v=20261123.3
  function formBridge({ action = "scan", url, fields = [], origins = [] } = {}) {
    if (action === "scan-chat" && !origins.includes(location.origin)) return null;
    if (action === "scan-frame") {
      if (!origins.some((src) => {
        try {
          const u = new URL(src);
          return u.protocol === "https:" && u.origin === location.origin && (u.pathname === location.pathname || window.frameElement?.src === src);
        } catch {
          return false;
        }
      })) return null;
      action = "scan";
    }
    const text = (e) => (e?.innerText || e?.textContent || "").trim();
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const visible = (e) => !!e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
    const comboSelector = '[role="combobox"],input[aria-controls][aria-expanded],[role="searchbox"][aria-controls],[aria-haspopup="listbox"],[role="button"][aria-haspopup="true"],button[aria-haspopup="true"],button[aria-haspopup="menu"],button[data-automation-id][aria-expanded],button[aria-controls][aria-expanded],input[data-automation-id="searchBox"],button[data-automation-id="selectWidget"],button[name][aria-required],button[data-automation-id="countryRegion"],button[data-automation-id="degree"],input[aria-autocomplete="list"],.iti__selected-country,.iti__selected-flag,.selected-flag,.dropdown-toggle,.ng-select,.select2-selection,mat-select,.selectize-input,.ui-select-container,.ts-control';
    const controls = '[contenteditable][data-placeholder],[contenteditable][aria-label],[contenteditable="true"][role="textbox"],[contenteditable="plaintext-only"],input,select,textarea,' + comboSelector + ',[role="radio"]';
    const activate = (e, option = false) => {
      if (option) e.scrollIntoView?.({ block: "nearest" });
      const Mouse = typeof MouseEvent === "undefined" ? Event : MouseEvent;
      if (typeof PointerEvent !== "undefined") e.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse", button: 0 }));
      const down = new Mouse("mousedown", { bubbles: true, cancelable: true, button: 0 });
      e.dispatchEvent(down);
      e.dispatchEvent(new Mouse("mouseup", { bubbles: true, cancelable: true, button: 0 }));
      if (typeof PointerEvent !== "undefined") e.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "mouse", button: 0 }));
      if (option) {
        if (e.isConnected && visible(e)) {
          if (e.closest("a,button,input[type=submit]")) e.addEventListener("click", (event) => event.preventDefault(), { once: true, capture: true });
          e.click();
        }
        return;
      }
      if (!down.defaultPrevented && e.isConnected && visible(e)) {
        e.addEventListener("click", (event) => event.preventDefault(), { once: true, capture: true });
        e.click();
      }
    };
    const custom = (e) => e.tagName !== "SELECT" && e.matches(comboSelector);
    const radio = (e) => e.type === "radio" || e.getAttribute("role") === "radio";
    const checkbox = (e) => e.type === "checkbox";
    const choice = (e) => radio(e) || checkbox(e);
    const isReply = (e) => e.matches('textarea,input:not([type]),input[type="text"],[contenteditable]') && /^(?:write|type|enter|send) (?:a |your )?(?:reply|message)(?: here)?[. …]*$/i.test((e.placeholder || e.getAttribute("data-placeholder") || e.getAttribute("aria-placeholder") || e.getAttribute("aria-label") || "").trim());
    const chatQuestion = (e) => {
      const messages = '.ol-text-message,[data-message-id],[data-author],[data-sender],[role="log"] > *,[class*="message-bubble"],[class*="message__text"],[class*="message-text"],[class*="chat-message"],[class*="message-content"]';
      for (let p = e.parentElement; p; p = p.parentElement) {
        if ([...p.querySelectorAll(controls)].filter((c) => isReply(c) && visible(c)).length !== 1) break;
        const rows = [...p.querySelectorAll(messages)].filter((m) => visible(m) && text(m) && !m.contains(e) && !m.matches("input,textarea") && !(m.compareDocumentPosition(e) & 2));
        const row = rows.at(-1);
        if (row) {
          if (row.closest('[data-author="user"],[data-sender="user"],[data-author="candidate"],[class*="outgoing"],[class*="user-message"]')) return "";
          return text(row).slice(-800);
        }
        if (/(?:olivia by paradox|job assistant|recruiting assistant)/i.test(text(p)) && (!p.matches("body,html") || /(^|\.)paradox\.ai$/.test(location.hostname))) {
          const leaves = [...p.querySelectorAll("p,div,span")].filter((n) => !n.children.length && visible(n) && n.compareDocumentPosition(e) & 4 && text(n).length > 5 && !n.closest("button,label,footer"));
          const last = leaves.at(-1);
          if (last && /\?\s*$/.test(text(last))) return text(last).slice(-800);
        }
      }
      return "";
    };
    const type = (e) => isReply(e) ? "chat-reply" : radio(e) ? "radio-group" : checkbox(e) ? "checkbox-group" : custom(e) ? "combobox" : e.type || e.tagName.toLowerCase();
    const labelled = (e) => (e?.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).map((id) => text(e.getRootNode?.().getElementById?.(id) || document.getElementById(id))).join(" ");
    const radioSelector = 'input[type="radio"],[role="radio"]';
    const choiceVisible = (e) => visible(e) || [...e.labels || [], e.closest("label")].some((l) => l && visible(l)) || radio(e) && e.parentElement?.querySelectorAll(radioSelector).length === 1 && visible(e.parentElement) && !!e.parentElement.querySelector('svg,[role="img"]');
    const group = (e) => {
      const explicit = e.closest('[role="radiogroup"],fieldset') || e.closest('[role="group"]');
      if (explicit) return explicit;
      if (radio(e)) {
        if (e.name) return null;
        for (let p2 = e.parentElement; p2 && p2 !== document.body; p2 = p2.parentElement) {
          const rows = [...p2.querySelectorAll(radioSelector)];
          if (rows.length === 1 && !p2.querySelector("select,textarea,input:not([type=radio]):not([type=hidden])") && [...p2.querySelectorAll("label,p,legend,span,div")].some((node) => !node.querySelector(controls) && /^i understand that i may be considered for other open positions in my country\b/.test(norm(text(node))))) return p2;
          if (rows.length < 2) continue;
          if (rows.some((r) => r.name || r.closest('[role="radiogroup"],fieldset')) || p2.querySelector('textarea,select,input:not([type="radio"]):not([type="hidden"])')) return null;
          return p2;
        }
        return null;
      }
      let p = e.parentElement;
      for (let i = 0; i < 6 && p && p !== document.body; i++, p = p.parentElement) {
        if (p.querySelectorAll('input:not([type="checkbox"]),select,textarea').length) break;
        if (p.querySelectorAll('input[type="checkbox"]').length > 1 && p.querySelector("p,legend,label:not([for]),[aria-labelledby],.question-label,.form-label,.control-label")) return p;
      }
      return null;
    };
    const radios = (e) => {
      if (checkbox(e) && norm(ownLabel(e)) === "not completed") return [e];
      const g = group(e), selector = checkbox(e) ? 'input[type="checkbox"]' : 'input[type="radio"],[role="radio"]';
      return [...(g || e.form || e.getRootNode?.() || document).querySelectorAll(selector)].filter((r) => g ? group(r) === g && (checkbox(e) || g.getAttribute("role") === "radiogroup" || !e.name || r.name === e.name) : !!e.name && r.name === e.name && r.form === e.form);
    };
    const original = (e) => e.matches(".selectize-input,.ts-control") ? e.closest(".selectize-control,.ts-wrapper")?.previousElementSibling : null;
    const labelText = (e) => {
      if (!e) return "";
      const copy = e.cloneNode(true);
      for (const control of copy.querySelectorAll(controls + ',button,[role="listbox"],.selectize-control,.ui-select-match,.select2-container,.ts-wrapper')) control.remove();
      return text(copy);
    };
    const useful = (s) => /^(select|please select|choose|open menu|clear|select an option|select one)[. …]*$/i.test((s || "").trim()) ? "" : s;
    const ownLabel = (e) => (useful(e.getAttribute("aria-label")) || useful(labelled(e)) || [...e.labels || [], ...[...document.querySelectorAll("label[for]")].filter((l) => e.id && l.getAttribute("for") === e.id)].map(labelText).filter((v, i, a) => a.indexOf(v) === i).join(" ") || labelText(e.closest("label")) || "").trim();
    const nearbyLabel = (e) => {
      let parent = e.parentElement;
      const members = choice(e) ? radios(e) : [];
      for (let n = 0; n < 8 && parent && parent !== document.body; n++, parent = parent.parentElement) {
        const contained = [...parent.querySelectorAll(controls)].filter((c) => !c.parentElement?.closest(comboSelector) && type(c) !== "hidden" && (c === e || visible(c)));
        if (choice(e)) {
          if (contained.some((c) => !choice(c) || !members.includes(c))) break;
          if (!members.length || !members.every((r) => parent.contains(r))) continue;
        } else if (contained.filter((c) => !radio(c)).length !== 1) break;
        const candidates = [...parent.querySelectorAll("legend,[data-question],.question-label,.control-label,.form-label,h3,h4,p,label,strong")].filter((h) => !h.closest('[role="listbox"],[role="option"]') && !h.querySelector(controls) && !members.some((r) => r.closest("label")?.contains(h) || [...r.labels || []].some((l) => l.contains(h))));
        if (!choice(e)) candidates.sort((a, b) => Number(!a.matches("label,strong,.question-label,.control-label,.form-label")) - Number(!b.matches("label,strong,.question-label,.control-label,.form-label")));
        if (choice(e)) {
          const prompts = [...parent.querySelectorAll("div,span,legend,p,label,h2,h3,h4")].filter((h) => !h.querySelector(controls) && !h.closest('[role="radio"]') && /\?\s*\*?$/.test(text(h)) && text(h).length <= 800);
          candidates.unshift(...prompts.filter((h) => !prompts.some((other) => other !== h && h.contains(other))));
        }
        for (const heading of candidates) {
          const value = labelText(heading);
          if (value && !/^(yes|no|male|female)$/i.test(value) && value.length <= 800) return value;
        }
      }
      return "";
    };
    const groupPrompt = (g) => {
      if (!g) return "";
      for (let node = g; node && node !== document.body; node = node.parentElement) {
        for (let previous = node.previousElementSibling; previous; previous = previous.previousElementSibling) {
          if (previous.matches(controls) || previous.querySelector(controls)) return "";
          const prompt = text(previous).trim();
          if (!prompt) continue;
          if (prompt.length <= 800 && (/\?\s*\*?$/.test(prompt) || /^(?:select the races|please check one of the boxes|i understand that i may be considered for other open positions|ethnicity\s*\*?$|title$)/i.test(prompt))) return prompt;
          if (prompt.length > 50 || previous.matches("h1,h2,h3")) return "";
        }
      }
      return "";
    };
    const label = (e) => {
      if (/^education-.+--(?:first|last)YearAttended-dateSectionYear-input$/i.test(e.id)) return /--firstYear/i.test(e.id) ? "From" : "To (Actual or Expected)";
      if (isReply(e)) return chatQuestion(e);
      if (e.matches(".select2-selection")) {
        const native = e.closest(".select2-container")?.previousElementSibling;
        const caption = native?.labels?.[0] || document.getElementById((e.getAttribute("aria-labelledby") || "").split(" ")[0]);
        if (caption) {
          const copy = caption.cloneNode(true);
          for (const child of copy.querySelectorAll(".screenReaderVisibility,.sr-only,[aria-live],.select2-container")) child.remove();
          const clean = text(copy).replace(/\s*(?:select an? option|please select)\s*$/i, "").trim();
          if (clean) return clean;
        }
      }
      if (e.matches("input[type=url],input[type=text]") && /^(?:url|website url|website|link)$/.test(norm(ownLabel(e))) && sectionFor("websites")?.contains(e)) return "Portfolio URL";
      const wrapper = e.closest('[data-automation-id^="formField-"]');
      const fieldLabel = wrapper?.querySelector('[data-automation-id="formLabel"],legend') || wrapper?.querySelector("label");
      if (fieldLabel && (!choice(e) || !fieldLabel.contains(e))) {
        const value = labelText(fieldLabel);
        if (value && !/^(yes|no)$/i.test(value)) return value;
      }
      if (e.matches(".iti__selected-country,.iti__selected-flag,.selected-flag")) return "Country";
      if (checkbox(e) && norm(ownLabel(e)) === "not completed") return ownLabel(e);
      if (!ownLabel(e) && e.getAttribute("aria-describedby")) {
        const description = e.getAttribute("aria-describedby").split(/\s+/).map((id) => text(document.getElementById(id))).join(" ").trim();
        const adjacent = e.nextSibling?.nodeType === 3 ? e.nextSibling.textContent.trim() : "";
        if (checkbox(e) && adjacent && adjacent.length < 100) return adjacent;
        if (description && description.length <= 800 && (checkbox(e) || e.tagName === "SELECT")) return description;
      }
      if (choice(e)) {
        const g = group(e), single = g && [...g.querySelectorAll('input[type="radio"],[role="radio"],input[type="checkbox"]')].every((r) => radios(e).includes(r));
        return (single && (g.getAttribute("aria-label") || labelled(g) || text(g.querySelector("legend"))) || groupPrompt(g) || nearbyLabel(e)).trim().slice(0, 800);
      }
      return (ownLabel(e) || (custom(e) && e.querySelector("input") ? ownLabel(e.querySelector("input")) : "") || (original(e) ? ownLabel(original(e)) : "") || nearbyLabel(e) || e.placeholder || (e.type === "email" || e.autocomplete === "email" ? "Email" : "")).trim().slice(0, 800);
    };
    let shadowEditors = null;
    const elements = () => {
      const list = [...document.querySelectorAll(controls)];
      const shadowReplies = (root) => {
        for (const host of root.querySelectorAll("*")) if (host.shadowRoot) {
          shadowEditors.push(...host.shadowRoot.querySelectorAll(controls));
          shadowReplies(host.shadowRoot);
        }
      };
      if (!shadowEditors) {
        shadowEditors = [];
        shadowReplies(document);
      }
      list.push(...shadowEditors);
      return list.filter((e) => !e.matches('select.select2-hidden-accessible[aria-hidden="true"]')).filter((e) => !e.parentElement?.closest(comboSelector)).filter((e) => !choice(e) || radios(e)[0] === e);
    };
    const selectedValue = (e) => {
      if (e.matches('[data-automation-id="searchBox"]')) {
        const holder = e.closest('[data-automation-id^="formField"],[data-automation-id="multiSelectContainer"]') || e.parentElement;
        return text(holder?.querySelector('[data-automation-id="selectedItem"],[data-automation-id="selectedItemLabel"]'));
      }
      if (e.matches(".iti__selected-country,.iti__selected-flag,.selected-flag")) {
        const selected = e.title || e.getAttribute("aria-label")?.replace(/^selected country\s*:?\s*/i, "") || "";
        return /\+\d/.test(selected) ? selected : "";
      }
      if (e.matches(".selectize-input,.ts-control,.ui-select-container")) {
        const items = [...e.querySelectorAll(".item,[data-item],.ui-select-match-item,.ui-select-match-text")].filter((n) => !n.parentElement?.closest(".item,[data-item],.ui-select-match-item"));
        return items.map((n) => {
          const c = n.cloneNode(true);
          for (const x of c.querySelectorAll('.remove,.ui-select-match-close,button,[aria-label="Remove"]')) x.remove();
          return text(c).replace(/^[×✕]\s*/, "");
        }).filter(Boolean).join("; ");
      }
      let parent = e;
      for (let n = 0; n < 4 && parent; n++, parent = parent.parentElement) {
        if (parent !== e && parent.querySelectorAll(comboSelector).length > 1) break;
        const selected = parent.querySelector('[class*="singleValue"],[class*="__single-value"],[data-selected-value],.ng-value-label,.select2-selection__rendered,.mat-select-value-text,.ui-select-match-text');
        if (selected) {
          if (text(selected) === "+1" && selected.querySelector('.iti__us,[data-country-code="us"]')) return "United States +1";
          return text(selected);
        }
      }
      return (e.value || text(e)).trim();
    };
    const selectedRadio = (e) => radios(e).find((r) => r.checked || r.getAttribute("aria-checked") === "true");
    const originalOptionLabel = (e) => {
      const associated = [...e.labels || []];
      const root = associated[0] || e.closest("label");
      if (root) {
        const copy = root.cloneNode(true);
        const described = (e.getAttribute("aria-describedby") || "").split(/\s+/);
        for (const n of copy.querySelectorAll('input,[role="radio"],p,small,.description,.help-block,[id]')) if (n.matches('input,[role="radio"],p,small,.description,.help-block') || described.includes(n.id)) n.remove();
        const value = text(copy).split("\n").map((s) => s.trim()).find(Boolean);
        if (value) return value;
      }
      return ownLabel(e) || text(e) || e.value || "";
    };
    const optionLabel = (e) => {
      const raw = originalOptionLabel(e);
      for (const v of [raw, e.getAttribute("aria-label"), labelled(e), e.parentElement?.getAttribute("aria-label")]) {
        const yn = String(v || "").trim().match(/^(yes|no)(?:\s*[,.-]?\s*(?:option\s+)?\d+\s+of\s+\d+)?[.\s]*$/i);
        if (yn) return yn[1];
      }
      return raw;
    };
    const placeholder = (value) => !value || /^(select|choose|please select|select an? option|select one|select an? answer|please choose)([ .…]*)$/i.test(value.trim());
    const empty = (e) => /^education-.+--(?:first|last)YearAttended-dateSectionYear-input$/i.test(e.id) && /^(?:0+|yyyy)$/i.test(e.value) ? true : isReply(e) ? !(e.value || e.textContent || "").trim() : choice(e) ? !selectedRadio(e) : custom(e) ? placeholder(selectedValue(e)) : !e.value || e.tagName === "SELECT" && e.selectedIndex === 0 && /select|choose|please|^\s*\[.+\]\s*$/i.test(text(e.options[0]));
    const disabled = (e) => e.disabled || e.readOnly && !custom(e) || e.getAttribute("aria-disabled") === "true";
    const valueText = (e) => choice(e) ? optionLabel(selectedRadio(e) || e) : e.tagName === "SELECT" ? text(e.options[e.selectedIndex]) : custom(e) ? selectedValue(e).replace(/^[×✕✖]\s*|\s*[×✕✖]$/g, "").trim() : e.value || "";
    const citizenList = (e) => {
      const stopSelector = controls + ",h1,h2,h3,h4";
      for (let node = e, level = 0; node && node !== document.body && level < 14; node = node.parentElement, level++) {
        for (let sibling = node.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
          const selector = stopSelector + ',ul,ol,[role="list"]';
          const candidates = [sibling, ...sibling.querySelectorAll(selector)].reverse();
          for (const candidate of candidates) {
            if (candidate.matches('ul,ol,[role="list"]')) {
              return [...candidate.querySelectorAll('li,[role="listitem"]')].some((item) => /^(?:u s|us|united states) citizens?$/.test(norm(text(item))));
            }
            if (candidate.matches(stopSelector) && visible(candidate) && candidate.type !== "hidden" && !candidate.closest('ul,ol,[role="list"]')) return false;
          }
        }
      }
      return false;
    };
    const context = (e) => {
      const wording = norm(label(e));
      if (radio(e)) {
        const selected = selectedRadio(e);
        if (selected && /^any company recruiter (?:worldwide|in my country region of residence)$/.test(norm(optionLabel(selected)))) return { currentRecruiterScope: optionLabel(selected) };
      }
      if (/^(?:primary |mobile |cell |contact )?(?:phone|telephone)(?: number)?$/.test(wording) && e.matches("input")) {
        const help = (e.getAttribute("aria-describedby") || "").split(/\s+/).map((id) => text(document.getElementById(id))).join(" ") + " " + text(e.parentElement);
        if (/only digits and special characters|digits only|only (?:numbers|digits)|numbers only/i.test(help) || e.validity?.patternMismatch) return { digitsPhone: true, phoneBefore: e.value };
      }
      if (/^(reading|speaking|writing|understanding|listening)$/.test(wording)) {
        for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
          const langs = [...p.querySelectorAll(controls)].filter((c) => /^(language|language name)$/.test(norm(label(c))) && visible(c));
          if (langs.length) return { languageRow: langs.length === 1 ? norm(valueText(langs[0])) : "", currentLevel: norm(valueText(e)) };
        }
      }
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        if (p === e.form) break;
        const rowLabels = /^(?:company(?: name)?|employer(?: name)?|(?:job|position) title|role description|job description|location|from|to|start date|end date|i currently work here)$/.test(wording) ? [...p.querySelectorAll("input:not([type=hidden]),select,textarea,[role=combobox]")].map((c) => norm(ownLabel(c))) : [];
        const hasSchool = rowLabels.some((s) => /^(?:school|school or university|university)(?: name)?$/.test(s));
        if (hasSchool) break;
        if (rowLabels.some((s) => /^(?:job title|position title)$/.test(s)) && rowLabels.some((s) => /^(?:company|company name|employer|employer name)$/.test(s))) return { employmentEntry: true };
        const headings = [...p.querySelectorAll('h1,h2,h3,h4,h5,h6,legend,[role="heading"]')];
        if (!headings.length) continue;
        if (headings.some((h) => /^(employment history|work experience)( \d+)?$/.test(norm(text(h)))) && headings.every((h) => /^(employment history|work experience)( \d+)?$/.test(norm(text(h))))) return { employmentEntry: true };
        break;
      }
      if (/(?:confirm|verify|repeat|re ?type|re ?enter).*e ?mail|e ?mail.*confirmation/.test(wording)) {
        const scope = e.form || e.closest('[role="dialog"]') || document;
        const originals = [...scope.querySelectorAll("input")].filter((c) => c !== e && visible(c) && /^(?:primary |personal |contact )?e ?mail(?: address)?$/.test(norm(label(c))));
        return { primaryEmail: originals.length === 1 ? originals[0].value || "" : originals.length > 1 ? "ambiguous" : "" };
      }
      if (/^(?:(?:phone(?: number)? )?country code|country)$/.test(wording.replace(/ required$/, "")) || e.matches(".iti__selected-country,.iti__selected-flag,.selected-flag")) {
        let box = e.parentElement;
        for (let depth = 0; box && box !== document.body && depth < 13; depth++, box = box.parentElement) {
          if (box.matches(".iti,.react-tel-input,.intl-tel-input,.phone-input__country,.phone-input") || box.querySelector('input[type="tel"],input[autocomplete="tel"],input[id="phone"]') && [...box.querySelectorAll("input")].filter((i) => visible(i) && i.type !== "hidden" && i.getAttribute("aria-hidden") !== "true").length <= 2) return { phoneCountry: true };
        }
      }
      if (wording === "please indicate if you belong to one of the categories above") return { includesCitizenCategory: citizenList(e) };
      if (/date granted$|^if\b|\bif (?:you (?:selected|answered) )?no\b|^(?:source )?details?$|^military (branch|status)$|^please review the question again/.test(wording) && !/^if .+ please specify$/.test(wording)) {
        const all2 = elements(), prior = all2.slice(0, all2.indexOf(e)).filter((c) => visible(c) && label(c) && !["hidden", "button", "submit", "file"].includes(type(c)));
        let last = prior.at(-1);
        if (wording === "military status" && last && norm(label(last)) === "military branch") last = prior.at(-2);
        return { parentQuestion: last ? label(last) : "", parentAnswer: last && !empty(last) ? valueText(last) : "", parentIncludesCitizenCategory: !!last && /belong to one of the categories above/.test(norm(label(last))) && citizenList(last) };
      }
      let degreePair = false, rowDegree = "";
      if (["degree", "degree type", "not completed"].includes(wording)) {
        for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
          const items = [...p.querySelectorAll(controls)];
          const degrees = items.filter((c) => !choice(c) && /^(degree|degree type)$/.test(norm(label(c))));
          const boxes = items.filter((c) => checkbox(c) && norm(ownLabel(c)) === "not completed");
          if (degrees.length > 1 || boxes.length > 1) break;
          if (degrees.length === 1 && boxes.length === 1) {
            degreePair = true;
            rowDegree = empty(degrees[0]) ? "" : valueText(degrees[0]);
            break;
          }
        }
      }
      if (/\bvisa assistance\b/.test(wording)) {
        const all2 = elements(), recent = all2.slice(Math.max(0, all2.indexOf(e) - 3), all2.indexOf(e)).map((c) => norm(label(c)));
        if (recent.some((s) => /right to work in (?:the )?(?:us|u s|united states)$/.test(s)) && !recent.some((s) => /work in /.test(s) && !/work in (?:the )?(?:us|u s|united states)$/.test(s))) return { workQuestionCountry: "United States" };
      }
      const q = norm(label(e));
      let entrySchool = "", inSchoolRow = false;
      if (/^(?:degree|major|field of study|location|(?:school |campus )?location|is current study|currently studying|currently attending|start date|end date|from|to actual or expected)$/.test(q)) {
        for (let row = e.parentElement; row && row !== document.body && row !== e.form; row = row.parentElement) {
          const inputs = [...row.querySelectorAll("input:not([type=hidden]),textarea,select,[role=combobox]")].filter((c) => visible(c));
          const schools = inputs.filter((c) => /^(?:school|university|school or university)(?: name)?$/.test(norm(ownLabel(c))));
          if (schools.length > 1 || inputs.some((c) => /^(?:job title|position title|employer name)$/.test(norm(ownLabel(c))))) break;
          if (schools.length === 1 && inputs.some((c) => /^(?:degree|major|field of study)$/.test(norm(ownLabel(c))))) {
            inSchoolRow = true;
            entrySchool = valueText(schools[0]);
            break;
          }
        }
      }
      if (inSchoolRow && !["degree", "degree type"].includes(q)) return { educationEntry: true, educationSchool: entrySchool };
      if (!/not completed|degree|gpa|grade point|overall result|field of study|^from$|^to actual or expected$|^start date$|^end date actual or expected$|^source detail|please specify|academic standing details/.test(q)) return { parentAnswer: "", parentQuestion: "", educationSchool: "" };
      const all = elements(), before = all.slice(0, all.indexOf(e));
      let parentAnswer = "", parentQuestion = "", educationSchool = "";
      if (/^source details?$|^if .+ please specify$/.test(q)) {
        const parents = before.filter((c) => /^how (did|do) you (hear|learn|find out) about/.test(norm(label(c))));
        const last = parents.at(-1);
        if (last && !empty(last)) parentAnswer = valueText(last);
      }
      if (/^(please specify|other please specify|academic standing details)$/.test(q)) {
        const last = before.at(-1);
        if (last && !empty(last) && /current academic standing/.test(norm(label(last)))) {
          parentAnswer = valueText(last);
          parentQuestion = label(last);
        }
      }
      if (/not completed|degree|gpa|grade point|overall result|field of study|^from$|^to actual or expected$|^start date$|^end date actual or expected$/.test(q)) {
        let container = e.parentElement;
        for (let n = 0; n < 7 && container && container !== document.body; n++, container = container.parentElement) {
          const schools = all.filter((c) => container.contains(c) && /^(school or university|school university|school|university|college)( name)?$/.test(norm(label(c))));
          if (schools.length > 1) break;
          if (schools.length === 1) {
            educationSchool = valueText(schools[0]) || schools[0].value || "";
            break;
          }
        }
      }
      let highestEducation = false;
      if (q === "degree" || q === "degree type") {
        let section = e.parentElement;
        for (let depth = 0; section && section !== document.body && depth < 9; depth++, section = section.parentElement) {
          if ([...section.querySelectorAll("p,small,div,span")].some((n) => n.childElementCount < 2 && /^in the degree field provide (?:your |the )?highest level of education[.\s]*$/i.test(text(n)))) {
            highestEducation = true;
            break;
          }
        }
      }
      return { parentAnswer, parentQuestion, educationSchool: entrySchool || educationSchool, educationEntry: inSchoolRow, highestEducation, degreePair, rowDegree };
    };
    const emailSave = (e) => {
      if (!e.matches("input[type=email],input[type=text]") || !/^e ?mail(?: address)?$/.test(norm(label(e)))) return null;
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        if (p.querySelectorAll("input:not([type=hidden]),select,textarea").length !== 1) break;
        const actions = [...p.querySelectorAll("button,[role=button]")].filter((b) => visible(b) && !b.disabled && !(b.form && b.type === "submit"));
        const caption = (b) => norm(b.getAttribute("aria-label") || b.title || text(b));
        const saves = actions.filter((b) => /^(?:(?:save|confirm)(?: (?:email(?: address)?|changes|your changes))?|done editing(?: your)? email(?: address)?)$/.test(caption(b)));
        if (saves.length === 1 && actions.some((b) => /^(?:cancel|undo|revert)(?: |$)/.test(caption(b)))) return saves[0];
      }
      return null;
    };
    const attachedOptions = (e) => {
      if (!custom(e)) return void 0;
      const ids = (e.getAttribute("aria-controls") || e.getAttribute("aria-owns") || "").trim().split(/\s+/);
      const boxes = ids.map((id) => document.getElementById(id)).filter((box) => box?.matches("[role=listbox]"));
      if (boxes.length !== 1) return void 0;
      const options = [...boxes[0].querySelectorAll("[role=option]")];
      if (!options.length || options.length > 100 || options.some((o) => o.hasAttribute("aria-setsize") && Number(o.getAttribute("aria-setsize")) !== options.length)) return void 0;
      return options.map((o) => ({ value: text(o), label: text(o), disabled: o.getAttribute("aria-disabled") === "true" }));
    };
    const snapshot = (e, index) => ({ index, navigation: !!e.closest("nav,[role=navigation],[role=search]") || e.getAttribute("aria-haspopup") === "menu", label: label(e), type: type(e), name: e.name || "", id: e.id || "", maxLength: e.maxLength, yearOnly: /dateSectionYear-input$/i.test(e.id), filled: !empty(e), disabled: !!disabled(e), required: !!e.required || e.getAttribute("aria-required") === "true" || label(e).includes("*") || !!e.closest('[aria-required="true"]'), placeholder: e.placeholder || "", min: e.min || "", max: e.max || "", ...context(e), ...e.value && emailSave(e) ? { emailSave: true, emailValue: e.value } : {}, options: e.tagName === "SELECT" ? [...e.options].map((o) => ({ value: o.value, label: text(o), disabled: o.disabled })) : choice(e) ? radios(e).map((r, i) => ({ value: String(i), label: optionLabel(r), disabled: !!disabled(r) })) : attachedOptions(e) });
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const sectionFor = (name) => {
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,[role="heading"]')].filter((h) => visible(h) && norm(text(h)) === name);
      if (headings.length !== 1) return null;
      for (let p = headings[0].parentElement; p && p !== document.body; p = p.parentElement) {
        if (p.querySelector(name === "skills" ? "input:not([type=hidden])" : 'button,input:not([type=hidden]),select,[role="combobox"]')) {
          const other = [...p.querySelectorAll('h1,h2,h3,h4,h5,[role="heading"]')].some((h) => h !== headings[0] && !new RegExp("^" + name + "s? \\d+$", "i").test(text(h)) && !/^languages? \d+$/i.test(text(h)));
          return other ? null : p;
        }
      }
      return null;
    };
    const chipValues = (p) => [...p.querySelectorAll('[data-automation-id="selectedItem"],[data-automation-id="selectedItemLabel"],[data-item],.item[data-value],.select2-selection__choice,[class*="multiValueLabel"]')].flatMap((n) => {
      if (n.querySelector('[data-automation-id="selectedItemLabel"]')) return [];
      const copy = n.cloneNode(true);
      for (const child of copy.querySelectorAll("button,svg,[aria-hidden=true]")) child.remove();
      const value = (text(copy) || n.getAttribute("data-value") || "").replace(/^[×✕]\s*/, "").trim();
      return value ? [value] : [];
    });
    const skillInput = (p) => [...p.querySelectorAll("input:not([type=hidden]):not([type=checkbox])")].find((e) => visible(e) && !disabled(e) && (/skills/i.test(label(e) + " " + e.id) || e.getAttribute("data-automation-id") === "searchBox"));
    const languageInputs = (p) => elements().filter((e) => p.contains(e) && visible(e) && !disabled(e) && !choice(e) && /^(language|select language)$/.test(norm(label(e))));
    const languageAdd = (p) => [...p.querySelectorAll("button")].find((b) => visible(b) && !disabled(b) && (!b.form || b.type === "button") && /^(add|add another|add language)$/i.test(text(b)));
    const listFields = () => {
      const fields2 = [], skills = sectionFor("skills"), languages = sectionFor("languages");
      if (skills && skillInput(skills)) fields2.push({ type: "skill-list", label: "Skills", existing: chipValues(skills) });
      if (languages && (languageAdd(languages) || languageInputs(languages).length)) fields2.push({ type: "language-list", label: "Languages", existing: languageInputs(languages).filter((e) => !empty(e)).map(valueText) });
      return fields2;
    };
    async function fillLanguages(values) {
      for (const value of values) {
        const section = sectionFor("languages");
        if (!section || location.href !== url) return false;
        let inputs = languageInputs(section);
        if (inputs.some((e) => !empty(e) && norm(valueText(e)) === norm(value))) continue;
        if (!inputs.some(empty)) {
          const add = languageAdd(section);
          if (!add) return false;
          add.click();
          for (let i = 0; i < 20; i++) {
            await pause(75);
            const next = sectionFor("languages");
            inputs = next ? languageInputs(next) : [];
            if (inputs.some(empty)) break;
          }
        }
        const blanks = inputs.filter(empty);
        if (blanks.length !== 1) return false;
        const target = blanks[0], field = snapshot(target, elements().indexOf(target));
        let answer = { value, display: value, aliases: [norm(value)] };
        if (target.tagName === "SELECT") {
          const options = field.options.filter((o) => !o.disabled && norm(o.label) === norm(value));
          if (options.length !== 1) return false;
          answer = { value: options[0].value, display: options[0].label };
        }
        const result = await formBridge({ action: "fill", url, fields: [{ ...field, ...answer }] });
        if (!result.filled) return false;
      }
      return true;
    }
    async function fillSkills(values, skillAliases = {}) {
      let complete = true;
      for (const value of values) {
        const section = sectionFor("skills"), e = section && skillInput(section);
        if (!e || location.href !== url) return false;
        const skillKey3 = (s) => s.toLowerCase().replace(/c\+\+/g, "cplusplus").replace(/c#/g, "csharp").replace(/[^a-z0-9]+/g, " ").trim();
        const aliases3 = new Set(skillAliases[value] || [skillKey3(value)]);
        const committed = () => {
          const p = sectionFor("skills");
          return !!p && chipValues(p).some((s) => aliases3.has(skillKey3(s)));
        };
        if (committed()) continue;
        if (e.value.trim()) return false;
        const write = (v) => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(e, v);
          e.dispatchEvent(new Event("input", { bubbles: true }));
        };
        const menus = '[role="listbox"],[data-automation-id="activeListContainer"],[data-automation-id="promptOptionsContainer"]';
        const before = new Set([...document.querySelectorAll(menus)].filter(visible));
        e.focus();
        write(value);
        let clicked = false;
        for (let i = 0; i < 20 && !committed(); i++) {
          await pause(75);
          if (!e.isConnected || location.href !== url) return false;
          const id = e.getAttribute("aria-controls") || e.getAttribute("aria-owns");
          const panels = [...document.querySelectorAll(menus)].filter((p) => visible(p) && (p.id === id || section.contains(p) || !before.has(p)));
          const inner = panels.filter((p) => !panels.some((n) => n !== p && p.contains(n)));
          const panel = panels.find((p) => p.id && p.id === id) || (inner.length === 1 ? inner[0] : null);
          const rows = panel ? [...panel.querySelectorAll('[role="option"],[data-automation-id="promptOption"],[data-automation-id="menuItem"],[data-automation-id="promptLeafNode"],li')].filter((o) => visible(o) && !disabled(o)) : [];
          const matches = rows.filter((o) => aliases3.has(skillKey3(text(o))));
          const options = matches.filter((o) => !matches.some((n) => n !== o && o.contains(n)));
          if (!clicked && options.length === 1) {
            activate(options[0], true);
            clicked = true;
          } else if (!clicked && i === 4 && !rows.length) {
            for (const event of ["keydown", "keyup"]) e.dispatchEvent(new KeyboardEvent(event, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
          }
        }
        if (!committed()) {
          if (e.value === value) write("");
          e.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
          complete = false;
        }
      }
      return complete;
    }
    if (action === "advance") {
      if (location.href !== url || document.querySelector("input[type=password]")) return false;
      const heading = [...document.querySelectorAll("h1,h2,[aria-current=step]")].filter(visible).map(text).join(" ");
      if (/review and submit|review your application|submit application|certification|signature/i.test(heading)) return false;
      const buttons = [...document.querySelectorAll("button,input[type=button],input[type=submit]")].filter((b) => visible(b) && !disabled(b));
      if (buttons.some((b) => /submit (?:my |your )?application|finish application/i.test(text(b) || b.value))) return false;
      const next = buttons.filter((b) => /^(?:save (?:and|&) continue|continue|next(?: step| section)?)$/i.test((text(b) || b.value || "").trim()));
      if (next.length !== 1) return false;
      const current = document.querySelector('[aria-current="step"],[data-automation-id="progressBarActiveStep"]');
      if (current && /review|submit|certif|signature|final/i.test(text(current))) return false;
      if (next[0].type === "submit" && !/save (?:and|&) continue/i.test(text(next[0]) || next[0].value) && !current) return false;
      if (next[0].form && !next[0].form.checkValidity() || [...document.querySelectorAll("[aria-invalid=true]")].some(visible)) return false;
      next[0].click();
      return true;
    }
    if (action === "prepare-education") {
      const sites = sectionFor("websites");
      if (sites && !sites.querySelector('input:not([type=hidden]),a[href^="http"]')) {
        const adds = [...sites.querySelectorAll("button")].filter((b) => visible(b) && !disabled(b) && (!b.form || b.type === "button") && norm(text(b)) === "add");
        if (adds.length === 1) adds[0].click();
      }
      const buttons = [...document.querySelectorAll("button")].filter((b) => visible(b) && !b.disabled && !b.matches('[type="submit"]') && (!b.form || b.type === "button") && /^(?:\+\s*)?add(?: education(?: history)?)?$/i.test(text(b)));
      const education = buttons.filter((b) => {
        for (let section = b.parentElement; section && section !== document.body; section = section.parentElement) {
          const headings = [...section.querySelectorAll('h1,h2,h3,h4,h5,legend,[role="heading"]')].filter(visible);
          if (!headings.length) continue;
          if (norm(text(b)) === "add education" && headings.some((h) => /^(?:work and education history|education(?: history)?)$/.test(norm(text(h)))))
            return !section.querySelector('input:not([type=hidden]),select,textarea,[role=combobox],[data-education-entry],[aria-label*="Edit education" i], [class*="timeline-item"]:not([class*="year"])') && ![...section.querySelectorAll("h3,h4,li,[role=listitem]")].some((row) => /\b(?:university|bachelor|diploma|school of)\b/i.test(text(row)));
          return headings.length === 1 && /^(?:education|education history)$/.test(norm(text(headings[0]))) && !section.querySelector('input:not([type="hidden"]),select,textarea,[role="combobox"]') && buttons.filter((other) => section.contains(other)).length === 1;
        }
        return false;
      });
      if (education.length !== 1) return false;
      education[0].click();
      return (async () => {
        for (let i = 0; i < 20; i++) {
          if (elements().some((c) => visible(c) && norm(label(c)) === "school or university")) break;
          await new Promise((r) => setTimeout(r, 60));
        }
        return true;
      })();
    }
    if (action === "scan-chat") return { url: location.href, fields: elements().flatMap((e, i) => isReply(e) && visible(e) ? [snapshot(e, i)] : []) };
    if (action === "scan") {
      const countries = /* @__PURE__ */ new Set(), postings = [];
      for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        if (script.textContent.length > 25e4) continue;
        try {
          const json = JSON.parse(script.textContent);
          for (const row of [json].flat().flatMap((x) => x?.["@graph"] || [x])) if ([row?.["@type"]].flat().includes("JobPosting")) postings.push(row);
        } catch {
        }
      }
      if (postings.length === 1) for (const place of [postings[0].jobLocation].flat()) {
        let country = place?.address?.addressCountry;
        country = country?.name || country;
        if (typeof country === "string" && /^[a-z]{2}$/i.test(country)) country = new Intl.DisplayNames(["en"], { type: "region" }).of(country.toUpperCase());
        countries.add([place?.address?.addressRegion, typeof country === "string" ? country : ""].filter((v) => typeof v === "string" && v).join(", "));
      }
      if (!countries.size) for (const node of document.querySelectorAll('[itemprop=jobLocation],[data-automation-id=locations],[data-bind="html: primaryLocation"],[data-job-location]')) {
        const loc = node.getAttribute("data-job-location") || text(node);
        if (loc && loc.length < 120) countries.add(loc);
      }
      const jobLocation = countries.size === 1 ? [...countries][0] : "";
      const posting = postings.length === 1 ? postings[0] : null;
      const jobEmployer = posting?.hiringOrganization?.name || "", jobIndustry = typeof posting?.industry === "string" ? posting.industry : "";
      const all = elements();
      return { url: location.href, jobLocation, jobEmployer, jobIndustry, needsEmailVerification: !!document.querySelector("input[type=password]") && /please verify your account|verify your account before you sign in|verify your email before/i.test(text(document.body)), fields: all.map(snapshot).filter((f) => choice(all[f.index]) ? choiceVisible(all[f.index]) : visible(all[f.index])).concat(listFields()), applicationFrames: [...document.querySelectorAll("iframe[src]")].filter(visible).flatMap((frame) => {
        try {
          const u = new URL(frame.src, location.href);
          return u.origin === location.origin && u.protocol === "https:" ? [u.href] : [];
        } catch {
          return [];
        }
      }), chatFrames: [...document.querySelectorAll("iframe[src]")].filter(visible).flatMap((frame) => {
        try {
          const u = new URL(frame.src, location.href);
          return u.protocol === "https:" && (/(^|\.)paradox\.ai$/.test(u.hostname) || /\b(chat|chatbot|olivia)\b/i.test([frame.title, frame.id, frame.name].join(" "))) ? [u.origin] : [];
        } catch {
          return [];
        }
      }), hasEmailSignIn: [...document.querySelectorAll("h1,h2,h3,[role=heading]")].some((h) => visible(h) && /^(?:sign in|log in)$/i.test(text(h))), hasPasswordField: !!document.querySelector("input[type=password i]"), embeddedForms: document.querySelectorAll("iframe").length };
    }
    if (action === "remember") {
      const blocked = /password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/i;
      const candidates = [];
      for (const e of elements()) {
        if (!["text", "email", "tel", "url", "textarea", "select-one", "number", "combobox", "radio-group", "checkbox-group", "date", "month"].includes(type(e)) || disabled(e) || !visible(e) || empty(e)) continue;
        if (checkbox(e) && norm(label(e)) !== "in which of the following u s geographic locations are you willing to work") continue;
        const question = label(e), identity = /^(sex|what is your sex|gender|what is your gender|preferred pronouns?|pronouns|what are your pronouns|race|ethnicity|race ethnicity|race ethnic background|what is your race ethnic background|what is your race ethnicity|what is your race|what is your ethnicity|what is your racial ethnic background|country of citizenship|in which country region do you have citizenship|in which country do you have citizenship|which country are you a citizen of)$/.test(norm(question));
        if (!question || /^(in )?(what|which) country( region)?$/.test(norm(question)) || !identity && blocked.test(question + " " + (e.name || "") + " " + e.id) || /one-time-code|cc-|current-password|new-password/.test(e.autocomplete || "")) continue;
        const answer = checkbox(e) ? radios(e).filter((r) => r.checked).map(optionLabel).join("; ") : radio(e) ? optionLabel(selectedRadio(e)) : custom(e) ? selectedValue(e) : e.tagName === "SELECT" ? text(e.options[e.selectedIndex]) : e.value;
        if (!answer || answer.length > 1500 || placeholder(answer)) continue;
        candidates.push({ question, answer });
        if (candidates.length >= 100) break;
      }
      return { url: location.href, origin: location.origin, candidates };
    }
    return (async () => {
      if (location.href !== url) return { filled: 0, skipped: fields.length, changed: true };
      let filled = 0, skipped = 0;
      for (const f of fields) {
        if (f.type === "skill-list" || f.type === "language-list") {
          if (location.href === url && Array.isArray(f.value) && await (f.type === "skill-list" ? fillSkills : fillLanguages)(f.value, f.skillAliases)) filled++;
          else skipped++;
          continue;
        }
        const all = elements();
        let e = all[f.index];
        if (f.id && e?.id !== f.id) {
          const matches = all.filter((c) => c.id === f.id);
          e = matches.length === 1 ? matches[0] : null;
        }
        if (f.emailSave && e?.isConnected && location.href === url && label(e) === f.label && e.value === f.emailValue && e.value.toLowerCase() === String(f.value).toLowerCase()) {
          const save = emailSave(e);
          if (save) {
            save.click();
            await pause(150);
            if (!e.isConnected || !emailSave(e)) filled++;
            else skipped++;
          } else skipped++;
          continue;
        }
        if (location.href !== url || !e || !e.isConnected || !empty(e) && !(f.currentRecruiterScope && context(e).currentRecruiterScope === f.currentRecruiterScope && norm(f.display) === "only recruiters managing jobs i apply to") && !(f.digitsPhone && context(e).digitsPhone && e.value === f.phoneBefore && e.value.replace(/\D/g, "") === f.value) && !(f.languageRow === "english" && f.currentLevel === "basic" && context(e).languageRow === "english" && norm(valueText(e)) === "basic" && f.display === "Fluent") || disabled(e) || !(choice(e) ? choiceVisible(e) : visible(e)) || label(e) !== f.label || type(e) !== f.type || (e.name || "") !== f.name || (e.id || "") !== f.id) {
          skipped++;
          continue;
        }
        const currentContext = context(e);
        if ("primaryEmail" in f && currentContext.primaryEmail && String(currentContext.primaryEmail).trim().toLowerCase() !== String(f.value).trim().toLowerCase() || f.degreePair && (!currentContext.degreePair || f.rowDegree && f.rowDegree !== currentContext.rowDegree) || f.includesCitizenCategory && !currentContext.includesCitizenCategory || f.parentIncludesCitizenCategory && !currentContext.parentIncludesCitizenCategory || f.parentQuestion && currentContext.parentQuestion !== f.parentQuestion || f.parentAnswer && currentContext.parentAnswer !== f.parentAnswer || f.educationSchool && currentContext.educationSchool !== f.educationSchool) {
          skipped++;
          continue;
        }
        if (checkbox(e)) {
          const choices = radios(e), labels = f.selectedLabels || [], matching = choices.filter((r) => !disabled(r) && choiceVisible(r) && labels.some((l) => norm(l) === norm(optionLabel(r))));
          if (!labels.length || matching.length !== labels.length || new Set(matching.map((r) => norm(optionLabel(r)))).size !== labels.length) {
            skipped++;
            continue;
          }
          for (const r of matching) if (!r.checked) r.click();
          await new Promise((r) => setTimeout(r, 60));
          if (matching.every((r) => r.checked)) filled++;
          else skipped++;
        } else if (radio(e)) {
          const choices = radios(e), matching = choices.filter((r) => !disabled(r) && choiceVisible(r) && norm(optionLabel(r)) === norm(f.display));
          if (matching.length !== 1) {
            skipped++;
            continue;
          }
          matching[0].click();
          await new Promise((r) => setTimeout(r, 60));
          if (selectedRadio(e) === matching[0]) filled++;
          else skipped++;
        } else if (custom(e)) {
          const boxSelector = '[class*="__menu-list"],[id^="react-select-"][id$="-listbox"],[role="listbox"],[role="menu"],[role="tree"],[role="grid"],[data-automation-id="activeListContainer"],[data-automation-id="promptOptionsContainer"],.iti__country-list,.country-list,[class$="-menu-list"],.ng-dropdown-panel,.select2-results__options,.mat-select-panel,.dropdown-menu,.selectize-dropdown,.ui-select-choices,.ts-dropdown';
          const optionSelector = '[class*="__option"],[id^="react-select-"][id*="-option-"],[role="option"],[role="gridcell"][aria-selected],[role="treeitem"],[data-automation-id="menuItem"],[data-automation-id="promptOption"],[data-automation-id="promptLeafNode"],.iti__country,.country[data-country-code],[class$="-option"],.ng-option,.select2-results__option,mat-option,[role="menuitem"],li,[tabindex]:not([tabindex="-1"]),[data-selectable],.ui-select-choices-row';
          const before = new Set([...document.querySelectorAll(boxSelector)].filter(visible));
          const opener = e.matches(".ui-select-container") ? e.querySelector(".ui-select-toggle,.ui-select-match") || e : e;
          e.focus();
          if (e.getAttribute("aria-expanded") !== "true") activate(opener);
          if (e.getAttribute("aria-expanded") !== "true") e.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true }));
          let boxes = [];
          let searchInput = e.matches("input:not([readonly])") ? e : e.querySelector('input:not([readonly]):not([type="hidden"])');
          const academicPicker = /^(?:school or university|school|university|field of study|major)$/.test(norm(f.label));
          if (academicPicker && searchInput) {
            const target = String(f.value);
            const term = /school|university/.test(norm(f.label)) ? target.split(/[–—]|\s+-\s+/)[0].trim() : target;
            const preventSubmit = (event) => event.preventDefault();
            searchInput.form?.addEventListener("submit", preventSubmit, true);
            try {
              Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(searchInput, term);
              searchInput.dispatchEvent(new Event("input", { bubbles: true }));
              for (const kind of ["keydown", "keyup"]) searchInput.dispatchEvent(new KeyboardEvent(kind, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
            } finally {
              searchInput.form?.removeEventListener("submit", preventSubmit, true);
            }
          }
          const searchableAddress = /^(?:current |home )?(?:country(?: of residence)?|state(?: province)?|province|city|county|postal code|zip(?: code)?|address line 1)$/.test(norm(f.label));
          const writeSearch = (value) => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(searchInput, value);
            searchInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
          };
          let initialQuery = "";
          for (let attempt = 0; attempt < 15; attempt++) {
            if (location.href !== url || !e.isConnected) break;
            const ids = ((e.getAttribute("aria-controls") || "") + " " + (e.getAttribute("aria-owns") || "")).trim().split(/\s+/).filter(Boolean);
            boxes = [...new Set(ids)].map((id) => e.getRootNode().getElementById?.(id) || document.getElementById(id)).filter((n) => n && visible(n));
            if (!boxes.length) {
              const local = e.closest('[data-automation-id^="formField-"],.iti,.react-tel-input,.intl-tel-input,.selectize-control,.ui-select-container,.ts-wrapper');
              if (local) boxes = [...local.querySelectorAll(boxSelector)].filter(visible);
            }
            if (!boxes.length && e.parentElement?.querySelectorAll(comboSelector).length === 1) boxes = [...e.parentElement.querySelectorAll(boxSelector)].filter(visible);
            if (!boxes.length) boxes = [...document.querySelectorAll(boxSelector)].filter((n) => visible(n) && !before.has(n));
            boxes = boxes.filter((b, i, all2) => !all2.some((other) => other !== b && other.contains(b)));
            if (academicPicker && boxes.length === 1 && !Array.from(boxes[0].querySelectorAll(optionSelector)).some((o) => norm(text(o)) === norm(f.value))) {
              await new Promise((r) => setTimeout(r, 80));
              continue;
            }
            if (boxes.length === 1 && [...boxes[0].querySelectorAll(optionSelector)].some((o) => !o.matches('[aria-disabled="true"],.loading-results,[role="alert"],[aria-busy="true"]') && !/^(?:searching|loading)(?: results)?[.… ]*$/i.test(text(o)))) break;
            if (attempt === 2 && searchInput && searchableAddress && !searchInput.value && !f.phoneCountry) {
              initialQuery = String(f.value);
              writeSearch(initialQuery);
            }
            await new Promise((r) => setTimeout(r, 80));
          }
          const aliases3 = [...f.aliases || [norm(f.value)]];
          const readOptions = () => boxes.length === 1 ? [...boxes[0].querySelectorAll(optionSelector)].filter((o) => visible(o) && !disabled(o) && !o.classList.contains("ng-option-disabled")).filter((o) => !o.matches("input,textarea") && !o.matches('[role="listbox"],[role="tree"],[role="menu"]')).filter((o, i, all2) => !all2.some((other) => other !== o && o.contains(other) && norm(text(o)) === norm(text(other)))) : [];
          const optionKey = (o) => f.phoneCountry && o.getAttribute("data-country-code")?.toLowerCase() === "us" && /\+1\b/.test(text(o)) ? "united states 1" : norm(text(o));
          let available = readOptions();
          const isAddressPicker = searchableAddress || /citizenship/.test(norm(f.label));
          if (!searchInput && boxes.length === 1 && e.matches(".select2-selection")) searchInput = boxes[0].closest(".select2-dropdown")?.querySelector("input.select2-search__field");
          const input = searchInput;
          const query = initialQuery || (input && isAddressPicker && !f.phoneCountry && boxes.length === 1 && !input.value && !available.some((o) => aliases3.includes(optionKey(o))) ? String(f.value) : "");
          const setQuery = writeSearch;
          if (query) {
            if (!initialQuery) setQuery(query);
            for (let i = 0; i < 12; i++) {
              await new Promise((r) => setTimeout(r, 80));
              if (!e.isConnected || location.href !== url) break;
              available = readOptions();
              if (available.some((o) => aliases3.includes(optionKey(o)))) break;
            }
          }
          if (boxes.length === 1 && !available.some((o) => aliases3.includes(optionKey(o)))) {
            const scroll = [boxes[0], ...boxes[0].querySelectorAll("ul,div")].find((n) => n.clientHeight > 0 && n.scrollHeight > n.clientHeight + 2);
            if (scroll) {
              scroll.scrollTop = 0;
              scroll.dispatchEvent(new Event("scroll"));
              await new Promise((r) => setTimeout(r, 45));
              available = readOptions();
              for (let i = 0; i < 45 && !available.some((o) => aliases3.includes(optionKey(o))); i++) {
                const top = scroll.scrollTop;
                scroll.scrollTop += scroll.clientHeight;
                if (scroll.scrollTop === top) break;
                scroll.dispatchEvent(new Event("scroll"));
                await new Promise((r) => setTimeout(r, 45));
                available = readOptions();
                if (available.some((o) => aliases3.includes(optionKey(o)))) break;
              }
            }
          }
          if (f.confirmUSPersons) {
            const choices = available.filter((o) => !placeholder(text(o)));
            if (choices.length === 1) aliases3.push(norm(text(choices[0])));
          }
          if (f.careerSiteDetail) {
            const careerSites = available.map((o) => norm(text(o))).filter((v) => /\b(?:careers? (?:web)?site|careers? page|company website)$/.test(v));
            if (careerSites.length === 1) aliases3.push(careerSites[0]);
          }
          const brand = /\.myworkdayjobs\.com$/.test(location.hostname) ? norm(location.hostname.split(".")[0]) : "";
          if (f.sourceTree) {
            const direct = available.filter((o) => /\bcareers? (?:web ?site|page|site)$/.test(optionKey(o)));
            if (direct.length === 1) aliases3.unshift(optionKey(direct[0]));
            if (brand && available.some((o) => optionKey(o) === brand)) aliases3.unshift(brand);
          }
          const options = available.filter((o) => aliases3.includes(optionKey(o)));
          if (f.phoneCountry && options.length > 1 && options.every((o) => optionKey(o) === "united states 1")) options.splice(1);
          if (options.length > 1 && aliases3.length > 1) {
            options.sort((a, b) => aliases3.indexOf(norm(text(a))) - aliases3.indexOf(norm(text(b))));
            if (norm(text(options[0])) !== norm(text(options[1]))) options.splice(1);
          }
          if (location.href !== url || !e.isConnected || options.length !== 1) {
            if (query && input.isConnected && input.value === query && !/^address line 1\s*\*?$/i.test(f.label.trim())) setQuery("");
            e.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
            e.blur();
            skipped++;
            continue;
          }
          options[0].scrollIntoView?.({ block: "nearest" });
          activate(options[0], true);
          let accepted = false, leafChosen = false;
          const rootChoice = optionKey(options[0]);
          const branchKind = (name) => name === brand || /^(?:company|corporate|our) web ?site$/.test(name) ? "company" : /^job boards?$/.test(name) ? "board" : /^recruiting event$/.test(name) ? "event" : "";
          let sourceBranch = f.sourceTree && branchKind(rootChoice), tried = /* @__PURE__ */ new Set([rootChoice]);
          for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise((r) => setTimeout(r, 80));
            if (location.href !== url || !e.isConnected) break;
            if (sourceBranch && !leafChosen) {
              const lists = [...document.querySelectorAll(boxSelector)].filter((n) => visible(n) && (boxes.includes(n) || !before.has(n)));
              const nodes = [...new Set(lists.flatMap((b) => [...b.querySelectorAll(optionSelector)]))].filter((o) => visible(o) && !disabled(o));
              const names = sourceBranch === "board" ? ["linkedin", "linked in", "indeed", "indeed com"] : sourceBranch === "event" ? ["career fair", "job fair", "university career fair"] : ["job search", "company careers website", "company career site", "careers website", "careers site", brand + " career site", brand + " careers site"];
              const matches = nodes.filter((o) => names.includes(optionKey(o)) || sourceBranch === "company" && /\bcareers? (?:web ?site|page|site)$/.test(optionKey(o)));
              const leaf = matches.find((o) => !matches.some((x) => x !== o && o.contains(x)));
              if (leaf) {
                aliases3.push(optionKey(leaf));
                activate(leaf, true);
                leafChosen = true;
                continue;
              }
              if (f.sourceFallbacks && attempt >= 2 && nodes.length) {
                const next = ["job board", "job boards", "recruiting event"].find((name) => !tried.has(name) && nodes.some((o) => optionKey(o) === name));
                if (next) {
                  tried.add(next);
                  sourceBranch = branchKind(next);
                  activate(nodes.find((o) => optionKey(o) === next), true);
                  continue;
                }
                const back = lists.flatMap((b) => [...b.querySelectorAll('button,[role="button"],[data-automation-id*="Back"],[data-automation-id*="back"]')]).find((n) => visible(n) && /back/i.test([n.getAttribute("aria-label"), n.getAttribute("data-automation-id"), text(n)].join(" ")));
                if (back) activate(back, true);
              }
              if (lists.length) continue;
            }
            if (!(sourceBranch === "company" && brand && rootChoice === brand && !leafChosen) && (aliases3.includes(norm(valueText(e))) || f.phoneCountry && /^\+1$/.test(valueText(e)) && boxes.every((b) => !b.isConnected || !visible(b))) && e.getAttribute("aria-invalid") !== "true" && (!query || input.value !== query || e.getAttribute("aria-expanded") !== "true" && boxes.every((b) => !b.isConnected || !visible(b)))) {
              accepted = true;
              break;
            }
          }
          if (boxes.some((b) => b.isConnected && visible(b))) {
            e.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
            e.blur();
          }
          if (!accepted && query && input.isConnected && input.value === query && !/^address line 1$/i.test(f.label.trim())) setQuery("");
          if (accepted) filled++;
          else skipped++;
        } else {
          if (e.tagName === "SELECT" && ![...e.options].some((o) => o.value === f.value && !o.disabled && text(o) === f.display)) {
            skipped++;
            continue;
          }
          if (isReply(e) && e.hasAttribute("contenteditable")) {
            e.textContent = f.value;
            e.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
            if (e.isConnected && text(e) === f.value) filled++;
            else skipped++;
            continue;
          }
          let fillValue = f.value;
          if (e.type === "date" || e.type === "month" || /^(YYYY-MM-DD|YYYY-MM|MM\/DD\/YYYY)$/i.test(e.placeholder || "")) {
            const month = e.type === "month" || /^YYYY-MM$/i.test(e.placeholder || "");
            if (!(month ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/).test(fillValue) || e.min && fillValue < e.min || e.max && fillValue > e.max) {
              skipped++;
              continue;
            }
            const parsed = /* @__PURE__ */ new Date(fillValue + (month ? "-01" : "") + "T12:00:00Z");
            if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, month ? 7 : 10) !== fillValue) {
              skipped++;
              continue;
            }
            if (/^MM\/DD\/YYYY$/i.test(e.placeholder || "")) fillValue = fillValue.slice(5, 7) + "/" + fillValue.slice(8, 10) + "/" + fillValue.slice(0, 4);
          }
          const proto = e.tagName === "SELECT" ? HTMLSelectElement.prototype : e.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, "value").set.call(e, fillValue);
          e.dispatchEvent(new Event("input", { bubbles: true }));
          e.dispatchEvent(new Event("change", { bubbles: true }));
          if (e.value === fillValue && /^e ?mail(?: address)?$/.test(norm(f.label))) {
            await pause(80);
            emailSave(e)?.click();
          }
          if (!isReply(e)) e.dispatchEvent(new Event("blur", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 120));
          if (e.isConnected && e.value === fillValue && (!e.validity || e.validity.valid)) filled++;
          else skipped++;
        }
      }
      return { filled, skipped };
    })();
  }

  // tools/application-helper/answer-memory.mjs?v=20261123.3
  var normalizeQuestion = (value) => String(value || "").toLowerCase().replace(/[’']/g, "").replace(/\+/g, " plus ").replace(/#/g, " sharp ").replace(/%/g, " percent ").replace(/-(?=\d)/g, " minus ").replace(/(\d)\.(?=\d)/g, "$1 decimal ").replace(/[^a-z0-9]+/g, " ").replace(/\b(required|optional)\b/g, "").replace(/\s+/g, " ").trim();
  var reviewedIdentityQuestion = (q) => ["Sex", "Preferred pronouns", "Race / ethnic background", "Country of citizenship"].includes(commonQuestion(q)?.question);
  var privateQuestion = (q) => !reviewedIdentityQuestion(q) && /password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(normalizeQuestion(q));
  var equivalents = [
    ["when can you start", "when are you available to start", "what is your earliest start date", "what is your earliest available start date", "earliest start date", "available start date", "availability to start", "when would you be available to start"],
    ["are you willing to relocate", "are you open to relocation", "would you be willing to relocate", "willing to relocate", "open to relocation"],
    ["are you willing to travel", "are you open to travel", "would you be willing to travel", "willing to travel"],
    ["what is your preferred name", "preferred name", "what name do you prefer to go by"],
    ["what is your preferred contact method", "preferred contact method", "how do you prefer to be contacted"]
  ];
  function questionConcept(question) {
    if (reviewedIdentityQuestion(question)) return "identity-" + commonQuestion(question).question;
    const age = ageThreshold(question);
    if (age !== null) return "age-" + age;
    const date = dateConcept(question);
    if (date) return "date-" + date;
    const common = commonQuestion(question);
    if (common) return "common-" + common.question;
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
    return { value: matches[0].answer, question: matches[0].question, reason: kind, requiresReview: reviewedIdentityQuestion(question) };
  }

  // tools/application-helper/application-autofill.mjs
  var normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  var skillKey2 = (s) => normalize(String(s).toLowerCase().replace(/c\+\+/g, "cplusplus").replace(/c#/g, "csharp"));
  var skillEquivalents = {
    cad: ["computer aided design", "computer aided design cad", "cad computer aided design"],
    fea: ["finite element analysis", "finite element analysis fea"],
    excel: ["microsoft excel"],
    "3d printing": ["3 d printing", "three dimensional printing"],
    solidworks: ["solidworks cad", "solidworks 3d cad"]
  };
  function suggestField(field, profile, memory = [], origin = "", context = "", portfolio = null) {
    if (!profile?.confirmed) return null;
    if (field.type === "skill-list" || field.type === "language-list") {
      const skills = field.type === "skill-list";
      const languages = profile.answers?.find((a) => normalize(a.question) === "languages spoken")?.answer || "";
      const values = skills ? (portfolio?.skills || []).map((s) => s.name) : languages.split(/[,;]/).map((s) => s.trim());
      const aliasesFor = (v) => [skillKey2(v), ...skills ? skillEquivalents[skillKey2(v)] || [] : []];
      const present = new Set((field.existing || []).map(skillKey2));
      const pending = [...new Set(values.filter(Boolean))].filter((v) => !aliasesFor(v).some((alias) => present.has(alias))).slice(0, skills ? Math.max(0, 10 - present.size) : 20);
      return pending.length ? { ...skills ? { skillAliases: Object.fromEntries(pending.map((v) => [v, aliasesFor(v)])) } : {}, value: pending, display: pending.join(", "), reason: skills ? "Skills documented on your r\xE9sum\xE9" : "Languages in your confirmed profile", requiresReview: true } : null;
    }
    if (field.type === "chat-reply") {
      if (field.filled || field.disabled) return null;
      const parts2 = field.label.split(/(?:[.!]\s+(?=[A-Z])|\n+)/);
      const prompt = parts2.at(-1).replace(/^to get started,\s*/i, "").trim();
      if ((field.label.match(/\?/g) || []).length > 1) return null;
      const request = normalize(prompt).replace(/^(?:(?:can|could|would) you (?:please )?|please )?(?:provide(?: (?:us|me))?(?: with)?|enter|share|tell (?:us|me)|type) (?:your )?/, "").replace(/^what (?:is|are) your /, "");
      const contact = /* @__PURE__ */ new Map([["first and last name", "Full name"], ["full name", "Full name"], ["first name", "First name"], ["last name", "Last name"], ["email", "Email"], ["email address", "Email"], ["phone number", "Phone number"], ["mobile number", "Phone number"]]);
      const answer = suggestField({ ...field, label: contact.get(request) || prompt, type: "text" }, profile, memory, origin, context, portfolio);
      return answer ? { ...answer, reason: "Draft reply for your review", sourceQuestion: answer.sourceQuestion || contact.get(request) || prompt } : null;
    }
    const wording = String(field.label || "").replace(/^\s*(?:question\s+)?\d{1,3}\s*[*.)\-:]+\s*[.*:]?\s*/i, "");
    const parts = wording.trim().split(/\s+/), half = parts.length / 2;
    if (Number.isInteger(half) && normalize(parts.slice(0, half).join(" ")) === normalize(parts.slice(half).join(" "))) field = { ...field, label: parts.slice(0, half).join(" ") };
    else field = { ...field, label: wording };
    const label = normalize(field.label).replace(/\b(required|optional)\b/g, "").trim();
    if (field.employmentEntry && label !== "current professional title") {
      const history = profile.answers?.filter((a) => commonQuestion(a.question)?.question === "Employment experience") || [];
      if (history.length && history.every((a) => normalize(a.answer) === "none")) {
        if (!field.filled && !field.disabled && ["text", "textarea"].includes(field.type) && (field.required && /^(?:job title|position title|company|company name|employer|employer name)$/.test(label) || /^(?:role description|job description)$/.test(label))) {
          const value2 = field.type === "textarea" ? "I have never been employed." : "Never employed";
          if (!field.maxLength || field.maxLength < 0 || field.maxLength >= value2.length) return { value: value2, display: value2, reason: "No prior employment", sourceQuestion: "Employment experience" };
        }
        return null;
      }
    }
    const common = commonQuestion(label), background = backgroundAnswer(label, profile, memory.filter((a) => a.scope === "*" || a.scope === origin && a.context === context));
    const rule = answerRule(field, profile, memory, origin, context);
    if (rule?.blocked) return null;
    if (/^(in )?(what|which) country( region)?$/.test(label)) return null;
    if (!label && !rule || !rule && !common && !background && /password|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|birth|social security|consent|agree|certify|signature|salary|compensation|gpa|completed|previous|\breference|emergency|guardian|parent|\breferr|manager|supervisor/.test(label)) return null;
    if (field.digitsPhone && !field.disabled) {
      const phone = String(profile.values?.phone || "");
      if (/^[+()\d .-]+$/.test(phone)) {
        const digits = phone.replace(/\D/g, "");
        if (!field.filled || field.phoneBefore !== digits && field.phoneBefore?.replace(/\D/g, "") === digits) return { value: digits, display: digits, reason: "Phone format required by this form", sourceQuestion: "Profile phone" };
      }
    }
    if (rule?.sourceQuestion === "Recruiter profile visibility" && field.currentRecruiterScope && field.type === "radio-group" && !field.disabled) {
      const target = field.options.filter((o) => !o.disabled && normalize(o.label) === normalize(rule.value));
      if (target.length === 1) return { ...rule, value: target[0].value, display: target[0].label };
    }
    if (field.emailSave && field.emailValue && field.emailValue.toLowerCase() === profile.values?.email?.toLowerCase() && !field.disabled) return { value: profile.values.email, display: profile.values.email, reason: "Save the matching email in this field" };
    if (!["text", "email", "tel", "url", "textarea", "select-one", "combobox", "radio-group", "checkbox-group", "number", "date", "month"].includes(field.type) || field.filled && !(field.languageRow === "english" && field.currentLevel === "basic" && rule?.value === "Fluent") || field.disabled) return null;
    const patterns = { firstName: /^(legal )?(first|given) name$/, lastName: /^(legal )?(last name|family name|surname)$/, fullName: /^(legal |full |legal full )?name$/, email: /^(personal |primary |contact )?e ?mail( address)?$/, phone: /^(primary |contact |mobile |cell )?(phone|telephone)( number)?$/, city: /^(current |home )?city$/, state: /^(current |home )?(state|province|state province)$/, postalCode: /^(zip|postal|zip postal)( code)?$/, country: /^(current |home )?country( of residence)?$/, school: /^(current )?(university|school|college|school university|school or university|university college)( name)?$/, major: /^(major|field of study|academic major)$/, graduationYear: /^(expected |anticipated )graduation year$/, portfolio: /^(portfolio|personal website|portfolio website)( url| link)?$/, linkedin: /^linkedin( profile| account)?( url| link)?$/, github: /^github( profile)?( url| link)?$/ };
    const fieldAliases = {
      "email address username": "email",
      "username email address": "email",
      "state location": "state",
      "location city": "city",
      "city of residence": "city",
      "town or city": "city",
      "discipline": "major",
      "academic discipline": "major",
      "primary field of study": "major",
      "school affiliation": "school",
      "university affiliation": "school",
      "college or university name": "school",
      "educational institution": "school",
      "school name": "school",
      "school or university name": "school",
      "university or college": "school",
      "major subject": "major",
      "other website": "portfolio",
      "personal portfolio url": "portfolio",
      "website": "portfolio"
    };
    const directLabel = label.replace(/^(?:please (?:enter|provide|indicate) (?:us )?(?:your )?|what is your |what s your )/, "");
    if ((label === "country" || /^(?:(?:phone(?: number)? )?country code|country phone code|phone country|country calling code|dial code)$/.test(label)) && (field.phoneCountry || /phone|dial|calling/i.test(field.id + " " + field.name + " " + label))) {
      const num = String(profile.values.phone || "").replace(/\D/g, "");
      const us = /^(united states(?: of america)?|usa|us)$/.test(normalize(profile.values.country || background?.value));
      if (field.filled || field.disabled || !us || !/^1?\d{10}$/.test(num)) return null;
      const aliases3 = ["united states 1", "united states of america 1", "united states", "us 1", "1 united states", "1 united states of america", "united states us 1"];
      if (field.type === "combobox") return { value: "United States +1", display: "United States +1", aliases: aliases3 };
      const matches = (field.options || []).filter((o) => !o.disabled && aliases3.includes(normalize(o.label)));
      return matches.length === 1 ? { value: matches[0].value, display: matches[0].label } : null;
    }
    const key2 = fieldAliases[directLabel] || Object.keys(patterns).find((k) => patterns[k].test(directLabel));
    const custom = (profile.answers || []).filter((a) => normalize(a.question) === label || common && commonQuestion(a.question)?.question === common.question);
    const remembered = !key2 ? memoryMatch(field.label, memory, origin, context) : null;
    const value = rule?.value || (key2 === "fullName" ? [profile.values.firstName, profile.values.lastName].filter(Boolean).join(" ") : key2 ? profile.values[key2] || background?.value : common?.question === "How did you hear about this position?" && remembered ? remembered.value : custom.length && new Set(custom.map((a) => a.answer.trim())).size === 1 ? custom[0].answer : background?.value || remembered?.value);
    if (!value) {
      const derived = portfolioAnswer(field, portfolio);
      if (!derived) return null;
      if (["select-one", "combobox", "radio-group"].includes(field.type)) {
        if (derived.value !== "Yes") return null;
        if (field.type === "combobox") return { ...derived, aliases: ["yes"] };
        const matches = (field.options || []).filter((o) => !o.disabled && normalize(o.label) === "yes");
        return matches.length === 1 ? { ...derived, value: matches[0].value, display: matches[0].label } : null;
      }
      return ["text", "textarea"].includes(field.type) ? derived : null;
    }
    if (field.maxLength > 0 && value?.length > field.maxLength) return null;
    if (field.type === "checkbox-group") {
      if (rule?.markIncomplete) return { value: "Not Completed", display: "Not Completed", selectedLabels: [field.options[0].label], reason: rule.reason, sourceQuestion: rule.sourceQuestion };
      if (rule?.raceSelection) {
        const asian = field.options.filter((o) => !o.disabled && /^asian(?: united states(?: of america)?)?$/.test(normalize(o.label)));
        if (asian.length === 1) return { value: [asian[0].value], display: asian[0].label, selectedLabels: [asian[0].label], sourceQuestion: rule.sourceQuestion };
      }
      if (common?.question !== "Preferred work regions") return null;
      const desired = value.split(";").map(normalize), matches = (field.options || []).filter((o) => !o.disabled && desired.includes(normalize(o.label)));
      if (matches.length !== desired.length || new Set(matches.map((o) => normalize(o.label))).size !== desired.length) return null;
      return { value: matches.map((o) => o.value), display: matches.map((o) => o.label).join("; "), selectedLabels: matches.map((o) => o.label), reason: "Your saved work-region preferences", requiresReview: false };
    }
    const confirmedMale = common?.question === "Sex" && normalize(value) === "male" && custom.length > 0 && new Set(custom.map((a) => normalize(a.answer))).size === 1;
    const review = rule ? { reason: rule.reason, sourceQuestion: rule.sourceQuestion, requiresReview: rule.requiresReview } : { reason: confirmedMale ? "Your confirmed profile answer" : background ? "Based on your confirmed background" : common?.review ? "Confirm this answer for this application" : remembered?.reason, sourceQuestion: background ? background.sourceQuestion : common?.review ? common.question : remembered?.question, requiresReview: !confirmedMale && (!!common?.review || !!background || !!remembered?.requiresReview) };
    if (field.type === "select-one" || field.type === "combobox" || field.type === "radio-group") {
      const aliases3 = rule?.aliases || (key2 === "state" && normalize(value) === "new jersey" ? ["new jersey", "nj"] : (key2 === "country" || background?.value === "United States") && ["us", "usa", "united states", "united states of america"].includes(normalize(value)) ? ["united states", "united states of america", "us", "usa"] : common?.question === "Highest completed degree" && normalize(value) === "high school diploma" ? ["high school diploma", "high school diploma or equivalent", "high school diploma ged", "high school or equivalent"] : [normalize(value)]);
      if (common?.question === "Street address" && profile.values.city && profile.values.state && profile.values.postalCode) {
        const state = normalize(profile.values.state), states = state === "new jersey" ? ["nj", state] : [state];
        for (const region of states) aliases3.push(normalize([value, profile.values.city, region, profile.values.postalCode].join(" ")));
      }
      const sourceTree = common?.question === "How did you hear about this position?" && normalize(value) === "company website";
      const sourceFallbacks = sourceTree && profile.answers?.some((a) => a.question === "Application source fallbacks" && a.answer === "LinkedIn or Indeed, then a career fair");
      if (sourceFallbacks) {
        const fallback = ["linkedin", "linked in", "indeed", "indeed com", "job board", "job boards", "job board job search site", "career fair", "job fair", "recruiting event", "career fair recruiting event"];
        const university = aliases3.findIndex((a) => a.startsWith("university"));
        aliases3.splice(university < 0 ? aliases3.length : university, 0, ...fallback);
        for (const option of field.options || []) {
          const name = normalize(option.label);
          if (/\bcareers? (?:web ?site|page|site)$/.test(name)) aliases3.unshift(name);
        }
      }
      if (rule?.confirmUSPersons && field.type === "select-one") {
        const choices = field.options.filter((o) => !o.disabled && o.value && !/^(?:please )?(?:select|choose)\b/.test(normalize(o.label)));
        if (choices.length === 1) return { value: choices[0].value, display: choices[0].label, ...review };
      }
      if (rule?.careerSiteDetail && field.type === "select-one") {
        const candidates = field.options.filter((o) => !o.disabled && o.value && /\b(?:careers? (?:web)?site|careers? page|company website)$/.test(normalize(o.label)));
        if (candidates.length === 1) return { value: candidates[0].value, display: candidates[0].label, ...review };
      }
      if (field.type === "combobox") return { value, display: sourceFallbacks ? "Company career site, then LinkedIn or Indeed, then career fair" : value, aliases: aliases3, ...rule?.confirmUSPersons ? { confirmUSPersons: true } : {}, ...rule?.careerSiteDetail ? { careerSiteDetail: true } : {}, ...sourceTree ? { sourceTree: true, sourceFallbacks } : {}, ...review };
      const matches = (field.options || []).filter((o) => !o.disabled && (aliases3.includes(normalize(o.label)) || field.type !== "radio-group" && aliases3.includes(normalize(o.value))));
      if (rule?.aliases && matches.length > 1) {
        matches.sort((a, b) => aliases3.indexOf(normalize(a.label)) - aliases3.indexOf(normalize(b.label)));
        if (normalize(matches[0].label) !== normalize(matches[1].label)) matches.splice(1);
      }
      if (matches.length !== 1) return null;
      return { value: matches[0].value, display: matches[0].label, ...review };
    }
    return { value, display: value, ...review };
  }
  function formBridge2({ action = "scan", url, fields = [], origins = [] } = {}) {
    if (action === "scan-chat" && !origins.includes(location.origin)) return null;
    if (action === "scan-frame") {
      if (!origins.some((src) => {
        try {
          const u = new URL(src);
          return u.protocol === "https:" && u.origin === location.origin && (u.pathname === location.pathname || window.frameElement?.src === src);
        } catch {
          return false;
        }
      })) return null;
      action = "scan";
    }
    const text = (e) => (e?.innerText || e?.textContent || "").trim();
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const visible = (e) => !!e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
    const comboSelector = '[role="combobox"],input[aria-controls][aria-expanded],[role="searchbox"][aria-controls],[aria-haspopup="listbox"],[role="button"][aria-haspopup="true"],button[aria-haspopup="true"],button[aria-haspopup="menu"],button[data-automation-id][aria-expanded],button[aria-controls][aria-expanded],input[data-automation-id="searchBox"],button[data-automation-id="selectWidget"],button[name][aria-required],button[data-automation-id="countryRegion"],button[data-automation-id="degree"],input[aria-autocomplete="list"],.iti__selected-country,.iti__selected-flag,.selected-flag,.dropdown-toggle,.ng-select,.select2-selection,mat-select,.selectize-input,.ui-select-container,.ts-control';
    const controls = '[contenteditable][data-placeholder],[contenteditable][aria-label],[contenteditable="true"][role="textbox"],[contenteditable="plaintext-only"],input,select,textarea,' + comboSelector + ',[role="radio"]';
    const activate = (e, option = false) => {
      if (option) e.scrollIntoView?.({ block: "nearest" });
      const Mouse = typeof MouseEvent === "undefined" ? Event : MouseEvent;
      if (typeof PointerEvent !== "undefined") e.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse", button: 0 }));
      const down = new Mouse("mousedown", { bubbles: true, cancelable: true, button: 0 });
      e.dispatchEvent(down);
      e.dispatchEvent(new Mouse("mouseup", { bubbles: true, cancelable: true, button: 0 }));
      if (typeof PointerEvent !== "undefined") e.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "mouse", button: 0 }));
      if (option) {
        if (e.isConnected && visible(e)) {
          if (e.closest("a,button,input[type=submit]")) e.addEventListener("click", (event) => event.preventDefault(), { once: true, capture: true });
          e.click();
        }
        return;
      }
      if (!down.defaultPrevented && e.isConnected && visible(e)) {
        e.addEventListener("click", (event) => event.preventDefault(), { once: true, capture: true });
        e.click();
      }
    };
    const custom = (e) => e.tagName !== "SELECT" && e.matches(comboSelector);
    const radio = (e) => e.type === "radio" || e.getAttribute("role") === "radio";
    const checkbox = (e) => e.type === "checkbox";
    const choice = (e) => radio(e) || checkbox(e);
    const isReply = (e) => e.matches('textarea,input:not([type]),input[type="text"],[contenteditable]') && /^(?:write|type|enter|send) (?:a |your )?(?:reply|message)(?: here)?[. …]*$/i.test((e.placeholder || e.getAttribute("data-placeholder") || e.getAttribute("aria-placeholder") || e.getAttribute("aria-label") || "").trim());
    const chatQuestion = (e) => {
      const messages = '.ol-text-message,[data-message-id],[data-author],[data-sender],[role="log"] > *,[class*="message-bubble"],[class*="message__text"],[class*="message-text"],[class*="chat-message"],[class*="message-content"]';
      for (let p = e.parentElement; p; p = p.parentElement) {
        if ([...p.querySelectorAll(controls)].filter((c) => isReply(c) && visible(c)).length !== 1) break;
        const rows = [...p.querySelectorAll(messages)].filter((m) => visible(m) && text(m) && !m.contains(e) && !m.matches("input,textarea") && !(m.compareDocumentPosition(e) & 2));
        const row = rows.at(-1);
        if (row) {
          if (row.closest('[data-author="user"],[data-sender="user"],[data-author="candidate"],[class*="outgoing"],[class*="user-message"]')) return "";
          return text(row).slice(-800);
        }
        if (/(?:olivia by paradox|job assistant|recruiting assistant)/i.test(text(p)) && (!p.matches("body,html") || /(^|\.)paradox\.ai$/.test(location.hostname))) {
          const leaves = [...p.querySelectorAll("p,div,span")].filter((n) => !n.children.length && visible(n) && n.compareDocumentPosition(e) & 4 && text(n).length > 5 && !n.closest("button,label,footer"));
          const last = leaves.at(-1);
          if (last && /\?\s*$/.test(text(last))) return text(last).slice(-800);
        }
      }
      return "";
    };
    const type = (e) => isReply(e) ? "chat-reply" : radio(e) ? "radio-group" : checkbox(e) ? "checkbox-group" : custom(e) ? "combobox" : e.type || e.tagName.toLowerCase();
    const labelled = (e) => (e?.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).map((id) => text(e.getRootNode?.().getElementById?.(id) || document.getElementById(id))).join(" ");
    const radioSelector = 'input[type="radio"],[role="radio"]';
    const choiceVisible = (e) => visible(e) || [...e.labels || [], e.closest("label")].some((l) => l && visible(l)) || radio(e) && e.parentElement?.querySelectorAll(radioSelector).length === 1 && visible(e.parentElement) && !!e.parentElement.querySelector('svg,[role="img"]');
    const group = (e) => {
      const explicit = e.closest('[role="radiogroup"],fieldset') || e.closest('[role="group"]');
      if (explicit) return explicit;
      if (radio(e)) {
        if (e.name) return null;
        for (let p2 = e.parentElement; p2 && p2 !== document.body; p2 = p2.parentElement) {
          const rows = [...p2.querySelectorAll(radioSelector)];
          if (rows.length === 1 && !p2.querySelector("select,textarea,input:not([type=radio]):not([type=hidden])") && [...p2.querySelectorAll("label,p,legend,span,div")].some((node) => !node.querySelector(controls) && /^i understand that i may be considered for other open positions in my country\b/.test(norm(text(node))))) return p2;
          if (rows.length < 2) continue;
          if (rows.some((r) => r.name || r.closest('[role="radiogroup"],fieldset')) || p2.querySelector('textarea,select,input:not([type="radio"]):not([type="hidden"])')) return null;
          return p2;
        }
        return null;
      }
      let p = e.parentElement;
      for (let i = 0; i < 6 && p && p !== document.body; i++, p = p.parentElement) {
        if (p.querySelectorAll('input:not([type="checkbox"]),select,textarea').length) break;
        if (p.querySelectorAll('input[type="checkbox"]').length > 1 && p.querySelector("p,legend,label:not([for]),[aria-labelledby],.question-label,.form-label,.control-label")) return p;
      }
      return null;
    };
    const radios = (e) => {
      if (checkbox(e) && norm(ownLabel(e)) === "not completed") return [e];
      const g = group(e), selector = checkbox(e) ? 'input[type="checkbox"]' : 'input[type="radio"],[role="radio"]';
      return [...(g || e.form || e.getRootNode?.() || document).querySelectorAll(selector)].filter((r) => g ? group(r) === g && (checkbox(e) || g.getAttribute("role") === "radiogroup" || !e.name || r.name === e.name) : !!e.name && r.name === e.name && r.form === e.form);
    };
    const original = (e) => e.matches(".selectize-input,.ts-control") ? e.closest(".selectize-control,.ts-wrapper")?.previousElementSibling : null;
    const labelText = (e) => {
      if (!e) return "";
      const copy = e.cloneNode(true);
      for (const control of copy.querySelectorAll(controls + ',button,[role="listbox"],.selectize-control,.ui-select-match,.select2-container,.ts-wrapper')) control.remove();
      return text(copy);
    };
    const useful = (s) => /^(select|please select|choose|open menu|clear|select an option|select one)[. …]*$/i.test((s || "").trim()) ? "" : s;
    const ownLabel = (e) => (useful(e.getAttribute("aria-label")) || useful(labelled(e)) || [...e.labels || [], ...[...document.querySelectorAll("label[for]")].filter((l) => e.id && l.getAttribute("for") === e.id)].map(labelText).filter((v, i, a) => a.indexOf(v) === i).join(" ") || labelText(e.closest("label")) || "").trim();
    const nearbyLabel = (e) => {
      let parent = e.parentElement;
      const members = choice(e) ? radios(e) : [];
      for (let n = 0; n < 8 && parent && parent !== document.body; n++, parent = parent.parentElement) {
        const contained = [...parent.querySelectorAll(controls)].filter((c) => !c.parentElement?.closest(comboSelector) && type(c) !== "hidden" && (c === e || visible(c)));
        if (choice(e)) {
          if (contained.some((c) => !choice(c) || !members.includes(c))) break;
          if (!members.length || !members.every((r) => parent.contains(r))) continue;
        } else if (contained.filter((c) => !radio(c)).length !== 1) break;
        const candidates = [...parent.querySelectorAll("legend,[data-question],.question-label,.control-label,.form-label,h3,h4,p,label,strong")].filter((h) => !h.closest('[role="listbox"],[role="option"]') && !h.querySelector(controls) && !members.some((r) => r.closest("label")?.contains(h) || [...r.labels || []].some((l) => l.contains(h))));
        if (!choice(e)) candidates.sort((a, b) => Number(!a.matches("label,strong,.question-label,.control-label,.form-label")) - Number(!b.matches("label,strong,.question-label,.control-label,.form-label")));
        if (choice(e)) {
          const prompts = [...parent.querySelectorAll("div,span,legend,p,label,h2,h3,h4")].filter((h) => !h.querySelector(controls) && !h.closest('[role="radio"]') && /\?\s*\*?$/.test(text(h)) && text(h).length <= 800);
          candidates.unshift(...prompts.filter((h) => !prompts.some((other) => other !== h && h.contains(other))));
        }
        for (const heading of candidates) {
          const value = labelText(heading);
          if (value && !/^(yes|no|male|female)$/i.test(value) && value.length <= 800) return value;
        }
      }
      return "";
    };
    const groupPrompt = (g) => {
      if (!g) return "";
      for (let node = g; node && node !== document.body; node = node.parentElement) {
        for (let previous = node.previousElementSibling; previous; previous = previous.previousElementSibling) {
          if (previous.matches(controls) || previous.querySelector(controls)) return "";
          const prompt = text(previous).trim();
          if (!prompt) continue;
          if (prompt.length <= 800 && (/\?\s*\*?$/.test(prompt) || /^(?:select the races|please check one of the boxes|i understand that i may be considered for other open positions|ethnicity\s*\*?$|title$)/i.test(prompt))) return prompt;
          if (prompt.length > 50 || previous.matches("h1,h2,h3")) return "";
        }
      }
      return "";
    };
    const label = (e) => {
      if (/^education-.+--(?:first|last)YearAttended-dateSectionYear-input$/i.test(e.id)) return /--firstYear/i.test(e.id) ? "From" : "To (Actual or Expected)";
      if (isReply(e)) return chatQuestion(e);
      if (e.matches(".select2-selection")) {
        const native = e.closest(".select2-container")?.previousElementSibling;
        const caption = native?.labels?.[0] || document.getElementById((e.getAttribute("aria-labelledby") || "").split(" ")[0]);
        if (caption) {
          const copy = caption.cloneNode(true);
          for (const child of copy.querySelectorAll(".screenReaderVisibility,.sr-only,[aria-live],.select2-container")) child.remove();
          const clean = text(copy).replace(/\s*(?:select an? option|please select)\s*$/i, "").trim();
          if (clean) return clean;
        }
      }
      if (e.matches("input[type=url],input[type=text]") && /^(?:url|website url|website|link)$/.test(norm(ownLabel(e))) && sectionFor("websites")?.contains(e)) return "Portfolio URL";
      const wrapper = e.closest('[data-automation-id^="formField-"]');
      const fieldLabel = wrapper?.querySelector('[data-automation-id="formLabel"],legend') || wrapper?.querySelector("label");
      if (fieldLabel && (!choice(e) || !fieldLabel.contains(e))) {
        const value = labelText(fieldLabel);
        if (value && !/^(yes|no)$/i.test(value)) return value;
      }
      if (e.matches(".iti__selected-country,.iti__selected-flag,.selected-flag")) return "Country";
      if (checkbox(e) && norm(ownLabel(e)) === "not completed") return ownLabel(e);
      if (!ownLabel(e) && e.getAttribute("aria-describedby")) {
        const description = e.getAttribute("aria-describedby").split(/\s+/).map((id) => text(document.getElementById(id))).join(" ").trim();
        const adjacent = e.nextSibling?.nodeType === 3 ? e.nextSibling.textContent.trim() : "";
        if (checkbox(e) && adjacent && adjacent.length < 100) return adjacent;
        if (description && description.length <= 800 && (checkbox(e) || e.tagName === "SELECT")) return description;
      }
      if (choice(e)) {
        const g = group(e), single = g && [...g.querySelectorAll('input[type="radio"],[role="radio"],input[type="checkbox"]')].every((r) => radios(e).includes(r));
        return (single && (g.getAttribute("aria-label") || labelled(g) || text(g.querySelector("legend"))) || groupPrompt(g) || nearbyLabel(e)).trim().slice(0, 800);
      }
      return (ownLabel(e) || (custom(e) && e.querySelector("input") ? ownLabel(e.querySelector("input")) : "") || (original(e) ? ownLabel(original(e)) : "") || nearbyLabel(e) || e.placeholder || (e.type === "email" || e.autocomplete === "email" ? "Email" : "")).trim().slice(0, 800);
    };
    let shadowEditors = null;
    const elements = () => {
      const list = [...document.querySelectorAll(controls)];
      const shadowReplies = (root) => {
        for (const host of root.querySelectorAll("*")) if (host.shadowRoot) {
          shadowEditors.push(...host.shadowRoot.querySelectorAll(controls));
          shadowReplies(host.shadowRoot);
        }
      };
      if (!shadowEditors) {
        shadowEditors = [];
        shadowReplies(document);
      }
      list.push(...shadowEditors);
      return list.filter((e) => !e.matches('select.select2-hidden-accessible[aria-hidden="true"]')).filter((e) => !e.parentElement?.closest(comboSelector)).filter((e) => !choice(e) || radios(e)[0] === e);
    };
    const selectedValue = (e) => {
      if (e.matches('[data-automation-id="searchBox"]')) {
        const holder = e.closest('[data-automation-id^="formField"],[data-automation-id="multiSelectContainer"]') || e.parentElement;
        return text(holder?.querySelector('[data-automation-id="selectedItem"],[data-automation-id="selectedItemLabel"]'));
      }
      if (e.matches(".iti__selected-country,.iti__selected-flag,.selected-flag")) {
        const selected = e.title || e.getAttribute("aria-label")?.replace(/^selected country\s*:?\s*/i, "") || "";
        return /\+\d/.test(selected) ? selected : "";
      }
      if (e.matches(".selectize-input,.ts-control,.ui-select-container")) {
        const items = [...e.querySelectorAll(".item,[data-item],.ui-select-match-item,.ui-select-match-text")].filter((n) => !n.parentElement?.closest(".item,[data-item],.ui-select-match-item"));
        return items.map((n) => {
          const c = n.cloneNode(true);
          for (const x of c.querySelectorAll('.remove,.ui-select-match-close,button,[aria-label="Remove"]')) x.remove();
          return text(c).replace(/^[×✕]\s*/, "");
        }).filter(Boolean).join("; ");
      }
      let parent = e;
      for (let n = 0; n < 4 && parent; n++, parent = parent.parentElement) {
        if (parent !== e && parent.querySelectorAll(comboSelector).length > 1) break;
        const selected = parent.querySelector('[class*="singleValue"],[class*="__single-value"],[data-selected-value],.ng-value-label,.select2-selection__rendered,.mat-select-value-text,.ui-select-match-text');
        if (selected) {
          if (text(selected) === "+1" && selected.querySelector('.iti__us,[data-country-code="us"]')) return "United States +1";
          return text(selected);
        }
      }
      return (e.value || text(e)).trim();
    };
    const selectedRadio = (e) => radios(e).find((r) => r.checked || r.getAttribute("aria-checked") === "true");
    const originalOptionLabel = (e) => {
      const associated = [...e.labels || []];
      const root = associated[0] || e.closest("label");
      if (root) {
        const copy = root.cloneNode(true);
        const described = (e.getAttribute("aria-describedby") || "").split(/\s+/);
        for (const n of copy.querySelectorAll('input,[role="radio"],p,small,.description,.help-block,[id]')) if (n.matches('input,[role="radio"],p,small,.description,.help-block') || described.includes(n.id)) n.remove();
        const value = text(copy).split("\n").map((s) => s.trim()).find(Boolean);
        if (value) return value;
      }
      return ownLabel(e) || text(e) || e.value || "";
    };
    const optionLabel = (e) => {
      const raw = originalOptionLabel(e);
      for (const v of [raw, e.getAttribute("aria-label"), labelled(e), e.parentElement?.getAttribute("aria-label")]) {
        const yn = String(v || "").trim().match(/^(yes|no)(?:\s*[,.-]?\s*(?:option\s+)?\d+\s+of\s+\d+)?[.\s]*$/i);
        if (yn) return yn[1];
      }
      return raw;
    };
    const placeholder = (value) => !value || /^(select|choose|please select|select an? option|select one|select an? answer|please choose)([ .…]*)$/i.test(value.trim());
    const empty = (e) => /^education-.+--(?:first|last)YearAttended-dateSectionYear-input$/i.test(e.id) && /^(?:0+|yyyy)$/i.test(e.value) ? true : isReply(e) ? !(e.value || e.textContent || "").trim() : choice(e) ? !selectedRadio(e) : custom(e) ? placeholder(selectedValue(e)) : !e.value || e.tagName === "SELECT" && e.selectedIndex === 0 && /select|choose|please|^\s*\[.+\]\s*$/i.test(text(e.options[0]));
    const disabled = (e) => e.disabled || e.readOnly && !custom(e) || e.getAttribute("aria-disabled") === "true";
    const valueText = (e) => choice(e) ? optionLabel(selectedRadio(e) || e) : e.tagName === "SELECT" ? text(e.options[e.selectedIndex]) : custom(e) ? selectedValue(e).replace(/^[×✕✖]\s*|\s*[×✕✖]$/g, "").trim() : e.value || "";
    const citizenList = (e) => {
      const stopSelector = controls + ",h1,h2,h3,h4";
      for (let node = e, level = 0; node && node !== document.body && level < 14; node = node.parentElement, level++) {
        for (let sibling = node.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
          const selector = stopSelector + ',ul,ol,[role="list"]';
          const candidates = [sibling, ...sibling.querySelectorAll(selector)].reverse();
          for (const candidate of candidates) {
            if (candidate.matches('ul,ol,[role="list"]')) {
              return [...candidate.querySelectorAll('li,[role="listitem"]')].some((item) => /^(?:u s|us|united states) citizens?$/.test(norm(text(item))));
            }
            if (candidate.matches(stopSelector) && visible(candidate) && candidate.type !== "hidden" && !candidate.closest('ul,ol,[role="list"]')) return false;
          }
        }
      }
      return false;
    };
    const context = (e) => {
      const wording = norm(label(e));
      if (radio(e)) {
        const selected = selectedRadio(e);
        if (selected && /^any company recruiter (?:worldwide|in my country region of residence)$/.test(norm(optionLabel(selected)))) return { currentRecruiterScope: optionLabel(selected) };
      }
      if (/^(?:primary |mobile |cell |contact )?(?:phone|telephone)(?: number)?$/.test(wording) && e.matches("input")) {
        const help = (e.getAttribute("aria-describedby") || "").split(/\s+/).map((id) => text(document.getElementById(id))).join(" ") + " " + text(e.parentElement);
        if (/only digits and special characters|digits only|only (?:numbers|digits)|numbers only/i.test(help) || e.validity?.patternMismatch) return { digitsPhone: true, phoneBefore: e.value };
      }
      if (/^(reading|speaking|writing|understanding|listening)$/.test(wording)) {
        for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
          const langs = [...p.querySelectorAll(controls)].filter((c) => /^(language|language name)$/.test(norm(label(c))) && visible(c));
          if (langs.length) return { languageRow: langs.length === 1 ? norm(valueText(langs[0])) : "", currentLevel: norm(valueText(e)) };
        }
      }
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        if (p === e.form) break;
        const rowLabels = /^(?:company(?: name)?|employer(?: name)?|(?:job|position) title|role description|job description|location|from|to|start date|end date|i currently work here)$/.test(wording) ? [...p.querySelectorAll("input:not([type=hidden]),select,textarea,[role=combobox]")].map((c) => norm(ownLabel(c))) : [];
        const hasSchool = rowLabels.some((s) => /^(?:school|school or university|university)(?: name)?$/.test(s));
        if (hasSchool) break;
        if (rowLabels.some((s) => /^(?:job title|position title)$/.test(s)) && rowLabels.some((s) => /^(?:company|company name|employer|employer name)$/.test(s))) return { employmentEntry: true };
        const headings = [...p.querySelectorAll('h1,h2,h3,h4,h5,h6,legend,[role="heading"]')];
        if (!headings.length) continue;
        if (headings.some((h) => /^(employment history|work experience)( \d+)?$/.test(norm(text(h)))) && headings.every((h) => /^(employment history|work experience)( \d+)?$/.test(norm(text(h))))) return { employmentEntry: true };
        break;
      }
      if (/(?:confirm|verify|repeat|re ?type|re ?enter).*e ?mail|e ?mail.*confirmation/.test(wording)) {
        const scope = e.form || e.closest('[role="dialog"]') || document;
        const originals = [...scope.querySelectorAll("input")].filter((c) => c !== e && visible(c) && /^(?:primary |personal |contact )?e ?mail(?: address)?$/.test(norm(label(c))));
        return { primaryEmail: originals.length === 1 ? originals[0].value || "" : originals.length > 1 ? "ambiguous" : "" };
      }
      if (/^(?:(?:phone(?: number)? )?country code|country)$/.test(wording.replace(/ required$/, "")) || e.matches(".iti__selected-country,.iti__selected-flag,.selected-flag")) {
        let box = e.parentElement;
        for (let depth = 0; box && box !== document.body && depth < 13; depth++, box = box.parentElement) {
          if (box.matches(".iti,.react-tel-input,.intl-tel-input,.phone-input__country,.phone-input") || box.querySelector('input[type="tel"],input[autocomplete="tel"],input[id="phone"]') && [...box.querySelectorAll("input")].filter((i) => visible(i) && i.type !== "hidden" && i.getAttribute("aria-hidden") !== "true").length <= 2) return { phoneCountry: true };
        }
      }
      if (wording === "please indicate if you belong to one of the categories above") return { includesCitizenCategory: citizenList(e) };
      if (/date granted$|^if\b|\bif (?:you (?:selected|answered) )?no\b|^(?:source )?details?$|^military (branch|status)$|^please review the question again/.test(wording) && !/^if .+ please specify$/.test(wording)) {
        const all2 = elements(), prior = all2.slice(0, all2.indexOf(e)).filter((c) => visible(c) && label(c) && !["hidden", "button", "submit", "file"].includes(type(c)));
        let last = prior.at(-1);
        if (wording === "military status" && last && norm(label(last)) === "military branch") last = prior.at(-2);
        return { parentQuestion: last ? label(last) : "", parentAnswer: last && !empty(last) ? valueText(last) : "", parentIncludesCitizenCategory: !!last && /belong to one of the categories above/.test(norm(label(last))) && citizenList(last) };
      }
      let degreePair = false, rowDegree = "";
      if (["degree", "degree type", "not completed"].includes(wording)) {
        for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
          const items = [...p.querySelectorAll(controls)];
          const degrees = items.filter((c) => !choice(c) && /^(degree|degree type)$/.test(norm(label(c))));
          const boxes = items.filter((c) => checkbox(c) && norm(ownLabel(c)) === "not completed");
          if (degrees.length > 1 || boxes.length > 1) break;
          if (degrees.length === 1 && boxes.length === 1) {
            degreePair = true;
            rowDegree = empty(degrees[0]) ? "" : valueText(degrees[0]);
            break;
          }
        }
      }
      if (/\bvisa assistance\b/.test(wording)) {
        const all2 = elements(), recent = all2.slice(Math.max(0, all2.indexOf(e) - 3), all2.indexOf(e)).map((c) => norm(label(c)));
        if (recent.some((s) => /right to work in (?:the )?(?:us|u s|united states)$/.test(s)) && !recent.some((s) => /work in /.test(s) && !/work in (?:the )?(?:us|u s|united states)$/.test(s))) return { workQuestionCountry: "United States" };
      }
      const q = norm(label(e));
      let entrySchool = "", inSchoolRow = false;
      if (/^(?:degree|major|field of study|location|(?:school |campus )?location|is current study|currently studying|currently attending|start date|end date|from|to actual or expected)$/.test(q)) {
        for (let row = e.parentElement; row && row !== document.body && row !== e.form; row = row.parentElement) {
          const inputs = [...row.querySelectorAll("input:not([type=hidden]),textarea,select,[role=combobox]")].filter((c) => visible(c));
          const schools = inputs.filter((c) => /^(?:school|university|school or university)(?: name)?$/.test(norm(ownLabel(c))));
          if (schools.length > 1 || inputs.some((c) => /^(?:job title|position title|employer name)$/.test(norm(ownLabel(c))))) break;
          if (schools.length === 1 && inputs.some((c) => /^(?:degree|major|field of study)$/.test(norm(ownLabel(c))))) {
            inSchoolRow = true;
            entrySchool = valueText(schools[0]);
            break;
          }
        }
      }
      if (inSchoolRow && !["degree", "degree type"].includes(q)) return { educationEntry: true, educationSchool: entrySchool };
      if (!/not completed|degree|gpa|grade point|overall result|field of study|^from$|^to actual or expected$|^start date$|^end date actual or expected$|^source detail|please specify|academic standing details/.test(q)) return { parentAnswer: "", parentQuestion: "", educationSchool: "" };
      const all = elements(), before = all.slice(0, all.indexOf(e));
      let parentAnswer = "", parentQuestion = "", educationSchool = "";
      if (/^source details?$|^if .+ please specify$/.test(q)) {
        const parents = before.filter((c) => /^how (did|do) you (hear|learn|find out) about/.test(norm(label(c))));
        const last = parents.at(-1);
        if (last && !empty(last)) parentAnswer = valueText(last);
      }
      if (/^(please specify|other please specify|academic standing details)$/.test(q)) {
        const last = before.at(-1);
        if (last && !empty(last) && /current academic standing/.test(norm(label(last)))) {
          parentAnswer = valueText(last);
          parentQuestion = label(last);
        }
      }
      if (/not completed|degree|gpa|grade point|overall result|field of study|^from$|^to actual or expected$|^start date$|^end date actual or expected$/.test(q)) {
        let container = e.parentElement;
        for (let n = 0; n < 7 && container && container !== document.body; n++, container = container.parentElement) {
          const schools = all.filter((c) => container.contains(c) && /^(school or university|school university|school|university|college)( name)?$/.test(norm(label(c))));
          if (schools.length > 1) break;
          if (schools.length === 1) {
            educationSchool = valueText(schools[0]) || schools[0].value || "";
            break;
          }
        }
      }
      let highestEducation = false;
      if (q === "degree" || q === "degree type") {
        let section = e.parentElement;
        for (let depth = 0; section && section !== document.body && depth < 9; depth++, section = section.parentElement) {
          if ([...section.querySelectorAll("p,small,div,span")].some((n) => n.childElementCount < 2 && /^in the degree field provide (?:your |the )?highest level of education[.\s]*$/i.test(text(n)))) {
            highestEducation = true;
            break;
          }
        }
      }
      return { parentAnswer, parentQuestion, educationSchool: entrySchool || educationSchool, educationEntry: inSchoolRow, highestEducation, degreePair, rowDegree };
    };
    const emailSave = (e) => {
      if (!e.matches("input[type=email],input[type=text]") || !/^e ?mail(?: address)?$/.test(norm(label(e)))) return null;
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        if (p.querySelectorAll("input:not([type=hidden]),select,textarea").length !== 1) break;
        const actions = [...p.querySelectorAll("button,[role=button]")].filter((b) => visible(b) && !b.disabled && !(b.form && b.type === "submit"));
        const caption = (b) => norm(b.getAttribute("aria-label") || b.title || text(b));
        const saves = actions.filter((b) => /^(?:(?:save|confirm)(?: (?:email(?: address)?|changes|your changes))?|done editing(?: your)? email(?: address)?)$/.test(caption(b)));
        if (saves.length === 1 && actions.some((b) => /^(?:cancel|undo|revert)(?: |$)/.test(caption(b)))) return saves[0];
      }
      return null;
    };
    const attachedOptions = (e) => {
      if (!custom(e)) return void 0;
      const ids = (e.getAttribute("aria-controls") || e.getAttribute("aria-owns") || "").trim().split(/\s+/);
      const boxes = ids.map((id) => document.getElementById(id)).filter((box) => box?.matches("[role=listbox]"));
      if (boxes.length !== 1) return void 0;
      const options = [...boxes[0].querySelectorAll("[role=option]")];
      if (!options.length || options.length > 100 || options.some((o) => o.hasAttribute("aria-setsize") && Number(o.getAttribute("aria-setsize")) !== options.length)) return void 0;
      return options.map((o) => ({ value: text(o), label: text(o), disabled: o.getAttribute("aria-disabled") === "true" }));
    };
    const snapshot = (e, index) => ({ index, navigation: !!e.closest("nav,[role=navigation],[role=search]") || e.getAttribute("aria-haspopup") === "menu", label: label(e), type: type(e), name: e.name || "", id: e.id || "", maxLength: e.maxLength, yearOnly: /dateSectionYear-input$/i.test(e.id), filled: !empty(e), disabled: !!disabled(e), required: !!e.required || e.getAttribute("aria-required") === "true" || label(e).includes("*") || !!e.closest('[aria-required="true"]'), placeholder: e.placeholder || "", min: e.min || "", max: e.max || "", ...context(e), ...e.value && emailSave(e) ? { emailSave: true, emailValue: e.value } : {}, options: e.tagName === "SELECT" ? [...e.options].map((o) => ({ value: o.value, label: text(o), disabled: o.disabled })) : choice(e) ? radios(e).map((r, i) => ({ value: String(i), label: optionLabel(r), disabled: !!disabled(r) })) : attachedOptions(e) });
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const sectionFor = (name) => {
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,[role="heading"]')].filter((h) => visible(h) && norm(text(h)) === name);
      if (headings.length !== 1) return null;
      for (let p = headings[0].parentElement; p && p !== document.body; p = p.parentElement) {
        if (p.querySelector(name === "skills" ? "input:not([type=hidden])" : 'button,input:not([type=hidden]),select,[role="combobox"]')) {
          const other = [...p.querySelectorAll('h1,h2,h3,h4,h5,[role="heading"]')].some((h) => h !== headings[0] && !new RegExp("^" + name + "s? \\d+$", "i").test(text(h)) && !/^languages? \d+$/i.test(text(h)));
          return other ? null : p;
        }
      }
      return null;
    };
    const chipValues = (p) => [...p.querySelectorAll('[data-automation-id="selectedItem"],[data-automation-id="selectedItemLabel"],[data-item],.item[data-value],.select2-selection__choice,[class*="multiValueLabel"]')].flatMap((n) => {
      if (n.querySelector('[data-automation-id="selectedItemLabel"]')) return [];
      const copy = n.cloneNode(true);
      for (const child of copy.querySelectorAll("button,svg,[aria-hidden=true]")) child.remove();
      const value = (text(copy) || n.getAttribute("data-value") || "").replace(/^[×✕]\s*/, "").trim();
      return value ? [value] : [];
    });
    const skillInput = (p) => [...p.querySelectorAll("input:not([type=hidden]):not([type=checkbox])")].find((e) => visible(e) && !disabled(e) && (/skills/i.test(label(e) + " " + e.id) || e.getAttribute("data-automation-id") === "searchBox"));
    const languageInputs = (p) => elements().filter((e) => p.contains(e) && visible(e) && !disabled(e) && !choice(e) && /^(language|select language)$/.test(norm(label(e))));
    const languageAdd = (p) => [...p.querySelectorAll("button")].find((b) => visible(b) && !disabled(b) && (!b.form || b.type === "button") && /^(add|add another|add language)$/i.test(text(b)));
    const listFields = () => {
      const fields2 = [], skills = sectionFor("skills"), languages = sectionFor("languages");
      if (skills && skillInput(skills)) fields2.push({ type: "skill-list", label: "Skills", existing: chipValues(skills) });
      if (languages && (languageAdd(languages) || languageInputs(languages).length)) fields2.push({ type: "language-list", label: "Languages", existing: languageInputs(languages).filter((e) => !empty(e)).map(valueText) });
      return fields2;
    };
    async function fillLanguages(values) {
      for (const value of values) {
        const section = sectionFor("languages");
        if (!section || location.href !== url) return false;
        let inputs = languageInputs(section);
        if (inputs.some((e) => !empty(e) && norm(valueText(e)) === norm(value))) continue;
        if (!inputs.some(empty)) {
          const add = languageAdd(section);
          if (!add) return false;
          add.click();
          for (let i = 0; i < 20; i++) {
            await pause(75);
            const next = sectionFor("languages");
            inputs = next ? languageInputs(next) : [];
            if (inputs.some(empty)) break;
          }
        }
        const blanks = inputs.filter(empty);
        if (blanks.length !== 1) return false;
        const target = blanks[0], field = snapshot(target, elements().indexOf(target));
        let answer = { value, display: value, aliases: [norm(value)] };
        if (target.tagName === "SELECT") {
          const options = field.options.filter((o) => !o.disabled && norm(o.label) === norm(value));
          if (options.length !== 1) return false;
          answer = { value: options[0].value, display: options[0].label };
        }
        const result = await formBridge2({ action: "fill", url, fields: [{ ...field, ...answer }] });
        if (!result.filled) return false;
      }
      return true;
    }
    async function fillSkills(values, skillAliases = {}) {
      let complete = true;
      for (const value of values) {
        const section = sectionFor("skills"), e = section && skillInput(section);
        if (!e || location.href !== url) return false;
        const skillKey3 = (s) => s.toLowerCase().replace(/c\+\+/g, "cplusplus").replace(/c#/g, "csharp").replace(/[^a-z0-9]+/g, " ").trim();
        const aliases3 = new Set(skillAliases[value] || [skillKey3(value)]);
        const committed = () => {
          const p = sectionFor("skills");
          return !!p && chipValues(p).some((s) => aliases3.has(skillKey3(s)));
        };
        if (committed()) continue;
        if (e.value.trim()) return false;
        const write = (v) => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(e, v);
          e.dispatchEvent(new Event("input", { bubbles: true }));
        };
        const menus = '[role="listbox"],[data-automation-id="activeListContainer"],[data-automation-id="promptOptionsContainer"]';
        const before = new Set([...document.querySelectorAll(menus)].filter(visible));
        e.focus();
        write(value);
        let clicked = false;
        for (let i = 0; i < 20 && !committed(); i++) {
          await pause(75);
          if (!e.isConnected || location.href !== url) return false;
          const id = e.getAttribute("aria-controls") || e.getAttribute("aria-owns");
          const panels = [...document.querySelectorAll(menus)].filter((p) => visible(p) && (p.id === id || section.contains(p) || !before.has(p)));
          const inner = panels.filter((p) => !panels.some((n) => n !== p && p.contains(n)));
          const panel = panels.find((p) => p.id && p.id === id) || (inner.length === 1 ? inner[0] : null);
          const rows = panel ? [...panel.querySelectorAll('[role="option"],[data-automation-id="promptOption"],[data-automation-id="menuItem"],[data-automation-id="promptLeafNode"],li')].filter((o) => visible(o) && !disabled(o)) : [];
          const matches = rows.filter((o) => aliases3.has(skillKey3(text(o))));
          const options = matches.filter((o) => !matches.some((n) => n !== o && o.contains(n)));
          if (!clicked && options.length === 1) {
            activate(options[0], true);
            clicked = true;
          } else if (!clicked && i === 4 && !rows.length) {
            for (const event of ["keydown", "keyup"]) e.dispatchEvent(new KeyboardEvent(event, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
          }
        }
        if (!committed()) {
          if (e.value === value) write("");
          e.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
          complete = false;
        }
      }
      return complete;
    }
    if (action === "advance") {
      if (location.href !== url || document.querySelector("input[type=password]")) return false;
      const heading = [...document.querySelectorAll("h1,h2,[aria-current=step]")].filter(visible).map(text).join(" ");
      if (/review and submit|review your application|submit application|certification|signature/i.test(heading)) return false;
      const buttons = [...document.querySelectorAll("button,input[type=button],input[type=submit]")].filter((b) => visible(b) && !disabled(b));
      if (buttons.some((b) => /submit (?:my |your )?application|finish application/i.test(text(b) || b.value))) return false;
      const next = buttons.filter((b) => /^(?:save (?:and|&) continue|continue|next(?: step| section)?)$/i.test((text(b) || b.value || "").trim()));
      if (next.length !== 1) return false;
      const current = document.querySelector('[aria-current="step"],[data-automation-id="progressBarActiveStep"]');
      if (current && /review|submit|certif|signature|final/i.test(text(current))) return false;
      if (next[0].type === "submit" && !/save (?:and|&) continue/i.test(text(next[0]) || next[0].value) && !current) return false;
      if (next[0].form && !next[0].form.checkValidity() || [...document.querySelectorAll("[aria-invalid=true]")].some(visible)) return false;
      next[0].click();
      return true;
    }
    if (action === "prepare-education") {
      const sites = sectionFor("websites");
      if (sites && !sites.querySelector('input:not([type=hidden]),a[href^="http"]')) {
        const adds = [...sites.querySelectorAll("button")].filter((b) => visible(b) && !disabled(b) && (!b.form || b.type === "button") && norm(text(b)) === "add");
        if (adds.length === 1) adds[0].click();
      }
      const buttons = [...document.querySelectorAll("button")].filter((b) => visible(b) && !b.disabled && !b.matches('[type="submit"]') && (!b.form || b.type === "button") && /^(?:\+\s*)?add(?: education(?: history)?)?$/i.test(text(b)));
      const education = buttons.filter((b) => {
        for (let section = b.parentElement; section && section !== document.body; section = section.parentElement) {
          const headings = [...section.querySelectorAll('h1,h2,h3,h4,h5,legend,[role="heading"]')].filter(visible);
          if (!headings.length) continue;
          if (norm(text(b)) === "add education" && headings.some((h) => /^(?:work and education history|education(?: history)?)$/.test(norm(text(h)))))
            return !section.querySelector('input:not([type=hidden]),select,textarea,[role=combobox],[data-education-entry],[aria-label*="Edit education" i], [class*="timeline-item"]:not([class*="year"])') && ![...section.querySelectorAll("h3,h4,li,[role=listitem]")].some((row) => /\b(?:university|bachelor|diploma|school of)\b/i.test(text(row)));
          return headings.length === 1 && /^(?:education|education history)$/.test(norm(text(headings[0]))) && !section.querySelector('input:not([type="hidden"]),select,textarea,[role="combobox"]') && buttons.filter((other) => section.contains(other)).length === 1;
        }
        return false;
      });
      if (education.length !== 1) return false;
      education[0].click();
      return (async () => {
        for (let i = 0; i < 20; i++) {
          if (elements().some((c) => visible(c) && norm(label(c)) === "school or university")) break;
          await new Promise((r) => setTimeout(r, 60));
        }
        return true;
      })();
    }
    if (action === "scan-chat") return { url: location.href, fields: elements().flatMap((e, i) => isReply(e) && visible(e) ? [snapshot(e, i)] : []) };
    if (action === "scan") {
      const countries = /* @__PURE__ */ new Set(), postings = [];
      for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        if (script.textContent.length > 25e4) continue;
        try {
          const json = JSON.parse(script.textContent);
          for (const row of [json].flat().flatMap((x) => x?.["@graph"] || [x])) if ([row?.["@type"]].flat().includes("JobPosting")) postings.push(row);
        } catch {
        }
      }
      if (postings.length === 1) for (const place of [postings[0].jobLocation].flat()) {
        let country = place?.address?.addressCountry;
        country = country?.name || country;
        if (typeof country === "string" && /^[a-z]{2}$/i.test(country)) country = new Intl.DisplayNames(["en"], { type: "region" }).of(country.toUpperCase());
        countries.add([place?.address?.addressRegion, typeof country === "string" ? country : ""].filter((v) => typeof v === "string" && v).join(", "));
      }
      if (!countries.size) for (const node of document.querySelectorAll('[itemprop=jobLocation],[data-automation-id=locations],[data-bind="html: primaryLocation"],[data-job-location]')) {
        const loc = node.getAttribute("data-job-location") || text(node);
        if (loc && loc.length < 120) countries.add(loc);
      }
      const jobLocation = countries.size === 1 ? [...countries][0] : "";
      const posting = postings.length === 1 ? postings[0] : null;
      const jobEmployer = posting?.hiringOrganization?.name || "", jobIndustry = typeof posting?.industry === "string" ? posting.industry : "";
      const all = elements();
      return { url: location.href, jobLocation, jobEmployer, jobIndustry, needsEmailVerification: !!document.querySelector("input[type=password]") && /please verify your account|verify your account before you sign in|verify your email before/i.test(text(document.body)), fields: all.map(snapshot).filter((f) => choice(all[f.index]) ? choiceVisible(all[f.index]) : visible(all[f.index])).concat(listFields()), applicationFrames: [...document.querySelectorAll("iframe[src]")].filter(visible).flatMap((frame) => {
        try {
          const u = new URL(frame.src, location.href);
          return u.origin === location.origin && u.protocol === "https:" ? [u.href] : [];
        } catch {
          return [];
        }
      }), chatFrames: [...document.querySelectorAll("iframe[src]")].filter(visible).flatMap((frame) => {
        try {
          const u = new URL(frame.src, location.href);
          return u.protocol === "https:" && (/(^|\.)paradox\.ai$/.test(u.hostname) || /\b(chat|chatbot|olivia)\b/i.test([frame.title, frame.id, frame.name].join(" "))) ? [u.origin] : [];
        } catch {
          return [];
        }
      }), hasEmailSignIn: [...document.querySelectorAll("h1,h2,h3,[role=heading]")].some((h) => visible(h) && /^(?:sign in|log in)$/i.test(text(h))), hasPasswordField: !!document.querySelector("input[type=password i]"), embeddedForms: document.querySelectorAll("iframe").length };
    }
    if (action === "remember") {
      const blocked = /password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/i;
      const candidates = [];
      for (const e of elements()) {
        if (!["text", "email", "tel", "url", "textarea", "select-one", "number", "combobox", "radio-group", "checkbox-group", "date", "month"].includes(type(e)) || disabled(e) || !visible(e) || empty(e)) continue;
        if (checkbox(e) && norm(label(e)) !== "in which of the following u s geographic locations are you willing to work") continue;
        const question = label(e), identity = /^(sex|what is your sex|gender|what is your gender|preferred pronouns?|pronouns|what are your pronouns|race|ethnicity|race ethnicity|race ethnic background|what is your race ethnic background|what is your race ethnicity|what is your race|what is your ethnicity|what is your racial ethnic background|country of citizenship|in which country region do you have citizenship|in which country do you have citizenship|which country are you a citizen of)$/.test(norm(question));
        if (!question || /^(in )?(what|which) country( region)?$/.test(norm(question)) || !identity && blocked.test(question + " " + (e.name || "") + " " + e.id) || /one-time-code|cc-|current-password|new-password/.test(e.autocomplete || "")) continue;
        const answer = checkbox(e) ? radios(e).filter((r) => r.checked).map(optionLabel).join("; ") : radio(e) ? optionLabel(selectedRadio(e)) : custom(e) ? selectedValue(e) : e.tagName === "SELECT" ? text(e.options[e.selectedIndex]) : e.value;
        if (!answer || answer.length > 1500 || placeholder(answer)) continue;
        candidates.push({ question, answer });
        if (candidates.length >= 100) break;
      }
      return { url: location.href, origin: location.origin, candidates };
    }
    return (async () => {
      if (location.href !== url) return { filled: 0, skipped: fields.length, changed: true };
      let filled = 0, skipped = 0;
      for (const f of fields) {
        if (f.type === "skill-list" || f.type === "language-list") {
          if (location.href === url && Array.isArray(f.value) && await (f.type === "skill-list" ? fillSkills : fillLanguages)(f.value, f.skillAliases)) filled++;
          else skipped++;
          continue;
        }
        const all = elements();
        let e = all[f.index];
        if (f.id && e?.id !== f.id) {
          const matches = all.filter((c) => c.id === f.id);
          e = matches.length === 1 ? matches[0] : null;
        }
        if (f.emailSave && e?.isConnected && location.href === url && label(e) === f.label && e.value === f.emailValue && e.value.toLowerCase() === String(f.value).toLowerCase()) {
          const save = emailSave(e);
          if (save) {
            save.click();
            await pause(150);
            if (!e.isConnected || !emailSave(e)) filled++;
            else skipped++;
          } else skipped++;
          continue;
        }
        if (location.href !== url || !e || !e.isConnected || !empty(e) && !(f.currentRecruiterScope && context(e).currentRecruiterScope === f.currentRecruiterScope && norm(f.display) === "only recruiters managing jobs i apply to") && !(f.digitsPhone && context(e).digitsPhone && e.value === f.phoneBefore && e.value.replace(/\D/g, "") === f.value) && !(f.languageRow === "english" && f.currentLevel === "basic" && context(e).languageRow === "english" && norm(valueText(e)) === "basic" && f.display === "Fluent") || disabled(e) || !(choice(e) ? choiceVisible(e) : visible(e)) || label(e) !== f.label || type(e) !== f.type || (e.name || "") !== f.name || (e.id || "") !== f.id) {
          skipped++;
          continue;
        }
        const currentContext = context(e);
        if ("primaryEmail" in f && currentContext.primaryEmail && String(currentContext.primaryEmail).trim().toLowerCase() !== String(f.value).trim().toLowerCase() || f.degreePair && (!currentContext.degreePair || f.rowDegree && f.rowDegree !== currentContext.rowDegree) || f.includesCitizenCategory && !currentContext.includesCitizenCategory || f.parentIncludesCitizenCategory && !currentContext.parentIncludesCitizenCategory || f.parentQuestion && currentContext.parentQuestion !== f.parentQuestion || f.parentAnswer && currentContext.parentAnswer !== f.parentAnswer || f.educationSchool && currentContext.educationSchool !== f.educationSchool) {
          skipped++;
          continue;
        }
        if (checkbox(e)) {
          const choices = radios(e), labels = f.selectedLabels || [], matching = choices.filter((r) => !disabled(r) && choiceVisible(r) && labels.some((l) => norm(l) === norm(optionLabel(r))));
          if (!labels.length || matching.length !== labels.length || new Set(matching.map((r) => norm(optionLabel(r)))).size !== labels.length) {
            skipped++;
            continue;
          }
          for (const r of matching) if (!r.checked) r.click();
          await new Promise((r) => setTimeout(r, 60));
          if (matching.every((r) => r.checked)) filled++;
          else skipped++;
        } else if (radio(e)) {
          const choices = radios(e), matching = choices.filter((r) => !disabled(r) && choiceVisible(r) && norm(optionLabel(r)) === norm(f.display));
          if (matching.length !== 1) {
            skipped++;
            continue;
          }
          matching[0].click();
          await new Promise((r) => setTimeout(r, 60));
          if (selectedRadio(e) === matching[0]) filled++;
          else skipped++;
        } else if (custom(e)) {
          const boxSelector = '[class*="__menu-list"],[id^="react-select-"][id$="-listbox"],[role="listbox"],[role="menu"],[role="tree"],[role="grid"],[data-automation-id="activeListContainer"],[data-automation-id="promptOptionsContainer"],.iti__country-list,.country-list,[class$="-menu-list"],.ng-dropdown-panel,.select2-results__options,.mat-select-panel,.dropdown-menu,.selectize-dropdown,.ui-select-choices,.ts-dropdown';
          const optionSelector = '[class*="__option"],[id^="react-select-"][id*="-option-"],[role="option"],[role="gridcell"][aria-selected],[role="treeitem"],[data-automation-id="menuItem"],[data-automation-id="promptOption"],[data-automation-id="promptLeafNode"],.iti__country,.country[data-country-code],[class$="-option"],.ng-option,.select2-results__option,mat-option,[role="menuitem"],li,[tabindex]:not([tabindex="-1"]),[data-selectable],.ui-select-choices-row';
          const before = new Set([...document.querySelectorAll(boxSelector)].filter(visible));
          const opener = e.matches(".ui-select-container") ? e.querySelector(".ui-select-toggle,.ui-select-match") || e : e;
          e.focus();
          if (e.getAttribute("aria-expanded") !== "true") activate(opener);
          if (e.getAttribute("aria-expanded") !== "true") e.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true }));
          let boxes = [];
          let searchInput = e.matches("input:not([readonly])") ? e : e.querySelector('input:not([readonly]):not([type="hidden"])');
          const academicPicker = /^(?:school or university|school|university|field of study|major)$/.test(norm(f.label));
          if (academicPicker && searchInput) {
            const target = String(f.value);
            const term = /school|university/.test(norm(f.label)) ? target.split(/[–—]|\s+-\s+/)[0].trim() : target;
            const preventSubmit = (event) => event.preventDefault();
            searchInput.form?.addEventListener("submit", preventSubmit, true);
            try {
              Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(searchInput, term);
              searchInput.dispatchEvent(new Event("input", { bubbles: true }));
              for (const kind of ["keydown", "keyup"]) searchInput.dispatchEvent(new KeyboardEvent(kind, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
            } finally {
              searchInput.form?.removeEventListener("submit", preventSubmit, true);
            }
          }
          const searchableAddress = /^(?:current |home )?(?:country(?: of residence)?|state(?: province)?|province|city|county|postal code|zip(?: code)?|address line 1)$/.test(norm(f.label));
          const writeSearch = (value) => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(searchInput, value);
            searchInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
          };
          let initialQuery = "";
          for (let attempt = 0; attempt < 15; attempt++) {
            if (location.href !== url || !e.isConnected) break;
            const ids = ((e.getAttribute("aria-controls") || "") + " " + (e.getAttribute("aria-owns") || "")).trim().split(/\s+/).filter(Boolean);
            boxes = [...new Set(ids)].map((id) => e.getRootNode().getElementById?.(id) || document.getElementById(id)).filter((n) => n && visible(n));
            if (!boxes.length) {
              const local = e.closest('[data-automation-id^="formField-"],.iti,.react-tel-input,.intl-tel-input,.selectize-control,.ui-select-container,.ts-wrapper');
              if (local) boxes = [...local.querySelectorAll(boxSelector)].filter(visible);
            }
            if (!boxes.length && e.parentElement?.querySelectorAll(comboSelector).length === 1) boxes = [...e.parentElement.querySelectorAll(boxSelector)].filter(visible);
            if (!boxes.length) boxes = [...document.querySelectorAll(boxSelector)].filter((n) => visible(n) && !before.has(n));
            boxes = boxes.filter((b, i, all2) => !all2.some((other) => other !== b && other.contains(b)));
            if (academicPicker && boxes.length === 1 && !Array.from(boxes[0].querySelectorAll(optionSelector)).some((o) => norm(text(o)) === norm(f.value))) {
              await new Promise((r) => setTimeout(r, 80));
              continue;
            }
            if (boxes.length === 1 && [...boxes[0].querySelectorAll(optionSelector)].some((o) => !o.matches('[aria-disabled="true"],.loading-results,[role="alert"],[aria-busy="true"]') && !/^(?:searching|loading)(?: results)?[.… ]*$/i.test(text(o)))) break;
            if (attempt === 2 && searchInput && searchableAddress && !searchInput.value && !f.phoneCountry) {
              initialQuery = String(f.value);
              writeSearch(initialQuery);
            }
            await new Promise((r) => setTimeout(r, 80));
          }
          const aliases3 = [...f.aliases || [norm(f.value)]];
          const readOptions = () => boxes.length === 1 ? [...boxes[0].querySelectorAll(optionSelector)].filter((o) => visible(o) && !disabled(o) && !o.classList.contains("ng-option-disabled")).filter((o) => !o.matches("input,textarea") && !o.matches('[role="listbox"],[role="tree"],[role="menu"]')).filter((o, i, all2) => !all2.some((other) => other !== o && o.contains(other) && norm(text(o)) === norm(text(other)))) : [];
          const optionKey = (o) => f.phoneCountry && o.getAttribute("data-country-code")?.toLowerCase() === "us" && /\+1\b/.test(text(o)) ? "united states 1" : norm(text(o));
          let available = readOptions();
          const isAddressPicker = searchableAddress || /citizenship/.test(norm(f.label));
          if (!searchInput && boxes.length === 1 && e.matches(".select2-selection")) searchInput = boxes[0].closest(".select2-dropdown")?.querySelector("input.select2-search__field");
          const input = searchInput;
          const query = initialQuery || (input && isAddressPicker && !f.phoneCountry && boxes.length === 1 && !input.value && !available.some((o) => aliases3.includes(optionKey(o))) ? String(f.value) : "");
          const setQuery = writeSearch;
          if (query) {
            if (!initialQuery) setQuery(query);
            for (let i = 0; i < 12; i++) {
              await new Promise((r) => setTimeout(r, 80));
              if (!e.isConnected || location.href !== url) break;
              available = readOptions();
              if (available.some((o) => aliases3.includes(optionKey(o)))) break;
            }
          }
          if (boxes.length === 1 && !available.some((o) => aliases3.includes(optionKey(o)))) {
            const scroll = [boxes[0], ...boxes[0].querySelectorAll("ul,div")].find((n) => n.clientHeight > 0 && n.scrollHeight > n.clientHeight + 2);
            if (scroll) {
              scroll.scrollTop = 0;
              scroll.dispatchEvent(new Event("scroll"));
              await new Promise((r) => setTimeout(r, 45));
              available = readOptions();
              for (let i = 0; i < 45 && !available.some((o) => aliases3.includes(optionKey(o))); i++) {
                const top = scroll.scrollTop;
                scroll.scrollTop += scroll.clientHeight;
                if (scroll.scrollTop === top) break;
                scroll.dispatchEvent(new Event("scroll"));
                await new Promise((r) => setTimeout(r, 45));
                available = readOptions();
                if (available.some((o) => aliases3.includes(optionKey(o)))) break;
              }
            }
          }
          if (f.confirmUSPersons) {
            const choices = available.filter((o) => !placeholder(text(o)));
            if (choices.length === 1) aliases3.push(norm(text(choices[0])));
          }
          if (f.careerSiteDetail) {
            const careerSites = available.map((o) => norm(text(o))).filter((v) => /\b(?:careers? (?:web)?site|careers? page|company website)$/.test(v));
            if (careerSites.length === 1) aliases3.push(careerSites[0]);
          }
          const brand = /\.myworkdayjobs\.com$/.test(location.hostname) ? norm(location.hostname.split(".")[0]) : "";
          if (f.sourceTree) {
            const direct = available.filter((o) => /\bcareers? (?:web ?site|page|site)$/.test(optionKey(o)));
            if (direct.length === 1) aliases3.unshift(optionKey(direct[0]));
            if (brand && available.some((o) => optionKey(o) === brand)) aliases3.unshift(brand);
          }
          const options = available.filter((o) => aliases3.includes(optionKey(o)));
          if (f.phoneCountry && options.length > 1 && options.every((o) => optionKey(o) === "united states 1")) options.splice(1);
          if (options.length > 1 && aliases3.length > 1) {
            options.sort((a, b) => aliases3.indexOf(norm(text(a))) - aliases3.indexOf(norm(text(b))));
            if (norm(text(options[0])) !== norm(text(options[1]))) options.splice(1);
          }
          if (location.href !== url || !e.isConnected || options.length !== 1) {
            if (query && input.isConnected && input.value === query && !/^address line 1\s*\*?$/i.test(f.label.trim())) setQuery("");
            e.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
            e.blur();
            skipped++;
            continue;
          }
          options[0].scrollIntoView?.({ block: "nearest" });
          activate(options[0], true);
          let accepted = false, leafChosen = false;
          const rootChoice = optionKey(options[0]);
          const branchKind = (name) => name === brand || /^(?:company|corporate|our) web ?site$/.test(name) ? "company" : /^job boards?$/.test(name) ? "board" : /^recruiting event$/.test(name) ? "event" : "";
          let sourceBranch = f.sourceTree && branchKind(rootChoice), tried = /* @__PURE__ */ new Set([rootChoice]);
          for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise((r) => setTimeout(r, 80));
            if (location.href !== url || !e.isConnected) break;
            if (sourceBranch && !leafChosen) {
              const lists = [...document.querySelectorAll(boxSelector)].filter((n) => visible(n) && (boxes.includes(n) || !before.has(n)));
              const nodes = [...new Set(lists.flatMap((b) => [...b.querySelectorAll(optionSelector)]))].filter((o) => visible(o) && !disabled(o));
              const names = sourceBranch === "board" ? ["linkedin", "linked in", "indeed", "indeed com"] : sourceBranch === "event" ? ["career fair", "job fair", "university career fair"] : ["job search", "company careers website", "company career site", "careers website", "careers site", brand + " career site", brand + " careers site"];
              const matches = nodes.filter((o) => names.includes(optionKey(o)) || sourceBranch === "company" && /\bcareers? (?:web ?site|page|site)$/.test(optionKey(o)));
              const leaf = matches.find((o) => !matches.some((x) => x !== o && o.contains(x)));
              if (leaf) {
                aliases3.push(optionKey(leaf));
                activate(leaf, true);
                leafChosen = true;
                continue;
              }
              if (f.sourceFallbacks && attempt >= 2 && nodes.length) {
                const next = ["job board", "job boards", "recruiting event"].find((name) => !tried.has(name) && nodes.some((o) => optionKey(o) === name));
                if (next) {
                  tried.add(next);
                  sourceBranch = branchKind(next);
                  activate(nodes.find((o) => optionKey(o) === next), true);
                  continue;
                }
                const back = lists.flatMap((b) => [...b.querySelectorAll('button,[role="button"],[data-automation-id*="Back"],[data-automation-id*="back"]')]).find((n) => visible(n) && /back/i.test([n.getAttribute("aria-label"), n.getAttribute("data-automation-id"), text(n)].join(" ")));
                if (back) activate(back, true);
              }
              if (lists.length) continue;
            }
            if (!(sourceBranch === "company" && brand && rootChoice === brand && !leafChosen) && (aliases3.includes(norm(valueText(e))) || f.phoneCountry && /^\+1$/.test(valueText(e)) && boxes.every((b) => !b.isConnected || !visible(b))) && e.getAttribute("aria-invalid") !== "true" && (!query || input.value !== query || e.getAttribute("aria-expanded") !== "true" && boxes.every((b) => !b.isConnected || !visible(b)))) {
              accepted = true;
              break;
            }
          }
          if (boxes.some((b) => b.isConnected && visible(b))) {
            e.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
            e.blur();
          }
          if (!accepted && query && input.isConnected && input.value === query && !/^address line 1$/i.test(f.label.trim())) setQuery("");
          if (accepted) filled++;
          else skipped++;
        } else {
          if (e.tagName === "SELECT" && ![...e.options].some((o) => o.value === f.value && !o.disabled && text(o) === f.display)) {
            skipped++;
            continue;
          }
          if (isReply(e) && e.hasAttribute("contenteditable")) {
            e.textContent = f.value;
            e.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
            if (e.isConnected && text(e) === f.value) filled++;
            else skipped++;
            continue;
          }
          let fillValue = f.value;
          if (e.type === "date" || e.type === "month" || /^(YYYY-MM-DD|YYYY-MM|MM\/DD\/YYYY)$/i.test(e.placeholder || "")) {
            const month = e.type === "month" || /^YYYY-MM$/i.test(e.placeholder || "");
            if (!(month ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/).test(fillValue) || e.min && fillValue < e.min || e.max && fillValue > e.max) {
              skipped++;
              continue;
            }
            const parsed = /* @__PURE__ */ new Date(fillValue + (month ? "-01" : "") + "T12:00:00Z");
            if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, month ? 7 : 10) !== fillValue) {
              skipped++;
              continue;
            }
            if (/^MM\/DD\/YYYY$/i.test(e.placeholder || "")) fillValue = fillValue.slice(5, 7) + "/" + fillValue.slice(8, 10) + "/" + fillValue.slice(0, 4);
          }
          const proto = e.tagName === "SELECT" ? HTMLSelectElement.prototype : e.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, "value").set.call(e, fillValue);
          e.dispatchEvent(new Event("input", { bubbles: true }));
          e.dispatchEvent(new Event("change", { bubbles: true }));
          if (e.value === fillValue && /^e ?mail(?: address)?$/.test(norm(f.label))) {
            await pause(80);
            emailSave(e)?.click();
          }
          if (!isReply(e)) e.dispatchEvent(new Event("blur", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 120));
          if (e.isConnected && e.value === fillValue && (!e.validity || e.validity.valid)) filled++;
          else skipped++;
        }
      }
      return { filled, skipped };
    })();
  }
  var scanForm = () => formBridge2({ action: "scan" });
  var fillForm = (options) => formBridge2({ ...options, action: "fill" });

  // tools/application-helper/answer-memory.mjs
  var normalizeQuestion2 = (value) => String(value || "").toLowerCase().replace(/[’']/g, "").replace(/\+/g, " plus ").replace(/#/g, " sharp ").replace(/%/g, " percent ").replace(/-(?=\d)/g, " minus ").replace(/(\d)\.(?=\d)/g, "$1 decimal ").replace(/[^a-z0-9]+/g, " ").replace(/\b(required|optional)\b/g, "").replace(/\s+/g, " ").trim();
  var reviewedIdentityQuestion2 = (q) => ["Sex", "Preferred pronouns", "Race / ethnic background", "Country of citizenship"].includes(commonQuestion(q)?.question);
  var privateQuestion2 = (q) => !reviewedIdentityQuestion2(q) && /password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(normalizeQuestion2(q));
  var equivalents2 = [
    ["when can you start", "when are you available to start", "what is your earliest start date", "what is your earliest available start date", "earliest start date", "available start date", "availability to start", "when would you be available to start"],
    ["are you willing to relocate", "are you open to relocation", "would you be willing to relocate", "willing to relocate", "open to relocation"],
    ["are you willing to travel", "are you open to travel", "would you be willing to travel", "willing to travel"],
    ["what is your preferred name", "preferred name", "what name do you prefer to go by"],
    ["what is your preferred contact method", "preferred contact method", "how do you prefer to be contacted"]
  ];
  function questionConcept2(question) {
    if (reviewedIdentityQuestion2(question)) return "identity-" + commonQuestion(question).question;
    const age = ageThreshold(question);
    if (age !== null) return "age-" + age;
    const date = dateConcept(question);
    if (date) return "date-" + date;
    const common = commonQuestion(question);
    if (common) return "common-" + common.question;
    const q = normalizeQuestion2(question);
    const i = equivalents2.findIndex((group) => group.includes(q));
    return i < 0 ? null : "equivalent-" + i;
  }
  function employerSpecific(question) {
    return /\b(this|our|your) (company|organization|organisation|role|position|team)|why.*(join|work|interested)|how.*hear|job.*(id|reference)|^if\b|please specify|how.*hear/i.test(question);
  }
  function memoryMatch2(question, entries, origin, context = "") {
    if (privateQuestion2(question)) return null;
    const q = normalizeQuestion2(question), concept = questionConcept2(question);
    const available = entries.filter((a) => a.scope === "*" || a.scope === origin && a.context && a.context === context);
    let matches = available.filter((a) => normalizeQuestion2(a.question) === q), kind = "Saved answer \xB7 same question";
    if (!matches.length && concept) {
      matches = available.filter((a) => questionConcept2(a.question) === concept);
      kind = "Saved answer \xB7 equivalent wording";
    }
    const scoped = matches.filter((a) => a.scope === origin);
    if (scoped.length) matches = scoped;
    if (!matches.length || new Set(matches.map((a) => a.answer.trim())).size !== 1) return null;
    return { value: matches[0].answer, question: matches[0].question, reason: kind, requiresReview: reviewedIdentityQuestion2(question) };
  }
  var scanAnsweredFields = () => formBridge({ action: "remember" });

  // tools/application-helper/resume-attachment.mjs
  async function attachResume({ url, resume }) {
    if (location.href !== url) return { attached: false, message: "The page changed. Scan again before attaching." };
    const text = (e) => (e?.innerText || e?.textContent || "").trim();
    const label = (e) => [...e.labels || []].map(text).join(" ") || e.getAttribute("aria-label") || (e.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => text(document.getElementById(id))).join(" ") || e.name || e.id || "";
    const inputs = [...document.querySelectorAll('input[type="file"]')];
    const pageUpload = /upload (your |a |either )?(resume|résumé|cv)|resume upload|resume label|uploading your resume/i.test(text(document.body));
    const context = (e) => {
      let node = e.parentElement, best = label(e);
      for (let n = 0; n < 6 && node && node !== document.body; n++, node = node.parentElement) {
        if (node.querySelectorAll('input[type="file"]').length > 1) break;
        const words = text(node);
        if (words.length > 3e3) break;
        best += " " + words;
        if (/\b(resume|résumé|cv|curriculum vitae)\b/i.test(best)) break;
      }
      return best;
    };
    const sharedResumeSection = (e) => {
      for (let node = e.parentElement; node && node !== document.body; node = node.parentElement) {
        const headings = [...node.querySelectorAll("h1,h2,h3,h4,legend,[role=heading]")];
        if (!headings.length) continue;
        if (headings.length !== 1 || !/^r[eé]sum[eé]\s*\/\s*cv\s*\/\s*cover letter\s*\/\s*other attachments$/i.test(text(headings[0]))) return null;
        if (node.querySelectorAll("input[type=file]").length > 1 || /drop cover letter here|upload (?:your |a )?cover letter/i.test(text(node))) return null;
        return node;
      }
      return null;
    };
    const candidates = inputs.filter((e) => {
      if (e.disabled) return false;
      if (sharedResumeSection(e) && !/cover letter|transcript|passport|photo|certificate/i.test(label(e))) return true;
      const words = context(e);
      return (/\b(resume|résumé|cv|curriculum vitae)\b/i.test(words) || inputs.length === 1 && pageUpload) && !/cover letter|transcript|passport|photo|certificate/i.test(words);
    });
    const dropSelector = '[ondrop],[data-dropzone],[data-automation-id*="drop" i],[data-bind*="drop:"],[class*="dropzone" i],[class*="drop-zone" i],[role="application"],[role="presentation"],[class*="droparea" i],[class*="drop-area" i]';
    const resumeSection = (e) => {
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        const headings = [...p.querySelectorAll("h1,h2,h3,h4,legend,[role=heading]")];
        if (headings.length) return headings.length === 1 && /^(?:resume|résumé|cv)(?:\s*\/\s*cv)?$/i.test(text(headings[0])) ? p : null;
      }
      return null;
    };
    const isResumeZone = (e) => /\bdrop\s+(?:your\s+|a\s+)?(?:resume|résumé|cv)\b/i.test(text(e)) || /\bdrop (?:a |your )?files?\b/i.test(text(e)) && !!(resumeSection(e) || sharedResumeSection(e));
    const eligibleZone = (e) => isResumeZone(e) && !/cover letter|transcript|passport|photo|certificate/i.test(text(e)) && e.getClientRects().length;
    const zones = candidates.length ? [] : [...document.querySelectorAll(dropSelector)].filter(eligibleZone);
    const containers = zones.filter((z) => !zones.some((other) => other !== z && z.contains(other)));
    const zone = containers.length === 1 ? containers[0] : null;
    if (candidates.length !== 1 && !zone) return { attached: false, message: "No single supported resume upload found. Use the PDF download to attach it manually." };
    const input = candidates[0], target = input || zone;
    if (zone && (zone.querySelector("input[type=file], [aria-busy=true], [role=progressbar]") || /\.pdf\b|replace|remove|uploading/i.test(text(zone)))) return { attached: false, message: "Review the existing r\xE9sum\xE9 upload." };
    if (input?.files?.length) return { attached: false, message: "A file is already selected; it was left unchanged." };
    const accept = (input?.accept || "").toLowerCase().split(",").map((s) => s.trim());
    if (input?.accept && !accept.some((s) => [".pdf", "application/pdf", "application/*", "*/*"].includes(s))) return { attached: false, message: "This upload does not accept PDF. Attach a supported format manually." };
    if (!resume || typeof resume.base64 !== "string" || resume.base64.length > 2e6) return { attached: false, message: "Start this job from Studio with its tailored PDF first." };
    const bytes = Uint8Array.from(atob(resume.base64), (c) => c.charCodeAt(0));
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((v) => v.toString(16).padStart(2, "0")).join("");
    if (digest !== resume.sha256 || String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") return { attached: false, message: "Resume verification failed. Prepare it again in Studio." };
    const sizeText = (input ? context(input) : text(resumeSection(zone) || zone)) + (inputs.length === 1 ? " " + text(document.body) : "");
    const limits = [...sizeText.matchAll(/(\d+(?:\.\d+)?)\s*(MB|KB)\s*(?:max|maximum)|(?:max(?:imum)?(?: file)? size(?: of)?|smaller than|up to)\s*:?\s*(\d+(?:\.\d+)?)\s*(MB|KB)/gi)].map((m) => Number(m[1] || m[3]) * ((m[2] || m[4]).toUpperCase() === "MB" ? 1e6 : 1e3));
    if (limits.length && bytes.length > Math.min(...limits)) return { attached: false, message: "The tailored PDF exceeds this uploader\u2019s file-size limit. Use a smaller PDF." };
    if (location.href !== url || !target.isConnected || input?.files?.length || input?.disabled) return { attached: false, message: "The upload changed; no file was replaced." };
    try {
      const transfer = new DataTransfer();
      transfer.items.add(new File([bytes], resume.name, { type: "application/pdf" }));
      if (zone) {
        const holder = zone.parentElement || zone;
        for (const event of ["dragenter", "dragover", "drop"]) zone.dispatchEvent(new DragEvent(event, { bubbles: true, cancelable: true, composed: true, dataTransfer: transfer }));
        for (let i = 0; i < 18; i++) {
          if (text(holder).includes(resume.name) && !/upload failed|upload error/i.test(text(holder))) return { attached: true, message: resume.name + " received by the r\xE9sum\xE9 uploader." };
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return { attached: false, message: "PDF dropped. Check the r\xE9sum\xE9 uploader for confirmation." };
      }
      input.files = transfer.files;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      if (!input.files?.length) return { attached: false, message: "The employer cleared the file. Check upload errors or attach the PDF manually." };
      return { attached: true, message: resume.name + " attached. Check the employer\u2019s upload status before continuing." };
    } catch {
      return { attached: false, message: "This uploader needs a manual file selection. Download the tailored PDF from Studio." };
    }
  }

  // tools/application-helper/answer-pagination.mjs
  function paginateAnswers(rows, nav, state) {
    const pages = Math.max(1, Math.ceil(rows.length / 10));
    state.page = Math.min(pages, Math.max(1, state.page || 1));
    rows.forEach((row, i) => {
      row.hidden = Math.floor(i / 10) !== state.page - 1;
    });
    nav.replaceChildren();
    nav.hidden = rows.length <= 10;
    if (nav.hidden) return;
    const button = (text, disabled, step) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      b.disabled = disabled;
      b.onclick = () => {
        state.page += step;
        paginateAnswers(rows, nav, state);
        rows.find((row) => !row.hidden)?.scrollIntoView?.({ block: "start" });
        state.onPage?.();
      };
      return b;
    };
    const status = document.createElement("span");
    status.setAttribute("role", "status");
    status.textContent = "Page " + state.page + " of " + pages + " \xB7 " + rows.length + " answers";
    nav.append(button("Previous answers", state.page === 1, -1), status, button("Next answers", state.page === pages, 1));
  }

  // tools/application-helper/memory-panel.mjs
  var normalizedAnswer = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
  function answerDifference(item, { origin, context, memory = [], profile }) {
    const current = suggestField({ label: item.question, type: "text" }, profile, memory, origin, context) || memoryMatch2(item.question, memory, origin, context);
    if (current) {
      const previous = current.value;
      return { kind: normalizedAnswer(previous) === normalizedAnswer(item.answer) ? "unchanged" : "changed", previous };
    }
    const concept = questionConcept2(item.question), same = (q) => normalizeQuestion2(q) === normalizeQuestion2(item.question) || concept && questionConcept2(q) === concept;
    const known = [...profile?.answers || [], ...memory.filter((a) => a.scope === "*" || a.scope === origin && a.context === context)].filter((a) => same(a.question));
    return { kind: known.length ? "changed" : "new", previous: known.map((a) => a.answer).join(" / ") };
  }
  function reviewAnswers(container, { origin, context, candidates, memory = [], profile, onSave, onCancel }) {
    const el = (tag, text) => {
      const n = document.createElement(tag);
      if (text) n.textContent = text;
      return n;
    };
    container.replaceChildren();
    const hint = el("p", "Review new or changed answers. Your existing bank stays hidden unless you choose Show all detected answers. Identity answers need explicit selection.");
    const summary = el("p"), toggle = el("button"), list = el("div"), nav = el("nav"), status = el("p"), save = el("button", "Save selected answers"), cancel = el("button", "Cancel");
    toggle.type = save.type = cancel.type = "button";
    nav.className = "answer-pagination";
    nav.setAttribute("aria-label", "Answer review pages");
    status.setAttribute("role", "status");
    summary.setAttribute("role", "status");
    const state = { page: 1 };
    let showAll = false;
    const rows = [];
    for (const item of candidates.filter((a) => !privateQuestion2(a.question))) {
      const difference = answerDifference(item, { origin, context, memory, profile }), row = el("div");
      row.className = "memory-row";
      row.dataset.difference = difference.kind;
      const badge = el("strong", difference.kind === "new" ? "New answer" : difference.kind === "changed" ? "Changed answer" : "Already saved");
      badge.className = "memory-difference " + difference.kind;
      const label = el("label"), check = el("input");
      check.type = "checkbox";
      check.checked = difference.kind !== "unchanged" && !reviewedIdentityQuestion2(item.question);
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
      row.append(badge, label);
      if (difference.kind === "changed") row.append(el("small", "Saved: " + difference.previous));
      row.append(answer, scope);
      list.append(row);
      rows.push({ item, check, answer, scope, row, ...difference });
    }
    const changed = rows.filter((r) => r.kind !== "unchanged");
    function render() {
      const visible = showAll ? rows : changed;
      for (const r of rows) r.row.hidden = true;
      paginateAnswers(visible.map((r) => r.row), nav, state);
      toggle.textContent = showAll ? "Show only new or changed answers" : "Show all detected answers (" + rows.length + ")";
      toggle.hidden = !rows.some((r) => r.kind === "unchanged");
      summary.textContent = changed.length + " new or changed \xB7 " + (rows.length - changed.length) + " already saved";
      save.disabled = !visible.length;
      if (!rows.length) hint.textContent = "No supported completed fields found. Answer a question on this page first.";
      else if (!visible.length) hint.textContent = "All detected answers match your saved profile or answer bank. Nothing new to save.";
      else hint.textContent = "Review the answers below. Previously saved matches are hidden by default.";
    }
    toggle.onclick = () => {
      showAll = !showAll;
      state.page = 1;
      render();
    };
    save.onclick = async () => {
      const selected = rows.filter((r) => r.check.checked && (showAll || r.kind !== "unchanged")).map((r) => ({ question: r.item.question, answer: r.answer.value, scope: r.scope.value, sourceOrigin: origin, context }));
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
    container.append(hint, summary, toggle, list, nav, status, save, cancel);
    render();
  }

  // tools/application-helper/assistant.mjs
  if (!globalThis.__ducApplicationHelper) {
    let mount = function(next) {
      stop();
      entry = next;
      remembering = false;
      autoTried = /* @__PURE__ */ new WeakSet();
      autoResumeBusy = false;
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
      style.textContent += " .memory-row[hidden],.answer-pagination[hidden]{display:none!important}.answer-pagination{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.memory-difference{display:block;color:#9dd4c7;margin-bottom:6px}.memory-difference.changed{color:#e2bf73} .portfolio-evidence{font-size:12px;border:1px solid #384a48;border-radius:8px;padding:8px;margin:4px 0 12px}.portfolio-evidence a{color:#9dd4c7}.portfolio-evidence small{margin:5px 0 10px} .memory-row{padding:12px 0;border-bottom:1px solid #444}.memory-row label{display:block}textarea,select{font:inherit;width:100%;margin:6px 0;background:#202528;color:#f1f0ed;border:1px solid #62686c;border-radius:4px;padding:7px}";
      const portfolioNote = el("small", entry.portfolio?.knowledge ? "Portfolio: " + entry.portfolio.knowledge.projects.length + " projects \xB7 " + (entry.portfolio.state === "cached" ? "cached evidence" : "source-backed suggestions") : "Portfolio evidence unavailable; saved answers still work.");
      content.append(job, company, portfolioNote, footer, status, list, remember, memoryArea, memoryNote, el("small", "Review answers and PDF. You submit on the employer\u2019s form."));
      panel.append(header, content);
      root.append(style, panel);
      document.documentElement.append(host);
      remember.onclick = async () => {
        remembering = true;
        memoryArea.hidden = false;
        list.hidden = footer.hidden = true;
        const freshMemory = await chrome.runtime.sendMessage({ type: "memory-list" }).catch(() => ({ ok: false }));
        if (!freshMemory?.ok) {
          status.textContent = "Could not load saved answers. Try again.";
          remembering = false;
          memoryArea.hidden = true;
          list.hidden = footer.hidden = false;
          return;
        }
        entry.memory = freshMemory.items;
        const found = scanAnsweredFields();
        reviewAnswers(memoryArea, { origin: found.origin, profile: entry.profile, memory: entry.memory || [], context: entry.job.company.trim().toLowerCase(), candidates: found.candidates, onSave: async (items) => {
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
      async function autoResume() {
        if (!entry?.autoResume || !entry.resume || entry.resumeUploaded || autoResumeBusy) return;
        const inputs = [...document.querySelectorAll('input[type="file"]')].filter((e) => !e.disabled && !e.files?.length);
        inputs.push(...[...document.querySelectorAll('[ondrop],[data-dropzone],[data-bind*="drop:"],[class*="dropzone" i],[class*="drop-zone" i],[role="application"],[role="presentation"],[class*="droparea" i],[class*="drop-area" i]')].filter((e) => /drop (?:your |a )?(?:resume|résumé|cv|files?)\b/i.test(e.textContent)));
        if (!inputs.length || inputs.every((input) => autoTried.has(input))) return;
        for (const input of inputs) autoTried.add(input);
        autoResumeBusy = true;
        const activeEntry = entry;
        try {
          const result = await attachResume({ url: location.href, resume: entry.resume });
          if (entry !== activeEntry) return;
          status.textContent = result.message + " Nothing was submitted.";
          if (result.attached) {
            entry.resumeUploaded = true;
            list.querySelector('input[value="resume"]')?.closest("label").remove();
            fill.hidden = !list.querySelector("input");
            await chrome.runtime.sendMessage({ type: "resume-attached", sha256: entry.resume.sha256 });
          }
        } catch {
          if (entry === activeEntry) status.textContent = "Automatic attachment could not finish. Use Fill selected to retry or attach the PDF manually.";
        } finally {
          autoResumeBusy = false;
        }
      }
      const excluded = /* @__PURE__ */ new Set();
      const suggest = (f, form) => suggestField({ ...f, jobLocation: entry.job.location || form.jobLocation, applicationSeason: applicationSeason(entry.job.title) }, entry.profile, entry.memory || [], location.origin, entry.job.company.trim().toLowerCase(), entry.portfolio?.knowledge);
      function scanNow(automatic = false) {
        if (!entry || Date.now() >= entry.expiresAt) {
          stop();
          return;
        }
        if (remembering || filling) return;
        autoResume();
        const found = scanForm(), signature = JSON.stringify([found.url, found.fields]);
        if (automatic && signature === lastSignature) return;
        lastSignature = signature;
        review = { url: found.url, createdAt: Date.now(), fields: found.fields.flatMap((f) => {
          const answer = suggest(f, found);
          return answer ? [{ ...f, ...answer }] : [];
        }) };
        list.replaceChildren();
        for (const [i, f] of review.fields.entries()) {
          const label = el("label");
          label.className = "answer";
          const check = el("input");
          check.type = "checkbox";
          check.checked = !excluded.has(questionId(f));
          check.onchange = () => {
            if (check.checked) excluded.delete(questionId(f));
            else excluded.add(questionId(f));
          };
          check.value = String(i);
          const text = el("span", f.label);
          text.append(el("small", f.display));
          if (f.reason) text.append(el("small", f.reason + " \xB7 " + f.sourceQuestion));
          label.append(check, text);
          list.append(label);
          addPortfolioEvidence(list, f);
        }
        if (entry.resume && !entry.resumeUploaded) {
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
        fill.hidden = !review.fields.length && (!entry.resume || entry.resumeUploaded);
        status.textContent = review.fields.length ? `${review.fields.length} suggested answers. Review and uncheck any you don\u2019t want to fill.` : "Open the employer\u2019s application form or sign in. Supported empty fields will appear here.";
        if (found.embeddedForms) status.textContent += " Embedded forms may need opening directly and scanning with the extension button.";
      }
      scan.onclick = async () => {
        if (entry?.profile.values.school) await formBridge2({ action: "prepare-education" });
        scanNow();
      };
      fill.onclick = async () => {
        if (filling) return;
        if (!review || Date.now() - review.createdAt > 12e4) {
          scanNow();
          status.textContent = "Suggestions refreshed. Review them again before filling.";
          return;
        }
        const checked = [...list.querySelectorAll("input")].filter((c) => c.checked), fields = checked.filter((c) => c.value !== "resume").map((c) => review.fields[Number(c.value)]), withResume = checked.some((c) => c.value === "resume");
        if (!fields.length && !withResume) {
          status.textContent = "Select an answer or the tailored PDF.";
          return;
        }
        filling = true;
        fill.disabled = scan.disabled = remember.disabled = true;
        try {
          const running = entry;
          const result = await fillWithFollowups({ url: review.url, reviewed: review.fields, selected: fields, scan: scanForm, fill: fillForm, suggest, active: () => entry === running && Date.now() < running.expiresAt });
          if (entry !== running) return;
          const upload = withResume && entry?.resume ? await attachResume({ url: review.url, resume: entry.resume }) : null;
          list.replaceChildren();
          fill.hidden = true;
          review = null;
          status.textContent = result.changed ? "The page changed. Scan again." : `${result.filled} answers filled; ${result.skipped} skipped. ${upload?.message || ""} Nothing was submitted.`;
          lastSignature = "";
        } catch {
          status.textContent = "Some controls need manual entry. Check the form and scan again.";
        } finally {
          filling = false;
          fill.disabled = scan.disabled = remember.disabled = false;
          if (entry) scanNow(true);
        }
      };
      scanNow();
      observer = new MutationObserver(() => {
        clearTimeout(debounce);
        debounce = setTimeout(() => scanNow(true), 700);
      });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "disabled", "style", "aria-hidden"] });
      timer = setTimeout(() => {
        stop();
        chrome.runtime.sendMessage({ type: "stop-handoff" }).catch(() => {
        });
      }, Math.max(0, entry.expiresAt - Date.now()));
    };
    globalThis.__ducApplicationHelper = true;
    let entry, host, root, review, timer, observer, debounce, lastSignature = "", remembering = false, filling = false, autoResumeBusy = false, autoTried = /* @__PURE__ */ new WeakSet();
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
