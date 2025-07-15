import React, { createContext, useContext, useState } from "react";

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
