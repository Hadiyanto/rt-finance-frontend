"use client";

import { useEffect } from "react";
import { validateToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const valid = await validateToken();

      router.replace("/contributions/submit");
    }

    check();
  }, [router]);

  return <p className="p-6">Checking session...</p>;
}
