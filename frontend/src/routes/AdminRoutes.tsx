import { Route } from "react-router-dom";

import RequireRole from "../auth/RequireRole";
import AppLayout from "../layouts/AppLayout";
import AppointmentsPage from "../pages/AppointmentsPage";
import ClientsAdminPage from "../pages/ClientsAdminPage";
import DashboardPage from "../pages/DashboardPage";
import ProfessionalsAdminPage from "../pages/ProfessionalsAdminPage";
import ServicesAdminPage from "../pages/ServicesAdminPage";

const adminRoutes = [
  <Route
    key="admin"
    path="/admin"
    element={
      <RequireRole role="admin">
        <AppLayout />
      </RequireRole>
    }
  >
    <Route index element={<DashboardPage />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="appointments" element={<AppointmentsPage />} />
    <Route path="clients" element={<ClientsAdminPage />} />
    <Route path="professionals" element={<ProfessionalsAdminPage />} />
    <Route path="services" element={<ServicesAdminPage />} />
  </Route>,
];

export default adminRoutes;
