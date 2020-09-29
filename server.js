// Load dotenv
require('dotenv').config();

const express = require('express'),
    port = process.env.PORT || 3000;

// Load the SDK for JavaScript
var AWS = require('aws-sdk');
// Set the Region 
AWS.config.update({ region: 'us-east-1' });

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

var s3 = new AWS.S3({ version: '2006-03-01' });

var localStorage = new Map();

let megapackBucket = {
    Bucket: 'megapack'
};

s3.listObjects(megapackBucket, (err, data) => {
    data.Contents.forEach((value) => {
        if (value.Key.includes("thumbnail.jpg")) {
            console.log(value.Key.split("/")[0]);
            console.log(value.Key);
            var aircraftKey = value.Key.split("/")[0].split("_").splice(0, 2).join(" ");
            var liveryKey = value.Key.split("/")[0];
            var imageKey = value.Key;
            var entry = {
                liveryKey: liveryKey,
                imageKey: imageKey
            };
            if (localStorage.has(aircraftKey)) {
                localStorage.get(aircraftKey).push(entry);
            } else {
                let arr = new Array();
                arr.push(entry);
                localStorage.set(aircraftKey, arr);
            }
        }
    });

    logStorage();
});

const logStorage = () => {
    localStorage.forEach((key) => {
        key.forEach((entry) => {
            console.log(entry.imageKey);
        });
    });
}

const app = express();

app.use(express.static("public"));

app.get("/", (_, response) => {
    response.sendFile(__dirname + "/public/index.html");
});

const listener = app.listen(port, () => {
    console.log("Your app is listening on port " + listener.address().port);
});

// let testObject = {
//     Bucket: 'megapack',
//     Key: 'Asobo_b787_Virginatlantic/SimObjects/Airplanes/Asobo_b787_Virginatlantic/TEXTURE.ARG/thumbnail.jpg'
// }

// s3.getObject(testObject, (err, data) => {
//     console.log(data);
// });

