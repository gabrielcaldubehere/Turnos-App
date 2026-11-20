import { Route } from "react-router-dom";

import RequireRole from "../auth/RequireRole";
import ClientLayout from "../layouts/ClientLayout";
import BookingPage from "../pages/BookingPage";
import ClientAppointmentsPage from "../pages/ClientAppointmentsPage";

const clientRoutes = [
  <Route
    key="client"
    path="/client/:username"
    element={
      <RequireRole role="client">
        <ClientLayout />
      </RequireRole>
    }
  >
    <Route index element={<ClientAppointmentsPage />} />
    <Route path="new" element={<BookingPage mode="client" />} />
  </Route>,
];

export default clientRoutes;
