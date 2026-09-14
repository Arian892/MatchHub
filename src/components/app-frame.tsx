"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, User, Users } from "lucide-react";
import { useAuth } from "./auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui";

const TABS = [
  { href: "/", label: "Players", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const onLogin = pathname === "/login";

  useEffect(() => {
    if (loading || !isSupabaseConfigured) return;
    if (!token && !onLogin) router.replace("/login");
    if (token && onLogin) router.replace("/");
  }, [token, loading, onLogin, router]);

  if (!isSupabaseConfigured) {
    return (
      <Container>
        <div className="panel mt-16 space-y-3 p-6 text-center">
          <h1 className="score-type text-3xl font-semibold leading-none">Almost there</h1>
          <p className="text-sm text-muted">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
            <code className="mx-1 rounded bg-raised px-1">.env.local</code>
            and restart the server. The README has the full setup.
          </p>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <div className="space-y-4 pt-10">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </Container>
    );
  }

  if (onLogin || !token) {
    return <Container>{children}</Container>;
  }

  return (
    <>
      <Container className="pb-28">{children}</Container>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md pb-[env(safe-area-inset-bottom)]">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-[11px] transition",
                  active ? "text-amber" : "text-muted",
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-md px-4 pb-10 pt-5", className)}>{children}</div>
  );
}

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="score-type text-3xl font-semibold leading-none">{title}</h1>
        {sub ? <p className="mt-1.5 text-sm text-muted">{sub}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function BrandMark() {
  return (
    <div className="mb-8 flex items-center justify-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-board bg-amber text-[#12142A]">
        <Trophy size={20} />
      </span>
      <span className="score-type text-3xl font-semibold leading-none">MatchHub</span>
    </div>
  );
}
