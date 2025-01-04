import sgMail from "@sendgrid/mail";
import config from "../../config";

sgMail.setApiKey(config.sendGrid.api_key as string);

const sendGridBulkEmailSender = async (
  emails: { subject: string; email: string; html: string }[]
) => {
  const messages = emails.map(({ subject, email, html }) => ({
    to: email,
    from: config.sendGrid.email_from as string,
    subject: subject,
    html: html,
  }));

  try {
    // Send all emails using an array of messages
    const response = await sgMail.send(messages);
    // console.log("Bulk emails sent successfully.");
    return response;
  } catch (error: any) {
    console.error("Error sending bulk emails:", error?.response?.body || error);
    throw error;
  }
};

export default sendGridBulkEmailSender;
