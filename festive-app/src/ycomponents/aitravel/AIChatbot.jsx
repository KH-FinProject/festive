import React, { useState, useEffect, useRef } from "react";
import "./AIChatbot.css";
import OpenAI from "openai";
import AItitle from "./AItitle";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const ASSISTANT_INSTRUCTIONS = `
한국 여행 전문 AI - 실시간 맞춤 추천

**🎯 핵심 임무:**
- 모든 질문에 대해 반드시 여행 코스 추천 (축제, 관광, 여행 등 모든 키워드)
- 기본은 당일치기 코스이며, 사용자가 몇박몇일을 명시하면 day별 구분
- Tour API 데이터와 실제 관광지 정보 우선 활용
- 축제 정보가 있으면 반드시 포함하여 추천

**🚨 절대 필수 답변 형식 (위치정보 없으면 지도에 표시 안됨!):**

**당일/1일 여행의 경우 (기본):**
[지역 소개] (2줄)
[추천 코스]
1. **오전 09:00** - 장소명
   @location:[37.1234,127.5678] @day:1
   포인트: 특별한 매력

2. **오후 12:00** - 장소명
   @location:[37.2345,127.6789] @day:1
   포인트: 특별한 매력

3. **오후 15:00** - 장소명
   @location:[37.3456,127.7890] @day:1
   포인트: 특별한 매력

**몇박몇일 여행의 경우 (1박2일, 2박3일 등):**
[지역 소개] (2줄)
[Day 1 코스]
1. **오전 09:00** - 장소명
   @location:[37.1234,127.5678] @day:1
   포인트: 특별한 매력

2. **오후 12:00** - 장소명
   @location:[37.2345,127.6789] @day:1
   포인트: 특별한 매력

[Day 2 코스]
1. **오전 09:00** - 장소명
   @location:[37.3456,127.7890] @day:2
   포인트: 특별한 매력

[교통정보] 최적 루트와 소요시간
[여행 꿀팁] 시간대별 추천과 절약 팁

**🚨🚨🚨 절대 규칙 (반드시 지켜야 함!):**
- 어떤 질문이든 반드시 여행 코스를 추천해야 함
- **Day별 섹션 헤더 필수: [Day 1 코스], [Day 2 코스] 형식으로 명확히 구분**
- **4박5일이면 Day 1, Day 2, Day 3, Day 4, Day 5 모든 일정을 완성해야 함**
- **3박4일이면 Day 1, Day 2, Day 3, Day 4 모든 일정을 완성해야 함**
- **2박3일이면 Day 1, Day 2, Day 3 모든 일정을 완성해야 함**
- @location:[위도,경도] @day:숫자 형식을 모든 장소에 반드시 포함
- 위도, 경도는 실제 소수점 숫자여야 함 (예: 37.5665, 126.9780)
- Day별로 구분하여 각 Day마다 최소 3개 코스 추천
- 위치정보가 없으면 지도에 마커가 표시되지 않음
- 이모지 사용 금지
- 반드시 구체적인 여행 코스 제공
- **절대로 중간에 끝내지 말고 요청된 모든 날짜의 일정을 완성하세요**
- **Day별 헤더 예시: [Day 1 코스], [Day 2 코스], [Day 3 코스] - 이 형식 반드시 지켜주세요!**
`;

const DEFAULT_RESPONSE = `안녕하세요! 한국 여행 전문 AI 어시스턴트입니다.

**이런 질문을 해주세요:**
- "전주 1박2일 여행코스 추천해줘"  
- "경남 벚꽃축제 알려줘"
- "제주도 당일치기 코스 짜줘"
- "서울 겨울축제 추천"

**지역 + 여행기간**을 함께 말씀해주시면 더 정확한 코스를 추천드릴게요!`;

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

// 축제 관련 키워드 체크 함수 (대폭 확장)
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
    "추천",
    "코스",
    "계획",
    "관광",
    "관광지",
    "관광지추천",
    "관광지코스",
    "관광지계획",
    "가볼만한곳",
    "놀거리",
    "볼거리",
    "먹거리",
    "데이트",
    "나들이",
    "휴가",
    "주말",
    "연휴",
    "당일치기",
    "1박2일",
    "2박3일",
    "3박4일",
    "찾아줘",
    "알려줘",
    "소개해줘",
    "보여줘",
    "어디",
    "뭐가",
    "어떤",
    "언제",
    "가자",
    "갈만한",
    "가면",
    "방문",
    "체험",
    "구경",
    "즐길",
    "힐링",
    "휴식",
  ];

  return festivalKeywords.some((keyword) =>
    query.toLowerCase().includes(keyword.toLowerCase())
  );
};

// 새로운 지역/키워드 검색이 필요한지 판단하는 함수
const needsNewSearch = (query, currentRegion) => {
  if (!query || typeof query !== "string") return true;

  const cleanQuery = query.toLowerCase().trim();
  console.log("🔍 새로운 검색 필요성 판단:", {
    query: cleanQuery,
    currentRegion,
  });

  // 1. 새로운 지역명이 언급되었는지 확인
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
    "전주",
    "경주",
    "강릉",
    "속초",
    "여수",
    "순천",
    "안동",
    "춘천",
    "포항",
    "울릉도",
  ];

  for (const region of regions) {
    if (cleanQuery.includes(region.toLowerCase())) {
      const mentionedRegion = region;
      console.log(
        "🌍 새로운 지역 발견:",
        mentionedRegion,
        "vs 현재:",
        currentRegion
      );
      // 현재 지역과 다른 지역이 언급되면 새로운 검색 필요
      if (!currentRegion || mentionedRegion !== currentRegion) {
        return true;
      }
    }
  }

  // 2. 구체적인 축제명이나 새로운 키워드가 언급되었는지 확인
  const specificKeywords = [
    "벚꽃축제",
    "단풍축제",
    "눈축제",
    "겨울축제",
    "봄축제",
    "여름축제",
    "가을축제",
    "음식축제",
    "먹거리축제",
    "맛축제",
    "문화축제",
    "전통축제",
    "역사축제",
    "바다축제",
    "산축제",
    "강축제",
    "빛축제",
    "조명축제",
    "불빛축제",
    "꽃축제",
  ];

  for (const keyword of specificKeywords) {
    if (cleanQuery.includes(keyword)) {
      console.log("🎯 구체적 키워드 발견:", keyword, "- 새로운 검색 수행");
      return true;
    }
  }

  // 3. 기존 데이터를 활용할 수 있는 질문들 (새로운 검색 불필요)
  const reuseDataKeywords = [
    "코스",
    "일정",
    "계획",
    "추천",
    "맛집",
    "음식",
    "교통",
    "가는법",
    "1박2일",
    "2박3일",
    "당일",
    "당일치기",
    "숙박",
    "호텔",
    "펜션",
    "더",
    "자세히",
    "상세히",
    "어떻게",
    "어디",
    "언제",
    "몇시",
  ];

  const hasReuseKeyword = reuseDataKeywords.some((keyword) =>
    cleanQuery.includes(keyword)
  );

  if (hasReuseKeyword && currentRegion) {
    console.log("♻️ 기존 데이터 재사용 가능한 질문 - 새로운 검색 불필요");
    return false;
  }

  // 4. 기본값: 현재 지역이 없으면 새로운 검색, 있으면 재사용
  const result = !currentRegion;
  console.log(
    "📋 최종 판단:",
    result ? "새로운 검색 필요" : "기존 데이터 재사용"
  );
  return result;
};

// 텍스트 스트리밍 시뮬레이션 함수 - 초고속 처리
const simulateTextStreaming = async (text, callback, speed = 2) => {
  let currentText = "";
  const characters = text.split("");

  for (const char of characters) {
    currentText += char;
    callback(currentText);
    await new Promise((resolve) => setTimeout(resolve, speed));
  }
  return currentText;
};

// 날짜 포맷팅 함수 (YYYYMMDD 형식으로 변환)
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

// 사용자 입력에서 여러 키워드 추출 (개선된 버전)
const extractUserKeywords = (query) => {
  const cleanQuery = query.toLowerCase().trim();
  const keywords = [];

  // 구체적인 키워드 목록
  const specificKeywords = [
    "벚꽃",
    "단풍",
    "눈꽃",
    "빛",
    "등",
    "꽃",
    "음식",
    "맛",
    "전통",
    "문화",
    "예술",
    "음악",
    "댄스",
    "공연",
    "체험",
    "역사",
    "한옥",
    "궁궐",
    "사찰",
    "바다",
    "산",
    "강",
    "호수",
    "계곡",
    "온천",
    "케이블카",
    "스키",
    "등산",
    "트레킹",
    "캠핑",
    "낚시",
    "서핑",
    "다이빙",
    "놀이공원",
    "동물원",
    "수족관",
    "식물원",
    "테마파크",
    "워터파크",
    "쇼핑",
    "시장",
    "거리",
    "카페",
    "전망대",
    "타워",
    "다리",
    "동굴",
    "폭포",
    "해변",
    "항구",
    "등대",
    "섬",
  ];

  // 구체적 키워드 찾기
  for (const keyword of specificKeywords) {
    if (cleanQuery.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  // 계절/시기 키워드
  const seasonKeywords = [
    "봄",
    "여름",
    "가을",
    "겨울",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];
  for (const season of seasonKeywords) {
    if (cleanQuery.includes(season)) {
      keywords.push(season);
    }
  }

  console.log(`🎯 추출된 키워드: ${keywords.join(", ") || "없음"}`);
  return keywords;
};

// 키워드 추출 함수 (Tour API searchKeyword2 최적화)
const extractKeyword = (query) => {
  if (!query || typeof query !== "string") return "축제";

  const cleanQuery = query.toLowerCase().trim();
  console.log("🔍 원본 쿼리:", query);

  // 1순위: 구체적인 축제명/테마 키워드 (완전 매칭)
  const specificKeywords = [
    "벚꽃축제",
    "단풍축제",
    "눈축제",
    "겨울축제",
    "봄축제",
    "여름축제",
    "가을축제",
    "음식축제",
    "먹거리축제",
    "맛축제",
    "문화축제",
    "전통축제",
    "역사축제",
    "바다축제",
    "산축제",
    "강축제",
    "빛축제",
    "조명축제",
    "불빛축제",
    "꽃축제",
    "등불축제",
    "랜턴축제",
    "동백축제",
    "매화축제",
    "코스모스축제",
    "해바라기축제",
    "튤립축제",
    "라벤더축제",
    "국화축제",
    "철쭉축제",
    "빛초롱축제",
    "연등축제",
    "별빛축제",
    "야경축제",
    "일루미네이션축제",
    "페스티벌",
    "문화제",
    "박람회",
    "마츠리",
    "이벤트",
  ];

  for (const keyword of specificKeywords) {
    if (cleanQuery.includes(keyword)) {
      console.log("🎯 구체적 키워드 발견:", keyword);
      return keyword;
    }
  }

  // 2순위: 테마 키워드 (축제와 조합)
  const themeKeywords = [
    "벚꽃",
    "단풍",
    "눈",
    "겨울",
    "봄",
    "여름",
    "가을",
    "음식",
    "먹거리",
    "맛",
    "문화",
    "전통",
    "역사",
    "바다",
    "산",
    "강",
    "빛",
    "조명",
    "불빛",
    "야경",
    "꽃",
    "등불",
    "랜턴",
    "동백",
    "매화",
    "코스모스",
    "해바라기",
    "튤립",
    "라벤더",
    "국화",
    "철쭉",
  ];

  for (const theme of themeKeywords) {
    if (cleanQuery.includes(theme)) {
      console.log("🌸 테마 키워드 발견:", theme);
      return theme; // 테마 자체를 키워드로 사용
    }
  }

  // 3순위: 축제 관련 일반 키워드
  const festivalKeywords = [
    "축제",
    "페스티벌",
    "행사",
    "이벤트",
    "문화제",
    "박람회",
  ];
  for (const keyword of festivalKeywords) {
    if (cleanQuery.includes(keyword)) {
      console.log("🎪 일반 축제 키워드 발견:", keyword);
      return keyword;
    }
  }

  // 4순위: 지역명은 키워드로 사용하지 않음 (지역 검색과 중복 방지)
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
    "전주",
    "경주",
    "강릉",
    "속초",
    "여수",
    "순천",
    "안동",
    "춘천",
    "포항",
    "울릉도",
  ];

  // 지역명이 있으면 키워드 추출 중단 (지역 검색 우선)
  let hasRegion = false;
  for (const region of regions) {
    if (cleanQuery.includes(region)) {
      console.log("🌍 지역명 감지 - 키워드 추출 중단:", region);
      hasRegion = true;
      break;
    }
  }

  // 지역명이 있으면 기본 키워드만 반환 (복합 검색 방지)
  if (hasRegion) {
    console.log("📍 지역 우선 - 기본 키워드 사용");
    return "축제";
  }

  // 5순위: 여행 기간 기반 키워드 (지역명이 없을 때만)
  const durationMatch = cleanQuery.match(
    /(\d+박\d+일|\d+일|\d+박|당일|주말|연휴)/
  );
  if (durationMatch) {
    const duration = durationMatch[0];
    console.log("📅 여행 기간 감지됨:", duration);
    // 지역명이 없는 경우에만 기간을 키워드로 사용
    // 지역명이 있으면 지역명이 우선
  }

  // 6순위: 계절 기반 키워드
  const seasonMatch = cleanQuery.match(
    /(봄|여름|가을|겨울|3월|4월|5월|6월|7월|8월|9월|10월|11월|12월)/
  );
  if (seasonMatch) {
    const season = seasonMatch[0];
    console.log("🌺 계절 기반 키워드:", season);
    return `${season} 축제`;
  }

  // 7순위: 유효한 단어 추출 (2글자 이상)
  const stopWords = [
    "추천",
    "알려줘",
    "알려주세요",
    "가고싶어",
    "가고",
    "싶어",
    "보여줘",
    "보여주세요",
    "찾아줘",
    "찾아주세요",
    "어디",
    "뭐가",
    "뭐",
    "있어",
    "있나",
    "있나요",
    "해줘",
    "해주세요",
    "여행",
    "코스",
    "가는데",
  ];

  const words = cleanQuery
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .filter((word) => !stopWords.includes(word))
    .filter((word) => !/^[!@#$%^&*(),.?":{}|<>]/.test(word));

  if (words.length > 0) {
    console.log("📝 일반 키워드 추출:", words[0]);
    return words[0];
  }

  // 기본값: "축제"
  console.log("🎭 기본 키워드 사용: 축제");
  return "축제";
};

// 지역명 → 지역코드 매핑 테이블
const areaCodeMap = {
  서울: 1,
  인천: 2,
  대전: 3,
  대구: 4,
  광주: 5,
  부산: 6,
  울산: 7,
  세종: 8,
  경기: 31,
  강원: 32,
  충북: 33,
  충남: 34,
  전북: 35,
  전남: 36,
  경북: 37,
  경남: 38,
  제주: 39,
  // 주요 도시 추가
  전주: 35, // 전북
  경주: 37, // 경북
  강릉: 32, // 강원
  속초: 32, // 강원
  여수: 36, // 전남
  순천: 36, // 전남
  안동: 37, // 경북
  춘천: 32, // 강원
  포항: 37, // 경북
  통영: 38, // 경남
  거제: 38, // 경남
  남해: 38, // 경남
};

// 입력에서 지역명 추출 → areaCode 반환
const extractAreaCode = (input) => {
  for (const [region, code] of Object.entries(areaCodeMap)) {
    if (input.includes(region)) return code;
  }
  return null;
};

// areaCode에서 지역명 추출
const extractAreaName = (areaCode) => {
  for (const [region, code] of Object.entries(areaCodeMap)) {
    if (code === areaCode) return region;
  }
  return null;
};

// 두 지점 간의 거리 계산 (km)
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
  return R * c;
};

// 지역별 중심 좌표 (근거리 코스를 위해 최대 거리 축소)
const getAreaCenter = (areaCode) => {
  const areaCenters = {
    1: { lat: 37.5666805, lng: 126.9784147, name: "서울", maxDistance: 30 }, // 서울
    2: { lat: 37.4563, lng: 126.7052, name: "인천", maxDistance: 25 }, // 인천
    3: { lat: 36.3504, lng: 127.3845, name: "대전", maxDistance: 25 }, // 대전
    4: { lat: 35.8714, lng: 128.6014, name: "대구", maxDistance: 25 }, // 대구
    5: { lat: 35.1595, lng: 126.8526, name: "광주", maxDistance: 25 }, // 광주
    6: { lat: 35.1796, lng: 129.0756, name: "부산", maxDistance: 30 }, // 부산
    7: { lat: 35.5384, lng: 129.3114, name: "울산", maxDistance: 20 }, // 울산
    8: { lat: 36.48, lng: 127.289, name: "세종", maxDistance: 20 }, // 세종
    31: { lat: 37.4138, lng: 127.5183, name: "경기", maxDistance: 40 }, // 경기
    32: { lat: 37.8228, lng: 128.1555, name: "강원", maxDistance: 100 }, // 강원
    33: { lat: 36.6357, lng: 127.4917, name: "충북", maxDistance: 40 }, // 충북
    34: { lat: 36.5184, lng: 126.8, name: "충남", maxDistance: 40 }, // 충남
    35: { lat: 35.8242, lng: 127.148, name: "전북", maxDistance: 40 }, // 전북 (전주)
    36: { lat: 34.8679, lng: 126.991, name: "전남", maxDistance: 70 }, // 전남
    37: { lat: 36.019, lng: 129.3435, name: "경북", maxDistance: 80 }, // 경북 (포항)
    38: { lat: 35.2321, lng: 128.6811, name: "경남", maxDistance: 100 }, // 경남 (통영 중심으로 조정)
    39: { lat: 33.4996, lng: 126.5312, name: "제주", maxDistance: 30 }, // 제주
  };
  return areaCenters[areaCode] || areaCenters[1]; // 기본값: 서울
};

// 단계적 거리 확대 필터링 함수 (스마트 여행코스 구성)
const filterByDistance = (festivals, areaCode) => {
  if (!festivals || festivals.length === 0) {
    return festivals;
  }

  // 축제가 1개뿐이면 그대로 반환
  if (festivals.length === 1) {
    console.log("🎪 축제 1개 - 거리 필터링 생략");
    return festivals;
  }

  // 🎯 스마트 기준점 선택: 지역 중심에 가장 가까운 축제를 기준으로 설정
  let baseFestival = festivals[0]; // 기본값

  if (areaCode) {
    const areaCenter = getAreaCenter(areaCode);

    // 지역 중심에서 가장 가까운 축제를 찾기
    let closestDistance = Infinity;
    festivals.forEach((festival) => {
      const distance = calculateDistance(
        areaCenter.lat,
        areaCenter.lng,
        festival.lat,
        festival.lng
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        baseFestival = festival;
      }
    });

    console.log(
      `🎯 지역 중심(${areaCenter.name})에서 가장 가까운 축제를 기준점으로 선택`
    );
    console.log(`📏 지역 중심에서 거리: ${closestDistance.toFixed(1)}km`);
  }

  console.log(`🎯 기준 축제: ${baseFestival.title}`);
  console.log(`📍 기준 좌표: (${baseFestival.lat}, ${baseFestival.lng})`);

  // 🚗 현실적인 여행 거리 기준 (이동시간 고려)
  // 여행 기간에 따른 적정 거리 계산
  const getTravelDistanceSteps = () => {
    // 기본값: 근거리 여행
    let baseSteps = [15, 30, 45];

    // 첫 번째 축제 제목에서 여행 기간 추출 시도
    const festivalTitle = baseFestival.title || "";

    if (festivalTitle.includes("당일") || festivalTitle.includes("반나절")) {
      baseSteps = [10, 20, 30]; // 당일치기: 최대 30km
    } else if (
      festivalTitle.includes("1박") ||
      festivalTitle.includes("1박2일")
    ) {
      baseSteps = [20, 40, 60]; // 1박2일: 최대 60km
    } else if (
      festivalTitle.includes("2박") ||
      festivalTitle.includes("2박3일")
    ) {
      baseSteps = [30, 60, 90]; // 2박3일: 최대 90km
    } else {
      // 기본 여행코스: 현실적인 거리
      baseSteps = [20, 40, 60];
    }

    console.log(`🚗 여행 거리 설정: ${baseSteps}km (최대 ${baseSteps[2]}km)`);
    return baseSteps;
  };

  const distanceSteps = getTravelDistanceSteps();
  let finalResult = [];

  for (const maxDistance of distanceSteps) {
    console.log(`📏 ${maxDistance}km 범위 검색 시도`);

    const candidateFestivals = festivals.filter((festival, index) => {
      // 첫 번째 축제는 무조건 포함
      if (index === 0) {
        return true;
      }

      const distance = calculateDistance(
        baseFestival.lat,
        baseFestival.lng,
        festival.lat,
        festival.lng
      );

      return distance <= maxDistance;
    });

    console.log(
      `🔍 ${maxDistance}km 범위 결과: ${candidateFestivals.length}개`
    );

    // 결과가 있으면 해당 거리로 확정 (1개 이상이면 OK)
    if (candidateFestivals.length >= 1) {
      finalResult = candidateFestivals.slice(0, 10); // 최대 10개로 제한
      console.log(
        `✅ ${maxDistance}km 범위로 확정 - ${finalResult.length}개 선별`
      );

      // 3개 이상이면 바로 확정, 1-2개면 더 넓은 범위도 시도
      if (candidateFestivals.length >= 3) {
        break;
      } else {
        finalResult = candidateFestivals; // 일단 저장하고 더 시도
      }
    }
  }

  // 아무것도 없으면 첫 번째 축제만 반환
  if (finalResult.length === 0) {
    finalResult = [baseFestival];
    console.log("⚠️ 주변 축제 없음 - 기준 축제만 반환");
  }

  // 최종 결과 로깅
  finalResult.forEach((festival, index) => {
    if (index === 0) {
      console.log(`🎪 ${festival.title}: 기준점 ✅`);
    } else {
      const distance = calculateDistance(
        baseFestival.lat,
        baseFestival.lng,
        festival.lat,
        festival.lng
      );
      console.log(`🎪 ${festival.title}: ${distance.toFixed(1)}km ✅`);
    }
  });

  console.log(
    `🔍 최종 거리 필터링 결과: ${festivals.length}개 → ${finalResult.length}개`
  );
  return finalResult;
};

// 축제 상태 확인 함수
const getFestivalStatus = (start, end) => {
  const now = new Date();
  const startDate = new Date(
    start.slice(0, 4),
    parseInt(start.slice(4, 6)) - 1,
    start.slice(6, 8)
  );
  const endDate = new Date(
    end.slice(0, 4),
    parseInt(end.slice(4, 6)) - 1,
    end.slice(6, 8)
  );

  if (now < startDate) return "예정";
  else if (now > endDate) return "종료";
  else return "진행중";
};

// 기본 좌표 반환 함수
const getDefaultCoordinates = (areaCode) => {
  const areaCenters = {
    1: { lat: 37.5666805, lng: 126.9784147 }, // 서울
    2: { lat: 37.4563, lng: 126.7052 }, // 인천
    3: { lat: 36.3504, lng: 127.3845 }, // 대전
    4: { lat: 35.8714, lng: 128.6014 }, // 대구
    5: { lat: 35.1595, lng: 126.8526 }, // 광주
    6: { lat: 35.1796, lng: 129.0756 }, // 부산
    7: { lat: 36.48, lng: 127.289 }, // 세종
    8: { lat: 37.8813, lng: 127.7299 }, // 경기
    31: { lat: 37.8813, lng: 127.7299 }, // 경기도
    32: { lat: 37.8813, lng: 127.7299 }, // 강원도
    33: { lat: 36.4919, lng: 127.9652 }, // 충북
    34: { lat: 36.5184, lng: 126.8 }, // 충남
    35: { lat: 35.8242, lng: 127.148 }, // 전북 (전주)
    36: { lat: 34.8679, lng: 126.991 }, // 전남 (광주/여수)
    37: { lat: 36.019, lng: 129.3435 }, // 경북 (포항)
    38: { lat: 35.4606, lng: 128.2132 }, // 경남 (창원/부산)
    39: { lat: 33.4996, lng: 126.5312 }, // 제주
  };

  const coordinates = areaCenters[areaCode];
  if (!coordinates) {
    console.warn(
      `⚠️ 지역코드 ${areaCode}에 대한 기본 좌표가 없습니다. 서울 좌표 사용.`
    );
    return areaCenters[1]; // 기본값: 서울
  }

  console.log(`📍 지역코드 ${areaCode} 기본 좌표:`, coordinates);
  return coordinates;
};

// getSampleFestivalData 함수 제거 - 실제 Tour API 데이터만 사용

// Tour API 전용 fetchFestivalData 함수 (fetch().then() 방식)
const fetchFestivalData = (query = "") => {
  console.log("=== Tour API 전용 호출 시작 ===");
  console.log("🔍 원본 쿼리:", query);

  const keyword = extractKeyword(query);
  const areaCode = extractAreaCode(query);

  console.log("📊 검색 정보 분석:");
  console.log("  - 추출된 키워드:", keyword || "없음");
  console.log("  - 추출된 지역코드:", areaCode || "없음");
  console.log("  - 키워드 타입:", typeof keyword);
  console.log("  - 키워드 길이:", keyword ? keyword.length : 0);

  const rawServiceKey = import.meta.env.VITE_TOURAPI_KEY;

  if (!rawServiceKey) {
    console.error("❌ VITE_TOURAPI_KEY가 설정되지 않았습니다!");
    return Promise.reject(
      new Error(
        "Tour API 키가 설정되지 않았습니다. .env 파일에 VITE_TOURAPI_KEY를 추가해주세요."
      )
    );
  }

  // API 키 디코딩 시도 (인코딩된 키인 경우)
  let serviceKey = rawServiceKey;
  try {
    // URL 디코딩이 필요한 경우 (% 문자가 포함된 경우)
    if (rawServiceKey.includes("%")) {
      serviceKey = decodeURIComponent(rawServiceKey);
      console.log("🔓 API 키 디코딩 완료");
    }
  } catch (error) {
    console.warn("⚠️ API 키 디코딩 실패, 원본 키 사용:", error.message);
    serviceKey = rawServiceKey;
  }

  console.log(
    "🔑 Tour API 키 확인:",
    serviceKey
      ? `✅ 설정됨 (${serviceKey.substring(0, 10)}...)`
      : "❌ 설정되지 않음"
  );

  console.log("📝 API 키 길이:", serviceKey.length);
  console.log(
    "🔤 API 키 타입:",
    serviceKey.includes("%") ? "인코딩됨" : "일반"
  );

  // 현재 날짜 기준으로 검색 범위 설정 (향후 90일)
  const today = new Date();
  const startDate = formatDate(today);
  const endDate = formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

  // 똑똑한 API 엔드포인트 선택 로직
  let apiEndpoints = [];

  console.log("🎯 API 엔드포인트 선택 로직:");
  console.log(
    "- 지역코드:",
    areaCode ? `있음 (${extractAreaName(areaCode)})` : "없음"
  );
  console.log("- 키워드:", keyword || "없음");

  const hasSpecificKeyword =
    keyword && keyword !== "축제" && keyword.length >= 2;
  const queryHasBothRegionAndKeyword = areaCode && hasSpecificKeyword;

  // 🎯 최적화된 선택 로직
  if (areaCode && !hasSpecificKeyword) {
    // Case 1: 지역만 있는 경우 ("전주 여행코스 추천해줘")
    console.log("📍 지역 전용 검색 (키워드 검색 생략)");

    // 여행코스/관광 질문인지 확인
    const isTravelQuery = /여행|관광|코스|추천|나들이|데이트/.test(
      query.toLowerCase()
    );

    if (isTravelQuery) {
      console.log("🗺️ 여행코스 질문 - 모든 관광지 타입 포함");
      // 모든 관광지 타입 포함 (축제 외에 관광지, 문화시설, 레포츠 등)
      apiEndpoints.push({
        name: "지역기반관광정보",
        url: "B551011/KorService2/areaBasedList2",
        params: {
          serviceKey: serviceKey,
          numOfRows: "100",
          pageNo: "1",
          MobileOS: "ETC",
          MobileApp: "Festive",
          _type: "json",
          arrange: "C",
          // contentTypeId 제거 - 모든 타입 포함
        },
      });
    } else {
      console.log("🎭 축제 중심 검색");
      // 축제 중심 검색
      apiEndpoints.push({
        name: "지역기반관광정보",
        url: "B551011/KorService2/areaBasedList2",
        params: {
          serviceKey: serviceKey,
          numOfRows: "100",
          pageNo: "1",
          MobileOS: "ETC",
          MobileApp: "Festive",
          _type: "json",
          arrange: "C",
          contentTypeId: "15", // 축제/행사
        },
      });
    }
  } else if (!areaCode && hasSpecificKeyword) {
    // Case 2: 키워드만 있는 경우 ("벚꽃축제 추천해줘")
    console.log("🔍 키워드 전용 검색 (지역 검색 생략)");
    apiEndpoints.push({
      name: "키워드검색",
      url: "B551011/KorService2/searchKeyword2",
      params: {
        serviceKey: serviceKey,
        numOfRows: "100",
        pageNo: "1",
        MobileOS: "ETC",
        MobileApp: "Festive",
        _type: "json",
        arrange: "C",
        keyword: keyword,
        contentTypeId: "15", // 축제/행사
      },
    });
  } else if (queryHasBothRegionAndKeyword) {
    // Case 3: 지역 + 구체적 키워드 ("전주 한옥마을 축제")
    console.log("🎯 지역+키워드 복합 검색");

    // 지역 검색 먼저
    const isTravelQuery = /여행|관광|코스|추천|나들이|데이트/.test(
      query.toLowerCase()
    );

    apiEndpoints.push({
      name: "지역기반관광정보",
      url: "B551011/KorService2/areaBasedList2",
      params: {
        serviceKey: serviceKey,
        numOfRows: "100",
        pageNo: "1",
        MobileOS: "ETC",
        MobileApp: "Festive",
        _type: "json",
        arrange: "C",
        ...(isTravelQuery ? {} : { contentTypeId: "15" }), // 여행 질문이면 모든 타입, 아니면 축제만
      },
    });

    // 키워드 검색 추가 (지역 검색 결과가 부족할 때만 실행됨)
    console.log("🔍 키워드 검색 설정:", keyword);
    if (keyword && keyword.trim() && keyword !== "축제") {
      console.log("✅ 유효한 키워드로 키워드 검색 추가");
      apiEndpoints.push({
        name: "키워드검색",
        url: "B551011/KorService2/searchKeyword2",
        params: {
          serviceKey: serviceKey,
          numOfRows: "100",
          pageNo: "1",
          MobileOS: "ETC",
          MobileApp: "Festive",
          _type: "json",
          arrange: "C",
          keyword: keyword,
          contentTypeId: "15", // 축제/행사
        },
      });
    } else {
      console.log("⚠️ 키워드가 없거나 기본값이라 키워드 검색 생략");
    }
  } else {
    // Case 4: 기본 검색 (지역도 키워드도 명확하지 않은 경우)
    console.log("📅 기본 축제 검색");
    apiEndpoints.push({
      name: "행사정보조회",
      url: "B551011/KorService2/searchFestival2",
      params: {
        serviceKey: serviceKey,
        numOfRows: "100",
        pageNo: "1",
        MobileOS: "ETC",
        MobileApp: "Festive",
        _type: "json",
        arrange: "C",
        eventStartDate: startDate,
        eventEndDate: endDate,
      },
    });
  }

  console.log(
    `📋 선택된 API 전략: ${apiEndpoints.map((ep) => ep.name).join(" → ")}`
  );

  // 순차적으로 API 호출하는 함수 (최대 재시도 제한)
  const tryApiEndpoint = (endpointIndex, retryCount = 0) => {
    if (endpointIndex >= apiEndpoints.length) {
      return Promise.reject(
        new Error(
          "현재 진행중인 축제 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요."
        )
      );
    }

    // 최대 재시도 횟수 제한 (무한 루프 방지)
    if (retryCount > 3) {
      console.warn("API 재시도 횟수 초과. 다음 엔드포인트로 이동");
      return tryApiEndpoint(endpointIndex + 1, 0);
    }

    const endpoint = apiEndpoints[endpointIndex];
    console.log(`🔍 ${endpoint.name} API 호출 중...`);

    // 파라미터 구성 (serviceKey 별도 처리)
    const params = new URLSearchParams();

    // serviceKey를 제외한 나머지 파라미터 추가
    Object.entries(endpoint.params).forEach(([key, value]) => {
      if (key !== "serviceKey") {
        params.append(key, value);
      }
    });

    // 지역 코드 추가
    if (areaCode) {
      params.append("areaCode", areaCode);
      console.log(`🌍 지역 필터: ${areaCode} (${extractAreaName(areaCode)})`);
    }

    // serviceKey는 마지막에 직접 추가 (이중 인코딩 방지)
    const apiUrl = `/api/${endpoint.url}?serviceKey=${encodeURIComponent(
      serviceKey
    )}&${params.toString()}`;
    console.log("📡 API 요청:", apiUrl.substring(0, 100) + "...");

    return fetch(apiUrl)
      .then((response) => {
        console.log("📊 응답 상태:", response.status, response.statusText);

        if (!response.ok) {
          console.warn(
            `⚠️ ${endpoint.name} 실패: ${response.status} (재시도: ${
              retryCount + 1
            })`
          );
          if (response.status >= 500 && retryCount < 2) {
            // 서버 오류인 경우만 재시도
            console.log(`서버 오류로 인한 재시도: ${retryCount + 1}/2`);
            return new Promise((resolve) => {
              setTimeout(
                () => resolve(tryApiEndpoint(endpointIndex, retryCount + 1)),
                1000
              );
            });
          }
          return tryApiEndpoint(endpointIndex + 1, 0);
        }

        return response.text();
      })
      .then((responseText) => {
        console.log(
          "📄 응답 텍스트 (처음 500자):",
          responseText.substring(0, 500)
        );

        // HTML 응답인지 확인
        if (
          responseText.trim().startsWith("<!DOCTYPE") ||
          responseText.trim().startsWith("<html") ||
          responseText.includes("<html") ||
          responseText.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR")
        ) {
          console.error(`❌ ${endpoint.name}: HTML/오류 응답 받음`);
          console.error("🔍 상세 오류 내용:", responseText.substring(0, 1000));

          // 특정 오류 메시지 확인
          if (responseText.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR")) {
            console.error("🔑 API 키 등록 오류 - 다음을 확인하세요:");
            console.error("1. 공공데이터포털에서 활용신청 승인 여부");
            console.error("2. API 키 형식 (인코딩/디코딩)");
            console.error("3. 도메인/IP 등록 상태");
          }
          return tryApiEndpoint(endpointIndex + 1);
        }

        // JSON 파싱 시도
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("📄 응답 데이터:", data);
        } catch (parseError) {
          console.warn(
            `❌ ${endpoint.name}: JSON 파싱 실패:`,
            parseError.message
          );
          console.warn("응답 내용:", responseText.substring(0, 500));
          return tryApiEndpoint(endpointIndex + 1);
        }

        // 응답 구조 확인 (Tour API v2 대응)
        let responseHeader, responseBody;

        // 새로운 응답 구조 확인 (직접 resultCode가 있는 경우)
        if (data.resultCode) {
          responseHeader = {
            resultCode: data.resultCode,
            resultMsg: data.resultMsg,
          };
          responseBody = data; // 데이터 자체가 body
        } else if (data.response) {
          // 기존 응답 구조
          responseHeader = data.response.header;
          responseBody = data.response.body;
        } else {
          console.warn(`❌ ${endpoint.name}: 알 수 없는 응답 구조`);
          console.warn("응답 데이터:", data);
          return tryApiEndpoint(endpointIndex + 1);
        }

        if (!responseHeader || responseHeader.resultCode !== "0000") {
          console.warn(
            `❌ ${endpoint.name} API 오류: ${responseHeader?.resultCode} - ${responseHeader?.resultMsg}`
          );

          // 특정 오류 코드에 대한 상세 정보
          if (responseHeader?.resultCode === "12") {
            console.warn("🔑 API 키 관련 오류 - 서비스 승인 상태를 확인하세요");
          } else if (responseHeader?.resultCode === "10") {
            console.warn("📝 필수 파라미터 누락 또는 잘못된 형식");
            console.warn(
              "💡 해결방법: listYN 파라미터 제거 완료, 다른 파라미터 확인 필요"
            );
          } else if (responseHeader?.resultCode === "99") {
            console.warn("🚫 시스템 오류 - 잠시 후 재시도");
          } else if (responseHeader?.resultCode === "22") {
            console.warn("🔄 서비스 제공 불가 - 일시적 문제");
          }
          return tryApiEndpoint(endpointIndex + 1);
        }

        if (!responseBody || !responseBody.items) {
          console.warn(`🚫 ${endpoint.name}: 데이터 없음`);
          return tryApiEndpoint(endpointIndex + 1);
        }

        const items = Array.isArray(responseBody.items.item)
          ? responseBody.items.item
          : [responseBody.items.item].filter(Boolean);

        if (items.length === 0) {
          console.warn(`🚫 ${endpoint.name}: 빈 결과`);
          return tryApiEndpoint(endpointIndex + 1);
        }

        console.log(`✅ ${endpoint.name} 성공! ${items.length}개 아이템 발견`);

        // 관광지 데이터 필터링 및 변환
        const isTravelQuery = /여행|관광|코스|추천|나들이|데이트/.test(
          query.toLowerCase()
        );

        // 키워드 기반 필터링 (사용자 입력에서 키워드 추출)
        const userKeywords = extractUserKeywords(query);

        const festivals = items
          .filter((item) => {
            if (isTravelQuery) {
              // 여행코스 질문: 모든 관광지 포함 (제목이 있는 모든 항목)
              return item.title && item.title.length > 0;
            } else {
              // 축제 중심 질문: 축제/행사만 필터링
              const isEvent =
                item.contenttypeid === "15" || item.contenttypeid === 15;
              const hasEventDate = item.eventstartdate && item.eventenddate;
              const titleContainsFestival =
                item.title &&
                (item.title.includes("축제") ||
                  item.title.includes("페스티벌") ||
                  item.title.includes("행사") ||
                  item.title.includes("이벤트") ||
                  item.title.includes("문화제") ||
                  item.title.includes("박람회"));

              return isEvent || hasEventDate || titleContainsFestival;
            }
          })
          // 사용자 키워드와 일치하는 항목 우선 필터링
          .filter((item) => {
            if (userKeywords.length === 0) return true;

            const titleLower = item.title.toLowerCase();
            const overviewLower = (item.overview || "").toLowerCase();
            const addrLower = (item.addr1 || "").toLowerCase();

            return userKeywords.some(
              (keyword) =>
                titleLower.includes(keyword.toLowerCase()) ||
                overviewLower.includes(keyword.toLowerCase()) ||
                addrLower.includes(keyword.toLowerCase())
            );
          })
          .map((item, index) => {
            const today = formatDate(new Date());
            const nextMonth = formatDate(
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            );

            // 📍 Tour API 좌표 정보 확인 및 검증 로깅
            const originalLat = parseFloat(item.mapy);
            const originalLng = parseFloat(item.mapx);

            // 기본 좌표 유효성 검사
            const isValidNumber =
              !isNaN(originalLat) &&
              !isNaN(originalLng) &&
              originalLat !== 0 &&
              originalLng !== 0;

            // 한국 영역 내 좌표인지 검증 (대략 북위 33-39도, 동경 124-132도)
            const isInKoreaRegion =
              originalLat >= 33 &&
              originalLat <= 39 &&
              originalLng >= 124 &&
              originalLng <= 132;

            // 지역코드와 좌표가 일치하는지 검증 (한산도 등 섬 지역 개선)
            const areaCenter = getAreaCenter(item.areacode || areaCode);
            let isRegionMatched = true;

            if (isValidNumber && isInKoreaRegion && areaCenter) {
              const distanceFromCenter = calculateDistance(
                areaCenter.lat,
                areaCenter.lng,
                originalLat,
                originalLng
              );

              // 🏝️ 지역별 최대 허용 거리 동적 설정
              let maxAllowedDistance = areaCenter.maxDistance || 100;

              // 통영, 여수 등 섬이 많은 지역은 허용 거리 확대
              if (
                item.title.includes("한산도") ||
                item.title.includes("섬") ||
                item.title.includes("도서") ||
                areaCenter.name === "경남"
              ) {
                maxAllowedDistance = 150; // 섬 지역은 150km까지 허용
                console.log(
                  `🏝️ [${item.title}] 섬 지역으로 인식 - 허용거리 ${maxAllowedDistance}km로 확대`
                );
              }

              isRegionMatched = distanceFromCenter <= maxAllowedDistance;

              if (!isRegionMatched) {
                console.warn(
                  `⚠️ [${item.title}] 지역 불일치 좌표 - ${
                    areaCenter.name
                  } 중심에서 ${distanceFromCenter.toFixed(
                    1
                  )}km 떨어짐 (허용: ${maxAllowedDistance}km)`
                );
                console.warn(
                  `🔧 지역 중심 좌표로 보정 예정: (${areaCenter.lat}, ${areaCenter.lng})`
                );
              } else {
                console.log(
                  `✅ [${
                    item.title
                  }] 지역 내 좌표 확인 - ${distanceFromCenter.toFixed(
                    1
                  )}km (허용: ${maxAllowedDistance}km)`
                );
              }
            }

            const hasRealCoordinates =
              isValidNumber && isInKoreaRegion && isRegionMatched;

            // 실제 좌표가 없으면 경고 로그
            if (!hasRealCoordinates) {
              console.warn(
                `⚠️ [${item.title}] Tour API 좌표 없음 - mapy: ${item.mapy}, mapx: ${item.mapx}`
              );
              console.warn(
                `🔄 기본 좌표 사용 예정 (지역코드: ${
                  item.areacode || areaCode
                })`
              );
            } else {
              console.log(
                `✅ [${item.title}] 실제 좌표 확인 - 위도: ${originalLat}, 경도: ${originalLng}`
              );
            }

            // 기본 좌표 결정 (섬 지역 특별 처리)
            const defaultCoords = getDefaultCoordinates(
              item.areacode || areaCode
            );

            let finalLat, finalLng;

            if (hasRealCoordinates) {
              finalLat = originalLat;
              finalLng = originalLng;
            } else {
              // 🏝️ 섬 지역은 지역 중심에서 약간 떨어뜨린 좌표 사용
              if (item.title.includes("한산도") || item.title.includes("섬")) {
                const areaCenter = getAreaCenter(item.areacode || areaCode);
                // 통영 한산도는 남쪽 바다 방향으로 오프셋
                if (
                  item.title.includes("한산도") &&
                  areaCenter.name === "경남"
                ) {
                  finalLat = areaCenter.lat - 0.05; // 남쪽으로 약간 이동
                  finalLng = areaCenter.lng - 0.02; // 서쪽으로 약간 이동
                  console.log(
                    `🏝️ [${item.title}] 한산도 특별 좌표 적용: (${finalLat}, ${finalLng})`
                  );
                } else {
                  // 다른 섬들은 랜덤 오프셋
                  finalLat = defaultCoords.lat + (Math.random() - 0.5) * 0.02;
                  finalLng = defaultCoords.lng + (Math.random() - 0.5) * 0.02;
                  console.log(
                    `🏝️ [${item.title}] 섬 지역 랜덤 오프셋 적용: (${finalLat}, ${finalLng})`
                  );
                }
              } else {
                finalLat = defaultCoords.lat;
                finalLng = defaultCoords.lng;
              }
            }

            return {
              id: item.contentid || `festival_${index}`,
              title: item.title || "축제명 미상",
              startDate: item.eventstartdate || today,
              endDate: item.eventenddate || nextMonth,
              location: item.addr1 || "장소 미상",
              image: item.firstimage || null, // placeholder 제거
              lat: finalLat,
              lng: finalLng,
              hasRealCoordinates: hasRealCoordinates, // 실제 좌표인지 여부 추가
              tel: item.tel || "",
              status: item.eventstartdate
                ? getFestivalStatus(item.eventstartdate, item.eventenddate)
                : "진행중",
              overview:
                item.overview || `${item.title}에 대한 상세 정보입니다.`,
              areaCode: item.areacode || areaCode || "1",
              contentTypeId: item.contenttypeid || "15",
            };
          });

        // 1단계: 키워드 필터링
        let filteredFestivals = festivals;
        if (keyword && keyword.length >= 2) {
          filteredFestivals = festivals.filter(
            (festival) =>
              festival.title.includes(keyword) ||
              festival.location.includes(keyword)
          );
          console.log(
            `🔍 키워드 "${keyword}" 필터링 후: ${filteredFestivals.length}개`
          );
        }

        // 2단계: 지역 내 필터링 (대폭 완화된 조건)
        if (areaCode && filteredFestivals.length > 0) {
          const areaCenter = getAreaCenter(areaCode);

          // 구체적인 키워드 감지 강화
          const hasSpecificKeyword =
            keyword && keyword !== "축제" && keyword.length >= 2;

          console.log(`🌍 지역 필터링 시작: ${areaCenter.name}`);
          console.log(
            `🔑 키워드: "${keyword}" ${
              hasSpecificKeyword ? "(구체적)" : "(일반적)"
            }`
          );
          console.log(`📊 필터링 전 축제 수: ${filteredFestivals.length}개`);

          // 구체적 키워드가 있거나 결과가 적으면 매우 관대한 범위 적용
          const isFlexibleSearch =
            hasSpecificKeyword || filteredFestivals.length <= 5;

          if (isFlexibleSearch) {
            console.log(
              `🚀 유연한 검색 모드 활성화 - 매우 넓은 범위 (500km) 적용`
            );

            const veryLargeDistance = 500; // 500km - 거의 전국 수준

            filteredFestivals = filteredFestivals.filter((festival) => {
              const distance = calculateDistance(
                areaCenter.lat,
                areaCenter.lng,
                festival.lat,
                festival.lng
              );

              const isWithin = distance <= veryLargeDistance;

              if (!isWithin) {
                console.log(
                  `🚫 ${festival.title}: ${distance.toFixed(
                    1
                  )}km - 너무 멀어서 제외`
                );
              }

              return isWithin;
            });

            console.log(
              `🌍 유연한 필터링 결과: ${filteredFestivals.length}개 (500km 범위)`
            );
          } else {
            // 일반적인 여행 질문일 때도 2배 확대된 거리 적용
            const maxRegionDistance = areaCenter.maxDistance * 2; // 2배 확대

            console.log(
              `📏 지역 내 최대 거리: ${maxRegionDistance}km (기본의 2배)`
            );

            filteredFestivals = filteredFestivals.filter((festival) => {
              const distance = calculateDistance(
                areaCenter.lat,
                areaCenter.lng,
                festival.lat,
                festival.lng
              );

              const isInRegion = distance <= maxRegionDistance;

              if (!isInRegion) {
                console.log(
                  `🚫 ${festival.title}: ${distance.toFixed(
                    1
                  )}km - 지역 밖이므로 제외`
                );
              }

              return isInRegion;
            });

            console.log(
              `🌍 지역 필터링 결과: ${filteredFestivals.length}개 (${areaCenter.name} 확대 지역)`
            );
          }
        }

        // 2.5단계: 실제 좌표가 있는 데이터 우선 정렬
        console.log("📍 좌표 품질 기준 정렬 시작");
        filteredFestivals = filteredFestivals.sort((a, b) => {
          // 실제 좌표가 있는 데이터를 우선으로
          if (a.hasRealCoordinates && !b.hasRealCoordinates) return -1;
          if (!a.hasRealCoordinates && b.hasRealCoordinates) return 1;
          return 0; // 나머지는 기존 순서 유지
        });

        const realCoordCount = filteredFestivals.filter(
          (f) => f.hasRealCoordinates
        ).length;
        const defaultCoordCount = filteredFestivals.length - realCoordCount;
        console.log(
          `📊 좌표 품질: 실제좌표 ${realCoordCount}개, 기본좌표 ${defaultCoordCount}개`
        );

        // 2.8단계: 지역 일치 축제 우선 정렬 (해당 지역 축제를 앞으로)
        if (areaCode && filteredFestivals.length > 1) {
          const areaCenter = getAreaCenter(areaCode);

          filteredFestivals = filteredFestivals.sort((a, b) => {
            const distanceA = calculateDistance(
              areaCenter.lat,
              areaCenter.lng,
              a.lat,
              a.lng
            );
            const distanceB = calculateDistance(
              areaCenter.lat,
              areaCenter.lng,
              b.lat,
              b.lng
            );

            // 50km 이내는 해당 지역 축제로 간주하여 우선 배치
            const isInRegionA = distanceA <= 50;
            const isInRegionB = distanceB <= 50;

            if (isInRegionA && !isInRegionB) return -1; // A가 지역 내, B가 지역 외
            if (!isInRegionA && isInRegionB) return 1; // A가 지역 외, B가 지역 내

            // 둘 다 지역 내이거나 둘 다 지역 외면 거리순 정렬
            return distanceA - distanceB;
          });

          const inRegionCount = filteredFestivals.filter((festival) => {
            const distance = calculateDistance(
              areaCenter.lat,
              areaCenter.lng,
              festival.lat,
              festival.lng
            );
            return distance <= 50;
          }).length;

          console.log(
            `🎯 지역 우선 정렬 완료: ${areaCenter.name} 지역 내 축제 ${inRegionCount}개를 앞으로 배치`
          );
        }

        // 3단계: 축제 간 거리 기반 필터링 (근거리 코스 구성)
        let finalFestivals = filterByDistance(filteredFestivals, areaCode);

        // 데이터가 너무 많으면 거리 순으로 정렬하여 가까운 곳 우선 선택
        if (finalFestivals.length > 20) {
          const areaCenter = getAreaCenter(areaCode);
          finalFestivals = finalFestivals
            .map((festival) => ({
              ...festival,
              distance: calculateDistance(
                areaCenter.lat,
                areaCenter.lng,
                festival.lat,
                festival.lng
              ),
            }))
            .sort((a, b) => a.distance - b.distance) // 거리 순 정렬
            .slice(0, 15) // 상위 15개만 선택
            .map(({ distance, ...festival }) => festival); // distance 제거

          console.log(`📍 거리 순 정렬로 ${finalFestivals.length}개 선별`);
        }

        if (finalFestivals.length > 0) {
          console.log("🎉 Tour API 데이터 반환:", finalFestivals);

          // 🎯 지역 검색 결과 품질 검증 (해당 지역 축제가 실제로 있는지 확인)
          if (areaCode && endpoint.name === "지역기반관광정보") {
            const areaCenter = getAreaCenter(areaCode);
            const inRegionFestivals = finalFestivals.filter((festival) => {
              const distance = calculateDistance(
                areaCenter.lat,
                areaCenter.lng,
                festival.lat,
                festival.lng
              );
              return distance <= 100; // 100km 이내를 해당 지역으로 간주
            });

            console.log(
              `🔍 ${areaCenter.name} 지역 내 축제: ${inRegionFestivals.length}개`
            );

            // 해당 지역 축제가 없는 경우 로그만 출력
            if (inRegionFestivals.length === 0) {
              console.log(
                `⚠️ ${areaCenter.name} 지역에 현재 진행중인 축제가 없습니다.`
              );
              console.log("💡 다른 지역이나 키워드로 검색해보세요.");
            }
          }

          // 지역 기반 검색에서 충분한 결과가 나왔으면 추가 검색 중단
          if (
            endpoint.name === "지역기반관광정보" &&
            finalFestivals.length >= 5
          ) {
            console.log("✅ 지역 검색에서 충분한 결과 확보, 추가 검색 생략");
            return finalFestivals;
          }

          // 키워드 검색에서 결과가 나왔으면 추가 검색 중단
          if (endpoint.name === "키워드검색" && finalFestivals.length >= 3) {
            console.log("✅ 키워드 검색에서 충분한 결과 확보, 추가 검색 생략");
            return finalFestivals;
          }

          return finalFestivals;
        }

        console.warn(`🚫 ${endpoint.name}: 필터링 후 결과 없음`);
        return tryApiEndpoint(endpointIndex + 1);
      })
      .catch((error) => {
        console.error(
          `❌ ${endpoint.name} 오류:`,
          error.message,
          `(재시도: ${retryCount + 1})`
        );

        // 🔍 키워드 검색 오류 특별 처리
        if (endpoint.name === "키워드검색") {
          console.log("⚠️ 키워드 검색 실패 - 다음 엔드포인트로 즉시 이동");
          console.log("💡 키워드 검색은 선택적 기능이므로 실패해도 계속 진행");
          return tryApiEndpoint(endpointIndex + 1, 0);
        }

        if (retryCount < 2 && !error.message.includes("abort")) {
          // 네트워크 오류인 경우만 재시도 (abort 오류 제외)
          console.log(`네트워크 오류로 인한 재시도: ${retryCount + 1}/2`);
          return new Promise((resolve) => {
            setTimeout(
              () => resolve(tryApiEndpoint(endpointIndex, retryCount + 1)),
              2000
            );
          });
        }
        return tryApiEndpoint(endpointIndex + 1, 0);
      });
  };

  // 첫 번째 엔드포인트부터 시작 (오류 시 빈 배열 반환으로 안전성 확보)
  return tryApiEndpoint(0).catch((error) => {
    console.log("🔄 빈 데이터로 AI 응답 계속 진행");
    return []; // 빈 배열 반환으로 AI가 기본 코스 생성
  });
};

// 축제 상세 정보 가져오기 함수 (축제 정보 요약 섹션용)
const fetchFestivalDetail = async (contentId) => {
  try {
    const serviceKey = import.meta.env.VITE_TOURAPI_KEY;
    if (!serviceKey) {
      console.warn("TourAPI 키가 없어 상세 정보를 가져올 수 없습니다.");
      return null;
    }

    // 공통정보 조회 API 호출 (이미지 정보 강화)
    const detailUrl = `/api/B551011/KorService2/detailCommon2?serviceKey=${encodeURIComponent(
      serviceKey
    )}&MobileOS=ETC&MobileApp=Festive&_type=json&contentId=${contentId}&defaultYN=Y&firstImageYN=Y&areacodeYN=Y&addrinfoYN=Y&mapinfoYN=Y&overviewYN=Y`;

    console.log("🔍 축제 상세 정보 요청:", contentId);

    const response = await fetch(detailUrl);
    const data = await response.json();

    const item =
      data?.response?.body?.items?.item?.[0] ||
      data?.response?.body?.items?.item;

    if (!item) {
      console.warn("축제 상세 정보를 찾을 수 없습니다:", contentId);
      return null;
    }

    // 🖼️ 상세 이미지 정보 로깅
    console.log("🖼️ ===== 축제 상세 이미지 검증 =====");
    console.log("📋 상세 정보 축제명:", item.title);
    console.log("🖼️ 상세 firstimage:", item.firstimage || "❌ 없음");
    console.log("🖼️ 상세 firstimage2:", item.firstimage2 || "❌ 없음");

    const detailImage = item.firstimage || item.firstimage2;
    if (detailImage) {
      console.log("✅ 상세 이미지 URL 발견:", detailImage);
    } else {
      console.log("❌ 상세 정보에서도 축제 포스터 이미지 없음");
      console.log("💡 이달의축제 컴포넌트처럼 placeholder 이미지 사용");
    }
    console.log("🖼️ ===== 상세 이미지 검증 완료 =====");

    return {
      id: item.contentid,
      title: item.title,
      image: detailImage || "https://via.placeholder.com/400x300?text=No+Image",
      overview: item.overview || "상세 설명이 없습니다.",
      addr: item.addr1 || "주소 정보 없음",
      tel: item.tel || "연락처 정보 없음",
      homepage: item.homepage || "",
    };
  } catch (error) {
    console.error("축제 상세 정보 가져오기 실패:", error);
    return null;
  }
};

// OpenAI 프롬프트 생성 함수 (지역 재사용 기능 강화)
const createFestivalPrompt = (
  festivals,
  userQuery,
  currentRegion = "",
  isReuse = false
) => {
  console.log("🤖 OpenAI 프롬프트 생성 시작");
  console.log("📍 현재 지역:", currentRegion);
  console.log("♻️ 데이터 재사용:", isReuse);

  if (!festivals || festivals.length === 0) {
    // 🎯 축제 데이터가 없어도 해당 지역의 기본 여행코스 제공
    const areaCode = extractAreaCode(userQuery);
    const regionName = extractAreaName(areaCode) || currentRegion || "추천";
    const areaCenter = getAreaCenter(areaCode);

    console.log(`🔧 축제 데이터 없음 - ${regionName} 지역 기본 코스 생성`);

    // 지역별 기본 좌표와 관광지 정보
    const defaultSpots = [
      {
        name: `${regionName} 대표 관광지`,
        lat: areaCenter ? areaCenter.lat : 37.5665,
        lng: areaCenter ? areaCenter.lng : 126.978,
      },
      {
        name: `${regionName} 문화시설`,
        lat: areaCenter ? areaCenter.lat + 0.01 : 37.5765,
        lng: areaCenter ? areaCenter.lng + 0.01 : 126.988,
      },
      {
        name: `${regionName} 맛집거리`,
        lat: areaCenter ? areaCenter.lat - 0.01 : 37.5565,
        lng: areaCenter ? areaCenter.lng + 0.01 : 126.988,
      },
    ];

    // 🎯 기본 추천에서도 사용자 요청 기간 추출
    const durationPattern =
      /(\d+박\s*\d+일|\d+박|\d+일|4박5일|3박4일|2박3일|1박2일|당일|당일치기|주말|연휴)/gi;
    const durationMatches = userQuery.match(durationPattern);

    let defaultDuration = "1박2일"; // 기본값

    if (durationMatches && durationMatches.length > 0) {
      const sortedMatches = durationMatches.sort((a, b) => {
        const priorities = {
          "4박5일": 5,
          "4박": 5,
          "3박4일": 4,
          "3박": 4,
          "2박3일": 3,
          "2박": 3,
          "1박2일": 2,
          "1박": 2,
          당일: 1,
          당일치기: 1,
          주말: 1,
          연휴: 1,
        };
        return (
          (priorities[b.toLowerCase()] || 0) -
          (priorities[a.toLowerCase()] || 0)
        );
      });

      defaultDuration = sortedMatches[0];

      // 정규화
      if (defaultDuration.includes("4박") && !defaultDuration.includes("5일")) {
        defaultDuration = "4박5일";
      } else if (
        defaultDuration.includes("3박") &&
        !defaultDuration.includes("4일")
      ) {
        defaultDuration = "3박4일";
      } else if (
        defaultDuration.includes("2박") &&
        !defaultDuration.includes("3일")
      ) {
        defaultDuration = "2박3일";
      } else if (
        defaultDuration.includes("1박") &&
        !defaultDuration.includes("2일")
      ) {
        defaultDuration = "1박2일";
      }
    }

    console.log("🎯 기본 추천 여행 기간:", defaultDuration);

    // 기간별 코스 생성
    const generateBasicCourse = (duration) => {
      if (
        duration.includes("4박5일") ||
        duration.includes("4박") ||
        duration.includes("5일")
      ) {
        return `
[Day 1 코스]
1. **오전 09:00** - ${defaultSpots[0].name}
   @location:[${defaultSpots[0].lat},${defaultSpots[0].lng}] @day:1
   포인트: ${regionName}의 대표적인 관광명소로 시작

2. **오후 12:00** - ${defaultSpots[1].name}
   @location:[${defaultSpots[1].lat},${defaultSpots[1].lng}] @day:1
   포인트: 문화와 역사를 느낄 수 있는 공간

3. **오후 15:00** - ${defaultSpots[2].name}
   @location:[${defaultSpots[2].lat},${defaultSpots[2].lng}] @day:1
   포인트: 지역 특색 음식과 쇼핑을 즐길 수 있는 곳

[Day 2 코스]
1. **오전 09:00** - ${regionName} 자연명소
   @location:[${defaultSpots[0].lat + 0.01},${
          defaultSpots[0].lng + 0.01
        }] @day:2
   포인트: 자연과 함께하는 힐링 시간

2. **오후 12:00** - ${regionName} 전통시장
   @location:[${defaultSpots[1].lat + 0.01},${
          defaultSpots[1].lng - 0.01
        }] @day:2
   포인트: 지역 맛집과 특산품 체험

3. **오후 15:00** - ${regionName} 문화센터
   @location:[${defaultSpots[2].lat - 0.01},${
          defaultSpots[2].lng + 0.01
        }] @day:2
   포인트: 지역 문화와 예술 감상

[Day 3 코스]
1. **오전 09:00** - ${regionName} 역사유적지
   @location:[${defaultSpots[0].lat - 0.01},${
          defaultSpots[0].lng - 0.01
        }] @day:3
   포인트: 역사와 전통을 느끼는 시간

2. **오후 12:00** - ${regionName} 체험관
   @location:[${defaultSpots[1].lat - 0.01},${
          defaultSpots[1].lng + 0.01
        }] @day:3
   포인트: 직접 체험하며 배우는 문화

3. **오후 15:00** - ${regionName} 전망대
   @location:[${defaultSpots[2].lat + 0.01},${
          defaultSpots[2].lng - 0.01
        }] @day:3
   포인트: 아름다운 경치와 사진 촬영

[Day 4 코스]
1. **오전 09:00** - ${regionName} 공원
   @location:[${defaultSpots[0].lat + 0.02},${defaultSpots[0].lng}] @day:4
   포인트: 여유로운 산책과 휴식

2. **오후 12:00** - ${regionName} 카페거리
   @location:[${defaultSpots[1].lat},${defaultSpots[1].lng + 0.02}] @day:4
   포인트: 현지 카페 문화 체험

3. **오후 15:00** - ${regionName} 쇼핑몰
   @location:[${defaultSpots[2].lat - 0.02},${defaultSpots[2].lng}] @day:4
   포인트: 마지막 쇼핑과 기념품 구매

[Day 5 코스]
1. **오전 09:00** - ${regionName} 온천/스파
   @location:[${defaultSpots[0].lat},${defaultSpots[0].lng - 0.02}] @day:5
   포인트: 여행 마무리 힐링 타임

2. **오후 12:00** - ${regionName} 맛집거리
   @location:[${defaultSpots[1].lat + 0.02},${defaultSpots[1].lng}] @day:5
   포인트: 마지막 현지 맛집 탐방`;
      } else if (
        duration.includes("2박3일") ||
        duration.includes("2박") ||
        duration.includes("3일")
      ) {
        return `
[Day 1 코스]
1. **오전 09:00** - ${defaultSpots[0].name}
   @location:[${defaultSpots[0].lat},${defaultSpots[0].lng}] @day:1
   포인트: ${regionName}의 대표적인 관광명소로 시작

2. **오후 12:00** - ${defaultSpots[1].name}
   @location:[${defaultSpots[1].lat},${defaultSpots[1].lng}] @day:1
   포인트: 문화와 역사를 느낄 수 있는 공간

3. **오후 15:00** - ${defaultSpots[2].name}
   @location:[${defaultSpots[2].lat},${defaultSpots[2].lng}] @day:1
   포인트: 지역 특색 음식과 쇼핑을 즐길 수 있는 곳

[Day 2 코스]
1. **오전 09:00** - ${regionName} 자연명소
   @location:[${defaultSpots[0].lat + 0.01},${
          defaultSpots[0].lng + 0.01
        }] @day:2
   포인트: 자연과 함께하는 힐링 시간

2. **오후 12:00** - ${regionName} 전통시장
   @location:[${defaultSpots[1].lat + 0.01},${
          defaultSpots[1].lng - 0.01
        }] @day:2
   포인트: 지역 맛집과 특산품 체험

3. **오후 15:00** - ${regionName} 문화센터
   @location:[${defaultSpots[2].lat - 0.01},${
          defaultSpots[2].lng + 0.01
        }] @day:2
   포인트: 지역 문화와 예술 감상

[Day 3 코스]
1. **오전 09:00** - ${regionName} 역사유적지
   @location:[${defaultSpots[0].lat - 0.01},${
          defaultSpots[0].lng - 0.01
        }] @day:3
   포인트: 역사와 전통을 마지막으로 체험

2. **오후 12:00** - ${regionName} 맛집거리
   @location:[${defaultSpots[1].lat - 0.01},${
          defaultSpots[1].lng + 0.01
        }] @day:3
   포인트: 여행 마무리 현지 맛집 탐방`;
      } else {
        return `
[추천 코스]
1. **오전 09:00** - ${defaultSpots[0].name}
   @location:[${defaultSpots[0].lat},${defaultSpots[0].lng}] @day:1
   포인트: ${regionName}의 대표적인 관광명소로 시작

2. **오후 12:00** - ${defaultSpots[1].name}
   @location:[${defaultSpots[1].lat},${defaultSpots[1].lng}] @day:1
   포인트: 문화와 역사를 느낄 수 있는 공간

3. **오후 15:00** - ${defaultSpots[2].name}
   @location:[${defaultSpots[2].lat},${defaultSpots[2].lng}] @day:1
   포인트: 지역 특색 음식과 쇼핑을 즐길 수 있는 곳`;
      }
    };

    return `🎯 ${regionName} 지역 ${defaultDuration} 여행코스를 추천드립니다!

[지역 소개] 
${regionName}은 한국의 아름다운 관광지로 다양한 볼거리와 즐길거리가 가득한 곳입니다.
풍부한 문화유산과 자연경관을 동시에 즐길 수 있어 많은 여행객들이 찾는 인기 여행지입니다.

${generateBasicCourse(defaultDuration)}

[교통정보] 대중교통 또는 자가용 이용 가능
[여행 꿀팁] 계절별 특색 있는 행사나 축제가 있으니 미리 확인해보세요!

💡 더 구체적인 축제나 관광지를 원하시면 "축제명"이나 "관심있는 활동"을 함께 말씀해주세요!`;
  }

  console.log(`✅ ${festivals.length}개 Tour API 실제 데이터로 프롬프트 생성`);

  // 🎯 여행 기간 추출 개선 (사용자 입력에서 직접 추출)
  console.log("🔍 여행 기간 추출 시작 - 원본 쿼리:", userQuery);

  const durationPattern =
    /(\d+박\s*\d+일|\d+박|\d+일|4박5일|3박4일|2박3일|1박2일|당일|당일치기|주말|연휴)/gi;
  const durationMatches = userQuery.match(durationPattern);

  let duration = "당일치기"; // 기본값

  if (durationMatches && durationMatches.length > 0) {
    // 가장 구체적인 기간을 우선 선택
    const sortedMatches = durationMatches.sort((a, b) => {
      // 4박5일 > 3박4일 > 2박3일 > 1박2일 > 당일 순으로 우선순위
      const priorities = {
        "4박5일": 5,
        "4박": 5,
        "3박4일": 4,
        "3박": 4,
        "2박3일": 3,
        "2박": 3,
        "1박2일": 2,
        "1박": 2,
        당일: 1,
        당일치기: 1,
        주말: 1,
        연휴: 1,
      };

      return (
        (priorities[b.toLowerCase()] || 0) - (priorities[a.toLowerCase()] || 0)
      );
    });

    duration = sortedMatches[0];
    console.log("✅ 여행 기간 감지됨:", duration);
  } else {
    console.log("⚠️ 여행 기간을 찾을 수 없어 기본값 사용:", duration);
  }

  // 4박5일, 3박4일 등을 정규화
  if (duration.includes("4박") && !duration.includes("5일")) {
    duration = "4박5일";
  } else if (duration.includes("3박") && !duration.includes("4일")) {
    duration = "3박4일";
  } else if (duration.includes("2박") && !duration.includes("3일")) {
    duration = "2박3일";
  } else if (duration.includes("1박") && !duration.includes("2일")) {
    duration = "1박2일";
  }

  console.log("🎯 최종 여행 기간:", duration);

  // 지역 정보 텍스트 생성
  const regionContext = currentRegion ? `${currentRegion} 지역` : "해당 지역";
  const contextMessage = isReuse
    ? `현재 ${regionContext}의 관광지 데이터를 기반으로 사용자의 추가 요청에 답변해주세요.`
    : `${regionContext}의 관광지 정보를 바탕으로 여행 코스를 추천해주세요.`;

  // 축제/행사와 관광지 구분
  const festivalData = festivals.filter(
    (item) =>
      item.title.includes("축제") ||
      item.title.includes("페스티벌") ||
      item.title.includes("행사") ||
      item.title.includes("이벤트") ||
      item.title.includes("문화제") ||
      item.contentTypeId === "15"
  );

  // 🎲 랜덤 축제 선택 (다양성 확보)
  const shuffledFestivals = [...festivals].sort(() => Math.random() - 0.5);
  const mainFestival = shuffledFestivals[0];

  // 메인 축제 주변의 다른 관광지들을 랜덤하게 3개 선택
  const remainingAttractions = shuffledFestivals.slice(1);
  const nearbyAttractions = remainingAttractions
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  console.log(
    `🎲 랜덤 선택 완료 - 메인축제: ${mainFestival.title}, 주변관광지: ${nearbyAttractions.length}개`
  );

  return `${contextMessage}

사용자 요청: "${userQuery}"
${currentRegion ? `지역: ${currentRegion}` : ""}
여행 기간: ${duration}

**핵심 기준지**: ${mainFestival.title}
위치: ${mainFestival.location} @location:[${mainFestival.lat},${
    mainFestival.lng
  }]
📝 소개: ${mainFestival.overview.substring(0, 150)}...

**주변 추천지** (${nearbyAttractions.length}개):
${nearbyAttractions
  .map(
    (item, index) =>
      `${index + 1}. ${item.title}
${item.location} @location:[${item.lat},${item.lng}]
${item.overview.substring(0, 100)}...`
  )
  .join("\n\n")}

**현실적인 여행코스 구성 가이드**:
${
  isReuse
    ? `위의 데이터를 활용하여 사용자의 추가 질문에 답변해주세요.`
    : `
**이동거리 제한** (매우 중요!):
- 기준지에서 40km 이내 장소만 포함 (편도 1시간 이내)
- 장소 간 이동시간 15-30분 이내 유지
- 하루 총 이동거리 80km 이하로 제한

**시간 배분 원칙**:
- 각 장소 체류시간: 최소 1-2시간 확보
- 식사시간: 1시간 이상 여유롭게 배정  
- 이동시간: 실제 교통상황 고려 (1.5배 여유)

**코스 구성 순서**:
1. "${mainFestival.title}"을 핵심 기준지로 설정
2. 기준지 중심 20km 이내 필수 관광지 선별
3. 동선 최적화: 시계방향/반시계방향 순환 코스
4. 점심/저녁 식사 장소를 이동 동선에 맞춰 배치`
}

**🚨 절대 필수 답변 형식** (위치정보 없으면 절대 안됨!):
[지역 소개] ${regionContext} 특색과 "${mainFestival.title}" 중심지 소개

${
  duration.includes("4박5일") ||
  duration.includes("4박") ||
  duration.includes("5일")
    ? `
**🎯 4박5일 전체 일정 (Day 1~5 모두 작성 필수!)**:

[Day 1 코스]
1. **오전 09:00** - ${mainFestival.title}
   @location:[${mainFestival.lat},${mainFestival.lng}] @day:1
   포인트: 기준지점, 체류시간 2시간
   
2. **오후 12:00** - ${
        nearbyAttractions[0] ? nearbyAttractions[0].title : "점심 식사 장소"
      }
   @location:[${
     nearbyAttractions[0] ? nearbyAttractions[0].lat : mainFestival.lat + 0.01
   },${
        nearbyAttractions[0]
          ? nearbyAttractions[0].lng
          : mainFestival.lng + 0.01
      }] @day:1
   포인트: 이동거리 XX km, 체류시간 1.5시간
   
3. **오후 15:00** - ${
        nearbyAttractions[1] ? nearbyAttractions[1].title : "오후 관광지"
      }
   @location:[${
     nearbyAttractions[1] ? nearbyAttractions[1].lat : mainFestival.lat - 0.01
   },${
        nearbyAttractions[1]
          ? nearbyAttractions[1].lng
          : mainFestival.lng + 0.01
      }] @day:1
   포인트: 이동거리 XX km, 체류시간 1시간

[Day 2 코스]
1. **오전 09:00** - 관광지명
   @location:[위도,경도] @day:2
   포인트: 특별한 매력

2. **오후 12:00** - 관광지명
   @location:[위도,경도] @day:2
   포인트: 특별한 매력

3. **오후 15:00** - 관광지명
   @location:[위도,경도] @day:2
   포인트: 특별한 매력

[Day 3 코스]
1. **오전 09:00** - 관광지명
   @location:[위도,경도] @day:3
   포인트: 특별한 매력

2. **오후 12:00** - 관광지명
   @location:[위도,경도] @day:3
   포인트: 특별한 매력

3. **오후 15:00** - 관광지명
   @location:[위도,경도] @day:3
   포인트: 특별한 매력

[Day 4 코스]
1. **오전 09:00** - 관광지명
   @location:[위도,경도] @day:4
   포인트: 특별한 매력

2. **오후 12:00** - 관광지명
   @location:[위도,경도] @day:4
   포인트: 특별한 매력

3. **오후 15:00** - 관광지명
   @location:[위도,경도] @day:4
   포인트: 특별한 매력

[Day 5 코스]
1. **오전 09:00** - 관광지명
   @location:[위도,경도] @day:5
   포인트: 특별한 매력

2. **오후 12:00** - 관광지명
   @location:[위도,경도] @day:5
   포인트: 특별한 매력
`
    : `
[현실적인 ${duration} 코스] 
1. **오전 09:00** - ${mainFestival.title}
   @location:[${mainFestival.lat},${mainFestival.lng}] @day:1
   포인트: 기준지점, 체류시간 2시간
   
2. **오후 12:00** - ${
        nearbyAttractions[0] ? nearbyAttractions[0].title : "점심 식사 장소"
      }
   @location:[${
     nearbyAttractions[0] ? nearbyAttractions[0].lat : mainFestival.lat + 0.01
   },${
        nearbyAttractions[0]
          ? nearbyAttractions[0].lng
          : mainFestival.lng + 0.01
      }] @day:1
   포인트: 이동거리 XX km, 체류시간 1.5시간
   
3. **오후 15:00** - ${
        nearbyAttractions[1] ? nearbyAttractions[1].title : "오후 관광지"
      }
   @location:[${
     nearbyAttractions[1] ? nearbyAttractions[1].lat : mainFestival.lat - 0.01
   },${
        nearbyAttractions[1]
          ? nearbyAttractions[1].lng
          : mainFestival.lng + 0.01
      }] @day:1
   포인트: 이동거리 XX km, 체류시간 1시간
`
}

[교통정보] 최적 루트와 소요시간
[여행 꿀팁] 시간대별 추천과 절약 팁

**🚨🚨🚨 극도로 중요**: 
- 4박5일이면 Day 1~5까지 모든 일정을 반드시 작성하세요!
- **Day별 섹션을 명확히 구분하세요: [Day 1 코스], [Day 2 코스], [Day 3 코스] 형식 필수!**
- 각 장소마다 @location:[위도,경도] @day:숫자 형식을 절대 빼먹지 마세요!
- 숫자는 반드시 소수점 형태여야 합니다 (예: 37.5665, 126.9780)
- @day:1, @day:2, @day:3, @day:4, @day:5 등 Day 번호도 반드시 포함하세요!
- 위치정보가 없으면 지도에 표시되지 않습니다!

**🎯 Day별 구분 필수 형식**:
[Day 1 코스]
1. **오전 09:00** - 장소명 @location:[37.5665,126.9780] @day:1
2. **오후 12:00** - 장소명 @location:[37.5665,126.9780] @day:1

[Day 2 코스]  
1. **오전 09:00** - 장소명 @location:[37.5665,126.9780] @day:2
2. **오후 12:00** - 장소명 @location:[37.5665,126.9780] @day:2

**절대 지켜야 할 규칙**: 반드시 [Day X 코스] 헤더로 Day를 구분하세요!`;
};

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
  const [currentFestivalData, setCurrentFestivalData] = useState([]); // 현재 검색된 축제 데이터
  const [currentRegion, setCurrentRegion] = useState(""); // 현재 검색된 지역
  const [selectedMainFestival, setSelectedMainFestival] = useState(null); // 선택된 메인 축제 (고정)

  // 지능형 사용자 분석 상태
  const [userProfile, setUserProfile] = useState({
    travelStyle: "unknown", // cultural, nature, adventure, relaxation, foodie
    preferredDuration: "unknown", // day-trip, 1night, 2nights, long-term
    budgetLevel: "unknown", // budget, standard, luxury
    companions: "unknown", // solo, couple, family, friends
    interests: [], // [culture, food, nature, festival, shopping, photography]
    visitedRegions: [], // 방문했거나 관심 있는 지역들
    questionPatterns: [], // 질문 패턴 분석
  });
  const mapRef = useRef(null);
  const chatContainerRef = useRef(null);

  // 🎯 메인 축제 선택 (currentFestivalData 변경 시 한번만 실행)
  useEffect(() => {
    if (currentFestivalData && currentFestivalData.length > 0) {
      console.log(
        "🎪 메인 축제 선택 시작:",
        currentFestivalData.length,
        "개 축제"
      );

      // 1단계: 이미지가 있는 축제들만 필터링
      const festivalsWithImages = currentFestivalData.filter((festival) => {
        const hasImage =
          (festival.firstimage && festival.firstimage.trim() !== "") ||
          (festival.firstimage2 && festival.firstimage2.trim() !== "");
        return hasImage;
      });

      console.log("🖼️ 이미지가 있는 축제 수:", festivalsWithImages.length);

      // 2단계: 우선순위별 선택
      const today = new Date();

      // 현재 진행중인 축제 중 이미지가 있는 것
      const ongoingFestivals = festivalsWithImages.filter((festival) => {
        const startDate = festival.eventstartdate
          ? new Date(
              festival.eventstartdate.replace(
                /(\d{4})(\d{2})(\d{2})/,
                "$1-$2-$3"
              )
            )
          : null;
        const endDate = festival.eventenddate
          ? new Date(
              festival.eventenddate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
            )
          : null;

        return startDate && endDate && today >= startDate && today <= endDate;
      });

      // 예정된 축제 중 이미지가 있는 것
      const upcomingFestivals = festivalsWithImages.filter((festival) => {
        const startDate = festival.eventstartdate
          ? new Date(
              festival.eventstartdate.replace(
                /(\d{4})(\d{2})(\d{2})/,
                "$1-$2-$3"
              )
            )
          : null;

        return startDate && startDate > today;
      });

      console.log("📅 진행중 축제 수:", ongoingFestivals.length);
      console.log("🔮 예정 축제 수:", upcomingFestivals.length);

      // 3단계: 랜덤 선택으로 다양성 확보 (한번만 실행)
      let mainFestival = null;
      if (ongoingFestivals.length > 0) {
        const randomIndex = Math.floor(Math.random() * ongoingFestivals.length);
        mainFestival = ongoingFestivals[randomIndex];
        console.log("✅ 진행중 축제 랜덤 선택:", mainFestival.title);
      } else if (upcomingFestivals.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * upcomingFestivals.length
        );
        mainFestival = upcomingFestivals[randomIndex];
        console.log("✅ 예정 축제 랜덤 선택:", mainFestival.title);
      } else if (festivalsWithImages.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * festivalsWithImages.length
        );
        mainFestival = festivalsWithImages[randomIndex];
        console.log("✅ 이미지 있는 축제 랜덤 선택:", mainFestival.title);
      } else {
        const randomIndex = Math.floor(
          Math.random() * currentFestivalData.length
        );
        mainFestival = currentFestivalData[randomIndex];
        console.log("⚠️ 전체 축제 중 랜덤 선택:", mainFestival?.title);
      }

      setSelectedMainFestival(mainFestival);
      console.log("🎯 메인 축제 고정 선택 완료:", mainFestival?.title);
    } else {
      setSelectedMainFestival(null);
      console.log("🚫 축제 데이터 없음 - 메인 축제 초기화");
    }
  }, [currentFestivalData]);

  // 카카오맵 스크립트 동적 로드
  useEffect(() => {
    const loadKakaoMapScript = () => {
      return new Promise((resolve, reject) => {
        // 이미 로드된 경우 바로 resolve
        if (window.kakao && window.kakao.maps) {
          console.log("✅ 카카오맵 SDK 이미 로드됨");
          resolve();
          return;
        }

        const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
        console.log(
          "🔑 카카오맵 API 키 확인:",
          apiKey ? `설정됨 (${apiKey.substring(0, 10)}...)` : "설정되지 않음"
        );

        if (!apiKey) {
          console.error("VITE_KAKAO_MAP_API_KEY가 설정되지 않았습니다!");
          console.error(
            "📋 .env 파일에 VITE_KAKAO_MAP_API_KEY=발급받은_키 를 추가해주세요"
          );
          reject(new Error("카카오맵 API 키가 없습니다"));
          return;
        }

        // 기존 스크립트 제거 (중복 로드 방지)
        const existingScript = document.querySelector(
          'script[src*="dapi.kakao.com"]'
        );
        if (existingScript) {
          console.log("기존 카카오맵 스크립트 제거");
          existingScript.remove();
        }

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;

        console.log("📡 카카오맵 SDK 로딩 시작:", script.src);

        script.onload = () => {
          console.log("✅ 카카오맵 스크립트 로드 완료");

          // 카카오맵 객체 확인
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              console.log("카카오맵 SDK 초기화 완료");
              resolve();
            });
          } else {
            console.error("카카오맵 객체가 생성되지 않았습니다");
            console.error(
              "API 키가 유효하지 않거나 도메인 설정에 문제가 있을 수 있습니다"
            );
            console.warn("⚠️ 카카오맵 없이 계속 진행합니다.");
            resolve(); // 오류가 있어도 계속 진행
          }
        };

        script.onerror = (error) => {
          console.error("카카오맵 SDK 로드 실패:", error);
          console.error("🔧 해결 방법:");
          console.error("1. 카카오 개발자 콘솔에서 API 키 확인");
          console.error("2. 플랫폼 등록 상태 확인 (Web 플랫폼)");
          console.error("3. 도메인 설정 확인 (localhost 포함)");
          console.warn("카카오맵 없이 계속 진행합니다.");
          resolve(); // 오류가 있어도 계속 진행
        };

        document.head.appendChild(script);
      });
    };

    const initializeMap = async () => {
      try {
        console.log("지도 초기화 프로세스 시작");

        if (!window.kakao || !window.kakao.maps) {
          console.log("카카오맵 SDK 로딩 필요");
          await loadKakaoMapScript();
        }

        // 지도 컨테이너 확인
        const mapContainer = document.getElementById("kakao-map");
        if (!mapContainer) {
          console.error("지도를 표시할 div를 찾을 수 없습니다.");
          console.error("HTML에서 id='kakao-map'인 요소를 확인해주세요");
          console.error("현재 DOM 상태:", document.querySelector("#kakao-map"));

          // 지도 컨테이너에 대체 메시지 표시
          const fallbackContainer = document.createElement("div");
          fallbackContainer.id = "kakao-map";
          fallbackContainer.style.cssText = `
            width: 100%;
            height: 400px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            color: #666;
            font-size: 14px;
          `;
          fallbackContainer.innerHTML =
            "🗺️ 지도를 불러올 수 없습니다.<br>위치 정보는 텍스트로 제공됩니다.";

          const mapSection = document.querySelector(".ai-chatbot-map-section");
          if (mapSection) {
            mapSection.appendChild(fallbackContainer);
          }
          return;
        }

        console.log("지도 컨테이너 찾음:", mapContainer);
        console.log("컨테이너 크기:", {
          width: mapContainer.offsetWidth,
          height: mapContainer.offsetHeight,
        });

        // 컨테이너 크기가 0인 경우 대기 (최대 5회 재시도)
        if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
          const retryCount = mapContainer.dataset.retryCount || 0;
          if (retryCount < 5) {
            console.warn(
              `지도 컨테이너 크기가 0입니다. 재시도 ${retryCount + 1}/5`
            );
            mapContainer.dataset.retryCount = retryCount + 1;
            setTimeout(() => initializeMap(), 200);
            return;
          } else {
            console.warn("지도 초기화 재시도 횟수 초과. 대체 지도 표시");
            mapContainer.style.cssText = `
              width: 100%;
              height: 400px;
              background: #f5f5f5;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              color: #666;
              font-size: 14px;
            `;
            mapContainer.innerHTML = "🗺️ 지도 로딩 중...";
            return;
          }
        }

        console.log("🗺️ 지도 초기화 시작");

        // 카카오맵 객체가 없는 경우 대체 처리
        if (!window.kakao || !window.kakao.maps) {
          console.warn("카카오맵 객체가 없어 대체 지도 표시");
          mapContainer.style.cssText = `
            width: 100%;
            height: 400px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            color: #666;
            font-size: 14px;
            flex-direction: column;
            gap: 10px;
          `;
          mapContainer.innerHTML = `
            <div>🗺️ 지도 서비스 일시 중단</div>
            <div style="font-size: 12px;">위치 정보는 텍스트로 제공됩니다</div>
          `;
          return;
        }

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

        // 지도 클릭 이벤트 (테스트용)
        window.kakao.maps.event.addListener(map, "click", () => {
          console.log("지도 클릭됨 - 지도가 정상 작동중");
        });

        // 지도 크기 재조정
        setTimeout(() => {
          if (map) {
            map.relayout();
            console.log("지도 크기 재조정 완료");
          }
        }, 100);
      } catch (error) {
        console.error("지도 초기화 중 오류 발생:", error);
        console.error("상세 오류:", error.message);
        console.error("해결 방법:");
        console.error("1. 카카오 개발자 콘솔에서 API 키 확인");
        console.error("2. 도메인 등록 상태 확인");
        console.error("3. 브라우저 콘솔에서 네트워크 탭 확인");
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

  // 지도 마커 및 거리 표시 업데이트 (안정성 개선)
  useEffect(() => {
    // 디바운싱으로 과도한 실행 방지
    const timeoutId = setTimeout(() => {
      try {
        const map = mapRef.current;
        if (
          !map ||
          !window.kakao ||
          !window.kakao.maps ||
          locations.length === 0
        ) {
          console.log("지도 또는 카카오맵 객체가 없어 마커 표시 생략");
          return;
        }

        console.log("마커 및 거리 표시 업데이트 시작 - locations:", locations);
        console.log("현재 travelInfo:", travelInfo);

        // 기존 오버레이들 제거
        if (map._overlays) {
          map._overlays.forEach((overlay) => {
            if (overlay) overlay.setMap(null);
          });
        }
        map._overlays = [];

        // 지도 범위 객체 생성
        const bounds = new window.kakao.maps.LatLngBounds();

        // Day별 색상 정의
        const dayColors = {
          1: "#ff4757", // 빨간색 (Day 1)
          2: "#2196F3", // 파란색 (Day 2)
          3: "#4CAF50", // 초록색 (Day 3)
          4: "#FF9800", // 주황색 (Day 4)
          5: "#9C27B0", // 보라색 (Day 5)
          default: "#607D8B", // 회색 (기본)
        };

        // 각 위치에 day별 색상의 마커 생성 (겹침 방지 처리)
        locations.forEach((loc, index) => {
          // 마커 겹침 방지를 위한 약간의 좌표 조정
          const offsetLat = ((index % 3) - 1) * 0.0001; // -0.0001, 0, 0.0001
          const offsetLng = ((Math.floor(index / 3) % 3) - 1) * 0.0001;
          const position = new window.kakao.maps.LatLng(
            loc.lat + offsetLat,
            loc.lng + offsetLng
          );

          // Day별 색상 결정
          const dayColor = dayColors[loc.day] || dayColors.default;

          // 커스텀 마커 (실제 좌표 vs 기본 좌표 구분)
          const isRealCoordinate = loc.hasRealCoordinates !== false; // 기본값 true (이전 데이터 호환)
          const markerColor = isRealCoordinate ? dayColor : "#95a5a6"; // day별 색상 vs 회색
          const borderColor = isRealCoordinate ? "white" : "#7f8c8d";

          // Day별 마커 번호 계산 (각 Day별로 1부터 시작)
          const dayLocations = locations.filter((l) => l.day === loc.day);
          const dayIndex =
            dayLocations.findIndex(
              (l) => l.lat === loc.lat && l.lng === loc.lng
            ) + 1;

          const markerContent = `
          <div style="
            background: ${markerColor};
            color: white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 9px;
            border: 2px solid ${borderColor};
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            position: relative;
            flex-direction: column;
          ">
            <div style="font-size: 7px; line-height: 1;">D${loc.day || 1}</div>
            <div style="font-size: 10px; line-height: 1;">${dayIndex}</div>
            ${
              !isRealCoordinate
                ? '<div style="position: absolute; top: -2px; right: -2px; background: orange; width: 6px; height: 6px; border-radius: 50%; border: 1px solid white;"></div>'
                : ""
            }
          </div>
        `;

          const customOverlay = new window.kakao.maps.CustomOverlay({
            position: position,
            content: markerContent,
            yAnchor: 0.5,
          });

          customOverlay.setMap(map);
          map._overlays.push(customOverlay);

          // 해당 위치의 활동 정보 찾기
          let activityInfo = loc.name || `장소 ${dayIndex}`;
          if (travelInfo.courses && travelInfo.courses.length > 0) {
            // 같은 Day와 순서에 해당하는 코스 찾기
            const matchingCourse = travelInfo.courses.find(
              (course) =>
                course.day === loc.day &&
                course.activity &&
                (course.activity.includes(loc.name) ||
                  loc.name.includes(course.activity.split(" ")[0]))
            );

            if (matchingCourse) {
              activityInfo = matchingCourse.activity;
            }
          }

          // 장소명과 활동 정보 표시
          let infoContent = `
          <div style="
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 11px;
            font-weight: bold;
            color: #333;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            max-width: 180px;
            word-break: keep-all;
            text-align: center;
            line-height: 1.3;
          ">
            ${
              activityInfo.length > 25
                ? activityInfo.substring(0, 25) + "..."
                : activityInfo
            }
          </div>
        `;

          const infoOverlay = new window.kakao.maps.CustomOverlay({
            position: position,
            content: infoContent,
            yAnchor: -0.8, // 마커 아래에 표시
          });

          infoOverlay.setMap(map);
          map._overlays.push(infoOverlay);

          // Geocoder를 사용해서 좌표를 주소로 변환
          if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
            const geocoder = new window.kakao.maps.services.Geocoder();

            geocoder.coord2Address(loc.lng, loc.lat, (result, status) => {
              let addressText = isRealCoordinate
                ? "정확한 위치"
                : "대략적 위치";

              if (status === window.kakao.maps.services.Status.OK) {
                const address = result[0];
                if (address.road_address) {
                  // 도로명 주소가 있으면 도로명 주소 사용
                  addressText = address.road_address.address_name;
                } else if (address.address) {
                  // 지번 주소 사용
                  addressText = address.address.address_name;
                }

                // 주소가 너무 길면 줄임
                if (addressText.length > 30) {
                  const parts = addressText.split(" ");
                  if (parts.length > 3) {
                    addressText = parts.slice(-3).join(" "); // 뒤의 3개 부분만 표시
                  } else {
                    addressText = addressText.substring(0, 30) + "...";
                  }
                }
              }

              // 활동 정보 계속 표시 (주소 정보 제거)
              const updatedInfoContent = `
              <div style="
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 11px;
                font-weight: bold;
                color: #333;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                max-width: 180px;
                word-break: keep-all;
                text-align: center;
                line-height: 1.3;
              ">
                ${
                  activityInfo.length > 25
                    ? activityInfo.substring(0, 25) + "..."
                    : activityInfo
                }
              </div>
            `;

              // 기존 오버레이의 내용을 업데이트
              infoOverlay.setContent(updatedInfoContent);
            });
          }

          bounds.extend(position);
        });

        // Day별로 같은 day끼리만 연결선 그리기
        if (locations.length >= 2) {
          console.log("Day별 마커 간 거리 계산 및 표시 시작");

          // Day별로 그룹화
          const locationsByDay = {};
          locations.forEach((loc) => {
            const day = loc.day || 1;
            if (!locationsByDay[day]) {
              locationsByDay[day] = [];
            }
            locationsByDay[day].push(loc);
          });

          console.log("Day별 위치 그룹:", locationsByDay);

          // 각 Day별로 연결선 그리기
          Object.entries(locationsByDay).forEach(([day, dayLocations]) => {
            const dayNum = parseInt(day);
            const dayColor = dayColors[dayNum] || dayColors.default;

            console.log(
              `Day ${day} 연결선 그리기 (${dayLocations.length}개 위치)`
            );

            for (let i = 0; i < dayLocations.length - 1; i++) {
              const start = dayLocations[i];
              const end = dayLocations[i + 1];

              const startPos = new window.kakao.maps.LatLng(
                start.lat,
                start.lng
              );
              const endPos = new window.kakao.maps.LatLng(end.lat, end.lng);

              // 거리 계산
              const distance = calculateDistance(
                start.lat,
                start.lng,
                end.lat,
                end.lng
              );

              // Day별 색상으로 연결선 그리기
              const polyline = new window.kakao.maps.Polyline({
                path: [startPos, endPos],
                strokeWeight: 4,
                strokeColor: dayColor,
                strokeOpacity: 0.8,
                strokeStyle: "solid",
              });

              polyline.setMap(map);
              map._overlays.push(polyline);

              // 중간 지점 계산 (연결선 중간에 거리 표시)
              const midLat = (start.lat + end.lat) / 2;
              const midLng = (start.lng + end.lng) / 2;
              const midPosition = new window.kakao.maps.LatLng(midLat, midLng);

              // Day별 색상으로 거리 정보 표시
              const distanceContent = `
              <div style="
                background: ${dayColor}e6;
                color: white;
                border-radius: 12px;
                padding: 4px 8px;
                font-size: 11px;
                font-weight: bold;
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                white-space: nowrap;
              ">
                Day${day} ${distance.toFixed(1)}km
              </div>
            `;

              const distanceOverlay = new window.kakao.maps.CustomOverlay({
                position: midPosition,
                content: distanceContent,
                yAnchor: 0.5,
              });

              distanceOverlay.setMap(map);
              map._overlays.push(distanceOverlay);

              console.log(
                `Day${day} ${i + 1}→${i + 2}: ${distance.toFixed(1)}km`
              );
            }
          });

          // 전체 여행 거리 계산
          const totalDistance = locations.reduce((total, loc, index) => {
            if (index === 0) return 0;
            const prev = locations[index - 1];
            return (
              total + calculateDistance(prev.lat, prev.lng, loc.lat, loc.lng)
            );
          }, 0);

          console.log(`총 여행 거리: ${totalDistance.toFixed(1)}km`);

          // 좌표 정확성 통계
          const realCoordCount = locations.filter(
            (loc) => loc.hasRealCoordinates !== false
          ).length;
          const defaultCoordCount = locations.length - realCoordCount;

          // 총 거리 정보와 좌표 정확성 범례를 지도 상단에 표시
          const totalDistanceContent = `
          <div style="
            background: rgba(52, 152, 219, 0.95);
            color: white;
            border-radius: 20px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: bold;
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">
            🗺️ 총 여행거리: ${totalDistance.toFixed(1)}km
            ${
              defaultCoordCount > 0
                ? `<br/><small style="font-size: 10px;">⚠️ ${defaultCoordCount}개 위치는 대략적 좌표</small>`
                : ""
            }
          </div>
        `;

          // 지도 중심점에서 약간 위쪽에 표시
          const mapCenter = map.getCenter();
          const totalDistanceOverlay = new window.kakao.maps.CustomOverlay({
            position: mapCenter,
            content: totalDistanceContent,
            yAnchor: 2, // 지도 중심에서 위쪽에 표시
          });

          totalDistanceOverlay.setMap(map);
          map._overlays.push(totalDistanceOverlay);

          // 좌표 정확성 범례 (지도 우상단)
          if (defaultCoordCount > 0) {
            const legendContent = `
            <div style="
              background: rgba(0, 0, 0, 0.8);
              color: white;
              border-radius: 8px;
              padding: 8px 12px;
              font-size: 11px;
              line-height: 1.4;
              border: 1px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            ">
              <div style="margin-bottom: 4px;"><strong>🗺️ 위치 정확성</strong></div>
              <div>🔴 정확한 위치 (${realCoordCount}개)</div>
              <div>⚪ 대략적 위치 (${defaultCoordCount}개)</div>
            </div>
          `;

            // 지도 중심에서 우상단에 표시
            const bounds = map.getBounds();
            const ne = bounds.getNorthEast();
            const legendPosition = new window.kakao.maps.LatLng(
              ne.getLat() - 0.001,
              ne.getLng() - 0.001
            );

            const legendOverlay = new window.kakao.maps.CustomOverlay({
              position: legendPosition,
              content: legendContent,
              xAnchor: 1, // 오른쪽 정렬
              yAnchor: 0, // 위쪽 정렬
            });

            legendOverlay.setMap(map);
            map._overlays.push(legendOverlay);
          }
        }

        // 지도 범위 재설정 (마커들이 모두 보이도록)
        if (locations.length > 0) {
          map.setBounds(bounds);

          // 여유 공간을 위해 레벨을 약간 조정
          setTimeout(() => {
            const currentLevel = map.getLevel();
            map.setLevel(currentLevel + 1);
          }, 100);
        }
      } catch (error) {
        console.error("❌ 마커 및 거리 표시 중 오류:", error);
      }
    }, 300); // 300ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [locations.length, travelInfo.festival.name]); // 의존성 최소화

  const processResponse = (response) => {
    console.log("원본 응답:", response);

    const newLocations = [];
    let cleanResponse = response;

    try {
      // 위치 정보와 day 정보 추출을 위한 정규식
      const regex =
        /@location:\s*\[(\d+\.\d+)\s*,\s*(\d+\.\d+)\]\s*@day:(\d+)/g;
      console.log("사용중인 정규식 패턴:", regex.source);
      let match;

      while ((match = regex.exec(response)) !== null) {
        console.log("정규식 매치 결과:", match);
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        const day = parseInt(match[3]);
        console.log("파싱된 좌표와 Day:", { lat, lng, day });

        if (!isNaN(lat) && !isNaN(lng) && !isNaN(day)) {
          // 해당 위치 앞에 있는 장소명 추출 시도
          const beforeLocation = response.substring(0, match.index);
          const lines = beforeLocation.split("\n");
          let placeName = `장소 ${newLocations.length + 1}`;

          // 바로 앞 줄에서 장소명 찾기
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line && !line.includes("@location")) {
              // 시간 표시나 번호 제거 후 장소명 추출
              const cleanedLine = line
                .replace(/^\*?\*?(\d+\.?\s*)?/, "") // 번호 제거
                .replace(/^\*\*오전|오후\s*\d{2}:\d{2}\*\*\s*-?\s*/, "") // 시간 제거
                .replace(/^-\s*/, "") // 대시 제거
                .replace(/\*\*/g, "") // 별표 제거
                .trim();

              if (cleanedLine && cleanedLine.length > 0) {
                placeName =
                  cleanedLine.length > 20
                    ? cleanedLine.substring(0, 20) + "..."
                    : cleanedLine;
                break;
              }
            }
          }

          newLocations.push({ lat, lng, name: placeName, day: day });
          console.log(
            `위치 ${newLocations.length} 추가됨: ${placeName} (위도 ${lat}, 경도 ${lng}, Day ${day})`
          );
        }
      }

      console.log("추출된 모든 위치:", newLocations);

      if (newLocations.length > 0) {
        console.log("locations 상태 업데이트:", newLocations);

        // 약간의 딜레이 후 마커 표시 (애니메이션 효과)
        setTimeout(() => {
          setLocations(newLocations);
        }, 500);

        // 여행 정보 추출 및 업데이트 (Tour API 데이터 활용)
        console.log("여행 정보 추출 시작");

        // 지역 정보 추출
        const regionMatch = response.match(/\[지역 소개\]\s*(.*?)(?=\[|$)/s);
        const regionInfo = regionMatch ? regionMatch[1].trim() : "";

        // 메인 축제 정보를 Tour API 데이터에서 추출 - TourAPI 데이터 우선
        let festivalInfo = {
          name: "여행코스 조회중...",
          period: "기간 조회중...",
          location: "위치 조회중...",
          image: null,
          description: null,
          phone: null,
        };

        // selectedMainFestival 우선 사용 (렌더링 최적화)
        console.log("🎪 selectedMainFestival 상태:", selectedMainFestival);
        console.log(
          "🎪 currentFestivalData 길이:",
          currentFestivalData?.length
        );

        let mainFestival = null;

        // 1순위: selectedMainFestival이 있으면 사용 (이미 최적화된 선택)
        if (selectedMainFestival) {
          mainFestival = selectedMainFestival;
          console.log("✅ selectedMainFestival 사용:", mainFestival.title);
        }
        // 2순위: currentFestivalData에서 선택
        else if (currentFestivalData && currentFestivalData.length > 0) {
          console.log("🔍 currentFestivalData에서 축제 선택");

          // 이미지가 있는 축제 우선 선택
          const festivalsWithImages = currentFestivalData.filter((festival) => {
            const hasImage =
              (festival.firstimage && festival.firstimage.trim() !== "") ||
              (festival.firstimage2 && festival.firstimage2.trim() !== "");
            return hasImage;
          });

          console.log(`🖼️ 이미지가 있는 축제: ${festivalsWithImages.length}개`);

          // 이미지가 있는 축제 중에서 진행중/예정된 축제 찾기
          const today = new Date();
          let targetFestivals =
            festivalsWithImages.length > 0
              ? festivalsWithImages
              : currentFestivalData;

          mainFestival = targetFestivals.find((festival) => {
            const startDate = festival.eventstartdate
              ? new Date(
                  festival.eventstartdate.replace(
                    /(\d{4})(\d{2})(\d{2})/,
                    "$1-$2-$3"
                  )
                )
              : null;
            const endDate = festival.eventenddate
              ? new Date(
                  festival.eventenddate.replace(
                    /(\d{4})(\d{2})(\d{2})/,
                    "$1-$2-$3"
                  )
                )
              : null;

            if (startDate && endDate) {
              return today >= startDate && today <= endDate; // 현재 진행중
            } else if (startDate) {
              return startDate >= today; // 예정된 축제
            }
            return false;
          });

          // 진행중/예정된 축제가 없으면 첫 번째 축제 선택
          if (!mainFestival) {
            mainFestival = targetFestivals[0];
          }
        }

        if (mainFestival) {
          console.log("🎯 메인 축제 선택:", mainFestival?.title);
          console.log("🖼️ 축제 이미지 (firstimage):", mainFestival?.firstimage);
          console.log(
            "🖼️ 축제 이미지 (firstimage2):",
            mainFestival?.firstimage2
          );
          console.log("📅 축제 시작일:", mainFestival?.eventstartdate);
          console.log("📅 축제 종료일:", mainFestival?.eventenddate);

          // 🖼️ 축제 포스터 이미지 상세 검증 및 로깅
          const imageUrl = mainFestival.firstimage || mainFestival.firstimage2;
          console.log("🖼️ ===== 축제 포스터 이미지 검증 =====");
          console.log("📋 축제명:", mainFestival.title);
          console.log("🖼️ firstimage:", mainFestival.firstimage || "❌ 없음");
          console.log("🖼️ firstimage2:", mainFestival.firstimage2 || "❌ 없음");

          if (imageUrl) {
            console.log("✅ 이미지 URL 발견:", imageUrl);
            console.log("🔍 URL 길이:", imageUrl.length);
            console.log("🔍 URL 형식 검증:");
            console.log("  - HTTP/HTTPS 시작:", imageUrl.startsWith("http"));
            console.log(
              "  - 이미지 확장자:",
              /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl)
            );
            console.log(
              "  - placeholder 포함:",
              imageUrl.includes("placeholder")
            );

            // 이미지 URL이 유효한지 간단히 체크
            if (
              imageUrl.startsWith("http") &&
              !imageUrl.includes("placeholder") &&
              imageUrl.trim() !== ""
            ) {
              console.log("✅ 유효한 이미지 URL로 판정");
            } else {
              console.log("❌ 부적절한 이미지 URL로 판정");
            }
          } else {
            console.log("❌ Tour API에서 축제 포스터 이미지를 찾을 수 없음");
            console.log("💡 해결방안:");
            console.log("  1. Tour API 응답에 firstimage 필드가 없음");
            console.log("  2. 해당 축제에 등록된 이미지가 없을 수 있음");
            console.log("  3. API 요청 시 firstImageYN=Y 파라미터 확인 필요");
          }
          console.log("🖼️ ===== 이미지 검증 완료 =====");

          // 🎯 축제 기간 처리 개선 (빈 값 체크 강화)
          let festivalPeriod = "";

          if (
            mainFestival.eventstartdate &&
            mainFestival.eventstartdate.trim() !== ""
          ) {
            const startDateFormatted = mainFestival.eventstartdate.replace(
              /(\d{4})(\d{2})(\d{2})/,
              "$1.$2.$3"
            );
            festivalPeriod = startDateFormatted;

            if (
              mainFestival.eventenddate &&
              mainFestival.eventenddate.trim() !== ""
            ) {
              const endDateFormatted = mainFestival.eventenddate.replace(
                /(\d{4})(\d{2})(\d{2})/,
                "$1.$2.$3"
              );
              festivalPeriod += ` - ${endDateFormatted}`;
            }

            console.log("✅ 축제 기간 설정됨:", festivalPeriod);
          } else {
            // 기간 정보가 없으면 현재 날짜 기준으로 대체
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
            festivalPeriod = `${currentYear}.${currentMonth} 진행중`;
            console.log("⚠️ 축제 기간 대체값 설정:", festivalPeriod);
          }

          // 🖼️ 이미지 처리 개선 (더 엄격한 검증)
          let festivalImage = null;

          if (
            mainFestival.firstimage &&
            mainFestival.firstimage.trim() !== "" &&
            mainFestival.firstimage.startsWith("http") &&
            !mainFestival.firstimage.includes("placeholder")
          ) {
            festivalImage = mainFestival.firstimage;
            console.log("✅ firstimage 사용:", festivalImage);
          } else if (
            mainFestival.firstimage2 &&
            mainFestival.firstimage2.trim() !== "" &&
            mainFestival.firstimage2.startsWith("http") &&
            !mainFestival.firstimage2.includes("placeholder")
          ) {
            festivalImage = mainFestival.firstimage2;
            console.log("✅ firstimage2 사용:", festivalImage);
          } else {
            console.log("❌ 유효한 축제 이미지를 찾을 수 없음");
            // 이미지가 없을 때는 null 유지 (기본 UI로 처리)
          }

          festivalInfo = {
            name: mainFestival.title || `${currentRegion || "추천"} 대표 축제`,
            period: festivalPeriod,
            location: mainFestival.addr1 || `${currentRegion || "추천"} 지역`,
            image: festivalImage,
            description:
              mainFestival.overview ||
              `${mainFestival.title || "축제"}에 대한 상세 정보입니다.`,
            phone: mainFestival.tel || "관련 문의: 지역 관광청",
          };

          console.log("✅ 기본 축제 정보:", festivalInfo);

          // 🔍 축제 상세 정보 비동기 가져오기 (추가 상세 정보 확보)
          if (mainFestival.contentid) {
            console.log("🔍 축제 상세 정보 요청 시작:", mainFestival.contentid);
            fetchFestivalDetail(mainFestival.contentid)
              .then((detailInfo) => {
                if (detailInfo) {
                  console.log("✅ 축제 상세 정보 수신:", detailInfo);

                  // 기존 정보를 상세 정보로 업데이트
                  const updatedFestivalInfo = {
                    name: detailInfo.title || festivalInfo.name,
                    period: festivalInfo.period, // 기간은 기존 정보 유지
                    location: detailInfo.addr || festivalInfo.location,
                    image: detailInfo.image || festivalInfo.image,
                    description:
                      detailInfo.overview || festivalInfo.description,
                    phone: detailInfo.tel || festivalInfo.phone,
                    homepage: detailInfo.homepage || "",
                  };

                  console.log("🔄 축제 정보 업데이트:", updatedFestivalInfo);

                  // 상세 정보로 업데이트
                  setTravelInfo((prev) => ({
                    ...prev,
                    festival: updatedFestivalInfo,
                  }));
                } else {
                  console.log("❌ 축제 상세 정보 가져오기 실패");
                }
              })
              .catch((error) => {
                console.error("축제 상세 정보 가져오기 오류:", error);
              });
          }
        } else {
          // Tour API 데이터가 없는 경우 기본 축제 정보 제공 (개선된 기본값)
          console.log("❌ TourAPI 데이터 없음 - 기본 정보만 제공");

          // 현재 시즌에 맞는 축제 정보 생성
          const today = new Date();
          const currentMonth = today.getMonth() + 1;
          const currentYear = today.getFullYear();

          let seasonalFestival = "";
          let seasonalPeriod = "";

          if (currentMonth >= 3 && currentMonth <= 5) {
            seasonalFestival = "봄꽃축제";
            seasonalPeriod = `${currentYear}.03 - ${currentYear}.05`;
          } else if (currentMonth >= 6 && currentMonth <= 8) {
            seasonalFestival = "여름문화축제";
            seasonalPeriod = `${currentYear}.06 - ${currentYear}.08`;
          } else if (currentMonth >= 9 && currentMonth <= 11) {
            seasonalFestival = "가을단풍축제";
            seasonalPeriod = `${currentYear}.09 - ${currentYear}.11`;
          } else {
            seasonalFestival = "겨울빛축제";
            seasonalPeriod = `${currentYear}.12 - ${currentYear + 1}.02`;
          }

          festivalInfo = {
            name: `${currentRegion || "지역"} ${seasonalFestival}`,
            period: seasonalPeriod,
            location: `${currentRegion || "추천"} 일대`,
            image: null, // 이미지 없음
            description: `${
              currentRegion || "추천"
            } 지역에서 개최되는 계절 축제입니다. 자세한 정보는 지역 관광청에 문의해주세요.`,
            phone: "관련 문의: 지역 관광청",
          };

          console.log("ℹ️ 계절별 기본 축제 정보 설정:", festivalInfo);
        }

        console.log("축제 정보:", festivalInfo);

        // Day별 추천 코스 추출 (4박5일 지원 강화)
        const coursesByDay = {};
        const lines = response.split("\n");
        let currentDay = 1;

        console.log("📝 Day별 코스 추출 시작 - 총 라인 수:", lines.length);

        // Day 패턴 감지 및 코스 추출 (강화된 패턴)
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // Day 구분 패턴 찾기 (더 간단하고 확실한 패턴)
          const dayPatterns = [
            /\[Day\s*(\d+)\s*코스\]/i, // [Day 1 코스]
            /\[Day\s*(\d+)\s*일정\]/i, // [Day 1 일정]
            /\[Day\s*(\d+)\]/i, // [Day 1]
            /Day\s*(\d+)\s*코스/i, // Day 1 코스
            /Day\s*(\d+)\s*일정/i, // Day 1 일정
            /(\d+)일차/i, // 1일차
            /Day\s*(\d+)/i, // Day 1
          ];

          let dayFound = false;
          for (const pattern of dayPatterns) {
            const dayMatch = trimmedLine.match(pattern);
            if (dayMatch) {
              currentDay = parseInt(dayMatch[1]);
              console.log(
                `📅 Day ${currentDay} 감지됨 (라인 ${
                  index + 1
                }, 패턴: ${pattern}):`,
                trimmedLine
              );
              if (!coursesByDay[currentDay]) {
                coursesByDay[currentDay] = [];
              }
              dayFound = true;
              break;
            }
          }

          if (dayFound) return;

          // "1. **시간** - 장소명" 패턴 매치
          const timeActivityMatch = line.match(
            /(\d+)\.\s*\*\*(.*?)\*\*\s*-\s*([^@\n]+)/
          );
          if (timeActivityMatch) {
            if (!coursesByDay[currentDay]) {
              coursesByDay[currentDay] = [];
            }
            coursesByDay[currentDay].push({
              time: timeActivityMatch[2].trim(),
              activity: timeActivityMatch[3].trim(),
              day: currentDay,
            });
          }
          // "1. 시간 - 장소명" 패턴도 매치 (볼드 없이)
          else if (
            line.match(/\d+\.\s*.*?-\s*[^@\n]+/) &&
            !line.includes("@location") &&
            !line.includes("[") // 섹션 헤더 제외
          ) {
            const simpleMatch = line.match(/\d+\.\s*(.*?)\s*-\s*([^@\n]+)/);
            if (simpleMatch) {
              if (!coursesByDay[currentDay]) {
                coursesByDay[currentDay] = [];
              }
              coursesByDay[currentDay].push({
                time: simpleMatch[1].trim(),
                activity: simpleMatch[2].trim(),
                day: currentDay,
              });
            }
          }
        });

        // courses 배열을 Day별로 평탄화
        const courses = [];
        const sortedDays = Object.keys(coursesByDay).sort(
          (a, b) => parseInt(a) - parseInt(b)
        );

        console.log("📊 추출된 Day 목록:", sortedDays);
        console.log(
          "📊 각 Day별 코스 수:",
          sortedDays
            .map((day) => `Day${day}: ${coursesByDay[day].length}개`)
            .join(", ")
        );

        sortedDays.forEach((day) => {
          console.log(`📋 Day ${day} 상세 코스:`, coursesByDay[day]);
          courses.push(...coursesByDay[day]);
        });

        console.log("✅ 최종 추출된 전체 코스 수:", courses.length);
        console.log("📝 전체 코스 내용:", courses);

        // 교통 정보 추출
        const transportMatch = response.match(/\[교통 안내\]\s*(.*?)(?=\[|$)/s);
        const transportText = transportMatch ? transportMatch[1].trim() : "";

        const transportation = {
          nearestStation:
            transportText.match(/대중교통[:\s]*([^\n]+)/)?.[1]?.trim() ||
            transportText.match(/가장 가까운 역[:\s]*([^\n]+)/)?.[1]?.trim() ||
            "대중교통 이용 가능",
          recommendedMode:
            transportText.match(/자가용[:\s]*([^\n]+)/)?.[1]?.trim() ||
            transportText.match(/추천.*?이동수단[:\s]*([^\n]+)/)?.[1]?.trim() ||
            "대중교통 또는 자가용",
        };
        console.log("교통 정보:", transportation);

        // 약간의 딜레이 후 여행 정보 업데이트 (애니메이션 효과)
        setTimeout(() => {
          setTravelInfo({
            festival: festivalInfo,
            courses: courses,
            transportation: transportation,
          });
        }, 300);
      } else {
        console.log("⚠️ 추출된 위치 없음 - 기본 위치 생성");

        // 🚨 위치 정보가 없을 때 강제로 기본 위치 생성
        const areaCode = extractAreaCode(inputMessage) || "1";
        const regionName = extractAreaName(areaCode) || currentRegion || "서울";
        const areaCenter = getAreaCenter(areaCode) || {
          lat: 37.5665,
          lng: 126.978,
        };

        console.log(
          `🔧 강제 위치 생성: ${regionName} (${areaCenter.lat}, ${areaCenter.lng})`
        );

        // 기본 여행 코스 3곳 생성
        const defaultLocations = [
          {
            lat: areaCenter.lat,
            lng: areaCenter.lng,
            name: `${regionName} 대표 관광지`,
            day: 1,
          },
          {
            lat: areaCenter.lat + 0.01,
            lng: areaCenter.lng + 0.01,
            name: `${regionName} 문화시설`,
            day: 1,
          },
          {
            lat: areaCenter.lat - 0.01,
            lng: areaCenter.lng + 0.01,
            name: `${regionName} 맛집거리`,
            day: 1,
          },
        ];

        console.log("🗺️ 기본 위치 설정:", defaultLocations);

        setTimeout(() => {
          setLocations(defaultLocations);
        }, 500);

        // 기본 여행 정보 설정
        setTimeout(() => {
          setTravelInfo({
            festival: {
              name: `${regionName} 지역 여행`,
              period: "연중 가능",
              location: `${regionName} 일대`,
              image: null,
              description: `${regionName} 지역의 대표 관광지와 문화시설을 둘러보는 여행코스입니다.`,
              phone: "지역 관광청 문의",
            },
            courses: [
              {
                time: "오전 09:00",
                activity: `${regionName} 대표 관광지`,
                day: 1,
              },
              {
                time: "오후 12:00",
                activity: `${regionName} 문화시설`,
                day: 1,
              },
              {
                time: "오후 15:00",
                activity: `${regionName} 맛집거리`,
                day: 1,
              },
            ],
            transportation: {
              nearestStation: "대중교통 이용 가능",
              recommendedMode: "지역 내 대중교통 또는 자가용",
            },
          });
        }, 300);
      }

      // 위치 정보 텍스트 제거 (day 정보 포함) - "위치정보:" 포함해서 제거
      cleanResponse = response
        .replace(
          /위치정보:\s*@location:\s*\[\d+\.\d+\s*,\s*\d+\.\d+\]\s*@day:\d+/g,
          ""
        )
        .replace(/@location:\s*\[\d+\.\d+\s*,\s*\d+\.\d+\]\s*@day:\d+/g, "");
    } catch (error) {
      console.error("위치 정보 처리 중 오류:", error);
    }

    return cleanResponse.trim();
  };

  // 🧠 사용자 프로필 분석 함수
  const analyzeUserProfile = (query) => {
    const cleanQuery = query.toLowerCase();

    // 여행 스타일 분석
    if (
      cleanQuery.includes("문화") ||
      cleanQuery.includes("역사") ||
      cleanQuery.includes("전통")
    ) {
      setUserProfile((prev) => ({ ...prev, travelStyle: "cultural" }));
    }
    if (
      cleanQuery.includes("자연") ||
      cleanQuery.includes("산") ||
      cleanQuery.includes("바다") ||
      cleanQuery.includes("힐링")
    ) {
      setUserProfile((prev) => ({ ...prev, travelStyle: "nature" }));
    }
    if (
      cleanQuery.includes("맛집") ||
      cleanQuery.includes("음식") ||
      cleanQuery.includes("먹거리")
    ) {
      setUserProfile((prev) => ({ ...prev, travelStyle: "foodie" }));
    }

    // 여행 기간 분석
    if (cleanQuery.includes("당일") || cleanQuery.includes("하루")) {
      setUserProfile((prev) => ({ ...prev, preferredDuration: "day-trip" }));
    }
    if (cleanQuery.includes("1박2일")) {
      setUserProfile((prev) => ({ ...prev, preferredDuration: "1night" }));
    }
    if (cleanQuery.includes("2박3일")) {
      setUserProfile((prev) => ({ ...prev, preferredDuration: "2nights" }));
    }

    // 동반자 분석
    if (cleanQuery.includes("혼자") || cleanQuery.includes("solo")) {
      setUserProfile((prev) => ({ ...prev, companions: "solo" }));
    }
    if (
      cleanQuery.includes("연인") ||
      cleanQuery.includes("커플") ||
      cleanQuery.includes("둘이")
    ) {
      setUserProfile((prev) => ({ ...prev, companions: "couple" }));
    }
    if (
      cleanQuery.includes("가족") ||
      cleanQuery.includes("부모님") ||
      cleanQuery.includes("아이")
    ) {
      setUserProfile((prev) => ({ ...prev, companions: "family" }));
    }
    if (
      cleanQuery.includes("친구") ||
      cleanQuery.includes("동기") ||
      cleanQuery.includes("같이")
    ) {
      setUserProfile((prev) => ({ ...prev, companions: "friends" }));
    }

    // 지역 관심도 추가
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
      "전주",
      "경주",
      "강릉",
      "속초",
      "여수",
      "순천",
      "안동",
      "춘천",
      "포항",
    ];
    regions.forEach((region) => {
      if (
        cleanQuery.includes(region.toLowerCase()) &&
        !userProfile.visitedRegions.includes(region)
      ) {
        setUserProfile((prev) => ({
          ...prev,
          visitedRegions: [...prev.visitedRegions, region].slice(-5), // 최근 5개만 유지
        }));
      }
    });

    console.log("🧠 사용자 프로필 업데이트:", userProfile);
  };

  // 에러 처리가 강화된 handleSendMessage
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // 🧠 사용자 프로필 분석 실행
    analyzeUserProfile(inputMessage);

    const userMessage = {
      role: "user",
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);
    setCurrentStreamMessage("");

    // 🎯 모든 질문에 대해 여행코스 추천 (기본 응답 제거)
    console.log("🎯 모든 질문을 여행코스 추천으로 처리:", inputMessage);

    // 축제 관련 키워드가 없어도 강제로 여행코스 추천 진행
    const isRelatedQuery = isFestivalRelatedQuery(inputMessage);
    console.log("축제 관련 질문 여부:", isRelatedQuery, "-> 강제로 true 처리");

    // 기본 응답은 더 이상 사용하지 않고, 모든 질문을 여행코스 추천으로 처리

    // 새로운 검색이 필요한지 판단
    const shouldSearch = needsNewSearch(inputMessage, currentRegion);

    let festivalDataPromise;

    if (shouldSearch) {
      // 1단계: Tour API 데이터 조회 (새로운 검색)
      console.log("🔍 새로운 Tour API 데이터 조회 시작");
      festivalDataPromise = fetchFestivalData(inputMessage)
        .then((data) => {
          console.log(`✅ 새로운 검색 완료: ${data?.length || 0}개 축제`);
          console.log("🎪 가져온 축제 데이터:", data);

          if (data && data.length > 0) {
            setCurrentFestivalData(data);
            console.log("✅ currentFestivalData 설정 완료");
          } else {
            console.log("❌ TourAPI에서 데이터를 가져오지 못함");
            setCurrentFestivalData([]);
          }

          // 새로운 지역 설정
          const areaCode = extractAreaCode(inputMessage);
          if (areaCode) {
            const regionName = extractAreaName(areaCode);
            setCurrentRegion(regionName);
            console.log("📍 새로운 지역 설정:", regionName);
          }

          return data || [];
        })
        .catch((error) => {
          console.warn(
            "⚠️ 키워드 검색 실패, 지역 데이터로 계속 진행:",
            error.message
          );

          // 키워드 검색 실패 시 안전 처리
          // 1. 기존 데이터가 있으면 재사용
          if (currentFestivalData && currentFestivalData.length > 0) {
            console.log(
              "♻️ 기존 축제 데이터 재사용:",
              currentFestivalData.length,
              "개"
            );
            return currentFestivalData;
          }

          // 2. 지역 정보가 있으면 지역별 기본 데이터 생성
          const areaCode = extractAreaCode(inputMessage);
          if (areaCode) {
            const regionName = extractAreaName(areaCode);
            setCurrentRegion(regionName);
            console.log("📍 키워드 검색 실패로 인한 지역 설정:", regionName);

            // 지역별 기본 데이터 생성 (빈 배열이지만 지역 정보는 유지)
            return [];
          }

          // 3. 최후 수단: 빈 배열 반환 (AI가 지역 데이터 없이도 기본 추천 제공)
          console.log("💡 키워드 검색 실패 - AI가 기본 추천 제공");
          return [];
        });
    } else {
      // 기존 데이터 재사용
      console.log(
        "♻️ 기존 축제 데이터 재사용:",
        currentFestivalData.length,
        "개"
      );
      festivalDataPromise = Promise.resolve(currentFestivalData);
    }

    // 축제 데이터 처리 (안전성 확보)
    festivalDataPromise
      .then((festivalData) => {
        console.log(
          `✅ 사용할 축제 데이터: ${festivalData ? festivalData.length : 0}개`
        );

        // 데이터가 null이거나 undefined인 경우 빈 배열로 처리
        if (!festivalData || !Array.isArray(festivalData)) {
          console.log("⚠️ 축제 데이터가 배열이 아님 - 빈 배열로 처리");
          festivalData = [];
        }

        // 2단계: OpenAI 프롬프트 생성
        console.log("🤖 2단계: OpenAI 프롬프트 생성");
        const prompt = createFestivalPrompt(
          festivalData,
          inputMessage,
          currentRegion,
          !shouldSearch
        );

        // 3단계: OpenAI API 호출
        console.log("🧠 3단계: OpenAI API 호출");
        console.log("📝 프롬프트 길이:", prompt.length);
        console.log("📝 프롬프트 내용 (첫 200자):", prompt.substring(0, 200));

        const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
        console.log("🔑 OpenAI API 키 확인:", openaiKey ? "존재함" : "없음");

        if (!openaiKey) {
          throw new Error("OpenAI API 키가 설정되지 않았습니다.");
        }

        console.log("🚀 OpenAI API 요청 시작...");
        console.log("🔑 OpenAI 키 길이:", openaiKey?.length);
        console.log("🔑 OpenAI 키 앞 10자:", openaiKey?.substring(0, 10));
        console.log("📝 전송할 프롬프트 길이:", prompt.length);
        console.log(
          "📝 프롬프트 내용 (첫 300자):",
          prompt.substring(0, 300) + "..."
        );

        // 🧠 대화 기록 포함 - 최소 컨텍스트 유지 (속도 최적화)
        const conversationHistory = messages.slice(-1).map((msg) => ({
          role: msg.role,
          content: msg.content.substring(0, 300), // 토큰 절약을 위해 300자로 제한
        }));

        const enhancedMessages = [
          {
            role: "system",
            content: ASSISTANT_INSTRUCTIONS,
          },
          ...conversationHistory, // 🔄 최근 대화 1개 포함
          {
            role: "user",
            content: `📍 현재 지역: ${currentRegion || "미설정"}
축제 정보: ${festivalData.length}개

사용자 요청:
${prompt}`,
          },
        ];

        console.log("📨 OpenAI에 전송할 메시지 수:", enhancedMessages.length);
        console.log("📨 시스템 메시지 길이:", ASSISTANT_INSTRUCTIONS.length);
        console.log(
          "📨 사용자 메시지 길이:",
          enhancedMessages[enhancedMessages.length - 1].content.length
        );

        return openai.chat.completions
          .create({
            model: "gpt-4o-mini", // 검증된 모델명으로 복원
            messages: enhancedMessages,
            max_tokens: 3000, // 4박5일 전체 일정 대응으로 대폭 증가
            temperature: 0.5, // 응답 속도 향상
            stream: true, // 실시간 스트리밍 활성화
          })
          .then((response) => {
            console.log("✅ OpenAI API 응답 성공:", response);
            console.log("📊 응답 타입:", typeof response);
            return response;
          })
          .catch((error) => {
            console.error("❌ OpenAI API 오류 상세 정보:");
            console.error("  - 오류 타입:", error.constructor.name);
            console.error("  - 오류 메시지:", error.message);
            console.error("  - 오류 코드:", error.code);
            console.error("  - 오류 스택:", error.stack);

            // 구체적인 오류 유형 분석
            if (error.message.includes("API key")) {
              console.error(
                "🔑 API 키 관련 오류 - .env 파일의 VITE_OPENAI_API_KEY 확인 필요"
              );
            } else if (error.message.includes("model")) {
              console.error(
                "🤖 모델 관련 오류 - gpt-4o-mini 모델 사용 가능 여부 확인 필요"
              );
            } else if (
              error.message.includes("network") ||
              error.message.includes("timeout")
            ) {
              console.error("🌐 네트워크 오류 - 인터넷 연결 상태 확인 필요");
            } else {
              console.error("❓ 기타 OpenAI API 오류");
            }

            throw new Error(`OpenAI API 호출 실패: ${error.message}`);
          });
      })
      .then(async (stream) => {
        try {
          console.log("🔄 실시간 스트리밍 응답 처리 시작");
          console.log("📡 스트림 객체 타입:", typeof stream);
          console.log("📡 스트림 객체:", stream);

          let fullResponse = "";
          let chunkCount = 0;

          // 스트리밍 응답 실시간 처리
          for await (const chunk of stream) {
            chunkCount++;
            console.log(`📦 청크 ${chunkCount} 수신:`, chunk);

            const content = chunk.choices?.[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              console.log(
                `📝 청크 ${chunkCount} 내용:`,
                content.substring(0, 50) + "..."
              );

              // 실시간으로 화면에 표시 (위치 정보와 day 정보 제거)
              const displayText = fullResponse.replace(
                /@location:\s*\[\d+\.\d+\s*,\s*\d+\.\d+\]\s*@day:\d+/g,
                ""
              );
              setCurrentStreamMessage(displayText);
            } else {
              console.log(`📦 청크 ${chunkCount} - 내용 없음`);
            }
          }

          console.log(
            `✅ 스트리밍 완료 - 총 ${chunkCount}개 청크, 응답 길이: ${fullResponse.length}`
          );
          console.log(
            "📝 최종 응답 내용 (첫 200자):",
            fullResponse.substring(0, 200) + "..."
          );

          if (!fullResponse.trim()) {
            console.error("❌ OpenAI 빈 응답 오류");
            throw new Error(
              "OpenAI로부터 빈 응답을 받았습니다. API 키나 모델 설정을 확인해주세요."
            );
          }

          // 4단계: 응답 처리 및 위치 정보 추출
          const processedResponse = processResponse(fullResponse);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: processedResponse,
            },
          ]);
          setCurrentStreamMessage("");
        } catch (responseError) {
          console.error("스트리밍 응답 처리 오류:", responseError);
          throw new Error(
            `AI 응답 생성 중 오류가 발생했습니다: ${responseError.message}`
          );
        }
      })
      .catch((error) => {
        console.error("처리 오류:", error);

        let errorMessage = "서비스 이용 중 오류가 발생했습니다.";

        if (
          error.message.includes("Tour API") ||
          error.message.includes("축제 정보를 찾을 수 없습니다")
        ) {
          errorMessage = `${error.message}

**해결방법:**
1. 다른 지역명으로 검색해보세요 (예: "서울", "부산", "제주")
2. 축제 종류를 명시해보세요 (예: "음식축제", "문화축제")
3. 더 일반적인 키워드로 검색해보세요 (예: "축제", "행사")

**참고:** Tour API에서 실시간으로 검색하므로 현재 진행중이거나 예정된 축제만 표시됩니다.`;
        } else if (error.message.includes("OpenAI")) {
          errorMessage =
            "AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if (error.message.includes("API 키")) {
          errorMessage = "API 설정에 문제가 있습니다. 관리자에게 문의하세요.";
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: errorMessage,
          },
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
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
                    {message.content.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
              {currentStreamMessage && (
                <div className="ai-chatbot-message assistant">
                  <div className="ai-chatbot-message-content">
                    {currentStreamMessage.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
              {loading && !currentStreamMessage && (
                <div className="ai-chatbot-message assistant">
                  <div className="ai-chatbot-message-content loading">
                    목적 여행 계획을 생성하는중...
                  </div>
                </div>
              )}
            </div>

            <div className="ai-chatbot-chat-input">
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

        {/* 여행 정보 요약 섹션 */}
        {(currentFestivalData && currentFestivalData.length > 0) ||
        (travelInfo.courses && travelInfo.courses.length > 0) ||
        (travelInfo.transportation &&
          (travelInfo.transportation.nearestStation ||
            travelInfo.transportation.recommendedMode)) ||
        (travelInfo.festival && travelInfo.festival.name) ? (
          <div className="ai-chatbot-travel-summary">
            <div className="ai-chatbot-travel-info-grid">
              {/* 메인 축제 정보 - 축제 데이터나 여행정보가 있을 때 표시 */}
              {((currentFestivalData && currentFestivalData.length > 0) ||
                (travelInfo.festival && travelInfo.festival.name)) && (
                <div className="ai-chatbot-festival-info">
                  <h3
                    style={{
                      marginBottom: "20px",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#333",
                    }}
                  >
                    메인 축제 정보
                  </h3>

                  {(() => {
                    // 🎯 메인 축제 정보 렌더링
                    let mainFestival = selectedMainFestival;

                    // selectedMainFestival이 없으면 travelInfo에서 가져오기
                    if (
                      !mainFestival &&
                      travelInfo.festival &&
                      travelInfo.festival.name
                    ) {
                      mainFestival = {
                        title: travelInfo.festival.name,
                        eventstartdate: travelInfo.festival.period
                          ?.split(" - ")[0]
                          ?.replace(/\./g, ""),
                        eventenddate: travelInfo.festival.period
                          ?.split(" - ")[1]
                          ?.replace(/\./g, ""),
                        firstimage: travelInfo.festival.image,
                      };
                    }

                    // travelInfo.festival 정보 직접 사용 (selectedMainFestival보다 최신 정보)
                    if (travelInfo.festival && travelInfo.festival.name) {
                      console.log(
                        "🔄 travelInfo.festival 정보 직접 사용:",
                        travelInfo.festival
                      );
                      const festivalFromTravelInfo = {
                        title: travelInfo.festival.name,
                        firstimage: travelInfo.festival.image,
                        period: travelInfo.festival.period,
                        addr1: travelInfo.festival.location,
                        overview: travelInfo.festival.description,
                        tel: travelInfo.festival.phone,
                      };

                      // travelInfo 데이터를 우선 사용
                      mainFestival = festivalFromTravelInfo;
                    }

                    if (!mainFestival) {
                      console.log("🚫 메인 축제 정보 없음");
                      return (
                        <div
                          style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "#666",
                          }}
                        >
                          {currentRegion || "지역"} 여행 정보를 준비 중입니다...
                        </div>
                      );
                    }

                    console.log("🎯 렌더링할 메인 축제:", mainFestival.title);

                    // 이미지 URL 처리 - undefined나 빈 문자열 체크
                    const festivalImage =
                      mainFestival?.firstimage &&
                      mainFestival.firstimage.trim() !== ""
                        ? mainFestival.firstimage
                        : mainFestival?.firstimage2 &&
                          mainFestival.firstimage2.trim() !== ""
                        ? mainFestival.firstimage2
                        : null;

                    const festivalName =
                      mainFestival?.title ||
                      `${currentRegion || "추천"} 대표 축제`;
                    let festivalPeriod = "축제 일정을 확인해주세요";

                    // travelInfo에서 이미 포맷된 기간 정보가 있으면 우선 사용
                    if (travelInfo.festival && travelInfo.festival.period) {
                      festivalPeriod = travelInfo.festival.period;
                    }
                    // 그렇지 않으면 Tour API 데이터에서 파싱
                    else if (mainFestival?.eventstartdate) {
                      const startFormatted =
                        mainFestival.eventstartdate.replace(
                          /(\d{4})(\d{2})(\d{2})/,
                          "$1.$2.$3"
                        );
                      festivalPeriod = startFormatted;

                      if (mainFestival?.eventenddate) {
                        const endFormatted = mainFestival.eventenddate.replace(
                          /(\d{4})(\d{2})(\d{2})/,
                          "$1.$2.$3"
                        );
                        festivalPeriod += ` - ${endFormatted}`;
                      }
                    }

                    console.log("🗓️ 최종 축제 기간:", festivalPeriod);

                    console.log("🔍 최종 이미지 URL:", festivalImage);

                    return (
                      <div
                        className="ai-chatbot-festival-card"
                        style={{
                          background: "white",
                          borderRadius: "12px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          overflow: "hidden",
                          marginBottom: "20px",
                        }}
                      >
                        {/* 축제 이미지 */}
                        {festivalImage && (
                          <div
                            className="ai-chatbot-festival-image-container"
                            style={{
                              position: "relative",
                              height: "180px",
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={festivalImage}
                              alt={festivalName}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                backgroundColor: "#f3f4f6",
                              }}
                              onError={(e) => {
                                console.log("이미지 로딩 실패:", e.target.src);
                                // 이미지 로딩 실패 시 부모 컨테이너 숨김
                                e.target.parentElement.style.display = "none";
                              }}
                              onLoad={(e) => {
                                console.log("이미지 로딩 성공:", e.target.src);
                              }}
                            />
                          </div>
                        )}

                        {/* 축제 정보 */}
                        <div
                          className="ai-chatbot-festival-info-content"
                          style={{
                            padding: "16px",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "18px",
                              fontWeight: "bold",
                              color: "#1f2937",
                              marginBottom: "8px",
                              lineHeight: "1.4",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {festivalName}
                          </h4>
                          <p
                            style={{
                              display: "flex",
                              alignItems: "center",
                              color: "#666",
                              fontSize: "14px",
                              fontWeight: "500",
                              marginBottom: "0",
                            }}
                          >
                            <svg
                              style={{
                                width: "16px",
                                height: "16px",
                                marginRight: "4px",
                                flexShrink: 0,
                              }}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {festivalPeriod}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 추천 코스 섹션 - travelInfo에 코스가 있을 때만 표시 */}
              {travelInfo.courses && travelInfo.courses.length > 0 && (
                <div className="ai-chatbot-course-timeline">
                  <h3>추천 코스</h3>
                  {(() => {
                    // Day별로 코스 그룹화
                    const coursesByDay = {};
                    travelInfo.courses.forEach((course) => {
                      const day = course.day || 1;
                      if (!coursesByDay[day]) {
                        coursesByDay[day] = [];
                      }
                      coursesByDay[day].push(course);
                    });

                    const dayColors = {
                      1: "#2196F3", // 파란색 (Day 1)
                      2: "#2196F3", // 파란색 (Day 2)
                      3: "#4CAF50", // 초록색 (Day 3)
                      4: "#FF9800", // 주황색 (Day 4)
                      5: "#9C27B0", // 보라색 (Day 5)
                      default: "#607D8B", // 회색 (기본)
                    };

                    return Object.keys(coursesByDay)
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map((day) => (
                        <div key={day} className="ai-chatbot-day-section">
                          <div
                            className="ai-chatbot-day-header"
                            style={{
                              color: "#2563eb",
                              padding: "8px 15px",
                              marginBottom: "15px",
                              fontSize: "20px",
                              fontWeight: "bold",
                            }}
                          >
                            Day {day}
                          </div>
                          {coursesByDay[day].map((course, index) => (
                            <div
                              key={`${day}-${index}`}
                              className="ai-chatbot-course-item"
                            >
                              <div
                                className="ai-chatbot-course-number"
                                style={{
                                  backgroundColor: "#60a5fa",
                                }}
                              >
                                {index + 1}
                              </div>
                              <div className="ai-chatbot-course-content">
                                <div className="ai-chatbot-course-time">
                                  {course.time}
                                </div>
                                <div className="ai-chatbot-course-activity">
                                  {course.activity}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ));
                  })()}
                </div>
              )}

              {/* 교통 안내 섹션 - travelInfo에 교통 정보가 있을 때만 표시 */}
              {travelInfo.transportation &&
                (travelInfo.transportation.nearestStation ||
                  travelInfo.transportation.recommendedMode) && (
                  <div className="ai-chatbot-transportation-info">
                    <h3>교통 안내</h3>
                    {travelInfo.transportation.nearestStation && (
                      <p>
                        <strong className="ai-chatbot-strong">
                          가장 가까운 역:
                        </strong>{" "}
                        {travelInfo.transportation.nearestStation}
                      </p>
                    )}
                    {travelInfo.transportation.recommendedMode && (
                      <p>
                        <strong className="ai-chatbot-strong">
                          추천 이동수단:
                        </strong>{" "}
                        {travelInfo.transportation.recommendedMode}
                      </p>
                    )}
                  </div>
                )}
            </div>

            {/* 저장/공유 버튼 */}
            <div className="ai-chatbot-action-buttons">
              <button
                className="ai-chatbot-action-btn ai-chatbot-save-btn"
                onClick={() => {
                  // HTML to PDF 변환을 위한 준비
                  const content = document.querySelector(
                    ".ai-chatbot-travel-summary"
                  ).innerHTML;
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
                className="ai-chatbot-action-btn ai-chatbot-share-btn"
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
        ) : null}
      </div>
    </>
  );
};

export default AIChatbot;
