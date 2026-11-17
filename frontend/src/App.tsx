import { Navigate, Route, Routes } from "react-router-dom";
import PendingPage from "./components/common/PendingPage";
import adminRoutes from "./routes/AdminRoutes";
import publicRoutes from "./routes/PublicRoutes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      {adminRoutes}
      {publicRoutes}
      <Route
        path="*"
        element={
          <PendingPage
            title="Página no encontrada"
            description="La ruta que intentaste visitar no existe o fue movida."
          />
        }
      />
    </Routes>
  );
}

export default App;
