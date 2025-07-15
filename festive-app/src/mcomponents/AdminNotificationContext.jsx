import React, { createContext, useContext, useState, useEffect } from "react";

const AdminNotificationContext = createContext();

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error(
      "useAdminNotifications must be used within AdminNotificationProvider"
    );
  }
  return context;
};

export const AdminNotificationProvider = ({ children }) => {
  const [hasNewReport, setHasNewReport] = useState(false);
  const [hasNewBooth, setHasNewBooth] = useState(false);
  const [hasNewInquiry, setHasNewInquiry] = useState(false);

  useEffect(() => {
    // WebSocket 기능 완전 비활성화
    console.log("WebSocket 기능이 완전히 비활성화되었습니다.");
    return;
  }, []);

  const value = {
    hasNewReport,
    setHasNewReport,
    hasNewBooth,
    setHasNewBooth,
    hasNewInquiry,
    setHasNewInquiry,
  };

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
};
