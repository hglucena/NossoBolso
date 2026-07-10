import { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";

export default function PainelAdmin() {
  const { user } = useAuth();
  const [aba, setAba] = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState("");
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");

  const loadUsuarios = useCallback(async () => {
    try { const r = await api.get("/usuarios/"); setUsuarios(r.data.results || []); } catch { }
  }, []);
  const loadCategorias = useCallback(async () => {
    try { const r = await api.get("/categorias/"); setCategorias(r.data.results || []); } catch { }
  }, []);

  useEffect(() => { loadUsuarios(); loadCategorias(); }, [loadUsuarios, loadCategorias]);

  const salvarUsuario = async () => {
    try {
      if (editando) {
        await api.patch(`/usuarios/${editando.id}/`, form);
      } else {
        await api.post("/usuarios/", form);
      }
      setModalOpen(false); setEditando(null); loadUsuarios();
      setMsg("Usuário salvo.");
    } catch (e) { setMsg("Erro."); }
  };

  const salvarCategoria = async () => {
    try {
      if (editando) {
        await api.patch(`/categorias/${editando.id}/`, form);
      } else {
        await api.post("/categorias/", form);
      }
      setModalOpen(false); setEditando(null); loadCategorias();
      setMsg("Categoria salva.");
    } catch (e) { setMsg("Erro."); }
  };

  const deletarCategoria = async (id) => {
    if (!confirm("Excluir?")) return;
    await api.delete(`/categorias/${id}/`);
    loadCategorias();
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-800">Administração 🛠️</h2>
        <p className="text-sm text-slate-400">Usuários e categorias padrão da plataforma — sem acesso a finanças de ninguém.</p>
      </div>
      {msg && (
        <div className={msg.includes("Erro") ? "banner-erro" : "banner-ok"}>
          <span className="flex-1">{msg}</span>
          <button onClick={() => setMsg("")} className="font-bold px-1 opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      <div className="tabs">
        {["usuarios", "categorias"].map(k => (
          <button key={k} onClick={() => setAba(k)} className={aba === k ? "tab-active" : "tab"}>
            {k === "usuarios" ? "Usuários" : "Categorias Padrão"}
          </button>
        ))}
      </div>

      {aba === "usuarios" && (
        <div>
          <button onClick={() => { setEditando(null); setForm({ email: "", nome: "", papel_sistema: "comum", is_active: true }); setModalTipo("usuario"); setModalOpen(true); }}
            className="btn-primary mb-3">+ Novo Usuário</button>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="p-3">Nome</th><th className="p-3">Email</th><th className="p-3">Papel</th><th className="p-3">Ativo</th><th className="p-3"></th></tr></thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td className="p-3 font-medium">{u.nome}</td><td className="p-3">{u.email}</td>
                    <td className="p-3">{u.papel_sistema === "admin" ? <span className="badge-indigo">Admin</span> : <span className="badge-gray">Comum</span>}</td>
                    <td className="p-3">{u.is_active ? <span className="badge-green">● Ativo</span> : <span className="badge-red">Inativo</span>}</td>
                    <td className="p-3">
                      <button onClick={() => { setEditando(u); setForm({ email: u.email, nome: u.nome, papel_sistema: u.papel_sistema, is_active: u.is_active }); setModalTipo("usuario"); setModalOpen(true); }}
                        className="btn-mini-indigo">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aba === "categorias" && (
        <div>
          <button onClick={() => { setEditando(null); setForm({ nome: "", tipo: "despesa" }); setModalTipo("categoria"); setModalOpen(true); }}
            className="btn-primary mb-3">+ Nova Categoria Padrão</button>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="p-3">Nome</th><th className="p-3">Tipo</th><th className="p-3"></th></tr></thead>
              <tbody>
                {categorias.map(c => (
                  <tr key={c.id}>
                    <td className="p-3 font-medium">{c.nome}</td>
                    <td className="p-3">{c.tipo === "despesa" ? <span className="badge-red">Despesa</span> : <span className="badge-green">Receita</span>}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setEditando(c); setForm({ nome: c.nome, tipo: c.tipo }); setModalTipo("categoria"); setModalOpen(true); }}
                        className="btn-mini-indigo">Editar</button>
                      <button onClick={() => deletarCategoria(c.id)} className="btn-mini-red">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? "Editar" : "Novo"}>
        {modalTipo === "usuario" && (
          <div className="space-y-3">
            <input className="input" placeholder="Nome" value={form.nome || ""} onChange={e => setForm({ ...form, nome: e.target.value })} />
            <input className="input" placeholder="Email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
            <select className="input" value={form.papel_sistema || "comum"} onChange={e => setForm({ ...form, papel_sistema: e.target.value })}>
              <option value="comum">Comum</option>
              <option value="admin">Administrador</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Ativo
            </label>
            <button onClick={salvarUsuario} className="btn-primary w-full">Salvar</button>
          </div>
        )}
        {modalTipo === "categoria" && (
          <div className="space-y-3">
            <input className="input" placeholder="Nome" value={form.nome || ""} onChange={e => setForm({ ...form, nome: e.target.value })} />
            <select className="input" value={form.tipo || "despesa"} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            <button onClick={salvarCategoria} className="btn-primary w-full">Salvar</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
