export default class RestDialog extends Application {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "rest-dialog";
    options.classes = ["frontierscum"];
    options.title = game.i18n.localize("FS.Rest");
    options.template = "systems/frontierscum/templates/dialog/rest-dialog.html";
    options.width = 420;
    options.height = "auto";
    return options;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".rest-button").click(this._onRest.bind(this));
  }

  _onRest(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".rest-dialog")[0];
    const restLength = $(form).find("input[name=rest-length]:checked").val();
    // const foodAndDrink = $(form)
    //   .find("input[name=food-and-drink]:checked")
    //   .val();
    const foodAndDrink = $(form)
      .find("input[name=food-and-drink]:checked");
    console.log(foodAndDrink)
    console.log(typeof(foodAndDrink))
    console.log(foodAndDrink.length)
    //const infected = $(form).find("input[name=infected]").is(":checked");
    const miserable = $(form).find("input[name=miserable]").is(":checked");
    this.close();
    // TODO: await this?
    this.actor.rest(restLength, foodAndDrink, miserable);
  }
}
