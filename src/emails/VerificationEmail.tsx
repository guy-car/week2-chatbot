
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

interface VerificationEmailProps {
  url: string;
}

export const VerificationEmail = ({ url }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Email Verification</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={h1}>Verify your email address</Text>
        <Text style={text}>
          Thanks for signing up! Please click the button below to verify your
          email address.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={url}>
            Verify Email
          </Button>
        </Section>
        <Text style={text}>
          If you didn&apos;t request this, please ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

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