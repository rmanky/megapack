let folders = ["Asobo_A320_NEO_ABUSAN/", "Asobo_A320_NEO_AAL/"];

// const fileStream = streamSaver.createWriteStream("download.zip");

// fetch("/download", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({ folders: folders }),
// }).then((response) => {
//   const readableStream = response.body;

//   if (window.WritableStream && readableStream.pipeTo) {
//     return readableStream
//       .pipeTo(fileStream)
//       .then(() => console.log("done writing"));
//   }

//   window.writer = fileStream.getWriter();

//   const reader = res.body.getReader();
//   const pump = () =>
//     reader
//       .read()
//       .then((res) =>
//         res.done ? writer.close() : writer.write(res.value).then(pump)
//       );

//   pump();
// });

// // abort so it dose not look stuck
// window.onunload = () => {
//   writableStream.abort()
//   // also possible to call abort on the writer you got from `getWriter()`
//   writer.abort()
// }

// window.onbeforeunload = evt => {
//   if (!done) {
//     evt.returnValue = `Are you sure you want to leave?`;
//   }
// }
