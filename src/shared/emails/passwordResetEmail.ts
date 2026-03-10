export const passwordResetEmail = (otp: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #e74c3c;">Password Reset Request</h2>
        <p>Dear User,</p>
        <p>We received a request to reset your password. Use the OTP below:</p>
        <h1 style="font-size: 2em; color: #000; letter-spacing: 4px;">${otp}</h1>
        <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <br/>
        <p>Best regards,<br/>The Team</p>
    </div>
    `;
  return html;
};
