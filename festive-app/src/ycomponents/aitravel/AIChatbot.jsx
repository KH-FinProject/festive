import React, { useState, useEffect, useRef } from "react";
import "./AIChatbot.css";
import OpenAI from "openai";
import AItitle from "./AItitle";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const ASSISTANT_INSTRUCTIONS = `
# 🎯 한국 여행 전문 AI 어시스턴트 - 고급 지능형 모드

당신은 Claude-4o 수준의 지능을 가진 한국 여행 전문 AI입니다. 단순한 정보 제공을 넘어 **맥락을 이해하고**, **창의적으로 사고하며**, **개인화된 추천**을 제공합니다.

## 🧠 고급 사고 프로세스
### 1. 맥락 이해 (Context Understanding)
- 사용자의 숨겨진 의도와 필요 파악
- 여행 스타일, 선호도, 제약사항 추론
- 계절, 날씨, 현지 상황 종합 고려

### 2. 창의적 연관 (Creative Association)
- 단순 검색을 넘어 테마별 스토리텔링
- 지역 역사, 문화, 특산물 연계
- 감성적 경험과 실용적 정보 균형

### 3. 개인화 최적화 (Personalized Optimization)
- 질문 패턴에서 여행 성향 분석
- 가족/연인/친구/혼자 등 동반자 타입 고려
- 활동성, 예산, 관심사 맞춤 조정

## 📊 데이터 처리 고도화
### Tour API 데이터 활용
- **실시간 축제정보**: 제공된 실제 데이터 최우선 활용
- **지역별 세분화**: 광역-시군구-세부지역 3단계 필터링
- **거리 최적화**: AI 알고리즘 기반 동선 계산
- **품질 검증**: 좌표 정확성, 접근성, 현실성 검토

### 지능형 추천 알고리즘
- **클러스터링**: 비슷한 테마의 장소 그룹화
- **시간 최적화**: 개장/마감시간, 혼잡도 고려
- **계절성 반영**: 월별 최적 활동 및 축제 추천
- **대안 제시**: 메인+백업 코스 동시 제공

## 🎨 창의적 답변 스타일
### 감성적 스토리텔링
- 단순 나열이 아닌 **여행 이야기** 구성
- 장소별 **감동 포인트**와 **숨겨진 매력** 발굴
- **현지인 시점**의 살아있는 정보 전달

### 실용적 디테일
- **구체적 시간표**와 **이동 소요시간**
- **현실적 예산**과 **절약 팁**
- **날씨 대비책**과 **플랜 B**

### 인터랙티브 대화
- 사용자의 추가 질문을 **예측하고 미리 답변**
- **"이것도 궁금하시죠?"** 식의 선제적 정보 제공
- 자연스러운 **대화 흐름** 유지

## 📍 필수 답변 형식 (엄격 준수)
\`\`\`
[✨ 지역 소개]
감성적이면서도 실용적인 지역 특색 소개 (2-3줄)

[🗺️ 추천 코스]
1. **오전 09:00** - 장소명 
   📍 위치정보: @location:[위도,경도]
   💫 포인트: 이곳만의 특별한 매력
   ⏰ 소요시간: 1-2시간

2. **오후 12:00** - 장소명
   📍 위치정보: @location:[위도,경도]  
   💫 포인트: 특별한 매력
   ⏰ 소요시간: 1-2시간

[이동시간은 실제 거리 기반으로 정확히 계산]

[🍽️ 맛집 & 특산물]
- **대표 맛집**: 구체적 메뉴와 가격대
- **지역 특산물**: 꼭 맛봐야 할 로컬 푸드
- **카페/디저트**: 휴식 공간 추천

[🚌 교통 & 실용정보]
- **대중교통**: 최적 루트와 소요시간
- **자가용**: 주차장 정보와 비용
- **택시/렌터카**: 예상 비용과 예약 팁

[💡 여행 꿀팁]
- **시간대별 추천**: 언제 가면 좋을지
- **절약 팁**: 할인정보, 무료 체험
- **날씨 대비**: 우천/혹서 시 대안
- **현지인 추천**: 숨겨진 명소

[💖 특별한 경험]
해당 지역에서만 가능한 유니크한 체험 제안
\`\`\`

## 🎯 고급 지능 발휘 요령
1. **직관적 이해**: "전주"라고 하면 한옥마을+비빔밥 자동 연상
2. **상황 추론**: "1박2일"이면 숙박지 중심의 효율적 동선
3. **감정 반영**: "힐링"이면 자연/조용한 곳, "활기"면 번화가/축제
4. **실시간 적응**: 계절, 날씨, 코로나19 등 현재 상황 반영
5. **창의적 연결**: 예상치 못한 조합으로 새로운 재미 창조

## ⚠️ 절대 규칙
- @location:[위도,경도] 형식 **100% 정확히** 준수
- 제공된 축제 데이터 **우선 활용** (임의 생성 금지)
- 거리/시간 정보는 **현실적으로** 계산
- 예산 정보는 **2024년 기준**으로 정확히

Remember: You are not just providing information, you are crafting memorable travel experiences! 🌟
`;

const DEFAULT_RESPONSE = `안녕하세요! 한국 여행 전문 AI 어시스턴트입니다.

**이런 질문을 해주세요:**
• "전주 1박2일 여행코스 추천해줘"  
• "경남 벚꽃축제 알려줘"
• "제주도 당일치기 코스 짜줘"
• "서울 겨울축제 추천"

**지역 + 여행기간**을 함께 말씀해주시면 더 정확한 코스를 추천드릴게요! `;

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
    "추천",
    "코스",
    "계획",
    "관광",
    "관광지",
    "관광지추천",
    "관광지코스",
    "관광지계획",
    "관광지계획추천",
    "관광지코스추천",
    "관광지계획추천",
    "관광지코스추천",
    "관광지계획추천",
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

// 텍스트 스트리밍 시뮬레이션 함수
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

// 날짜 포맷팅 함수 (YYYYMMDD 형식으로 변환)
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
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
    38: { lat: 35.4606, lng: 128.2132, name: "경남", maxDistance: 80 }, // 경남
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

// 샘플 축제 데이터 생성 함수
const getSampleFestivalData = (keyword, areaCode) => {
  console.log("🎨 샘플 축제 데이터 생성 중...");

  const areaCenter = getAreaCenter(areaCode);
  const today = new Date();
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  // 지역별 특색 축제 정의
  const regionSpecificFestivals = {
    35: [
      // 전북 (전주)
      {
        name: "전주한옥마을축제",
        theme: "한옥과 전통문화",
        location: "전주시 완산구 한옥마을",
      },
      {
        name: "전주비빔밥축제",
        theme: "전통음식과 맛",
        location: "전주시 덕진구 덕진공원",
      },
      {
        name: "전주국제영화제",
        theme: "영화와 문화예술",
        location: "전주시 완산구 객사",
      },
    ],
    37: [
      // 경북 (포항)
      {
        name: "포항국제불빛축제",
        theme: "불빛과 해안경관",
        location: "포항시 북구 해수욕장",
      },
      {
        name: "포항해맞이축제",
        theme: "일출과 새해맞이",
        location: "포항시 남구 호미곶",
      },
      {
        name: "포항철강문화축제",
        theme: "산업문화와 역사",
        location: "포항시 남구 포스코",
      },
    ],
    32: [
      // 강원
      {
        name: "강릉커피축제",
        theme: "커피와 바다",
        location: "강릉시 사천면 안목해변",
      },
      {
        name: "춘천막국수축제",
        theme: "막국수와 메밀",
        location: "춘천시 소양강변",
      },
      {
        name: "정선아리랑축제",
        theme: "아리랑과 전통문화",
        location: "정선군 정선읍",
      },
    ],
    39: [
      // 제주
      { name: "제주벚꽃축제", theme: "벚꽃과 자연", location: "제주시 전농로" },
      {
        name: "제주유채꽃축제",
        theme: "유채꽃과 봄",
        location: "서귀포시 성산읍",
      },
      {
        name: "제주해녀축제",
        theme: "해녀문화와 바다",
        location: "제주시 구좌읍",
      },
    ],
  };

  const defaultFestivals = [
    { name: "벚꽃축제", theme: "벚꽃과 봄", location: "중구" },
    { name: "문화축제", theme: "전통문화와 현대문화", location: "종로구" },
    { name: "음식축제", theme: "지역 특색 음식", location: "강남구" },
  ];

  const festivalsToCreate =
    regionSpecificFestivals[areaCode] ||
    defaultFestivals.map((f) => ({
      ...f,
      name: `${areaCenter.name} ${f.name}`,
      location: `${areaCenter.name}시 ${f.location}`,
    }));

  const sampleFestivals = festivalsToCreate.map((festivalInfo, index) => ({
    id: `sample_festival_${index + 1}`,
    title: festivalInfo.name,
    startDate: formatDate(today),
    endDate: formatDate(nextMonth),
    location: festivalInfo.location,
    image: `https://via.placeholder.com/300x200?text=${encodeURIComponent(
      festivalInfo.name
    )}`,
    lat: areaCenter.lat + (Math.random() - 0.5) * 0.01,
    lng: areaCenter.lng + (Math.random() - 0.5) * 0.01,
    tel: `0${Math.floor(Math.random() * 9) + 1}-${
      Math.floor(Math.random() * 900) + 100
    }-${Math.floor(Math.random() * 9000) + 1000}`,
    status: index === 0 ? "진행중" : index === 1 ? "예정" : "진행중",
    overview: `${festivalInfo.theme}를 주제로 한 ${areaCenter.name} 지역의 대표적인 축제입니다. 지역 주민과 관광객들이 함께 즐길 수 있는 다양한 프로그램이 준비되어 있습니다.`,
    areaCode: areaCode || "1",
    contentTypeId: "15",
    hasRealCoordinates: true, // 샘플 데이터이지만 해당 지역 좌표 사용
  }));

  // 키워드 필터링
  if (keyword && keyword.length >= 2) {
    const filtered = sampleFestivals.filter(
      (festival) =>
        festival.title.includes(keyword) || festival.location.includes(keyword)
    );
    if (filtered.length > 0) {
      console.log(
        `🔍 키워드 "${keyword}"로 필터링된 샘플 데이터: ${filtered.length}개`
      );
      return filtered;
    }
  }

  console.log(
    `🎭 ${areaCenter.name} 지역 샘플 축제 데이터 ${sampleFestivals.length}개 반환`
  );
  return sampleFestivals;
};

// Tour API 전용 fetchFestivalData 함수 (fetch().then() 방식)
const fetchFestivalData = (query = "") => {
  const keyword = extractKeyword(query);
  const areaCode = extractAreaCode(query);

  console.log("=== Tour API 전용 호출 시작 ===");
  console.log("검색 정보:", { query, keyword, areaCode });

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

  // 순차적으로 API 호출하는 함수
  const tryApiEndpoint = (endpointIndex) => {
    if (endpointIndex >= apiEndpoints.length) {
      return Promise.reject(
        new Error(
          "현재 진행중인 축제 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요."
        )
      );
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
          console.warn(`⚠️ ${endpoint.name} 실패: ${response.status}`);
          return tryApiEndpoint(endpointIndex + 1);
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

            // 지역코드와 좌표가 일치하는지 검증
            const areaCenter = getAreaCenter(item.areacode || areaCode);
            let isRegionMatched = true;

            if (isValidNumber && isInKoreaRegion && areaCenter) {
              const distanceFromCenter = calculateDistance(
                areaCenter.lat,
                areaCenter.lng,
                originalLat,
                originalLng
              );

              // 지역 중심에서 200km 이상 떨어지면 의심스러운 좌표로 판단
              isRegionMatched = distanceFromCenter <= 200;

              if (!isRegionMatched) {
                console.warn(
                  `⚠️ [${item.title}] 지역 불일치 좌표 - ${
                    areaCenter.name
                  } 중심에서 ${distanceFromCenter.toFixed(1)}km 떨어짐`
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

            // 기본 좌표 결정
            const defaultCoords = getDefaultCoordinates(
              item.areacode || areaCode
            );
            const finalLat = hasRealCoordinates
              ? originalLat
              : defaultCoords.lat;
            const finalLng = hasRealCoordinates
              ? originalLng
              : defaultCoords.lng;

            return {
              id: item.contentid || `festival_${index}`,
              title: item.title || "축제명 미상",
              startDate: item.eventstartdate || today,
              endDate: item.eventenddate || nextMonth,
              location: item.addr1 || "장소 미상",
              image:
                item.firstimage ||
                "https://via.placeholder.com/300x200?text=축제",
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

            // 해당 지역 축제가 없으면 샘플 데이터로 보강
            if (inRegionFestivals.length === 0) {
              console.log(
                `⚠️ ${areaCenter.name} 지역에 진행중인 축제가 없습니다. 샘플 데이터로 보강합니다.`
              );
              const sampleData = getSampleFestivalData(keyword, areaCode);

              // 샘플 데이터를 앞에 배치하고 기존 데이터는 뒤에 추가
              finalFestivals = [...sampleData, ...finalFestivals.slice(0, 5)];
              console.log(
                `🎨 샘플 데이터 보강 완료: ${finalFestivals.length}개`
              );
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
        console.error(`❌ ${endpoint.name} 오류:`, error.message);
        return tryApiEndpoint(endpointIndex + 1);
      });
  };

  // 첫 번째 엔드포인트부터 시작
  return tryApiEndpoint(0);
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
    return `죄송합니다. "${userQuery}"에 대한 정보를 찾을 수 없습니다.

🔍 **다른 검색 방법을 시도해보세요:**
- 지역명 포함: "전주 여행", "경남 여행", "제주 여행"
- 축제 유형: "벚꽃축제", "음식축제", "문화축제"  
- 여행 기간: "1박2일", "당일치기", "2박3일"

💡 **검색 팁:** 지역 + 여행기간을 함께 말씀해주세요!`;
  }

  console.log(`✅ ${festivals.length}개 Tour API 실제 데이터로 프롬프트 생성`);

  // 여행 기간 추출
  const durationMatch = userQuery.match(
    /(\d+박\d+일|\d+일|\d+박|당일|주말|연휴)/
  );
  const duration = durationMatch ? durationMatch[0] : "당일치기";

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

  // 기준 축제 중심의 스마트 여행코스 구성
  const mainFestival = festivals[0];
  const nearbyAttractions = festivals.slice(1, 4); // 주변 관광지 3개

  return `${contextMessage}

사용자 요청: "${userQuery}"
${currentRegion ? `지역: ${currentRegion}` : ""}
여행 기간: ${duration}

🎯 **핵심 기준지**: ${mainFestival.title}
📍 위치: ${mainFestival.location} @location:[${mainFestival.lat},${
    mainFestival.lng
  }]
📝 소개: ${mainFestival.overview.substring(0, 150)}...

🎪 **주변 추천지** (${nearbyAttractions.length}개):
${nearbyAttractions
  .map(
    (item, index) =>
      `${index + 1}. ${item.title}
📍 ${item.location} @location:[${item.lat},${item.lng}]
📝 ${item.overview.substring(0, 100)}...`
  )
  .join("\n\n")}

📋 **현실적인 여행코스 구성 가이드**:
${
  isReuse
    ? `위의 데이터를 활용하여 사용자의 추가 질문에 답변해주세요.`
    : `
🚗 **이동거리 제한** (매우 중요!):
- 기준지에서 40km 이내 장소만 포함 (편도 1시간 이내)
- 장소 간 이동시간 15-30분 이내 유지
- 하루 총 이동거리 80km 이하로 제한

⏰ **시간 배분 원칙**:
- 각 장소 체류시간: 최소 1-2시간 확보
- 식사시간: 1시간 이상 여유롭게 배정  
- 이동시간: 실제 교통상황 고려 (1.5배 여유)

🎯 **코스 구성 순서**:
1. "${mainFestival.title}"을 핵심 기준지로 설정
2. 기준지 중심 20km 이내 필수 관광지 선별
3. 동선 최적화: 시계방향/반시계방향 순환 코스
4. 점심/저녁 식사 장소를 이동 동선에 맞춰 배치`
}

**필수 답변 형식** (거리/시간 정보 포함):
[지역 소개] ${regionContext} 특색과 "${mainFestival.title}" 중심지 소개

[현실적인 ${duration} 코스] 
1. **오전 09:00** - ${mainFestival.title} @location:[${mainFestival.lat},${
    mainFestival.lng
  }]
   - 체류시간: 2시간, 기준지점
   
2. **오후 12:00** - 주변 관광지명 @location:[위도,경도]
   - 이동거리: XX km (약 XX분), 체류시간: 1.5시간
   
3. **오후 15:00** - 다른 관광지명 @location:[위도,경도]  
   - 이동거리: XX km (약 XX분), 체류시간: 1시간

💡 **총 이동거리**: XX km (편도 최대 40km 이내)
💡 **총 소요시간**: X시간 XX분 (이동+체류)

[맛집 정보] ${regionContext} 대표 맛집 1-2곳 (이동 동선 고려)
[교통 안내] 
- 대중교통: 가장 가까운 역/터미널  
- 자가용: 주차장 정보 및 예상 주차비
[현실적인 여행 팁] 이동시간, 교통체증, 날씨 등 실용정보

**중요**: 각 장소마다 @location:[위도,경도] 형식을 반드시 포함하세요.`;
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
    festival: { name: "", period: "", location: "" },
    courses: [],
    transportation: { nearestStation: "", recommendedMode: "" },
  });
  const [currentFestivalData, setCurrentFestivalData] = useState([]); // 현재 검색된 축제 데이터
  const [currentRegion, setCurrentRegion] = useState(""); // 현재 검색된 지역

  // 🧠 지능형 사용자 분석 상태
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
          apiKey
            ? `✅ 설정됨 (${apiKey.substring(0, 10)}...)`
            : "❌ 설정되지 않음"
        );

        if (!apiKey) {
          console.error("❌ VITE_KAKAO_MAP_API_KEY가 설정되지 않았습니다!");
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
          console.log("🔄 기존 카카오맵 스크립트 제거");
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
              console.log("✅ 카카오맵 SDK 초기화 완료");
              resolve();
            });
          } else {
            console.error("❌ 카카오맵 객체가 생성되지 않았습니다");
            console.error(
              "API 키가 유효하지 않거나 도메인 설정에 문제가 있을 수 있습니다"
            );
            console.warn("⚠️ 카카오맵 없이 계속 진행합니다.");
            resolve(); // 오류가 있어도 계속 진행
          }
        };

        script.onerror = (error) => {
          console.error("❌ 카카오맵 SDK 로드 실패:", error);
          console.error("🔧 해결 방법:");
          console.error("1. 카카오 개발자 콘솔에서 API 키 확인");
          console.error("2. 플랫폼 등록 상태 확인 (Web 플랫폼)");
          console.error("3. 도메인 설정 확인 (localhost 포함)");
          console.warn("⚠️ 카카오맵 없이 계속 진행합니다.");
          resolve(); // 오류가 있어도 계속 진행
        };

        document.head.appendChild(script);
      });
    };

    const initializeMap = async () => {
      try {
        console.log("🗺️ 지도 초기화 프로세스 시작");

        if (!window.kakao || !window.kakao.maps) {
          console.log("📡 카카오맵 SDK 로딩 필요");
          await loadKakaoMapScript();
        }

        // 지도 컨테이너 확인
        const mapContainer = document.getElementById("kakao-map");
        if (!mapContainer) {
          console.error("❌ 지도를 표시할 div를 찾을 수 없습니다.");
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

        console.log("✅ 지도 컨테이너 찾음:", mapContainer);
        console.log("📐 컨테이너 크기:", {
          width: mapContainer.offsetWidth,
          height: mapContainer.offsetHeight,
        });

        // 컨테이너 크기가 0인 경우 대기
        if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
          console.warn("⚠️ 지도 컨테이너 크기가 0입니다. 잠시 후 재시도...");
          setTimeout(() => initializeMap(), 100);
          return;
        }

        console.log("🗺️ 지도 초기화 시작");

        // 카카오맵 객체가 없는 경우 대체 처리
        if (!window.kakao || !window.kakao.maps) {
          console.warn("⚠️ 카카오맵 객체가 없어 대체 지도 표시");
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
        console.log("✅ 지도 초기화 완료");

        // 지도 로드 확인을 위한 이벤트 리스너
        window.kakao.maps.event.addListener(map, "tilesloaded", () => {
          console.log("✅ 지도 타일 로드 완료");
        });

        // 지도 클릭 이벤트 (테스트용)
        window.kakao.maps.event.addListener(map, "click", () => {
          console.log("🖱️ 지도 클릭됨 - 지도가 정상 작동중");
        });

        // 지도 크기 재조정
        setTimeout(() => {
          if (map) {
            map.relayout();
            console.log("🔄 지도 크기 재조정 완료");
          }
        }, 100);
      } catch (error) {
        console.error("❌ 지도 초기화 중 오류 발생:", error);
        console.error("📋 상세 오류:", error.message);
        console.error("🔧 해결 방법:");
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

  // 지도 마커 및 거리 표시 업데이트
  useEffect(() => {
    try {
      const map = mapRef.current;
      if (
        !map ||
        !window.kakao ||
        !window.kakao.maps ||
        locations.length === 0
      ) {
        console.log("🗺️ 지도 또는 카카오맵 객체가 없어 마커 표시 생략");
        return;
      }

      console.log("🗺️ 마커 및 거리 표시 업데이트 시작 - locations:", locations);

      // 기존 오버레이들 제거
      if (map._overlays) {
        map._overlays.forEach((overlay) => {
          if (overlay) overlay.setMap(null);
        });
      }
      map._overlays = [];

      // 지도 범위 객체 생성
      const bounds = new window.kakao.maps.LatLngBounds();

      // 각 위치에 번호가 있는 마커 생성
      locations.forEach((loc, index) => {
        const position = new window.kakao.maps.LatLng(loc.lat, loc.lng);

        // 커스텀 마커 (실제 좌표 vs 기본 좌표 구분)
        const isRealCoordinate = loc.hasRealCoordinates !== false; // 기본값 true (이전 데이터 호환)
        const markerColor = isRealCoordinate ? "#ff4757" : "#95a5a6"; // 빨간색 vs 회색
        const borderColor = isRealCoordinate ? "white" : "#7f8c8d";

        const markerContent = `
          <div style="
            background: ${markerColor};
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            border: 2px solid ${borderColor};
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            position: relative;
          ">
            ${index + 1}
            ${
              !isRealCoordinate
                ? '<div style="position: absolute; top: -2px; right: -2px; background: orange; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>'
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

        // 장소명 표시 (마커 아래) - 좌표 정확성 표시 포함
        const coordinateStatus = isRealCoordinate ? "📍" : "⚠️";
        const coordinateTooltip = isRealCoordinate
          ? "정확한 위치"
          : "대략적 위치";

        const infoContent = `
          <div style="
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: bold;
            color: #333;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            max-width: 200px;
            word-break: keep-all;
            text-align: center;
          ">
            ${coordinateStatus} ${loc.name || `장소 ${index + 1}`}
            <div style="font-size: 10px; color: #666; font-weight: normal; margin-top: 2px;">
              ${coordinateTooltip}
            </div>
          </div>
        `;

        const infoOverlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: infoContent,
          yAnchor: -0.8, // 마커 아래에 표시
        });

        infoOverlay.setMap(map);
        map._overlays.push(infoOverlay);

        bounds.extend(position);
      });

      // 마커 간 거리 표시 (연결선과 거리 정보)
      if (locations.length >= 2) {
        console.log("📏 마커 간 거리 계산 및 표시 시작");

        for (let i = 0; i < locations.length - 1; i++) {
          const start = locations[i];
          const end = locations[i + 1];

          const startPos = new window.kakao.maps.LatLng(start.lat, start.lng);
          const endPos = new window.kakao.maps.LatLng(end.lat, end.lng);

          // 거리 계산
          const distance = calculateDistance(
            start.lat,
            start.lng,
            end.lat,
            end.lng
          );

          // 연결선 그리기
          const polyline = new window.kakao.maps.Polyline({
            path: [startPos, endPos],
            strokeWeight: 3,
            strokeColor: "#ff6b6b",
            strokeOpacity: 0.8,
            strokeStyle: "solid",
          });

          polyline.setMap(map);
          map._overlays.push(polyline);

          // 중간 지점 계산 (연결선 중간에 거리 표시)
          const midLat = (start.lat + end.lat) / 2;
          const midLng = (start.lng + end.lng) / 2;
          const midPosition = new window.kakao.maps.LatLng(midLat, midLng);

          // 거리 정보 표시
          const distanceContent = `
            <div style="
              background: rgba(255, 107, 107, 0.95);
              color: white;
              border-radius: 12px;
              padding: 4px 8px;
              font-size: 11px;
              font-weight: bold;
              border: 1px solid rgba(255, 255, 255, 0.3);
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              white-space: nowrap;
            ">
              📏 ${distance.toFixed(1)}km
            </div>
          `;

          const distanceOverlay = new window.kakao.maps.CustomOverlay({
            position: midPosition,
            content: distanceContent,
            yAnchor: 0.5,
          });

          distanceOverlay.setMap(map);
          map._overlays.push(distanceOverlay);

          console.log(`📏 ${i + 1}→${i + 2}: ${distance.toFixed(1)}km`);
        }

        // 전체 여행 거리 계산
        const totalDistance = locations.reduce((total, loc, index) => {
          if (index === 0) return 0;
          const prev = locations[index - 1];
          return (
            total + calculateDistance(prev.lat, prev.lng, loc.lat, loc.lng)
          );
        }, 0);

        console.log(`🎯 총 여행 거리: ${totalDistance.toFixed(1)}km`);

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

          newLocations.push({ lat, lng, name: placeName });
          console.log(
            `위치 ${newLocations.length} 추가됨: ${placeName} (위도 ${lat}, 경도 ${lng})`
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

        // 여행 정보 추출 및 업데이트 (새로운 포맷에 맞게)
        console.log("🔍 여행 정보 추출 시작");

        // 지역 정보 추출
        const regionMatch = response.match(/\[지역 소개\]\s*(.*?)(?=\[|$)/s);
        const regionInfo = regionMatch ? regionMatch[1].trim() : "";

        const festivalInfo = {
          name: regionInfo
            ? `${currentRegion || "추천"} 여행코스`
            : "여행 계획",
          period: "여행 기간에 따라 조정 가능",
          location: regionInfo || "추천 지역",
        };
        console.log("📍 축제 정보:", festivalInfo);

        // 추천 코스 추출 (시간 - 활동 패턴)
        const courses = [];
        const courseRegex =
          /(\d{1,2}\.\s*.*?(\d{2}:\d{2}|오전|오후|저녁|밤).*?)\s*-\s*([^\n@]+?)(?=@location|\n|$)/g;
        let courseMatch;
        let courseIndex = 1;

        // 더 유연한 코스 추출
        const lines = response.split("\n");
        lines.forEach((line) => {
          // "1. **시간** - 장소명" 패턴 매치
          const timeActivityMatch = line.match(
            /(\d+)\.\s*\*\*(.*?)\*\*\s*-\s*([^@\n]+)/
          );
          if (timeActivityMatch) {
            courses.push({
              time: timeActivityMatch[2].trim(),
              activity: timeActivityMatch[3].trim(),
            });
          }
          // "1. 시간 - 장소명" 패턴도 매치 (볼드 없이)
          else if (
            line.match(/\d+\.\s*.*?-\s*[^@\n]+/) &&
            !line.includes("@location")
          ) {
            const simpleMatch = line.match(/\d+\.\s*(.*?)\s*-\s*([^@\n]+)/);
            if (simpleMatch) {
              courses.push({
                time: simpleMatch[1].trim(),
                activity: simpleMatch[2].trim(),
              });
            }
          }
        });

        console.log("🗓️ 추출된 코스:", courses);

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
        console.log("🚗 교통 정보:", transportation);

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

    // 축제 관련 질문이 아닌 경우
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
        console.error("기본 응답 오류:", error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 새로운 검색이 필요한지 판단
    const shouldSearch = needsNewSearch(inputMessage, currentRegion);

    let festivalDataPromise;

    if (shouldSearch) {
      // 1단계: Tour API 데이터 조회 (새로운 검색)
      console.log("🔍 새로운 Tour API 데이터 조회 시작");
      festivalDataPromise = fetchFestivalData(inputMessage).then((data) => {
        console.log(`✅ 새로운 검색 완료: ${data.length}개 축제`);
        setCurrentFestivalData(data);

        // 새로운 지역 설정
        const areaCode = extractAreaCode(inputMessage);
        if (areaCode) {
          const regionName = extractAreaName(areaCode);
          setCurrentRegion(regionName);
          console.log("📍 새로운 지역 설정:", regionName);
        }

        return data;
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

    // 축제 데이터 처리
    festivalDataPromise
      .then((festivalData) => {
        console.log(`✅ 사용할 축제 데이터: ${festivalData.length}개`);

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
        console.log(
          "🔑 OpenAI API 키 확인:",
          openaiKey ? "✅ 존재함" : "❌ 없음"
        );

        if (!openaiKey) {
          throw new Error("OpenAI API 키가 설정되지 않았습니다.");
        }

        console.log("🚀 OpenAI API 요청 시작...");
        console.log("🔑 OpenAI 키 길이:", openaiKey?.length);
        console.log("📝 전송할 프롬프트:", prompt.substring(0, 500) + "...");

        // 🧠 대화 기록 포함 - 컨텍스트 유지
        const conversationHistory = messages.slice(-3).map((msg) => ({
          role: msg.role,
          content: msg.content.substring(0, 500), // 토큰 절약을 위해 500자로 제한
        }));

        const enhancedMessages = [
          {
            role: "system",
            content: ASSISTANT_INSTRUCTIONS,
          },
          ...conversationHistory, // 🔄 최근 대화 3개 포함
          {
            role: "user",
            content: `
🎯 현재 상황:
- 지역: ${currentRegion || "미설정"}
- 기존 데이터: ${currentFestivalData.length}개 축제 정보 보유
- 데이터 재사용: ${!shouldSearch ? "✅ 기존 데이터 활용" : "❌ 새로운 검색"}

🧠 사용자 프로필 (개인화 추천용):
- 여행 스타일: ${userProfile.travelStyle}
- 선호 기간: ${userProfile.preferredDuration}
- 동반자: ${userProfile.companions}
- 관심 지역: ${userProfile.visitedRegions.join(", ") || "미파악"}
- 예산 수준: ${userProfile.budgetLevel}

📋 사용자 요청:
${prompt}

💡 개인화 지침: 
- 위 프로필을 바탕으로 **맞춤형** 추천 제공
- ${userProfile.travelStyle === "foodie" ? "맛집과 로컬 푸드 중점 추천" : ""}
- ${
              userProfile.companions === "family"
                ? "아이와 함께 즐길 수 있는 활동 포함"
                : ""
            }
- ${
              userProfile.companions === "couple"
                ? "로맨틱하고 사진 찍기 좋은 장소 추천"
                : ""
            }
- ${userProfile.travelStyle === "nature" ? "자연 경관과 힐링 스팟 우선" : ""}
            `,
          },
        ];

        return openai.chat.completions
          .create({
            model: "gpt-4o-mini", // 🧠 비용 효율적인 모델
            messages: enhancedMessages,
            max_tokens: 1000, // 🚀 적절한 토큰 수
            temperature: 0.7, // 🎨 창의성 증가 (더 다양한 응답)
            top_p: 0.9, // 🎯 응답 품질 향상
            frequency_penalty: 0.1, // 🔄 반복 방지
            presence_penalty: 0.1, // ✨ 다양성 증가
            stream: false,
          })
          .then((response) => {
            console.log("✅ OpenAI API 응답 받음:", response);
            return response;
          })
          .catch((error) => {
            console.error("❌ OpenAI API 오류:", error);
            throw error;
          });
      })
      .then(async (completion) => {
        try {
          console.log("🎯 OpenAI 일반 응답 처리 시작");
          console.log("📄 전체 응답:", completion);

          // 응답 구조 확인
          if (!completion?.choices || completion.choices.length === 0) {
            console.error("❌ OpenAI 응답에 choices가 없습니다:", completion);
            throw new Error("OpenAI 응답 형식이 올바르지 않습니다.");
          }

          const choice = completion.choices[0];
          console.log("📝 첫 번째 choice:", choice);

          const fullResponse = choice?.message?.content || "";
          console.log("✅ 응답 내용:", fullResponse);
          console.log("📏 응답 길이:", fullResponse.length);

          if (!fullResponse.trim()) {
            console.error("❌ 빈 응답 감지 - OpenAI 응답 구조:", {
              choices: completion.choices.length,
              firstChoice: choice,
              message: choice?.message,
              content: choice?.message?.content,
            });
            throw new Error("OpenAI로부터 빈 응답을 받았습니다.");
          }

          // 스트리밍 시뮬레이션 (사용자 경험)
          await simulateTextStreaming(
            fullResponse.replace(
              /@location:\s*\[\d+\.\d+\s*,\s*\d+\.\d+\]/g,
              ""
            ),
            (text) => {
              setCurrentStreamMessage(text);
            }
          );

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
          console.error("❌ OpenAI 응답 처리 오류:", responseError);
          throw new Error(
            `AI 응답 생성 중 오류가 발생했습니다: ${responseError.message}`
          );
        }
      })
      .catch((error) => {
        console.error("❌ 처리 오류:", error);

        let errorMessage = "서비스 이용 중 오류가 발생했습니다.";

        if (
          error.message.includes("Tour API") ||
          error.message.includes("축제 정보를 찾을 수 없습니다")
        ) {
          errorMessage = `${error.message}

🔧 **해결방법:**
1. 다른 지역명으로 검색해보세요 (예: "서울", "부산", "제주")
2. 축제 종류를 명시해보세요 (예: "음식축제", "문화축제")
3. 더 일반적인 키워드로 검색해보세요 (예: "축제", "행사")

💡 **참고:** Tour API에서 실시간으로 검색하므로 현재 진행중이거나 예정된 축제만 표시됩니다.`;
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
        {travelInfo.festival.name && (
          <div className="ai-chatbot-travel-summary">
            <div className="ai-chatbot-travel-info-grid">
              <div className="ai-chatbot-festival-info">
                <h3>축제 정보</h3>
                <p>
                  <strong className="ai-chatbot-strong">축제명:</strong>{" "}
                  {travelInfo.festival.name}
                </p>
                <p>
                  <strong className="ai-chatbot-strong">기간:</strong>{" "}
                  {travelInfo.festival.period}
                </p>
                <p>
                  <strong className="ai-chatbot-strong">장소:</strong>{" "}
                  {travelInfo.festival.location}
                </p>
              </div>

              <div className="ai-chatbot-course-timeline">
                <h3>추천 코스</h3>
                {travelInfo.courses.map((course, index) => (
                  <div key={index} className="ai-chatbot-course-item">
                    <div className="ai-chatbot-course-number">{index + 1}</div>
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

              <div className="ai-chatbot-transportation-info">
                <h3>교통 안내</h3>
                <p>
                  <strong className="ai-chatbot-strong">가장 가까운 역:</strong>{" "}
                  {travelInfo.transportation.nearestStation}
                </p>
                <p>
                  <strong className="ai-chatbot-strong">추천 이동수단:</strong>{" "}
                  {travelInfo.transportation.recommendedMode}
                </p>
              </div>
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
        )}
      </div>
    </>
  );
};

export default AIChatbot;
