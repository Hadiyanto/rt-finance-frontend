"use client";

import { useEffect, useState } from "react";
import { validateToken } from "@/utils/auth";
import ResidentsPage from "@/app/(admin)/(others-pages)/(tables)/residents/page";
import FormElements from "@/app/(admin)/(others-pages)/(forms)/contributions/submit/page";

export default function HomePage() {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const valid = await validateToken();
      console.log(valid);
      setIsValid(valid);
    }

    check();
  }, []);

  // masih loading validasi token
  if (isValid === null) {
    return <p className="p-6">Checking session...</p>;
  }

  // jika token valid → tampilkan halaman login user
  if (isValid) {
    return <ResidentsPage />;
  }

  // jika token tidak valid → tampilkan halaman guest
  return <FormElements />;
}
