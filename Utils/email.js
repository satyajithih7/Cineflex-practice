const nodemailer = require("nodemailer");
const sendgridTransporter = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  sendgridTransporter({
    auth: {
      api_key: process.env.EMAIL_API_KEY,
    },
  })
);

const sendEmail = async (data) => {
  await transporter.sendMail({
    to: data.to,
      from: process.env.MAIL_ID,
      subject: data.subject,
      text: data.text,
    html:data.html
  });
};

module.exports = sendEmail;
