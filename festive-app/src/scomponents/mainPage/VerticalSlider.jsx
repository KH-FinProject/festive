import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import "./VerticalSlider.css";

const VerticalSlider = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // 축제 슬라이드 데이터
  const slides = [
    {
      title: "이달의 축제",
      description: "Festive와 함께 이달의 축제를 만나보세요",
      bgColor: "#FFB3BA",
      bgImage:
        "https://images.unsplash.com/photo-1522383225653-ed111181a951?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
    },
    {
      title: "축제달력",
      description: "한눈에 보는 전국 축제일정!",
      bgColor: "#E6B88A",
      bgImage:
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
    },
    {
      title: "지역별 축제",
      description: "지역별로 다양한 축제를 즐겨보세요",
      bgColor: "#E8D48F",
      bgImage:
        "https://images.unsplash.com/photo-1507041957456-9c397ce39c97?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
    },
    {
      title: "와글와글",
      description: "즐거운 사람들, 생생한 현장의 이야기와 사진들!",
      bgColor: "#9BC49B",
      bgImage:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
    },
    {
      title: "AI 여행코스 추천",
      description: "당신만을 위한 맞춤형 축제 여행 코스를 AI가 추천해드려요",
      bgColor: "#8BB8E8",
      bgImage:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
    },
    {
      title: "부스 참가신청",
      description: "나만의 브랜드를 지금 바로 신청하고 참가해보세요",
      bgColor: "#C08BE8",
      bgImage:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
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
    <div className="slider-container">
      {/* 왼쪽 텍스트 슬라이드 */}
      <div
        className="left-slide"
        style={{
          top: `${-(slides.length - 1) * 100}%`,
          transform: `translateY(${activeSlideIndex * 100}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <div key={index} style={{ backgroundColor: slide.bgColor }}>
            <h1>{slide.title}</h1>
            <p>{slide.description}</p>
          </div>
        ))}
      </div>

      {/* 오른쪽 이미지 슬라이드 */}
      <div
        className="right-slide"
        style={{
          transform: `translateY(${-activeSlideIndex * 100}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{ backgroundImage: `url('${slide.bgImage}')` }}
          />
        ))}
      </div>

      {/* 컨트롤 버튼 */}
      <div className="action-buttons">
        <button
          className="slider-button down-button"
          onClick={() => changeSlide("down")}
        >
          <ChevronDown size={20} />
        </button>
        <button
          className="slider-button up-button"
          onClick={() => changeSlide("up")}
        >
          <ChevronUp size={20} />
        </button>
      </div>
    </div>
  );
};

export default VerticalSlider;
