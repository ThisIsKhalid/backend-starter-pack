export const otpEmail = (randomOtp: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Your One-Time Password (OTP)</h2>
        <p>Dear User,</p>
        <p>Your one-time password (OTP) is:</p>
        <h1 style="font-size: 2em; color: #000;">${randomOtp}</h1>
        <p>Please use this OTP to complete your authentication process. This OTP is valid for the next 10 minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
        <br/>
        <p>Best regards,<br/>The Team</p>
    </div>
    `;
  return html;
};
