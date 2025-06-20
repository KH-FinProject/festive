import React, { useState, useEffect, useRef } from "react";
import "./AIChatbot.css";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import OpenAI from "openai";
import AItitle from "./AItitle";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const ASSISTANT_INSTRUCTIONS = `
당신은 축제 여행 계획을 추천해주는 전문가입니다. 
사용자의 요청에 따라 축제 정보와 함께 간결하고 명확한 여행 코스를 제안해주세요.

다음 형식으로 짧고 핵심적인 내용만 답변해주세요:

[축제 정보]
- 축제명: (간단히)
- 기간: (시작일-종료일)
- 장소: (간단히)
@location:[위도,경도]

[추천 코스]
1. (시간) - (장소/활동) 
@location:[위도,경도]
2. (시간) - (장소/활동)
@location:[위도,경도]
...

[교통 안내]
- 가장 가까운 역: (역명)
- 추천 이동수단: (버스/지하철/도보 등)

[마무리 멘트]
즐거운 여행 되시길 바랍니다! 추가 질문이 있으시면 언제든 물어보세요.

답변은 항상 위 형식을 지키고, 각 항목당 1-2줄로 간단히 작성해주세요.
@location: 태그는 시스템 내부용이므로 반드시 포함해야 하지만, 사용자에게는 보이지 않습니다.
위치 정보는 반드시 @location:[위도,경도] 형식으로 입력해주세요.
오타가나는부분은 너가 알아서 고쳐서 답변해줘.
`;

const DEFAULT_RESPONSE = `죄송합니다. 저는 축제 여행 계획을 추천해드리는 AI 어시스턴트입니다.
다음과 같은 형식으로 질문해 주세요:

예시 1) "서울 벚꽃축제 추천해줘"
예시 2) "4월에 열리는 부산 축제 알려줘"
예시 3) "제주도 서귀포시 축제 코스 알려줘"

축제명, 지역, 시기 등을 포함해서 질문해 주시면 더 정확한 답변을 드릴 수 있습니다.`;

// 서울시청 좌표
const SEOUL_CITY_HALL = {
  lat: 37.5666805,
  lng: 126.9784147,
};

// 숫자 마커 스타일
const NumberMarker = ({ number }) => (
  <div
    style={{
      backgroundColor: "#60a5fa",
      color: "white",
      padding: "6px 12px",
      borderRadius: "50%",
      fontSize: "16px",
      fontWeight: "bold",
      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "30px",
      height: "30px",
    }}
  >
    {number}
  </div>
);

// 축제 관련 키워드 체크 함수
const isFestivalRelatedQuery = (query) => {
  const festivalKeywords = [
    "축제",
    "페스티벌",
    "festival",
    "행사",
    "공연",
    "문화제",
    "박람회",
    "전시회",
    "카니발",
    "마켓",
    "이벤트",
    "여행",
    "여행코스",
    "여행계획",
    "여행계획추천",
    "여행계획추천",
    "추천",
    "코스",
    "계획",
  ];

  return festivalKeywords.some((keyword) =>
    query.toLowerCase().includes(keyword.toLowerCase())
  );
};

// 텍스트 스트리밍 시뮬레이션 함수 추가
const simulateTextStreaming = async (text, callback, speed = 20) => {
  let currentText = "";
  const characters = text.split("");

  for (const char of characters) {
    currentText += char;
    callback(currentText);
    await new Promise((resolve) => setTimeout(resolve, speed));
  }
  return currentText;
};

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        '안녕하세요! 축제 여행 계획을 도와드리겠습니다.\n예) "서울 벚꽃축제 추천해줘"\n궁금하신 축제나 지역을 말씀해주세요!',
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [currentStreamMessage, setCurrentStreamMessage] = useState("");
  const [travelInfo, setTravelInfo] = useState({
    festival: { name: "", period: "", location: "" },
    courses: [],
    transportation: { nearestStation: "", recommendedMode: "" },
  });
  const mapRef = useRef(null);
  const chatContainerRef = useRef(null);

  // 카카오맵 스크립트 동적 로드
  useEffect(() => {
    const loadKakaoMapScript = () => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.async = true;
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
          import.meta.env.VITE_KAKAO_MAP_API_KEY
        }&libraries=services,clusterer,drawing&autoload=false`;

        script.onload = () => {
          window.kakao.maps.load(() => {
            console.log("카카오맵 SDK 로드 완료");
            resolve();
          });
        };

        script.onerror = (error) => {
          console.error("카카오맵 SDK 로드 실패:", error);
          reject(error);
        };

        document.head.appendChild(script);
      });
    };

    const initializeMap = async () => {
      try {
        if (!window.kakao) {
          await loadKakaoMapScript();
        }

        const mapContainer = document.getElementById("kakao-map");
        if (!mapContainer) {
          console.error("지도를 표시할 div를 찾을 수 없습니다.");
          return;
        }

        console.log("지도 초기화 시작");
        const options = {
          center: new window.kakao.maps.LatLng(37.5666805, 126.9784147),
          level: 3,
        };

        const map = new window.kakao.maps.Map(mapContainer, options);
        mapRef.current = map;
        console.log("지도 초기화 완료");

        // 지도 로드 확인을 위한 이벤트 리스너
        window.kakao.maps.event.addListener(map, "tilesloaded", () => {
          console.log("지도 타일 로드 완료");
        });
      } catch (error) {
        console.error("지도 초기화 중 오류 발생:", error);
      }
    };

    initializeMap();
  }, []);

  // 스크롤 자동 조정
  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollToBottom = () => {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      };

      // 부드러운 스크롤 효과를 위해 setTimeout 사용
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, currentStreamMessage]);

  // 지도 마커 업데이트
  useEffect(() => {
    try {
      const map = mapRef.current;
      if (!map || !window.kakao || locations.length === 0) return;

      console.log("마커 업데이트 시작 - locations:", locations);

      // 기존 마커들 제거
      if (map._overlays) {
        map._overlays.forEach((overlay) => {
          if (overlay) overlay.setMap(null);
        });
      }
      map._overlays = [];

      // 지도 범위 객체 생성
      const bounds = new window.kakao.maps.LatLngBounds();

      // 각 위치에 마커 생성
      locations.forEach((loc, index) => {
        const position = new window.kakao.maps.LatLng(loc.lat, loc.lng);

        // 커스텀 오버레이 생성
        const content = document.createElement("div");
        content.className = "number-marker";
        content.style.cssText = `
          width: 30px;
          height: 30px;
          background-color: #60a5fa;
          color: white;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        `;
        content.innerHTML = index === 0 ? "S" : index.toString();

        const customOverlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: content,
          yAnchor: 1,
        });

        customOverlay.setMap(map);
        map._overlays.push(customOverlay);
        bounds.extend(position);
      });

      // 지도 범위 재설정
      if (locations.length > 0) {
        map.setBounds(bounds);
      }
    } catch (error) {
      console.error("마커 생성 중 오류:", error);
    }
  }, [locations]);

  const processResponse = (response) => {
    console.log("원본 응답:", response);

    const newLocations = [];
    let cleanResponse = response;

    try {
      // 위치 정보 추출을 위한 정규식 (쉼표 주변의 공백을 허용)
      const regex = /@location:\s*\[(\d+\.\d+)\s*,\s*(\d+\.\d+)\]/g;
      console.log("사용중인 정규식 패턴:", regex.source);
      let match;

      while ((match = regex.exec(response)) !== null) {
        console.log("정규식 매치 결과:", match);
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        console.log("파싱된 좌표:", { lat, lng });

        if (!isNaN(lat) && !isNaN(lng)) {
          newLocations.push({ lat, lng });
          console.log(`위치 ${newLocations.length} 추가됨:`, { lat, lng });
        }
      }

      console.log("추출된 모든 위치:", newLocations);

      if (newLocations.length > 0) {
        console.log("locations 상태 업데이트:", newLocations);

        // 약간의 딜레이 후 마커 표시 (애니메이션 효과)
        setTimeout(() => {
          setLocations(newLocations);
        }, 500);

        // 여행 정보 추출 및 업데이트
        const festivalInfo = {
          name: response.match(/축제명:\s*(.+)$/m)?.[1] || "",
          period: response.match(/기간:\s*(.+)$/m)?.[1] || "",
          location: response.match(/장소:\s*(.+)$/m)?.[1] || "",
        };

        const courses = [];
        const courseRegex = /\d+\.\s*(\d{2}:\d{2})\s*-\s*([^\n@]+)/g;
        let courseMatch;
        while ((courseMatch = courseRegex.exec(response)) !== null) {
          courses.push({
            time: courseMatch[1],
            activity: courseMatch[2].trim(),
          });
        }

        const transportation = {
          nearestStation: response.match(/가장 가까운 역:\s*(.+)$/m)?.[1] || "",
          recommendedMode: response.match(/추천 이동수단:\s*(.+)$/m)?.[1] || "",
        };

        // 약간의 딜레이 후 여행 정보 업데이트 (애니메이션 효과)
        setTimeout(() => {
          setTravelInfo({
            festival: festivalInfo,
            courses: courses,
            transportation: transportation,
          });
        }, 300);
      } else {
        console.log("추출된 위치 없음");
      }

      // 위치 정보 텍스트 제거
      cleanResponse = response.replace(
        /@location:\s*\[\d+\.\d+\s*,\s*\d+\.\d+\]/g,
        ""
      );
    } catch (error) {
      console.error("위치 정보 처리 중 오류:", error);
    }

    return cleanResponse.trim();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);
    setCurrentStreamMessage("");

    if (!isFestivalRelatedQuery(inputMessage)) {
      try {
        await simulateTextStreaming(DEFAULT_RESPONSE, (text) => {
          setCurrentStreamMessage(text);
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: DEFAULT_RESPONSE,
          },
        ]);
        setCurrentStreamMessage("");
      } catch (error) {
        console.error("Error in default response streaming:", error);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: ASSISTANT_INSTRUCTIONS,
          },
          ...messages,
          userMessage,
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
        stream: true,
      });

      let fullResponse = "";
      let displayResponse = "";

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullResponse += content;

        // 실시간으로 location 정보를 제거한 응답 표시
        displayResponse = fullResponse.replace(
          /@location:\s*\[\d+\.\d+\s*,\s*\d+\.\d+\]/g,
          ""
        );
        setCurrentStreamMessage(displayResponse.trim());
      }

      console.log("최종 응답:", fullResponse);

      // AI 응답이 완료된 후에 위치 정보 처리
      const processedResponse = processResponse(fullResponse);

      // 메시지 업데이트
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: processedResponse,
        },
      ]);
      setCurrentStreamMessage("");
    } catch (error) {
      console.error("OpenAI API 오류:", error);
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

  // 지도의 중심 좌표 계산
  const getMapCenter = () => {
    if (locations.length === 0) return SEOUL_CITY_HALL;
    const center = locations.reduce(
      (acc, cur) => ({
        lat: acc.lat + cur.lat / locations.length,
        lng: acc.lng + cur.lng / locations.length,
      }),
      { lat: 0, lng: 0 }
    );
    return center;
  };

  // 지도의 확대 레벨 계산
  const getMapLevel = () => {
    if (locations.length <= 1) return 3;
    return 7; // 여러 위치가 있을 때는 더 넓은 영역을 보여줌
  };

  return (
    <>
      <AItitle currentPage="AI 여행코스 추천" />
      <div className="ai-chatbot-container">
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
                </div>
              ))}
              {currentStreamMessage && (
                <div className="message assistant">
                  <div className="message-content">
                    {currentStreamMessage.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
              {loading && !currentStreamMessage && (
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
                disabled={loading}
              />
              <button onClick={handleSendMessage} disabled={loading}>
                전송
              </button>
            </div>
          </div>

          <div className="map-section">
            <div
              id="kakao-map"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "8px",
              }}
            />
          </div>
        </div>

        {/* 여행 정보 요약 섹션 */}
        {travelInfo.festival.name && (
          <div className="travel-summary">
            <div className="travel-info-grid">
              <div className="festival-info">
                <h3>축제 정보</h3>
                <p>
                  <strong>축제명:</strong> {travelInfo.festival.name}
                </p>
                <p>
                  <strong>기간:</strong> {travelInfo.festival.period}
                </p>
                <p>
                  <strong>장소:</strong> {travelInfo.festival.location}
                </p>
              </div>

              <div className="course-timeline">
                <h3>추천 코스</h3>
                {travelInfo.courses.map((course, index) => (
                  <div key={index} className="course-item">
                    <div className="course-number">{index + 1}</div>
                    <div className="course-content">
                      <div className="course-time">{course.time}</div>
                      <div className="course-activity">{course.activity}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="transportation-info">
                <h3>교통 안내</h3>
                <p>
                  <strong>가장 가까운 역:</strong>{" "}
                  {travelInfo.transportation.nearestStation}
                </p>
                <p>
                  <strong>추천 이동수단:</strong>{" "}
                  {travelInfo.transportation.recommendedMode}
                </p>
              </div>
            </div>

            {/* 저장/공유 버튼 */}
            <div className="action-buttons">
              <button
                className="action-btn save-btn"
                onClick={() => {
                  // HTML to PDF 변환을 위한 준비
                  const content =
                    document.querySelector(".travel-summary").innerHTML;
                  const printWindow = window.open(
                    "",
                    "",
                    "height=600,width=800"
                  );
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>${travelInfo.festival.name} 여행 계획</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 20px; }
                          h3 { color: #333; border-bottom: 2px solid #60a5fa; padding-bottom: 10px; }
                          .course-item { margin: 20px 0; }
                          .transportation-info { background: #f8f9fa; padding: 15px; border-radius: 8px; }
                        </style>
                      </head>
                      <body>
                        ${content}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                  printWindow.close();
                }}
              >
                저장
              </button>
              <button
                className="action-btn share-btn"
                onClick={() => {
                  const shareText = `
${travelInfo.festival.name} 여행 계획

[축제 정보]
- 축제명: ${travelInfo.festival.name}
- 기간: ${travelInfo.festival.period}
- 장소: ${travelInfo.festival.location}

[추천 코스]
${travelInfo.courses
  .map((course, index) => `${index + 1}. ${course.time} - ${course.activity}`)
  .join("\n")}

[교통 안내]
- 가장 가까운 역: ${travelInfo.transportation.nearestStation}
- 추천 이동수단: ${travelInfo.transportation.recommendedMode}
                  `.trim();

                  if (navigator.share) {
                    navigator
                      .share({
                        title: `${travelInfo.festival.name} 여행 계획`,
                        text: shareText,
                      })
                      .catch(console.error);
                  } else {
                    navigator.clipboard
                      .writeText(shareText)
                      .then(() =>
                        alert("여행 계획이 클립보드에 복사되었습니다!")
                      )
                      .catch(console.error);
                  }
                }}
              >
                공유
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AIChatbot;
