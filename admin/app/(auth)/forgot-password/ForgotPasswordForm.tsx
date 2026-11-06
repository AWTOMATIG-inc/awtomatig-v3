"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Field, InlineError, Input } from "@/components/ui";
import { AuthError, requestPasswordReset } from "@/lib/auth/client";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your work email address.").pipe(z.email("Enter a valid email address.")),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: "onBlur" });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await requestPasswordReset(values.email);
      setSubmitted(true);
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : "Something went wrong. Try again in a moment.");
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-20">
        <p role="status" className="type-body-14 text-fg-primary border-border rounded-8 border p-12">
          If that address belongs to an employee, we sent a reset link. It works for 1 hour. Check your inbox and spam folder.
        </p>
        <Link href="/login" className="type-body-14 text-fg-muted hover:text-fg-primary self-start">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-20">
      <Field id="email" label="Work email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </Field>

      {formError && <InlineError>{formError}</InlineError>}

      <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
        {isSubmitting ? "Sending link" : "Send reset link"}
      </Button>

      <Link href="/login" className="type-body-14 text-fg-muted hover:text-fg-primary self-start">
        ← Back to sign in
      </Link>
    </form>
  );
}
