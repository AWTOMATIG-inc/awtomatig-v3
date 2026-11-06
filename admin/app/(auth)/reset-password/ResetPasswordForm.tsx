"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Field, InlineError, PasswordInput } from "@/components/ui";
import { AuthError, PASSWORD_MAX, PASSWORD_MIN, resetPassword } from "@/lib/auth/client";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
      .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`),
    confirmPassword: z.string().min(1, "Type the new password again."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two passwords do not match.",
  });

type Values = z.infer<typeof schema>;

const EMPTY: Values = { newPassword: "", confirmPassword: "" };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: "onBlur", defaultValues: EMPTY });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await resetPassword(token, values.newPassword);
      router.replace("/login?reset=1");
    } catch (error) {
      if (error instanceof AuthError && (error.code === "INVALID_TOKEN" || error.code === "EXPIRED_TOKEN")) {
        setTokenInvalid(true);
        return;
      }
      setFormError(error instanceof AuthError ? error.message : "Something went wrong. Try again in a moment.");
    }
  }

  if (tokenInvalid) {
    return (
      <div className="flex flex-col gap-20">
        <InlineError>That reset link did not work. It may have expired or already been used.</InlineError>
        <Link href="/forgot-password" className="type-body-14 text-fg-muted hover:text-fg-primary self-start">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-20">
      <Field
        id="new-password"
        label="New password"
        required
        helper={`${PASSWORD_MIN} to ${PASSWORD_MAX} characters.`}
        error={errors.newPassword?.message}
      >
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          invalid={!!errors.newPassword}
          aria-describedby={errors.newPassword ? "new-password-error" : "new-password-helper"}
          {...register("newPassword")}
        />
      </Field>

      <Field id="confirm-password" label="Confirm new password" required error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          {...register("confirmPassword")}
        />
      </Field>

      {formError && <InlineError>{formError}</InlineError>}

      <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
        {isSubmitting ? "Resetting password" : "Reset password"}
      </Button>
    </form>
  );
}
