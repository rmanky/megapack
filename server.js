// Load dotenv
require("dotenv").config();

const fs = require("fs"),
  join = require("path").join,
  express = require("express"),
  bodyParser = require("body-parser"),
  XmlStream = require("xml-stream"),
  AWS = require("aws-sdk"),
  s3Zip = require("s3-zip"),
  port = process.env.PORT || 3000;

AWS.config.update({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

var s3 = new AWS.S3({ version: "2006-03-01" });

// var localStorage = new Map();

// let megapackBucket = {
//     Bucket: 'megapack'
// };

// s3.listObjects(megapackBucket, (err, data) => {
//     data.Contents.forEach((value) => {
//         if (value.Key.includes("thumbnail.jpg")) {
//             console.log(value.Key.split("/")[0]);
//             console.log(value.Key);
//             var aircraftKey = value.Key.split("/")[0].split("_").splice(0, 2).join(" ");
//             var liveryKey = value.Key.split("/")[0];
//             var imageKey = value.Key;
//             var entry = {
//                 liveryKey: liveryKey,
//                 imageKey: imageKey
//             };
//             if (localStorage.has(aircraftKey)) {
//                 localStorage.get(aircraftKey).push(entry);
//             } else {
//                 let arr = new Array();
//                 arr.push(entry);
//                 localStorage.set(aircraftKey, arr);
//             }
//         }
//     });

//     logStorage();
// });

// const logStorage = () => {
//     localStorage.forEach((key) => {
//         key.forEach((entry) => {
//             console.log(entry.imageKey);
//         });
//     });
// }

const app = express();

app.use(express.static("public"));
app.use(express.json());

app.get("/", (_, response) => {
  response.sendFile(__dirname + "/public/index.html");
});

app.post("/download", (req, res) => {
  const bucket = "megapack";
  const region = "us-east-1";

  const filesArray = [];

  let folders = req.body.folders;

  folders.forEach((folder, i) => {
    const params = {
        Bucket: bucket,
        Prefix: folder
    };
    const files = s3.listObjects(params).createReadStream();
    const xml = new XmlStream(files);
    xml.collect("Key");
    xml.on("endElement: Key", function (item) {
      filesArray.push(folder + item["$text"].substr(folder.length));
    });

    if (i == folders.length - 1) {
      xml.on("end", function () {
        s3Zip
          .archive(
            { region: region, bucket: bucket, preserveFolderStructure: true },
            "",
            filesArray
          )
          .pipe(res);
      });
    }
  });
});

const listener = app.listen(port, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
