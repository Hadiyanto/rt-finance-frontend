"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/contributions/submit");
  }, [router]);

  return <p className="p-6">Redirecting...</p>;
}
