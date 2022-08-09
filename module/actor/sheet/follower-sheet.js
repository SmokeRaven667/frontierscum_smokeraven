import FSActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class FSActorSheetFollower extends FSActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["frontierscum", "sheet", "actor", "follower"],
      template: "systems/frontierscum/templates/actor/follower-sheet.html",
      width: 720,
      height: 690,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
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
    if (this.actor.data.type == "follower") {
      this._prepareFollowerItems(data);
    }
    return superData;
  }

  /**
   * Organize and classify Items for Follower sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareFollowerItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);

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

    // Handle rollable items.
    html.find(".morale").on("click", this._onMoraleRoll.bind(this));
  }

  /**
   * Handle morale roll.
   */
  _onMoraleRoll(event) {
    event.preventDefault();
    this.actor.checkMorale();
  }
}
