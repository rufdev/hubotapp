var express = require("express");
var router = express.Router();



router.get("/", function (req, res, next) {
  res.render("mobilecamera", { title: "Predict using Builtin Camera"});
});


module.exports = router;
