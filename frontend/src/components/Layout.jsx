import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/client";

function iniciais(nome) {
  return (nome || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join("");
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [temMesada, setTemMesada] = useState(false);
  const [temConsultoria, setTemConsultoria] = useState(false);

  useEffect(() => {
    if (user?.papel_sistema === "admin") return;
    // dependente = tem mesada PRÓPRIA (gestor também enxerga mesadas, mas dos dependentes do grupo)
    api.get("/mesadas/")
      .then(r => setTemMesada((r.data.results || []).some(m => m.dependente === user?.id)))
      .catch(() => {});
    api.get("/consultor/clientes/")
      .then(r => setTemConsultoria((r.data.results || r.data || []).length > 0))
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
      isActive ? "bg-white/15 text-white" : "text-indigo-100 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-y-2 py-2.5 min-h-14">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-2 font-bold text-lg mr-3 select-none">
              <span className="grid place-items-center w-8 h-8 rounded-xl bg-white/15 text-base shadow-inner">💰</span>
              NossoBolso
            </span>
            <NavLink to="/painel" end className={linkClass}>Painel</NavLink>
            {user?.papel_sistema !== "admin" && !temMesada && (
              <NavLink to="/painel/gestor" className={linkClass}>Grupos</NavLink>
            )}
            {temMesada && (
              <NavLink to="/painel/dependente" className={linkClass}>Mesada</NavLink>
            )}
            {temConsultoria && (
              <NavLink to="/painel/consultor" className={linkClass}>Consultoria</NavLink>
            )}
            {user?.papel_sistema === "admin" && (
              <NavLink to="/admin" className={linkClass}>Admin</NavLink>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-white/20 text-xs font-bold ring-2 ring-white/30">
                {iniciais(user?.nome)}
              </span>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-medium">{user?.nome}</p>
                <p className="text-[11px] text-indigo-200 capitalize">{user?.papel_sistema}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors">
              Sair
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 animate-fade-up">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-slate-400 pb-6">
        NossoBolso — finanças pessoais e compartilhadas
      </footer>
    </div>
  );
}
