import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Title.css";

function Title() {

  return (
    <div className="calendar-header">
      <div className="calendar-main-title">축제 달력</div>
      <div className="calendar-sub-title">
        # 원하시는 날짜를 선택하시면 해당 일의 축제를 구경하실 수 있습니다.
      </div>
    </div>
  );
}

export default Title;
