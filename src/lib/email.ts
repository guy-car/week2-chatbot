
import { Resend } from "resend";
import { env } from "~/env";

if (!env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not set. Email sending will be disabled.");
}

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export const sendEmail = async ({ to, subject, react }: SendEmailOptions) => {
  if (!env.RESEND_API_KEY) {
    console.log(
      `Not sending email to ${to} with subject "${subject}" because RESEND_API_KEY is not set.`,
    );
    return;
  }

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev", // TODO: Change this to a custom domain
      to,
      subject,
      react,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    // Optionally, re-throw the error or handle it as needed
    throw new Error("Failed to send email.");
  }
}; 