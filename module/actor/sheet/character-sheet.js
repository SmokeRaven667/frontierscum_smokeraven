import FSActorSheet from "./actor-sheet.js";
import RestDialog from "./rest-dialog.js";
import { trackAmmo, trackCarryingCapacity } from "../../settings.js";

/**
 * @extends {ActorSheet}
 */
export class FSActorSheetCharacter extends FSActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["frontierscum", "sheet", "actor", "character"],
      template: "systems/frontierscum/templates/actor/character-sheet.html",
      width: 750,
      height: 690,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "violence",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  getData() {
    const superData = super.getData();
    const data = superData.data;
    data.config = CONFIG.FS;

    // Ability Scores
    for (const [a, abl] of Object.entries(data.data.abilities)) {
      const translationKey = CONFIG.FS.abilities[a];
      abl.label = game.i18n.localize(translationKey);
    }

    // Prepare items.
    if (this.actor.data.type == "character") {
      this._prepareCharacterItems(data);
    }

    data.data.trackCarryingCapacity = trackCarryingCapacity();
    data.data.trackAmmo = trackAmmo();
    console.log(`***************`);
    console.log(data.data);

    return superData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} sheetData The sheet data to prepare.
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);

    sheetData.data.feats = sheetData.items
      .filter((item) => item.type === CONFIG.FS.itemTypes.feat)
      .sort(byName);

    sheetData.data.actions = sheetData.items
      .filter((item) => item.type === CONFIG.FS.itemTypes.action)
      .sort(byName);

    // sheetData.data.skills = sheetData.items
    //   .filter((item) => item.type === CONFIG.FS.itemTypes.skill)
    //   .sort(byName);

    sheetData.data.class = sheetData.items.find(
      (item) => item.type === CONFIG.FS.itemTypes.class
    );

    sheetData.data.scrolls = sheetData.items
      .filter((item) => item.type === CONFIG.FS.itemTypes.scroll)
      .sort(byName);

    sheetData.data.equipment = sheetData.items
      .filter((item) => CONFIG.FS.itemEquipmentTypes.includes(item.type))
      .filter((item) => !item.data.hasContainer)
      .sort(byName);

    sheetData.data.equippedArmor = sheetData.items
      .filter((item) => item.type === CONFIG.FS.itemTypes.armor)
      .find((item) => item.data.equipped);

    sheetData.data.equippedShield = sheetData.items
      .filter((item) => item.type === CONFIG.FS.itemTypes.shield)
      .find((item) => item.data.equipped);

    sheetData.data.equippedWeapons = sheetData.items
      .filter((item) => item.type === CONFIG.FS.itemTypes.weapon)
      .filter((item) => item.data.equipped)
      .sort(byName);

    sheetData.data.ammo = sheetData.items
      .filter((item) => item.type === CONFIG.FS.itemTypes.ammo)
      .sort(byName);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // sheet header
    html
      .find(".ability-label.rollable.strength")
      .on("click", this._onStrengthRoll.bind(this));
    html
      .find(".ability-label.rollable.agility")
      .on("click", this._onAgilityRoll.bind(this));
    html
      .find(".ability-label.rollable.slick")
      .on("click", this._onSlickRoll.bind(this));
    html
      .find(".ability-label.rollable.toughness")
      .on("click", this._onToughnessRoll.bind(this));
    html.find(".item-scvmify").click(this._onScvmify.bind(this));
    html.find(".death-check-button").on("click", this._onDeathCheck.bind(this));
    html.find(".drop-check-button").on("click", this._onDropCheck.bind(this));
    html.find(".rest-button").on("click", this._onRest.bind(this));
    html
      .find(".omens-row span.rollable")
      .on("click", this._onOmensRoll.bind(this));
    html.find(".get-better-button").on("click", this._onGetBetter.bind(this));
    // feats tab
    html.find(".feat-button").on("click", this._onFeatRoll.bind(this));
    // actions tab
    html.find(".action-button").on("click", this._onActionRoll.bind(this));
    // skills tab
    html.find(".skill-button").on("click", this._onSkillRoll.bind(this));
    // powers tab
    html
      .find(".wield-power-button")
      .on("click", this._onWieldPowerRoll.bind(this));
    html.find("select.ammo-select").on("change", this._onAmmoSelect.bind(this));
  }

  _onStrengthRoll(event) {
    event.preventDefault();
    this.actor.testGrit();
  }

  _onAgilityRoll(event) {
    event.preventDefault();
    this.actor.testAgility();
  }

  _onSlickRoll(event) {
    event.preventDefault();
    this.actor.testSlick();
  }

  _onToughnessRoll(event) {
    event.preventDefault();
    this.actor.testToughness();
  }

  _onOmensRoll(event) {
    event.preventDefault();
    this.actor.rollOmens();
  }

  _onPowersPerDayRoll(event) {
    event.preventDefault();
    this.actor.rollPowersPerDay();
  }

  _onScvmify(event) {
    event.preventDefault();
    this.actor.scvmify();
  }

  _onDeathCheck(event) {
    event.preventDefault();
    this.actor.rollDeathCheck();
  }

  _onDropCheck(event) {
    event.preventDefault();
    this.actor.rollDropCheck();
  }

  _onRest(event) {
    event.preventDefault();
    const restDialog = new RestDialog();
    // TODO: maybe move this into a constructor,
    // if we can resolve the mergeObject() Maximum call stack size exceeded error
    restDialog.actor = this.actor;
    restDialog.render(true);
  }

  _onGetBetter(event) {
    event.preventDefault();
    // confirm before doing get better
    const d = new Dialog({
      title: game.i18n.localize("FS.GetBetter"),
      content:
        "<p>&nbsp;<p>The game master decides when a character should be improved.<p>It can be after completing a scenario, killing mighty foes, or bringing home treasure.<p>&nbsp;",
      buttons: {
        cancel: {
          label: game.i18n.localize("FS.Cancel"),
        },
        getbetter: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("FS.GetBetter"),
          callback: () => this.actor.getBetter(),
        },
      },
      default: "cancel",
    });
    d.render(true);
  }

  _onFeatRoll(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const li = button.parents(".item");
    const itemId = li.data("itemId");
    this.actor.useFeat(itemId);
  }

  _onSkillRoll(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const li = button.parents(".item");
    const itemId = li.data("itemId");
    this.actor.useSkill(itemId);
  }

  _onActionRoll(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const li = button.parents(".item");
    const itemId = li.data("itemId");
    this.actor.useAction(itemId);
  }

  _onWieldPowerRoll(event) {
    event.preventDefault();
    this.actor.wieldPower();
  }
}
