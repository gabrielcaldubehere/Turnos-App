import { Navigate, Route } from "react-router-dom";

import RequireRole from "../auth/RequireRole";
import PendingPage from "../components/common/PendingPage";
import PublicLayout from "../layouts/PublicLayout";
import BookingPage from "../pages/BookingPage";
import ClientAppointmentsPage from "../pages/ClientAppointmentsPage";
import ClientLoginPage from "../pages/ClientLoginPage";

const publicRoutes = [
  <Route key="public" path="/b/:businessSlug" element={<PublicLayout />}>
    <Route index element={<Navigate to="booking" replace />} />
    <Route path="booking" element={<BookingPage />} />
    <Route path="login" element={<ClientLoginPage />} />
    <Route
      path="register"
      element={
        <PendingPage
          title="Crear cuenta"
          description="El registro de clientes estará disponible próximamente."
        />
      }
    />
    <Route
      path="my-appointments"
      element={
        <RequireRole role="client">
          <ClientAppointmentsPage />
        </RequireRole>
      }
    />
  </Route>,
];

export default publicRoutes;
