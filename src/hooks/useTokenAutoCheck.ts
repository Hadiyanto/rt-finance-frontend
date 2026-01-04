import { useEffect, useRef } from "react";
import { validateToken } from "@/utils/auth";

const MAX_RETRIES = 5;
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const REDIRECT_URL = "/contributions/submit";

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = REDIRECT_URL;
}

export function useTokenAutoCheck() {
  const failCountRef = useRef(0);

  useEffect(() => {
    async function validate() {
      // Jika tidak ada token, langsung redirect tanpa retry
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = REDIRECT_URL;
        return;
      }

      const result = await validateToken();

      if (result === "valid") {
        // Reset fail count jika berhasil
        failCountRef.current = 0;
      } else if (result === "invalid") {
        // Token invalid (401/403) = langsung logout
        console.error("Token invalid, logging out...");
        logout();
      } else if (result === "error") {
        // Network/server error = retry sampai MAX_RETRIES
        failCountRef.current += 1;
        console.warn(`Token validation error (${failCountRef.current}/${MAX_RETRIES})`);

        if (failCountRef.current >= MAX_RETRIES) {
          console.error("Max retries reached, logging out...");
          logout();
        }
      }
    }

    // Jalankan pertama kali
    validate();

    // Jalankan tiap 1 jam
    const interval = setInterval(validate, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
