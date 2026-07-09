import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

function formatMoney(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PainelMembro() {
  const { user } = useAuth();
  const [aba, setAba] = useState("contas");
  const [contas, setContas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async (url, setter) => {
    try {
      const res = await api.get(url);
      setter(res.data.results || [res.data]);
    } catch { }
  }, []);

  useEffect(() => { load("/contas/", setContas); }, [load]);
  useEffect(() => { load("/transacoes/", setTransacoes); }, [load]);
  useEffect(() => { load("/categorias/", setCategorias); }, [load]);
  useEffect(() => { load("/orcamentos/", setOrcamentos); }, [load]);

  const salvar = async (endpoint, dados) => {
    try {
      if (editando) {
        await api.patch(`${endpoint}${editando.id}/`, dados);
      } else {
        await api.post(endpoint, dados);
      }
      setModalOpen(false);
      setEditando(null);
      load(endpoint, endpoint === "/contas/" ? setContas : endpoint === "/transacoes/" ? setTransacoes : endpoint === "/categorias/" ? setCategorias : setOrcamentos);
    } catch { }
  };

  const deletar = async (endpoint, id, setter) => {
    if (!confirm("Confirmar exclusão?")) return;
    await api.delete(`${endpoint}${id}/`);
    load(endpoint, setter);
  };

  const abrirModal = (dados = {}) => {
    setEditando(dados.id ? dados : null);
    setForm(dados.id ? { ...dados } : { nome: "", saldo_inicial: "0", tipo: "despesa", valor: "", descricao: "", conta: "", categoria: "" });
    setModalOpen(true);
  };

  const abas = [
    { key: "contas", label: "Contas" },
    { key: "transacoes", label: "Transações" },
    { key: "categorias", label: "Categorias" },
    { key: "grafico", label: "Gráfico" },
  ];

  // Dados para gráfico
  const despesasPorCat = transacoes
    .filter(t => t.tipo === "despesa")
    .reduce((acc, t) => {
      const nome = t.nome_categoria || "Sem categoria";
      acc[nome] = (acc[nome] || 0) + Number(t.valor);
      return acc;
    }, {});
  const graficoData = Object.entries(despesasPorCat).map(([name, value]) => ({ name, value }));

  const saldoTotal = contas.reduce((s, c) => s + Number(c.saldo_inicial || 0), 0);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Painel de {user?.nome}</h2>
      <p className="text-sm text-gray-500 mb-4">Saldo total: <span className="font-bold text-green-600">{formatMoney(saldoTotal)}</span></p>

      <div className="flex gap-2 mb-6 border-b">
        {abas.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${aba === a.key ? "bg-white border border-b-white -mb-px text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Contas */}
      {aba === "contas" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Minhas Contas</h3>
            <button onClick={() => abrirModal()} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700">
              + Nova Conta
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr><th className="p-3">Nome</th><th className="p-3">Saldo Inicial</th><th className="p-3">Ativa</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {contas.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{c.nome}</td>
                    <td className="p-3">{formatMoney(c.saldo_inicial)}</td>
                    <td className="p-3">{c.ativa ? "Sim" : "Não"}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => abrirModal(c)} className="text-indigo-600 hover:underline text-xs">Editar</button>
                      <button onClick={() => deletar("/contas/", c.id, setContas)} className="text-red-600 hover:underline text-xs">Excluir</button>
                    </td>
                  </tr>
                ))}
                {contas.length === 0 && <tr><td colSpan={4} className="p-3 text-gray-400 text-center">Nenhuma conta</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transações */}
      {aba === "transacoes" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Transações</h3>
            <button onClick={() => abrirModal()} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700">
              + Nova Transação
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr><th className="p-3">Descrição</th><th className="p-3">Valor</th><th className="p-3">Conta</th><th className="p-3">Categoria</th><th className="p-3">Data</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {transacoes.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{t.descricao || t.tipo}</td>
                    <td className={`p-3 font-medium ${t.tipo === "receita" ? "text-green-600" : "text-red-600"}`}>
                      {t.tipo === "receita" ? "+" : "-"}{formatMoney(t.valor)}
                    </td>
                    <td className="p-3">{t.nome_conta}</td>
                    <td className="p-3">{t.nome_categoria}</td>
                    <td className="p-3">{new Date(t.data).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => abrirModal(t)} className="text-indigo-600 hover:underline text-xs">Editar</button>
                      <button onClick={() => deletar("/transacoes/", t.id, setTransacoes)} className="text-red-600 hover:underline text-xs">Excluir</button>
                    </td>
                  </tr>
                ))}
                {transacoes.length === 0 && <tr><td colSpan={6} className="p-3 text-gray-400 text-center">Nenhuma transação</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categorias */}
      {aba === "categorias" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Categorias</h3>
            <button onClick={() => abrirModal()} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700">
              + Nova Categoria
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr><th className="p-3">Nome</th><th className="p-3">Tipo</th><th className="p-3">Padrão</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {categorias.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{c.nome}</td>
                    <td className="p-3 capitalize">{c.tipo}</td>
                    <td className="p-3">{c.padrao ? "Sim" : "Não"}</td>
                    <td className="p-3 flex gap-2">
                      {!c.padrao && (
                        <>
                          <button onClick={() => abrirModal(c)} className="text-indigo-600 hover:underline text-xs">Editar</button>
                          <button onClick={() => deletar("/categorias/", c.id, setCategorias)} className="text-red-600 hover:underline text-xs">Excluir</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {categorias.length === 0 && <tr><td colSpan={4} className="p-3 text-gray-400 text-center">Nenhuma categoria</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráfico */}
      {aba === "grafico" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Despesas por Categoria</h3>
          {graficoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={graficoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {graficoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">Nenhuma despesa registrada.</p>
          )}
        </div>
      )}

      {/* Modal CRUD */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditando(null); }}
        title={editando ? `Editar ${editando.nome || editando.descricao || ""}` : "Novo"}>
        <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-3">
          {aba === "contas" && (
            <>
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Nome" value={form.nome || ""} onChange={e => setForm({ ...form, nome: e.target.value })} />
              <input className="w-full border rounded px-3 py-2 text-sm" type="number" step="0.01" placeholder="Saldo inicial" value={form.saldo_inicial || "0"} onChange={e => setForm({ ...form, saldo_inicial: e.target.value })} />
            </>
          )}
          {aba === "transacoes" && (
            <>
              <select className="w-full border rounded px-3 py-2 text-sm" value={form.tipo || "despesa"} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
              <input className="w-full border rounded px-3 py-2 text-sm" type="number" step="0.01" placeholder="Valor" value={form.valor || ""} onChange={e => setForm({ ...form, valor: e.target.value })} />
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Descrição" value={form.descricao || ""} onChange={e => setForm({ ...form, descricao: e.target.value })} />
              <select className="w-full border rounded px-3 py-2 text-sm" value={form.conta || ""} onChange={e => setForm({ ...form, conta: e.target.value })}>
                <option value="">Selecione a conta</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <select className="w-full border rounded px-3 py-2 text-sm" value={form.categoria || ""} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                <option value="">Selecione a categoria</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </>
          )}
          {aba === "categorias" && (
            <>
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Nome" value={form.nome || ""} onChange={e => setForm({ ...form, nome: e.target.value })} />
              <select className="w-full border rounded px-3 py-2 text-sm" value={form.tipo || "despesa"} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </>
          )}
          <button type="button" onClick={() => salvar(
            aba === "contas" ? "/contas/" : aba === "transacoes" ? "/transacoes/" : "/categorias/",
            form
          )} className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700">
            Salvar
          </button>
        </form>
      </Modal>
    </div>
  );
}
