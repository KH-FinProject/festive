import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import "./VerticalSlider.css";
import { useNavigate } from "react-router-dom";
import calendarImg from "../../assets/calendar.png";
import wagleImg from "../../assets/wagle.png";
import aiTravelImg from "../../assets/AiTravel.png";
import boothImg from "../../assets/boothImg.jpg";

const VerticalSlider = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const navigate = useNavigate();

  const handleSlideClick = (path) => {
    if (path && path !== "#") {
      navigate(path);
    }
  };

  // 축제 슬라이드 데이터
  const slides = [
    {
      title: "이달의 축제",
      description: "Festive와 함께 이달의 축제를 만나보세요",
      bgColor: "#FFB3BA",
      bgImage:
        "https://images.unsplash.com/photo-1522383225653-ed111181a951?...",
      path: "/this-month",
    },
    {
      title: "축제달력",
      description: "한눈에 보는 전국 축제일정!",
      bgColor: "#E6B88A",
      bgImage: calendarImg,
      path: "/calendar",
    },
    {
      title: "지역별 축제",
      description: "지역별로 다양한 축제를 즐겨보세요",
      bgColor: "#E8D48F",
      bgImage:
        "https://korean.visitkorea.or.kr/kfes/resources/img/2023FestivalMap.jpg",
      path: "/festival/local",
    },
    {
      title: "와글와글",
      description: "즐거운 사람들, 생생한 현장의 이야기와 사진들!",
      bgColor: "#9BC49B",
      bgImage: wagleImg,
      path: "/wagle",
    },
    {
      title: "AI 여행코스 추천",
      description: "당신만을 위한 맞춤형 축제 여행 코스를 AI가 추천해드려요",
      bgColor: "#8BB8E8",
      bgImage: aiTravelImg,
      path: "/ai-travel",
    },
    {
      title: "부스 참가신청",
      description: "축제를 함께할 플리마켓·푸드트럭 부스를 모집합니다!",
      bgColor: "#C08BE8",
      bgImage: boothImg,
      path: "/booth",
    },
  ];

  const changeSlide = (direction) => {
    if (direction === "up") {
      setActiveSlideIndex((prev) => (prev >= slides.length - 1 ? 0 : prev + 1));
    } else if (direction === "down") {
      setActiveSlideIndex((prev) => (prev <= 0 ? slides.length - 1 : prev - 1));
    }
  };

  // 자동 슬라이드 (선택사항)
  useEffect(() => {
    const interval = setInterval(() => {
      changeSlide("up");
    }, 5000); // 5초마다 자동 슬라이드

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="vertical-slider-container">
      {/* 왼쪽 텍스트 슬라이드 */}
      <div
        className="vertical-left-slide"
        style={{
          top: `${-(slides.length - 1) * 100}%`,
          transform: `translateY(${activeSlideIndex * 100}%)`,
        }}
      >
        {slides
          .slice() // 원본 배열을 변경하지 않기 위해 복사
          .reverse()
          .map((slide, index) => (
            <div
              key={index}
              style={{ backgroundColor: slide.bgColor, cursor: "pointer" }}
              onClick={() => handleSlideClick(slide.path)}
            >
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
            </div>
          ))}
      </div>

      {/* 오른쪽 이미지 슬라이드 */}
      <div
        className="vertical-right-slide"
        style={{
          transform: `translateY(${-activeSlideIndex * 100}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              backgroundImage: `url('${slide.bgImage}')`,
              cursor: "pointer",
            }}
            onClick={() => handleSlideClick(slide.path)}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default VerticalSlider;
