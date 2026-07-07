"use strict";

// ── Random character generator (shared) ───────────────────────
// Fills a generator form with random, plausible character data.
// Name + gender come from randomuser.me with a local offline
// fallback; everything else is rolled locally. Exposes a single
// global: window.randomizeCharacter(generatorKey).

(function () {
  // ── Fallback name pools (used when randomuser.me is unreachable) ──
  const FALLBACK_FIRST_MALE = ["John", "Michael", "David", "James", "Robert", "Christopher", "Daniel", "Andrew", "Joshua", "Ryan", "Brandon", "Tyler", "Kevin", "Jason", "Eric", "Steven", "Matthew", "Brian", "Jeffrey", "Mark"];
  const FALLBACK_FIRST_FEMALE = ["Sarah", "Jessica", "Ashley", "Emily", "Amanda", "Jennifer", "Stephanie", "Nicole", "Megan", "Lauren", "Rachel", "Kayla", "Brittany", "Samantha", "Hannah", "Olivia", "Madison", "Hailey", "Taylor", "Morgan"];
  const FALLBACK_LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];

  // ── Local data pools ──────────────────────────────────────────
  // Weighted ethnicity distribution (value, weight)
  const ETHNICITIES = [
    ["White", 35],
    ["Hispanic", 25],
    ["Black", 20],
    ["Asian", 10],
    ["Middle Eastern", 5],
    ["Native American", 2],
    ["Mixed", 2],
    ["Other", 1],
  ];

  // Street pools (LS_STREETS / BLAINE_STREETS) live in js/streets.js —
  // load it before this file on pages that randomize addresses.

  // ── Random helpers ────────────────────────────────────────────
  function pickRandomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function pickWeighted(pairs) {
    const total = pairs.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * total;
    for (const [value, w] of pairs) {
      roll -= w;
      if (roll < 0) return value;
    }
    return pairs[0][0];
  }

  function randomFiveDigits() {
    return String(randomInt(10000, 99999));
  }

  // ── Name source: randomuser.me with local fallback ───────────
  // Gender is decided locally (70% Male / 30% Female) and passed to the
  // API so the fetched first name always matches.
  function pickGender() {
    return Math.random() < 0.7 ? "Male" : "Female";
  }

  function fallbackName(gender) {
    const pool = gender === "Female" ? FALLBACK_FIRST_FEMALE : FALLBACK_FIRST_MALE;
    return {
      firstName: pickRandomFromArray(pool),
      lastName: pickRandomFromArray(FALLBACK_LAST),
      gender,
    };
  }

  async function fetchRandomNameAndGender(gender) {
    try {
      const apiGender = gender === "Female" ? "female" : "male";
      const res = await fetch("https://randomuser.me/api/?inc=name&noinfo&nat=us,gb,au,ca&gender=" + apiGender, { cache: "no-store" });
      if (!res.ok) throw new Error("randomuser.me " + res.status);
      const json = await res.json();
      const u = json?.results?.[0];
      if (!u) throw new Error("empty payload");
      return { firstName: u.name.first, lastName: u.name.last, gender };
    } catch (e) {
      console.warn("[randomize] API failed, using fallback:", e);
      return fallbackName(gender);
    }
  }

  // ── Character attribute rolls ─────────────────────────────────
  // Height in inches by gender: Male 5'8"–6'3", Female 5'2"–5'10"
  function pickHeight(gender) {
    const inches = gender === "Female" ? randomInt(62, 70) : randomInt(68, 75);
    return { inches, label: Math.floor(inches / 12) + "'" + (inches % 12) + '"' };
  }

  // Weight from a BMI 22–28 roll, clamped to per-gender lbs ranges
  function pickWeight(gender, heightInches) {
    const bmi = 22 + Math.random() * 6;
    const lbs = Math.round((bmi * heightInches * heightInches) / 703);
    const min = gender === "Female" ? 115 : 160;
    const max = gender === "Female" ? 175 : 230;
    return Math.min(max, Math.max(min, lbs));
  }

  // Weighted rank pick: ~70% junior, ~20% mid, ~10% senior.
  // Junior = ranks not listed in the faction's midRanks/seniorRanks,
  // matching how randomizePay() classifies ranks.
  function pickRandomRank(faction) {
    const ranks = faction.ranks || [];
    if (!ranks.length) return null;
    const mid = faction.midRanks || [];
    const senior = faction.seniorRanks || [];
    const junior = ranks.filter((r) => !mid.includes(r) && !senior.includes(r));

    const roll = Math.random();
    let pool;
    if (roll < 0.7) pool = junior;
    else if (roll < 0.9) pool = mid;
    else pool = senior;
    if (!pool.length) pool = ranks;
    return pickRandomFromArray(pool);
  }

  // 80% Los Santos, 20% Blaine County
  function randomAddress() {
    const inBlaine = Math.random() < 0.2;
    const street = pickRandomFromArray(inBlaine ? BLAINE_STREETS : LS_STREETS);
    const locality = inBlaine ? "Blaine County" : "Los Santos";
    return randomInt(100, 9999) + " " + street + ", " + locality + ", SA";
  }

  // ── DOM helpers ───────────────────────────────────────────────
  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el != null && value != null) el.value = value;
  }

  function setSelectValue(id, value) {
    const el = document.getElementById(id);
    if (!el || value == null) return;
    const ok = Array.from(el.options).some((o) => o.value === String(value));
    if (ok) el.value = String(value);
  }

  // Pick a hire year consistent with age (hired at 21+, at least a year ago),
  // clamped to the years actually present in the #yearHired select.
  function setRandomYearHired(age) {
    const sel = document.getElementById("yearHired");
    if (!sel || !sel.options.length) return;
    const years = Array.from(sel.options)
      .map((o) => parseInt(o.value, 10))
      .filter(Number.isFinite);
    if (!years.length) return;
    const currentYear = new Date().getFullYear();
    const earliest = Math.max(Math.min(...years), currentYear - (age - 21));
    const latest = Math.min(Math.max(...years), currentYear - 1);
    sel.value = String(earliest <= latest ? randomInt(earliest, latest) : latest);
  }

  // ── Faction detection ─────────────────────────────────────────
  // Officer/firefighter/personnel keep faction state in the module-level
  // FACTION_KEY global; the business card page uses bcCurrentFaction.
  function getActiveFactionKey(generatorKey) {
    if (generatorKey === "businesscard") {
      return typeof bcCurrentFaction !== "undefined" ? bcCurrentFaction : null;
    }
    return typeof FACTION_KEY !== "undefined" ? FACTION_KEY : null;
  }

  function getActiveFaction(factionKey) {
    if (!factionKey || factionKey === "custom") return null;
    return typeof FACTIONS !== "undefined" ? FACTIONS[factionKey] || null : null;
  }

  // ── Main entry point ──────────────────────────────────────────
  /**
   * Fill the current generator form with a random character.
   * Respects the selected faction; in custom-faction mode only the
   * personal fields are rolled (custom rank/division/etc. untouched).
   * @param {"officer"|"firefighter"|"personnel"|"businesscard"} generatorKey
   */
  window.randomizeCharacter = async function (generatorKey) {
    const factionKey = getActiveFactionKey(generatorKey);
    const faction = getActiveFaction(factionKey);
    const isCustom = factionKey === "custom";

    const person = await fetchRandomNameAndGender(pickGender());
    const fullName = person.firstName + " " + person.lastName;

    // ── Business card ──
    if (generatorKey === "businesscard") {
      setValue("bcFullName", fullName);
      setValue("bcBadge", randomFiveDigits());
      const emailLocal =
        person.firstName.toLowerCase().replace(/[^a-z]/g, "") + "." + person.lastName.toLowerCase().replace(/[^a-z]/g, "");
      setValue("bcEmail", emailLocal);
      if (!isCustom && faction) setSelectValue("bcRank", pickRandomRank(faction));
      if (typeof bcRender === "function") bcRender();
      return;
    }

    // ── Personnel file ──
    if (generatorKey === "personnel") {
      setValue("subjectName", fullName);
      setValue("pfAddress", randomAddress());
      if (typeof generateDoc === "function") generateDoc();
      return;
    }

    // ── Officer / firefighter card (same field IDs on both pages) ──
    const age = randomInt(21, 55);
    const height = pickHeight(person.gender);

    if (!isCustom && faction) {
      // Re-fill select options first, then set the rolled values on top
      if (typeof populateSelects === "function") populateSelects();
      setSelectValue("rank", pickRandomRank(faction));
      setSelectValue("division", pickRandomFromArray(faction.divisions));
      if (typeof onDivisionChange === "function") onDivisionChange();
    }

    setValue("fullName", fullName);
    setValue("serial", randomFiveDigits());
    setValue("badge", randomFiveDigits());
    setSelectValue("ethnicity", pickWeighted(ETHNICITIES));
    setSelectValue("gender", person.gender);
    setValue("age", age);
    setRandomYearHired(age);
    setValue("height", height.label);
    setValue("weight", pickWeight(person.gender, height.inches));

    // randomizePay() reads rank/division/yearHired and re-renders the card
    if (typeof randomizePay === "function") randomizePay();
    else if (typeof generateCard === "function") generateCard();
  };
})();
