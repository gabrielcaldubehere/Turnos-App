import { Navigate, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import BookingPage from "../pages/BookingPage";

const publicRoutes = [
  <Route key="public" path="/b/:businessSlug" element={<PublicLayout />}>
    <Route index element={<Navigate to="booking" replace />} />
    <Route path="booking" element={<BookingPage />} />
    <Route path="login" element={<Navigate to="/main" replace />} />
    <Route path="register" element={<Navigate to="/main/new" replace />} />
    <Route path="my-appointments" element={<Navigate to="/main" replace />} />
  </Route>,
];

export default publicRoutes;
