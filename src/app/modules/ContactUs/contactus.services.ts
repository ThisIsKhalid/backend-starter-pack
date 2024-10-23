import nodemailer from "nodemailer";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { ContactUs } from "./contactus.interface";

const sendEmailFromContactUs = async (data: ContactUs) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // You can change this to your preferred email service provider
    auth: {
      user: config.emailSender.email, // Your email
      pass: config.emailSender.app_pass, // Your email password or app password
    },
  });

  const mailOptions = {
    from: `"${data.name}" <${data.email}>`, // sender address
    to: config.emailSender.email, // your email address to receive the contact data
    subject: data.subject, // Subject line
    html: `
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Us Inquiry</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; font-size: 16px; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        <div style="background-color: #FF7600; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; font-size: 24px; margin: 0;">New Contact Us Inquiry</h2>
        </div>
        
        <div style="padding: 30px;">
            <p style="margin-bottom: 15px;">Dear Support Team,</p>
            
            <p style="margin-bottom: 15px;">
                My name is <strong style="color: #FF7600; font-size: 18px;">${data.name}</strong>, and I am reaching out to you regarding the following matter:
            </p>

            <blockquote style="font-style: italic; background-color: #f9f9f9; padding: 15px; border-left: 5px solid #FF7600; margin: 0 0 20px 0; border-radius: 5px;">
                ${data.message}
            </blockquote>

            <p style="margin-bottom: 15px;">Here are my contact details for your reference:</p>
            <table style="width: 100%; border-collapse: separate; border-spacing: 0; background-color: #f9f9f9; border-radius: 5px; overflow: hidden;">
                <tr>
                    <td style="padding: 10px 15px; border-bottom: 1px solid #eeeeee;">
                        <strong style="color: #FF7600;">Email:</strong> 
                        <a href="mailto:${data.email}" style="color: #333; text-decoration: underline; transition: color 0.3s ease;">${data.email}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px;">
                        <strong style="color: #FF7600;">Phone Number:</strong> ${data.phoneNumber}
                    </td>
                </tr>
            </table>

            <p style="margin-top: 20px;">I appreciate your time and hope to receive a response soon.</p>
            
            <p style="margin-bottom: 5px;">Best regards,</p>
            <p style="font-weight: bold; color: #FF7600; font-size: 18px; margin-top: 0;">${data.name}</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 14px; color: #888;">
            <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `,
  };

  // Send the email
  await transporter.sendMail(mailOptions);

  const saveData = await prisma.contactUs.create({
    data: {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      subject: data.subject,
      message: data.message,
    },
  });

  return saveData;
};

export const contactUsServices = {
  sendEmailFromContactUs,
};
