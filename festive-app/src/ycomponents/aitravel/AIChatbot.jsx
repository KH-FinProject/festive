import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import axiosApi from "../../api/axiosAPI";
import "./AIChatbot.css";
import AItitle from "./AItitle";
import TravelCourseSaveModal from "./TravelCourseSaveModal";
import ScrollToTop from "./ScrollToTop";
import useAuthStore from "../../store/useAuthStore";

// 백엔드 API 기본 URL
const API_BASE_URL = "http://localhost:8080/api";

const DEFAULT_RESPONSE = `안녕하세요! 한국 여행 전문 AI 어시스턴트입니다.

여행하고 싶은 지역과 기간을 말씀해주시면 맞춤형 여행코스를 추천해드릴게요!

✈️ 이용 방법:
• "서울 2박3일 여행계획 짜줘" - 다양한 타입 랜덤 추천
• "부산 1박2일 관광지 위주로 추천해줘" - 관광지 중심
• "제주도 당일치기 음식점 위주로 짜줘" - 맛집 탐방
• "경주 2박3일 여행코스 위주로 계획해줘" - 여행코스 중심
• "대구 1박2일 문화시설 위주로 추천" - 문화/박물관 중심
• "인천 당일치기 레포츠 위주로 짜줘" - 레포츠/체험 중심
• "광주 1박2일 쇼핑 위주로 계획해줘" - 쇼핑몰/시장 중심

🎪 축제 검색도 가능합니다!`;

// 두 지점 간 거리 계산 함수 (Haversine 공식)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 거리 (km)
};

// 스마트 거리 필터링: 최소 보장 + 점진적 확장
const filterLocationsByDistance = (locations, initialMaxDistance = 30) => {
  if (!locations || locations.length === 0) return [];

  const totalDays = Math.max(...locations.map((loc) => loc.day || 1), 1);
  const minPlacesPerDay = 2; // 하루에 최소 2개 장소 보장
  const targetTotalPlaces = Math.max(totalDays * 3, 6); // 최소 총 6개 장소 보장

  console.log(
    `🔍 스마트 거리 필터링 시작: 총 ${locations.length}개 장소, 초기 최대거리: ${initialMaxDistance}km`
  );
  console.log(
    `🎯 목표: 총 ${targetTotalPlaces}개 이상 (Day당 최소 ${minPlacesPerDay}개)`
  );

  let currentMaxDistance = initialMaxDistance;
  let filteredLocations = [];
  let attempt = 1;

  // 점진적으로 거리 제한을 늘려가며 충분한 장소 확보
  while (filteredLocations.length < targetTotalPlaces && attempt <= 4) {
    console.log(
      `\n🔄 시도 ${attempt}: 최대거리 ${currentMaxDistance}km로 필터링`
    );

    filteredLocations = performDistanceFiltering(locations, currentMaxDistance);

    console.log(
      `📊 결과: ${filteredLocations.length}개 장소 (목표: ${targetTotalPlaces}개 이상)`
    );

    // Day별 분포 확인
    const dayDistribution = {};
    filteredLocations.forEach((loc) => {
      const day = loc.day || 1;
      dayDistribution[day] = (dayDistribution[day] || 0) + 1;
    });

    console.log(`📈 Day별 분포:`, dayDistribution);

    // 충분한 장소와 균형 잡힌 분포가 확보되었는지 확인
    const hasMinPlaces = filteredLocations.length >= targetTotalPlaces;
    const hasBalancedDistribution = Object.values(dayDistribution).every(
      (count) =>
        count >=
        Math.min(
          minPlacesPerDay,
          Math.floor(filteredLocations.length / totalDays)
        )
    );

    if (hasMinPlaces && hasBalancedDistribution) {
      console.log(`✅ 목표 달성! 최종 거리 제한: ${currentMaxDistance}km`);
      break;
    }

    // 다음 시도를 위해 거리 제한 확장
    if (attempt === 1) currentMaxDistance = 50; // 30km → 50km
    else if (attempt === 2) currentMaxDistance = 80; // 50km → 80km
    else if (attempt === 3) currentMaxDistance = 120; // 80km → 120km

    attempt++;
  }

  // 최종 결과가 여전히 부족하면 원본 데이터 사용
  if (
    filteredLocations.length <
    Math.min(targetTotalPlaces, locations.length * 0.5)
  ) {
    console.log(
      `⚠️ 필터링 결과가 너무 적음. 원본 데이터 사용: ${locations.length}개`
    );
    return locations;
  }

  console.log(
    `🎯 스마트 필터링 완료: ${filteredLocations.length}개 장소 (${locations.length}개 중)`
  );
  return filteredLocations;
};

// 실제 거리 필터링 수행 함수
const performDistanceFiltering = (locations, maxDistance) => {
  // Day별로 그룹화
  const dayGroups = {};
  locations.forEach((location) => {
    const day = location.day || 1;
    if (!dayGroups[day]) {
      dayGroups[day] = [];
    }
    dayGroups[day].push(location);
  });

  const filteredLocations = [];

  // 각 Day별로 거리 제한 적용
  Object.keys(dayGroups).forEach((day) => {
    const dayLocations = dayGroups[day];

    if (dayLocations.length === 0) return;
    if (dayLocations.length === 1) {
      filteredLocations.push(...dayLocations);
      return;
    }

    // 좌표가 있는 장소들만 필터링
    const validLocations = dayLocations.filter(
      (loc) => loc.latitude && loc.longitude
    );

    if (validLocations.length <= 1) {
      filteredLocations.push(...validLocations);
      return;
    }

    // 첫 번째 장소를 기준점으로 설정
    const baseLocation = validLocations[0];
    const validGroup = [baseLocation];

    // 나머지 장소들 중 거리 조건을 만족하는 것들 추가
    for (let i = 1; i < validLocations.length; i++) {
      const currentLocation = validLocations[i];
      const distance = calculateDistance(
        baseLocation.latitude,
        baseLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (distance <= maxDistance) {
        validGroup.push(currentLocation);
      }
    }

    filteredLocations.push(...validGroup);
  });

  return filteredLocations;
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

// 사용자 메시지에서 총 일수 계산
const calculateTotalDaysFromMessage = (message) => {
  if (!message) return 1;

  const lowerMessage = message.toLowerCase().replace(/\s+/g, "");

  // 명확한 박수일 패턴 매칭
  if (lowerMessage.includes("1박2일")) return 2;
  if (lowerMessage.includes("2박3일")) return 3;
  if (lowerMessage.includes("3박4일")) return 4;
  if (lowerMessage.includes("4박5일")) return 5;
  if (lowerMessage.includes("5박6일")) return 6;
  if (lowerMessage.includes("6박7일")) return 7;

  // 일수만 있는 경우
  const dayMatch = message.match(/(\d+)일/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    return days;
  }

  // 당일치기 패턴
  if (lowerMessage.includes("당일") || lowerMessage.includes("하루")) {
    return 1;
  }

  return 1; // 기본값
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

// ✅ 모든 TourAPI 호출과 AI 분석이 백엔드에서 안전하게 처리됩니다

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

  // 🔄 여행코스 저장 관련 state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canSaveCourse, setCanSaveCourse] = useState(false);

  // 🔐 로그인 상태 관리
  const { isLoggedIn, member } = useAuthStore();

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
    const isFestivalOnly = travelInfo.requestType === "festival_info";

    console.log(
      `🗺️ 마커 표시 모드: ${isFestivalOnly ? "축제" : "여행"}, ${
        locations.length
      }개 마커`
    );

    if (isFestivalOnly) {
      // 🎪 축제 검색: 단순한 마커만 표시 (연결선 없음, 거리 표시 없음)
      locations.forEach((location, index) => {
        const lat = location.latitude || location.lat;
        const lng = location.longitude || location.lng;

        if (!lat || !lng) {
          console.warn(`⚠️ 축제 좌표 없음: ${location.name}`, location);
          return;
        }

        console.log(
          `🎪 축제 마커 ${index + 1}: ${
            location.name
          } - 위도: ${lat}, 경도: ${lng}`
        );

        const markerPosition = new window.kakao.maps.LatLng(lat, lng);

        // 축제 전용 마커 (빨간색 축제 아이콘)
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
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 2px solid white;
            cursor: pointer;
          ">F</div>`,
          yAnchor: 1,
        });

        festivalMarker.setMap(map);
        map._markers.push(festivalMarker);

        // 축제 인포윈도우
        const imageContent = location.image
          ? `<img src="${location.image}" alt="${location.name}" style="width:200px;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display='none'"/>`
          : "";

        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:12px;font-size:13px;max-width:220px;text-align:center;line-height:1.4;">
            ${imageContent}
            <div style="color:#FF6B6B;font-weight:bold;margin-bottom:4px;">🎪 ${
              location.category || "축제"
            }</div>
            <div style="color:#333;font-weight:600;font-size:14px;margin-bottom:6px;">${
              location.name
            }</div>
            <div style="color:#666;font-size:11px;">${
              location.description || ""
            }</div>
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

        bounds.extend(markerPosition);
      });
    } else {
      // 🗺️ 여행코스 검색: Day별 그룹화, 연결선, 거리 표시
      console.log(`🗺️ 여행코스 검색 모드: Day별 그룹화 및 연결선 표시`);

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

        console.log(`📍 Day ${day} 마커 표시: ${dayLocations.length}개`);

        dayLocations.forEach((location, index) => {
          const lat = location.latitude || location.lat;
          const lng = location.longitude || location.lng;

          if (!lat || !lng) {
            console.warn(`⚠️ 여행지 좌표 없음: ${location.name}`, location);
            return;
          }

          console.log(
            `📍 여행 마커 ${index + 1}: ${
              location.name
            } - 위도: ${lat}, 경도: ${lng}`
          );

          const markerPosition = new window.kakao.maps.LatLng(lat, lng);

          // 여행지 마커 (Day별 색상과 번호)
          const travelMarker = new window.kakao.maps.CustomOverlay({
            position: markerPosition,
            content: createMarkerContent(location.day, index + 1),
            yAnchor: 1,
          });

          travelMarker.setMap(map);
          map._markers.push(travelMarker);

          // 장소명 라벨 추가 (마커 위에)
          const labelPosition = new window.kakao.maps.LatLng(
            lat + 0.001, // 마커보다 약간 위에 위치
            lng
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

          // 여행지 인포윈도우
          const imageContent = location.image
            ? `<img src="${location.image}" alt="${location.name}" style="width:200px;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display='none'"/>`
            : "";

          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:12px;font-size:13px;max-width:220px;text-align:center;line-height:1.4;">
              ${imageContent}
              <div style="color:${dayColor};font-weight:bold;margin-bottom:4px;">Day ${
              location.day
            }</div>
              <div style="color:#333;font-weight:600;font-size:14px;margin-bottom:6px;">${
                location.name
              }</div>
              <span style="background:${dayColor};color:white;padding:2px 6px;border-radius:12px;font-size:10px;">${
              location.category || "관광지"
            }</span>
            </div>`,
          });

          // 클릭 이벤트
          window.kakao.maps.event.addListener(travelMarker, "click", () => {
            if (map._currentInfoWindow) {
              map._currentInfoWindow.close();
            }
            infowindow.open(map, travelMarker);
            map._currentInfoWindow = infowindow;
          });

          // 폴리라인 경로에 추가
          polylinePath.push(markerPosition);
          bounds.extend(markerPosition);
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

    console.log(`✅ 마커 표시 완료: ${locations.length}개`);
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

  // 🎯 AI 응답을 사용자 친화적으로 정리하는 함수
  const cleanAIResponseForUser = (content) => {
    if (!content) return content;

    return (
      content
        // @location, @day 태그 완전 제거
        .replace(/@location:\s*\[\d+\.\d+\s*,\s*\d+\.\d+\]\s*@day:\d+/g, "")
        .replace(/@location:\s*@day:\d+/g, "")
        .replace(/@location:/g, "")
        .replace(/@day:\d+/g, "")

        // 위치정보 관련 텍스트 제거
        .replace(/위치정보:\s*/g, "")

        // 불필요한 기술적 문구 제거
        .replace(/\(유명 관광지 보완\)/g, "")
        .replace(/\(TourAPI 데이터 기반\)/g, "")
        .replace(/TourAPI 우선 \+ AI 보완 방식으로/g, "")

        // Day 형식 정리 (Day 1, Day 2 등을 더 예쁘게)
        .replace(/Day (\d+)/g, "📅 $1일차")

        // 시간 형식 정리 (오전/오후 강조)
        .replace(/오전 (\d+):(\d+)/g, "🌅 오전 $1:$2")
        .replace(/오후 (\d+):(\d+)/g, "🌆 오후 $1:$2")

        // 연속된 줄바꿈 정리 (3개 이상을 2개로)
        .replace(/\n{3,}/g, "\n\n")
        // 줄바꿈은 보존하고 공백과 탭만 정리
        .replace(/[ \t]+/g, " ")
        .trim()
    );
  };

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
      const response = await axios.post(
        `${API_BASE_URL}/ai/chat`,
        { message: userMessage },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status !== 200) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data = response.data;
      console.log("✅ 백엔드에서 TourAPI 통합 처리 완료:", data);

      const content = data.content || "죄송합니다. 응답을 생성할 수 없습니다.";
      console.log("🔐 서비스키가 안전하게 보호된 상태로 데이터 수신 완료");

      // 🎨 사용자 친화적으로 응답 정리
      const cleanContent = cleanAIResponseForUser(content);

      // 스트리밍 시뮬레이션
      let displayedResponse = "";
      const chunks = cleanContent.match(/.{1,50}/g) || [cleanContent];

      for (const chunk of chunks) {
        displayedResponse += chunk;
        setCurrentStreamMessage(removeEmojisFromText(displayedResponse));
        await new Promise((resolve) => setTimeout(resolve, 30)); // 더 빠르게
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
            time: location.time,
            mapX: location.mapX,
            mapY: location.mapY,
            image: location.image,
            category: location.category,
          });
        });

        // 🎯 30km 거리 제한 적용 - Day별 그룹 내 장소들이 30km 이내가 되도록 필터링
        const filteredLocations = filterLocationsByDistance(data.locations, 30);

        console.log(
          `🔍 거리 필터링 결과: ${filteredLocations.length}개 장소 (${data.locations.length}개 중)`
        );

        // 🎯 백엔드에서 이미 day별로 분배된 데이터를 거리 필터링 후 사용
        setTimeout(() => {
          setLocations(filteredLocations);
        }, 500);
      } else {
        console.log("❌ locations 데이터가 비어있음");
        setLocations([]);
      }

      // 🎯 백엔드에서 완성된 축제 정보 사용
      const finalFestivals = data.festivals || [];
      console.log("✅ 백엔드 축제 데이터:", finalFestivals.length, "개");

      // 🚫 거부된 요청인지 확인
      const isRejectedRequest = data.requestType === "rejected";

      // 🎯 필터링된 locations를 사용하여 travelInfo 설정
      const finalLocations =
        data.locations && data.locations.length > 0
          ? filterLocationsByDistance(data.locations, 30)
          : [];

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
        courses: finalLocations,
        transportation: {
          nearestStation: "대중교통 이용 가능",
          recommendedMode: "AI 최적 경로 분석 완료",
        },
        isRejected: isRejectedRequest, // 거부 상태 추가
        // 저장용 추가 정보
        regionName: data.regionName,
        areaCode: data.areaCode,
        totalDays:
          data.travelCourse?.totalDays ||
          calculateTotalDaysFromMessage(userMessage),
        originalMessage: userMessage,
        courseDescription: data.courseDescription, // AI가 생성한 day별 코스 설명
      });

      // 🎯 여행코스 저장 가능 여부 확인 (여행 계획 요청만 저장 가능)
      const hasFilteredLocations = finalLocations && finalLocations.length > 0;
      const isTravelRecommendation =
        data.requestType &&
        (data.requestType === "travel_only" ||
          data.requestType === "festival_travel");
      console.log("🔍 저장 버튼 조건 확인:", {
        requestType: data.requestType,
        hasFilteredLocations,
        isTravelRecommendation,
        canSave: hasFilteredLocations && isTravelRecommendation,
      });
      setCanSaveCourse(hasFilteredLocations && isTravelRecommendation);

      console.log("✅ 백엔드 중심 보안 시스템 완료 - 타입:", data.requestType);
      console.log("🔍 travelCourse 데이터 확인:", data.travelCourse);
      console.log("🔍 locations 길이:", data.locations?.length || 0);
      if (isRejectedRequest) {
        console.log("🚫 일반 대화 요청 거부됨 - 여행/축제 안내 메시지 표시");
      } else {
        console.log("🔐 TourAPI 서비스키 완전 보호, 모든 처리 백엔드 완료");
      }
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

  // 🔐 로그인 체크 후 저장 모달 열기
  const handleSaveButtonClick = () => {
    if (!isLoggedIn) {
      alert("🔒 로그인이 필요한 서비스입니다.\n먼저 로그인해주세요!");
      return;
    }
    setIsSaveModalOpen(true);
  };

  // 🔄 여행코스 저장 기능
  const handleSaveTravelCourse = async (saveData) => {
    setIsSaving(true);

    try {
      console.log("🚀 여행코스 저장 시작:", saveData);

      // 🔐 axiosApi 사용으로 자동 인증 처리
      const response = await axiosApi.post("/api/travel-course/save", saveData);
      const result = response.data;

      if (response.status !== 200) {
        throw new Error(result.message || "저장에 실패했습니다.");
      }

      if (result.success) {
        alert(
          ` ${
            saveData.isShared === "Y" ? "공유" : "개인"
          } 여행코스가 성공적으로 저장되었습니다!`
        );
        setIsSaveModalOpen(false);
        console.log("✅ 여행코스 저장 완료 - 코스번호:", result.courseNo);
      } else {
        throw new Error(result.message || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 여행코스 저장 실패:", error);

      // axiosApi가 자동으로 401 에러 처리를 하므로 간단한 에러 메시지만 표시
      if (error.response?.status === 401) {
        alert("로그인이 필요한 서비스입니다.\n다시 로그인해주세요!");
      } else {
        alert(`저장 실패: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setIsSaving(false);
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

        // 여러 공백을 하나로 정리 (줄바꿈은 보존)
        .replace(/[ \t]+/g, " ") // 공백과 탭만 정리, 줄바꿈은 보존
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

      const trimmedLine = line.trim();

      // 모든 텍스트를 기본 스타일로 표시 (줄바꿈만 처리)
      return <p key={index}>{trimmedLine}</p>;
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
          travelInfo.requestType !== "general_chat" &&
          !travelInfo.isRejected && (
            <div className="ai-chatbot-travel-summary">
              <div className="ai-chatbot-travel-info-grid">
                {/* 축제 정보 섹션 - festival_info일 때만 표시 */}
                {travelInfo.requestType === "festival_info" &&
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

                {/* 🗺️ 여행지 갤러리 - 축제 정보 검색이 아닐 때만 표시 */}
                {travelInfo.requestType !== "festival_info" &&
                  locations.length > 0 && (
                    <div
                      className="ai-chatbot-gallery-info"
                      style={{
                        maxHeight: "70vh",
                        overflow: "auto",
                      }}
                    >
                      <h3>여행지 갤러리</h3>

                      {/* 그리드 배치 - 모든 Day가 잘 보이도록 */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "20px",
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

                          // Day별로 최대 4개씩만 가져와서 한 줄로 배치
                          const allDisplayLocations = [];
                          Object.keys(dayGroups)
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .forEach((day) => {
                              const dayLocations = dayGroups[day].slice(0, 4);
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
                                background: "white",
                                borderRadius: "12px",
                                padding: "16px",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                border: `2px solid ${getDayColor(
                                  location.day
                                )}20`,
                                height: "fit-content",
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

                {/* 추천 코스 정보 - festival_travel 또는 travel_only일 때만 표시 */}
                {(() => {
                  const typeCheck =
                    travelInfo.requestType === "festival_travel" ||
                    travelInfo.requestType === "travel_only";
                  const dataCheck =
                    locations.length > 0 || travelInfo.travelCourse;
                  console.log("🔍 추천코스 조건 확인:", {
                    requestType: travelInfo.requestType,
                    typeCheck,
                    locationsLength: locations.length,
                    hasTravelCourse: !!travelInfo.travelCourse,
                    dataCheck,
                    shouldShow: typeCheck && dataCheck,
                  });
                  return typeCheck && dataCheck;
                })() && (
                  <div className="ai-chatbot-course-info">
                    <h3>추천 코스</h3>
                    <div className="ai-chatbot-course-content">
                      <h4 style={{ color: "#1e40af", marginBottom: "15px" }}>
                        {travelInfo.travelCourse?.title || "AI 추천 여행코스"}
                      </h4>

                      {(() => {
                        // 🎯 locations가 있으면 locations 사용, 없으면 travelCourse.dailySchedule 사용
                        if (locations.length > 0) {
                          // 기존 locations 데이터를 Day별로 그룹화
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
                                  {/* 🎯 카카오맵과 동일하게 Day별로 최대 4개까지만 표시 */}
                                  {dayGroups[day]
                                    .slice(0, 4)
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
                        } else if (travelInfo.travelCourse?.dailySchedule) {
                          // travelCourse의 dailySchedule 사용
                          return travelInfo.travelCourse.dailySchedule.map(
                            (daySchedule, index) => (
                              <div
                                key={index + 1}
                                style={{ marginBottom: "25px" }}
                              >
                                <h5
                                  style={{
                                    color: getDayColor(index + 1),
                                    fontWeight: "bold",
                                    fontSize: "16px",
                                    marginBottom: "10px",
                                    borderBottom: `2px solid ${getDayColor(
                                      index + 1
                                    )}`,
                                    paddingBottom: "5px",
                                  }}
                                >
                                  Day {index + 1}
                                </h5>

                                <ul
                                  style={{
                                    marginLeft: "0",
                                    paddingLeft: "16px",
                                  }}
                                >
                                  {daySchedule.places?.map(
                                    (place, placeIndex) => (
                                      <li
                                        key={placeIndex}
                                        style={{ marginBottom: "10px" }}
                                      >
                                        <span
                                          style={{
                                            color: getDayColor(index + 1),
                                            fontWeight: "bold",
                                          }}
                                        >
                                          {placeIndex + 1}.
                                        </span>{" "}
                                        <strong style={{ color: "#374151" }}>
                                          {place.name}
                                        </strong>
                                        {place.category && (
                                          <span
                                            style={{
                                              marginLeft: "8px",
                                              background: getDayColor(
                                                index + 1
                                              ),
                                              color: "white",
                                              padding: "2px 6px",
                                              borderRadius: "8px",
                                              fontSize: "10px",
                                            }}
                                          >
                                            {place.category}
                                          </span>
                                        )}
                                        {place.address && (
                                          <p
                                            style={{
                                              marginLeft: "20px",
                                              fontSize: "12px",
                                              color: "#64748b",
                                              marginTop: "2px",
                                            }}
                                          >
                                            📍 {place.address}
                                          </p>
                                        )}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )
                          );
                        } else {
                          // 둘 다 없으면 기본 메시지
                          return (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "20px",
                                color: "#64748b",
                              }}
                            >
                              <p>여행 코스 정보를 불러오는 중입니다...</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* 교통 안내 - 여행코스가 있고 데이터가 있을 때만 표시 */}
                {travelInfo.travelCourse &&
                  travelInfo.transportation &&
                  travelInfo.requestType !== "no_data" && (
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

              {/* 🔄 여행코스 저장 및 취소 버튼 - 추천 여행코스일 때만 표시 */}
              {canSaveCourse && !travelInfo.isRejected && (
                <div className="ai-chatbot-button-group">
                  {isLoggedIn && (
                    <button
                      className="ai-chatbot-action-btn save-btn"
                      onClick={handleSaveButtonClick}
                      disabled={isSaving}
                    >
                      저장
                    </button>
                  )}
                  <button
                    className="ai-chatbot-action-btn cancel-btn"
                    onClick={() => window.location.reload()}
                  >
                    새로고침
                  </button>
                </div>
              )}
            </div>
          )}

        {/* 🔄 여행코스 저장 모달 */}
        {isSaveModalOpen && (
          <TravelCourseSaveModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleSaveTravelCourse}
            travelData={{
              locations: locations,
              regionName: travelInfo.regionName,
              areaCode: travelInfo.areaCode,
              totalDays: travelInfo.totalDays || 1,
              requestType: travelInfo.requestType || "travel_only",
              thumbnailImage: locations.length > 0 ? locations[0].image : null,
              courseDescription: travelInfo.courseDescription, // AI가 생성한 day별 코스 설명
            }}
            loading={isSaving}
          />
        )}

        {/* ScrollToTop 버튼 */}
        <ScrollToTop />
      </div>
    </>
  );
};

export default AIChatbot;
