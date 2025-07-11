import React from "react";
import { Link } from "react-router-dom";
import openapi from "../assets/openai.svg";
import trip from "../assets/trip.png";
import "./HeaderFooter.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footerfooter-left">
        <div className="footerfooter-title">FESTIVE</div>
        <div className="footerfooter-sub">
          서울특별시 우자 산업단지 유튜브 99, 울트라사옥 대표이사 : 성원숭
        </div>
        <div className="footerfooter-sub">이메일 : rlawlgh246@gmail.com</div>
      </div>

      <div className="footerfooter-center">
        <div className="footerfooter-links">
          <Link to="/company">회사소개</Link>
          <Link to="/privacy">개인정보처리방침</Link>
          <Link to="/terms">이용약관</Link>
        </div>
        <div className="footerapi-images">
          <a>
            <img src={openapi} className="footerapi-image-placeholder" />
          </a>
          <a>
            <img src={trip} className="footerapi-image-placeholder" />
          </a>
        </div>
      </div>

      <div className="footerfooter-right">
        <div className="footerfooter-contact">1588-1234</div>
        <div className="footerfooter-hours">
          09:00 ~ 18:00(토요일, 공휴일 휴무)
        </div>
        <div className="footerfooter-links">
          <a href="/customer-center">문의하기</a>
          <a href="#">자주 묻는 질문</a>
        </div>
        <div className="footerfooter-copy">
          Copyright MEDIA DESIGHNER ALL RIGHTS RESERVED
        </div>
      </div>
    </footer>
  );
}

export default Footer;
