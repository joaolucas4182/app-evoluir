"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/supabase";
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const { error } = await auth.signIn(formData.email, formData.password);
        if (error) throw error;
        router.push("/");
      } else {
        const { error } = await auth.signUp(formData.email, formData.password, formData.name);
        if (error) throw error;
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00BFFF] to-[#0080FF] mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <span className="text-[#00BFFF]">Evoluir</span>
          </h1>
          <p className="text-gray-400">
            {isLogin ? "Bem-vindo de volta!" : "Comece sua jornada de evolução"}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-[#1A1A1A] border border-[#00BFFF]/20 rounded-3xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                isLogin
                  ? "bg-[#00BFFF] text-[#0D0D0D]"
                  : "bg-[#0D0D0D] text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                !isLogin
                  ? "bg-[#00BFFF] text-[#0D0D0D]"
                  : "bg-[#0D0D0D] text-gray-400 hover:text-white"
              }`}
            >
              Cadastro
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#0D0D0D] border border-[#00BFFF]/20 rounded-xl text-white placeholder-gray-500 focus:border-[#00BFFF] focus:outline-none transition-all"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[#0D0D0D] border border-[#00BFFF]/20 rounded-xl text-white placeholder-gray-500 focus:border-[#00BFFF] focus:outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[#0D0D0D] border border-[#00BFFF]/20 rounded-xl text-white placeholder-gray-500 focus:border-[#00BFFF] focus:outline-none transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-[#00BFFF] hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#00BFFF] text-[#0D0D0D] rounded-xl font-bold hover:bg-[#00BFFF]/90 transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-[#0D0D0D]/20 border-t-[#0D0D0D] rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Entrar" : "Criar conta"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? (
              <p>
                Não tem uma conta?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-[#00BFFF] hover:underline font-semibold"
                >
                  Cadastre-se
                </button>
              </p>
            ) : (
              <p>
                Já tem uma conta?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-[#00BFFF] hover:underline font-semibold"
                >
                  Faça login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">🎯</div>
            <p className="text-xs text-gray-400">Metas personalizadas</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs text-gray-400">Progresso em tempo real</p>
          </div>
          <div>
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-xs text-gray-400">Conquistas e badges</p>
          </div>
        </div>
      </div>
    </div>
  );
}
