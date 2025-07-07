import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./LegalSideMenu.css";

const LegalSideMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/company", label: "회사소개" },
    { path: "/privacy", label: "개인정보 처리방침" },
    { path: "/terms", label: "이용약관" },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <div className="legal-side-menu">
      <div className="menu-title">법적 정보</div>
      <ul>
        {menuItems.map((item) => (
          <li
            key={item.path}
            className={location.pathname === item.path ? "active" : ""}
            onClick={() => handleMenuClick(item.path)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LegalSideMenu;
