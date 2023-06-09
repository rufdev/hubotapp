var express = require("express");
var router = express.Router();


/* GET users listing. */
router.get("/", function (req, res, next) {
  res.render("tfod", { title: "Object Detection ESP32-CAM Stream", esp32camip: '172.10.61.195' });
});


module.exports = router;
