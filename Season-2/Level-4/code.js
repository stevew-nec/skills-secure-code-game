// Welcome to Secure Code Game Season-2/Level-4!

// Follow the instructions below to get started:

// 1. test.js is passing but the code here is vulnerable
// 2. Review the code. Can you spot the bugs(s)?
// 3. Fix the code.js but ensure that test.js passes
// 4. Run hack.js and if passing then CONGRATS!
// 5. If stuck then read the hint
// 6. Compare your solution with solution.js

const express = require("express");
const bodyParser = require("body-parser");
const libxmljs = require("libxmljs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("node:child_process");
const app = express(),
  sax = require("sax");;

app.use(bodyParser.json());
app.use(bodyParser.text({ type: "application/xml" }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

// set up rate limiter: maximum of five requests per minute
var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});

// apply rate limiter to all requests
app.use(limiter);

app.post("/ufo/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  console.log("Received uploaded file:", req.file.originalname);

   // Generate a unique filename using UUID
   const uniqueFileName = `${uuidv4()}.xml`;

   // Define the path where the file will be saved
   const uploadedFilePath = path.join(UPLOAD_DIR, uniqueFileName);
 
  // uploadedFilePath = fs.realpathSync(path.resolve(ROOT, path.join(__dirname, req.file.originalname)));
  // if (!uploadedFilePath.startsWith(ROOT)) {
  //   res.statusCode = 403;
  //   res.end();
  //   return;
  // }

  fs.writeFileSync(uploadedFilePath, req.file.buffer);

  res.status(200).send("File uploaded successfully.");
});

app.post("/ufo", (req, res) => {
  const contentType = req.headers["content-type"];

  if (contentType === "application/json") {
    console.log("Received JSON data:", req.body);
    res.status(200).json({ ufo: "Received JSON data from an unknown planet." });
  } else if (contentType === "application/xml") {
    try {

      let xmlDoc = req.body,
        parser = sax.parser(true);
      parser.onopentag = handleStart;
      parser.ontext = handleText;
      parser.write(xmlDoc);

      // const xmlDoc = libxmljs.parseXml(req.body, {
      //   replaceEntities: false,
      //   recover: false,
      //   nonet: true,
      //   dtdload: false,
      // });

      
      console.log("Received XML data from XMLon:", xmlDoc.toString());

      const extractedContent = [];

      xmlDoc
        .root()
        .childNodes()
        .forEach((node) => {
          if (node.type() === "element") {
            extractedContent.push(node.text());
          }
        });

      // Secret feature to allow an "admin" to execute commands
      if (
        xmlDoc.toString().includes('SYSTEM "') &&
        xmlDoc.toString().includes(".admin")
      ) {
        extractedContent.forEach((command) => {
          exec(command, (err, output) => {
            if (err) {
              console.error("could not execute command: ", err);
              return;
            }
            console.log("Output: \n", output);
            res.status(200).set("Content-Type", "text/plain").send(output);
          });
        });
      } else {
        res
          .status(200)
          .set("Content-Type", "text/plain")
          .send(extractedContent.join(" "));
      }
    } catch (error) {
      console.error("XML parsing or validation error:", error.message);
      res.status(400).send("Invalid XML: " + error.message);
    }
  } else {
    res.status(405).send("Unsupported content type");
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = server;