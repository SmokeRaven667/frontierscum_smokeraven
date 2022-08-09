import { AllowedScvmClassesDialog } from "./settings/allowed-scvm-classes-dialog.js";

export const registerSystemSettings = () => {
  /**
   * Track the system version upon which point a migration was last applied.
   */
  game.settings.register("frontierscum", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  /** Whether to keep track of carrying capacity */
  game.settings.register("frontierscum", "trackCarryingCapacity", {
    name: "FS.SettingsApplyOvercapacityPenalty",
    hint: "FS.SettingsApplyOvercapacityPenaltyHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  /** Whether to keep track of ranged weapon ammo */
  game.settings.register("frontierscum", "trackAmmo", {
    name: "FS.SettingsTrackAmmo",
    hint: "FS.SettingsTrackAmmoHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  /** UI Color scheme */
  game.settings.register("frontierscum", "colorScheme", {
    name: "FS.SettingsColorScheme",
    hint: "FS.SettingsColorSchemeHint",
    scope: "client",
    config: true,
    default: "whiteOnBlackYellow",
    type: String,
    choices: {
      blackOnYellowWhite: "FS.SettingsBlackOnYellowWhite",
      blackOnWhiteBlack: "FS.SettingsBlackOnWhiteBlack",
      foundryDefault: "FS.SettingsFoundryDefault",
      whiteOnBlackYellow: "FS.SettingsWhiteOnBlackYellow",
      whiteOnBlackPink: "FS.SettingsWhiteOnBlackPink",
      whiteOnPinkWhite: "FS.SettingsWhiteOnPinkWhite",
    },
    onChange: () => {
      location.reload();
    },
  });

  /** UI Font scheme */
  game.settings.register("frontierscum", "fontScheme", {
    name: "FS.SettingsFontScheme",
    hint: "FS.SettingsFontSchemeHint",
    scope: "client",
    config: true,
    default: "blackletter",
    type: String,
    choices: {
      blackletter: "FS.SettingsBlackletter",
      legible: "FS.SettingsLegible",
    },
    onChange: () => {
      location.reload();
    },
  });

  /** The allowed classes menu */
  game.settings.registerMenu("frontierscum", "EditAllowedScvmClassesMenu", {
    name: "FS.EditAllowedScvmClassesMenu",
    hint: "FS.EditAllowedScvmClassesMenuHint",
    label: "FS.EditAllowedScvmClassesMenuButtonLabel",
    icon: "fas fa-cog",
    type: AllowedScvmClassesDialog,
    restricted: true,
  });

  /** The allowed classes menu for scvmfactory */
  game.settings.register("frontierscum", "allowedScvmClasses", {
    name: "",
    default: {},
    type: Object,
    scope: "world",
    config: false,
  });

  /** The client scvmfactory selected classes  */
  game.settings.register("frontierscum", "lastScvmfactorySelection", {
    name: "",
    default: [],
    type: Array,
    scope: "client",
    config: false,
  });
};

export const trackCarryingCapacity = () => {
  return game.settings.get("frontierscum", "trackCarryingCapacity");
};

export const trackAmmo = () => {
  return game.settings.get("frontierscum", "trackAmmo");
};

export const isScvmClassAllowed = (classPack) => {
  const allowedScvmClasses = game.settings.get(
    "frontierscum",
    "allowedScvmClasses"
  );
  return typeof allowedScvmClasses[classPack] === "undefined"
    ? true
    : !!allowedScvmClasses[classPack];
};

export const setAllowedScvmClasses = (allowedScvmClasses) => {
  return game.settings.set(
    "frontierscum",
    "allowedScvmClasses",
    allowedScvmClasses
  );
};

export const getLastScvmfactorySelection = () => {
  return game.settings.get("frontierscum", "lastScvmfactorySelection");
};

export const setLastScvmfactorySelection = (lastScvmfactorySelection) => {
  return game.settings.set(
    "frontierscum",
    "lastScvmfactorySelection",
    lastScvmfactorySelection
  );
};
