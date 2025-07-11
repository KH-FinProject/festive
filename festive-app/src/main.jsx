import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AdminNotificationProvider } from "./mcomponents/AdminNotificationContext.jsx";

createRoot(document.getElementById("root")).render(
  <AdminNotificationProvider>
    <div style={{ width: "100%" }}>
      <App />
    </div>
  </AdminNotificationProvider>
);
