/** Sign-in screens: a single centered card on the app background. No sidebar, no marketing. */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-16 py-40">
      <div className="w-full max-w-400">{children}</div>
    </main>
  );
}
