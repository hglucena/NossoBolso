import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function CadastroPage() {
  const { cadastro } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await cadastro(email, nome, senha);
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      setError(data?.email?.[0] || data?.detail || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 px-4">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-400/30 blur-3xl" />
      <div className="absolute -bottom-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-indigo-300/25 blur-3xl" />

      <div className="relative bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-modal-pop">
        <div className="flex flex-col items-center mb-6">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl shadow-lg shadow-indigo-600/30 mb-3">
            💰
          </span>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">
            Criar Conta
          </h1>
          <p className="text-xs text-slate-400 mt-1">Leva menos de um minuto</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nome</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
              className="input" required placeholder="Seu nome" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="input" required placeholder="seu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
              className="input" required placeholder="Mínimo 6 caracteres" />
          </div>
          {error && <p className="text-red-500 text-sm animate-slide-down">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-5">
          Já tem conta? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
