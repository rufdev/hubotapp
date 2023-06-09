var express = require("express");
var router = express.Router();


/* GET users listing. */
router.get("/", function (req, res, next) {
  res.render("predict", { title: "HOBOT (HOBBY ROBOT)" });
});


module.exports = router;
