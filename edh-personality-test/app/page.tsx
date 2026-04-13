"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "en" | "fr" | "nl";

interface StatValues {
  power?: number;
  consistency?: number;
  oppression?: number;
  explosion?: number;
  interaction?: number;
  linear?: number;
}

interface Answer {
  label: Record<Lang, string>;
  values: StatValues;
}

interface Question {
  text: Record<Lang, string>;
  answers: Answer[];
}

interface ComputedStats {
  power: number;
  consistency: number;
  oppression: number;
  explosion: number;
  interaction: number;
  linear: number;
}

interface ComputedResult {
  main: PersonalityKey;
  others: PersonalityKey[];
  bracket: BracketKey;
  mod: string;
  label: string;
  text: string;
  stats: ComputedStats;
}

type BracketKey = "B1" | "B2" | "B3" | "B4" | "B5";
type PersonalityKey =
  | "Oppressif"
  | "Explosif"
  | "Combo"
  | "Contrôle"
  | "Chaotique"
  | "Agressif"
  | "Midrange"
  | "Équilibré";

// ─── Static data ──────────────────────────────────────────────────────────────

const BRACKET_COLORS: Record<BracketKey, { bg: string; text: string; border: string }> = {
  B1: { bg: "#EAF3DE", text: "#3B6D11", border: "#97C459" },
  B2: { bg: "#E6F1FB", text: "#185FA5", border: "#85B7EB" },
  B3: { bg: "#FAEEDA", text: "#854F0B", border: "#EF9F27" },
  B4: { bg: "#FAECE7", text: "#993C1D", border: "#F0997B" },
  B5: { bg: "#FCEBEB", text: "#A32D2D", border: "#F09595" },
};

const BRACKET_LABELS: Record<BracketKey, Record<Lang, string>> = {
  B1: { en: "Casual / Precon", fr: "Casual / Précon", nl: "Casual / Precon" },
  B2: { en: "Upgraded Precon", fr: "Précon Upgradé", nl: "Geüpgraded Precon" },
  B3: { en: "Focused Build", fr: "Build Focalisé", nl: "Gefocuste Build" },
  B4: { en: "Highly Optimized", fr: "Très Optimisé", nl: "Sterk Geoptimaliseerd" },
  B5: { en: "cEDH", fr: "cEDH", nl: "cEDH" },
};

const BRACKET_DESCS: Record<BracketKey, Record<Lang, string>> = {
  B1: {
    en: "Precon-level or casual jank. Slow, fun, and forgiving.",
    fr: "Niveau précon ou jank casual. Lent, fun et tolérant.",
    nl: "Precon-niveau of casual jank. Traag, leuk en vergevingsgezind.",
  },
  B2: {
    en: "Upgraded precon or focused theme deck. No fast combos.",
    fr: "Précon upgradé ou deck thématique cohérent. Pas de combo rapide.",
    nl: "Geüpgraded precon of thematisch deck. Geen snelle combo's.",
  },
  B3: {
    en: "Tuned synergy deck. Reliable win condition, some interaction.",
    fr: "Deck synergie construit. Condition de victoire fiable, quelques interactions.",
    nl: "Afgestemd synergiedeck. Betrouwbare wincondities, wat interactie.",
  },
  B4: {
    en: "Highly optimized. Fast, consistent, strong interaction, can close early.",
    fr: "Très optimisé. Rapide, consistant, bonne interaction, peut gagner tôt.",
    nl: "Sterk geoptimaliseerd. Snel en consistent, sterke interactie.",
  },
  B5: {
    en: "cEDH-tier. Turn 3–4 kills, free spells, tutors, stax, full combo redundancy.",
    fr: "Niveau cEDH. Victoire T3–T4, free spells, tuteurs, stax, redondance combo.",
    nl: "cEDH-niveau. Winst op beurt 3–4, free spells, tutors, stax, combo-redundantie.",
  },
};

const PERSONALITY_LABELS: Record<PersonalityKey, Record<Lang, string>> = {
  Oppressif:  { en: "Oppressive",  fr: "Oppressif",  nl: "Onderdrukkend" },
  Explosif:   { en: "Explosive",   fr: "Explosif",   nl: "Explosief" },
  Combo:      { en: "Combo",       fr: "Combo",      nl: "Combo" },
  "Contrôle": { en: "Control",     fr: "Contrôle",   nl: "Controle" },
  Chaotique:  { en: "Chaotic",     fr: "Chaotique",  nl: "Chaotisch" },
  Agressif:   { en: "Aggressive",  fr: "Agressif",   nl: "Agressief" },
  Midrange:   { en: "Midrange",    fr: "Midrange",   nl: "Midrange" },
  "Équilibré":{ en: "Balanced",    fr: "Équilibré",  nl: "Evenwichtig" },
};

// Max possible values per stat (sum of max answer values across all questions)
const STAT_MAX: Record<keyof ComputedStats, number> = {
  power: 65,       // questions 1+3+4+5+8 max: 10+10+9+9+9 = 47... but multi-question contributions
  consistency: 21, // questions 2+4+8 max: 9+6+6 = 21
  explosion: 24,   // questions 1+3+7+8 max: 6+6+6+6 = 24 (adjusted)
  oppression: 9,
  interaction: 9,
  linear: 6,
};

// ─── Questions ────────────────────────────────────────────────────────────────

const questions: Question[] = [
  {
    text: {
      en: "⏱️ When does your deck typically win?",
      fr: "⏱️ À quel tour ton deck gagne habituellement ?",
      nl: "⏱️ Wanneer wint je deck doorgaans?",
    },
    answers: [
      { label: { en: "🐢 Turn 9+ — grind it out", fr: "🐢 Tour 9+ — longue partie", nl: "🐢 Beurt 9+ — lange partij" }, values: { power: 0, explosion: 0 } },
      { label: { en: "⚖️ Turn 7–8 — mid-to-late game", fr: "⚖️ Tour 7–8 — milieu/fin de partie", nl: "⚖️ Beurt 7–8 — midden/laat spel" }, values: { power: 3, explosion: 1 } },
      { label: { en: "⚡ Turn 5–6 — tempo finish", fr: "⚡ Tour 5–6 — finish tempo", nl: "⚡ Beurt 5–6 — tempoversnelling" }, values: { power: 6, explosion: 3 } },
      { label: { en: "💀 Turn 3–4 — fast combo/aggro", fr: "💀 Tour 3–4 — combo/aggro rapide", nl: "💀 Beurt 3–4 — snelle combo/aggro" }, values: { power: 10, explosion: 6 } },
    ],
  },
  {
    text: {
      en: "🔁 How consistent is your gameplan?",
      fr: "🔁 À quel point ton plan de jeu est-il consistant ?",
      nl: "🔁 Hoe consistent is je spelplan?",
    },
    answers: [
      { label: { en: "🎲 Different game every time", fr: "🎲 Jamais pareil d'une partie à l'autre", nl: "🎲 Elke partij anders" }, values: { consistency: 0, linear: 0 } },
      { label: { en: "🔄 Roughly stable plan", fr: "🔄 Plan globalement stable", nl: "🔄 Ruwweg stabiel plan" }, values: { consistency: 3, linear: 1 } },
      { label: { en: "🎯 Reliable — minor variance", fr: "🎯 Fiable — légère variance", nl: "🎯 Betrouwbaar — kleine variantie" }, values: { consistency: 6, linear: 2 } },
      { label: { en: "🧠 Virtually scripted every game", fr: "🧠 Pratiquement scripté à chaque partie", nl: "🧠 Vrijwel gescript elke partij" }, values: { consistency: 9, linear: 3 } },
    ],
  },
  {
    text: {
      en: "🧬 How does your deck win?",
      fr: "🧬 Comment ton deck gagne-t-il ?",
      nl: "🧬 Hoe wint je deck?",
    },
    answers: [
      { label: { en: "🐌 Beat down / attrition", fr: "🐌 Créatures / attrition", nl: "🐌 Aanvallen / uitputting" }, values: { power: 0, explosion: 0 } },
      { label: { en: "⚔️ Synergy package (no hard combo)", fr: "⚔️ Synergie (pas de combo à deux pièces)", nl: "⚔️ Synergiepakket (geen harde combo)" }, values: { power: 4, explosion: 2 } },
      { label: { en: "💣 Infinite combo (3+ pieces)", fr: "💣 Combo infini (3+ pièces)", nl: "💣 Oneindige combo (3+ stukken)" }, values: { power: 7, explosion: 4 } },
      { label: { en: "☠️ 2-piece instant-win combo", fr: "☠️ Combo victoire en 2 pièces", nl: "☠️ 2-delige directe win-combo" }, values: { power: 10, explosion: 6 } },
    ],
  },
  {
    text: {
      en: "🔍 Card access — tutors and draw?",
      fr: "🔍 Accès aux cartes — tuteurs et pioche ?",
      nl: "🔍 Toegang tot kaarten — tutors en draw?",
    },
    answers: [
      { label: { en: "🎲 Minimal draw, no tutors", fr: "🎲 Pioche limitée, aucun tuteur", nl: "🎲 Minimale draw, geen tutors" }, values: { power: 0, consistency: 0 } },
      { label: { en: "🔎 Some draw, no tutors", fr: "🔎 Un peu de pioche, pas de tuteurs", nl: "🔎 Wat draw, geen tutors" }, values: { power: 3, consistency: 2 } },
      { label: { en: "📚 Good draw + 1–3 tutors", fr: "📚 Bonne pioche + 1–3 tuteurs", nl: "📚 Goede draw + 1–3 tutors" }, values: { power: 6, consistency: 4 } },
      { label: { en: "🧠 Massive draw + full tutor suite", fr: "🧠 Pioche massive + tuteurs complets", nl: "🧠 Diepe draw + volledig tutorpakket" }, values: { power: 9, consistency: 6 } },
    ],
  },
  {
    text: {
      en: "💸 Mana base & acceleration?",
      fr: "💸 Base de mana et accélération ?",
      nl: "💸 Mana base en mana-versnelling?",
    },
    answers: [
      { label: { en: "💼 Basic lands, cheap rocks", fr: "💼 Terrains de base, accélération basique", nl: "💼 Basislanden, eenvoudige mana" }, values: { power: 0 } },
      { label: { en: "💰 Some duals, 2-mana rocks", fr: "💰 Quelques doubles terrains, rocks 2", nl: "💰 Enkele duals, 2-mana rocks" }, values: { power: 3 } },
      { label: { en: "💎 Shocks/checks, Sol Ring + rocks", fr: "💎 Shocks/checks, Sol Ring + rocks", nl: "💎 Shocks/checks, Sol Ring + rocks" }, values: { power: 6 } },
      { label: { en: "🏦 Fetch + ABU duals + 1-mana rocks", fr: "🏦 Fetchs + doubles ABU + rocks 1 mana", nl: "🏦 Fetches + ABU duals + 1-mana rocks" }, values: { power: 9 } },
    ],
  },
  {
    text: {
      en: "⚔️ Interaction — removal, counters, stax?",
      fr: "⚔️ Interaction — suppression, contresorts, stax ?",
      nl: "⚔️ Interactie — removal, counters, stax?",
    },
    answers: [
      { label: { en: "😊 Basically none — goldfishing", fr: "😊 Quasiment aucune — goldfish", nl: "😊 Vrijwel geen — goldfishing" }, values: { interaction: 0, oppression: 0 } },
      { label: { en: "⚖️ Light removal / a few counters", fr: "⚖️ Suppression légère / quelques contresorts", nl: "⚖️ Lichte removal / wat counters" }, values: { interaction: 2, oppression: 0 } },
      { label: { en: "🧱 Strong removal + counterspell suite", fr: "🧱 Suppression forte + suite de contresorts", nl: "🧱 Sterke removal + counterspells" }, values: { interaction: 4, oppression: 3 } },
      { label: { en: "🚫 Stax, tax effects, or hard locks", fr: "🚫 Stax, effets taxe ou verrous durs", nl: "🚫 Stax, belastingeffecten of harde locks" }, values: { interaction: 5, oppression: 6 } },
    ],
  },
  {
    text: {
      en: "🔥 Pressure & explosive turns?",
      fr: "🔥 Pression sur la table et tours explosifs ?",
      nl: "🔥 Druk op tafel en explosieve beurten?",
    },
    answers: [
      { label: { en: "🌱 Passive / slow build", fr: "🌱 Passif / construction lente", nl: "🌱 Passief / langzame opbouw" }, values: { explosion: 0 } },
      { label: { en: "⚖️ Moderate — recoverable", fr: "⚖️ Modérée — récupérable", nl: "⚖️ Matig — herstelbaar" }, values: { explosion: 2 } },
      { label: { en: "🔥 Heavy threat, hard to answer", fr: "🔥 Menace lourde, difficile à répondre", nl: "🔥 Zware dreiging, moeilijk te beantwoorden" }, values: { explosion: 4 } },
      { label: { en: "⏱️ Kills immediately if unanswered", fr: "⏱️ Tue immédiatement si non répondu", nl: "⏱️ Wint direct als niet beantwoord" }, values: { explosion: 6 } },
    ],
  },
  {
    text: {
      en: "💥 Format staple optimization?",
      fr: "💥 Optimisation avec les staples du format ?",
      nl: "💥 Optimalisatie met format staples?",
    },
    answers: [
      { label: { en: "🐌 Budget build — no staples", fr: "🐌 Build budget — pas de staples", nl: "🐌 Budget build — geen staples" }, values: { power: 0 } },
      { label: { en: "⚖️ Some staples (Sol Ring, Rhystic...)", fr: "⚖️ Quelques staples (Sol Ring, Rhystic...)", nl: "⚖️ Wat staples (Sol Ring, Rhystic...)" }, values: { power: 3 } },
      { label: { en: "💣 Most staples included", fr: "💣 La plupart des staples inclus", nl: "💣 Meeste staples aanwezig" }, values: { power: 6 } },
      { label: { en: "☠️ Power 9 + reserved list cards", fr: "☠️ Power 9 + reserved list", nl: "☠️ Power 9 + reserved list" }, values: { power: 9 } },
    ],
  },
  {
    text: {
      en: "🧠 Deck difficulty & ceiling?",
      fr: "🧠 Difficulté / plafond du deck ?",
      nl: "🧠 Moeilijkheidsgraad / plafond?",
    },
    answers: [
      { label: { en: "😊 Straightforward — autopilot", fr: "😊 Simple — peut tourner en autopilote", nl: "😊 Eenvoudig — automatische piloot" }, values: { } },
      { label: { en: "🎯 Some sequencing decisions", fr: "🎯 Quelques décisions de séquencement", nl: "🎯 Enkele volgordebeslissingen" }, values: { } },
      { label: { en: "🧩 Deep lines, tight resource management", fr: "🧩 Lignes profondes, gestion serrée des ressources", nl: "🧩 Diepe lijnen, strak resourcebeheer" }, values: { } },
      { label: { en: "🧠 Expert — extensive decision trees", fr: "🧠 Expert — arbres de décisions complexes", nl: "🧠 Expert — uitgebreide beslisbomen" }, values: { } },
    ],
  },
  {
    text: {
      en: "🎭 Intended play environment?",
      fr: "🎭 Environnement de jeu visé ?",
      nl: "🎭 Beoogde speelomgeving?",
    },
    answers: [
      { label: { en: "🎲 Themed / casual — just for fun", fr: "🎲 Thématique / casual — juste pour s'amuser", nl: "🎲 Thematisch / casual — gewoon voor de lol" }, values: { } },
      { label: { en: "😊 Balanced casual — win, but not at all costs", fr: "😊 Casual équilibré — gagner, mais pas à tout prix", nl: "😊 Evenwichtig casual — winnen maar niet ten koste van alles" }, values: { } },
      { label: { en: "⚖️ Optimized pod — competitive casual", fr: "⚖️ Pod optimisé — casual compétitif", nl: "⚖️ Geoptimaliseerde pod — competitief casual" }, values: { } },
      { label: { en: "🏆 cEDH / full competitive pod", fr: "🏆 cEDH / pod totalement compétitif", nl: "🏆 cEDH / volledig competitieve pod" }, values: { } },
    ],
  },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeResult(selectedAnswers: Answer[]): ComputedResult {
  const t: ComputedStats = {
    power: 0, consistency: 0, oppression: 0,
    explosion: 0, interaction: 0, linear: 0,
  };

  selectedAnswers.forEach((a) => {
    (Object.entries(a.values) as [keyof StatValues, number][]).forEach(([k, v]) => {
      if (k in t) t[k as keyof ComputedStats] += v ?? 0;
    });
  });

  // Power is the primary bracket determinant; max possible = 46 across power-contributing questions
  const MAX_POWER = 46;
  const pct = t.power / MAX_POWER;

  let bracket: BracketKey = "B1";
  if      (pct >= 0.82) bracket = "B5";
  else if (pct >= 0.62) bracket = "B4";
  else if (pct >= 0.40) bracket = "B3";
  else if (pct >= 0.20) bracket = "B2";

  // Modifier driven by consistency + linearity
  const lin = t.consistency + t.linear;
  const mod = lin >= 14 ? "+" : lin <= 4 ? "-" : "";

  const personalities: PersonalityKey[] = [];
  if (t.oppression >= 5)                            personalities.push("Oppressif");
  if (t.explosion >= 10)                            personalities.push("Explosif");
  if (t.explosion >= 7 && t.consistency >= 7)       personalities.push("Combo");
  if (t.interaction >= 4)                           personalities.push("Contrôle");
  if (t.consistency <= 3 && t.linear <= 1)          personalities.push("Chaotique");
  if (t.explosion >= 5 && t.oppression <= 3)        personalities.push("Agressif");
  if (personalities.length === 0) {
    personalities.push(t.consistency >= 8 ? "Midrange" : "Équilibré");
  }

  const label = `${bracket}${mod}`;

  return {
    main: personalities[0],
    others: personalities.slice(1),
    bracket,
    mod,
    label,
    text: `${label} — ${personalities.map((p) => PERSONALITY_LABELS[p].en).join(", ")}`,
    stats: t,
  };
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const STAT_DISPLAY: { key: keyof ComputedStats; label: Record<Lang, string>; color: string }[] = [
  { key: "power",       label: { en: "Power",       fr: "Puissance",   nl: "Kracht"       }, color: "#378ADD" },
  { key: "consistency", label: { en: "Consistency", fr: "Consistance", nl: "Consistentie" }, color: "#1D9E75" },
  { key: "explosion",   label: { en: "Speed",        fr: "Vitesse",     nl: "Snelheid"     }, color: "#D85A30" },
  { key: "oppression",  label: { en: "Oppression",  fr: "Oppression",  nl: "Onderdrukking"}, color: "#A32D2D" },
  { key: "interaction", label: { en: "Interaction", fr: "Interaction", nl: "Interactie"   }, color: "#7F77DD" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Page() {
  const [lang, setLang]       = useState<Lang>("en");
  const [step, setStep]       = useState<number>(-1);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const selectAnswer = (answer: Answer) => {
    const next = [...answers];
    next[step] = answer;
    setAnswers(next);
    setStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else setStep(-1);
  };

  const restart = () => {
    setStep(-1);
    setAnswers([]);
  };

  const result = step >= questions.length ? computeResult(answers) : null;
  const progress = step < 0 ? 0 : Math.round((step / questions.length) * 100);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-xl bg-slate-800 p-6 rounded-2xl space-y-4">

        {/* Language selector */}
        <div className="flex justify-center gap-3">
          {(["en", "fr", "nl"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-xl px-3 py-1 rounded-lg transition-colors ${
                lang === l ? "bg-blue-500" : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {l === "en" && "🇬🇧"}
              {l === "fr" && "🇫🇷"}
              {l === "nl" && "🇳🇱"}
            </button>
          ))}
        </div>

        {/* ── Start screen ─────────────────────────────── */}
        {step === -1 && (
          <div className="text-center space-y-4 py-4">
            <h1 className="text-2xl font-bold">
              {lang === "en" && "EDH Power Level"}
              {lang === "fr" && "Niveau de Puissance EDH"}
              {lang === "nl" && "EDH Krachtmeting"}
            </h1>
            <p className="text-slate-400 text-sm">
              {lang === "en" && "10 questions to evaluate your Commander deck — bracket B1 to B5."}
              {lang === "fr" && "10 questions pour évaluer ton deck Commander — bracket B1 à B5."}
              {lang === "nl" && "10 vragen om je Commander deck te beoordelen — bracket B1 tot B5."}
            </p>
            <button
              onClick={() => setStep(0)}
              className="bg-blue-500 hover:bg-blue-400 transition-colors px-8 py-3 rounded-xl font-semibold"
            >
              🎴{" "}
              {lang === "en" && "Evaluate my deck"}
              {lang === "fr" && "Évaluer mon deck"}
              {lang === "nl" && "Mijn deck evalueren"}
            </button>
          </div>
        )}

        {/* ── Question screen ───────────────────────────── */}
        {step >= 0 && step < questions.length && (
          <>
            {/* Progress bar */}
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <h2 className="text-lg font-semibold">{questions[step].text[lang]}</h2>

            <div className="space-y-2">
              {questions[step].answers.map((answer, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(answer)}
                  className="w-full p-3 bg-slate-700 hover:bg-blue-500 transition-colors rounded-xl text-left"
                >
                  {answer.label[lang]}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm text-slate-400 pt-1">
              <button onClick={goBack} className="hover:text-white transition-colors">
                ← {lang === "en" ? "Back" : lang === "fr" ? "Retour" : "Terug"}
              </button>
              <span>{step + 1} / {questions.length}</span>
            </div>
          </>
        )}

        {/* ── Result screen ─────────────────────────────── */}
        {result && (
          <div className="space-y-4">
            {/* Bracket badge */}
            <div className="text-center">
              <span
                className="inline-block text-3xl font-bold px-6 py-2 rounded-xl"
                style={{
                  backgroundColor: BRACKET_COLORS[result.bracket].bg,
                  color: BRACKET_COLORS[result.bracket].text,
                  border: `1.5px solid ${BRACKET_COLORS[result.bracket].border}`,
                }}
              >
                {result.label}
              </span>
            </div>

            {/* Bracket name + description */}
            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">
                {BRACKET_LABELS[result.bracket][lang]}
              </p>
              <p className="text-sm text-slate-400">
                {BRACKET_DESCS[result.bracket][lang]}
              </p>
            </div>

            {/* Main personality */}
            <div className="text-center">
              <span className="inline-block bg-slate-700 px-4 py-1.5 rounded-full font-semibold">
                {PERSONALITY_LABELS[result.main][lang]}
              </span>
            </div>

            {/* Secondary personalities */}
            {result.others.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {result.others.map((p) => (
                  <span key={p} className="bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-300">
                    {PERSONALITY_LABELS[p][lang]}
                  </span>
                ))}
              </div>
            )}

            {/* Stat bars */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {STAT_DISPLAY.map(({ key, label, color }) => {
                const val = result.stats[key];
                const max = STAT_MAX[key];
                const pct = Math.round((val / max) * 100);
                return (
                  <div key={key} className="bg-slate-700 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{label[lang]}</span>
                      <span className="font-semibold" style={{ color }}>{val}</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => navigator.clipboard.writeText(result.text)}
                className="flex-1 bg-green-600 hover:bg-green-500 transition-colors px-4 py-2 rounded-xl text-sm font-semibold"
              >
                📋{" "}
                {lang === "en" ? "Copy result" : lang === "fr" ? "Copier" : "Kopieer"}
              </button>
              <button
                onClick={restart}
                className="flex-1 bg-red-700 hover:bg-red-600 transition-colors px-4 py-2 rounded-xl text-sm font-semibold"
              >
                🔄{" "}
                {lang === "en" ? "Restart" : lang === "fr" ? "Recommencer" : "Opnieuw"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
