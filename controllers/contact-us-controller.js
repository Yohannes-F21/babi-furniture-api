const sendContactUsMail = require("../utils/sendContactUsEmail");
const sendContactUsMailController = async (req, res) => {
  const { name, email, message, subject } = req.body;
  console.log(name, email, message);

  try {
    if (!name || !email || !message || !subject) {
      return res.status(400).json({ message: "Please provide valid details" });
    }
    await sendContactUsMail({ name, email, message, subject });
  } catch (error) {
    return res.status(500).json({ message: "Error sending mail", error });
  }

  res.status(200).json({ message: "Contact us mail sent successfully" });
};

module.exports = { sendContactUsMailController };
