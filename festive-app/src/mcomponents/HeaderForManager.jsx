import React from "react";
import mainLogo from "../assets/festiveLogo.png";
import "./HeaderForManager.css";
import { useAdminNotification } from "./AdminNotificationContext.jsx";

function HeaderForManager() {
  const { hasNewReport } = useAdminNotification();

  return (
    <header className="header">
      <div className="headerlogo">
        <a href="/admin">
          <img src={mainLogo} alt="festive logo" />
        </a>
      </div>
      <div className="notification-area">
        <a href="/admin/customer" className="notification-link">
          <span role="img" aria-label="알림">
            🔔
          </span>
          {hasNewReport && <span className="notification-badge">N</span>}
        </a>
      </div>
    </header>
  );
}

export default HeaderForManager;
