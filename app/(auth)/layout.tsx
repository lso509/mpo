export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="layout-bg flex min-h-screen items-center justify-center p-4 dark:bg-zinc-950">
      {children}
    </div>
  );
}
