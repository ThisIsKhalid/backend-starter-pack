import sgMail from "@sendgrid/mail";
import config from "../../config";

sgMail.setApiKey(config.sendGrid.api_key as string);

const sendGridEmailSender = async (
  subject: string,
  email: string,
  html: string
) => {
  const msg = {
    to: email,
    from: config.sendGrid.email_from as string,
    subject: subject,
    html: html,
  };

  try {
    const response = await sgMail.send(msg);
    // console.log("Email sent: " + response);
  } catch (error: any) {
    console.error("Error sending email:", error?.response?.body);
  }
};

export default sendGridEmailSender;
