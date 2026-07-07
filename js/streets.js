"use strict";

// ── GTA V street name pools ───────────────────────────────────
// Shared data file (like js/factions.js). Residential-ish named
// streets only — freeways, interstates and numbered routes are
// deliberately excluded (nobody lives on the Del Perro Freeway).
// Consumers: js/random-character.js (personnel file address).

const LS_STREETS = [
  "Abattoir Avenue", "Abe Milton Parkway", "Ace Jones Drive", "Adam's Apple Boulevard", "Aguja Street",
  "Alta Place", "Alta Street", "Amarillo Vista", "Amarillo Way", "Americano Way", "Arsenal Street",
  "Atlee Street", "Autopia Parkway", "Bait Street", "Banham Canyon Drive", "Barbareno Road",
  "Bay City Avenue", "Bay City Incline", "Baytree Canyon Road", "Boulevard Del Perro", "Bridge Street",
  "Brouge Avenue", "Buccaneer Way", "Buen Vino Road", "Caesars Place", "Calais Avenue",
  "Capital Boulevard", "Carcer Way", "Carson Avenue", "Chum Street", "Chupacabra Street",
  "Clinton Avenue", "Cockingend Drive", "Conquistador Street", "Cortes Street", "Cougar Avenue",
  "Covenant Avenue", "Cox Way", "Crusade Road", "Davis Avenue", "Decker Street", "Didion Drive",
  "Dorset Drive", "Dorset Place", "Dry Dock Street", "Dunstable Drive", "Dunstable Lane",
  "Dutch London Street", "East Galileo Avenue", "East Mirror Drive", "Eastbourne Way",
  "Eclipse Boulevard", "Edwood Way", "El Burro Boulevard", "El Rancho Boulevard", "Elgin Avenue",
  "Equality Way", "Exceptionalists Way", "Fantastic Place", "Fenwell Place", "Forced Labor Place",
  "Forum Drive", "Fudge Lane", "Galileo Road", "Gentry Lane", "Ginger Street", "Glory Way",
  "Goma Street", "Greenwich Parkway", "Greenwich Place", "Greenwich Way", "Grove Street",
  "Hanger Way", "Hangman Avenue", "Hardy Way", "Hawick Avenue", "Heritage Way", "Hillcrest Avenue",
  "Hillcrest Ridge Access Road", "Imagination Court", "Industry Passage", "Ineseno Road",
  "Integrity Way", "Invention Court", "Innocence Boulevard", "Jamestown Street", "Kimble Hill Drive",
  "Kortz Drive", "Labor Place", "Las Lagunas Boulevard", "Las Lagunas Place", "Lake Vinewood Drive",
  "Liberty Street", "Lindsay Circus", "Little Bighorn Avenue", "Low Power Street", "Macdonald Street",
  "Mad Wayne Thunder Drive", "Magellan Avenue", "Marathon Avenue", "Marlowe Drive", "Melanoma Street",
  "Meteor Street", "Milton Road", "Mirror Park Boulevard", "Mirror Place", "Morningwood Boulevard",
  "Mount Haan Drive", "Mount Haan Road", "Mount Vinewood Drive", "Movie Star Way", "Mutiny Road",
  "New Empire Way", "Nikola Avenue", "Nikola Place", "Normandy Drive", "North Archer Avenue",
  "North Conker Avenue", "North Rockford Drive", "North Sheldon Avenue", "Occupation Avenue",
  "Orchardville Avenue", "Palomino Avenue", "Peaceful Street", "Perth Street", "Picture Perfect Drive",
  "Plaice Place", "Playa Vista", "Popular Street", "Portola Drive", "Power Street",
  "Prosperity Street", "Prosperity Street Promenade", "Red Desert Avenue", "Richman Street",
  "Rockford Drive", "Roy Lowenstein Boulevard", "Rub Street", "Sam Austin Drive",
  "San Andreas Avenue", "Sandcastle Way", "San Vitus Boulevard", "Senora Road", "Shank Street",
  "Signal Street", "Simmer Alley", "Sinner Street", "Sinners Passage", "South Arsenal Street",
  "South Boulevard Del Perro", "South Mo Milton Drive", "South Rockford Drive",
  "South Shambles Street", "Spanish Avenue", "Steele Way", "Strangeways Drive", "Strawberry Avenue",
  "Supply Street", "Sustancia Road", "Swiss Street", "Tackle Street", "Tangerine Street",
  "Tongva Drive", "Tower Way", "Tug Street", "Utopia Gardens", "Vespucci Boulevard",
  "Vinewood Boulevard", "Vinewood Park Drive", "Vitus Street", "Voodoo Place",
  "West Eclipse Boulevard", "West Galileo Avenue", "West Mirror Drive", "Whispymound Drive",
  "Wild Oats Drive", "York Street", "Zancudo Barranca",
];

const BLAINE_STREETS = [
  "Algonquin Boulevard", "Alhambra Drive", "Armadillo Avenue", "Calafia Road", "Cascabel Avenue",
  "Cassidy Trail", "Cat-Claw Avenue", "Chianski Passage", "Cholla Road", "Cholla Springs Avenue",
  "Duluoz Avenue", "East Joshua Road", "El Gordo Drive", "Fort Zancudo Approach Road",
  "Grapeseed Avenue", "Grapeseed Main Street", "Joad Lane", "Joshua Road", "Lesbos Lane",
  "Lolita Avenue", "Marina Drive", "Meringue Lane", "Mountain View Drive", "Niland Avenue",
  "North Calafia Way", "Nowhere Road", "O'Neil Way", "Paleto Boulevard", "Panorama Drive",
  "Procopio Drive", "Procopio Promenade", "Pyrite Avenue", "Raton Pass", "Seaview Road",
  "Senora Way", "Smoke Tree Road", "Union Road", "Zancudo Avenue", "Zancudo Road", "Zancudo Trail",
];
