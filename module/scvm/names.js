const firstName = [
  "Belliam","Petjemen","Artham","Picholas","Elidor","Emory","Gundis","Stunice","Bean","Charl","Meatrice","Porcine","Lemslie","Bluth","Kedebra","Habel","Hurley","Quillward","Ellram","Helma","Hamsor","Medvin","Stacob","Takota","Belzebeth","Torchibald","Leodora","Weslee","Leopack","Deadward","Moriss","Windor","Rodie","Theodrone","Parcheval","Kildred"
];
const nickName = [
  "“Snake Toes”","“Dunderhead”","“Gadabout”","“Cat Wrangler”","“Scrancher”","“Tallow”","“Smokes”","“Soap Lock”","“Big”","“Jugful”","“Scab Herder”","“Harum-Scarum”","“Rotgut”","“Balderdash”","“Dusty Roads”","“Old Rat”","“Firebug”","“Bar Dog”","“Curdles”","“Grubworm”","“Afterclaps”","“Webfoot”","“Slobbers”","“Flea Trap”","“Roach”","“Buzzard Bait”","“Sourmash”","“Slim”","“Cadaver Kid”","“Waterweight”","“Bigmouth”","“Crusty”","“Wisecrack”","“Sweet”","“Killer”","“Skunk Eggs”"
];
const lastName = [
  "Bad","Dungary","Gambit","Sprains","Jamsom","Odyang","Bytheway","Goodmonsen","Slugtop","Meskaro","Cussi","Boomsled","Breaks","Moska","Scotum","Leeks","Smokes","Hoot","Pang","Holler","Pitts","Fumes","Gummy","Elseworth","Craggs","Bilgeburn","Fenapple","Goode","Haggard","Casket","Pains","Botherby","Beard","Femurs","Song","Cuts"
];
const names = [
  "Ager",
  "Arkhan",
  "Bakel",
  "Brevel",
  "Borb",
  "Caldvik",
  "Creppli",
  "Crux",
  "Dorpat",
  "Drakl",
  "Drush",
  "Edeen",
  "Edrin",
  "Ergush",
  "Fnert",
  "Gax",
  "Gildencrantz",
  "Glurtz",
  "Grolsch",
  "Gundrun",
  "Henvir",
  "Hruggub",
  "Ibsum",
  "Jebidiah",
  "Kardur",
  "Klar",
  "Korga",
  "Lumni",
  "Marocain",
  "Maulghup",
  "Nohr",
  "Ongor",
  "Orgl",
  "Pelle",
  "Pol-Blort",
  "Qarmel",
  "Rilk",
  "Rosunstern",
  "Seldam",
  "Shpeelg",
  "Skarp-Hedin",
  "Spug",
  "Spyker",
  "Stawwazz",
  "Svenka",
  "Spudnar",
  "Torbin",
  "Vlunde",
  "Vmolug",
];

export const randomName = () => {
  let fname = firstName[Math.floor(Math.random() * firstName.length)];
  let nname = nickName[Math.floor(Math.random() * nickName.length)];
  let lname = lastName[Math.floor(Math.random() * lastName.length)];
  return `${fname} ${nname} ${lname}`;
  //  return names[Math.floor(Math.random() * names.length)];
};
