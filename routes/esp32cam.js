var express = require("express");
var router = express.Router();


/* GET users listing. */
router.get("/", function (req, res, next) {
  res.render("esp32cam", { title: "Predict using ESP32-CAM Stream", esp32camip: '192.168.1.127' });
});


module.exports = router;
