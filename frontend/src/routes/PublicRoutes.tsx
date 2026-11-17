import { Navigate, Route } from "react-router-dom";

import PendingPage from "../components/common/PendingPage";
import BookingPage from "../pages/BookingPage";
import PublicLayout from "../layouts/PublicLayout";

const publicRoutes = [
  <Route key="public" path="/b/:businessSlug" element={<PublicLayout />}>
    <Route index element={<Navigate to="booking" replace />} />
    <Route path="booking" element={<BookingPage />} />
    <Route
      path="login"
      element={
        <PendingPage
          title="Ingresar"
          description="El acceso con email y contraseña o código de verificación estará disponible próximamente."
        />
      }
    />
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
        <PendingPage
          title="Mis turnos"
          description="El historial de reservas estará disponible próximamente."
        />
      }
    />
  </Route>,
];

export default publicRoutes;
