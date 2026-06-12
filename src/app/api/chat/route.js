// src/app/api/chat/route.js

const sessions = new Map();

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { step: "start", history: [] });
  }
  return sessions.get(sessionId);
}

// ─── Smart number parser ───────────────────────────────────────────────────
function parseIndianNumber(val) {
  if (typeof val === "number") return val;
  const s = String(val).toLowerCase().replace(/,/g, "").trim();
  const crore = s.match(/^([\d.]+)\s*(cr|crore|c)$/);
  if (crore) return parseFloat(crore[1]) * 1_00_00_000;
  const lakh = s.match(/^([\d.]+)\s*(l|lakh|lac|lakhs)$/);
  if (lakh) return parseFloat(lakh[1]) * 1_00_000;
  const k = s.match(/^([\d.]+)\s*k$/);
  if (k) return parseFloat(k[1]) * 1000;
  const plain = parseFloat(s);
  return isNaN(plain) ? null : plain;
}

function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

function isValidPhone(val) {
  return /^[6-9]\d{9}$/.test(val.trim().replace(/\s+/g, ""));
}

// ─── SIP calculator (risk-aware) ──────────────────────────────────────────
function calculateSIP(income, savings, riskProfile) {
  const inc = parseFloat(income) || 0;
  const sav = parseFloat(savings) || 0;
  const disposable = inc - sav;
  if (disposable <= 0) return { low: 1000, high: 2000 };

  let lowPct = 0.15, highPct = 0.25;
  if (riskProfile === "Conservative") { lowPct = 0.10; highPct = 0.15; }
  if (riskProfile === "Moderate")     { lowPct = 0.15; highPct = 0.20; }
  if (riskProfile === "Aggressive")   { lowPct = 0.20; highPct = 0.30; }

  const low  = Math.round((disposable * lowPct)  / 500) * 500;
  const high = Math.round((disposable * highPct) / 500) * 500;
  return { low: Math.max(low, 500), high: Math.max(high, 1000) };
}

// ─── Corpus projection (flat SIP) ─────────────────────────────────────────
function projectCorpus(monthlySIP, years, riskProfile) {
  const annualRate =
    riskProfile === "Conservative" ? 0.08 :
    riskProfile === "Aggressive"   ? 0.12 : 0.10;
  const r = annualRate / 12;
  const n = years * 12;
  const corpus = monthlySIP * (((1 + r) ** n - 1) / r) * (1 + r);
  return Math.round(corpus);
}

// ─── Feature 5: Step-up SIP corpus projection ─────────────────────────────
// Simulates 10% annual SIP increase — month by month
function projectStepUpCorpus(initialSIP, years, riskProfile) {
  const annualRate =
    riskProfile === "Conservative" ? 0.08 :
    riskProfile === "Aggressive"   ? 0.12 : 0.10;
  const monthlyRate = annualRate / 12;
  let corpus = 0;
  let currentSIP = initialSIP;

  for (let year = 0; year < years; year++) {
    for (let month = 0; month < 12; month++) {
      corpus = (corpus + currentSIP) * (1 + monthlyRate);
    }
    // Increase SIP by 10% every year
    currentSIP = Math.round(currentSIP * 1.10);
  }
  return Math.round(corpus);
}

function formatINR(amount) {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  if (amount >= 1_00_000)    return `₹${(amount / 1_00_000).toFixed(2)} L`;
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

// ─── Risk profiling engine ─────────────────────────────────────────────────
function calculateRiskProfile(age, dependents, jobStability) {
  let score = 0;
  if (age <= 30)      score += 3;
  else if (age <= 45) score += 2;
  else if (age <= 55) score += 1;
  if (dependents === 0)      score += 3;
  else if (dependents <= 2)  score += 2;
  else                       score += 1;
  if (jobStability === "stable")       score += 3;
  else if (jobStability === "moderate") score += 2;
  else                                  score += 1;
  if (score >= 7) return "Aggressive";
  if (score >= 5) return "Moderate";
  return "Conservative";
}

function getRiskLabel(profile) {
  if (profile === "Aggressive") return "🔴 Aggressive";
  if (profile === "Moderate")   return "🟡 Moderate";
  return "🟢 Conservative";
}

function getRiskFundSuggestion(profile) {
  if (profile === "Aggressive") {
    return "Your portfolio can be weighted towards equity — flexi cap, mid cap, and small cap funds work well for long-term aggressive growth.";
  }
  if (profile === "Moderate") {
    return "A balanced mix of large cap equity and hybrid funds suits you — steady growth with manageable volatility.";
  }
  return "Debt funds, balanced advantage funds, and large cap funds are ideal — capital protection with steady returns.";
}

// ─── Smart follow-up rules ─────────────────────────────────────────────────
function getSmartFollowUp(income, savings, age, riskProfile, goal, timeline) {
  const savingRate = income > 0 ? savings / income : 0;
  const warnings = [];

  if (income >= 50000 && savingRate < 0.10) {
    warnings.push(
      "⚠️ We noticed your savings rate is below 10% of your income. " +
      "This could be due to EMIs, rent, or other expenses. " +
      "Our advisor can help you optimise your cash flow before starting a SIP."
    );
  }
  if (timeline < 3) {
    warnings.push(
      "⚠️ With a timeline of less than 3 years, equity mutual funds carry significant risk. " +
      "We'd recommend looking at debt funds, liquid funds, or FDs instead — " +
      "Sagefarm can help you pick the right short-term instrument."
    );
  }
  if ((goal.toLowerCase().includes("retire") || goal.toLowerCase().includes("retirement")) && age > 50) {
    warnings.push(
      "⚠️ You're planning retirement after 50 — time is critical here. " +
      "A combination of lump sum investing + monthly SIP can help you catch up faster. " +
      "Our advisor will prioritise your session given the urgency."
    );
  }
  if (riskProfile === "Aggressive" && timeline < 5) {
    warnings.push(
      "⚠️ Your risk profile is Aggressive, but your timeline is under 5 years. " +
      "This is a mismatch — equity needs time to recover from dips. " +
      "We may recommend a more balanced approach for your horizon."
    );
  }

  return warnings.length > 0 ? warnings.join("\n\n") : null;
}

// ─── Lead scoring ──────────────────────────────────────────────────────────
function scoreLead(income, savings, timeline) {
  const inc = parseFloat(income) || 0;
  const sav = parseFloat(savings) || 0;
  const savRate = inc > 0 ? sav / inc : 0;
  const yrs = parseFloat(timeline) || 0;

  let score = 0;
  if (inc >= 1_00_000)     score += 3;
  else if (inc >= 50_000)  score += 2;
  else if (inc >= 25_000)  score += 1;
  if (savRate >= 0.3)      score += 3;
  else if (savRate >= 0.2) score += 2;
  else if (savRate >= 0.1) score += 1;
  if (yrs >= 15)           score += 3;
  else if (yrs >= 7)       score += 2;
  else if (yrs >= 3)       score += 1;

  if (score >= 7) return "🔥 Hot";
  if (score >= 4) return "⚡ Warm";
  return "❄️ Cold";
}

// ─── IST timestamp ─────────────────────────────────────────────────────────
function getISTTimestamp() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Goal-aware tip ────────────────────────────────────────────────────────
function getGoalTip(goal, years) {
  const g = goal.toLowerCase();
  if (g.includes("retire") || g.includes("retirement")) {
    return years >= 15
      ? "📌 At Sagefarm, we believe retirement planning is a 20-year marathon. Equity-oriented portfolios with the right asset allocation work best over long horizons — and we handle the research so you don't have to."
      : "📌 With a shorter timeline, a conservative multi-asset allocation (equity + debt + gold) becomes important. Our advisors will build a glidepath that reduces risk as you approach your goal.";
  }
  if (g.includes("house") || g.includes("home") || g.includes("flat")) {
    return "📌 For a home purchase, we recommend separating your down payment corpus from your long-term wealth — each needs a different strategy. Our team will plan both in parallel.";
  }
  if (g.includes("child") || g.includes("education") || g.includes("kids") || g.includes("marriage")) {
    return "📌 Child goals require precision — the timeline is fixed and non-negotiable. Sagefarm builds goal-specific portfolios with step-up SIPs so your corpus is ready exactly when needed.";
  }
  if (g.includes("wealth") || g.includes("rich") || g.includes("grow") || g.includes("creation")) {
    return "📌 We follow a conservative long-term approach — picking undervalued, high-conviction funds from 2500+ schemes. Quality over quantity, always.";
  }
  return "📌 Sagefarm's philosophy: investing is a 20-year marathon, not a 6-month sprint. Consistency and the right asset mix make all the difference.";
}

// ─── Step order ────────────────────────────────────────────────────────────
const STEP_ORDER = [
  "start", "income", "savings",
  "emergency_fund",
  "existing_investments",
  "age", "dependents", "job_stability",
  "goal", "timeline",
  "conversion", "name", "email", "phone", "done"
];

function getPreviousStep(currentStep) {
  const idx = STEP_ORDER.indexOf(currentStep);
  if (idx <= 1) return null;
  return STEP_ORDER[idx - 1];
}

function getStepQuestion(step) {
  const questions = {
    income:               "What's your monthly income? (in ₹)",
    savings:              "How much do you save every month? (in ₹)",
    emergency_fund:       "Do you have an emergency fund?\n\nThis means 3–6 months of your expenses saved separately.\n\n• Yes, I have one\n• Partial — I have some\n• No, I don't",
    existing_investments: "Do you currently have any investments?\n\n• Yes — SIPs, stocks, FDs, PPF, gold, real estate, etc.\n• No — I'm starting fresh",
    age:                  "How old are you?",
    dependents:           "How many dependents do you have?\n\nType a number: 0, 1, 2, 3...",
    job_stability:        "How stable is your income?\n\n• Stable (salaried, government job)\n• Moderate (private job, some uncertainty)\n• Variable (freelance, business, commission-based)",
    goal:                 "What's your main financial goal?\n\n• Retirement\n• Buying a house\n• Wealth creation\n• Child's education",
    timeline:             "In how many years do you want to achieve this?",
  };
  return questions[step] || null;
}

// ─── Main handler ──────────────────────────────────────────────────────────
export async function POST(req) {
  const body = await req.json();
  const msg = (body.message || "").trim();
  const sessionId = body.sessionId;

  if (!sessionId) {
    return Response.json({ reply: "Session error. Please refresh the page." });
  }

  const userState = getSession(sessionId);
  const msgLower = msg.toLowerCase();
  let reply = "";

  // ── Global commands ────────────────────────────────────────────────────

  if (msgLower === "restart" || msgLower === "reset" || msgLower === "start over") {
    sessions.set(sessionId, { step: "income", history: [] });
    return Response.json({ reply: "Sure! Let's start fresh. 🔄\n\nWhat's your monthly income? (in ₹)" });
  }

  // ── Feature 6: Inactivity nudge handler ─────────────────────────────────
  if (msg === "__inactivity__") {
    // Only nudge if mid-conversation (not done or start)
    const activeSteps = ["income","savings","emergency_fund","existing_investments",
                         "age","dependents","job_stability","goal","timeline","conversion",
                         "name","email","phone"];
    if (!activeSteps.includes(userState.step)) {
      return Response.json({ reply: "" }); // no nudge if not mid-flow
    }
    const nudges = [
      "Still there? 😊 Take your time — I'm here whenever you're ready.",
      "No rush at all! Whenever you're ready, just continue. 🌿",
      "Just checking in — feel free to continue when you're ready! 👋",
    ];
    const nudge = nudges[Math.floor(Math.random() * nudges.length)];
    return Response.json({ reply: nudge });
  }

  if (msgLower === "help") {
    return Response.json({
      reply:
        "Here's what you can do:\n\n" +
        "• Type your answer to move forward\n" +
        "• Type 'back' to redo the previous question\n" +
        "• Type 'restart' to start over\n\n" +
        "Currently on step: " + userState.step,
    });
  }

  if (msgLower === "back" || msgLower === "go back") {
    const prevStep = getPreviousStep(userState.step);
    if (!prevStep) {
      return Response.json({ reply: "You're already at the beginning! Just answer the question above. 😊" });
    }
    delete userState[prevStep];
    userState.step = prevStep;
    const question = getStepQuestion(prevStep);
    return Response.json({ reply: `No problem! Let's redo this.\n\n${question}` });
  }

  // ── Step machine ───────────────────────────────────────────────────────

  // STEP 1 — Start
  if (userState.step === "start") {
    reply =
      "Hey 👋 Welcome to Sagefarm!\n\n" +
      "I'm your personal wealth planning assistant. I'll ask you a few quick questions — including a short risk profiling — and give you a personalised investment plan.\n\n" +
      "What's your monthly income? (in ₹)\n\n" +
      "💡 You can type amounts like: 50000, 50k, 1.5 lakh";
    userState.step = "income";
  }

  // STEP 2 — Income
  else if (userState.step === "income") {
    const parsed = parseIndianNumber(msg);
    if (!parsed || parsed <= 0) {
      reply = "I didn't catch that. Please enter your monthly income as a number.\n\nExamples: 45000 · 45k · 1.5 lakh";
    } else if (parsed < 5000) {
      reply = "That seems too low. Please enter your monthly income in rupees.\n\nExample: 25000 or 25k";
    } else {
      userState.income = parsed;
      reply = `Got it — ${formatINR(parsed)}/month 👍\n\nHow much do you save from this every month?`;
      userState.step = "savings";
    }
  }

  // STEP 3 — Savings
  else if (userState.step === "savings") {
    const parsed = parseIndianNumber(msg);
    if (!parsed || parsed <= 0) {
      reply = "Please enter your monthly savings as a number.\n\nExamples: 10000 · 10k · 0.5 lakh";
    } else if (parsed >= userState.income) {
      reply = `Your savings (${formatINR(parsed)}) can't be equal to or more than your income (${formatINR(userState.income)}) 😅\n\nHow much do you actually save per month?`;
    } else {
      userState.savings = parsed;
      const savingRate = Math.round((parsed / userState.income) * 100);
      const encouragement =
        savingRate >= 30 ? "Excellent saving habit! 🌟" :
        savingRate >= 20 ? "Good saving rate! 👍" :
        "Let's work with this and grow it over time. 💪";
      reply =
        `${formatINR(parsed)}/month saved — ${savingRate}% of your income. ${encouragement}\n\n` +
        `Quick question before we dive in — do you have an emergency fund?\n\n` +
        `This means 3–6 months of expenses saved separately, that you won't touch for investments.\n\n` +
        `• Yes, I have one\n• Partial — I have some\n• No, I don't`;
      userState.step = "emergency_fund";
    }
  }

  // STEP 4 — Emergency Fund
  else if (userState.step === "emergency_fund") {
    const hasYes     = ["yes", "yeah", "yep", "have", "i do", "got", "haan", "y"].some(w => msgLower.includes(w));
    const hasPartial = ["partial", "some", "little", "bit", "kuch", "thoda", "not fully", "not complete"].some(w => msgLower.includes(w));
    const hasNo      = ["no", "don't", "dont", "nahi", "nope", "n"].some(w => msgLower === w || msgLower.includes(w));

    if (hasPartial) {
      userState.emergencyFund = "partial";
      reply =
        "Good start! 👍 Having some buffer is better than none.\n\n" +
        "Ideally, aim to top it up to cover 6 months of expenses. " +
        "You can do this alongside your SIP — our advisors often split the initial allocation between an emergency liquid fund and a long-term SIP.\n\n" +
        "Before we dive into risk profiling, one more quick question.\n\nDo you currently have any investments?\n\n• Yes — SIPs, stocks, FDs, PPF, gold, real estate, etc.\n• No — I'm starting fresh";
    } else if (hasNo) {
      userState.emergencyFund = "no";
      const monthlyExpense = userState.income - userState.savings;
      const target = monthlyExpense * 3;
      reply =
        "Got it — no emergency fund yet. Let's fix that. 🛡️\n\n" +
        `Based on your income and savings, your monthly expenses are around ${formatINR(monthlyExpense)}.\n` +
        `A 3-month emergency fund would be ${formatINR(target)} — kept in a liquid fund or savings account, not invested.\n\n` +
        "The good news: you don't have to build it all at once. " +
        "Sagefarm advisors often recommend starting a small SIP and building your emergency fund in parallel — we'll plan this together.\n\n" +
        "For now, let's continue.\n\nDo you currently have any investments?\n\n• Yes — SIPs, stocks, FDs, PPF, gold, real estate, etc.\n• No — I'm starting fresh";
    } else if (hasYes) {
      userState.emergencyFund = "yes";
      reply =
        "Excellent — that's the right foundation! ✅\n\n" +
        "Having an emergency fund means your investments can stay untouched during tough times — " +
        "one of the biggest reasons people break their SIPs prematurely.\n\n" +
        "One more quick question.\n\nDo you currently have any investments?\n\n• Yes — SIPs, stocks, FDs, PPF, gold, real estate, etc.\n• No — I'm starting fresh";
    } else {
      reply = "Please choose one of the options:\n\n• Yes, I have one\n• Partial — I have some\n• No, I don't";
    }

    if (hasYes || hasPartial || hasNo) {
      userState.step = "existing_investments";
    }
  }

  // STEP 5 — Existing Investments
  else if (userState.step === "existing_investments") {
    const hasYesInv = ["yes", "yeah", "yep", "have", "i do", "got", "haan", "sip", "fd", "stock", "gold", "ppf", "mutual", "real estate", "property"].some(w => msgLower.includes(w));
    const hasNoInv  = ["no", "don't", "dont", "nahi", "nope", "fresh", "starting", "nothing", "none"].some(w => msgLower.includes(w));

    if (hasYesInv) {
      userState.existingInvestments = "yes";
      reply =
        "Great — you already have some investments! 💼\n\n" +
        "Sagefarm specialises in portfolio review and optimisation. " +
        "Our advisors will analyse what you already hold, identify gaps, remove underperformers, " +
        "and build a cohesive strategy across all your assets — not just add more SIPs on top.\n\n" +
        "Now let's understand your risk appetite.\n\nHow old are you?";
    } else if (hasNoInv) {
      userState.existingInvestments = "no";
      reply =
        "Starting fresh — that's actually a great position to be in! 🌱\n\n" +
        "You get to build the right portfolio from the ground up, without any legacy products to untangle. " +
        "Sagefarm will design your entire investment strategy from scratch.\n\n" +
        "Let's understand your risk appetite first.\n\nHow old are you?";
    } else {
      reply =
        "Please let me know:\n\n" +
        "• Yes — SIPs, stocks, FDs, PPF, gold, real estate, etc.\n" +
        "• No — I'm starting fresh";
    }

    if (hasYesInv || hasNoInv) userState.step = "age";
  }

  // STEP 6 — Age
  else if (userState.step === "age") {
    const age = parseInt(msg);
    if (isNaN(age) || age < 0 || age > 99) {
      reply = "Please enter a valid age between 0 and 99.";
    } else {
      userState.age = age;
      reply =
        `Got it 👍\n\n` +
        `How many dependents do you have?\n(Spouse, children, or parents who rely on your income)\n\n` +
        `Type a number: 0, 1, 2, 3...`;
      userState.step = "dependents";
    }
  }

  // STEP 7 — Dependents
  else if (userState.step === "dependents") {
    const dep = parseInt(msg);
    if (isNaN(dep) || dep < 0 || dep > 20) {
      reply = "Please enter a valid number. For example: 0, 1, 2, 3";
    } else {
      userState.dependents = dep;
      reply =
        `Understood.\n\n` +
        `Last risk question — how stable is your income?\n\n` +
        `• Stable — salaried, government job\n` +
        `• Moderate — private job with some uncertainty\n` +
        `• Variable — freelance, business, commission-based`;
      userState.step = "job_stability";
    }
  }

  // STEP 8 — Job Stability → compute risk profile
  else if (userState.step === "job_stability") {
    let stability = null;
    if (msgLower.includes("stable") || msgLower.includes("salaried") || msgLower.includes("government") || msgLower === "1") {
      stability = "stable";
    } else if (msgLower.includes("moderate") || msgLower.includes("private") || msgLower === "2") {
      stability = "moderate";
    } else if (msgLower.includes("variable") || msgLower.includes("freelance") || msgLower.includes("business") || msgLower.includes("commission") || msgLower === "3") {
      stability = "variable";
    }

    if (!stability) {
      reply = "Please choose one of the options:\n\n• Stable\n• Moderate\n• Variable";
    } else {
      userState.jobStability = stability;
      const profile = calculateRiskProfile(userState.age, userState.dependents, stability);
      userState.riskProfile = profile;
      const fundSuggestion = getRiskFundSuggestion(profile);
      reply =
        `Now let's set your goal. What's your main financial goal?\n\n` +
        `• Retirement\n• Buying a house\n• Wealth creation\n• Child's education`;
      userState.step = "goal";
    }
  }

  // STEP 9 — Goal
  else if (userState.step === "goal") {
    if (msg.length < 2) {
      reply = "Please tell me your goal.\n\nFor example: Retirement, Buying a house, Wealth creation";
    } else {
      userState.goal = msg;
      reply = `"${msg}" — great goal! 🎯\n\nIn how many years do you want to achieve this?`;
      userState.step = "timeline";
    }
  }

  // STEP 10 — Timeline + SIP Plan + Feature 5 Step-up SIP
  else if (userState.step === "timeline") {
    const years = parseFloat(msg);
    if (isNaN(years) || years < 1 || years > 50) {
      reply = "Please enter a number of years between 1 and 50.\n\nExample: 10";
    } else {
      userState.timeline = years;
      try {
        const profile = userState.riskProfile || "Moderate";
        const { low, high } = calculateSIP(userState.income, userState.savings, profile);

        // Flat SIP corpus
        const corpusLow  = projectCorpus(low,  years, profile);
        const corpusHigh = projectCorpus(high, years, profile);

        // Always show flat corpus at 12% for illustration
        const corpusLowEx  = projectCorpus(low,  years, "Aggressive");
        const corpusHighEx = projectCorpus(high, years, "Aggressive");

        // ── Feature 5: Step-up SIP corpus ──────────────────────────────
        const stepUpCorpusLow  = projectStepUpCorpus(low,  years, profile);
        const stepUpCorpusHigh = projectStepUpCorpus(high, years, profile);
        const stepUpLowFinal   = Math.round(low  * (1.10 ** years)); // SIP after step-ups
        const stepUpHighFinal  = Math.round(high * (1.10 ** years));

        const tip = getGoalTip(userState.goal, years);
        const annualReturn =
          profile === "Conservative" ? "8%" :
          profile === "Aggressive"   ? "12%" : "10%";

        const followUpWarning = getSmartFollowUp(
          userState.income, userState.savings,
          userState.age, profile,
          userState.goal, years
        );

        reply =
          `Here's your personalised plan 📊\n\n` +
          `Income:       ${formatINR(userState.income)}/month\n` +
          `Savings:      ${formatINR(userState.savings)}/month\n` +
          `` +
          `Goal:         ${userState.goal}\n` +
          `Timeline:     ${years} years\n\n` +
          `💡 **AI Suggested SIP: ${formatINR(low)} – ${formatINR(high)}/month**\n\n` +
          `📈 For example, at 12% p.a. your flat SIP grows to:\n` +
          `   ${formatINR(low)}/month → ${formatINR(corpusLowEx)}\n` +
          `   ${formatINR(high)}/month → ${formatINR(corpusHighEx)}\n\n` +
          `🚀 Step-up SIP corpus (10% increase every year):\n` +
          `   Start ${formatINR(low)}/month → corpus ${formatINR(stepUpCorpusLow)}\n` +
          `   Start ${formatINR(high)}/month → corpus ${formatINR(stepUpCorpusHigh)}\n\n` +
          `💡 **Step-up SIP builds ${formatINR(stepUpCorpusHigh - corpusHigh)} more wealth than a flat SIP!**\n\n` +
          `(Projected at ${annualReturn} p.a. — based on historical Nifty 50 long-term average returns)\n\n` +
          `${tip}\n\n` +
          (followUpWarning ? `${followUpWarning}\n\n` : "") +
          `💡 **Sagefarm advisors go beyond the numbers.** They look at your full financial life — income, expenses, loans, goals, and tax situation — and build a plan designed to make every rupee work harder for you. **Clients who invest with a personalised strategy consistently get better returns than those who invest without a strategy.** \n \n 👉 **Type YES to connect with a Sagefarm advisor and unlock your full potential** — or no to keep this as your reference plan. 🌿`;
      } catch (e) {
        console.error("SIP calculation error:", e);
        reply =
          `Thanks! Based on your inputs, a Sagefarm advisor will prepare a personalised plan for you.\n\n` +
          `👉 Would you like them to reach out? (yes/no)`;
      }
      userState.step = "conversion";
    }
  }

  // STEP 11 — Conversion
  else if (userState.step === "conversion") {
    const yes = ["yes", "yeah", "yep", "sure", "ok", "okay", "haan", "ha", "yup", "definitely", "y"].some(
      (w) => msgLower === w || msgLower.startsWith(w + " ")
    );
    if (!yes) {
      reply =
        "No problem at all! The numbers above are yours to keep. 😊\n\n" +
        "Whenever you're ready to take the next step, Sagefarm's advisors are here — no rush, no pressure.\n\n" +
        "Visit sagefarm.in or type 'restart' to plan again.";
      userState.step = "done";
    } else {
      reply =
        "That's a great decision! 🙌\n\n" +
        "A Sagefarm advisor will personally reach out for a detailed session.\n\n" +
        "First, what's your name?";
      userState.step = "name";
    }
  }

  // STEP 12 — Name
  else if (userState.step === "name") {
    if (msg.length < 2 || /\d/.test(msg)) {
      reply = "Please enter your real name (no numbers). Example: Rahul";
    } else {
      userState.name = msg;
      reply =
        `Lovely name, ${msg}! 😊\n\n` +
        `What's your email address?\n\nWe'll send you a summary of this plan and our advisor will follow up from here.`;
      userState.step = "email";
    }
  }

  // STEP 13 — Email
  else if (userState.step === "email") {
    if (!isValidEmail(msg)) {
      reply = "That doesn't look right. Please enter a valid email.\n\nExample: rahul@gmail.com";
    } else {
      userState.email = msg;
      reply = "Perfect 👍\n\nLastly, your WhatsApp number so our advisor can reach you directly:";
      userState.step = "phone";
    }
  }

  // STEP 14 — Phone + Lead capture
  else if (userState.step === "phone") {
    const cleaned = msg.replace(/\s+/g, "").replace(/^(\+91|91)/, "");
    if (!isValidPhone(cleaned)) {
      reply = "Please enter a valid 10-digit Indian mobile number.\n\nExample: 9876543210";
    } else {
      userState.phone = cleaned;
      const leadScore = scoreLead(userState.income, userState.savings, userState.timeline);

      const payload = {
        name:                userState.name,
        email:               userState.email,
        phone:               userState.phone,
        income:              userState.income,
        savings:             userState.savings,
        emergencyFund:       userState.emergencyFund,
        existingInvestments: userState.existingInvestments,
        age:                 userState.age,
        dependents:          userState.dependents,
        jobStability:        userState.jobStability,
        riskProfile:         userState.riskProfile,
        goal:                userState.goal,
        timeline:            userState.timeline,
        leadScore:           leadScore,
        source:              "Website Chatbot",
        timestamp:           getISTTimestamp(),
      };

      try {
        const res = await fetch(process.env.GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: JSON.stringify(payload) }).toString(),
        });
        const result = await res.text();
        if (result === "DUPLICATE") {
          console.log("⚠️ Duplicate lead:", cleaned);
        } else {
          console.log("✅ Lead stored:", userState.name, "| Risk:", userState.riskProfile, "| Score:", leadScore);
        }
      } catch (error) {
        console.error("❌ Error saving lead:", error);
      }

      const hasExisting = userState.existingInvestments === "yes";
      reply =
        `You're all set, ${userState.name}! ✅\n\n` +
        `A Sagefarm advisor will contact you on WhatsApp (${cleaned}) within 24 hours.\n\n` +
        `Here's what to expect:\n` +
        (hasExisting
          ? `• Portfolio review — we'll analyse what you already hold and optimise it\n` +
            `• Identify gaps, remove underperformers, and build a unified strategy\n`
          : `• Build your investment portfolio from scratch — the right way\n` +
            `• Allocation across MFs, gold, FDs & more based on your ${userState.riskProfile} profile\n`
        ) +
        `• Curated fund selection from our in-house research — not generic advice\n\n` +
        `Remember: wealth is built over decades, not days. You've taken the first step. 🌱\n\n` +
        `Type 'restart' to create a plan for someone else.`;
      userState.step = "done";
    }
  }

  // DONE
  else {
    reply =
      "We've already saved your details! 😊\n\n" +
      "A Sagefarm advisor will be in touch shortly.\n\n" +
      "Type 'restart' to create a plan for someone else.";
  }

  return Response.json({ reply });
}