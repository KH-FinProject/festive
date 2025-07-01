import React from "react";
import mainLogo from "../assets/festiveLogo.png";
import "./HeaderForManager.css";

function HeaderForManager() {
  return (
    <header className="header">
      <div className="headerlogo">
        <a href="/admin">
          <img src={mainLogo} alt="festive logo" />
        </a>
      </div>
    </header>
  );
}

export default HeaderForManager;
