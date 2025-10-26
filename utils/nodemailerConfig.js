require("dotenv").config();
const nodemailerConfig = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

module.exports = nodemailerConfig;
