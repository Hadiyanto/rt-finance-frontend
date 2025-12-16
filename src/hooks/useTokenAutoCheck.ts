import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { validateToken } from "@/utils/auth";

export function useTokenAutoCheck() {
  const router = useRouter();

  useEffect(() => {
    async function validate() {
      const isValid = await validateToken();

      if (!isValid) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/signin");
      }
    }

    // Jalankan pertama kali
    validate();

    // Jalankan tiap 30 detik
    const interval = setInterval(validate, 10000);

    return () => clearInterval(interval);
  }, [router]);
}
