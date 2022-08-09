import { FS } from "../../config.js";
import * as editor from "../../editor.js";

/*
 * @extends {ItemSheet}
 */
export class FSItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["frontierscum", "sheet", "item"],
      width: 600,
      height: 560,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = "systems/frontierscum/templates/item";
    if (Object.keys(FS.itemTypeKeys).includes(this.item.data.type)) {
      // specific item-type sheet
      return `${path}/${this.item.data.type}-sheet.html`;
    } else {
      // generic item sheet
      return `${path}/item-sheet.html`;
    }
  }

  /** @override */
  async getData(options) {
    const data = super.getData(options);
    data.config = CONFIG.FS;
    if (data.data.data.scrollType) {
      data.data.data.localizedScrollType = game.i18n.localize(
        FS.scrollTypes[data.data.data.scrollType]
      );
    }
    return data;
  }

  /**
   *  This is a small override to handle remembering the sheet's position.
   *  @override
   */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here.
  }

  /** @override */
  activateEditor(name, options = {}, initialContent = "") {
    editor.setCustomEditorOptions(options);
    super.activateEditor(name, options, initialContent);
  }
}
