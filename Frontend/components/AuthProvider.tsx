"use client";

import { useEffect } from "react";
import { initBackendAuth } from "@/lib/api/initAuth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initBackendAuth();
  }, []);
  return <>{children}</>;
}
