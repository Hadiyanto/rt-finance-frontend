"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();

    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } else {
      alert(data.message || "Login gagal");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        {/* Title */}
        <h2 className="text-center text-2xl font-semibold text-gray-900">
          Login
        </h2>
        <p className="text-center text-gray-500 text-sm mt-1">
          Masuk ke panel admin RT Finance
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full rounded-lg border border-gray-300 
                px-3 py-2 text-sm 
                text-gray-900
                placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full rounded-lg border border-gray-300 
                px-3 py-2 text-sm 
                text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500
                focus:border-blue-500 transition
              "
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="
              w-full py-2.5 text-white bg-blue-600 
              rounded-lg font-medium text-sm
              hover:bg-blue-700 active:bg-blue-800
              transition shadow-sm
            "
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
