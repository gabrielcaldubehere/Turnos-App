import { Navigate, Route } from "react-router-dom";

import RequireRole from "../auth/RequireRole";
import PendingPage from "../components/common/PendingPage";
import AppLayout from "../layouts/AppLayout";
import AdminLoginPage from "../pages/AdminLoginPage";
import AppointmentsPage from "../pages/AppointmentsPage";
import DashboardPage from "../pages/DashboardPage";

const adminRoutes = [
  <Route key="admin-login" path="/admin/login" element={<AdminLoginPage />} />,
  <Route
    key="admin"
    path="/admin"
    element={
      <RequireRole role="admin" redirectTo="/admin/login">
        <AppLayout />
      </RequireRole>
    }
  >
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="appointments" element={<AppointmentsPage />} />
    <Route
      path="clients"
      element={
        <PendingPage
          title="Clientes"
          description="La gestión de clientes estará disponible en el próximo sprint."
        />
      }
    />
    <Route
      path="professionals"
      element={
        <PendingPage
          title="Profesionales"
          description="La gestión de profesionales estará disponible en el próximo sprint."
        />
      }
    />
    <Route
      path="services"
      element={
        <PendingPage
          title="Servicios"
          description="La gestión de servicios estará disponible en el próximo sprint."
        />
      }
    />
    <Route
      path="settings"
      element={
        <PendingPage
          title="Configuración"
          description="La configuración del negocio estará disponible en el próximo sprint."
        />
      }
    />
  </Route>,
];

export default adminRoutes;
