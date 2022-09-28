import { addShowDicePromise, diceSound, showDice } from "../dice.js";
import ScvmDialog from "../scvm/scvm-dialog.js";
import { trackAmmo, trackCarryingCapacity } from "../settings.js";

const ATTACK_DIALOG_TEMPLATE =
  "systems/frontierscum/templates/dialog/attack-dialog.html";
const ATTACK_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/attack-roll-card.html";
  const SURVIVAL_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/survival-roll-card.html";
const DEATH_CHECK_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/death-check-roll-card.html";
  const DROP_CHECK_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/drop-check-roll-card.html";
const DEFEND_DIALOG_TEMPLATE =
  "systems/frontierscum/templates/dialog/defend-dialog.html";
const DEFEND_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/defend-roll-card.html";
const GET_BETTER_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/get-better-roll-card.html";
const MORALE_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/morale-roll-card.html";
const OUTCOME_ONLY_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/outcome-only-roll-card.html";
const OUTCOME_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/outcome-roll-card.html";
const REACTION_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/reaction-roll-card.html";
const TEST_ABILITY_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/test-ability-roll-card.html";
const WIELD_POWER_ROLL_CARD_TEMPLATE =
  "systems/frontierscum/templates/chat/wield-power-roll-card.html";

/**
 * @extends {Actor}
 */
export class FSActor extends Actor {
  _titleCase(str) {
    return str.replace(/\w\S*/g, word => {
      return word.charAt(0).toUpperCase() +
             word.slice(1).toLowerCase();
    });
  }

  /** @override */
  static async create(data, options = {}) {
    data.token = data.token || {};
    let defaults = {};
    if (data.type === "character") {
      defaults = {
        actorLink: true,
        disposition: 1,
        vision: true,
      };
    } else if (data.type === "container") {
      defaults = {
        actorLink: false,
        disposition: 0,
        vision: false,
      };
    } else if (data.type === "creature") {
      defaults = {
        actorLink: false,
        disposition: -1,
        vision: false,
      };
    } else if (data.type === "follower") {
      defaults = {
        actorLink: true,
        disposition: 1,
        vision: true,
      };
    }
    mergeObject(data.token, defaults, { overwrite: false });
    return super.create(data, options);
  }

  /** @override */
  _onCreate(data, options, userId) {
    if (data.type === "character") {
      // give Characters a default class
      this._addDefaultClass();
    }
    super._onCreate(data, options, userId);
  }

  async _addDefaultClass() {
    if (game.packs) {
      const hasAClass =
        this.items.filter((i) => i.data.type === "class").length > 0;
      if (!hasAClass) {
        const pack = game.packs.get("frontierscum.class-drifter");
        if (!pack) {
          console.error(
            "Could not find compendium frontierscum.class-drifter"
          );
          return;
        }
        const index = await pack.getIndex();
        const entry = index.find((e) => e.name === "Adventurer");
        if (!entry) {
          console.error("Could not find Adventurer class in compendium.");
          return;
        }
        const entity = await pack.getDocument(entry._id);
        if (!entity) {
          console.error("Could not get document for Adventurer class.");
          return;
        }
        await this.createEmbeddedDocuments("Item", [duplicate(entity.data)]);
      }
    }
  }

  /** @override */
  prepareDerivedData() {
    
    super.prepareDerivedData();

    this.items.forEach((item) => item.prepareActorItemDerivedData(this));

    if (this.type === "character") {
      let className = ''
      try {
        console.log('trying to find class name')
        console.log(this.items)
        className = this.items.find(x => x.type === 'class').data.name;
      }
      catch {}
      console.log(`classname: ${className}`)
      const isAHorse = className === 'Horse' ? true : false;
      console.log(`is a horse: ${isAHorse}`)
      this.data.data.carryingWeight = this.carryingWeight();
      this.data.data.carryingCapacity = this.normalCarryingCapacity(isAHorse);
      this.data.data.encumbered = this.isEncumbered();
    }

    if (this.type === "container") {
      this.data.data.containerSpace = this.containerSpace();
    }
  }

  /** @override */
  _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    if (documents[0].data.type === CONFIG.FS.itemTypes.class) {
      this._deleteEarlierItems(CONFIG.FS.itemTypes.class);
    }
    super._onCreateEmbeddedDocuments(
      embeddedName,
      documents,
      result,
      options,
      userId
    );
  }

  _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    for (const document of documents) {
      if (document.isContainer) {
        this.deleteEmbeddedDocuments("Item", document.items);
      }
      if (document.hasContainer) {
        document.container.removeItem(document.id);
      }
    }

    super._onDeleteEmbeddedDocuments(
      embeddedName,
      documents,
      result,
      options,
      userId
    );
  }

  async _deleteEarlierItems(itemType) {
    const itemsOfType = this.items.filter((i) => i.data.type === itemType);
    itemsOfType.pop(); // don't delete the last one
    const deletions = itemsOfType.map((i) => i.id);
    // not awaiting this async call, just fire it off
    this.deleteEmbeddedDocuments("Item", deletions);
  }

  /** @override */
  getRollData() {
    const data = super.getRollData();
    return data;
  }

  _firstEquipped(itemType) {
    for (const item of this.data.items) {
      if (item.type === itemType && item.data.data.equipped) {
        return item;
      }
    }
    return undefined;
  }

  equippedArmor() {
    return this._firstEquipped("armor");
  }

  equippedShield() {
    return this._firstEquipped("shield");
  }

  async equipItem(item) {
    if (
      [CONFIG.FS.itemTypes.armor, CONFIG.FS.itemTypes.shield].includes(
        item.type
      )
    ) {
      for (const otherItem of this.items) {
        if (otherItem.type === item.type) {
          await otherItem.unequip();
        }
      }
    }
    await item.equip();
  }

  async unequipItem(item) {
    await item.unequip();
  }

  normalCarryingCapacity(isAHorse) {
    if (isAHorse) { return 20; }
    return this.data.data.abilities.grit.value + 8;
  }

  maxCarryingCapacity() {
    return 2 * this.normalCarryingCapacity();
  }

  carryingWeight() {
    return this.data.items
      .filter((item) => item.isEquipment && item.carried && !item.hasContainer)
      .reduce((weight, item) => weight + item.totalCarryWeight, 0);
  }

  isEncumbered() {
    if (!trackCarryingCapacity()) {
      return false;
    }
    return this.carryingWeight() > this.normalCarryingCapacity();
  }

  containerSpace() {
    return this.data.items
      .filter((item) => item.isEquipment && !item.hasContainer)
      .reduce((containerSpace, item) => containerSpace + item.totalSpace, 0);
  }

  async _testAbility(ability, abilityKey, abilityAbbrevKey, drModifiers) {
    const abilityRoll = new Roll(
      `1d20+@abilities.${ability}.value`,
      this.getRollData()
    );
    abilityRoll.evaluate({ async: false });
    await showDice(abilityRoll);
    const rollResult = {
      abilityKey,
      abilityRoll,
      displayFormula: `1d20 + ${game.i18n.localize(abilityAbbrevKey)}`,
      drModifiers,
    };
    const html = await renderTemplate(
      TEST_ABILITY_ROLL_CARD_TEMPLATE,
      rollResult
    );
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async testGrit() {
    const drModifiers = [];
    if (this.isEncumbered()) {
      drModifiers.push(
        `${game.i18n.localize("FS.Encumbered")}: ${game.i18n.localize(
          "FS.DR"
        )} +2`
      );
    }
    await this._testAbility(
      "grit",
      "FS.AbilityGrit",
      "FS.AbilityGritAbbrev",
      drModifiers
    );
  }

  async testSlick() {
    const drModifiers = [];
    const armor = this.equippedArmor();
    if (armor) {
      const armorTier = CONFIG.FS.armorTiers[armor.data.data.tier.max];
      if (armorTier.agilityModifier) {
        drModifiers.push(
          `${armor.name}: ${game.i18n.localize("FS.DR")} +${
            armorTier.agilityModifier
          }`
        );
      }
    }
    if (this.isEncumbered()) {
      drModifiers.push(
        `${game.i18n.localize("FS.Encumbered")}: ${game.i18n.localize(
          "FS.DR"
        )} +2`
      );
    }
    await this._testAbility(
      "slick",
      "FS.AbilitySlick",
      "FS.AbilitySlickAbbrev",
      drModifiers
    );
  }

  async testWits() {
    await this._testAbility(
      "wits",
      "FS.AbilityWits",
      "FS.AbilityWitsAbbrev",
      null
    );
  }

  async testLuck() {
    await this._testAbility(
      "luck",
      "FS.AbilityLuck",
      "FS.AbilityLuckAbbrev",
      null
    );
  }

  /**
   * Attack!
   */
  async attack(itemId) {
    let attackDR = await this.getFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.ATTACK_DR
    );
    if (!attackDR) {
      attackDR = 12; // default
    }
    const targetArmor = await this.getFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.TARGET_ARMOR
    );
    const dialogData = {
      attackDR,
      config: CONFIG.FrontierScum,
      itemId,
      targetArmor,
    };
    const html = await renderTemplate(ATTACK_DIALOG_TEMPLATE, dialogData);
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("FS.Attack"),
        content: html,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: game.i18n.localize("FS.Roll"),
            // callback: html => resolve(_createItem(this.actor, html[0].querySelector("form")))
            callback: (html) => this._attackDialogCallback(html),
          },
        },
        default: "roll",
        close: () => resolve(null),
      }).render(true);
    });
  }

  /**
   * Callback from attack dialog.
   */
  async _attackDialogCallback(html) {
    const form = html[0].querySelector("form");
    const itemId = form.itemid.value;
    const attackDR = parseInt(form.attackdr.value);
    let advantage = $(form).find("#advantageselect").find(":selected").val();
    const targetArmor = form.targetarmor.value;
    if (!itemId || !attackDR) {
      // TODO: prevent form submit via required fields
      return;
    }
    await this.setFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.ATTACK_DR,
      attackDR
    );
    await this.setFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.ATTACK_ADVANTAGE,
      advantage
    );
    await this.setFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.TARGET_ARMOR,
      targetArmor
    );
    this._rollAttack(itemId, attackDR, targetArmor, advantage);
  }


  /**
   * Do the actual attack rolls and resolution.
   */
  async _rollAttack(itemId, attackDR, targetArmor, advantage) {
    const item = this.items.get(itemId);
    const itemRollData = item.getRollData();
    const actorRollData = this.getRollData();

    const advantageDisplay = (advantage === 'no-choice') ? '' : advantage;

    // roll 1: attack
    const isRanged = itemRollData.weaponType === "ranged";
    const damageExplodes = itemRollData.damageExplodes === "explodes";
    // ranged weapons use slick; melee weapons use grit
    const ability = isRanged ? "slick" : "grit";

    // determine attack roll with advantage or disadvantge TODO should be a function since
    // same thing happens in rollDefend?
    const attackRoll1 = new Roll(
      `d20+@abilities.${ability}.value`,
      actorRollData
    );
    attackRoll1.evaluate({ async: false });
    let result1 = attackRoll1.terms[0].results[0].result;
    let result2 = 0;
    const attackRoll2 = new Roll(
      `d20+@abilities.${ability}.value`,
      actorRollData
    );
    let attackRoll;
    if(advantage && (advantage === 'advantage' || advantage === 'disadvantage') ) {
      attackRoll2.evaluate({ async: false });
      result2 = attackRoll2.terms[0].results[0].result;
      if (advantage === 'advantage') {
        attackRoll = (result1 > result2) ? attackRoll1 : attackRoll2;
      }
      if (advantage === 'disadvantage') {
        attackRoll = (result1 < result2) ? attackRoll1 : attackRoll2;
      }
    }
    else {
      attackRoll = attackRoll1;
    }

    await showDice(attackRoll);

    const d20Result = attackRoll.terms[0].results[0].result;
    const fumbleTarget = itemRollData.fumbleOn ?? 1;
    const critTarget = itemRollData.critOn ?? 20;
    const isFumble = d20Result <= fumbleTarget;
    // NOTE: critical in frontier is more weapon damage if max damage is rolled
    // A 20 means you can choose a new skill or an Ace
    //const isCrit = d20Result >= critTarget;
    const isCrit = d20Result === 20;
    // nat 1 is always a miss, nat 20 is always a hit, otherwise check vs DR
    const isHit =
      attackRoll.total !== 1 &&
      (attackRoll.total === 20 || attackRoll.total >= attackDR);

    let attackOutcome = null;
    let damageRoll = null;
    let explodeRoll = null;
    let explodeDamage = null;
    let damageExploded = false;
    let targetArmorRoll = null;
    let maxDamageAmount = null;
    let takeDamage = null;
    if (isHit) {
      // HIT!!!
      attackOutcome = game.i18n.localize(
        isCrit ? "FS.AttackCritText" : "FS.Hit"
      );
      // roll 2: damage.
      // Use parentheses for critical 2x in case damage die something like 1d6+1
      //const damageFormula = isCrit ? "(@damageDie) * 2" : "@damageDie";
      const damageFormula = "@damageDie";
      damageRoll = new Roll(damageFormula, itemRollData);
      damageRoll.evaluate({ async: false, maximize: false }); // NOTE: maximize true to hack max damage for testing
      maxDamageAmount = new Roll(damageFormula, itemRollData);
      maxDamageAmount.evaluate({ async: false, maximize: true });
      const dicePromises = [];
      addShowDicePromise(dicePromises, damageRoll);

      let damage = damageRoll.total;
      let maxAmount = maxDamageAmount.total;

      if (damage >= maxAmount && damageExplodes) {
        damageExploded = true;
        explodeRoll = new Roll(damageFormula, itemRollData);
        explodeRoll.evaluate({ async: false });
        addShowDicePromise(dicePromises, explodeRoll);
        explodeDamage = explodeRoll.total;
        damage = damage + explodeDamage;
      }

      // roll 3: target damage reduction
      if (targetArmor) {
        targetArmorRoll = new Roll(targetArmor, {});
        targetArmorRoll.evaluate({ async: false });
        addShowDicePromise(dicePromises, targetArmorRoll);
        damage = Math.max(damage - targetArmorRoll.total, 0);
      }
      if (dicePromises) {
        await Promise.all(dicePromises);
      }
      takeDamage = `${game.i18n.localize(
        "FS.Inflict"
      )} ${damage} ${game.i18n.localize("FS.Damage")}`;
    } else {
      // MISS!!!
      attackOutcome = game.i18n.localize(
        isFumble ? "FS.AttackFumbleText" : "FS.Miss"
      );
    }

    // TODO: decide keys in handlebars/template?
    const abilityAbbrevKey = isRanged
      ? "FS.AbilitySlickAbbrev"
      : "FS.AbilityGritAbbrev";
    const weaponTypeKey = isRanged
      ? "FS.WeaponTypeRanged"
      : "FS.WeaponTypeMelee";
    const rollResult = {
      actor: this,
      attackDR,
      attackFormula: `1d20 + ${game.i18n.localize(abilityAbbrevKey)}`,
      attackRoll,
      attackOutcome,
      damageRoll,
      items: [item],
      takeDamage,
      targetArmorRoll,
      weaponTypeKey,
      damageExploded,
      explodeDamage,
      explodeRoll,
      advantageDisplay,
      result1,
      result2
    };
    console.log('---- ROLL RESULT ---')
    console.log(rollResult)
    await this._decrementWeaponAmmo(item, isFumble);
    await this._renderAttackRollCard(rollResult);
  }

  async _decrementWeaponAmmo(weapon, isFumble) {
    if (!isFumble) { return; }
    if (weapon.data.data.usesAmmo && weapon.data.data.ammoId && trackAmmo()) {
      const ammo = this.items.get(weapon.data.data.ammoId);
      if (ammo) {
        const attr = "data.quantity";
        const currQuantity = getProperty(ammo.data, attr);
        if (currQuantity > 1) {
          // decrement quantity by 1
          await ammo.update({ [attr]: currQuantity - 1 });
        } else {
          // quantity is now zero, so delete ammo item
          await this.deleteEmbeddedDocuments("Item", [ammo.id]);
        }
      }
    }
  }

  /**
   * Show attack rolls/result in a chat roll card.
   */
  async _renderAttackRollCard(rollResult) {
    const html = await renderTemplate(ATTACK_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async _renderSurvivalRollCard(rollResult) {
    const html = await renderTemplate(SURVIVAL_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  /**
   * Defend!
   */
  async defend() {
    // look up any previous DR or incoming attack value
    let defendDR = await this.getFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.DEFEND_DR
    );
    if (!defendDR) {
      defendDR = 12; // default
    }
    let incomingAttack = await this.getFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.INCOMING_ATTACK
    );
    let damageExplodesFlag = await this.getFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.DAMAGE_EXPLODES
    );
    
    if (!incomingAttack) {
      incomingAttack = "1d4"; // default
    }
    if (!incomingAttack) {
      damageExplodesFlag = false; // default
    }

    const armor = this.equippedArmor();
    const drModifiers = [];
    if (armor) {
      // armor defense adjustment is based on its max tier, not current
      // TODO: maxTier is getting stored as a string
      const maxTier = parseInt(armor.data.data.tier.max);
      const defenseModifier = CONFIG.FS.armorTiers[maxTier].defenseModifier;
      if (defenseModifier) {
        drModifiers.push(
          `${armor.name}: ${game.i18n.localize("FS.DR")} +${defenseModifier}`
        );
      }
    }
    if (this.isEncumbered()) {
      drModifiers.push(
        `${game.i18n.localize("FS.Encumbered")}: ${game.i18n.localize(
          "FS.DR"
        )} +2`
      );
    }

    const dialogData = {
      defendDR,
      drModifiers,
      incomingAttack,
      damageExplodesFlag
    };
    const html = await renderTemplate(DEFEND_DIALOG_TEMPLATE, dialogData);

    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("FS.Defend"),
        content: html,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: game.i18n.localize("FS.Roll"),
            callback: (html) => this._defendDialogCallback(html),
          },
        },
        default: "roll",
        render: (html) => {
          html
            .find("input[name='defensebasedr']")
            .on("change", this._onDefenseBaseDRChange.bind(this));
          html.find("input[name='defensebasedr']").trigger("change");
        },
        close: () => resolve(null),
      }).render(true);
    });
  }

  _onDefenseBaseDRChange(event) {
    event.preventDefault();
    const baseInput = $(event.currentTarget);
    let drModifier = 0;
    const armor = this.equippedArmor();
    if (armor) {
      // TODO: maxTier is getting stored as a string
      const maxTier = parseInt(armor.data.data.tier.max);
      const defenseModifier = CONFIG.FS.armorTiers[maxTier].defenseModifier;
      if (defenseModifier) {
        drModifier += defenseModifier;
      }
    }
    if (this.isEncumbered()) {
      drModifier += 2;
    }
    const modifiedDr = parseInt(baseInput[0].value) + drModifier;
    // TODO: this is a fragile way to find the other input field
    const modifiedInput = baseInput
      .parent()
      .parent()
      .find("input[name='defensemodifieddr']");
    modifiedInput.val(modifiedDr.toString());
  }

  /**
   * Callback from defend dialog.
   */
  async _defendDialogCallback(html) {
    const form = html[0].querySelector("form");
    const baseDR = parseInt(form.defensebasedr.value);
    const modifiedDR = parseInt(form.defensemodifieddr.value);
    const incomingAttack = form.incomingattack.value;
    const damageExplodesFlag = form.damageexplodesflag.value;
    const attackTypeFlag = form.attacktype.value;
    let advantage = $(form).find("#advantageselect").find(":selected").val();
    if (!baseDR || !modifiedDR || !incomingAttack) {
      // TODO: prevent dialog/form submission w/ required field(s)
      return;
    }
    await this.setFlag(CONFIG.FS.flagScope, CONFIG.FS.flags.DEFEND_DR, baseDR);
    await this.setFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.INCOMING_ATTACK,
      incomingAttack
    );
    await this.setFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.DAMAGE_EXPLODES,
      damageExplodesFlag
    );
    await this.setFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.ATTACK_TYPE,
      attackTypeFlag
    );
    await this.setFlag(
      CONFIG.FS.flagScope,
      CONFIG.FS.flags.DEFEND_ADVANTAGE,
      advantage
    );
    this._rollDefend(modifiedDR, incomingAttack, damageExplodesFlag, attackTypeFlag, advantage);
  }

  /**
   * Do the actual defend rolls and resolution.
   */
  async _rollDefend(defendDR, incomingAttack, damageExplodesFlag, attackTypeFlag, advantage) {
    const rollData = this.getRollData();
    const armor = this.equippedArmor();
    const shield = this.equippedShield();

    const advantageDisplay = (advantage === 'no-choice') ? '' : advantage;
    
    // roll 1: defend
    // TODO: should use grit if melee weapon, slick if ranged not a gun
    //    luck if gun and hard shot
    let defendAttribute = 'grit';
    switch (attackTypeFlag) {
      case "melee":
        defendAttribute = "grit";
        break;
      case "ranged":
        defendAttribute = "slick";
        break;
      case "gun":
        defendAttribute = "luck";
        break;
      default:
        break;
    }

    // determine attack roll with advantage or disadvantge TODO should be a function since
    // same thing happens in rollDefend?
    const defendRoll1 = new Roll(
      `d20+@abilities.${defendAttribute}.value`,
      rollData
    );
    defendRoll1.evaluate({ async: false });
    let result1 = defendRoll1.terms[0].results[0].result;
    let result2 = 0;
    const defendRoll2 = new Roll(
      `d20+@abilities.${defendAttribute}.value`,
      rollData
    );
    let defendRoll;
    if(advantage && (advantage === 'advantage' || advantage === 'disadvantage') ) {
      defendRoll2.evaluate({ async: false });
      result2 = defendRoll2.terms[0].results[0].result;
      if (advantage === 'advantage') {
        defendRoll = (result1 > result2) ? defendRoll1 : defendRoll2;
      }
      if (advantage === 'disadvantage') {
        defendRoll = (result1 < result2) ? defendRoll1 : defendRoll2;
      }
    }
    else {
      defendRoll = defendRoll1;
    }

    //defendRoll.evaluate({ async: false });
    await showDice(defendRoll);

    // TODO: put in advantage
    
    const d20Result = defendRoll.terms[0].results[0].result;
    const isFumble = d20Result === 1;
    const isCrit = d20Result === 20;

    const items = [];
    let damageRoll = null;
    let explodeRoll = null;
    let maxDamageAmount = null;
    let damageExploded = false;
    let explodeDamage = null;
    let armorRoll = null;
    let defendOutcome = null;
    let takeDamage = null;

    if (isCrit) {
      // critical success
      defendOutcome = game.i18n.localize("FS.DefendCritText");
    } else if (defendRoll.total >= defendDR) {
      // success
      defendOutcome = game.i18n.localize("FS.Dodge");
    } else {
      // failure
      if (isFumble) {
        defendOutcome = game.i18n.localize("FS.DefendFumbleText");
      } else {
        defendOutcome = game.i18n.localize("FS.YouAreHit");
      }

      // roll 2: incoming damage
      let damageFormula = incomingAttack;
      // TODO: does this fumble damage go away?
      if (isFumble) {
        damageFormula += " * 2";
      }
      damageRoll = new Roll(damageFormula, {});
      damageRoll.evaluate({ async: false });
      maxDamageAmount = new Roll(damageFormula, {});
      maxDamageAmount.evaluate({ async: false, maximize: true });
      const dicePromises = [];
      addShowDicePromise(dicePromises, damageRoll);
      let damage = damageRoll.total;
      let maxAmount = maxDamageAmount.total;
      console.log(`maxAmount: ${maxAmount}`)
      console.log('damage explodes flag')
      console.log(damageExplodesFlag)
      if (damage >= maxAmount && damageExplodesFlag) {
        damageExploded = true;
        console.log('DAMAGE EXPLODES');
        explodeRoll = new Roll(damageFormula, {});
        explodeRoll.evaluate({ async: false });
        addShowDicePromise(dicePromises, explodeRoll);
        explodeDamage = explodeRoll.total;
        damage = damage + explodeDamage;
      }
      
      

      // roll 3: damage reduction from equipped armor and shield
      let damageReductionDie = "";
      if (armor) {
        damageReductionDie =
          CONFIG.FS.armorTiers[armor.data.data.tier.value].damageReductionDie;
        items.push(armor);
      }
      if (shield) {
        damageReductionDie += "+1";
        items.push(shield);
      }
      if (damageReductionDie) {
        armorRoll = new Roll("@die", { die: damageReductionDie });
        armorRoll.evaluate({ async: false });
        addShowDicePromise(dicePromises, armorRoll);
        damage = Math.max(damage - armorRoll.total, 0);
      }
      if (dicePromises) {
        await Promise.all(dicePromises);
      }
      takeDamage = `${game.i18n.localize(
        "FS.Take"
      )} ${damage} ${game.i18n.localize("FS.Damage")}`;
    }
    const defendAttributeTitleCase = this._titleCase(defendAttribute);
    const defendFormula = `FS.Ability${defendAttributeTitleCase}Abbrev`;
    const localized = game.i18n.localize(defendFormula);
    const rollResult = {
      actor: this,
      armorRoll,
      damageRoll,
      defendDR,
      defendFormula: `1d20 + ${localized}`,
      defendOutcome,
      defendRoll,
      items,
      takeDamage,
      damageExploded,
      explodeRoll,
      advantageDisplay,
      result1,
      result2
    };
    await this._renderDefendRollCard(rollResult);
  }

  /**
   * Show attack rolls/result in a chat roll card.
   */
  async _renderDefendRollCard(rollResult) {
    const html = await renderTemplate(DEFEND_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  /**
   * Check morale!
   */
  async checkMorale() {
    const actorRollData = this.getRollData();
    const moraleRoll = new Roll("2d6", actorRollData);
    moraleRoll.evaluate({ async: false });
    await showDice(moraleRoll);

    let outcomeRoll = null;
    // must have a non-zero morale to possibly fail a morale check
    if (this.data.data.morale && moraleRoll.total > this.data.data.morale) {
      outcomeRoll = new Roll("1d6", actorRollData);
      outcomeRoll.evaluate({ async: false });
      await showDice(outcomeRoll);
    }
    await this._renderMoraleRollCard(moraleRoll, outcomeRoll);
  }

  /**
   * Show morale roll/result in a chat roll card.
   */
  async _renderMoraleRollCard(moraleRoll, outcomeRoll) {
    let outcomeKey = null;
    if (outcomeRoll) {
      outcomeKey =
        outcomeRoll.total <= 3 ? "FS.MoraleFlees" : "FS.MoraleSurrenders";
    } else {
      outcomeKey = "FS.StandsFirm";
    }
    const outcomeText = game.i18n.localize(outcomeKey);
    const rollResult = {
      actor: this,
      outcomeRoll,
      outcomeText,
      moraleRoll,
    };
    const html = await renderTemplate(MORALE_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  /**
   * Check reaction!
   */
  async checkReaction() {
    const actorRollData = this.getRollData();
    const reactionRoll = new Roll("2d6", actorRollData);
    reactionRoll.evaluate({ async: false });
    await showDice(reactionRoll);
    await this._renderReactionRollCard(reactionRoll);
  }

  /**
   * Show reaction roll/result in a chat roll card.
   */
  async _renderReactionRollCard(reactionRoll) {
    let key = "";
    if (reactionRoll.total <= 3) {
      key = "FS.ReactionKill";
    } else if (reactionRoll.total <= 6) {
      key = "FS.ReactionAngered";
    } else if (reactionRoll.total <= 8) {
      key = "FS.ReactionIndifferent";
    } else if (reactionRoll.total <= 10) {
      key = "FS.ReactionAlmostFriendly";
    } else {
      key = "FS.ReactionHelpful";
    }
    const reactionText = game.i18n.localize(key);
    const rollResult = {
      actor: this,
      reactionRoll,
      reactionText,
    };
    const html = await renderTemplate(REACTION_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async wieldPower() {
    if (this.data.data.powerUses.value < 1) {
      ui.notifications.warn(
        `${game.i18n.localize("FS.NoPowerUsesRemaining")}!`
      );
      return;
    }

    const wieldRoll = new Roll(
      "d20+@abilities.slick.value",
      this.getRollData()
    );
    wieldRoll.evaluate({ async: false });
    await showDice(wieldRoll);

    const d20Result = wieldRoll.terms[0].results[0].result;
    const isFumble = d20Result === 1;
    const isCrit = d20Result === 20;
    const wieldDR = 12;

    let wieldOutcome = null;
    let damageRoll = null;
    let takeDamage = null;
    if (wieldRoll.total >= wieldDR) {
      // SUCCESS!!!
      wieldOutcome = game.i18n.localize(
        isCrit ? "FS.CriticalSuccess" : "FS.Success"
      );
    } else {
      // FAILURE
      wieldOutcome = game.i18n.localize(
        isFumble ? "FS.WieldAPowerFumble" : "FS.Failure"
      );
      damageRoll = new Roll("1d2", this.getRollData());
      damageRoll.evaluate({ async: false });
      await showDice(damageRoll);
      takeDamage = `${game.i18n.localize("FS.Take")} ${
        damageRoll.total
      } ${game.i18n.localize("FS.Damage")}, ${game.i18n.localize(
        "FS.WieldAPowerDizzy"
      )}`;
    }

    const rollResult = {
      damageRoll,
      wieldDR,
      wieldFormula: `1d20 + ${game.i18n.localize("FS.AbilitySlickAbbrev")}`,
      wieldOutcome,
      wieldRoll,
      takeDamage,
    };
    const html = await renderTemplate(
      WIELD_POWER_ROLL_CARD_TEMPLATE,
      rollResult
    );
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });

    if (isFumble) {
      // Fumbles roll on the Arcane Catastrophes table
      const pack = game.packs.get("frontierscum.random-scrolls");
      const content = await pack.getDocuments();
      const table = content.find((i) => i.name === "Arcane Catastrophes");
      await table.draw();
    } else if (isCrit) {
      // Criticals roll on Eldritch Elevations table, if available
      // TODO: this could be moved into the 3p module and implemented as a hook
      const pack = game.packs.get("frontierscum-3p.eldritch-elevations");
      if (pack) {
        const content = await pack.getDocuments();
        const table = content.find((i) => i.name === "Eldritch Elevations");
        if (table) {
          await table.draw();
        }
      }
    }

    const newPowerUses = Math.max(0, this.data.data.powerUses.value - 1);
    await this.update({ ["data.powerUses.value"]: newPowerUses });
  }

  async useFeat(itemId) {
    const item = this.items.get(itemId);
    if (!item || !item.data.data.rollLabel) {
      return;
    }

    if (item.data.data.rollMacro) {
      // roll macro
      if (item.data.data.rollMacro.includes(",")) {
        // assume it's a CSV string for {pack},{macro name}
        const [packName, macroName] = item.data.data.rollMacro.split(",");
        const pack = game.packs.get(packName);
        if (pack) {
          const content = await pack.getDocuments();
          const macro = content.find((i) => i.name === macroName);
          if (macro) {
            macro.execute();
          } else {
            console.log(
              `Could not find macro ${macroName} in pack ${packName}.`
            );
          }
        } else {
          console.log(`Pack ${packName} not found.`);
        }
      } else {
        // assume it's the name of a macro in the current world/game
        const macro = game.macros.find(
          (m) => m.name === item.data.data.rollMacro
        );
        if (macro) {
          macro.execute();
        } else {
          console.log(`Could not find macro ${item.data.data.rollMacro}.`);
        }
      }
    } else if (item.data.data.rollFormula) {
      // roll formula
      await this._rollOutcome(
        item.data.data.rollFormula,
        this.getRollData(),
        item.data.data.rollLabel,
        () => ``
      );
    }
  }

  async useAction(itemId) {
    const item = this.items.get(itemId);
    if (!item || !item.data.data.rollLabel) {
      return;
    }

    if (item.data.data.rollMacro) {
      // roll macro
      if (item.data.data.rollMacro.includes(",")) {
        // assume it's a CSV string for {pack},{macro name}
        const [packName, macroName] = item.data.data.rollMacro.split(",");
        const pack = game.packs.get(packName);
        if (pack) {
          const content = await pack.getDocuments();
          const macro = content.find((i) => i.name === macroName);
          if (macro) {
            macro.execute();
          } else {
            console.log(
              `Could not find macro ${macroName} in pack ${packName}.`
            );
          }
        } else {
          console.log(`Pack ${packName} not found.`);
        }
      } else {
        // assume it's the name of a macro in the current world/game
        const macro = game.macros.find(
          (m) => m.name === item.data.data.rollMacro
        );
        if (macro) {
          macro.execute();
        } else {
          console.log(`Could not find macro ${item.data.data.rollMacro}.`);
        }
      }
    } else if (item.data.data.rollFormula) {
      // roll formula
      await this._rollOutcome(
        item.data.data.rollFormula,
        this.getRollData(),
        item.data.data.rollLabel,
        () => ``
      );
    }
  }

  async useSkill(itemId) {
    const item = this.items.get(itemId);
    if (!item || !item.data.data.rollLabel) {
      return;
    }

    if (item.data.data.rollMacro) {
      // roll macro
      if (item.data.data.rollMacro.includes(",")) {
        // assume it's a CSV string for {pack},{macro name}
        const [packName, macroName] = item.data.data.rollMacro.split(",");
        const pack = game.packs.get(packName);
        if (pack) {
          const content = await pack.getDocuments();
          const macro = content.find((i) => i.name === macroName);
          if (macro) {
            macro.execute();
          } else {
            console.log(
              `Could not find macro ${macroName} in pack ${packName}.`
            );
          }
        } else {
          console.log(`Pack ${packName} not found.`);
        }
      } else {
        // assume it's the name of a macro in the current world/game
        const macro = game.macros.find(
          (m) => m.name === item.data.data.rollMacro
        );
        if (macro) {
          macro.execute();
        } else {
          console.log(`Could not find macro ${item.data.data.rollMacro}.`);
        }
      }
    } else if (item.data.data.rollFormula) {
      // roll formula
      await this._rollOutcome(
        item.data.data.rollFormula,
        this.getRollData(),
        item.data.data.rollLabel,
        () => ``
      );
    }
  }

  async _rollOutcome(
    dieRoll,
    rollData,
    cardTitle,
    outcomeTextFn,
    rollFormula = null
  ) {
    let roll = 0;
    let criticalText = '';  
    if(dieRoll) {
      roll = new Roll(dieRoll, rollData);
      roll.evaluate({ async: false });
      await showDice(roll);
    
      let rr = roll.result;
      let rollNum = rr.substring(0, rr.indexOf('+')).trim();
      if (rollNum == 20) {
        criticalText = game.i18n.localize("FS.CriticalSuccess")
      }
    }
    const rollResult = {
      cardTitle: cardTitle,
      outcomeText: outcomeTextFn(roll),
      roll,
      rollFormula: rollFormula ?? roll.formula,
      criticalText: criticalText
    };
    
    const html = await renderTemplate(OUTCOME_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
    return roll;
  }

  async rollOmens() {
    const classItem = this.items.filter((x) => x.type === "class").pop();
    if (!classItem) {
      return;
    }
    const roll = await this._rollOutcome(
      "@omenDie",
      classItem.getRollData(),
      `${game.i18n.localize("FS.Omens")}`,
      (roll) => ` ${game.i18n.localize("FS.Omens")}: ${Math.max(0, roll.total)}`
    );
    const newOmens = Math.max(0, roll.total);
    await this.update({ ["data.omens"]: { max: newOmens, value: newOmens } });
  }

  async rollPowersPerDay() {
    const roll = await this._rollOutcome(
      "d4+@abilities.slick.value",
      this.getRollData(),
      `${game.i18n.localize("FS.Powers")} ${game.i18n.localize("FS.PerDay")}`,
      (roll) =>
        ` ${game.i18n.localize("FS.PowerUsesRemaining")}: ${Math.max(
          0,
          roll.total
        )}`,
      `1d4 + ${game.i18n.localize("FS.AbilitySlickAbbrev")}`
    );
    const newUses = Math.max(0, roll.total);
    await this.update({
      ["data.powerUses"]: { max: newUses, value: newUses },
    });
  }

  /**
   *
   * @param {*} restLength "short" or "long"
   * @param {*} foodAndDrink "snack", "smoke", "drink", "nap", "eat", "sleep", "entertainment"
   * @param {*} miserable true/false
   */
  async rest(restLength, foodAndDrink, miserable) {
    if(miserable) {
      await this.showRestNoEffect();
      return;
    }
    let extraHP = 0;
    let items = [];
    for(let x=0; x<foodAndDrink.length;x++) {
      console.log(foodAndDrink[x].value)
      items.push(foodAndDrink[x].value)
    }
    const shortRestItems = ['smoke', 'drink', 'nap', 'snack'];
    const longRestItems = ['sleep', 'entertainment', 'eat'];

    if (restLength === "short") {
      
      shortRestItems.forEach((item) => {
        if(items.includes(item)) {
          extraHP += 1;
        }
      });
      await this.rollHealHitPoints("d4", extraHP);
    }
    if (restLength === "long") {
      longRestItems.forEach((item) => {
        if(items.includes(item)) {
          extraHP += 2;
        }
      });
      await this.rollHealHitPoints("", extraHP);
    }
  }

    /**
   *
   * @param {*} survivalType "hunting", "foraging" or "fishing"
   * @param {*} survivalAttribute "grit", "slick", "wits", "luck"
   * @param {*} equipped true/false
   * @param {*} targetDR int
   */
     async survival(survivalType, survivalAttribute, equipped, targetDR, advantage) {
      
      //let attributeValue = this.data.data.abilities.grit.value;

      const advantageDisplay = (advantage === 'no-choice') ? '' : advantage;
      const survivalRoll1 = new Roll(
          `d20+@abilities.${survivalAttribute}.value`,
          this.getRollData()
        );
      survivalRoll1.evaluate({ async: false });
      
      let result1 = survivalRoll1.terms[0].results[0].result;
      let result2 = 0;
      let survivalRoll;
      let result;
      if(advantage && (advantage === 'advantage' || advantage === 'disadvantage') ) {
        const survivalRoll2 = new Roll(
          `d20+@abilities.${survivalAttribute}.value`,
          this.getRollData()
        );
        survivalRoll2.evaluate({ async: false });
        result2 = survivalRoll2.terms[0].results[0].result;
        if (advantage === 'advantage') {
          survivalRoll = (result1 > result2) ? survivalRoll1 : survivalRoll2;
          result = (result1 > result2) ? result1 : result2;
        }
        if (advantage === 'disadvantage') {
          survivalRoll = (result1 < result2) ? survivalRoll1 : survivalRoll2;
          result = (result1 < result2) ? result1 : result2;
        }
      }
      else {
        survivalRoll = survivalRoll1;
      }
  
      //defendRoll.evaluate({ async: false });
      await showDice(survivalRoll);


      // if (result >= targetDR) {
      //   console.log('SUCCESS')
      // }
      // else {
      //   console.log('FAILURE')
      // }

      
      let typeName = this._titleCase(survivalType);
      let failureSuccess = (result < targetDR) ? "Failure" : "Success";
      let failureSuccessCheck = game.i18n.localize(`FS.${failureSuccess}`);
      let survivalOutcomeCheck = game.i18n.localize(`FS.${typeName}${failureSuccess}`);
      console.log('survivalOutcomeCheck');
      console.log(survivalOutcomeCheck)
      let survivalOutcome = `${failureSuccessCheck}. ${survivalOutcomeCheck}`
      
//      let survivalOutcome = `${game.i18n.localize("FS.${result}")}<br/>${game.i18n.localize("FS.${typeName}${failureSuccess}")}`

      let abilityAbbrevKey = this._titleCase(survivalAttribute);
      const rollResult = {
        actor: this,
        targetDR,
        survivalFormula: `1d20 + ${game.i18n.localize(abilityAbbrevKey)}`,
        survivalRoll,
        result1,
        result2,
        survivalOutcome,
        typeName,
        advantageDisplay
      };
      console.log('-- roll result --')
      console.log(rollResult)
      await this._renderSurvivalRollCard(rollResult);
      
      
      // let extraHP = 0;
      // let items = [];
      // for(let x=0; x<foodAndDrink.length;x++) {
      //   console.log(foodAndDrink[x].value)
      //   items.push(foodAndDrink[x].value)
      // }
      // const shortRestItems = ['smoke', 'drink', 'nap', 'snack'];
      // const longRestItems = ['sleep', 'entertainment', 'eat'];
  
      // if (restLength === "short") {
        
      //   shortRestItems.forEach((item) => {
      //     if(items.includes(item)) {
      //       extraHP += 1;
      //     }
      //   });
      //   await this.rollHealHitPoints("d4", extraHP);
      // }
      // if (restLength === "long") {
      //   longRestItems.forEach((item) => {
      //     if(items.includes(item)) {
      //       extraHP += 2;
      //     }
      //   });
      //   await this.rollHealHitPoints("", extraHP);
      // }
    }

  async showRestNoEffect() {
    const result = {
      cardTitle: game.i18n.localize("FS.Rest"),
      outcomeText: game.i18n.localize("FS.NoEffect"),
    };
    const html = await renderTemplate(OUTCOME_ONLY_ROLL_CARD_TEMPLATE, result);
    await ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async showSurvivalNoEffect() {
    const result = {
      cardTitle: game.i18n.localize("FS.Survival"),
      outcomeText: game.i18n.localize("FS.NoEffect"),
    };
    const html = await renderTemplate(OUTCOME_ONLY_ROLL_CARD_TEMPLATE, result);
    await ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async rollHealHitPoints(dieRoll, extraHP) {
    if (dieRoll) {
      const roll = await this._rollOutcome(
        dieRoll,
        this.getRollData(),
        game.i18n.localize("FS.Rest"),
        (roll) =>
          `${game.i18n.localize("FS.Heal")} ${roll.total} + ${extraHP} ${game.i18n.localize("FS.HP")}`
      );
    }
    else {
      const roll = await this._rollOutcome(
        null,
        this.getRollData(),
        game.i18n.localize("FS.Rest"),
        `${game.i18n.localize("FS.Heal")} ${extraHP} ${game.i18n.localize("FS.HP")}`
      );
    }

    const newHP = Math.min(
      this.data.data.hp.max,
      this.data.data.hp.value + roll.total + extraHP
    );
    await this.update({ ["data.hp.value"]: newHP });
  }

  async rollStarvation() {
    const roll = await this._rollOutcome(
      "d4",
      this.getRollData(),
      game.i18n.localize("FS.Starvation"),
      (roll) =>
        `${game.i18n.localize("FS.Take")} ${roll.total} ${game.i18n.localize(
          "FS.Damage"
        )}`
    );
    const newHP = this.data.data.hp.value - roll.total;
    await this.update({ ["data.hp.value"]: newHP });
  }

  async rollInfection() {
    const roll = await this._rollOutcome(
      "d6",
      this.getRollData(),
      game.i18n.localize("FS.Infection"),
      (roll) =>
        `${game.i18n.localize("FS.Take")} ${roll.total} ${game.i18n.localize(
          "FS.Damage"
        )}`
    );
    const newHP = this.data.data.hp.value - roll.total;
    await this.update({ ["data.hp.value"]: newHP });
  }

  async getBetter() {
    const oldHp = this.data.data.hp.max;
    const newHp = this._betterHp(oldHp);
    const oldGrit = this.data.data.abilities.grit.value;
    const newGrit = this._betterAbility(oldGrit);
    const oldLuck = this.data.data.abilities.luck.value;
    const newLuck = this._betterAbility(oldLuck);
    const oldSlick = this.data.data.abilities.slick.value;
    const newSlick = this._betterAbility(oldSlick);
    const oldWits = this.data.data.abilities.wits.value;
    const newTou = this._betterAbility(oldWits);
    let newSilver = this.data.data.silver;

    const hpOutcome = this._abilityOutcome(
      game.i18n.localize("FS.HP"),
      oldHp,
      newHp
    );
    const strOutcome = this._abilityOutcome(
      game.i18n.localize("FS.AbilityGrit"),
      oldGrit,
      newGrit
    );
    const agiOutcome = this._abilityOutcome(
      game.i18n.localize("FS.AbilityLuck"),
      oldLuck,
      newLuck
    );
    const preOutcome = this._abilityOutcome(
      game.i18n.localize("FS.AbilitySlick"),
      oldSlick,
      newSlick
    );
    const touOutcome = this._abilityOutcome(
      game.i18n.localize("FS.AbilityWits"),
      oldWits,
      newWits
    );

    // Left in the debris you find...
    let debrisOutcome = null;
    let scrollTableName = null;
    const debrisRoll = new Roll("1d6", this.getRollData()).evaluate({
      async: false,
    });
    if (debrisRoll.total < 4) {
      debrisOutcome = "Nothing";
    } else if (debrisRoll.total === 4) {
      const silverRoll = new Roll("3d10", this.getRollData()).evaluate({
        async: false,
      });
      debrisOutcome = `${silverRoll.total} silver`;
      newSilver += silverRoll.total;
    } else if (debrisRoll.total === 5) {
      debrisOutcome = "an unclean scroll";
      scrollTableName = "Unclean Scrolls";
    } else {
      debrisOutcome = "a sacred scroll";
      scrollTableName = "Sacred Scrolls";
    }

    // show a single chat message for everything
    const data = {
      agiOutcome,
      debrisOutcome,
      hpOutcome,
      preOutcome,
      strOutcome,
      touOutcome,
    };
    const html = await renderTemplate(GET_BETTER_ROLL_CARD_TEMPLATE, data);
    ChatMessage.create({
      content: html,
      sound: CONFIG.sounds.dice, // make a single dice sound
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });

    if (scrollTableName) {
      // roll a scroll
      const pack = game.packs.get("frontierscum.random-scrolls");
      const content = await pack.getDocuments();
      const table = content.find((i) => i.name === scrollTableName);
      await table.draw();
    }

    // set new stats on the actor

    await this.update({
      ["data.abilities.grit.value"]: newGrit,
      ["data.abilities.wits.value"]: newWits,
      ["data.abilities.slick.value"]: newSlick,
      ["data.abilities.luck.value"]: newLuck,
      ["data.hp.max"]: newHp,
      ["data.silver"]: newSilver,
    });
  }

  _betterHp(oldHp) {
    const hpRoll = new Roll("6d10", this.getRollData()).evaluate({
      async: false,
    });
    if (hpRoll.total >= oldHp) {
      // success, increase HP
      const howMuchRoll = new Roll("1d6", this.getRollData()).evaluate({
        async: false,
      });
      return oldHp + howMuchRoll.total;
    } else {
      // no soup for you
      return oldHp;
    }
  }

  _betterAbility(oldVal) {
    const roll = new Roll("1d6", this.getRollData()).evaluate({ async: false });
    if (roll.total === 1 || roll.total < oldVal) {
      // decrease, to a minimum of -3
      return Math.max(-3, oldVal - 1);
    } else {
      // increase, to a max of +6
      return Math.min(6, oldVal + 1);
    }
  }

  _abilityOutcome(abilityName, oldVal, newVal) {
    if (newVal < oldVal) {
      return `Lose ${oldVal - newVal} ${abilityName}`;
    } else if (newVal > oldVal) {
      return `Gain ${newVal - oldVal} ${abilityName}`;
    } else {
      return `${abilityName} unchanged`;
    }
  }

  async scvmify() {
    new ScvmDialog(this).render(true);
  }

  async rollDice(expression) {
    let roll = new Roll(expression).evaluate({ async: false });
    await showDice(roll);
    return roll;
  }

  async rollDeathCheck() {
    //TODO update to use language files
  //   "FS.DeathCheck": "Death Check",
  // "FS.DeathCheckGoner": "You're A Goner. You're dying and there's nothing you can do about it. Roll on the You're A Goner table.",
  // "FS.DeathCheckDead": "☠ DEAD ☠",
  // "FS.DeathCheckZZZ": "ZZZZZZZ. You're unconscious until you have at least 1 HP.",
  // "FS.DeathCheckBetterOrWorse": "A Lesson For Better Or Worse. Pick a random ability; roll d6 and compare to ability. If result is HIGHER, increase ability by 1; if LOWER, decrease ability by 1. Result of 1 always decreases ability but never below -6.",
  // "FS.DeathCheckHangingInThere": "Hanging In There. Remain at your current HP.",
  // "FS.DeathCheckSecondWind": "A Second Wind! Heal d4 and increase max HP by 1.",
    let deathCheckRoll = new Roll("1d20").evaluate({ async: false });
    await showDice(deathCheckRoll);
    let gritValue = this.data.data.abilities.grit.value;
    let hpValue = this.data.data.hp.value;
    hpValue = (hpValue < 1) ? hpValue : '+0';
    let additionalRolls = [];
    let total = deathCheckRoll.total + parseInt(gritValue) + parseInt(hpValue);
    let rollDisplay = deathCheckRoll.result + gritValue + hpValue;
    let outcomeLines = [];
    //let additionalRolls = [];
    if (total <= 1) {
      outcomeLines = [
        game.i18n.format("FS.DeathCheckDead", {}),
      ];
    } 
    else if (total >= 2 && total <=5) {
      let gonerRoll = new Roll("1d6").evaluate({ async: false });
      await showDice(gonerRoll);
      let result = gonerRoll.result;
      additionalRolls.push(gonerRoll)
      let gonerText = "You're A Goner!\n"
      let gonerEffectRoll;
      let gonerEffectText ='';
      if (result < 3) {
        const roll = await this.rollDice("1d10") 
        gonerEffectRoll = roll.result; 
        gonerEffectText = ` minutes to make your mark.`; 
      }
      if (result >2 && result <5) { 
        const roll = await this.rollDice("1d8");
        gonerEffectRoll = roll.result; 
        gonerEffectText = ' hours of pain and panic.';
      }
      if (result == 5) { 
        const roll = await this.rollDice("1d6");
        gonerEffectRoll = roll.result; 
        gonerEffectText = ' drawn-out days of misery.';
      }
      if (result == 6) { 
        const roll = await this.rollDice("1d4");
        gonerEffectRoll = roll.result; 
        gonerEffectText = ' weeks of tedious expiration.';
      }
      gonerText += `${gonerEffectRoll} ${gonerEffectText}`; 
      outcomeLines = [gonerText];
    }
    else if (total >= 6 && total <=10) { outcomeLines = ['Zzzzzz. You’re unconscious until you have at least 1 HP.'] }
    else if (total >= 11 && total <=15) {
      const roll = await this.rollDice("1d4");
      const result = roll.result;
      let abilityName;
      if (result == 1) { abilityName = game.i18n.localize("FS.AbilityGrit") }
      if (result == 2) { abilityName = game.i18n.localize("FS.AbilitySlick") }
      if (result == 3) { abilityName = game.i18n.localize("FS.AbilityWits") }
      if (result == 4) { abilityName = game.i18n.localize("FS.AbilityLuck") }
      outcomeLines = [`A Lesson For Better Or Worse. Roll d6 and compare to ${abilityName}; if greater, increase ability by one; if less, decrease ability by to maximum of -6.`] }
    else if (deathCheckRoll.result == 20) { outcomeLines = ['NAT 20!! A SECOND WIND! Heal d4 and increase max HP by 1.'] }
    else {
      outcomeLines = ['Hanging In There! Remain at your current HP.']
    }
    let formula = `1d20 + ${gritValue} (${game.i18n.localize("FS.AbilityGrit")}) - ${hpValue} (${game.i18n.localize("FS.HP")})`;
    formula = formula.replace("+  -", "- ").replace("+ -", "- ").replace("- -", "- ");
  
    const data = {
      additionalRolls,
      rollDisplay: rollDisplay,
      outcomeLines,
      deathCheckFormula: formula,
      deathCheckTotal: total,
    };
    const html = await renderTemplate(DEATH_CHECK_ROLL_CARD_TEMPLATE, data);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }
  async rollDropCheck() {
    let dropCheckRoll = new Roll("1d20").evaluate({ async: false });
    await showDice(dropCheckRoll);
    let gritValue = this.data.data.abilities.grit.value;
    let hpValue = this.data.data.hp.value;
    hpValue = (hpValue < 1) ? hpValue : '+0';
    let additionalRolls = [];
    let total = dropCheckRoll.total + parseInt(gritValue) + parseInt(hpValue);
    let rollDisplay = dropCheckRoll.result + gritValue + hpValue;
    let outcomeLines = [];
    //let additionalRolls = [];
    if (total <= 10) {
      outcomeLines = ['Drop unconscious until you have at least 1 HP.'];
    } 
    else { outcomeLines = ['Remain at your current HP.']; }
    let formula = `1d20 + ${gritValue} (${game.i18n.localize("FS.AbilityGrit")}) - ${hpValue} (${game.i18n.localize("FS.HP")})`;
    formula = formula.replace("+  -", "- ").replace("+ -", "- ").replace("- -", "- ");
  
    const data = {
      additionalRolls,
      rollDisplay: rollDisplay,
      outcomeLines,
      deathCheckFormula: formula,
      deathCheckTotal: total,
    };
    const html = await renderTemplate(DROP_CHECK_ROLL_CARD_TEMPLATE, data);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }
}
