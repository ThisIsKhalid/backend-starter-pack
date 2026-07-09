import prisma from "../../lib/prisma";

/**
 * Enqueue an email for asynchronous delivery.
 *
 * Writes an EmailJob row to the database — the email worker picks it up
 * and delivers it with automatic retries.  This call is fast and never
 * throws on transport failures, so callers (registration, OTP flows)
 * are never coupled to the email provider's availability.
 */
const emailSender = async (subject: string, email: string, html: string): Promise<void> => {
  await prisma.emailJob.create({
    data: { to: email, subject, html },
  });
};

export default emailSender;
