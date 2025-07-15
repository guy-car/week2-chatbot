
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  url: string;
}

export const PasswordResetEmail = ({ url }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Password Reset</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={h1}>Reset your password</Text>
        <Text style={text}>
          Someone requested a password reset for your account. If this was you,
          please click the button below to reset your password.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={url}>
            Reset Password
          </Button>
        </Section>
        <Text style={text}>
          If you didn&apos;t request this, please ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "580px",
};

const h1 = {
  fontSize: "24px",
  lineHeight: "1.25",
  fontWeight: "700",
  color: "#2f3542",
};

const text = {
  fontSize: "16px",
  lineHeight: "1.5",
  color: "#2f3542",
};

const btnContainer = {
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#2f3542",
  borderRadius: "3px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 20px",
}; 