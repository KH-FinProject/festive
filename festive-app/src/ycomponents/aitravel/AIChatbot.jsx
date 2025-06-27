import React, { useState, useEffect, useRef } from "react";
import "./AIChatbot.css";
import AItitle from "./AItitle";

// 백엔드 API 기본 URL
const API_BASE_URL = "http://localhost:8080/api";

// TourAPI 설정
const TOUR_API_KEY =
  "tHW0b2nqX9PkA6UDYmBQuU5wccG5BZK9eugzVCPIb3Tfn+TPnUMyQq+vM3waDovQmI0DW+Bw0JkrH22wEHZbtQ==";

// 지역 코드 매핑
const AREA_CODE_MAP = {
  서울: "1",
  인천: "2",
  대전: "3",
  대구: "4",
  광주: "5",
  부산: "6",
  울산: "7",
  세종: "8",
  경기: "31",
  강원: "32",
  충북: "33",
  충남: "34",
  경북: "35",
  경남: "36",
  전북: "37",
  전남: "38",
  제주: "39",
};

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

// 프론트엔드 TourAPI 호출 함수들
const tourAPI = {
  // 지역명에서 지역코드 추출
  extractAreaCode(text) {
    const regions = Object.keys(AREA_CODE_MAP);
    for (const region of regions) {
      if (text.includes(region)) {
        return AREA_CODE_MAP[region];
      }
    }
    return "1"; // 기본값: 서울
  },

  // 축제 정보 검색
  async fetchFestivalData(areaCode) {
    try {
      console.log(
        `🌐 프론트엔드에서 TourAPI 축제 검색 시작 - 지역코드: ${areaCode}`
      );

      const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const encodedKey = encodeURIComponent(TOUR_API_KEY);

      const url =
        `https://apis.data.go.kr/B551011/KorService2/searchFestival2?` +
        `serviceKey=${encodedKey}&numOfRows=5&pageNo=1&MobileOS=ETC&MobileApp=festive` +
        `&eventStartDate=${today}&areaCode=${areaCode}&_type=json&arrange=C`;

      console.log("📡 TourAPI 요청 URL:", url.substring(0, 100) + "...");

      const response = await fetch(url);
      const data = await response.json();

      console.log("📋 TourAPI 응답:", data);

      if (
        data?.response?.body?.items?.item &&
        data.response.body.items.item.length > 0
      ) {
        const festival = data.response.body.items.item[0];
        console.log("🎪 축제 정보 추출 성공:", festival.title);

        // 좌표 정보 상세 로깅
        console.log("📍 축제 좌표 정보:", {
          mapx: festival.mapx,
          mapy: festival.mapy,
          title: festival.title,
        });

        const result = {
          title: festival.title || "축제 정보",
          eventstartdate: festival.eventstartdate || "",
          eventenddate: festival.eventenddate || "",
          addr1: festival.addr1 || "위치 미정",
          firstimage:
            festival.firstimage ||
            festival.firstimage2 ||
            "https://picsum.photos/300/400?text=Festival",
          overview: festival.overview || "축제에 대한 상세 정보입니다.",
          tel: festival.tel || "",
          mapx: festival.mapx,
          mapy: festival.mapy,
        };

        console.log("🎯 최종 축제 데이터:", result);
        return result;
      }

      console.log("ℹ️ 축제 정보 없음 - 기본값 반환");
      return null;
    } catch (error) {
      console.error("❌ TourAPI 호출 실패:", error);
      return null;
    }
  },

  // 주변 관광지 검색
  async fetchNearbySpots(mapX, mapY) {
    try {
      console.log(`🌐 주변 관광지 검색 시작 - 좌표: ${mapX}, ${mapY}`);

      const encodedKey = encodeURIComponent(TOUR_API_KEY);
      const allSpots = [];

      // 콘텐츠 타입별 검색
      const contentTypes = ["12", "14", "15", "25", "28", "38", "39"]; // 관광지, 문화시설, 축제, 여행코스, 레포츠, 쇼핑, 음식점
      const typeNames = [
        "관광지",
        "문화시설",
        "축제공연행사",
        "여행코스",
        "레포츠",
        "쇼핑",
        "음식점",
      ];

      for (let i = 0; i < contentTypes.length; i++) {
        try {
          const url =
            `https://apis.data.go.kr/B551011/KorService2/locationBasedList2?` +
            `serviceKey=${encodedKey}&numOfRows=10&pageNo=1&MobileOS=ETC&MobileApp=festive` +
            `&_type=json&mapX=${mapX}&mapY=${mapY}&radius=10000&contentTypeId=${contentTypes[i]}&arrange=E`;

          const response = await fetch(url);
          const data = await response.json();

          if (
            data?.response?.body?.items?.item &&
            data.response.body.items.item.length > 0
          ) {
            const spots = Array.isArray(data.response.body.items.item)
              ? data.response.body.items.item
              : [data.response.body.items.item];

            spots.forEach((spot) => {
              spot.categoryName = typeNames[i];
              allSpots.push(spot);
            });
          }

          console.log(`${typeNames[i]} 검색 완료`);
        } catch (error) {
          console.error(`${typeNames[i]} 검색 실패:`, error);
        }

        if (allSpots.length >= 20) break; // 충분한 데이터 수집
      }

      console.log(`총 주변 관광지: ${allSpots.length}개`);
      return allSpots;
    } catch (error) {
      console.error("❌ 주변 관광지 검색 실패:", error);
      return [];
    }
  },
};

const DEFAULT_RESPONSE = `안녕하세요! 한국 여행 전문 AI 어시스턴트입니다.

**이런 질문을 해주세요:**
- "전주 1박2일 여행코스 추천해줘"  
- "경남 벚꽃축제 알려줘"
- "제주도 당일치기 코스 짜줘"
- "서울 겨울축제 추천"

**지역 + 여행기간**을 함께 말씀해주시면 더 정확한 코스를 추천드릴게요!`;

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
        // @location 이전의 텍스트에서 장소명 찾기
        const beforeLocation = response.substring(0, match.index);

        let placeName = "미지정 장소";
        let timeInfo = "";

        // 마지막 몇 줄에서 장소명 찾기
        const lines = beforeLocation.split("\n");

        // 역순으로 최근 라인부터 검사
        for (
          let i = lines.length - 1;
          i >= Math.max(0, lines.length - 10);
          i--
        ) {
          const line = lines[i]?.trim() || "";

          if (
            line &&
            !line.includes("@location") &&
            !line.includes("위치정보")
          ) {
            console.log(`🔍 검사 중인 라인: "${line}"`);

            // 가장 일반적인 패턴: "1. **오전 09:00** - 해운대 해수욕장"
            let match1 = line.match(/^\d+\.\s*\*\*([^*]+)\*\*\s*[-–]\s*(.+)$/);
            if (match1) {
              timeInfo = match1[1].trim();
              placeName = match1[2].trim();
              console.log(
                `✅ 패턴1 매칭: 시간="${timeInfo}", 장소="${placeName}"`
              );
              break;
            }

            // 패턴2: "1. 해운대 해수욕장" (시간 없이)
            let match2 = line.match(/^\d+\.\s*(.+)$/);
            if (match2) {
              placeName = match2[1].trim();
              // **시간** 부분 제거
              placeName = placeName.replace(/\*\*[^*]+\*\*\s*[-–]?\s*/, "");
              console.log(`✅ 패턴2 매칭: 장소="${placeName}"`);
              break;
            }

            // 패턴3: "- 해운대 해수욕장"
            let match3 = line.match(/^[-–]\s*(.+)$/);
            if (match3) {
              placeName = match3[1].trim();
              placeName = placeName.replace(/\*\*[^*]+\*\*\s*[-–]?\s*/, "");
              console.log(`✅ 패턴3 매칭: 장소="${placeName}"`);
              break;
            }

            // 패턴4: 아무 기호 없이 장소명만 있는 경우
            if (
              line.length > 2 &&
              line.length < 30 &&
              !line.includes("Day") &&
              !line.includes("코스")
            ) {
              placeName = line;
              console.log(`✅ 패턴4 매칭: 장소="${placeName}"`);
              break;
            }
          }
        }

        // 장소명 후처리 - 불필요한 텍스트 제거
        placeName = placeName.replace(/\s*포인트:.*$/, "").trim();
        placeName = placeName.replace(/\s*@.*$/, "").trim();
        placeName = placeName.replace(/\([^)]*\)/g, "").trim(); // 괄호 내용 제거

        // 여전히 추출되지 않았으면 기본값 설정
        if (placeName === "미지정 장소" || placeName.length < 2) {
          placeName = `Day ${day} 코스 ${
            newLocations.filter((loc) => loc.day === day).length + 1
          }`;
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

  // 메시지 전송 처리 (TourAPI 데이터를 백엔드로 전달)
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputMessage("");
    setLoading(true);
    setCurrentStreamMessage("");

    try {
      console.log("🚀 TourAPI 데이터 수집 시작:", userMessage);

      // 1. 먼저 TourAPI에서 축제 정보 + 주변 관광지 데이터 수집
      const areaCode = tourAPI.extractAreaCode(userMessage);
      console.log(`📍 추출된 지역코드: ${areaCode}`);

      // 축제 정보 가져오기
      const festivalData = await tourAPI.fetchFestivalData(areaCode);

      let nearbySpots = [];

      // 주변 관광지 검색 (축제 좌표 또는 지역 중심 좌표 사용)
      let searchMapX, searchMapY;

      if (festivalData && festivalData.mapx && festivalData.mapy) {
        console.log("🌐 축제 좌표로 주변 관광지 검색");
        searchMapX = festivalData.mapx;
        searchMapY = festivalData.mapy;
      } else {
        // 축제 좌표가 없으면 지역 중심 좌표 사용
        console.log("🌐 지역 중심 좌표로 주변 관광지 검색");
        const regionCoords = {
          1: { mapx: "126.9784", mapy: "37.5666" }, // 서울
          2: { mapx: "126.7052", mapy: "37.4563" }, // 인천
          3: { mapx: "127.3845", mapy: "36.3504" }, // 대전
          4: { mapx: "128.6014", mapy: "35.8714" }, // 대구
          5: { mapx: "126.8526", mapy: "35.1595" }, // 광주
          6: { mapx: "129.0756", mapy: "35.1796" }, // 부산
          31: { mapx: "127.5179", mapy: "37.2636" }, // 경기
          32: { mapx: "128.2093", mapy: "37.5554" }, // 강원
          33: { mapx: "127.7298", mapy: "36.4919" }, // 충북
          34: { mapx: "126.8000", mapy: "36.5184" }, // 충남
          35: { mapx: "127.1530", mapy: "35.7175" }, // 전북
          36: { mapx: "126.4628", mapy: "34.7604" }, // 전남
          37: { mapx: "128.9056", mapy: "36.4919" }, // 경북
          38: { mapx: "128.2132", mapy: "35.4606" }, // 경남
          39: { mapx: "126.5312", mapy: "33.4996" }, // 제주
        };

        const coords = regionCoords[areaCode] || regionCoords["6"]; // 기본값: 부산
        searchMapX = coords.mapx;
        searchMapY = coords.mapy;
      }

      if (searchMapX && searchMapY) {
        console.log(`🎯 검색 좌표: ${searchMapX}, ${searchMapY}`);
        nearbySpots = await tourAPI.fetchNearbySpots(searchMapX, searchMapY);
      }

      console.log(
        `🎪 축제 정보: ${festivalData ? festivalData.title : "없음"}`
      );
      console.log(`🎯 주변 관광지: ${nearbySpots.length}개`);

      // 2. TourAPI 데이터를 포함해서 백엔드 AI 요청
      const response = await aiAPI.generateResponse(
        userMessage,
        null,
        [],
        festivalData,
        nearbySpots
      );

      console.log("✅ 백엔드 AI 응답 수신:", response);

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

      // 백엔드 응답에서 축제 정보 설정 (또는 TourAPI 데이터 사용)
      const festivalInfo = response.mainFestival || festivalData;

      if (festivalInfo) {
        console.log(
          "🎪 축제 정보 설정:",
          festivalInfo.title || festivalInfo.name
        );

        setTravelInfo({
          festival: {
            name: festivalInfo.title || festivalInfo.name || "축제 정보",
            period:
              festivalInfo.period ||
              (festivalInfo.eventstartdate
                ? `${festivalInfo.eventstartdate.replace(
                    /(\d{4})(\d{2})(\d{2})/,
                    "$1.$2.$3"
                  )} - ${
                    festivalInfo.eventenddate
                      ? festivalInfo.eventenddate.replace(
                          /(\d{4})(\d{2})(\d{2})/,
                          "$1.$2.$3"
                        )
                      : "종료일 미정"
                  }`
                : "기간 미정"),
            location:
              festivalInfo.location || festivalInfo.addr1 || "위치 미정",
            image:
              festivalInfo.image ||
              festivalInfo.firstimage ||
              "https://picsum.photos/300/400?text=Festival",
            overview:
              festivalInfo.description ||
              festivalInfo.overview ||
              "축제에 대한 상세 정보입니다.",
            tel: festivalInfo.contact || festivalInfo.tel || "연락처 정보 없음",
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
          nearbySpots: nearbySpots,
        });
      } else {
        console.log("ℹ️ 축제 정보 없음 - 기본 정보 사용");
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
          nearbySpots: nearbySpots,
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
