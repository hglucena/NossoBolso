import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import CadastroPage from "./pages/CadastroPage";
import PainelMembro from "./pages/PainelMembro";
import PainelGestor from "./pages/PainelGestor";
import PainelAdmin from "./pages/PainelAdmin";

function PainelDispatcher() {
  const { user } = useAuth();
  if (user?.papel_sistema === "admin") return <PainelAdmin />;
  return <PainelMembro />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/painel" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<PainelDispatcher />} />
        <Route path="gestor" element={<PainelGestor />} />
      </Route>
      <Route path="/admin" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<PainelAdmin />} />
      </Route>
      <Route path="*" element={<Navigate to="/painel" replace />} />
    </Routes>
  );
}
