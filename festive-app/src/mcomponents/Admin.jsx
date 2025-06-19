import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminSidebar from "./AdminSideBar";
import AdminCreateAccount from "./AdminCreateAccount";
import AdminDeleteMember from "./adminDeleteMember";
import "./AdminCommon.css";

function Admin() {
  return (
    <BrowserRouter>
      <div className="member-management-container">
        <div className="management-content">
          {/* Sidebar */}
          <AdminSidebar />
          <Routes>
            <Route path="/admin/create" element={<AdminCreateAccount />} />
            <Route path="/admin/users" element={<AdminDeleteMember />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default Admin;
