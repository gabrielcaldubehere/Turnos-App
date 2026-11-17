import { Navigate, Route } from "react-router-dom";

import PendingPage from "../components/common/PendingPage";
import AppLayout from "../layouts/AppLayout";
import AppointmentsPage from "../pages/AppointmentsPage";
import DashboardPage from "../pages/DashboardPage";

const adminRoutes = [
  <Route key="admin" path="/admin" element={<AppLayout />}>
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
