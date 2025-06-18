import React from "react";
import mainMiddleImg from "../assets/mainMiddle.png";
import "./MainPage.css";
import img9 from "../assets/temp/image 9.png";
import img10 from "../assets/temp/image 10.png";
import img11 from "../assets/temp/image 11.png";
import img12 from "../assets/temp/image 12.png";
import img13 from "../assets/temp/image 13.png";
import VerticalSlider from "./VerticalSlider.jsx";

function MainPage() {
  return (
    <div>
      <VerticalSlider />

      <section className="top5-section">
        <h1>🔥 인기 축제 TOP 5</h1>
        <img className="poster-line-img" src={mainMiddleImg} />
        <div className="posters">
          {[img9, img10, img11, img12, img13].map((url, i) => (
            <a key={i} className="poster-placeholder">
              <img src={url} alt={`포스터 ${i + 1}`} className="poster-child" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MainPage;
