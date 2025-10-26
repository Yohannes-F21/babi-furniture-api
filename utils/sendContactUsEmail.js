const nodemailer = require("nodemailer");
const nodemailerConfig = require("./nodemailerConfig");
const smtpTransport = require("nodemailer-smtp-transport");

const sendContactUsMail = async ({ name, email, message, subject }) => {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport(
    smtpTransport(nodemailerConfig)
  );

  const mailOptions = {
    from: `${name} <${email}>`,
    to: "yohannesfantahun88@gmail.com",
    subject,
    text: `You received a new message from ${name} (${email}):\n\n${message}`,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendContactUsMail;
