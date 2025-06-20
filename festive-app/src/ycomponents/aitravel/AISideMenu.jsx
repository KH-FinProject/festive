import React from "react";
import "./AISideMenu.css";

const AISideMenu = ({ activeMenu, onMenuClick }) => {
  return (
    <div className="ai-side-menu">
      <ul>
        <li
          className={activeMenu === "share" ? "active" : ""}
          onClick={() => onMenuClick("share")}
        >
          여행코스 공유
        </li>
        <li
          className={activeMenu === "myTravel" ? "active" : ""}
          onClick={() => onMenuClick("myTravel")}
        >
          나만의 여행코스
        </li>
      </ul>
    </div>
  );
};

export default AISideMenu;
