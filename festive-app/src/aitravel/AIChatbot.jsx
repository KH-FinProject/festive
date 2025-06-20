import React, { useState, useEffect, useRef } from "react";
import "./AIChatbot.css";
import { Map, MapMarker } from "react-kakao-maps-sdk";

const AIChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    lat: 37.5665,
    lng: 126.978,
  });
  const chatContainerRef = useRef(null);

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAPI_KEY;

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
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [...messages, userMessage],
          }),
        }
      );

      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
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
      <div className="chat-header">
        <h2>AI 여행코스 추천</h2>
        <p>가고 싶은 여행지를 입력하시면 도와드리겠습니다.</p>
      </div>

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
                <div className="message-content">{message.content}</div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-content loading">입력 중...</div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="목적 여행 지역을 입력해주세요..."
            />
            <button onClick={handleSendMessage}>전송</button>
          </div>
        </div>

        <div className="map-section">
          <Map
            center={mapCenter}
            style={{ width: "100%", height: "100%" }}
            level={3}
          >
            <MapMarker position={mapCenter} />
          </Map>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
