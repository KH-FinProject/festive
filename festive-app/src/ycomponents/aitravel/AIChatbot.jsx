import React, { useState, useEffect, useRef } from "react";
import "./AIChatbot.css";
import AItitle from "./AItitle";

// 백엔드 API 기본 URL
const API_BASE_URL = "http://localhost:8080/api";

// 백엔드 API 호출 함수들
const aiAPI = {
  async generateResponse(message, region = null, history = []) {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, region, history }),
    });
    if (!response.ok) throw new Error("AI 서비스 오류가 발생했습니다.");
    return response.json();
  },
  // TourAPI 관련 메서드 제거 - 프론트엔드에서 직접 처리
};

const ASSISTANT_INSTRUCTIONS = `
한국 여행 전문 AI - 실시간 맞춤 추천

**🎯 핵심 임무:**
- 모든 질문에 대해 반드시 여행 코스 추천
- 기본은 당일치기, 사용자가 몇박몇일 명시하면 day별 구분
- Tour API 데이터와 실제 관광지 정보 우선 활용

**🚨 절대 필수 답변 형식:**

**당일/1일 여행의 경우:**
[지역 소개] (2줄)
[추천 코스]
1. **오전 09:00** - 장소명
   @location:[37.1234,127.5678] @day:1
   포인트: 특별한 매력

**몇박몇일 여행의 경우:**
[지역 소개] (2줄)
[Day 1 코스]
1. **오전 09:00** - 장소명
   @location:[37.1234,127.5678] @day:1
   포인트: 특별한 매력

[Day 2 코스]
1. **오전 09:00** - 장소명
   @location:[37.3456,127.7890] @day:2
   포인트: 특별한 매력

**절대 규칙:**
- Day별 헤더 필수: [Day 1 코스], [Day 2 코스] 형식
- @location:[위도,경도] @day:숫자 형식을 모든 장소에 반드시 포함
- 각 Day마다 최소 3개 코스 추천
- 이모지 사용 금지
- 절대로 중간에 끝내지 말고 요청된 모든 날짜의 일정을 완성
`;

const DEFAULT_RESPONSE = `안녕하세요! 한국 여행 전문 AI 어시스턴트입니다.

**이런 질문을 해주세요:**
- "전주 1박2일 여행코스 추천해줘"  
- "경남 벚꽃축제 알려줘"
- "제주도 당일치기 코스 짜줘"
- "서울 겨울축제 추천"

**지역 + 여행기간**을 함께 말씀해주시면 더 정확한 코스를 추천드릴게요!`;

// 서울시청 좌표
const SEOUL_CITY_HALL = { lat: 37.5666805, lng: 126.9784147 };

// 응답 처리 함수
const processResponse = (response) => {
  console.log("원본 응답:", response);

  const newLocations = [];
  let cleanResponse = response;

  try {
    // 위치 정보와 day 정보 추출
    const regex = /@location:\s*\[(\d+\.\d+)\s*,\s*(\d+\.\d+)\]\s*@day:(\d+)/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      const day = parseInt(match[3]);

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(day) && day > 0 && day <= 10) {
        const beforeLocation = response.substring(0, match.index);
        const lines = beforeLocation.split("\n");
        let placeName = `Day ${day} 코스 ${
          newLocations.filter((loc) => loc.day === day).length + 1
        }`;
        let timeInfo = "";

        // 개선된 장소명 및 시간 추출 로직
        for (
          let i = lines.length - 1;
          i >= Math.max(0, lines.length - 5);
          i--
        ) {
          const line = lines[i]?.trim() || "";

          if (
            line &&
            !line.includes("@location") &&
            !line.includes("위치정보:")
          ) {
            // 패턴 1: "1. **오전 09:00** - 경복궁" 형태 (가장 정확)
            const timePattern = line.match(
              /^\d+\.\s*\*\*([^*]+)\*\*\s*[-–]\s*(.+?)$/
            );
            if (timePattern) {
              const timeStr = timePattern[1].trim(); // 시간 정보
              let extractedName = timePattern[2].trim(); // 장소명

              // 시간 정보 저장
              timeInfo = timeStr;

              // 괄호나 기타 설명 제거
              extractedName = extractedName.replace(/\([^)]*\)/g, "").trim();
              extractedName = extractedName.replace(/[()@]/g, "").trim();

              // 첫 번째 단어만 사용 (장소명)
              const firstWord = extractedName.split(/[,\s]+/)[0];

              if (firstWord && firstWord.length > 0 && firstWord.length <= 20) {
                placeName = firstWord;
                console.log(
                  `✅ 장소명 및 시간 추출 성공 (패턴1): "${placeName}" (${timeInfo}) from line: "${line}"`
                );
                break;
              }
            }

            // 패턴 2: "- 경복궁" 형태
            const dashPattern = line.match(/^[-–]\s*(.+?)$/);
            if (dashPattern) {
              let extractedName = dashPattern[1].trim();
              extractedName = extractedName.replace(/\([^)]*\)/g, "").trim();
              extractedName = extractedName.replace(/[()@]/g, "").trim();

              const firstWord = extractedName.split(/[,\s]+/)[0];

              if (firstWord && firstWord.length > 0 && firstWord.length <= 20) {
                placeName = firstWord;
                console.log(`✅ 장소명 추출 성공 (패턴2): "${placeName}"`);
                break;
              }
            }

            // 패턴 3: 전체 라인에서 장소명 찾기
            const cleanLine = line.replace(/[*\[\]]/g, "").trim();
            const words = cleanLine.split(/[\s,\-–]+/);

            for (const word of words) {
              const cleanWord = word.replace(/[()@*]/g, "").trim();
              if (
                cleanWord.length >= 2 &&
                cleanWord.length <= 15 &&
                !cleanWord.includes("location") &&
                !cleanWord.includes("day") &&
                !cleanWord.includes("Day") &&
                !cleanWord.includes("오전") &&
                !cleanWord.includes("오후") &&
                !cleanWord.includes("포인트") &&
                !cleanWord.match(/^\d+$/) &&
                !cleanWord.includes(":")
              ) {
                placeName = cleanWord;
                console.log(`✅ 장소명 추출 성공 (패턴3): "${placeName}"`);
                break;
              }
            }

            if (
              placeName !==
              `Day ${day} 코스 ${
                newLocations.filter((loc) => loc.day === day).length + 1
              }`
            ) {
              break;
            }
          }
        }

        newLocations.push({
          lat,
          lng,
          name: placeName,
          day: day,
          time:
            timeInfo ||
            `코스 ${newLocations.filter((loc) => loc.day === day).length + 1}`,
        });
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

// 축제 포스터 이미지 매핑 제거 - TourAPI firstimage 필드 직접 사용

// 모든 TourAPI 로직 제거 - 백엔드에서 처리

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
  // currentFestivalData, currentRegion 제거 - 백엔드에서 처리

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
          location.lat,
          location.lng
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
          location.lat + 0.001, // 마커보다 약간 위에 위치
          location.lng
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

  // 메시지 전송 처리 (완전 단순화 - 백엔드 전담)
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputMessage("");
    setLoading(true);
    setCurrentStreamMessage("");

    try {
      console.log("🚀 백엔드로 직접 전송:", userMessage);

      // 백엔드에서 모든 비즈니스 로직 처리 (지역추출 + TourAPI + OpenAI)
      const response = await aiAPI.generateResponse(userMessage);

      console.log("✅ 백엔드 응답 수신:", response);

      const content =
        response.content || "죄송합니다. 응답을 생성할 수 없습니다.";

      // 스트리밍 시뮬레이션
      let fullResponse = "";
      const chunks = content.match(/.{1,50}/g) || [content];

      for (const chunk of chunks) {
        fullResponse += chunk;
        const processed = processResponse(fullResponse);
        setCurrentStreamMessage(processed.cleanResponse);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // 최종 처리
      const finalProcessed = processResponse(fullResponse);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: finalProcessed.cleanResponse,
        },
      ]);

      setCurrentStreamMessage("");

      // 위치 설정
      if (finalProcessed.locations.length > 0) {
        setTimeout(() => {
          setLocations(finalProcessed.locations);
        }, 500);
      }

      // 축제 정보 설정 (백엔드에서 제공받은 데이터 사용 - 향후 구현)
      if (response.mainFestival) {
        const mainFestival = response.mainFestival;
        console.log("🎪 백엔드에서 받은 메인축제:", mainFestival);

        const festivalImage =
          mainFestival.firstimage ||
          mainFestival.image ||
          "https://picsum.photos/300/400?text=Festival";

        setTravelInfo({
          festival: {
            name: mainFestival.title || mainFestival.name || "축제 정보",
            period: mainFestival.eventstartdate
              ? `${mainFestival.eventstartdate.replace(
                  /(\d{4})(\d{2})(\d{2})/,
                  "$1.$2.$3"
                )} - ${
                  mainFestival.eventenddate
                    ? mainFestival.eventenddate.replace(
                        /(\d{4})(\d{2})(\d{2})/,
                        "$1.$2.$3"
                      )
                    : "종료일 미정"
                }`
              : "기간 미정",
            location:
              mainFestival.addr1 || mainFestival.location || "위치 미정",
            image: festivalImage,
            overview: mainFestival.overview || "축제에 대한 상세 정보입니다.",
            tel: mainFestival.tel || "연락처 정보 없음",
          },
          courses: finalProcessed.locations.map((loc, index) => {
            return {
              time: loc.time || `${index + 1}번째 코스`,
              activity: loc.name,
              day: loc.day,
            };
          }),
          transportation: {
            nearestStation: "대중교통 이용 가능",
            recommendedMode: "지역 내 대중교통 또는 자가용",
          },
        });
      } else {
        // 백엔드에서 축제 정보를 제공하지 않는 경우 기본 정보 설정
        console.log("ℹ️ 백엔드에서 축제 정보 미제공 - 기본 정보 사용");
        setTravelInfo({
          festival: {
            name: "AI 추천 여행",
            period: "여행 기간",
            location: "추천 지역",
            image: "https://picsum.photos/300/400?text=Travel",
            overview: "AI가 추천하는 맞춤 여행 코스입니다.",
            tel: "",
          },
          courses: finalProcessed.locations.map((loc, index) => {
            return {
              time: loc.time || `${index + 1}번째 코스`,
              activity: loc.name,
              day: loc.day,
            };
          }),
          transportation: {
            nearestStation: "대중교통 이용 가능",
            recommendedMode: "지역 내 대중교통 또는 자가용",
          },
        });
      }
    } catch (error) {
      console.error("❌ 메시지 전송 오류:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "죄송합니다. 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
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

  // AI 응답 텍스트 처리 함수 (마크다운 스타일)
  const formatAIResponse = (content) => {
    if (!content) return [];

    return content.split("\n").map((line, index) => {
      // 빈 줄 처리
      if (!line.trim()) {
        return <br key={index} />;
      }

      // 헤더 처리 ([지역 소개], [Day N 코스] 등)
      if (line.match(/^\[.*\]$/) || line.match(/^\*\*\[.*\]\*\*$/)) {
        const cleanLine = line.replace(/\*\*/g, ""); // ** 제거
        const isDaySection =
          cleanLine.includes("Day") && cleanLine.includes("코스");

        return (
          <h3
            key={index}
            style={{
              color: isDaySection ? "#dc2626" : "#2563eb", // Day 섹션은 빨간색
              fontWeight: "bold",
              margin: isDaySection ? "20px 0 12px 0" : "16px 0 8px 0",
              fontSize: isDaySection ? "18px" : "16px",
              borderBottom: isDaySection ? "2px solid #dc2626" : "none",
              paddingBottom: isDaySection ? "4px" : "0",
            }}
          >
            {cleanLine}
          </h3>
        );
      }

      // 번호 리스트 처리 (1. **시간** - 장소명)
      if (line.match(/^\d+\.\s*\*\*.*\*\*/)) {
        return (
          <div
            key={index}
            style={{
              margin: "8px 0",
              paddingLeft: "12px",
              borderLeft: "3px solid #60a5fa",
              backgroundColor: "#f8fafc",
            }}
          >
            <p
              style={{
                margin: "6px 0",
                lineHeight: "1.5",
              }}
            >
              {line.replace(
                /\*\*(.*?)\*\*/g,
                '<strong style="color: #1e40af;">$1</strong>'
              )}
            </p>
          </div>
        );
      }

      // 포인트 설명 처리
      if (line.trim().startsWith("포인트:")) {
        return (
          <p
            key={index}
            style={{
              margin: "4px 0 12px 12px",
              color: "#64748b",
              fontSize: "14px",
              fontStyle: "italic",
            }}
          >
            {line}
          </p>
        );
      }

      // 일반 텍스트
      return (
        <p
          key={index}
          style={{
            margin: "6px 0",
            lineHeight: "1.6",
          }}
        >
          {line}
        </p>
      );
    });
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

        {/* 여행 정보 요약 섹션 - AI 응답 완료 후에만 표시 */}
        {!loading &&
          !currentStreamMessage &&
          ((travelInfo.courses && travelInfo.courses.length > 0) ||
            (travelInfo.transportation &&
              (travelInfo.transportation.nearestStation ||
                travelInfo.transportation.recommendedMode)) ||
            (travelInfo.festival && travelInfo.festival.name)) && (
            <div className="ai-chatbot-travel-summary">
              <div className="ai-chatbot-travel-info-grid">
                {/* 메인 축제 정보 */}
                {travelInfo.festival && travelInfo.festival.name && (
                  <div className="ai-chatbot-festival-info">
                    <h3>메인 축제 정보</h3>
                    <div className="ai-chatbot-festival-card">
                      {travelInfo.festival.image && (
                        <div className="ai-chatbot-festival-image-container">
                          <img
                            src={travelInfo.festival.image}
                            alt={travelInfo.festival.name}
                            style={{
                              width: "100%",
                              objectFit: "cover",
                              borderRadius: "8px 8px 0 0",
                            }}
                            onError={(e) => {
                              // 이미지 로드 실패 시 picsum 이미지로 변경
                              e.target.src =
                                "https://picsum.photos/300/400?text=Festival";
                            }}
                            onLoad={(e) => {
                              // 이미지 로드 성공 시 부모 요소 표시
                              e.target.parentElement.style.display = "block";
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
                          {travelInfo.festival.name}
                        </h4>
                        <p style={{ margin: "5px 0", color: "#64748b" }}>
                          <strong style={{ color: "#374151" }}>📅 기간:</strong>{" "}
                          {travelInfo.festival.period}
                        </p>
                        <p style={{ margin: "5px 0", color: "#64748b" }}>
                          <strong style={{ color: "#374151" }}>📍 장소:</strong>{" "}
                          {travelInfo.festival.location}
                        </p>
                        {travelInfo.festival.tel &&
                          travelInfo.festival.tel !== "연락처 정보 없음" && (
                            <p style={{ margin: "5px 0", color: "#64748b" }}>
                              <strong style={{ color: "#374151" }}>
                                📞 연락처:
                              </strong>{" "}
                              {travelInfo.festival.tel}
                            </p>
                          )}
                        {travelInfo.festival.overview && (
                          <p
                            style={{
                              margin: "10px 0 0 0",
                              lineHeight: "1.6",
                              color: "#4b5563",
                              fontSize: "14px",
                            }}
                          >
                            {travelInfo.festival.overview.length > 200
                              ? travelInfo.festival.overview.substring(0, 200) +
                                "..."
                              : travelInfo.festival.overview}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 추천 코스 정보 - Day별 구분 */}
                {travelInfo.courses && travelInfo.courses.length > 0 && (
                  <div className="ai-chatbot-course-info">
                    <h3>추천 코스</h3>
                    <div className="ai-chatbot-course-content">
                      {(() => {
                        // Day별로 그룹화
                        const coursesByDay = {};
                        travelInfo.courses.forEach((course) => {
                          const day = course.day || 1;
                          if (!coursesByDay[day]) {
                            coursesByDay[day] = [];
                          }
                          coursesByDay[day].push(course);
                        });

                        return Object.keys(coursesByDay)
                          .sort((a, b) => parseInt(a) - parseInt(b))
                          .map((day) => (
                            <div key={day} style={{ marginBottom: "20px" }}>
                              <h4
                                style={{
                                  color: DAY_COLORS[parseInt(day)] || "#60a5fa",
                                  fontWeight: "bold",
                                  fontSize: "16px",
                                  marginBottom: "8px",
                                  borderBottom: `2px solid ${
                                    DAY_COLORS[parseInt(day)] || "#60a5fa"
                                  }`,
                                  paddingBottom: "4px",
                                }}
                              >
                                Day {day}
                              </h4>
                              <ul
                                style={{ marginLeft: "0", paddingLeft: "16px" }}
                              >
                                {coursesByDay[day].map((course, index) => (
                                  <li
                                    key={index}
                                    style={{ marginBottom: "8px" }}
                                  >
                                    <span
                                      style={{
                                        color:
                                          DAY_COLORS[parseInt(day)] ||
                                          "#60a5fa",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {index + 1}.
                                    </span>{" "}
                                    <strong style={{ color: "#374151" }}>
                                      {course.time}
                                    </strong>{" "}
                                    - {course.activity}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ));
                      })()}
                    </div>
                  </div>
                )}

                {/* 교통 안내 */}
                {travelInfo.transportation &&
                  (travelInfo.transportation.nearestStation ||
                    travelInfo.transportation.recommendedMode) && (
                    <div className="ai-chatbot-transportation-info">
                      <h3>교통 안내</h3>
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
