const express = require("express");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = 3000;
const mfrc522 = require("mfrc522-rpi");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

mfrc522.initWiringPi(0);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/db.json', function(req, res){
  res.sendFile(__dirname + '/db.json');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


function rfid() {
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

        // If we have the UID, continue
        let uid = response.data;
        uid = uid.join("");

        io.emit("tagid", uid);
        db.set('activetag', uid).write();

        // Reset scanning card
        stop(uid);
    }, 500);

    function stop(uid) {
        clearInterval(tagTime);
        rfid();
    }
}
rfid();
