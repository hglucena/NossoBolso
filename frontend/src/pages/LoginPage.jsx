import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const usuario = await login(email, password);
      navigate(usuario.papel_sistema === "admin" ? "/admin" : "/painel");
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || "Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 px-4">
      {/* blobs decorativos */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-400/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-fuchsia-400/20 blur-2xl" />

      <div className="relative bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-modal-pop">
        <div className="flex flex-col items-center mb-6">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl shadow-lg shadow-indigo-600/30 mb-3">
            💰
          </span>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">
            NossoBolso
          </h1>
          <p className="text-xs text-slate-400 mt-1">Suas finanças, pessoais e compartilhadas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="input" required placeholder="seu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="input" required placeholder="Sua senha" />
          </div>
          {error && <p className="text-red-500 text-sm animate-slide-down">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-5">
          Não tem conta? <Link to="/cadastro" className="text-indigo-600 font-medium hover:underline">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
