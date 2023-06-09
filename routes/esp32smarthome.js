var express = require("express");
var router = express.Router();


/* GET users listing. */
router.get("/", function (req, res, next) {
  res.render("esp32smarthome", { title: "ESP32 Smart Home Demo", esp32ip: '192.168.1.130' });
});


module.exports = router;
