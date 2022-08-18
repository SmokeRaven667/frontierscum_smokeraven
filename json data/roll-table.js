/*
 * Create a custom config setting for tracking merchant image files
 */
let rollTableSelected = game.settings.register('frontier-scum', 'roll-table-selected', {
    name: 'roll-table-selected',
    hint: 'A description of the registered setting and its behavior.',
    scope: 'world',     // "world" = sync to db, "client" = local storage
    config: true,       // false if you dont want it to show in module config
    type: String,       // Number, Boolean, String,
    default: 0,
    range: {           // range turns the UI input into a slider input
        min: 0,           // but does not validate the value
        max: 100,
        step: 10
    },
    onChange: value => { // value is the new value of the setting
        console.log(value)
    },
    filePicker: false,  // set true with a String `type` to use a file picker input
});

const campaign = 'frontier scum';
let selectedTableName;
let selectOptions;
let currentUserName = game.users.current.name;
let isGM = false;
let tableName = "";

main();

function main() {
    isGM = (currentUserName == 'Gamemaster') ? true : false;
    selectOptions = getSelectOptions();
    setPageVars();
    showDialog();
}

function chatMessage(message) {
    ChatMessage.create({
      user: game.user._id,
      whisper: game.users.filter(u => u.isGM).map(u => u._id),
      content: message
    });
  }


function setPageVars() {
    // set page variables based on game settings so we can restore previously selected table in
    // dialog
    rollTableSelected = game.settings.get('frontier-scum','roll-table-selected');
}

function rollTable(tableNames) {
    // roll on the table
    // if there is only one table name, just draw and retturn the result because we want
    // that Item to appear in chat
    // but if there is more than one table name, we assume we should just concatenate the
    // result text in table order to build some kind of meaningful string (ex: if tables
    // Place Name 1 and Place Name 2 are specifed it will build a string combining the two results)
    console.log('find roll table based on name: ' + tableName)
    if (tableNames.length == 1) {
        let tableName = tableNames[0];
        const table = game.tables.find(x=>x.name === tableName);
        return table.draw();
    }
    else {
        let tablePromises = [];
        tableNames.map((tableName) => {
            const table = game.tables.find(x=>x.name === tableName);
            tablePromises.push(table.draw({displayChat: false}));
        });
        
        Promise.all(tablePromises).then((tableDraws) => {
            let returnValue = "";
            tableDraws.forEach((tableDraw)=> {
                let drawText = tableDraw.results[0].data.text;
                returnValue = `${returnValue} ${drawText}`
            })
            chatMessagePublic(returnValue) 
        });
    }
}


tableChange = (e) => {
    switch (e.value) {
        case "places-lost-frontier":
            tableNames = ["Place Name 1", "Place Name 2"];
            break;
        case "boots":
            tableNames = ["Boots"];
            break;
        case "special-dm-table":
            tableNames = ["Special DM Table"];
            break;
        default:
            tableNames = "";
    }
    game.settings.set('frontier-scum', 'roll-table-selected', e.value);
	return tableNames;
}

function getSelectOptions() {
    let selectOptions = `
    <div style="display: inline-block; width: 100%; margin-bottom: 10px">
        <label for="table" style="margin-right: 10px">Table:</label>
        <select id="table-select" name="table-select" onchange="tableChange(this)"/>
            <option value="no-choice">--</option>
            <option value="places-lost-frontier">Create Place Name</option>
            <option value="boots">Boots</option>
    `;
    if (isGM) {
        selectOptions += `<option value="special-dm-table">Special DM Table</option>`;

    }
    selectOptions += `</select></div><br />`;
    return selectOptions;
}

clearSelections = () => {
    /* script to reset settings value that tracks previous table name */
    game.settings.set('frontier-scum','roll-table-selected', '');
};

function showDialog() {
    new Dialog({
        title: `TABLE`,
        content: `
		<form>
			${selectOptions}
			<div style="display: flex; width: 100%; margin-bottom: 10px">

			</div>
		</form>
	`,
        buttons: {
            yes: {
                icon: "<i class='fas fa-check'></i>",
                label: `Roll`,
                callback: (html) => {
                    var e = document.getElementById("table-select");
                    let tableNames = tableChange(e);
                    rollTable(tableNames);
                }
            },
            no: {
                icon: "<i class='fas fa-times'></i>",
                label: `Cancel`
            },
            clear: {
                icon: "",
                label: `Clear Data`,
                callback: () => clearSelections()
            }
        },
        render: () => setChoices(),
        default: "yes"
    }).render(true)
}

setChoices = () => {
    console.log('setChoices with rollTableSelected')
    console.log(rollTableSelected)
    $('#table-select').val(rollTableSelected);
};

function chatMessagePublic(message) {
    ChatMessage.create({
        content: message
    });
}