(() => {
  // tools/application-helper/portfolio-answers.mjs
  var PORTFOLIO_URL = "https://ducle1218.github.io/Duc-Le-Portfolio/";
  var aliases = { cad: ["cad", "computer aided design", "computer aided drafting"], solidworks: ["solidworks", "solid works"], onshape: ["onshape"], autocad: ["autocad", "auto cad"], fea: ["fea", "finite element analysis"], matlab: ["matlab"], python: ["python"], cplusplus: ["cplusplus"], excel: ["excel", "microsoft excel"], "3d printing": ["3d printing", "additive manufacturing", "fdm"], "mechanical design": ["mechanical design"], assembly: ["assembly", "mechanical assembly"], "structural analysis": ["structural analysis"], documentation: ["documentation", "technical documentation"], "arduino uno": ["arduino", "arduino uno"], pneumatics: ["pneumatics", "pneumatic systems"], "hand fabrication": ["hand fabrication"] };
  Object.assign(aliases, { robotics: ["robotics", "robotics projects"], electronics: ["electronics", "electronic circuits"], simulation: ["simulation", "engineering simulation"], prototyping: ["prototyping", "physical prototyping"] });

  // tools/application-helper/portfolio-ui.mjs
  function addPortfolioEvidence(container, suggestion) {
    if (!suggestion.portfolioDerived || !suggestion.sources?.length) return;
    const details = document.createElement("details"), summary = document.createElement("summary");
    details.className = "portfolio-evidence";
    summary.textContent = "Why this answer \xB7 portfolio sources";
    details.append(summary);
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
      details.append(item);
    }
    container.append(details);
  }

  // tools/application-helper/common-questions.mjs?v=20261115.13
  var COMMON_QUESTIONS = [
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

  // tools/application-helper/answer-rules.mjs?v=20261115.13
  function ageThreshold(q) {
    const s = questionKey(q);
    const m = s.match(/^are you (?:at least )?(\d{1,2})(?: years)?(?: of age| old)?(?: or (?:older|over|above))?$/) || s.match(/^are you (\d{1,2}) years old or older$/);
    return m ? Number(m[1]) : null;
  }
  function dateConcept(q) {
    const s = questionKey(String(q || "").split("?")[0]).replace(/ date year month day$| date year month$| yyyy mm dd$| yyyy mm$/, "");
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
    const address = fact("Street address"), city = profile.values?.city || "", state = profile.values?.state || "";
    let street = address, zip = "";
    if (address && city && state) {
      const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const stateNames = questionKey(state) === "new jersey" ? "(?:NJ|New Jersey)" : escape(state);
      const suffix = new RegExp("[,\\s]+" + escape(city) + "[,\\s]+" + stateNames + "[,\\s]+(\\d{5}(?:-\\d{4})?)$", "i");
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
    const pursued = fact("Degree being pursued"), school = questionKey(field.educationSchool), college = school && school === questionKey(profile.values?.school), highSchool = school && school === questionKey(fact("High school name"));
    if (q === "degree" || q === "degree type" || commonQuestion(field.label)?.question === "Degree being pursued") {
      if (highSchool) return result(fact("Highest completed degree"), "Completed high-school education", ["high school diploma ged", "high school diploma", "full high school education"]);
      if (pursued && (college || commonQuestion(field.label)?.question === "Degree being pursued")) return result(pursued, "Degree in progress, not a completed degree", ["bachelors", "bachelor", "bachelor s", "bachelor degree", "bachelor s degree", "bachelor of science", "b s", "bs"]);
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
      const parent = questionKey(field.parentAnswer);
      if (/university|college/.test(parent) && profile.values?.school) return result(profile.values.school, "Your university for the selected university source", [questionKey(profile.values.school), "rutgers university new brunswick", "rutgers university", "rutgers"]);
      if (/website|career site|amazon career/.test(parent)) return result("Company Website", "Details for the selected company source", ["company website", "our website", "company careers website", "careers website", "amazon jobs"]);
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
    if (/^how (did|do) you (hear|learn|find out) about (this (position|job|role)|us)$/.test(questionKey(field.label)) && unique("Preferred application source") === "Company website or university") return result("Company Website", "Your preferred application source", ["company website", "our website", "company careers website", "company career site", "employer website", "amazon career site", "amazon jobs", "university college", "university recruiting", "university", "university career center", "college university"]);
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
      if (new Set(months).size === 1 && (field.type === "month" || /^YYYY-MM$/i.test(field.placeholder || ""))) return { ...result(months[0], "Expected graduation month"), requiresReview: true };
    }
    return null;
  }

  // tools/application-helper/portfolio-answers.mjs?v=20261115.13
  var key = (s) => String(s || "").toLowerCase().replace(/c\+\+/g, "cplusplus").replace(/c#/g, "csharp").replace(/[^a-z0-9]+/g, " ").trim();
  var aliases2 = { cad: ["cad", "computer aided design", "computer aided drafting"], solidworks: ["solidworks", "solid works"], onshape: ["onshape"], autocad: ["autocad", "auto cad"], fea: ["fea", "finite element analysis"], matlab: ["matlab"], python: ["python"], cplusplus: ["cplusplus"], excel: ["excel", "microsoft excel"], "3d printing": ["3d printing", "additive manufacturing", "fdm"], "mechanical design": ["mechanical design"], assembly: ["assembly", "mechanical assembly"], "structural analysis": ["structural analysis"], documentation: ["documentation", "technical documentation"], "arduino uno": ["arduino", "arduino uno"], pneumatics: ["pneumatics", "pneumatic systems"], "hand fabrication": ["hand fabrication"] };
  Object.assign(aliases2, { robotics: ["robotics", "robotics projects"], electronics: ["electronics", "electronic circuits"], simulation: ["simulation", "engineering simulation"], prototyping: ["prototyping", "physical prototyping"] });
  var skillKey = (s) => Object.entries(aliases2).find(([, names]) => names.includes(key(s)))?.[0] || key(s);
  var uniqueSources = (items) => [...new Map(items.map((s) => [s.url + "\n" + s.quote, s])).values()].slice(0, 4);
  function portfolioAnswer(field, knowledge) {
    if (knowledge?.format !== "duc-portfolio-knowledge-v1") return null;
    const q = key(field.label).replace(/\b(required|optional)\b/g, "").trim();
    if (/\b(not|never|without|lack|professional|professionally|commercial|industry|industrial|paid|employed|employment|years|months|year|month|expert|expertise|proficient|advanced|certified|certification|license|licensed|citizen|citizenship|visa|sponsor|authorized|authorization|gpa|salary|gender|race|ethnicity|disability|veteran|birth|age|agree|certify|completed|successful|successfully|production|productionized|fluent|fully|functional|deployed|operational|independently|alone|sole)\b/.test(q) || /\d/.test(q.replace(/3d/g, ""))) return null;
    const answer = (value, sources, reason = "Draft from documented portfolio evidence") => sources.length && (!field.maxLength || field.maxLength < 0 || value.length <= field.maxLength) ? { value, display: value, requiresReview: true, reason, sourceQuestion: "Portfolio \xB7 " + knowledge.reviewedOn, sources: uniqueSources(sources), portfolioDerived: true } : null;
    const allSkills = /* @__PURE__ */ new Map();
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
    const p = ranked[0].p, tool = p.tools.find((t) => requestedSkills.includes(t.key));
    const linked = tool ? p.claims.filter((c) => c.evidenceIds.some((id) => tool.evidenceIds.includes(id))) : [];
    const claims = (linked.length ? linked : p.claims).slice(0, 2);
    const status = p.completionState.replace(/-/g, " ");
    const text = "My work on " + p.title + " included:\n" + claims.map((c) => "\u2022 " + c.text).join("\n") + (status ? "\nProject status: " + status + "." : "");
    return answer(text, claims.flatMap((c) => c.sources));
  }

  // tools/application-helper/application-autofill.mjs?v=20261115.13
  function formBridge({ action = "scan", url, fields = [] } = {}) {
    const text = (e) => (e?.innerText || e?.textContent || "").trim();
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const visible = (e) => !!e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
    const comboSelector = '[role="combobox"],[aria-haspopup="listbox"],[role="button"][aria-haspopup="true"],button[aria-haspopup="true"],.dropdown-toggle,.ng-select,.select2-selection,mat-select,.selectize-input,.ui-select-container,.ts-control';
    const controls = "input,select,textarea," + comboSelector + ',[role="radio"]';
    const activate = (e) => {
      const Mouse = typeof MouseEvent === "undefined" ? Event : MouseEvent;
      if (typeof PointerEvent !== "undefined") e.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse", button: 0 }));
      const down = new Mouse("mousedown", { bubbles: true, cancelable: true, button: 0 });
      e.dispatchEvent(down);
      e.dispatchEvent(new Mouse("mouseup", { bubbles: true, cancelable: true, button: 0 }));
      if (typeof PointerEvent !== "undefined") e.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "mouse", button: 0 }));
      if (!down.defaultPrevented && e.isConnected && visible(e)) {
        e.addEventListener("click", (event) => event.preventDefault(), { once: true, capture: true });
        e.click();
      }
    };
    const custom = (e) => e.tagName !== "SELECT" && e.matches(comboSelector);
    const radio = (e) => e.type === "radio" || e.getAttribute("role") === "radio";
    const checkbox = (e) => e.type === "checkbox";
    const choice = (e) => radio(e) || checkbox(e);
    const type = (e) => radio(e) ? "radio-group" : checkbox(e) ? "checkbox-group" : custom(e) ? "combobox" : e.type || e.tagName.toLowerCase();
    const labelled = (e) => (e?.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).map((id) => text(document.getElementById(id))).join(" ");
    const group = (e) => {
      const explicit = e.closest('[role="radiogroup"],[role="group"],fieldset');
      if (explicit || !checkbox(e)) return explicit;
      let p = e.parentElement;
      for (let i = 0; i < 6 && p && p !== document.body; i++, p = p.parentElement) {
        if (p.querySelectorAll('input:not([type="checkbox"]),select,textarea').length) break;
        if (p.querySelectorAll('input[type="checkbox"]').length > 1 && p.querySelector("p,legend,.question-label,.form-label,.control-label")) return p;
      }
      return null;
    };
    const radios = (e) => {
      const g = group(e), selector = checkbox(e) ? 'input[type="checkbox"]' : 'input[type="radio"],[role="radio"]';
      return [...(g || e.form || document).querySelectorAll(selector)].filter((r) => g ? group(r) === g && (checkbox(e) || !e.name || r.name === e.name) : !!e.name && r.name === e.name && r.form === e.form);
    };
    const original = (e) => e.matches(".selectize-input,.ts-control") ? e.closest(".selectize-control,.ts-wrapper")?.previousElementSibling : null;
    const labelText = (e) => {
      if (!e) return "";
      const copy = e.cloneNode(true);
      for (const control of copy.querySelectorAll(controls + ',button,[role="listbox"],.selectize-control,.ui-select-match,.select2-container,.ts-wrapper')) control.remove();
      return text(copy);
    };
    const ownLabel = (e) => (e.getAttribute("aria-label") || labelled(e) || [...e.labels || [], ...[...document.querySelectorAll("label[for]")].filter((l) => e.id && l.getAttribute("for") === e.id)].map(labelText).filter((v, i, a) => a.indexOf(v) === i).join(" ") || labelText(e.closest("label")) || "").trim();
    const nearbyLabel = (e) => {
      let parent = e.parentElement;
      const members = choice(e) ? radios(e) : [];
      for (let n = 0; n < 8 && parent && parent !== document.body; n++, parent = parent.parentElement) {
        const contained = [...parent.querySelectorAll(controls)].filter((c) => !c.parentElement?.closest(comboSelector));
        if (choice(e)) {
          if (contained.some((c) => !choice(c) || !members.includes(c))) break;
          if (!members.length || !members.every((r) => parent.contains(r))) continue;
        } else if (contained.filter((c) => !radio(c)).length !== 1) break;
        const candidates = [...parent.querySelectorAll("legend,[data-question],.question-label,.control-label,.form-label,h3,h4,p,label")].filter((h) => !h.querySelector(controls) && !members.some((r) => r.closest("label")?.contains(h) || [...r.labels || []].some((l) => l.contains(h))));
        for (const heading of candidates) {
          const value = labelText(heading);
          if (value && !/^(yes|no|male|female)$/i.test(value) && value.length <= 250) return value;
        }
      }
      return "";
    };
    const label = (e) => {
      if (choice(e)) {
        const g = group(e), single = g && [...g.querySelectorAll('input[type="radio"],[role="radio"],input[type="checkbox"]')].every((r) => radios(e).includes(r));
        return (single && (g.getAttribute("aria-label") || labelled(g) || text(g.querySelector("legend"))) || nearbyLabel(e)).trim().slice(0, 250);
      }
      return (ownLabel(e) || (custom(e) && e.querySelector("input") ? ownLabel(e.querySelector("input")) : "") || (original(e) ? ownLabel(original(e)) : "") || nearbyLabel(e) || e.placeholder || "").trim().slice(0, 250);
    };
    const elements = () => [...document.querySelectorAll(controls)].filter((e) => !e.parentElement?.closest(comboSelector)).filter((e) => !choice(e) || radios(e)[0] === e);
    const selectedValue = (e) => {
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
        const selected = parent.querySelector('[class*="singleValue"],[data-selected-value],.ng-value-label,.select2-selection__rendered,.mat-select-value-text,.ui-select-match-text');
        if (selected) return text(selected);
      }
      return (e.value || text(e)).trim();
    };
    const selectedRadio = (e) => radios(e).find((r) => r.checked || r.getAttribute("aria-checked") === "true");
    const optionLabel = (e) => {
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
    const placeholder = (value) => !value || /^(select|choose|please select|select an? option|select one|select an? answer|please choose)([ .…]*)$/i.test(value.trim());
    const empty = (e) => choice(e) ? !selectedRadio(e) : custom(e) ? placeholder(selectedValue(e)) : !e.value || e.tagName === "SELECT" && e.selectedIndex === 0 && /select|choose|please/i.test(text(e.options[0]));
    const disabled = (e) => e.disabled || e.readOnly && !custom(e) || e.getAttribute("aria-disabled") === "true";
    const valueText = (e) => e.tagName === "SELECT" ? text(e.options[e.selectedIndex]) : custom(e) ? selectedValue(e) : e.value || "";
    const context = (e) => {
      const q = norm(label(e));
      if (!/degree|gpa|grade point|overall result|field of study|^source detail|please specify|academic standing details/.test(q)) return { parentAnswer: "", parentQuestion: "", educationSchool: "" };
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
      if (/degree|gpa|grade point|overall result|field of study/.test(q)) {
        let container = e.parentElement;
        for (let n = 0; n < 7 && container && container !== document.body; n++, container = container.parentElement) {
          const schools = all.filter((c) => container.contains(c) && /^(school or university|school university|school|university|college)( name)?$/.test(norm(label(c))));
          if (schools.length > 1) break;
          if (schools.length === 1) {
            educationSchool = valueText(schools[0]);
            break;
          }
        }
      }
      return { parentAnswer, parentQuestion, educationSchool };
    };
    const snapshot = (e, index) => ({ index, label: label(e), type: type(e), name: e.name || "", id: e.id || "", maxLength: e.maxLength, filled: !empty(e), disabled: !!disabled(e), placeholder: e.placeholder || "", min: e.min || "", max: e.max || "", ...context(e), options: e.tagName === "SELECT" ? [...e.options].map((o) => ({ value: o.value, label: text(o), disabled: o.disabled })) : choice(e) ? radios(e).map((r, i) => ({ value: String(i), label: optionLabel(r), disabled: !!disabled(r) })) : void 0 });
    if (action === "scan") {
      const all = elements();
      return { url: location.href, fields: all.map(snapshot).filter((f) => visible(all[f.index])).slice(0, 150), embeddedForms: document.querySelectorAll("iframe").length };
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
      const all = elements(), targets = fields.map((f) => [f, all[f.index]]);
      let filled = 0, skipped = 0;
      for (const [f, e] of targets) {
        if (location.href !== url || !e || !e.isConnected || !empty(e) || disabled(e) || !visible(e) || label(e) !== f.label || type(e) !== f.type || (e.name || "") !== f.name || (e.id || "") !== f.id) {
          skipped++;
          continue;
        }
        const currentContext = context(e);
        if (f.parentAnswer && currentContext.parentAnswer !== f.parentAnswer || f.educationSchool && currentContext.educationSchool !== f.educationSchool) {
          skipped++;
          continue;
        }
        if (checkbox(e)) {
          const choices = radios(e), labels = f.selectedLabels || [], matching = choices.filter((r) => !disabled(r) && visible(r) && labels.some((l) => norm(l) === norm(optionLabel(r))));
          if (!labels.length || matching.length !== labels.length || new Set(matching.map((r) => norm(optionLabel(r)))).size !== labels.length) {
            skipped++;
            continue;
          }
          for (const r of matching) if (!r.checked) r.click();
          await new Promise((r) => setTimeout(r, 60));
          if (matching.every((r) => r.checked)) filled++;
          else skipped++;
        } else if (radio(e)) {
          const choices = radios(e), matching = choices.filter((r) => !disabled(r) && visible(r) && norm(optionLabel(r)) === norm(f.display));
          if (matching.length !== 1) {
            skipped++;
            continue;
          }
          matching[0].click();
          await new Promise((r) => setTimeout(r, 60));
          if (selectedRadio(e) === matching[0]) filled++;
          else skipped++;
        } else if (custom(e)) {
          const boxSelector = '[role="listbox"],.ng-dropdown-panel,.select2-results__options,.mat-select-panel,.dropdown-menu,.selectize-dropdown,.ui-select-choices,.ts-dropdown';
          const optionSelector = '[role="option"],.ng-option,.select2-results__option,mat-option,[role="menuitem"],li > a,[data-selectable],.ui-select-choices-row';
          const before = new Set([...document.querySelectorAll(boxSelector)].filter(visible));
          const opener = e.matches(".ui-select-container") ? e.querySelector(".ui-select-toggle,.ui-select-match") || e : e;
          e.focus();
          activate(opener);
          if (e.getAttribute("aria-expanded") !== "true") e.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true }));
          let boxes = [];
          for (let attempt = 0; attempt < 15; attempt++) {
            if (location.href !== url || !e.isConnected) break;
            const ids = ((e.getAttribute("aria-controls") || "") + " " + (e.getAttribute("aria-owns") || "")).trim().split(/\s+/).filter(Boolean);
            boxes = ids.map((id) => document.getElementById(id)).filter((n) => n && visible(n));
            if (!boxes.length) {
              const local = e.closest(".selectize-control,.ui-select-container,.ts-wrapper");
              if (local) boxes = [...local.querySelectorAll(boxSelector)].filter(visible);
            }
            if (!boxes.length) boxes = [...document.querySelectorAll(boxSelector)].filter((n) => visible(n) && !before.has(n));
            boxes = boxes.filter((b, i, all2) => !all2.some((other) => other !== b && other.contains(b)));
            if (boxes.length === 1 && boxes[0].querySelector(optionSelector)) break;
            await new Promise((r) => setTimeout(r, 80));
          }
          const aliases3 = f.aliases || [norm(f.value)], options = boxes.length === 1 ? [...boxes[0].querySelectorAll(optionSelector)].filter((o) => visible(o) && !disabled(o) && !o.classList.contains("ng-option-disabled") && aliases3.includes(norm(text(o)))).filter((o, i, all2) => !all2.some((other) => other !== o && other.contains(o))) : [];
          if (options.length > 1 && aliases3.length > 1) {
            options.sort((a, b) => aliases3.indexOf(norm(text(a))) - aliases3.indexOf(norm(text(b))));
            if (norm(text(options[0])) !== norm(text(options[1]))) options.splice(1);
          }
          if (location.href !== url || !e.isConnected || options.length !== 1) {
            e.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            skipped++;
            continue;
          }
          activate(options[0]);
          let accepted = false;
          for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise((r) => setTimeout(r, 80));
            if (location.href !== url || !e.isConnected) break;
            if (aliases3.includes(norm(selectedValue(e)))) {
              accepted = true;
              break;
            }
          }
          if (accepted) filled++;
          else skipped++;
        } else {
          if (e.tagName === "SELECT" && ![...e.options].some((o) => o.value === f.value && !o.disabled && text(o) === f.display)) {
            skipped++;
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
          e.dispatchEvent(new Event("blur", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 120));
          if (e.isConnected && e.value === fillValue && (!e.validity || e.validity.valid)) filled++;
          else skipped++;
        }
      }
      return { filled, skipped };
    })();
  }

  // tools/application-helper/answer-memory.mjs?v=20261115.13
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
  function suggestField(field, profile, memory = [], origin = "", context = "", portfolio = null) {
    if (!profile?.confirmed) return null;
    const label = normalize(field.label).replace(/\b(required|optional)\b/g, "").trim();
    const common = commonQuestion(label), background = backgroundAnswer(label, profile, memory.filter((a) => a.scope === "*" || a.scope === origin && a.context === context));
    const rule = answerRule(field, profile, memory, origin, context);
    if (rule?.blocked) return null;
    if (/^(in )?(what|which) country( region)?$/.test(label)) return null;
    if (!label || !rule && !common && !background && /password|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|birth|social security|consent|agree|certify|signature|salary|compensation|gpa|completed|previous|\breference|emergency|guardian|parent|\breferr|manager|supervisor/.test(label)) return null;
    if (!["text", "email", "tel", "url", "textarea", "select-one", "combobox", "radio-group", "checkbox-group", "number", "date", "month"].includes(field.type) || field.filled || field.disabled) return null;
    const patterns = { firstName: /^(legal )?(first|given) name$/, lastName: /^(legal )?(last name|family name|surname)$/, fullName: /^(legal |full |legal full )?name$/, email: /^(personal |primary |contact )?e ?mail( address)?$/, phone: /^(primary |contact |mobile |cell )?(phone|telephone)( number)?$/, city: /^(current |home )?city$/, state: /^(current |home )?(state|province|state province)$/, postalCode: /^(zip|postal|zip postal)( code)?$/, country: /^(current |home )?country( of residence)?$/, school: /^(current )?(university|school|college|school university|school or university|university college)( name)?$/, major: /^(major|field of study|academic major)$/, graduationYear: /^(expected |anticipated )graduation year$/, portfolio: /^(portfolio|personal website|portfolio website)( url| link)?$/, linkedin: /^linkedin( profile)?( url| link)?$/, github: /^github( profile)?( url| link)?$/ };
    const key2 = Object.keys(patterns).find((k) => patterns[k].test(label));
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
    if (field.maxLength > 0 && value.length > field.maxLength) return null;
    if (field.type === "checkbox-group") {
      if (common?.question !== "Preferred work regions") return null;
      const desired = value.split(";").map(normalize), matches = (field.options || []).filter((o) => !o.disabled && desired.includes(normalize(o.label)));
      if (matches.length !== desired.length || new Set(matches.map((o) => normalize(o.label))).size !== desired.length) return null;
      return { value: matches.map((o) => o.value), display: matches.map((o) => o.label).join("; "), selectedLabels: matches.map((o) => o.label), reason: "Your saved work-region preferences", requiresReview: false };
    }
    const confirmedMale = common?.question === "Sex" && normalize(value) === "male" && custom.length > 0 && new Set(custom.map((a) => normalize(a.answer))).size === 1;
    const review = rule ? { reason: rule.reason, sourceQuestion: rule.sourceQuestion, requiresReview: rule.requiresReview } : { reason: confirmedMale ? "Your confirmed profile answer" : background ? "Based on your confirmed background" : common?.review ? "Confirm this answer for this application" : remembered?.reason, sourceQuestion: background ? background.sourceQuestion : common?.review ? common.question : remembered?.question, requiresReview: !confirmedMale && (!!common?.review || !!background || !!remembered?.requiresReview) };
    if (field.type === "select-one" || field.type === "combobox" || field.type === "radio-group") {
      const aliases3 = rule?.aliases || (key2 === "state" && normalize(value) === "new jersey" ? ["new jersey", "nj"] : (key2 === "country" || background?.value === "United States") && ["us", "usa", "united states"].includes(normalize(value)) ? ["united states", "united states of america", "us", "usa"] : common?.question === "Highest completed degree" && normalize(value) === "high school diploma" ? ["high school diploma", "high school diploma or equivalent", "high school diploma ged", "high school or equivalent"] : [normalize(value)]);
      if (field.type === "combobox") return { value, display: value, aliases: aliases3, ...review };
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
  function formBridge2({ action = "scan", url, fields = [] } = {}) {
    const text = (e) => (e?.innerText || e?.textContent || "").trim();
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const visible = (e) => !!e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
    const comboSelector = '[role="combobox"],[aria-haspopup="listbox"],[role="button"][aria-haspopup="true"],button[aria-haspopup="true"],.dropdown-toggle,.ng-select,.select2-selection,mat-select,.selectize-input,.ui-select-container,.ts-control';
    const controls = "input,select,textarea," + comboSelector + ',[role="radio"]';
    const activate = (e) => {
      const Mouse = typeof MouseEvent === "undefined" ? Event : MouseEvent;
      if (typeof PointerEvent !== "undefined") e.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse", button: 0 }));
      const down = new Mouse("mousedown", { bubbles: true, cancelable: true, button: 0 });
      e.dispatchEvent(down);
      e.dispatchEvent(new Mouse("mouseup", { bubbles: true, cancelable: true, button: 0 }));
      if (typeof PointerEvent !== "undefined") e.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "mouse", button: 0 }));
      if (!down.defaultPrevented && e.isConnected && visible(e)) {
        e.addEventListener("click", (event) => event.preventDefault(), { once: true, capture: true });
        e.click();
      }
    };
    const custom = (e) => e.tagName !== "SELECT" && e.matches(comboSelector);
    const radio = (e) => e.type === "radio" || e.getAttribute("role") === "radio";
    const checkbox = (e) => e.type === "checkbox";
    const choice = (e) => radio(e) || checkbox(e);
    const type = (e) => radio(e) ? "radio-group" : checkbox(e) ? "checkbox-group" : custom(e) ? "combobox" : e.type || e.tagName.toLowerCase();
    const labelled = (e) => (e?.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).map((id) => text(document.getElementById(id))).join(" ");
    const group = (e) => {
      const explicit = e.closest('[role="radiogroup"],[role="group"],fieldset');
      if (explicit || !checkbox(e)) return explicit;
      let p = e.parentElement;
      for (let i = 0; i < 6 && p && p !== document.body; i++, p = p.parentElement) {
        if (p.querySelectorAll('input:not([type="checkbox"]),select,textarea').length) break;
        if (p.querySelectorAll('input[type="checkbox"]').length > 1 && p.querySelector("p,legend,.question-label,.form-label,.control-label")) return p;
      }
      return null;
    };
    const radios = (e) => {
      const g = group(e), selector = checkbox(e) ? 'input[type="checkbox"]' : 'input[type="radio"],[role="radio"]';
      return [...(g || e.form || document).querySelectorAll(selector)].filter((r) => g ? group(r) === g && (checkbox(e) || !e.name || r.name === e.name) : !!e.name && r.name === e.name && r.form === e.form);
    };
    const original = (e) => e.matches(".selectize-input,.ts-control") ? e.closest(".selectize-control,.ts-wrapper")?.previousElementSibling : null;
    const labelText = (e) => {
      if (!e) return "";
      const copy = e.cloneNode(true);
      for (const control of copy.querySelectorAll(controls + ',button,[role="listbox"],.selectize-control,.ui-select-match,.select2-container,.ts-wrapper')) control.remove();
      return text(copy);
    };
    const ownLabel = (e) => (e.getAttribute("aria-label") || labelled(e) || [...e.labels || [], ...[...document.querySelectorAll("label[for]")].filter((l) => e.id && l.getAttribute("for") === e.id)].map(labelText).filter((v, i, a) => a.indexOf(v) === i).join(" ") || labelText(e.closest("label")) || "").trim();
    const nearbyLabel = (e) => {
      let parent = e.parentElement;
      const members = choice(e) ? radios(e) : [];
      for (let n = 0; n < 8 && parent && parent !== document.body; n++, parent = parent.parentElement) {
        const contained = [...parent.querySelectorAll(controls)].filter((c) => !c.parentElement?.closest(comboSelector));
        if (choice(e)) {
          if (contained.some((c) => !choice(c) || !members.includes(c))) break;
          if (!members.length || !members.every((r) => parent.contains(r))) continue;
        } else if (contained.filter((c) => !radio(c)).length !== 1) break;
        const candidates = [...parent.querySelectorAll("legend,[data-question],.question-label,.control-label,.form-label,h3,h4,p,label")].filter((h) => !h.querySelector(controls) && !members.some((r) => r.closest("label")?.contains(h) || [...r.labels || []].some((l) => l.contains(h))));
        for (const heading of candidates) {
          const value = labelText(heading);
          if (value && !/^(yes|no|male|female)$/i.test(value) && value.length <= 250) return value;
        }
      }
      return "";
    };
    const label = (e) => {
      if (choice(e)) {
        const g = group(e), single = g && [...g.querySelectorAll('input[type="radio"],[role="radio"],input[type="checkbox"]')].every((r) => radios(e).includes(r));
        return (single && (g.getAttribute("aria-label") || labelled(g) || text(g.querySelector("legend"))) || nearbyLabel(e)).trim().slice(0, 250);
      }
      return (ownLabel(e) || (custom(e) && e.querySelector("input") ? ownLabel(e.querySelector("input")) : "") || (original(e) ? ownLabel(original(e)) : "") || nearbyLabel(e) || e.placeholder || "").trim().slice(0, 250);
    };
    const elements = () => [...document.querySelectorAll(controls)].filter((e) => !e.parentElement?.closest(comboSelector)).filter((e) => !choice(e) || radios(e)[0] === e);
    const selectedValue = (e) => {
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
        const selected = parent.querySelector('[class*="singleValue"],[data-selected-value],.ng-value-label,.select2-selection__rendered,.mat-select-value-text,.ui-select-match-text');
        if (selected) return text(selected);
      }
      return (e.value || text(e)).trim();
    };
    const selectedRadio = (e) => radios(e).find((r) => r.checked || r.getAttribute("aria-checked") === "true");
    const optionLabel = (e) => {
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
    const placeholder = (value) => !value || /^(select|choose|please select|select an? option|select one|select an? answer|please choose)([ .…]*)$/i.test(value.trim());
    const empty = (e) => choice(e) ? !selectedRadio(e) : custom(e) ? placeholder(selectedValue(e)) : !e.value || e.tagName === "SELECT" && e.selectedIndex === 0 && /select|choose|please/i.test(text(e.options[0]));
    const disabled = (e) => e.disabled || e.readOnly && !custom(e) || e.getAttribute("aria-disabled") === "true";
    const valueText = (e) => e.tagName === "SELECT" ? text(e.options[e.selectedIndex]) : custom(e) ? selectedValue(e) : e.value || "";
    const context = (e) => {
      const q = norm(label(e));
      if (!/degree|gpa|grade point|overall result|field of study|^source detail|please specify|academic standing details/.test(q)) return { parentAnswer: "", parentQuestion: "", educationSchool: "" };
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
      if (/degree|gpa|grade point|overall result|field of study/.test(q)) {
        let container = e.parentElement;
        for (let n = 0; n < 7 && container && container !== document.body; n++, container = container.parentElement) {
          const schools = all.filter((c) => container.contains(c) && /^(school or university|school university|school|university|college)( name)?$/.test(norm(label(c))));
          if (schools.length > 1) break;
          if (schools.length === 1) {
            educationSchool = valueText(schools[0]);
            break;
          }
        }
      }
      return { parentAnswer, parentQuestion, educationSchool };
    };
    const snapshot = (e, index) => ({ index, label: label(e), type: type(e), name: e.name || "", id: e.id || "", maxLength: e.maxLength, filled: !empty(e), disabled: !!disabled(e), placeholder: e.placeholder || "", min: e.min || "", max: e.max || "", ...context(e), options: e.tagName === "SELECT" ? [...e.options].map((o) => ({ value: o.value, label: text(o), disabled: o.disabled })) : choice(e) ? radios(e).map((r, i) => ({ value: String(i), label: optionLabel(r), disabled: !!disabled(r) })) : void 0 });
    if (action === "scan") {
      const all = elements();
      return { url: location.href, fields: all.map(snapshot).filter((f) => visible(all[f.index])).slice(0, 150), embeddedForms: document.querySelectorAll("iframe").length };
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
      const all = elements(), targets = fields.map((f) => [f, all[f.index]]);
      let filled = 0, skipped = 0;
      for (const [f, e] of targets) {
        if (location.href !== url || !e || !e.isConnected || !empty(e) || disabled(e) || !visible(e) || label(e) !== f.label || type(e) !== f.type || (e.name || "") !== f.name || (e.id || "") !== f.id) {
          skipped++;
          continue;
        }
        const currentContext = context(e);
        if (f.parentAnswer && currentContext.parentAnswer !== f.parentAnswer || f.educationSchool && currentContext.educationSchool !== f.educationSchool) {
          skipped++;
          continue;
        }
        if (checkbox(e)) {
          const choices = radios(e), labels = f.selectedLabels || [], matching = choices.filter((r) => !disabled(r) && visible(r) && labels.some((l) => norm(l) === norm(optionLabel(r))));
          if (!labels.length || matching.length !== labels.length || new Set(matching.map((r) => norm(optionLabel(r)))).size !== labels.length) {
            skipped++;
            continue;
          }
          for (const r of matching) if (!r.checked) r.click();
          await new Promise((r) => setTimeout(r, 60));
          if (matching.every((r) => r.checked)) filled++;
          else skipped++;
        } else if (radio(e)) {
          const choices = radios(e), matching = choices.filter((r) => !disabled(r) && visible(r) && norm(optionLabel(r)) === norm(f.display));
          if (matching.length !== 1) {
            skipped++;
            continue;
          }
          matching[0].click();
          await new Promise((r) => setTimeout(r, 60));
          if (selectedRadio(e) === matching[0]) filled++;
          else skipped++;
        } else if (custom(e)) {
          const boxSelector = '[role="listbox"],.ng-dropdown-panel,.select2-results__options,.mat-select-panel,.dropdown-menu,.selectize-dropdown,.ui-select-choices,.ts-dropdown';
          const optionSelector = '[role="option"],.ng-option,.select2-results__option,mat-option,[role="menuitem"],li > a,[data-selectable],.ui-select-choices-row';
          const before = new Set([...document.querySelectorAll(boxSelector)].filter(visible));
          const opener = e.matches(".ui-select-container") ? e.querySelector(".ui-select-toggle,.ui-select-match") || e : e;
          e.focus();
          activate(opener);
          if (e.getAttribute("aria-expanded") !== "true") e.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true }));
          let boxes = [];
          for (let attempt = 0; attempt < 15; attempt++) {
            if (location.href !== url || !e.isConnected) break;
            const ids = ((e.getAttribute("aria-controls") || "") + " " + (e.getAttribute("aria-owns") || "")).trim().split(/\s+/).filter(Boolean);
            boxes = ids.map((id) => document.getElementById(id)).filter((n) => n && visible(n));
            if (!boxes.length) {
              const local = e.closest(".selectize-control,.ui-select-container,.ts-wrapper");
              if (local) boxes = [...local.querySelectorAll(boxSelector)].filter(visible);
            }
            if (!boxes.length) boxes = [...document.querySelectorAll(boxSelector)].filter((n) => visible(n) && !before.has(n));
            boxes = boxes.filter((b, i, all2) => !all2.some((other) => other !== b && other.contains(b)));
            if (boxes.length === 1 && boxes[0].querySelector(optionSelector)) break;
            await new Promise((r) => setTimeout(r, 80));
          }
          const aliases3 = f.aliases || [norm(f.value)], options = boxes.length === 1 ? [...boxes[0].querySelectorAll(optionSelector)].filter((o) => visible(o) && !disabled(o) && !o.classList.contains("ng-option-disabled") && aliases3.includes(norm(text(o)))).filter((o, i, all2) => !all2.some((other) => other !== o && other.contains(o))) : [];
          if (options.length > 1 && aliases3.length > 1) {
            options.sort((a, b) => aliases3.indexOf(norm(text(a))) - aliases3.indexOf(norm(text(b))));
            if (norm(text(options[0])) !== norm(text(options[1]))) options.splice(1);
          }
          if (location.href !== url || !e.isConnected || options.length !== 1) {
            e.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            skipped++;
            continue;
          }
          activate(options[0]);
          let accepted = false;
          for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise((r) => setTimeout(r, 80));
            if (location.href !== url || !e.isConnected) break;
            if (aliases3.includes(norm(selectedValue(e)))) {
              accepted = true;
              break;
            }
          }
          if (accepted) filled++;
          else skipped++;
        } else {
          if (e.tagName === "SELECT" && ![...e.options].some((o) => o.value === f.value && !o.disabled && text(o) === f.display)) {
            skipped++;
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
          e.dispatchEvent(new Event("blur", { bubbles: true }));
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
    const candidates = inputs.filter((e) => {
      if (e.disabled || e.multiple) return false;
      const words = context(e);
      return (/\b(resume|résumé|cv|curriculum vitae)\b/i.test(words) || inputs.length === 1 && pageUpload) && !/cover letter|transcript|passport|photo|certificate/i.test(words);
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
    const sizeText = context(input) + (inputs.length === 1 ? " " + text(document.body) : "");
    const limits = [...sizeText.matchAll(/(\d+(?:\.\d+)?)\s*(MB|KB)\s*(?:max|maximum)|(?:max(?:imum)?(?: file)? size(?: of)?|smaller than|up to)\s*:?\s*(\d+(?:\.\d+)?)\s*(MB|KB)/gi)].map((m) => Number(m[1] || m[3]) * ((m[2] || m[4]).toUpperCase() === "MB" ? 1e6 : 1e3));
    if (limits.length && bytes.length > Math.min(...limits)) return { attached: false, message: "The tailored PDF exceeds this uploader\u2019s file-size limit. Use a smaller PDF." };
    if (location.href !== url || !input.isConnected || input.files?.length || input.disabled) return { attached: false, message: "The upload changed; no file was replaced." };
    try {
      const transfer = new DataTransfer();
      transfer.items.add(new File([bytes], resume.name, { type: "application/pdf" }));
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
      content.append(job, company, portfolioNote, status, list, footer, remember, memoryArea, memoryNote, el("small", "Review answers and PDF. You submit on the employer\u2019s form."));
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
        const inputs = [...document.querySelectorAll('input[type="file"]')].filter((e) => !e.disabled && !e.multiple && !e.files?.length);
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
          const answer = suggestField({ ...f, applicationSeason: applicationSeason(entry.job.title) }, entry.profile, entry.memory || [], location.origin, entry.job.company.trim().toLowerCase(), entry.portfolio?.knowledge);
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
          status.textContent = result.changed ? "The page changed. Scan again." : `${result.filled} answers filled; ${result.skipped} skipped. ${upload?.message || ""} Scan again for newly revealed follow-up questions. Nothing was submitted.`;
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
