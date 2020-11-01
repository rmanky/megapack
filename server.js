// Load dotenv
require("dotenv").config();

const express = require("express"),
  compression = require("compression"),
  archiver = require("archiver"),
  AWS = require("aws-sdk"),
  port = process.env.PORT || 3000;

AWS.config.update({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

var s3 = new AWS.S3({
  version: "2006-03-01",
});

var localStorage = new Map();
var shortHand = [];

var params = {
  Bucket: "megapack",
};

function s3Print(keys) {
  let i = 0;
  keys.forEach((key) => {
    if (
      key.includes("thumbnail_small.jpg") ||
      key.includes("thumbnail_small.JPG")
    ) {
      var aircraftKey = key.split("/")[0].split("_").splice(0, 2).join("_");
      var liveryKey = key.split("/")[0];
      var imageKey = key;
      var entry = {
        aircraftKey: aircraftKey,
        liveryKey: liveryKey,
        imageKey: imageKey,
        indexKey: i,
      };
      if (localStorage.has(aircraftKey)) {
        localStorage.get(aircraftKey).push(entry);
      } else {
        let arr = new Array();
        arr.push(entry);
        localStorage.set(aircraftKey, arr);
      }

      shortHand.push(entry.liveryKey);
      i++;
    }
  });
  console.log("finished local storage");
}

function listAllKeys(inputKeys) {
  const allKeys = inputKeys ? inputKeys : [];
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
        listAllKeys(allKeys);
      } else {
        console.log("done");
        s3Print(allKeys);
      }
    }
  });
}
listAllKeys();

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(compression());

app.get("/", (_, response) => {
  response.sendFile(__dirname + "/public/index.html");
});

app.get("/list", (_, res) => {
  res.json({
    localStorage: [...localStorage],
  });
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

app.get("/download", (req, res) => {
  let folders = req.query.folders;
  folders = JSON.parse(folders);
  let fileList = [];
  let promiseList = [];

  res.attachment("download.zip");

  folders.forEach((folder) => {
    const folderParams = {
      Bucket: "megapack",
      Prefix: shortHand[folder] + "/",
    };
    const promise = new Promise((resolve, reject) => {
      s3.listObjectsV2(folderParams, function (err, data) {
        if (err) {
          console.log(err, err.stack); // an error occurred
          reject();
        } else {
          const contents = data.Contents;
          contents.forEach((content) => {
            fileList.push(content.Key);
          });
          resolve("done");
        }
      });
    });
    promiseList.push(promise);
  });
  Promise.all(promiseList).then(() => {
    const s3DownloadStreams = fileList.map((key) => {
      return {
        stream: s3
          .getObject({ Bucket: "megapack", Key: key })
          .createReadStream(),
        filename: key,
      };
    });
    const archive = archiver("zip");
    archive.pipe(res);
    s3DownloadStreams.forEach((streamDetails) =>
      archive.append(streamDetails.stream, { name: streamDetails.filename })
    );
    archive.finalize();
  });
});

const listener = app.listen(port, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
