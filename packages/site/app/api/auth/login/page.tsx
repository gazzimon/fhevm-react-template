"use client";
import { useState } from "react";
import { Magic } from "magic-sdk";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!, { network: "sepolia" });
      // 1) Magic envía OTP por email y devuelve un DID token
      const didToken = await magic.auth.loginWithEmailOTP({ email });
      // 2) Creamos sesión en NextAuth con Provider "magic-otp"
      const res = await signIn("magic-otp", { didToken, redirect: false });
      if (res?.ok) window.location.href = "/links";
      else alert("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={doLogin} className="max-w-sm w-full border rounded-2xl p-5 space-y-3">
        <h1 className="text-xl font-semibold">Ingresar por Email OTP</h1>
        <input
          className="w-full border rounded p-2" type="email" required
          placeholder="tu@correo.com" value={email} onChange={(e)=>setEmail(e.target.value)}
        />
        <button disabled={loading} className="w-full border rounded-xl p-2" type="submit">
          {loading ? "Enviando..." : "Recibir código"}
        </button>
      </form>
    </main>
  );
}
