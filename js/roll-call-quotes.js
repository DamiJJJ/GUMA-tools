"use strict";

// ── Roll call quotes ──────────────────────────────────────────
// Shared data file (like js/streets.js). Closing lines for a roll
// call briefing: law enforcement mottos, quotes with an author and
// unattributed roll call sayings (`author: ""`, printed without an
// attribution line). Only quotes whose attribution holds up are
// listed; famous misattributions are left out on purpose.
// Consumers: js/bolo-status-board.js ("Random" quote button).
// Keep each `text` under the 160-character cap of the quote field.

const ROLL_CALL_QUOTES = [
  // ── Quotes ──
  { text: "The police are the public and the public are the police", author: "Sir Robert Peel" },
  {
    text: "The test of police efficiency is the absence of crime and disorder, not the visible evidence of police action in dealing with it",
    author: "Sir Robert Peel",
  },
  { text: "Injustice anywhere is a threat to justice everywhere", author: "Martin Luther King Jr." },
  { text: "The time is always right to do what is right", author: "Martin Luther King Jr." },
  { text: "Where there is no law, there is no freedom", author: "John Locke" },
  { text: "Blessed are the peacemakers, for they shall be called the children of God", author: "Matthew 5:9" },
  { text: "Courage was not the absence of fear, but the triumph over it", author: "Nelson Mandela" },
  { text: "For the strength of the Pack is the Wolf, and the strength of the Wolf is the Pack", author: "Rudyard Kipling" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit", author: "Will Durant" },
  { text: "The best way out is always through", author: "Robert Frost" },
  { text: "Do what you can, with what you have, where you are", author: "Theodore Roosevelt" },
  { text: "Courage is being scared to death, but saddling up anyway", author: "John Wayne" },
  { text: "No plan survives first contact with the enemy", author: "Helmuth von Moltke" },
  { text: "Discipline is the bridge between goals and accomplishment", author: "Jim Rohn" },
  { text: "Fortune favors the bold", author: "Virgil" },

  // ── Mottos ──
  { text: "To Protect and to Serve", author: "LAPD motto" },
  { text: "Fidelity, Bravery, Integrity", author: "FBI motto" },
  { text: "Duty, Honor, Country", author: "West Point motto" },
  { text: "The only easy day was yesterday", author: "U.S. Navy SEALs" },
  { text: "The more you sweat in training, the less you bleed in combat", author: "Military proverb" },

  // ── Roll call sayings ──
  { text: "Everybody goes home at the end of the shift", author: "" },
  { text: "Complacency kills. Stay sharp out there", author: "" },
  { text: "There is no such thing as a routine traffic stop", author: "" },
  { text: "Slow is smooth, and smooth is fast", author: "" },
  { text: "Train like your life depends on it, because it does", author: "" },
  { text: "Hope is not a tactic", author: "" },
  { text: "Watch each other's six. Nobody works alone", author: "" },
  { text: "Be the officer you would want to show up at your own family's door", author: "" },
  { text: "Treat everyone with respect, but never let your guard down", author: "" },
  { text: "Do the right thing, for the right reason, every time", author: "" },
  { text: "Integrity is doing the right thing when nobody is watching", author: "" },
  { text: "Your radio is your lifeline. Keep it on you and keep it charged", author: "" },
  { text: "Stay alert, stay safe, come home", author: "" },
  { text: "Officer safety is everyone's job", author: "" },
  { text: "Expect the unexpected and trust your training", author: "" },
];
