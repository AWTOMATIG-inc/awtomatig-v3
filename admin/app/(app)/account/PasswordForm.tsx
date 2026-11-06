"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Checkbox, Field, InlineError, PasswordInput } from "@/components/ui";
import { AuthError, changePassword, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth/client";

// The backend repeats every one of these checks; they are here so the employee sees the problem next to the field.
const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
      .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`),
    confirmPassword: z.string().min(1, "Type the new password again."),
    signOutOtherDevices: z.boolean(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two passwords do not match.",
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "The new password must be different from the current one.",
  });

type Values = z.infer<typeof schema>;

const EMPTY: Values = { currentPassword: "", newPassword: "", confirmPassword: "", signOutOtherDevices: true };

/**
 * The employee's own password. Nothing is saved until the current password is proven; on success the fields are cleared, and
 * (when ticked) every other device is signed out while this one stays signed in.
 */
export function PasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: "onBlur", defaultValues: EMPTY });

  async function onSubmit(values: Values) {
    setFormError(null);
    setDone(null);
    try {
      await changePassword(values.currentPassword, values.newPassword, values.signOutOtherDevices);
      reset(EMPTY);
      setDone(
        values.signOutOtherDevices
          ? "Password changed. Your other devices have been signed out."
          : "Password changed. Your other devices are still signed in.",
      );
    } catch (error) {
      if (error instanceof AuthError && error.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(error instanceof AuthError ? error.message : "Something went wrong. Try again in a moment.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-400 flex-col gap-20">
      {/* Lets a password manager file the new password under the right account. Not for people. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      <Field id="current-password" label="Current password" required error={errors.currentPassword?.message}>
        <PasswordInput
          id="current-password"
          autoComplete="current-password"
          invalid={!!errors.currentPassword}
          aria-describedby={errors.currentPassword ? "current-password-error" : undefined}
          {...register("currentPassword")}
        />
      </Field>
      <Field
        id="new-password"
        label="New password"
        required
        helper={`${PASSWORD_MIN} to ${PASSWORD_MAX} characters. A few random words make a strong one.`}
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
      <Checkbox label="Sign me out of all my other devices" {...register("signOutOtherDevices")} />

      {formError && <InlineError>{formError}</InlineError>}

      <div className="flex flex-wrap items-center gap-12">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Changing" : "Change password"}
        </Button>
        <p role="status" className="type-body-14 text-fg-muted">
          {done}
        </p>
      </div>
    </form>
  );
}
