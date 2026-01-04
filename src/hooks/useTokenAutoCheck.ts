import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { validateToken } from "@/utils/auth";

const MAX_RETRIES = 5;
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

export function useTokenAutoCheck() {
  const router = useRouter();
  const failCountRef = useRef(0);

  useEffect(() => {
    async function validate() {
      // Jika tidak ada token, langsung redirect tanpa retry
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/contributions/submit");
        return;
      }

      const isValid = await validateToken();

      if (!isValid) {
        failCountRef.current += 1;
        console.warn(`Token validation failed (${failCountRef.current}/${MAX_RETRIES})`);

        if (failCountRef.current >= MAX_RETRIES) {
          console.error("Max retries reached, logging out...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/contributions/submit");
        }
      } else {
        // Reset fail count if validation succeeds
        failCountRef.current = 0;
      }
    }

    // Jalankan pertama kali
    validate();

    // Jalankan tiap 1 jam
    const interval = setInterval(validate, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [router]);
}
