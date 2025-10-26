const express = require("express");
const router = express.Router();
const {
  sendContactUsMailController,
} = require("../controllers/contact-us-controller");

router.route("/").post(sendContactUsMailController);

module.exports = router;
