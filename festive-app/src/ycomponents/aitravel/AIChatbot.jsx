import React, { useState, useEffect, useRef } from "react";
import "./AIChatbot.css";
import AItitle from "./AItitle";
// import OpenAI from "openai";

// OpenAI 설정은 환경 변수나 백엔드를 통해 안전하게 처리해야 합니다
// const openai = new OpenAI({
//   apiKey: import.meta.env.VITE_OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true
// });

// 카카오맵 API 키는 나중에 환경변수로 설정
const KAKAO_MAP_API_KEY = "YOUR_KAKAO_MAP_API_KEY";

function AIChatbot() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  useEffect(() => {
    // 카카오맵 초기화
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services,clusterer,drawing`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        const options = {
          center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
          level: 3,
        };
        map.current = new window.kakao.maps.Map(mapContainer.current, options);
      });
    };

    document.head.appendChild(script);

    // 초기 웰컴 메시지
    setMessages([
      {
        type: "bot",
        content:
          "안녕하세요! 저는 당신의 여행 코스를 추천해드리는 AI 여행 플래너입니다. 어떤 여행을 계획하고 계신가요? 축제나 관광지에 대해 자유롭게 물어보세요!",
      },
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // 사용자 메시지 추가
    const userMessage = {
      type: "user",
      content: inputMessage,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      // 임시 응답 사용
      setTimeout(() => {
        const botResponse = {
          type: "bot",
          content:
            "현재 AI 응답 기능은 개발 중입니다. 대신 서울의 주요 관광지를 추천해드리겠습니다!",
          locations: [
            {
              name: "서울시청",
              lat: 37.566826,
              lng: 126.9786567,
            },
            {
              name: "덕수궁",
              lat: 37.565861,
              lng: 126.975194,
            },
            {
              name: "경복궁",
              lat: 37.579617,
              lng: 126.977041,
            },
          ],
        };

        setMessages((prev) => [...prev, botResponse]);
        updateMap(botResponse.locations);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        },
      ]);
      setLoading(false);
    }
  };

  const updateMap = (locations) => {
    // 기존 마커 제거
    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = [];

    // 새로운 마커 생성
    locations.forEach((location) => {
      const markerPosition = new window.kakao.maps.LatLng(
        location.lat,
        location.lng
      );
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        map: map.current,
      });
      markers.current.push(marker);

      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;">${location.name}</div>`,
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, "click", () => {
        infowindow.open(map.current, marker);
      });
    });

    // 지도 중심 이동
    if (locations.length > 0) {
      map.current.setCenter(
        new window.kakao.maps.LatLng(locations[0].lat, locations[0].lng)
      );
    }
  };

  return (
    <div className="ai-chatbot-container">
      <AItitle />

      <div className="chat-interface">
        <div className="map-container" ref={mapContainer}></div>

        <div className="chat-container">
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
            {loading && (
              <div className="message bot">
                <div className="message-content loading">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="메시지를 입력하세요..."
            />
            <button onClick={handleSendMessage}>전송</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChatbot;
