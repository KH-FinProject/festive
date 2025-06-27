import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminSidebar from "./AdminSideBar";
import AdminMain from "./AdminMain";
import AdminCreateAccount from "./AdminCreateAccount";
import AdminDeleteMember from "./adminDeleteMember";
import AdminCustomerService from "./AdminCustomerService";
import AdminBoardManagement from "./AdminBoardManagement";
import AdminApplicationStatus from "./AdminApplicationStatus";

import "./AdminCommon.css";
import AdminBoardWrite from "./AdminBoardWrite";
import AdminCustomerReply from "./AdminCustomerReply";
import AdminCustomerReportDetail from "./AdminCustomerReportDetail";
import AdminApplicationDetail from "./AdminApplicationDetail";

const AdminRoutes = () => (
  <Routes>
    <Route path="" element={<AdminMain />} />
    <Route path="create" element={<AdminCreateAccount />} />
    <Route path="users" element={<AdminDeleteMember />} />
    <Route path="customer" element={<AdminCustomerService />} />
    <Route path="board" element={<AdminBoardManagement />} />
    <Route path="applications" element={<AdminApplicationStatus />} />
    <Route path="write" element={<AdminBoardWrite />} />
    <Route path="reply" element={<AdminCustomerReply />} />
    <Route
      path="report-detail/:reportNo"
      element={<AdminCustomerReportDetail />}
    />
    <Route path="appDetail" element={<AdminApplicationDetail />} />
  </Routes>
);

export default AdminRoutes;
