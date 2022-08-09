import FSActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class FSActorSheetContainer extends FSActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["frontierscum", "sheet", "actor", "container"],
      template: "systems/frontierscum/templates/actor/container-sheet.html",
      width: 720,
      height: 680,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "contents",
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
    if (this.actor.data.type == "container") {
      this._prepareContainerItems(data);
    }
    return superData;
  }

  /**
   * Organize and classify Items for Container sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareContainerItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);

    sheetData.data.equipment = sheetData.items
      .filter((item) => CONFIG.FS.itemEquipmentTypes.includes(item.type))
      .filter((item) => !item.data.hasContainer)
      .sort(byName);
  }
}
