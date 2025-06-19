import React from "react";
import NoticeBoard from "./NoticeBoard";
import GeneralBoard from "./GeneralBoard";
import "./WaglePage.css";

function WaglePage() {
  return (
    <div className="wagle-page-container">
      <NoticeBoard />
      <div className="wagle-divider" />
      <GeneralBoard />
    </div>
  );
}

export default WaglePage;
