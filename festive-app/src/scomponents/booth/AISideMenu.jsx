import React from "react";
import "./AISideMenu.css";

const AISideMenu = ({ activeTab, setActiveTab }) => {
  const handleTabClick = (tab) => {
    window.scrollTo(0, 0);
    setActiveTab(tab);
  };

  return (
    <div className="ai-side-menu">
      <ul>
        <li
          className={activeTab === "fleamarket" ? "booth-active" : ""}
          onClick={() => handleTabClick("fleamarket")}
        >
          플리마켓 신청
        </li>
        <li
          className={activeTab === "foodtruck" ? "booth-active" : ""}
          onClick={() => handleTabClick("foodtruck")}
        >
          푸드트럭 신청
        </li>
      </ul>
    </div>
  );
};

export default AISideMenu;
