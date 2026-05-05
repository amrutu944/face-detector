const nodemailer = require("nodemailer");
const path = require("path");


console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (email, images) => {
  try {
    const attachments = images.map((imgUrl) => {
      const filename = imgUrl.split("/").pop();

      return {
        filename: filename,
        path: path.resolve(__dirname, "../uploads", filename), // ✅ FIXED
      };
    });

    console.log("📎 Attachments:", attachments); // 👈 DEBUG

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "📸 Your Event Photos",
      text: "Here are your photos!",
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);

    console.log("📧 Email sent with images!");
  } catch (err) {
    console.error("❌ Email error:", err);
    throw err;
  }
};

module.exports = sendEmail;