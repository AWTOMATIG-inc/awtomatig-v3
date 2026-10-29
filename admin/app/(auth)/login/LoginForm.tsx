"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Field, Input, PasswordInput } from "@/components/ui";
import { AuthError, signIn } from "@/lib/auth/client";

const schema = z.object({
  email: z.email("Enter your work email address."),
  password: z.string().min(1, "Enter your password."),
});

type Values = z.infer<typeof schema>;

/**
 * The sign-in form: validated on blur and on submit, input kept on error (DESIGN.md section 7.2). `next` is already checked to
 * be a local path.
 */
export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: "onBlur" });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      router.replace(next);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : "Something went wrong. Try again in a moment.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-20">
      <Field id="email" label="Work email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </Field>
      <Field id="password" label="Password" required error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
      </Field>
      {formError && (
        <p role="alert" className="type-body-14 text-fg-primary flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
          {formError}
        </p>
      )}
      <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
        {isSubmitting ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
