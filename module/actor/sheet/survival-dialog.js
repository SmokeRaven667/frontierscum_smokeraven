export default class RestDialog extends Application {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "survival-dialog";
    options.classes = ["frontierscum"];
    options.title = game.i18n.localize("FS.Survival");
    options.template = "systems/frontierscum/templates/dialog/survival-dialog.html";
    options.width = 420;
    options.height = "auto";
    return options;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".survival-button").click(this._onSurvival.bind(this));
  }

  getRollData() {
    const data = super.getRollData();
    return data;
  }

  _onSurvival(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".survival-dialog")[0];
    const survivalType  = $(form).find("input[name=survival-type]:checked").val();
    let advantage = $(form).find("#advantageselect").find(":selected").val();

    let targetDR  = $(form).find("input[name=targetDR]").val();
    if(!targetDR) {
      targetDR = 12;
    }
    targetDR = parseInt(targetDR);
    console.log(`survivalType: ${survivalType}`);
    console.log(`targetDR: ${targetDR}`);
    let survivalAttribute = '';
    switch (survivalType) {
      case "hunting":
        survivalAttribute = "wits";
        break;
      case "foraging":
        survivalAttribute = "wits";
        break;
      case "fishing":
        survivalAttribute = "luck";
        break;
      default:
        break;
    }
    
    //const infected = $(form).find("input[name=infected]").is(":checked");
    const equipped = $(form).find("input[name=equipped]").is(":checked");
    this.close();
    // TODO: await this?
    this.actor.survival(survivalType, survivalAttribute, equipped, targetDR, advantage);
  }
}
