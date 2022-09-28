import {FSActor} from "../actor/actor.js";
import {FS} from "../config.js";
import {FSItem} from "../item/item.js";
import {randomName} from "./names.js";

export const createRandomScvm = async () => {
    const clazz = await pickRandomClass();
    await createScvm(clazz);
};

export const createScvm = async (clazz) => {
    const scvm = await rollScvmForClass(clazz);
    await createActorWithScvm(scvm);
};

export const scvmifyActor = async (actor, clazz) => {
    const scvm = await rollScvmForClass(clazz);
    await updateActorWithScvm(actor, scvm);
};

const pickRandomClass = async () => {
    const classPacks = findClassPacks();
    if (classPacks.length === 0) {
        // TODO: error on 0-length classPaths
        return;
    }
    const packName = classPacks[Math.floor(Math.random() * classPacks.length)];
    // TODO: debugging hardcodes
    const pack = game.packs.get(packName);
    const content = await pack.getDocuments();
    return content.find((i) => i.data.type === "class");
};

export const findClassPacks = () => {
    const classPacks = [];
    const packKeys = game.packs.keys();
    
    for (const packKey of packKeys) {
        console.log(`packKey: ${packKey}`)
        // moduleOrSystemName.packName
        const keyParts = packKey.split(".");
        if (keyParts.length === 2) {
            const packName = keyParts[1];
            if (packName.startsWith("class-") && packName.length > 6) {
                // class pack
                classPacks.push(packKey);
            }
        }
    }
    console.log(classPacks)
    return classPacks;
};

export const classItemFromPack = async (packName) => {
    const pack = game.packs.get(packName);
    const content = await pack.getDocuments();
    return content.find((i) => i.data.type === "class");
};

function rollStat() {
    const roll1 = new Roll(`1d4`).evaluate({async: false}).total;
    console.log(`stat roll 1: ${roll1}`)
    const roll2 = new Roll(`1d4`).evaluate({async: false}).total;
    console.log(`stat roll 2: ${roll2}`)
    let result = roll1 - roll2;
    return result;
};

const delay = ms => new Promise(res => setTimeout(res, ms));


const rollScvmForClass = async (clazz) => {
    console.log(`Creating new ${clazz.data.name}`);
    // TODO: omens become aces?
    // const omensRoll = new Roll(clazz.data.data.omenDie).evaluate({
    //   async: false,
    // });
    const omensRoll = 0;
    const hpRoll = new Roll(clazz.data.data.startingHitPoints).evaluate({
        async: false,
    });
    const powerUsesRoll = new Roll("1d4").evaluate({async: false});
    console.log('POWER USE ROLL')
    console.log(powerUsesRoll)

    const grit = rollStat();
    const luck = rollStat();
    const slick = rollStat();
    const wits = rollStat();

    let silverDice = 0;
    if (grit < 0) {
        silverDice++;
        console.log('Thanks to deficient Grit, you got some silver.');
    }
    if (luck < 0) {
        silverDice++;
        console.log('Thanks to deficient Luck, you got some silver.');
    }
    if (slick < 0) {
        silverDice++;
        console.log('Thanks to deficient Slick, you got some silver.');
    }
    if (wits < 0) {
        silverDice++;
        console.log('Thanks to deficient Wits, you got some silver.');
    }

    let silverRoll = new Roll(`${silverDice}d10`).evaluate({
        async: false,
    });
    console.log(`silverRoll: ${silverRoll.total}`)
    silverRoll = silverRoll.total * 10;

    let hitPoints = Math.max(1, hpRoll.total + grit);
    if (hitPoints <= 0) {
        hitPoints = 1;
    }
    const powerUses = Math.max(0, powerUsesRoll.total + slick);

    const allDocs = [clazz];

    if (FS.scvmFactory.foodAndWaterPack) {
        // everybody gets food and water
        const miscPack = game.packs.get(FS.scvmFactory.foodAndWaterPack);
        const miscContent = await miscPack.getDocuments();
        if (FS.scvmFactory.foodItemName) {
            const food = miscContent.find(
                (i) => i.data.name === FS.scvmFactory.foodItemName
            );
            const foodRoll = new Roll("2d4", {}).evaluate({async: false});
            console.log(`FOOD ROLL: ${foodRoll.total}`)
            // TODO: need to mutate _data to get it to change for our owned item creation.
            // Is there a better way to do this?
            food.data.quantity = foodRoll.total;
            console.log('food.data.quantity')
            //console.log(food.data.quantity)
            food.data._source.data.quantity = foodRoll.total;
            allDocs.push(food);
        }
        if (FS.scvmFactory.waterItemName) {
            const waterskin = miscContent.find(
                (i) => i.data.name === FS.scvmFactory.waterItemName
            );
            allDocs.push(waterskin);
        }
        if (FS.scvmFactory.saddleItemName) {
            const saddle = miscContent.find(
                (i) => i.data.name === FS.scvmFactory.saddleItemName
            );
            allDocs.push(saddle);
        }
    }

    // starting equipment, weapons, armor, and traits etc all come from the same pack
    const ccPack = game.packs.get(FS.scvmFactory.characterCreationPack);
    const ccContent = await ccPack.getDocuments();

    // 3 starting equipment tables
    // if (FS.scvmFactory.bonusItemsTable) {
    //     const equipTable1 = ccContent.find(
    //         (i) => i.name === FS.scvmFactory.bonusItemsTable
    //     );
    //     const eqDraw1 = await equipTable1.draw({displayChat: false});
    //     console.log('BONUS ITEMS DRAW')
    //     console.log(eqDraw1.results)
    //     const eq1 = await docsFromResults(eqDraw1.results);
    //     allDocs.push(...eq1);
    // }

    // const rolledScroll =
    //     allDocs.filter((i) => i.data.type === "scroll").length > 0;

    // starting weapon
    if (FS.scvmFactory.startingWeaponTable) {
        const weaponTable = ccContent.find(
            (i) => i.name === FS.scvmFactory.startingWeaponTable
        );
        const weaponDraw = await weaponTable.draw({displayChat: false});
        const weapons = await docsFromResults(weaponDraw.results);
        
        let weaponName = weapons[0].data.name;
        if (weaponName.includes("Pistol") || weaponName.includes("Revolver"))
        {
            const pistolAmmo = await getItem("Ammo: Pistol Slugs");
            console.log(pistolAmmo)
            allDocs.push(...pistolAmmo)
        }
        if (weaponName.includes("Rifle"))
        {
            const rifleAmmo = await getItem("Ammo: Rifle Rounds");
            allDocs.push(...rifleAmmo)
        }
        if (weaponName.includes("Shotgun"))
        {
            const shotgunAmmo = await getItem("Ammo: Shotgun Shells");
            allDocs.push(...shotgunAmmo)
        }
        allDocs.push(...weapons);
    }

    // starting hat
    if (FS.scvmFactory.startingHatTable) {
        const hatTable = ccContent.find(
            (i) => i.name === FS.scvmFactory.startingHatTable
        );
        const hatDraw = await hatTable.draw({displayChat: false});
        const hat = await docsFromResults(hatDraw.results);
        
        allDocs.push(...hat);
    }

    let horseDescription;
    // starting horse
    if (FS.scvmFactory.startingHorseTable) {
        const startingHorseTypeTable = ccContent.find(
            (i) => i.name === FS.scvmFactory.startingHorseTable
        );
        const startingHorseTypeDraw = await startingHorseTypeTable.draw({displayChat: false});
        const horse = await docsFromResults(startingHorseTypeDraw.results);
        
        let horseType = horse[0].data.name;
        
        // horse name 1
        const horseName1Table = ccContent.find(
            (i) => i.name === FS.scvmFactory.horseName1Table
        );
        const horseName1Draw = await horseName1Table.draw({displayChat: false});
        let horseName1 = horseName1Draw.results[0].data.text;
        // horse name 2
        const horseName2Table = ccContent.find(
            (i) => i.name === FS.scvmFactory.horseName2Table
        );
        const horseName2Draw = await horseName2Table.draw({displayChat: false});
        let horseName2 = horseName2Draw.results[0].data.text;
        // horse coat
        const horseCoatTable = ccContent.find(
            (i) => i.name === FS.scvmFactory.horseCoatTable
        );
        const horseCoatDraw = await horseCoatTable.draw({displayChat: false});
        let horseCoat = horseCoatDraw.results[0].data.text;
        // horse likes
        const horseLikesTable = ccContent.find(
            (i) => i.name === FS.scvmFactory.horseLikesTable
        );
        const horseLikesDraw = await horseLikesTable.draw({displayChat: false});
        let horseLikes = horseLikesDraw.results[0].data.text;

        horseDescription = `${horseName1} ${horseName2} is a ${horseCoat.toLowerCase()} ${horseType.toLowerCase()} that likes ${horseLikes.toLowerCase()}.`;
        allDocs.push(...horse);
        
    }

    // class-specific starting items
    if (clazz.data.data.startingItems) {
        const startingItems = [];
        const lines = clazz.data.data.startingItems.split("\n");
        for (const line of lines) {
            const [packName, itemName] = line.split(",");
            const pack = game.packs.get(packName);
            if (pack) {
                const content = await pack.getDocuments();
                const item = content.find((i) => i.data.name === itemName);
                if (item) {
                    startingItems.push(item);
                }
            }
        }
        allDocs.push(...startingItems);
    }

    // start accumulating character description, starting with the class description
    const descriptionLines = [];
    descriptionLines.push(clazz.data.data.description);
    descriptionLines.push("<p>&nbsp;</p>");

    let descriptionLine = "";

    if (FS.scvmFactory.crimeTable1) {
        const ttCrimeTable1 = ccContent.find(
            (i) => i.name === FS.scvmFactory.crimeTable1
        );
        const ttCrimeResults1 = await compendiumTableDrawMany(ttCrimeTable1, 1);
        const crime1Text = ttCrimeResults1[0].data.text.split('~');
        const crime1 = crime1Text[0];
        const crime1Num = crime1Text[1];
        console.log(`crime1Num: ${crime1Num}`)
        const ttCrimeTable2 = ccContent.find(
            (i) => i.name === FS.scvmFactory.crimeTable2
        );
        const ttCrimeResults2 = await compendiumTableDrawMany(ttCrimeTable2, 1);
        const crime2Text = ttCrimeResults2[0].data.text.split('~');
        const crime2 = crime2Text[0];
        const crime2Num = crime2Text[1];
        console.log(`crime2Num: ${crime2Num}`)
        const reward = (parseInt(crime1Num) + parseInt(crime2Num)) * 10;
        descriptionLine += `WANTED FOR: ${crime1} ${crime2}.<br/>REWARD: ${reward}<br/><p>&nbsp;</p>`;
    }
    let terribleTrait1;
    let terribleTrait2;
    let cowboyTrait1;
    let cowboyTrait2;

    if (FS.scvmFactory.terribleTraitsTable) {
        const ttTable = ccContent.find(
            (i) => i.name === FS.scvmFactory.terribleTraitsTable
        );
        const ttResults = await compendiumTableDrawMany(ttTable, 2);
        terribleTrait1 = ttResults[0].data.text;
        terribleTrait2 = ttResults[1].data.text;
        
    }
    if (FS.scvmFactory.cowboyTraitsTable1) {
        const ttCowboyTable1 = ccContent.find(
            (i) => i.name === FS.scvmFactory.cowboyTraitsTable1
        );
        const ttCowboyResults1 = await compendiumTableDrawMany(ttCowboyTable1, 1);
        cowboyTrait1 = ttCowboyResults1[0].data.text;
        const ttCowboyTable2 = ccContent.find(
            (i) => i.name === FS.scvmFactory.cowboyTraitsTable2
        );
        const ttCowboyResults2 = await compendiumTableDrawMany(ttCowboyTable2, 1);
        cowboyTrait2 = ttCowboyResults2[0].data.text;
        
    }
    descriptionLine += `<table><tr><td>`
    descriptionLine += `TRAITS<ul><li>${terribleTrait1}.</li>`;
    descriptionLine += `<li>${terribleTrait2
        .charAt(0)
        .toUpperCase()}${terribleTrait2.slice(1)}.</li>`;
    descriptionLine += `<li>${cowboyTrait1}.</li>`
    descriptionLine += `<li>${cowboyTrait2}.</li></ul>`;
    descriptionLine += `<br/>`;
    if (FS.scvmFactory.brokenBodiesTable) {
        const bbTable = ccContent.find(
            (i) => i.name === FS.scvmFactory.brokenBodiesTable
        );
        const bbDraw = await bbTable.draw({displayChat: false});
        const brokenBody = bbDraw.results[0].data.text;
        descriptionLine += `</td><td valign=top>BROKEN BODY: ${brokenBody}<br/><br/>`;
    }
    if (FS.scvmFactory.badHabitsTable) {
        const bhTable = ccContent.find(
            (i) => i.name === FS.scvmFactory.badHabitsTable
        );
        const bhDraw = await bhTable.draw({displayChat: false});
        const badHabit = bhDraw.results[0].data.text;
        descriptionLine += `BAD HABIT: ${badHabit}</td></tr></table><br/>`;
    }
    if (descriptionLine) {
        descriptionLines.push(descriptionLine);
        //descriptionLines.push("<p>&nbsp;</p>");
    }
    descriptionLines.push(`HORSE: ${horseDescription}<br/><br/>SKILL ORIGINS<br/>`);
    // class-specific starting rolls
    const startingRollItems = [];
    if (clazz.data.data.startingRolls) {
        const lines = clazz.data.data.startingRolls.split("\n");
        for (const line of lines) {
            const [packName, tableName, rolls] = line.split(",");
            console.log(`packName: ${packName}`)
            // console.log(`rolls: ${rolls}`)
            // assume 1 roll unless otherwise specified in the csv
            const numRolls = rolls ? parseInt(rolls) : 1;
            console.log(`numRolls: ${numRolls}`)
            const pack = game.packs.get(packName);
            if (pack) {
                const content = await pack.getDocuments();
                const table = content.find((i) => i.name === tableName);
                if (table) {
                    console.log(table);
                    // const tableDraw = await table.drawMany(numRolls, {displayChat: false});
                    // const results = tableDraw.results;
                    const results = await compendiumTableDrawMany(table, numRolls);
                    for (const result of results) {
                        console.log('--- RESULT DATA TYPE ---')
                        console.log(result.data.type)
                        console.log(result)
                        // draw result type: text (0), entity (1), or compendium (2)
                        if (result.data.type === 0) {
                            // text
                            descriptionLines.push(
                                `<p>${table.data.name}: ${result.data.text}</p>`
                            );
                        } else if (result.data.type === 1) {
                            // entity
                            // TODO: what do we want to do here?
                            const entity = await entityFromResult(result);
                            startingRollItems.push(entity);
                        } else if (result.data.type === 2) {
                            // compendium
                            const entity = await entityFromResult(result);
                            startingRollItems.push(entity);
                        }
                    }
                } else {
                    console.log(`Could not find RollTable ${tableName}`);
                }
            } else {
                console.log(`Could not find compendium ${packName}`);
            }
        }
    }
    allDocs.push(...startingRollItems);

    // add items as owned items
    const items = allDocs.filter((e) => e instanceof FSItem);
    // for other non-item documents, just add some description text (ITEMTYPE: Item Name)
    const nonItems = allDocs.filter((e) => !(e instanceof FSItem));
    for (const nonItem of nonItems) {
        if (nonItem && nonItem.data && nonItem.data.type) {
            const upperType = nonItem.data.type.toUpperCase();
            descriptionLines.push(
                `<p>&nbsp;</p><p>${upperType}: ${nonItem.data.name}</p>`
            );
        } else {
            console.log(`Skipping non-item ${nonItem}`);
        }
    }

    // make simple data structure for embedded items
    const itemData = items.map((i) => ({
        data: i.data.data,
        img: i.data.img,
        name: i.data.name,
        type: i.data.type,
    }));

    return {
        actorImg: clazz.img,
        luck,
        description: descriptionLines.join(""),
        hitPoints,
        items: itemData,
        omens: omensRoll.total,
        powerUses,
        slick,
        silver: silverRoll,
        grit,
        tokenImg: clazz.img,
        wits,
    };
}


const scvmToActorData = (s) => {
    const newName = randomName();
    return {
        name: newName,
        // TODO: do we need to set folder or sort?
        // folder: folder.data._id,
        // sort: 12000,
        data: {
            abilities: {
                grit: {value: s.grit},
                luck: {value: s.luck},
                slick: {value: s.slick},
                wits: {value: s.wits},
            },
            description: s.description,
            hp: {
                max: s.hitPoints,
                value: s.hitPoints,
            },
            omens: {
                max: s.omens,
                value: s.omens,
            },
            powerUses: {
                max: s.powerUses,
                value: s.powerUses,
            },
            silver: s.silver,
        },
        img: s.actorImg,
        items: s.items,
        flags: {},
        token: {
            img: s.actorImg,
            name: newName,
        },
        type: "character",
    };
};

const createActorWithScvm = async (s) => {
    const data = scvmToActorData(s);
    // use FSActor.create() so we get default disposition, actor link, vision, etc
    const actor = await FSActor.create(data);
    actor.sheet.render(true);
};

const updateActorWithScvm = async (actor, s) => {
    const data = scvmToActorData(s);
    // Explicitly nuke all items before updating.
    // Before Foundry 0.8.x, actor.update() used to overwrite items,
    // but now doesn't. Maybe because we're passing items: [item.data]?
    // Dunno.
    await actor.deleteEmbeddedDocuments("Item", [], {deleteAll: true});
    await actor.update(data);
    // update any actor tokens in the scene, too
    for (const token of actor.getActiveTokens()) {
        await token.document.update({
            img: actor.data.img,
            name: actor.name,
        });
    }
};

const getItem = async (itemName) => {
    const results = [];
    let item = await game.items.getName(itemName);
    results.push(item)
    return results;
}

const docsFromResults = async (results) => {
    const ents = [];
    for (const result of results) {
        const entity = await entityFromResult(result);
        if (entity) {
            ents.push(entity);
        }
    }
    return ents;
};

const entityFromResult = async (result) => {
    // draw result type: text (0), entity (1), or compendium (2)
    // TODO: figure out how we want to handle an entity result

    // TODO: handle scroll lookup / rolls
    // TODO: can we make a recursive random scroll thingy
    if (result.data.type === 0) {

        // hack for not having recursive roll tables set up
        // TODO: set up recursive roll tables :P
        if (result.data.text === "Roll on Random Unclean Scrolls") {
            const collection = game.packs.get("frontierscum.random-scrolls");
            const content = await collection.getDocuments();
            const table = content.find((i) => i.name === "Unclean Scrolls");
            const draw = await table.draw({displayChat: false});
            const items = await docsFromResults(draw.results);
            return items[0];
        } else if (result.data.text === "Roll on Random Sacred Scrolls") {
            const collection = game.packs.get("frontierscum.random-scrolls");
            const content = await collection.getDocuments();
            const table = content.find((i) => i.name === "Sacred Scrolls");
            const draw = await table.draw({displayChat: false});
            const items = await docsFromResults(draw.results);
            return items[0];
        }
        else {
            let itemBonus = await game.items.getName(result.data.text);
            console.log('ITEM BONUS')
            console.log(itemBonus)
            return itemBonus;
        }
    }
    else if (result.data.type === 1 || result.data.type === 2) {
        // grab the item from the compendium
        const collection = game.packs.get(result.data.collection);
        if (collection) {
            // TODO: should we use pack.getEntity(entryId) ?
            // const item = await collection.getEntity(result._id);
            const content = await collection.getDocuments();
            const entity = content.find((i) => i.name === result.data.text);
            return entity;
        } else {
            let itemBonus = await game.items.getName(result.data.text);
            return itemBonus
            console.log(`Could not find pack ${result.data.collection}`);
        }
    }
};

const abilityBonus = (rollTotal) => {
    if (rollTotal <= 4) {
        return -3;
    } else if (rollTotal <= 6) {
        return -2;
    } else if (rollTotal <= 8) {
        return -1;
    } else if (rollTotal <= 12) {
        return 0;
    } else if (rollTotal <= 14) {
        return 1;
    } else if (rollTotal <= 16) {
        return 2;
    } else {
        // 17 - 20+
        return 3;
    }
};

const getTableDraw = async (rollTable) => {
    let resultText = '';
    let result = rollTable.roll({async: false});
    console.log(result)
    // Promise.all([result]).then((roll) => {

    console.log('-- output --')
    console.log(result.roll)

    console.log('-- roll results --')
    resultText = output.results[0].data.text;
    console.log(resultText);
    return resultText;
    // });
}
/** Workaround for compendium RollTables not honoring replacement=false */
const compendiumTableDrawMany = async (rollTable, numDesired) => {

    const rollTotals = [];
    let results = [];
    while (rollTotals.length < numDesired) {
        const tableDraw = await rollTable.draw({displayChat: false});
        if (rollTotals.includes(tableDraw.roll.total)) {
            // already rolled this, so roll again
            continue;
        }
        rollTotals.push(tableDraw.roll.total);
        results = results.concat(tableDraw.results);
    }
    return results;
};
