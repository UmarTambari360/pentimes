import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a new Pen Times account",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-headline-xl font-bold mb-1">
          Join Pen Times
        </h1>
        <p className="text-body-sm text-muted-foreground">
          Create your free account
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
