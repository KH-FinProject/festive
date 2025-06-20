import React, { useState, useEffect, useRef } from "react";
import "./AIChatbot.css";
import { Map, MapMarker } from "react-kakao-maps-sdk";

// OpenAI 설정은 환경 변수나 백엔드를 통해 안전하게 처리해야 합니다
// const openai = new OpenAI({
//   apiKey: import.meta.env.VITE_OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true
// });

// 카카오맵 API 키는 나중에 환경변수로 설정
const KAKAO_MAP_API_KEY = "YOUR_KAKAO_MAP_API_KEY";

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        '안녕하세요! 축제 여행 계획을 도와드리겠습니다.\n예) "제주도 서귀포시 축제를 알려줘 박물관에서 보고 감귤 따러 사장님이 아닌데가서"\n주의사항 말씀을 보여줘!',
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAPI_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [...messages, userMessage].map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("API 요청 실패");
      }

      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-chatbot-container">
      <h2 className="ai-title">AI 여행코스 추천</h2>

      <div className="chat-map-container">
        <div className="chat-section">
          <div className="chat-messages" ref={chatContainerRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${
                  message.role === "user" ? "user" : "assistant"
                }`}
              >
                <div className="message-content">
                  {message.content.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                {message.role === "user" && (
                  <button className="send-btn">전송</button>
                )}
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-content loading">
                  목적 여행 계획을 생성하는중...
                </div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="목적 여행 계획을 입력해주세요..."
            />
            <button onClick={handleSendMessage}>전송</button>
          </div>
        </div>

        <div className="map-section">
          <Map
            center={{ lat: 37.5665, lng: 126.978 }}
            style={{ width: "100%", height: "100%" }}
            level={3}
          >
            <MapMarker position={{ lat: 37.5665, lng: 126.978 }} />
          </Map>
        </div>
      </div>

      <div className="course-info">
        <h3>서울 벚꽃축제 1박2일 코스</h3>
        <p className="course-notice">
          * 예상 된: 날짜 개인시간이나 날씨에 따라 달라질 수 있으니 시간과
          예산에서는 여유있게 하시길 바랍니다. 주말이면 인파가 많으니 별도
          계획을 추천합니다. 현재 인원 계획 중입니다
        </p>

        <div className="course-section">
          <h4>1일차</h4>
          <div className="course-content">
            <ul>
              <li>오전 10시: 여의도 벚꽃축제 진입 및 현지 리뷰어</li>
              <li>오후 1시: 여의도 갤러리아 점심식사 (한정식, 양식)</li>
              <li>오후 3시: 한복을 입고 벚 수풀길 교차점 관람</li>
              <li>오후 5시: 50년을 관통하는 거리 탐방 및 카페를 소비</li>
              <li>오후 7시: 50년을 관통하는데 통계 (교통비, 간식비)</li>
              <li>오후 9시: N서울타워에서 야경 감상 및 저녁 코스로</li>
            </ul>
          </div>
        </div>

        <div className="course-section">
          <h4>2일차</h4>
          <div className="course-content">
            <ul>
              <li>오전 10시: 경의선숲길 벚꽃길 산책 (약수동 주거)</li>
              <li>
                오전 11시: 홍대 카페거리에서 브런치 (아메리칸 토스트,
                아메리카노)
              </li>
              <li>오후 1시: 망원동길 인근 벚 꽃길 산책</li>
              <li>오후 3시: 한강 스카이워크 위에 벚 가지들의 색채</li>
              <li>오후 5시: 남산타워로 진행하여 저녁 (한국스, 중식)</li>
              <li>오후 7시: 서울 야경에서 사진을 마무리</li>
            </ul>
          </div>
        </div>

        <div className="button-group">
          <button className="action-btn">저장</button>
          <button className="action-btn">공유</button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
