import React, { useState, useEffect, useRef } from "react";
import "./AIChatbot.css";
import AItitle from "./AItitle";

// 백엔드 API 기본 URL
const API_BASE_URL = "http://localhost:8080/api";

// 백엔드 API 호출 함수
const aiAPI = {
  async generateResponse(
    message,
    region = null,
    history = [],
    festivalData = null,
    nearbySpots = []
  ) {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        region,
        history,
        festivalData,
        nearbySpots,
      }),
    });
    if (!response.ok) throw new Error("AI 서비스 오류가 발생했습니다.");
    return response.json();
  },
};

const DEFAULT_RESPONSE = `안녕하세요! 한국 여행 전문 AI 어시스턴트입니다.

여행하고 싶은 지역과 기간을 말씀해주시면 맞춤형 여행코스를 추천해드릴게요!`;

// 두 지점 간의 거리 계산 함수 (Haversine 공식)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // 지구의 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// nearbySpots에서 가장 가까운 관광지 찾기 함수
const findNearestSpot = (lat, lng, spots) => {
  if (!spots || spots.length === 0) return null;

  let minDistance = Infinity;
  let nearestSpot = null;

  spots.forEach((spot) => {
    if (spot.mapx && spot.mapy) {
      const distance = calculateDistance(
        lat,
        lng,
        parseFloat(spot.mapy),
        parseFloat(spot.mapx)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestSpot = spot;
      }
    }
  });

  console.log(
    `🎯 가장 가까운 관광지: ${nearestSpot?.title} (거리: ${minDistance.toFixed(
      2
    )}km)`
  );
  return nearestSpot;
};

// 응답 처리 함수 (nearbySpots 활용)
const processResponse = (response, availableSpots = []) => {
  console.log("원본 응답:", response);
  console.log("활용 가능한 관광지:", availableSpots.length + "개");

  const newLocations = [];
  let cleanResponse = response;

  try {
    // 위치 정보와 day 정보 추출
    const regex = /@location:\s*\[(\d+\.\d+)\s*,\s*(\d+\.\d+)\]\s*@day:(\d+)/g;
    let match;
    let spotIndex = 0; // nearbySpots 인덱스

    while ((match = regex.exec(response)) !== null) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      const day = parseInt(match[3]);

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(day) && day > 0 && day <= 10) {
        let placeName = "";
        let timeInfo = "";

        // 방법 1: 좌표와 가장 가까운 실제 관광지 찾기
        const nearestSpot = findNearestSpot(lat, lng, availableSpots);
        if (nearestSpot) {
          placeName = nearestSpot.title;
          console.log(`✅ 관광지 매칭: ${placeName}`);
        }
        // 방법 2: 순서대로 nearbySpots 사용 (fallback)
        else if (spotIndex < availableSpots.length) {
          placeName = availableSpots[spotIndex].title;
          console.log(`✅ 순서 매칭: ${placeName}`);
          spotIndex++;
        }
        // 방법 3: 기본값 (최후의 수단)
        else {
          placeName = `Day ${day} 코스 ${
            newLocations.filter((loc) => loc.day === day).length + 1
          }`;
          console.log(`⚠️ 기본값 사용: ${placeName}`);
        }

        // AI 응답에서 시간 정보 추출 시도
        const beforeLocation = response.substring(0, match.index);
        const lines = beforeLocation.split("\n");

        for (
          let i = lines.length - 1;
          i >= Math.max(0, lines.length - 3);
          i--
        ) {
          const line = lines[i]?.trim() || "";
          const timeMatch = line.match(/\*\*([^*]*(?:오전|오후)[^*]*)\*\*/);
          if (timeMatch) {
            timeInfo = timeMatch[1].trim();
            console.log(`✅ 시간 추출: ${timeInfo}`);
            break;
          }
        }

        // 기본 시간 설정
        if (!timeInfo) {
          const courseIndex =
            newLocations.filter((loc) => loc.day === day).length + 1;
          if (courseIndex === 1) timeInfo = "오전 09:00";
          else if (courseIndex === 2) timeInfo = "오후 12:00";
          else if (courseIndex === 3) timeInfo = "오후 15:00";
          else timeInfo = `코스 ${courseIndex}`;
        }

        newLocations.push({
          lat,
          lng,
          name: placeName,
          day: day,
          time: timeInfo,
        });

        console.log(
          `📍 최종 위치 추가: ${placeName} (Day ${day}, ${timeInfo})`
        );
      }
    }

    // 위치 정보 텍스트 제거
    cleanResponse = response
      .replace(/@location:\s*\[\d+\.\d+\s*,\s*\d+\.\d+\]\s*@day:\d+/g, "")
      .replace(/위치정보:\s*/g, "")
      .trim();
  } catch (error) {
    console.error("위치 정보 처리 중 오류:", error);
  }

  console.log("🎯 최종 추출된 위치들:", newLocations);
  return { locations: newLocations, cleanResponse };
};

// Day별 색상 정의
const DAY_COLORS = {
  1: "#FF6B6B", // 빨강
  2: "#4ECDC4", // 청록
  3: "#45B7D1", // 파랑
  4: "#FFA07A", // 주황
  5: "#98D8C8", // 민트
  6: "#F7DC6F", // 노랑
  7: "#BB8FCE", // 보라
  8: "#85C1E9", // 하늘
  9: "#F8C471", // 골드
  10: "#82E0AA", // 연두
};

// Day별 색상 가져오기 함수
const getDayColor = (day) => {
  return DAY_COLORS[day] || "#FF6B6B";
};

// 마커 HTML 생성 함수
const createMarkerContent = (day, index) => {
  const color = DAY_COLORS[day] || "#FF6B6B";
  return `
    <div style="
      background-color: ${color};
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      D${day}
    </div>
  `;
};

// React 컴포넌트
const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: DEFAULT_RESPONSE,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [currentStreamMessage, setCurrentStreamMessage] = useState("");
  const [nearbySpots, setNearbySpots] = useState([]);
  const [travelInfo, setTravelInfo] = useState({
    festival: {
      name: "",
      period: "",
      location: "",
      image: "",
      overview: "",
      tel: "",
      homepage: "",
    },
    courses: [],
    transportation: { nearestStation: "", recommendedMode: "" },
  });

  const mapRef = useRef(null);
  const chatContainerRef = useRef(null);

  // 카카오맵 초기화
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const mapContainer = document.getElementById("kakao-map");
        if (!mapContainer) {
          console.error("지도 컨테이너를 찾을 수 없습니다.");
          return;
        }

        // 카카오맵 SDK 로딩
        if (!window.kakao || !window.kakao.maps) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.async = true;
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
              import.meta.env.VITE_KAKAO_MAP_API_KEY
            }&autoload=false`;
            script.onload = () => {
              window.kakao.maps.load(resolve);
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const options = {
          center: new window.kakao.maps.LatLng(37.5666805, 126.9784147),
          level: 3,
        };

        const map = new window.kakao.maps.Map(mapContainer, options);
        mapRef.current = map;
        console.log("지도 초기화 완료");
      } catch (error) {
        console.error("지도 초기화 중 오류 발생:", error);
      }
    };

    initializeMap();
  }, []);

  // 마커 표시
  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    const map = mapRef.current;

    // 기존 마커 및 폴리라인 제거
    if (map._markers) {
      map._markers.forEach((marker) => marker.setMap(null));
    }
    if (map._polylines) {
      map._polylines.forEach((polyline) => polyline.setMap(null));
    }
    map._markers = [];
    map._polylines = [];

    const bounds = new window.kakao.maps.LatLngBounds();

    // Day별로 그룹화
    const dayGroups = {};
    locations.forEach((location) => {
      if (!dayGroups[location.day]) {
        dayGroups[location.day] = [];
      }
      dayGroups[location.day].push(location);
    });

    // 각 Day별로 마커 생성 및 연결선 그리기
    Object.keys(dayGroups).forEach((day) => {
      const dayLocations = dayGroups[day];
      const dayColor = DAY_COLORS[parseInt(day)] || "#FF6B6B";
      const polylinePath = [];

      dayLocations.forEach((location, index) => {
        const markerPosition = new window.kakao.maps.LatLng(
          location.latitude || location.lat,
          location.longitude || location.lng
        );

        // 커스텀 오버레이로 마커 생성
        const customOverlay = new window.kakao.maps.CustomOverlay({
          position: markerPosition,
          content: createMarkerContent(location.day, index + 1),
          yAnchor: 1,
        });

        customOverlay.setMap(map);
        map._markers.push(customOverlay);

        // 장소명 라벨 추가 (마커 위에)
        const labelPosition = new window.kakao.maps.LatLng(
          (location.latitude || location.lat) + 0.001, // 마커보다 약간 위에 위치
          location.longitude || location.lng
        );

        const labelOverlay = new window.kakao.maps.CustomOverlay({
          position: labelPosition,
          content: `<div style="
            background: rgba(255,255,255,0.95);
            border: 1px solid ${dayColor};
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: bold;
            color: #333;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            text-align: center;
            white-space: nowrap;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${location.name}</div>`,
          yAnchor: 1,
        });

        labelOverlay.setMap(map);
        map._markers.push(labelOverlay);
        bounds.extend(markerPosition);

        // 폴리라인 경로에 추가
        polylinePath.push(markerPosition);

        // 인포윈도우 - 장소명 중심으로 표기
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:10px;font-size:13px;max-width:250px;text-align:center;">
            <div style="color:${dayColor};font-weight:bold;margin-bottom:5px;">Day ${location.day}</div>
            <div style="color:#333;font-weight:600;font-size:14px;">${location.name}</div>
          </div>`,
        });

        // 클릭 이벤트 - 카카오맵 API 방식으로 수정
        window.kakao.maps.event.addListener(customOverlay, "click", () => {
          // 기존 인포윈도우 모두 닫기
          if (map._currentInfoWindow) {
            map._currentInfoWindow.close();
          }
          infowindow.open(map, customOverlay);
          map._currentInfoWindow = infowindow;
        });
      });

      // 같은 Day끼리 연결선 그리기
      if (polylinePath.length > 1) {
        const polyline = new window.kakao.maps.Polyline({
          path: polylinePath,
          strokeWeight: 3,
          strokeColor: dayColor,
          strokeOpacity: 0.8,
          strokeStyle: "solid",
        });

        polyline.setMap(map);
        map._polylines.push(polyline);

        // 각 선분마다 거리 표기 추가
        for (let i = 0; i < polylinePath.length - 1; i++) {
          const startPos = polylinePath[i];
          const endPos = polylinePath[i + 1];

          // 거리 계산 (km)
          const distance = calculateDistance(
            startPos.getLat(),
            startPos.getLng(),
            endPos.getLat(),
            endPos.getLng()
          );

          // 선분 중간 지점 계산
          const midLat = (startPos.getLat() + endPos.getLat()) / 2;
          const midLng = (startPos.getLng() + endPos.getLng()) / 2;
          const midPosition = new window.kakao.maps.LatLng(midLat, midLng);

          // 거리 라벨 표시
          const distanceOverlay = new window.kakao.maps.CustomOverlay({
            position: midPosition,
            content: `<div style="
              background: ${dayColor};
              color: white;
              border-radius: 12px;
              padding: 3px 8px;
              font-size: 10px;
              font-weight: bold;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              text-align: center;
              white-space: nowrap;
            ">${distance.toFixed(1)}km</div>`,
            yAnchor: 0.5,
          });

          distanceOverlay.setMap(map);
          map._markers.push(distanceOverlay);
        }
      }
    });

    // 지도 범위 조정
    if (locations.length > 0) {
      map.setBounds(bounds);
    }
  }, [locations]);

  // 스크롤 자동 조정
  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollToBottom = () => {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      };
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, currentStreamMessage]);

  // 🎯 완전히 새로워진 메시지 전송 처리 - 백엔드 중심
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputMessage("");
    setLoading(true);
    setCurrentStreamMessage("");

    try {
      console.log("🚀 새로운 AI 시스템 시작:", userMessage);

      // 🎯 백엔드에 원본 메시지만 전달 - 모든 분석을 백엔드가 처리
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ 새로운 백엔드 응답 수신:", data);

      const content = data.content || "죄송합니다. 응답을 생성할 수 없습니다.";

      // @location과 @day 태그를 제거한 깔끔한 텍스트 생성
      const cleanContent = content
        .replace(/@location:\s*\[\d+\.\d+\s*,\s*\d+\.\d+\]\s*@day:\d+/g, "")
        .replace(/위치정보:\s*/g, "")
        .trim();

      // 스트리밍 시뮬레이션
      let displayedResponse = "";
      const chunks = cleanContent.match(/.{1,50}/g) || [cleanContent];

      for (const chunk of chunks) {
        displayedResponse += chunk;
        setCurrentStreamMessage(displayedResponse);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: cleanContent,
        },
      ]);

      setCurrentStreamMessage("");

      // 🗺️ 카카오맵 위치 설정 (백엔드 locations 사용)
      if (data.locations && data.locations.length > 0) {
        console.log("📍 카카오맵 위치 설정:", data.locations.length, "개");
        setTimeout(() => {
          setLocations(data.locations);
        }, 500);
      } else {
        setLocations([]);
      }

      // 🎯 새로운 여행 정보 구조 처리
      setTravelInfo({
        requestType: data.requestType,
        festivals: data.festivals || [],
        travelCourse: data.travelCourse,
        mainSpot: data.travelCourse
          ? {
              name: data.travelCourse.courseTitle || "AI 추천 여행",
              location: "사용자 요청 지역",
              overview: "AI가 생성한 맞춤 여행 정보입니다.",
            }
          : null,
        courses: data.locations || [],
        transportation: {
          nearestStation: "대중교통 이용 가능",
          recommendedMode: "AI 최적 경로 분석 완료",
        },
      });

      console.log("✅ 새로운 AI 시스템 완료 - 타입:", data.requestType);
    } catch (error) {
      console.error("❌ 메시지 전송 오류:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `죄송합니다. ${
            error.message || "응답 생성 중 오류가 발생했습니다."
          } 다시 시도해주세요.`,
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

  // AI 응답 텍스트 처리 함수 (동일한 폰트 스타일)
  const formatAIResponse = (content) => {
    if (!content) return [];

    return content.split("\n").map((line, index) => {
      // 빈 줄 처리
      if (!line.trim()) {
        return <br key={index} />;
      }

      // 모든 텍스트를 동일한 스타일로 표시
      return (
        <p
          key={index}
          style={{
            margin: "6px 0",
            lineHeight: "1.6",
            color: "#333",
            fontSize: "14px",
          }}
        >
          {line.replace(/\*\*/g, "")} {/* ** 제거 */}
        </p>
      );
    });
  };

  //Day별 타임라인 렌더링 함수
  const renderDayTimeline = (day, dayLocations) => {
    return (
      <div key={`day-${day}`} style={{ marginBottom: "30px" }}>
        <h4
          style={{
            color: getDayColor(day),
            borderBottom: `2px solid ${getDayColor(day)}`,
            paddingBottom: "10px",
            marginBottom: "15px",
          }}
        >
          Day {day}
        </h4>
        {dayLocations.map((location, index) => (
          <div
            key={`${day}-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                background: getDayColor(day),
                color: "white",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
                marginRight: "10px",
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                {location.name}
              </div>
              {location.time && (
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  {location.time}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <AItitle currentPage="AI 여행코스 추천" showLocation={true} />
      <div className="ai-chatbot-container">
        <div className="ai-chatbot-chat-map-container">
          <div className="ai-chatbot-chat-section">
            <div className="ai-chatbot-chat-messages" ref={chatContainerRef}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`ai-chatbot-message ${
                    message.role === "user" ? "user" : "assistant"
                  }`}
                >
                  <div className="ai-chatbot-message-content">
                    {message.role === "assistant"
                      ? formatAIResponse(message.content)
                      : message.content
                          .split("\n")
                          .map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                </div>
              ))}
              {currentStreamMessage && (
                <div className="ai-chatbot-message assistant">
                  <div className="ai-chatbot-message-content">
                    {formatAIResponse(currentStreamMessage)}
                  </div>
                </div>
              )}
              {loading && !currentStreamMessage && (
                <div className="ai-chatbot-message assistant">
                  <div className="ai-chatbot-message-content loading">
                    여행 계획을 생성하는중...
                  </div>
                </div>
              )}
            </div>

            <div className="ai-chatbot-chat-input">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="여행 계획을 입력해주세요..."
                disabled={loading}
              />
              <button onClick={handleSendMessage} disabled={loading}>
                전송
              </button>
            </div>
          </div>

          <div className="ai-chatbot-map-section">
            <div
              id="kakao-map"
              className="ai-chatbot-kakao-map"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "8px",
              }}
            />
          </div>
        </div>

        {/* 🎯 새로운 여행 정보 요약 섹션 - requestType에 따른 조건부 표시 */}
        {!loading &&
          !currentStreamMessage &&
          travelInfo.requestType &&
          travelInfo.requestType !== "general_chat" && (
            <div className="ai-chatbot-travel-summary">
              <div className="ai-chatbot-travel-info-grid">
                {/* 🎪 축제 정보 섹션 - festival_only 또는 festival_with_travel일 때만 표시 */}
                {(travelInfo.requestType === "festival_only" ||
                  travelInfo.requestType === "festival_with_travel") &&
                  travelInfo.festivals &&
                  travelInfo.festivals.length > 0 && (
                    <div className="ai-chatbot-festival-info">
                      <h3>🎪 축제 정보</h3>
                      {travelInfo.festivals.map((festival, index) => (
                        <div
                          key={index}
                          className="ai-chatbot-festival-card"
                          style={{ marginBottom: "20px" }}
                        >
                          {festival.image && (
                            <div className="ai-chatbot-festival-image-container">
                              <img
                                src={festival.image}
                                alt={festival.name}
                                style={{
                                  width: "100%",
                                  height: "200px",
                                  objectFit: "cover",
                                  borderRadius: "8px 8px 0 0",
                                }}
                                onError={(e) => {
                                  e.target.parentElement.style.display = "none";
                                }}
                              />
                            </div>
                          )}
                          <div style={{ padding: "20px" }}>
                            <h4
                              style={{
                                margin: "0 0 10px 0",
                                fontSize: "18px",
                                color: "#1e40af",
                              }}
                            >
                              {festival.name}
                            </h4>
                            <p style={{ margin: "5px 0", color: "#64748b" }}>
                              <strong style={{ color: "#374151" }}>
                                📅 기간:
                              </strong>{" "}
                              {festival.period}
                            </p>
                            <p style={{ margin: "5px 0", color: "#64748b" }}>
                              <strong style={{ color: "#374151" }}>
                                📍 장소:
                              </strong>{" "}
                              {festival.location}
                            </p>
                            {festival.tel && festival.tel !== "정보 없음" && (
                              <p style={{ margin: "5px 0", color: "#64748b" }}>
                                <strong style={{ color: "#374151" }}>
                                  📞 연락처:
                                </strong>{" "}
                                {festival.tel}
                              </p>
                            )}
                            {festival.description && (
                              <p
                                style={{
                                  margin: "10px 0 0 0",
                                  lineHeight: "1.6",
                                  color: "#4b5563",
                                  fontSize: "14px",
                                }}
                              >
                                {festival.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {/* 🗺️ 추천 코스 정보 - festival_with_travel 또는 travel_only일 때만 표시 */}
                {(travelInfo.requestType === "festival_with_travel" ||
                  travelInfo.requestType === "travel_only") &&
                  travelInfo.travelCourse && (
                    <div className="ai-chatbot-course-info">
                      <h3>🗺️ 추천 코스</h3>
                      <div className="ai-chatbot-course-content">
                        <h4 style={{ color: "#1e40af", marginBottom: "15px" }}>
                          {travelInfo.travelCourse.courseTitle}
                        </h4>
                        <p style={{ color: "#64748b", marginBottom: "20px" }}>
                          총 {travelInfo.travelCourse.totalDays}일 코스
                        </p>

                        {travelInfo.travelCourse.dailySchedule.map(
                          (daySchedule) => (
                            <div
                              key={daySchedule.day}
                              style={{ marginBottom: "25px" }}
                            >
                              <h5
                                style={{
                                  color: getDayColor(daySchedule.day),
                                  fontWeight: "bold",
                                  fontSize: "16px",
                                  marginBottom: "10px",
                                  borderBottom: `2px solid ${getDayColor(
                                    daySchedule.day
                                  )}`,
                                  paddingBottom: "5px",
                                }}
                              >
                                Day {daySchedule.day} - {daySchedule.theme}
                              </h5>

                              <ul
                                style={{ marginLeft: "0", paddingLeft: "16px" }}
                              >
                                {daySchedule.places.map((place, index) => (
                                  <li
                                    key={index}
                                    style={{ marginBottom: "10px" }}
                                  >
                                    <span
                                      style={{
                                        color: getDayColor(daySchedule.day),
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {index + 1}.
                                    </span>{" "}
                                    <strong style={{ color: "#374151" }}>
                                      {place.visitTime}
                                    </strong>{" "}
                                    - {place.name}
                                    {place.description &&
                                      place.description !== place.visitTime && (
                                        <p
                                          style={{
                                            marginLeft: "20px",
                                            fontSize: "12px",
                                            color: "#64748b",
                                            marginTop: "2px",
                                          }}
                                        >
                                          {place.description}
                                        </p>
                                      )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* 🚗 교통 안내 - 여행코스가 있을 때만 표시 */}
                {travelInfo.travelCourse && travelInfo.transportation && (
                  <div className="ai-chatbot-transportation-info">
                    <h3>🚗 교통 안내</h3>
                    {travelInfo.transportation.nearestStation && (
                      <p>
                        <strong>가장 가까운 역:</strong>{" "}
                        {travelInfo.transportation.nearestStation}
                      </p>
                    )}
                    {travelInfo.transportation.recommendedMode && (
                      <p>
                        <strong>추천 이동수단:</strong>{" "}
                        {travelInfo.transportation.recommendedMode}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 저장/공유 버튼 */}
              <div className="ai-chatbot-button-group">
                <button
                  className="ai-chatbot-action-btn"
                  onClick={() => {
                    alert("여행 계획이 저장되었습니다!");
                  }}
                >
                  저장하기
                </button>
                <button
                  className="ai-chatbot-action-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      messages[messages.length - 1]?.content || ""
                    );
                    alert("여행 계획이 클립보드에 복사되었습니다!");
                  }}
                >
                  공유하기
                </button>
              </div>
            </div>
          )}
      </div>
    </>
  );
};

export default AIChatbot;
