// ExpandingCards.js (Slick 슬라이더로 변경)
import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Month-Slider.css";

const ExpandingCards = ({ festivals = [] }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    fade: true,
    cssEase: "linear",
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    // 커스텀 화살표 (선택사항)
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    // 반응형 설정
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          dots: true,
        },
      },
      {
        breakpoint: 480,
        settings: {
          arrows: false,
          dots: true,
        },
      },
    ],
  };

  return (
    <div className="festival-slider-container">
      <div className="festival-slick-wrapper">
        <Slider {...settings}>
          {festivals.map((festival, index) => (
            <div key={festival.id}>
              <div
                className="festival-slide-panel"
                style={{ backgroundImage: `url('${festival.image}')` }}
              >
                <div className="festival-overlay">
                  <h3 className="festival-title">{festival.title}</h3>
                  <p className="festival-location">
                    <svg
                      className="icon"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {festival.location}
                  </p>
                  <p className="festival-date">
                    <svg
                      className="icon"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {festival.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

// 커스텀 화살표 컴포넌트 (선택사항)
const CustomPrevArrow = ({ className, style, onClick }) => (
  <div
    className={`${className} festival-custom-arrow festival-custom-prev-arrow`}
    style={{ ...style }}
    onClick={onClick}
  >
    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  </div>
);

const CustomNextArrow = ({ className, style, onClick }) => (
  <div
    className={`${className} festival-custom-arrow festival-custom-next-arrow`}
    style={{ ...style }}
    onClick={onClick}
  >
    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  </div>
);

export default ExpandingCards;
