import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminSidebar from "./AdminSideBar";
import AdminMain from "./AdminMain";
import AdminCreateAccount from "./AdminCreateAccount";
import AdminDeleteMember from "./adminDeleteMember";
import AdminCustomerService from "./AdminCustomerService";
import AdminBoardManagement from "./AdminBoardManagement";
import AdminApplicationStatus from "./AdminApplicationStatus";

import "./AdminCommon.css";

function Admin() {
  return (
    <BrowserRouter>
      <div className="member-management-container">
        <div className="management-content">
          {/* Sidebar */}
          <AdminSidebar />
          <Routes>
            <Route path="/" element={<AdminMain />} />
            <Route path="/admin" element={<AdminMain />} />
            <Route path="/admin/create" element={<AdminCreateAccount />} />
            <Route path="/admin/users" element={<AdminDeleteMember />} />
            <Route path="/admin/customer" element={<AdminCustomerService />} />
            <Route path="/admin/board" element={<AdminBoardManagement />} />
            <Route
              path="/admin/applications"
              element={<AdminApplicationStatus />}
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default Admin;
