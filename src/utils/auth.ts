export async function validateToken() {
  const token = localStorage.getItem("token");

  if (!token) {
    return false;
  }

  try {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/auth/validate", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (!res.ok) return false;

    const data = await res.json();
    return data.valid === true;

  } catch (err) {
    console.error("Token validation failed:", err);
    return false;
  }
}
