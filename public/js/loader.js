const accordion = document.getElementById("accordionExample");
var downloadList = [];
var selectedButtons = [];

let actionButton = document.createElement("div");
actionButton.classList.add(
  "btn",
  "btn-primary",
  "fixed-bottom-right",
  "m-4",
  "invisible"
);
actionButton.textContent = "Download Selected";
actionButton.addEventListener("click", () => {
  requestDownload(downloadList);
  selectedButtons.forEach((button) => {
    button.classList.remove("btn-danger");
    button.classList.add("btn-success");
    button.textContent = "Add";
  });
  actionButton.classList.add("invisible");
  selectedButtons = [];
  downloadList = [];
});

document.body.appendChild(actionButton);

function requestDownload(folderList) {
  window.open('/download?folders=' + JSON.stringify(folderList));

//   fetch("/download", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ folders: folders }),
//   })
//     .then((res) => res.blob())
//     .then((blob) => {
//       const dest = fs.createWriteStream("./octocat.png");
//       res.body.pipe(dest);
//     });
  //   }).then((response) => {
  //     const readableStream = response.body;

  //     if (window.WritableStream && readableStream.pipeTo) {
  //       return readableStream
  //         .pipeTo(fileStream)
  //         .then(() => console.log("done writing"));
  //     }

  //     window.writer = fileStream.getWriter();

  //     const reader = res.body.getReader();
  //     const pump = () =>
  //       reader
  //         .read()
  //         .then((res) =>
  //           res.done ? writer.close() : writer.write(res.value).then(pump)
  //         );

  //     pump();
  //   });
}

fetch("/list", {
  method: "GET",
})
  .then((response) => response.json())
  .then((body) => {
    console.log(body.localStorage);

    body.localStorage.forEach((folder) =>
      createAccordion(folder[0], folder[1])
    );
  });

function createAccordion(folder, contents) {
  var cardDiv = document.createElement("div");
  cardDiv.classList.add("card");
  var cardHeaderDiv = document.createElement("div");
  cardHeaderDiv.classList.add("card-header");

  var h2 = document.createElement("h2");
  h2.classList.add("mb-0");
  h2.id = "header_" + folder;

  var button = document.createElement("button");
  button.classList.add("btn", "btn-link", "collapsed");
  button.type = "button";
  button.setAttribute("data-toggle", "collapse");
  button.setAttribute("data-target", "#collapse_" + folder);
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "collapse_" + folder);
  button.textContent = folder.replace("_", " ");

  var bodyDiv = document.createElement("div");
  bodyDiv.classList.add("collapse");
  bodyDiv.id = "collapse_" + folder;
  bodyDiv.setAttribute("aria-labelledby", "header_" + folder);

  var cardInnerBody = document.createElement("div");
  cardInnerBody.classList.add(
    "card-body",
    "d-inline-flex",
    "justify-content-center",
    "flex-wrap"
  );

  button.addEventListener("click", () => {
    if (cardInnerBody.childElementCount == 0) {
      contents.forEach((content) => {
        cardInnerBody.appendChild(generateContentCard(content));
      });
    }
  });

  cardDiv.appendChild(cardHeaderDiv);
  cardDiv.appendChild(bodyDiv);
  cardHeaderDiv.appendChild(h2);
  h2.appendChild(button);
  bodyDiv.appendChild(cardInnerBody);

  accordion.appendChild(cardDiv);
}

function generateContentCard(content) {
  var contentCard = document.createElement("div");
  contentCard.classList.add("card", "m-2");
  contentCard.style.setProperty("width", "18rem");

  var contentImage = document.createElement("img");
  contentImage.classList.add("card-img-top");
  loadImage(contentImage, content.imageKey);

  var contentCardBody = document.createElement("div");
  contentCardBody.classList.add("card-body");

  var contentH5 = document.createElement("h5");
  contentH5.classList.add("card-title");
  contentH5.textContent = content.liveryKey.replaceAll("_", " ");

  var contentButton = document.createElement("a");
  contentButton.classList.add("btn", "btn-success");
  contentButton.textContent = "Add";

  contentButton.addEventListener("click", () => {
    if (downloadList.includes(content.liveryKey)) {
      contentButton.classList.remove("btn-danger");
      contentButton.classList.add("btn-success");
      contentButton.textContent = "Add";
      downloadList = downloadList.filter((e) => e !== content.liveryKey);
      selectedButtons = selectedButtons.filter((e) => e !== contentButton);
    } else {
      contentButton.classList.remove("btn-success");
      contentButton.classList.add("btn-danger");
      contentButton.textContent = "Remove";
      downloadList.push(content.liveryKey);
      selectedButtons.push(contentButton);
    }
    if (downloadList.length > 0) {
      actionButton.classList.remove("invisible");
      actionButton.textContent = "Download " + downloadList.length;
    } else {
      actionButton.classList.add("invisible");
    }
  });

  contentCard.appendChild(contentImage);
  contentCard.appendChild(contentCardBody);
  contentCardBody.appendChild(contentH5);
  contentCardBody.appendChild(contentButton);

  return contentCard;
}

function loadImage(contentImage, imageKey) {
  fetch("/image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageKey: imageKey }),
  })
    .then((response) => response.blob())
    .then((body) => {
      const outside = URL.createObjectURL(body);
      console.log(outside);
      contentImage.src = outside;
    });
}
