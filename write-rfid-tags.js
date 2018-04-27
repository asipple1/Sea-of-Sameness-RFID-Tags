const inquirer = require('inquirer');
const mfrc522 = require("mfrc522-rpi");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);


//# Init WiringPi with SPI Channel 0
mfrc522.initWiringPi(0);

db.defaults({ category: [], activetag: ""}).write();


// Now ask for tag

async function rfid() {
    try {
        let rfidTagName = await rfidName();
        let scanCardWithTagName = await scanCard(rfidTagName);
    } catch (e) {
        console.log(e);
    }
}


// Ask for RFID Name
function rfidName() {
    var questions = [{
        type: 'input',
        name: 'TagName',
        message: 'Please Enter Tag category Number:',
        validate: function validateFirstName(name) {
            return name !== '';
        }
    }];
    let data = inquirer.prompt(questions).then(answers => {
        return answers.TagName;
    });
    return data;
}


function scanCard(data) {
    console.log("scanning...");
    console.log("Please put chip or keycard in the antenna inductive zone!");
    console.log("Press Ctrl-C to stop.");



    let tagTime = setInterval(function() {

        //# reset card
        mfrc522.reset();

        //# Scan for cards
        let response = mfrc522.findCard();
        if (!response.status) {
            console.log("Please Scan The Card");
            return;
        }
        console.log("Card detected, CardType: " + response.bitSize);

        //# Get the UID of the card
        response = mfrc522.getUid();
        if (!response.status) {
            console.log("UID Scan Error");
            return;
        }

        //# If we have the UID, continue
        let uid = response.data;
        uid = uid.join("");


        // json file
        let categoryObject = {
            id: uid,
            category: data
        }
        // Update tag
        if(db.get('category').find({ id: uid }).value()) {
            if(db.get('category').find({ id: uid }).value().id == uid) {
                db.get('category').find({ id: uid }).assign({ category: data }).write();
            }
        }
        // Else create a new one
        else {
            db.get('category').push(categoryObject).write();
        }
        // db.get('category').push(categoryObject).write();

        console.log(`RFID tag stored in database id is ${uid} and name is ${data}`);
        stop();
    }, 500);

    // Stop scanning and restart
    function stop() {
        clearInterval(tagTime);
        rfid();
    }
}

// Start
rfid();
