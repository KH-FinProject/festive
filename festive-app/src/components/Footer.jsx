import React from "react";
import openapi from "../assets/openapi.png";
import trip from "../assets/trip.png";
import "./HeaderFooter.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <div className="footer-title">FESTIVE</div>
        <div className="footer-sub">
          서울특별시 우자 산업단지 유튜브 99, 울트라사옥 대표이사 : 성원숭
        </div>
        <div className="footer-sub">이메일 : rkdwl811@gmail.com</div>
      </div>

      <div className="footer-center">
        <div className="footer-links">
          <a href="#">회사소개</a>
          <a href="#">개인정보처리방침</a>
          <a href="#">이용약관</a>
        </div>
        <div className="api-images">
          <a>
            <img src={openapi} className="api-image-placeholder" />
          </a>
          <a>
            <img src={trip} className="api-image-placeholder" />
          </a>
        </div>
      </div>

      <div className="footer-right">
        <div className="footer-contact">1588-1234</div>
        <div className="footer-hours">09:00 ~ 18:00(토요일, 공휴일 휴무)</div>
        <div className="footer-links">
          <a href="#">1:1문의하기</a>
          <a href="#">자주 묻는 질문</a>
        </div>
        <div className="footer-copy">
          Copyright MEDIA DESIGHNER ALL RIGHTS RESERVED
        </div>
      </div>
    </footer>
  );
}

export default Footer;
