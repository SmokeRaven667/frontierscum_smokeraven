// Namespace Configuration Values
export const FS = {};

FS.abilities = {
  luck: "FS.AbilityLuck",     // aka agility
  slick: "FS.AbilitySlick", // aka presence
  grit: "FS.AbilityGrit",   // aka strength
  wits: "FS.AbilityWits", // aka toughness
};

FS.armorTiers = {
  0: {
    key: "FS.ArmorTierNone",
    damageReductionDie: "1d0",
    luckModifier: 0,
    defenseModifier: 0,
  },
  1: {
    key: "FS.ArmorTierLight",
    damageReductionDie: "1d2",
    luckModifier: 0,
    defenseModifier: 0,
  },
  2: {
    key: "FS.ArmorTierMedium",
    damageReductionDie: "1d4",
    luckModifier: 2,
    defenseModifier: 2,
  },
  3: {
    key: "FS.ArmorTierHeavy",
    damageReductionDie: "1d6",
    luckModifier: 4,
    defenseModifier: 2,
  },
};

FS.colorSchemes = {
  blackOnYellowWhite: {
    background: "#ffe900",
    foreground: "#000000",
    foregroundAlt: "#808080",
    highlightBackground: "#ffffff",
    highlightForeground: "#000000",
    sidebarBackground: "#ffe900",
    sidebarForeground: "000000",
    sidebarButtonBackground: "#000000",
    sidebarButtonForeground: "#ffe900",
    windowBackground: "#ffe900",
  },
  blackOnWhiteBlack: {
    background: "#ffffff",
    foreground: "#000000",
    foregroundAlt: "#808080",
    highlightBackground: "#000000",
    highlightForeground: "#ffffff",
    sidebarBackground: "#ffffff",
    sidebarForeground: "#000000",
    sidebarButtonBackground: "#000000",
    sidebarButtonForeground: "#ffffff",
    windowBackground: "#ffffff",
  },
  foundryDefault: {
    background: "#f0f0e0",
    foreground: "#191813",
    foregroundAlt: "red",
    highlightBackground: "#191813",
    highlightForeground: "#f0f0e0",
    sidebarBackground: "url(../ui/denim.jpg) repeat",
    sidebarForeground: "#f0f0e0",
    sidebarButtonBackground: "#f0f0e0",
    sidebarButtonForeground: "#000000",
    windowBackground: "url(../ui/parchment.jpg) repeat",
  },
  whiteOnBlackYellow: {
    background: "#000000",
    foreground: "#ffffff",
    foregroundAlt: "#ffe900",
    highlightBackground: "#ffe900",
    highlightForeground: "#000000",
    sidebarBackground: "#000000",
    sidebarForeground: "#ffffff",
    sidebarButtonBackground: "#ffffff",
    sidebarButtonForeground: "#000000",
    windowBackground: "#000000",
  },
  whiteOnBlackPink: {
    background: "#000000",
    foreground: "#ffffff",
    foregroundAlt: "#ff3eb5",
    highlightBackground: "#ff3eb5",
    highlightForeground: "#000000",
    sidebarBackground: "#000000",
    sidebarForeground: "#ffffff",
    sidebarButtonBackground: "#ffffff",
    sidebarButtonForeground: "#000000",
    windowBackground: "#000000",
  },
  whiteOnPinkWhite: {
    background: "#ff3eb5",
    foreground: "#ffffff",
    foregroundAlt: "#000000",
    highlightBackground: "#ffffff",
    highlightForeground: "#000000",
    sidebarBackground: "#ff3eb5",
    sidebarForeground: "#ffffff",
    sidebarButtonBackground: "#ffffff",
    sidebarButtonForeground: "#ff3eb5",
    windowBackground: "#ff3eb5",
  },
};

FS.flagScope = "frontierscum"; // must match system name

FS.flags = {
  ATTACK_DR: "attackDR",
  DEFEND_DR: "defendDR",
  INCOMING_ATTACK: "incomingAttack",
  TARGET_ARMOR: "targetArmor",
  DAMAGE_EXPLODES: "damageExplodes",
};

FS.fontSchemes = {
  blackletter: {
    chat: "Alegreya",
    chatInfo: "Oswald",
    h1: "Smokum",
    h2: "Inconsolata",
    h3: "Old Cupboard",
    item: "Special Elite",
  },
  legible: {
    chat: "Alegreya",
    chatInfo: "Oswald",
    h1: "Blood Crow",
    h2: "Calling Code Regular",
    h3: "Old Cupboard",
    item: "Lato",
  },
};

FS.handed = {
  1: "FS.HandedOne",
  2: "FS.HandedTwo",
};

FS.ammoTypes = {
  arrow: "FS.AmmoTypeArrow",
  bolt: "FS.AmmoTypeBolt",
  slingstone: "FS.AmmoTypeSlingstone",
  pistolslug: "FS.AmmoTypePistolslug",
  rifleround: "FS.AmmoTypeRifleround",
  shotgunshell: "FS.AmmoTypeShotgunshell",
  throwingknife: "FS.AmmoTypeThrowingknife",
};

FS.itemTypes = {
  ammo: "ammo",
  armor: "armor",
  class: "class",
  container: "container",
  feat: "feat",
  action: "action",
  skill: "skill",
  misc: "misc",
  scroll: "scroll",
  shield: "shield",
  weapon: "weapon",
};

FS.itemTypeKeys = {
  ammo: "FS.ItemTypeAmmo",
  armor: "FS.ItemTypeArmor",
  class: "FS.ItemTypeClass",
  container: "FS.ItemTypeContainer",
  feat: "FS.ItemTypeFeat",
  action: "FS.ItemTypeAction",
  skill: "FS.ItemTypeSkill",
  misc: "FS.ItemTypeMisc",
  scroll: "FS.ItemTypeScroll",
  shield: "FS.ItemTypeShield",
  weapon: "FS.ItemTypeWeapon",
};

// these Item types are "equipment"
FS.itemEquipmentTypes = [
  FS.itemTypes.ammo,
  FS.itemTypes.armor,
  FS.itemTypes.container,
  FS.itemTypes.misc,
  FS.itemTypes.scroll,
  FS.itemTypes.shield,
  FS.itemTypes.weapon,
];

FS.allowedContainerItemTypes = [
  FS.itemTypes.ammo,
  FS.itemTypes.armor,
  FS.itemTypes.misc,
  FS.itemTypes.scroll,
  FS.itemTypes.shield,
  FS.itemTypes.weapon,
];

FS.equippableItemTypes = [
  FS.itemTypes.armor,
  FS.itemTypes.shield,
  FS.itemTypes.weapon,
];

FS.droppableItemTypes = [FS.itemTypes.container];

FS.plusMinusItemTypes = [FS.itemTypes.ammo, FS.itemTypes.misc];

FS.scrollTypes = {
  sacred: "FS.ScrollTypeSacred",
  tablet: "FS.ScrollTypeTablet",
  unclean: "FS.ScrollTypeUnclean",
};

FS.weaponTypes = {
  melee: "FS.WeaponTypeMelee",
  ranged: "FS.WeaponTypeRanged",
};

FS.damageExplodes = {
  explodes: "FS.DamageExplodes",
  doesnotexplode: "FS.DamageDoesNotExplode",
};

// Config variables for the Scvmfactory character generator
FS.scvmFactory = {
  foodAndWaterPack: "frontierscum.equipment-misc",
  foodItemName: "Pemmican",
  waterItemName: "Canteen",
  saddleItemName: "Saddle and Saddlebags",
  characterCreationPack: "frontierscum.character-creation",
  bonusItemsTable: "Bonus Tools",
  startingEquipmentTable1: "Starting Equipment (1)",
  startingEquipmentTable2: "Starting Equipment (2)",
  startingEquipmentTable3: "Starting Equipment (3)",
  startingWeaponTable: "Starter Gun",
  startingHorseTable: "Starter Horse",
  startingHatTable: "Starter Hat",
  weaponDieIfRolledScroll: "1d6",
  startingArmorTable: "Starting Armor",
  armorDieIfRolledScroll: "1d2",
  terribleTraitsTable: "Terribler Traits",
  cowboyTraitsTable1: "Cowboy Trait 1",
  cowboyTraitsTable2: "Cowboy Trait 2",
  crimeTable1: "Crime 1",
  crimeTable2: "Crime 2",
  brokenBodiesTable: "Brokener Bodies",
  badHabitsTable: "Badder Habits",
  horseTypeTable: "Horse Type",
  horseLikesTable: "Horse Likes",
  horseCoatTable: "Horse Coat",
  horseName1Table: "Horse Name 1",
  horseName2Table: "Horse Name 2"
};
