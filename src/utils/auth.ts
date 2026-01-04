export type TokenValidationResult = "valid" | "invalid" | "error";

export async function validateToken(): Promise<TokenValidationResult> {
  const token = localStorage.getItem("token");

  if (!token) {
    return "invalid";
  }

  try {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/auth/validate", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    // 401/403 = token invalid, logout immediately
    if (res.status === 401 || res.status === 403) {
      return "invalid";
    }

    // Other errors (500, etc) = server issue, retry
    if (!res.ok) {
      return "error";
    }

    const data = await res.json();
    return data.valid === true ? "valid" : "invalid";

  } catch (err) {
    // Network error = retry
    console.error("Token validation failed:", err);
    return "error";
  }
}
