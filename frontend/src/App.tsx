import { Navigate, Route, Routes } from "react-router-dom";
import PendingPage from "./components/common/PendingPage";
import BookingPage from "./pages/BookingPage";
import MainPage from "./pages/MainPage";
import adminRoutes from "./routes/AdminRoutes";
import clientRoutes from "./routes/ClientRoutes";
import publicRoutes from "./routes/PublicRoutes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/main" replace />} />
      <Route path="/main" element={<MainPage />} />
      <Route
        path="/main/new"
        element={
          <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
            <BookingPage mode="onboarding" />
          </div>
        }
      />
      {clientRoutes}
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
