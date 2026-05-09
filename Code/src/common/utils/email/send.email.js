import nodemailer from "nodemailer";
import { BadRequestException } from "../response/error.response.js";
import { EMAIL_APP_PASSWORD, EMAIL_APP, APPLICATION_NAME } from "../../../../config/config.service.js";

export const sendEmail = async ({ to, cc, bcc, subject, html, attachments = [] } = {}) => {
  if (!EMAIL_APP || !EMAIL_APP_PASSWORD) {
    throw BadRequestException({
      message: "Email service not configured. Set EMAIL_APP and EMAIL_APP_PASSWORD in the environment.",
    });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_APP, pass: EMAIL_APP_PASSWORD },
  });

  try {
    const info = await transporter.sendMail({
      to, cc, bcc, subject, html, attachments,
      from: `${APPLICATION_NAME} 😉 <${EMAIL_APP}>`,
    });
    console.log("Message sent:", info.messageId);
  } catch (error) {
    const errorMessage = String(error?.message || "");
    const isAuthError =
      error?.responseCode === 535 ||
      /badcredentials|username and password not accepted|invalid login/i.test(errorMessage);

    throw BadRequestException({
      message: isAuthError
        ? "Email service authentication failed. Please configure a valid Gmail App Password."
        : "Failed to send email. Please try again later.",
      extra: { originalError: errorMessage },
    });
  }
};
