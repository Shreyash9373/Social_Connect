"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    if (!token) {
      setStatus("Invalid verification link");
      return;
    }

    async function verify() {
      try {
        await api.get(`/api/auth/verify-email?token=${token}`);
        setStatus(" Email verified successfully! You can now log in.");
      } catch {
        setStatus(" Verification failed. Link may have expired.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">{status}</p>
    </div>
  );
}
