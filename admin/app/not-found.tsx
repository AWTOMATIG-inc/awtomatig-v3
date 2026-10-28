import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-16 px-16 text-center">
      <h1 className="type-heading-28 text-fg-strong">Page not found</h1>
      <p className="type-body-16 text-fg-muted">The page you are looking for does not exist or has moved.</p>
      <Button href="/" variant="outline">
        Back to dashboard
      </Button>
    </main>
  );
}
