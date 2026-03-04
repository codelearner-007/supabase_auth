import PasswordResetConfirmationEmail from "@/lib/email/password-reset-confirmation-email";
import VerificationEmail from "@/lib/email/verification-email";
import WelcomeEmail from "@/lib/email/welcome-email";
import { createAdminClient } from "@/utlis/supabase/client";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { type, email, password, isPasswordReset, origin } =
      await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let data;

    switch (type) {
      // 1: Verifcation Case
      case "verification":
        const supabase = createAdminClient();

        const res = await supabase.auth.admin.generateLink({
          email,
          password: isPasswordReset ? undefined : password,
          type: isPasswordReset ? "recovery" : "signup",
        });

        if (res.data.properties?.email_otp) {
          data = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: isPasswordReset
              ? "Reset Your Password"
              : "Verify your email",
            react: VerificationEmail({
              otp: res.data.properties?.email_otp,
              isPasswordReset: !!isPasswordReset,
            }),
          });
        } else {
          return NextResponse.json({ data: null, error: res.error });
        }
        break;

      // 2: Welcome Case
      case "welcome":
        const dashboardUrl = origin
          ? `${origin}/dashboard`
          : `${new URL(request.url).origin}/dashboard`;

        data = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: email,
          subject: "Welcome to out platform",
          react: WelcomeEmail({ userEmail: email, dashboardUrl }),
        });
        break;

      // 3: Password Reset Confirmation Case
      case "password-reset-confirmation":
        const loginUrl = origin
          ? `${origin}/auth/login`
          : `${new URL(request.url).origin}/auth/login`;

        data = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: email,
          subject: "Your Password has been reset",
          react: PasswordResetConfirmationEmail({ userEmail: email, loginUrl }),
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 },
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
