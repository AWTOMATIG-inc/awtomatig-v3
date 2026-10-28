"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Field, Input } from "@/components/ui";

const schema = z.object({
  email: z.email("Enter your work email address."),
  password: z.string().min(1, "Enter your password."),
});

type Values = z.infer<typeof schema>;

/**
 * The sign-in form: validated on blur and on submit, input kept on error (DESIGN.md section 7.2). It is not wired to the
 * backend yet, because the backend has no authentication module. While `enabled` is false the button is disabled and says why.
 */
export function LoginForm({ enabled }: { enabled: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: "onBlur" });

  // Replace with a call to the backend's sign-in endpoint (through the typed `api` client) when it exists.
  async function onSubmit() {
    if (!enabled) return;
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
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
      </Field>
      <Button type="submit" variant="primary" fullWidth disabled={!enabled || isSubmitting}>
        Sign in
      </Button>
      {!enabled && (
        <p className="type-body-14 text-fg-muted" role="status">
          Sign-in is not available yet. It is turned on when the backend authentication module is released.
        </p>
      )}
    </form>
  );
}
