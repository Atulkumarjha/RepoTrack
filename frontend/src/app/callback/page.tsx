"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const username = searchParams.get("username");
    const error = searchParams.get("error");

    if (error) {
      router.push("/login");
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("username", username || "User");
      router.push("/repositories");
    } else {
      router.push("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="text-center">
        <div className="w-5 h-5 border-2 border-[#30363d] border-t-[#e6edf3] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#7d8590]">Signing you in…</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
          <div className="w-5 h-5 border-2 border-[#30363d] border-t-[#e6edf3] rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
