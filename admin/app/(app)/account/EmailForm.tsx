"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Field, InlineError, Input, PasswordInput } from "@/components/ui";
import { AuthError, requestEmailChange } from "@/lib/auth/client";

type Values = { newEmail: string; currentPassword: string };

const EMPTY: Values = { newEmail: "", currentPassword: "" };

/**
 * The employee's sign-in email. Nothing changes here: the form only asks the backend to start the change, which then needs an
 * approval from the current inbox and a confirmation from the new one. The backend answers the same whether or not the new
 * address already belongs to someone, so the success line never says a message was sent to it.
 */
export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The backend repeats every one of these checks; they are here so the employee sees the problem next to the field.
  const schema = z.object({
    newEmail: z
      .string()
      .trim()
      .min(1, "Enter the new email address.")
      .max(254, "That address is too long.")
      .pipe(z.email("Enter a valid email address."))
      .refine((value) => value.toLowerCase() !== currentEmail.toLowerCase(), "That is already your sign-in email."),
    currentPassword: z.string().min(1, "Enter your current password."),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: "onBlur", defaultValues: EMPTY });

  async function onSubmit(values: Values) {
    setFormError(null);
    setDone(false);
    try {
      await requestEmailChange(values.newEmail.trim(), values.currentPassword);
      reset(EMPTY);
      setDone(true);
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
      <Field
        id="new-email"
        label="New email address"
        required
        helper="You will sign in with this address once the change is finished."
        error={errors.newEmail?.message}
      >
        <Input
          id="new-email"
          type="email"
          autoComplete="off"
          invalid={!!errors.newEmail}
          aria-describedby={errors.newEmail ? "new-email-error" : "new-email-helper"}
          {...register("newEmail")}
        />
      </Field>
      <Field id="email-password" label="Current password" required error={errors.currentPassword?.message}>
        <PasswordInput
          id="email-password"
          autoComplete="current-password"
          invalid={!!errors.currentPassword}
          aria-describedby={errors.currentPassword ? "email-password-error" : undefined}
          {...register("currentPassword")}
        />
      </Field>

      {formError && <InlineError>{formError}</InlineError>}

      <div className="flex flex-col gap-12">
        <div>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Sending" : "Send approval link"}
          </Button>
        </div>
        {done && (
          <p role="status" className="type-body-14 text-fg-muted">
            If this address can be used, we sent an approval link to {currentEmail}. Open it, then check the new address for the
            second link. Your email stays the same until you have opened both.
          </p>
        )}
      </div>
    </form>
  );
}
