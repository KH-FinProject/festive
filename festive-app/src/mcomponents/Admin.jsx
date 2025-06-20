import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminSidebar from "./AdminSideBar";
import AdminMain from "./AdminMain";
import AdminCreateAccount from "./AdminCreateAccount";
import AdminDeleteMember from "./adminDeleteMember";
import AdminCustomerService from "./AdminCustomerService";
import AdminBoardManagement from "./AdminBoardManagement";
import AdminApplicationStatus from "./AdminApplicationStatus";

import "./AdminCommon.css";
import HeaderForManager from "./HeaderForManager";
import AdminBoardWrite from "./AdminBoardWrite";
import AdminCustomerReply from "./AdminCustomerReply";
import AdminCustomerReportDetail from "./AdminCustomerReportDetail";
import AdminApplicationDetail from "./AdminApplicationDetail";

const AdminRoutes = () => (
  <Routes>
    <Route path="/admin" element={<AdminMain />} />
    <Route path="/admin/create" element={<AdminCreateAccount />} />
    <Route path="/admin/users" element={<AdminDeleteMember />} />
    <Route path="/admin/customer" element={<AdminCustomerService />} />
    <Route path="/admin/board" element={<AdminBoardManagement />} />
    <Route path="/admin/applications" element={<AdminApplicationStatus />} />
    <Route path="/admin/write" element={<AdminBoardWrite />} />
    <Route path="/admin/reply" element={<AdminCustomerReply />} />
    <Route path="/admin/detail" element={<AdminCustomerReportDetail />} />
    <Route path="/admin/appDetail" element={<AdminApplicationDetail />} />
  </Routes>
);

export default AdminRoutes;
