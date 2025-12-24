"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res && !res.error) {
      router.push("/dashboard");
    } else {
      alert(res?.error || "Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl mb-4">Login</h1>
      <input
        type="email"
        placeholder="Email"
        className="border p-2 w-full mb-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 w-full mb-3"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="bg-black text-white px-4 py-2 w-full">Login</button>
    </form>
  );
}
