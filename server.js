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

var localStorage = new Map();

var params = {
  Bucket: "megapack",
};

function s3Print(keys) {
  keys.forEach((key) => {
    if (key.includes("thumbnail_small.jpg") || key.includes("thumbnail_small.JPG")) {
      var aircraftKey = key.split("/")[0].split("_").splice(0, 2).join("_");
      var liveryKey = key.split("/")[0];
      var imageKey = key;
      var entry = {
        liveryKey: liveryKey,
        imageKey: imageKey,
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
  console.log("finished local storage");
}

var allKeys = [];

listAllKeys();
function listAllKeys() {
  s3.listObjectsV2(params, function (err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
    } else {
      var contents = data.Contents;
      contents.forEach(function (content) {
        allKeys.push(content.Key);
      });

      if (data.IsTruncated) {
        params.ContinuationToken = data.NextContinuationToken;
        console.log("get further list...");
        listAllKeys();
      } else {
        console.log("done");
        s3Print(allKeys);
      }
    }
  });
}

const logStorage = () => {
  localStorage.forEach((key) => {
    key.forEach((entry) => {
      console.log(entry.imageKey);
    });
  });
};

const app = express();

app.use(express.static("public"));
app.use(express.json());

app.get("/", (_, response) => {
  response.sendFile(__dirname + "/public/index.html");
});

app.get("/list", (req, res) => {
  res.json({ localStorage: [...localStorage] });
});

app.post("/image", (req, res) => {
  getImage(req.body.imageKey)
    .then((img) => {
      res.send(img.Body);
    })
    .catch((e) => {
      res.send(e);
    });
});

async function getImage(imageKey) {
  const data = s3
    .getObject({
      Bucket: "megapack",
      Key: imageKey,
    })
    .promise();
  return data;
}

app.post("/download", (req, res) => {
  const bucket = "megapack";
  const region = "us-east-1";

  const filesArray = [];

  let folders = req.body.folders;

  folders.forEach((folder, i) => {
    const params = {
      Bucket: bucket,
      Prefix: folder,
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
