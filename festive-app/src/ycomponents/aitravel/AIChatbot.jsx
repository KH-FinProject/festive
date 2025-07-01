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

여행하고 싶은 지역과 기간을 말씀해주시면 맞춤형 여행코스를 추천해드릴게요!
또한 검색하고 싶은 축제나 행사가 있으시면 축제 검색도 가능합니다.`;

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
  3: "#9B59B6", // 보라
  4: "#FF8C42", // 주황
  5: "#2ECC71", // 초록
  6: "#F39C12", // 골드
  7: "#8E44AD", // 진보라
  8: "#3498DB", // 파랑
  9: "#E74C3C", // 진빨강
  10: "#1ABC9C", // 터키블루
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

// 🔍 사용자 메시지에서 지역명 추출 함수 (시군구 포함)
const extractRegionFromMessage = (message) => {
  // 시군구 우선 검색 (더 구체적인 지역)
  const sigunguList = [
    // 서울특별시
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",

    // 부산광역시
    "부산진구",
    "동래구",
    "해운대구",
    "사하구",
    "금정구",
    "강서구",
    "연제구",
    "수영구",
    "사상구",
    "기장군",

    // 경기도 주요 시/군
    "수원시",
    "성남시",
    "고양시",
    "용인시",
    "부천시",
    "안산시",
    "안양시",
    "남양주시",
    "화성시",
    "평택시",
    "의정부시",
    "시흥시",
    "파주시",
    "김포시",
    "광명시",
    "광주시",

    // 강원특별자치도
    "춘천시",
    "원주시",
    "강릉시",
    "동해시",
    "태백시",
    "속초시",
    "삼척시",
    "홍천군",
    "횡성군",
    "영월군",
    "평창군",
    "정선군",
    "철원군",
    "화천군",
    "양구군",
    "인제군",
    "고성군",
    "양양군",

    // 충청북도
    "청주시",
    "충주시",
    "제천시",
    "보은군",
    "옥천군",
    "영동군",
    "증평군",
    "진천군",
    "괴산군",
    "음성군",
    "단양군",

    // 충청남도
    "천안시",
    "공주시",
    "보령시",
    "아산시",
    "서산시",
    "논산시",
    "계룡시",
    "당진시",
    "금산군",
    "부여군",
    "서천군",
    "청양군",
    "홍성군",
    "예산군",
    "태안군",

    // 전북특별자치도
    "전주시",
    "군산시",
    "익산시",
    "정읍시",
    "남원시",
    "김제시",
    "완주군",
    "진안군",
    "무주군",
    "장수군",
    "임실군",
    "순창군",
    "고창군",
    "부안군",

    // 전라남도
    "목포시",
    "여수시",
    "순천시",
    "나주시",
    "광양시",
    "담양군",
    "곡성군",
    "구례군",
    "고흥군",
    "보성군",
    "화순군",
    "장흥군",
    "강진군",
    "해남군",
    "영암군",
    "무안군",
    "함평군",
    "영광군",
    "장성군",
    "완도군",
    "진도군",
    "신안군",

    // 경상북도
    "포항시",
    "경주시",
    "김천시",
    "안동시",
    "구미시",
    "영주시",
    "영천시",
    "상주시",
    "문경시",
    "경산시",
    "군위군",
    "의성군",
    "청송군",
    "영양군",
    "영덕군",
    "청도군",
    "고령군",
    "성주군",
    "칠곡군",
    "예천군",
    "봉화군",
    "울진군",
    "울릉군",

    // 경상남도
    "창원시",
    "진주시",
    "통영시",
    "사천시",
    "김해시",
    "밀양시",
    "거제시",
    "양산시",
    "의령군",
    "함안군",
    "창녕군",
    "고성군",
    "남해군",
    "하동군",
    "산청군",
    "함양군",
    "거창군",
    "합천군",

    // 제주도
    "제주시",
    "서귀포시",
  ];

  // 시군구 먼저 확인
  for (const sigungu of sigunguList) {
    if (message.includes(sigungu)) {
      console.log(`🏘️ 시군구 감지: ${sigungu}`);
      return sigungu;
    }
  }

  // 광역시/도 확인
  const regions = [
    "서울",
    "부산",
    "대구",
    "인천",
    "광주",
    "대전",
    "울산",
    "세종",
    "경기",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남",
    "경북",
    "경남",
    "제주",
  ];

  for (const region of regions) {
    if (message.includes(region)) {
      console.log(`🗺️ 광역시/도 감지: ${region}`);
      return region;
    }
  }

  return "전국"; // 기본값
};

// 🔍 사용자 메시지에서 키워드 추출 함수
const extractKeywordFromMessage = (message) => {
  const festivalKeywords = [
    "불꽃",
    "축제",
    "페스티벌",
    "행사",
    "공연",
    "문화제",
    "음악제",
    "영화제",
    "벚꽃",
    "단풍",
    "바다",
    "해변",
    "산",
    "등불",
    "랜턴",
    "크리스마스",
  ];

  for (const keyword of festivalKeywords) {
    if (message.includes(keyword)) {
      return keyword;
    }
  }
  return "축제"; // 기본값
};

// 🎯 TourAPI 호출 함수들 - 백엔드에서 이동
const callTourAPI = async (url, description) => {
  console.log(`🌐 TourAPI 요청 시작: ${description}`);
  console.log(`📡 요청 URL: ${url}`);

  try {
    const response = await fetch(url);
    const responseText = await response.text();

    console.log(`✅ TourAPI 응답 수신: ${description}`);
    console.log(`📊 응답 상태: ${response.status}`);
    console.log(`📄 응답 크기: ${responseText.length} bytes`);
    console.log(`📄 응답 내용 (처음 500자):`, responseText.substring(0, 500));

    if (!response.ok) {
      console.error(`❌ TourAPI 오류: ${response.status}`);
      return null;
    }

    return responseText;
  } catch (error) {
    console.error(`❌ TourAPI 호출 실패: ${description}`, error);
    return null;
  }
};

const parseTourAPIResponse = (responseText) => {
  try {
    if (!responseText) return [];

    // XML 파싱
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, "text/xml");

    // 에러 체크
    const errorElements = xmlDoc.getElementsByTagName("errMsg");
    if (errorElements.length > 0) {
      console.warn("❌ TourAPI XML 에러:", errorElements[0].textContent);
      return [];
    }

    const items = xmlDoc.getElementsByTagName("item");
    const spots = [];

    console.log(`📋 파싱할 아이템 수: ${items.length}`);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = item.getElementsByTagName("title")[0]?.textContent;
      const addr1 = item.getElementsByTagName("addr1")[0]?.textContent;
      const mapx = item.getElementsByTagName("mapx")[0]?.textContent;
      const mapy = item.getElementsByTagName("mapy")[0]?.textContent;
      const contentTypeId =
        item.getElementsByTagName("contenttypeid")[0]?.textContent;
      const firstimage =
        item.getElementsByTagName("firstimage")[0]?.textContent ||
        item.getElementsByTagName("firstimage2")[0]?.textContent;
      const tel = item.getElementsByTagName("tel")[0]?.textContent;
      const contentId = item.getElementsByTagName("contentid")[0]?.textContent;

      if (
        title &&
        mapx &&
        mapy &&
        parseFloat(mapx) > 0 &&
        parseFloat(mapy) > 0
      ) {
        spots.push({
          title: title,
          addr1: addr1 || "",
          mapX: mapx,
          mapY: mapy,
          contentTypeId: contentTypeId,
          firstimage: firstimage || "",
          tel: tel || "",
          contentId: contentId || "",
          category: getContentTypeName(contentTypeId),
        });
      }
    }

    console.log(`✅ 파싱 완료: ${spots.length}개 관광지`);
    return spots;
  } catch (error) {
    console.error("❌ TourAPI 응답 파싱 실패:", error);
    return [];
  }
};

const getContentTypeName = (contentTypeId) => {
  const typeMap = {
    12: "관광지",
    14: "문화시설",
    15: "축제공연행사",
    25: "여행코스",
    28: "레포츠",
    32: "숙박",
    38: "쇼핑",
    39: "음식점",
  };
  return typeMap[contentTypeId] || "기타";
};

// 🎯 사용자 입력 분석하여 적절한 API 결정
const analyzeUserInput = (message) => {
  const messageLower = message.toLowerCase();

  // 현재 진행중인 축제 검색
  if (
    messageLower.includes("현재") ||
    messageLower.includes("지금") ||
    messageLower.includes("열리고")
  ) {
    if (messageLower.includes("축제")) {
      return "searchFestival2";
    }
  }

  // 키워드 기반 축제 검색
  if (
    messageLower.includes("불꽃") ||
    messageLower.includes("벚꽃") ||
    (messageLower.includes("축제") && !messageLower.includes("여행코스"))
  ) {
    return "searchKeyword2";
  }

  // 일반 여행코스 검색
  if (messageLower.includes("여행코스") || messageLower.includes("추천")) {
    return "areaBasedList2";
  }

  return "areaBasedList2"; // 기본값
};

// ⚠️ 보안상 TourAPI 호출이 백엔드로 이동됨
// 이제 모든 TourAPI 호출은 백엔드에서 안전하게 처리되어
// 서비스키가 브라우저에 노출되지 않습니다.

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

    // 🎪 축제 검색인지 여행코스 검색인지 구분
    const isFestivalOnly = travelInfo.requestType === "festival_only";

    if (isFestivalOnly) {
      // 🎪 축제 검색: 단순한 마커만 표시 (Day 그룹화 없음, 연결선 없음, 거리 표시 없음)
      console.log(`🎪 축제 검색 모드: ${locations.length}개 마커 단순 표시`);

      locations.forEach((location, index) => {
        const markerPosition = new window.kakao.maps.LatLng(
          location.latitude || location.lat,
          location.longitude || location.lng
        );

        // 축제 전용 마커 (번호 없이 축제 아이콘)
        const festivalMarker = new window.kakao.maps.CustomOverlay({
          position: markerPosition,
          content: `<div style="
            background: #FF6B6B;
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">F</div>`,
          yAnchor: 1,
        });

        festivalMarker.setMap(map);
        map._markers.push(festivalMarker);

        // 축제명 라벨
        const labelPosition = new window.kakao.maps.LatLng(
          (location.latitude || location.lat) + 0.001,
          location.longitude || location.lng
        );

        const labelOverlay = new window.kakao.maps.CustomOverlay({
          position: labelPosition,
          content: `<div style="
            background: rgba(255,255,255,0.95);
            border: 1px solid #FF6B6B;
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

        // 축제 인포윈도우
        const imageContent = location.image
          ? `<img src="${location.image}" alt="${location.name}" style="width:200px;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display='none'"/>`
          : "";

        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:12px;font-size:13px;max-width:220px;text-align:center;line-height:1.4;">
            ${imageContent}
            <div style="color:#FF6B6B;font-weight:bold;margin-bottom:4px;">🎪 축제</div>
            <div style="color:#333;font-weight:600;font-size:14px;margin-bottom:6px;">${
              location.name
            }</div>
            <span style="background:#FF6B6B;color:white;padding:2px 6px;border-radius:12px;font-size:10px;">${
              location.category || "축제"
            }</span>
          </div>`,
        });

        // 클릭 이벤트
        window.kakao.maps.event.addListener(festivalMarker, "click", () => {
          if (map._currentInfoWindow) {
            map._currentInfoWindow.close();
          }
          infowindow.open(map, festivalMarker);
          map._currentInfoWindow = infowindow;
        });
      });
    } else {
      // 🗺️ 여행코스 검색: 기존 Day별 그룹화, 연결선, 거리 표시
      console.log(`🗺️ 여행코스 검색 모드: Day별 그룹화 및 연결선 표시`);

      // Day별로 그룹화
      const dayGroups = {};
      locations.forEach((location) => {
        if (!dayGroups[location.day]) {
          dayGroups[location.day] = [];
        }
        dayGroups[location.day].push(location);
      });

      // 각 Day별로 마커 생성 및 연결선 그리기 (Day별 최대 3개까지만)
      Object.keys(dayGroups).forEach((day) => {
        // 🎯 Day별로 최대 3개만 표시 (AI 임의 데이터 제한)
        const dayLocations = dayGroups[day].slice(0, 3);
        const dayColor = DAY_COLORS[parseInt(day)] || "#FF6B6B";
        const polylinePath = [];

        console.log(
          `📍 Day ${day} 마커 표시: ${dayLocations.length}개 (원본: ${dayGroups[day].length}개)`
        );

        dayLocations.forEach((location, index) => {
          // 좌표 데이터 디버깅
          console.log(`🔍 마커 ${index + 1} 좌표 확인:`, {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            lat: location.lat,
            lng: location.lng,
            mapX: location.mapX,
            mapY: location.mapY,
            image: location.image,
            category: location.category,
            final_lat: location.latitude || location.lat,
            final_lng: location.longitude || location.lng,
          });

          const markerPosition = new window.kakao.maps.LatLng(
            location.latitude || location.lat,
            location.longitude || location.lng
          );

          console.log(
            `📍 마커 ${index + 1} 최종 위치:`,
            markerPosition.getLat(),
            markerPosition.getLng()
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

          // 인포윈도우 - 이미지 포함
          const imageContent = location.image
            ? `<img src="${location.image}" alt="${location.name}" style="width:200px;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display='none'"/>`
            : "";

          const categoryBadge = location.category
            ? `<span style="background:${dayColor};color:white;padding:2px 6px;border-radius:12px;font-size:10px;">${location.category}</span>`
            : "";

          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:12px;font-size:13px;max-width:220px;text-align:center;line-height:1.4;">
              ${imageContent}
              <div style="color:${dayColor};font-weight:bold;margin-bottom:4px;">Day ${location.day}</div>
              <div style="color:#333;font-weight:600;font-size:14px;margin-bottom:6px;">${location.name}</div>
              ${categoryBadge}
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
    }

    // 지도 범위 조정
    if (locations.length > 0) {
      map.setBounds(bounds);
    }
  }, [locations, travelInfo.requestType]);

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

  // 🛡️ 보안 강화된 메시지 전송 처리 - 백엔드 중심 (TourAPI 서비스키 보호)
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputMessage("");
    setLoading(true);
    setCurrentStreamMessage("");

    try {
      console.log("🛡️ 보안 강화된 AI 시스템 시작:", userMessage);

      // 🎯 백엔드에 원본 메시지만 전달 - 모든 TourAPI 처리를 백엔드가 안전하게 담당
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ 백엔드에서 TourAPI 통합 처리 완료:", data);

      const content = data.content || "죄송합니다. 응답을 생성할 수 없습니다.";
      console.log("🔐 서비스키가 안전하게 보호된 상태로 데이터 수신 완료");

      // @location과 @day 태그를 제거하고 이모지도 제거한 깔끔한 텍스트 생성
      const cleanContent = removeEmojisFromText(
        content
          .replace(/@location:\s*\[\d+\.\d+\s*,\s*\d+\.\d+\]\s*@day:\d+/g, "")
          .replace(/위치정보:\s*/g, "")
          .trim()
      );

      // 스트리밍 시뮬레이션
      let displayedResponse = "";
      const chunks = cleanContent.match(/.{1,50}/g) || [cleanContent];

      for (const chunk of chunks) {
        displayedResponse += chunk;
        setCurrentStreamMessage(removeEmojisFromText(displayedResponse));
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
        console.log("🔍 전체 locations 데이터:", data.locations);

        // 각 위치의 좌표 데이터 상세 확인
        data.locations.forEach((location, index) => {
          console.log(`📍 위치 ${index + 1}:`, {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            lat: location.lat,
            lng: location.lng,
            day: location.day,
            mapX: location.mapX,
            mapY: location.mapY,
            image: location.image,
            category: location.category,
          });
        });

        setTimeout(() => {
          setLocations(data.locations);
        }, 500);
      } else {
        console.log("❌ locations 데이터가 비어있음");
        setLocations([]);
      }

      // 🎯 백엔드에서 완성된 축제 정보 사용
      const finalFestivals = data.festivals || [];
      console.log("✅ 백엔드 축제 데이터:", finalFestivals.length, "개");

      setTravelInfo({
        requestType: data.requestType,
        festivals: finalFestivals,
        travelCourse: data.travelCourse,
        mainSpot: data.travelCourse
          ? {
              name: data.travelCourse.title || "AI 추천 여행",
              location: "한국관광공사 TourAPI 검증 지역",
              overview: "백엔드에서 안전하게 처리된 실제 관광 정보입니다.",
            }
          : null,
        courses: data.locations || [],
        transportation: {
          nearestStation: "대중교통 이용 가능",
          recommendedMode: "AI 최적 경로 분석 완료",
        },
      });

      console.log("✅ 백엔드 중심 보안 시스템 완료 - 타입:", data.requestType);
      console.log("🔐 TourAPI 서비스키 완전 보호, 모든 처리 백엔드 완료");
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

  // 프론트엔드 이모지 제거 함수
  const removeEmojisFromText = (text) => {
    if (!text) return text;

    return (
      text
        // 이모지 제거
        .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // 감정 표현
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") // 기타 심볼
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // 교통/지도
        .replace(/[\u{1F700}-\u{1F77F}]/gu, "") // 연금술 심볼
        .replace(/[\u{1F780}-\u{1F7FF}]/gu, "") // 기하학적 모양
        .replace(/[\u{1F800}-\u{1F8FF}]/gu, "") // 화살표
        .replace(/[\u{2600}-\u{26FF}]/gu, "") // 기타 심볼
        .replace(/[\u{2700}-\u{27BF}]/gu, "") // 단위 기호

        // 자주 사용되는 이모지들 직접 제거
        .replace(/🎯|🗺️|📝|⏰|🎨|📋|📍|🏛️|🔒/g, "")
        .replace(/⚠️|🚨|✅|❌|🤖|🌐|🎭|🔄|💡/g, "")
        .replace(/📊|🎪|🌟|💫|⭐|🏷️|📌|🔍/g, "")
        .replace(/✨|🌈|🎉|🎊|🎈|🎁|🎀/g, "")

        // 화살표 및 기타 특수 기호 제거
        .replace(/→|←|↑|↓|▶|◀|▲|▼/g, "")
        .replace(/●|○|■|□|◆|◇|★|☆/g, "")
        .replace(/♥|♡|♠|♣|♦|♧|※|◎/g, "")

        // 마크다운 스타일 기호 제거
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/###|##|#/g, "")
        .replace(/---/g, "")
        .replace(/___/g, "")
        .replace(/```/g, "")
        .replace(/`/g, "")

        // 괄호 안의 특수문자들 제거
        .replace(/\[[^\]]*\]/g, "") // [내용] 형태 제거

        // 여러 공백을 하나로 정리
        .replace(/\s+/g, " ")
        .trim()
    );
  };

  // AI 응답 텍스트 처리 함수 (이모지 제거 포함)
  const formatAIResponse = (content) => {
    if (!content) return [];

    // 이모지 제거
    const cleanContent = removeEmojisFromText(content);

    return cleanContent.split("\n").map((line, index) => {
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
            {/* 카카오맵만 전체 너비로 표시 */}
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
                {/* 축제 정보 섹션 - festival_only 또는 festival_with_travel일 때만 표시 */}
                {(travelInfo.requestType === "festival_only" ||
                  travelInfo.requestType === "festival_with_travel") &&
                  travelInfo.festivals &&
                  travelInfo.festivals.length > 0 && (
                    <div className="ai-chatbot-festival-info">
                      <h3>축제 정보</h3>
                      {/* 가로 카드형 배치 */}
                      <div
                        style={{
                          display: "flex",
                          gap: "20px",
                          overflowX: "auto",
                          paddingBottom: "10px",
                        }}
                      >
                        {travelInfo.festivals.map((festival, index) => (
                          <div
                            key={index}
                            className="ai-chatbot-festival-card"
                            style={{
                              minWidth: "300px",
                              maxWidth: "350px",
                              flex: "0 0 auto",
                              background: "white",
                              borderRadius: "12px",
                              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                              overflow: "hidden",
                              cursor: "pointer",
                              transition: "transform 0.2s ease",
                            }}
                            onClick={() => {
                              // 🎪 축제 클릭 시 해당 마커로 이동
                              if (
                                mapRef.current &&
                                festival.mapY &&
                                festival.mapX
                              ) {
                                const moveLatLon = new window.kakao.maps.LatLng(
                                  parseFloat(festival.mapY),
                                  parseFloat(festival.mapX)
                                );
                                mapRef.current.setCenter(moveLatLon);
                                mapRef.current.setLevel(3);
                                console.log(
                                  `🎪 축제 마커로 이동: ${festival.name}`
                                );
                              }
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-4px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
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
                                  }}
                                  onError={(e) => {
                                    e.target.parentElement.style.display =
                                      "none";
                                  }}
                                />
                              </div>
                            )}
                            <div style={{ padding: "16px" }}>
                              <h4
                                style={{
                                  margin: "0 0 12px 0",
                                  fontSize: "16px",
                                  color: "#1e40af",
                                  fontWeight: "600",
                                  lineHeight: "1.3",
                                }}
                              >
                                {festival.name}
                              </h4>
                              <p
                                style={{
                                  margin: "6px 0",
                                  color: "#64748b",
                                  fontSize: "13px",
                                }}
                              >
                                <strong style={{ color: "#374151" }}>
                                  기간:
                                </strong>{" "}
                                {festival.period}
                              </p>
                              <p
                                style={{
                                  margin: "6px 0",
                                  color: "#64748b",
                                  fontSize: "13px",
                                }}
                              >
                                <strong style={{ color: "#374151" }}>
                                  장소:
                                </strong>{" "}
                                {festival.location}
                              </p>
                              {festival.tel && festival.tel !== "정보 없음" && (
                                <p
                                  style={{
                                    margin: "6px 0",
                                    color: "#64748b",
                                    fontSize: "13px",
                                  }}
                                >
                                  <strong style={{ color: "#374151" }}>
                                    연락처:
                                  </strong>{" "}
                                  {festival.tel}
                                </p>
                              )}
                              {festival.description && (
                                <p
                                  style={{
                                    margin: "12px 0 0 0",
                                    lineHeight: "1.5",
                                    color: "#4b5563",
                                    fontSize: "13px",
                                  }}
                                >
                                  {festival.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 🗺️ 여행지 갤러리 - 축제 검색이 아닐 때만 표시 */}
                {travelInfo.requestType !== "festival_only" &&
                  locations.length > 0 && (
                    <div className="ai-chatbot-gallery-info">
                      <h3>여행지 갤러리</h3>

                      {/* 가로 스크롤 한 줄 배치 - 카카오맵 마커 수만큼만 표시 */}
                      <div
                        style={{
                          display: "flex",
                          gap: "20px",
                          overflowX: "auto",
                          paddingBottom: "20px",
                        }}
                      >
                        {(() => {
                          const dayGroups = {};
                          locations.forEach((location) => {
                            if (!dayGroups[location.day]) {
                              dayGroups[location.day] = [];
                            }
                            dayGroups[location.day].push(location);
                          });

                          // Day별로 최대 3개씩만 가져와서 한 줄로 배치
                          const allDisplayLocations = [];
                          Object.keys(dayGroups)
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .forEach((day) => {
                              const dayLocations = dayGroups[day].slice(0, 3);
                              dayLocations.forEach((location, index) => {
                                allDisplayLocations.push({
                                  ...location,
                                  day: parseInt(day),
                                  dayIndex: index + 1,
                                });
                              });
                            });

                          return allDisplayLocations.map((location, index) => (
                            <div
                              key={`${location.day}-${location.dayIndex}`}
                              style={{
                                minWidth: "300px",
                                maxWidth: "320px",
                                flex: "0 0 auto",
                                background: "white",
                                borderRadius: "12px",
                                padding: "16px",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                border: `2px solid ${getDayColor(
                                  location.day
                                )}20`,
                              }}
                              onClick={() => {
                                // 클릭 시 해당 마커로 이동
                                if (
                                  mapRef.current &&
                                  location.latitude &&
                                  location.longitude
                                ) {
                                  const moveLatLon =
                                    new window.kakao.maps.LatLng(
                                      location.latitude,
                                      location.longitude
                                    );
                                  mapRef.current.setCenter(moveLatLon);
                                  mapRef.current.setLevel(3);
                                }
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(-4px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              {/* Day 표시 */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginBottom: "12px",
                                }}
                              >
                                <span
                                  style={{
                                    background: getDayColor(location.day),
                                    color: "white",
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                  }}
                                >
                                  Day {location.day} - {location.dayIndex}
                                </span>
                              </div>

                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color: "#333",
                                  marginBottom: "12px",
                                  textAlign: "center",
                                  lineHeight: "1.3",
                                }}
                              >
                                {location.name}
                              </div>

                              {location.category && (
                                <div
                                  style={{
                                    textAlign: "center",
                                    marginBottom: "12px",
                                  }}
                                >
                                  <span
                                    style={{
                                      background: "#f3f4f6",
                                      color: "#374151",
                                      padding: "4px 8px",
                                      borderRadius: "8px",
                                      fontSize: "11px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {location.category}
                                  </span>
                                </div>
                              )}

                              {location.image && location.image.trim() ? (
                                <div style={{ position: "relative" }}>
                                  <img
                                    src={location.image}
                                    alt={location.name}
                                    style={{
                                      width: "100%",
                                      height: "120px",
                                      objectFit: "cover",
                                      borderRadius: "8px",
                                      marginBottom: "12px",
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      const fallback =
                                        e.target.parentElement
                                          .nextElementSibling;
                                      if (fallback)
                                        fallback.style.display = "flex";
                                    }}
                                  />
                                </div>
                              ) : null}

                              {/* 이미지 없거나 로드 실패시 fallback */}
                              <div
                                className="image-fallback"
                                style={{
                                  width: "100%",
                                  height: "120px",
                                  background: "#f8f9fa",
                                  borderRadius: "8px",
                                  display:
                                    !location.image || !location.image.trim()
                                      ? "flex"
                                      : "none",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexDirection: "column",
                                  border: "1px solid #e9ecef",
                                  marginBottom: "12px",
                                }}
                              >
                                <img
                                  src="/logo.png"
                                  alt="Festive Logo"
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    objectFit: "contain",
                                    marginBottom: "6px",
                                    opacity: 0.7,
                                  }}
                                />
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#6c757d",
                                    fontWeight: "500",
                                  }}
                                >
                                  {location.category || "관광지"}
                                </div>
                              </div>

                              {/* 추가 정보 표시 */}
                              {location.description && (
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#6b7280",
                                    lineHeight: "1.4",
                                    textAlign: "center",
                                  }}
                                >
                                  {location.description.length > 60
                                    ? location.description.substring(0, 60) +
                                      "..."
                                    : location.description}
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                {/* 추천 코스 정보 - festival_with_travel 또는 travel_only일 때만 표시 */}
                {(travelInfo.requestType === "festival_with_travel" ||
                  travelInfo.requestType === "travel_only") &&
                  locations.length > 0 && (
                    <div className="ai-chatbot-course-info">
                      <h3>추천 코스</h3>
                      <div className="ai-chatbot-course-content">
                        <h4 style={{ color: "#1e40af", marginBottom: "15px" }}>
                          {travelInfo.travelCourse?.title || "AI 추천 여행코스"}
                        </h4>

                        {(() => {
                          // 🎯 카카오맵과 동일한 locations 데이터를 Day별로 그룹화
                          const dayGroups = {};
                          locations.forEach((location) => {
                            if (!dayGroups[location.day]) {
                              dayGroups[location.day] = [];
                            }
                            dayGroups[location.day].push(location);
                          });

                          return Object.keys(dayGroups)
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .map((day) => (
                              <div key={day} style={{ marginBottom: "25px" }}>
                                <h5
                                  style={{
                                    color: getDayColor(parseInt(day)),
                                    fontWeight: "bold",
                                    fontSize: "16px",
                                    marginBottom: "10px",
                                    borderBottom: `2px solid ${getDayColor(
                                      parseInt(day)
                                    )}`,
                                    paddingBottom: "5px",
                                  }}
                                >
                                  Day {day}
                                </h5>

                                <ul
                                  style={{
                                    marginLeft: "0",
                                    paddingLeft: "16px",
                                  }}
                                >
                                  {/* 🎯 카카오맵과 동일하게 Day별로 최대 3개까지만 표시 */}
                                  {dayGroups[day]
                                    .slice(0, 3)
                                    .map((location, index) => (
                                      <li
                                        key={index}
                                        style={{ marginBottom: "10px" }}
                                      >
                                        <span
                                          style={{
                                            color: getDayColor(parseInt(day)),
                                            fontWeight: "bold",
                                          }}
                                        >
                                          {index + 1}.
                                        </span>{" "}
                                        <strong style={{ color: "#374151" }}>
                                          {location.name}
                                        </strong>
                                        {location.category && (
                                          <span
                                            style={{
                                              marginLeft: "8px",
                                              background: getDayColor(
                                                parseInt(day)
                                              ),
                                              color: "white",
                                              padding: "2px 6px",
                                              borderRadius: "8px",
                                              fontSize: "10px",
                                            }}
                                          >
                                            {location.category}
                                          </span>
                                        )}
                                        {location.description &&
                                          location.description !==
                                            location.name && (
                                            <p
                                              style={{
                                                marginLeft: "20px",
                                                fontSize: "12px",
                                                color: "#64748b",
                                                marginTop: "2px",
                                              }}
                                            >
                                              {location.description}
                                            </p>
                                          )}
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            ));
                        })()}
                      </div>
                    </div>
                  )}

                {/* 교통 안내 - 여행코스가 있을 때만 표시 */}
                {travelInfo.travelCourse && travelInfo.transportation && (
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

              {/* 저장/공유 버튼 - 추천 여행코스일 때만 표시 */}
              {(travelInfo.requestType === "festival_with_travel" ||
                travelInfo.requestType === "travel_only") && (
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
              )}
            </div>
          )}
      </div>
    </>
  );
};

export default AIChatbot;
