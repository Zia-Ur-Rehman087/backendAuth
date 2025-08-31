import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendMail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://taskmanagerlink.com",
    },
  });
  const mailText = mailGenerator.generatePlaintext(options.mailgenContent);
  const mailHTML = mailGenerator.generate(options.mailgenContent);

  //   send email using node mailer

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.taskmanager@test.com",
    to: options.email,
    subject: options.subject,
    text: mailText,
    html: mailHTML,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("email serveice faild. :", error);
  }
};

const emailVerfificationContent = (username, verificationURL) => {
  return {
    body: {
      name: username,
      intro: "Welcome our app! and we are excited to have you on board.",
      action: {
        instruction: "To verify your email please click the following button.",
        button: {
          color: "#1a1a",
          text: "let's verify",
          link: verificationURL,
        },
      },
      outro:
        "need help or have question reply to this email. we are glad to help you",
    },
  };
};
const forgetPasswordEMailContent = (username, forgetPasswordURL) => {
  return {
    body: {
      name: username,
      intro: "Want to Reset the password of your account.",
      action: {
        instruction:
          "To reset your password please click the following button. or link",
        button: {
          color: "rgba(236, 240, 12, 0.67)",
          text: "reset password",
          link: forgetPasswordURL,
        },
      },
      outro:
        "need help or have question reply to this email. we are glad to help you",
    },
  };
};

export { emailVerfificationContent, forgetPasswordEMailContent, sendMail };
