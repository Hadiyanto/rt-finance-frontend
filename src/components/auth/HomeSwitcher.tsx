"use client";

import { useEffect, useState } from "react";
import { validateToken } from "@/utils/auth";

export default function HomeSwitcher({
  GuestComponent,
  UserComponent,
}: {
  GuestComponent: React.ComponentType;
  UserComponent: React.ComponentType;
}) {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const result = await validateToken();
      setIsValid(result === "valid");
    }
    check();
  }, []);

  if (isValid === null) return null; // Loading state

  return isValid ? <UserComponent /> : <GuestComponent />;
}
