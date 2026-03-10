"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="w-5 h-5 border-2 border-[#30363d] border-t-[#e6edf3] rounded-full animate-spin" />
    </div>
  );
}
