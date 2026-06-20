"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.ok) {
      router.push("/admin/dashboard");
    } else {
      setError("E-mail ou senha inválidos.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1e16] flex items-center justify-center px-6">
      {/* Background grain */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-[#FAF7F2] text-4xl mb-1"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
            Mimosa Flor
          </h1>
          <p className="text-[#B8963E] text-[10px] tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-body)" }}>
            Painel Administrativo
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#1C3A2A]/50 border border-[#FAF7F2]/10 p-10">
          <h2 className="text-[#FAF7F2] text-xl mb-8"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
            Entrar no painel
          </h2>

          {error && (
            <div className="bg-[#C4623A]/20 border border-[#C4623A]/30 text-[#FAF7F2]/80 text-sm px-4 py-3 mb-6"
              style={{ fontFamily: "var(--font-body)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[#FAF7F2]/40 text-xs tracking-widest uppercase mb-2 block"
                style={{ fontFamily: "var(--font-body)" }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-b border-[#FAF7F2]/20 py-3 text-[#FAF7F2] placeholder-[#FAF7F2]/20 focus:outline-none focus:border-[#B8963E] transition-colors"
                placeholder="admin@mimosaflor.com.br"
                style={{ fontFamily: "var(--font-body)" }}
              />
            </div>

            <div>
              <label className="text-[#FAF7F2]/40 text-xs tracking-widest uppercase mb-2 block"
                style={{ fontFamily: "var(--font-body)" }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent border-b border-[#FAF7F2]/20 py-3 text-[#FAF7F2] placeholder-[#FAF7F2]/20 focus:outline-none focus:border-[#B8963E] transition-colors pr-10"
                  placeholder="••••••••"
                  style={{ fontFamily: "var(--font-body)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-0 top-3 text-[#FAF7F2]/30 hover:text-[#FAF7F2]/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C4623A] text-white py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-[#FAF7F2]/20 text-xs mt-8"
          style={{ fontFamily: "var(--font-body)" }}>
          Acesso restrito à equipe Mimosa Flor
        </p>
      </div>
    </div>
  );
}
