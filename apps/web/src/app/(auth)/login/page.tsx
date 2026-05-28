import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Pen Times account",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-headline-xl font-bold mb-1">
          Welcome back
        </h1>
        <p className="text-body-sm text-muted-foreground">
          Sign in to your account
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
