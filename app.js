var createError = require("http-errors");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const axios = require("axios");
const axiosRetry = require("axios-retry");
// var indexRouter = require("./routes/index");
// var predictRouter = require("./routes/predict");
// var esp32camRouter = require("./routes/esp32cam");
// var mobilecameraRouter = require("./routes/mobilecamera");
// var tensorflowobjectdetectionRouter = require("./routes/tfod");
// var esp32smarthomeRouter = require("./routes/esp32smarthome");
// var usersRouter = require("./routes/users");
const sqlite3 = require("sqlite3").verbose();
var path = require("path");
const sharp = require("sharp");
const expressLayouts = require("express-ejs-layouts");

const { env } = require("process");

var app = express();
var corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));

const http = require("http").Server(app);
const io = require("socket.io")(http);
const socketio = require("./socketio"); // Import your socketio.js module
socketio(io); // Initialize your socketio module

const db = new sqlite3.Database("images.db");

// Create the images table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY,
  url TEXT,
  tag TEXT,
  processed BOOLEAN DEFAULT FALSE
)`);
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
//tfjs_model_bottles_best_model/model.json

app.use(
  "/adminlte",
  express.static(path.join(__dirname, "/node_modules/admin-lte"))
);
app.use(
  "/tfjs_model_bottles_best_model",
  express.static(path.join(__dirname, "/tfjs_model_bottles_best_model"))
);

app.get("/", (req, res) => {
  res.render("home", { title: "Home" });
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard", { title: "Dashboard", esp32: process.env.ESP32IP });
});

app.get("/smarthome", (req, res) => {
  res.render("smarthome", { title: "Smart Home" });
});

app.get("/training", (req, res) => {
  res.render("training", { title: "Train AI" });
});

app.get("/predict", (req, res) => {
  res.render("predict", { title: "IOT + AI" });
});

app.get("/esp32cam", (req, res) => {
  res.render("esp32cam", {
    title: "IOT + AI",
    esp32camip: process.env.ESP32CAMIP,
  });
});

app.get("/mobilecamera", (req, res) => {
  res.render("mobilecamera", {
    title: "Builtin Camera",
  });
});

app.get("/tfobjectdetect", (req, res) => {
  res.render("tfobjectdetect", {
    title: "Object Detection using ESP32CAM",
    esp32camip: process.env.ESP32CAMIP,
  });
});

app.get("/bottleclassification", async (req, res) => {
  res.render("bottleclassification", {
    title: "Bottle Classification",
    esp32camip: process.env.ESP32CAMIP,
  });
});

app.get("/hubotcontrol", (req, res) => {
  res.render("hubotcontrol", {
    title: "Hubot Control",
    esp32camip: process.env.ESP32CAMIP,
  });
});

app.get("/background", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/images/091507.png"));
});

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  shouldResetTimeout: true,
});

app.get("/predict-random-image", async (req, res) => {
  try {
    const animal = Math.random() < 0.5 ? "cat" : "dog";
    let url = null;
    if (animal === "cat") {
      url =
        "https://api.thecatapi.com/v1/images/search?size=tumb&mime_types=jpg";
    } else {
      url =
        "https://api.thedogapi.com/v1/images/search?size=tumb&mime_types=jpg";
    }
    const imageresponse = await axios(url);
    const data = await imageresponse.data;
    const imageUrl = data[0].url;

    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "arraybuffer",
    });

    if (response) {
      console.log("image loaded");
      const model = await tf.loadLayersModel("file://tfjs_model2/model.json");
      const imageBuffer = await sharp(response.data).resize(224).toBuffer();
      const base64 = await Buffer.from(imageBuffer).toString("base64");
      const src = `data:image/jpeg;base64,${base64}`;

      const image = tf.node.decodeImage(imageBuffer);
      const resizedImage = tf.image.resizeBilinear(image, [224, 224]);
      const normalized = resizedImage.div(255.0);
      const batched = normalized.expandDims(0);
      const prediction = model.predict(batched).arraySync();
      console.log(prediction);
      res.json({ url: src, prediction: prediction[0] });
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/predictmobilecam", async (req, res) => {
  try {
    const imageDataURL = req.body.image;
    // Extract the base64-encoded image data
    const base64Data = imageDataURL.replace(/^data:image\/\w+;base64,/, "");

    // Convert base64-encoded image data to Uint8Array
    const data = Buffer.from(base64Data, "base64");

    const model = await tf.loadLayersModel("file://tfjs_model2/model.json");
    // const imageBuffer = await sharp(req.body).resize(224).toBuffer();

    // const base64 = await Buffer.from(imageBuffer).toString("base64");
    const src = imageDataURL;

    const image = tf.node.decodeImage(data);
    const resizedImage = tf.image.resizeBilinear(image, [224, 224]);
    const normalized = resizedImage.div(255.0);
    const batched = normalized.expandDims(0);
    const prediction = model.predict(batched).arraySync();
    console.log(prediction);
    res.json({ url: src, prediction: prediction[0] });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/predict-esp32cam", async (req, res) => {
  try {
    const esp32camip = process.env.ESP32CAMIP;
    const response = await axios({
      method: "GET",
      url: `http://${esp32camip}/capture?_cb=${Date.now()}`,
      responseType: "arraybuffer",
    });
    if (response) {
      const originalimageBuffer = await sharp(response.data).toBuffer();
      const originalbase64 = await Buffer.from(originalimageBuffer).toString(
        "base64"
      );
      const src = `data:image/jpeg;base64,${originalbase64}`;

      const model = await tf.loadLayersModel("file://tfjs_model2/model.json");
      const imageBuffer = await sharp(response.data).resize(224).toBuffer();
      const base64 = await Buffer.from(imageBuffer).toString("base64");

      const image = tf.node.decodeImage(imageBuffer);
      const resizedImage = tf.image.resizeBilinear(image, [224, 224]);
      const normalized = resizedImage.div(255.0);
      const batched = normalized.expandDims(0);
      const prediction = model.predict(batched).arraySync();
      console.log(prediction);
      res.json({ url: src, prediction: prediction[0] });
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/predict-bottleclassification", async (req, res) => {
  try {
    const esp32camip = process.env.ESP32CAMIP;
    const response = await axios({
      method: "GET",
      url: `http://${esp32camip}/capture?_cb=${Date.now()}`,
      responseType: "arraybuffer",
    });
    if (response) {
      const originalimageBuffer = await sharp(response.data).toBuffer();
      const originalbase64 = await Buffer.from(originalimageBuffer).toString(
        "base64"
      );
      const src = `data:image/jpeg;base64,${originalbase64}`;

      const model = await tf.loadLayersModel(
        "file://tfjs_model_bottles_best_model/model.json"
      );
      // Resize the image to match the model's expected input shape of 220x220 pixels
      const imageBuffer = await sharp(response.data)
        .resize(220, 220)
        .toBuffer();
      const base64 = await Buffer.from(imageBuffer).toString("base64");

      // Decode and preprocess the image
      const image = tf.node.decodeImage(imageBuffer);
      const resizedImage = tf.image.resizeBilinear(image, [220, 220]); // Adjusted to 220x220
      const normalized = resizedImage.div(255.0);
      const batched = normalized.expandDims(0);

      // Make a prediction
      const prediction = model.predict(batched).arraySync();

      // Respond with the prediction and the image URL
      res.json({ url: src, prediction: prediction[0] });
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/tag", async (req, res) => {
  const { url, tag, id } = req.body;

  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
  });
  const w = await response.data.pipe(
    fs.createWriteStream(`./dataset/${tag}.${id}.jpg`)
  );
  w.on("finish", () => {
    console.log("Successfully downloaded file!");
    res.sendStatus(200);
  }).on("error", () => {
    res.sendStatus(500);
  });
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// Set the port number
const port = 3000;

// Start the server
http.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
