"use client";

import { AuthProvider } from "@/components/auth-provider";
import { DataProvider } from "@/components/data-provider";
import { AppFrame } from "@/components/app-frame";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <AppFrame>{children}</AppFrame>
      </DataProvider>
    </AuthProvider>
  );
}
