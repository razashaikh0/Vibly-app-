import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";

export function PageShell({
  children,
  className = "",
  withBottomNav = true,
}: {
  children: ReactNode;
  className?: string;
  withBottomNav?: boolean;
}) {
  return (
    <div
      className={`app-shell min-h-screen ${withBottomNav ? "pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)]" : ""} ${className}`}
    >
      {children}
      {withBottomNav ? <BottomNav /> : null}
    </div>
  );
}

export function PageHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <header className={`app-page-header ${className}`}>{children}</header>;
}
