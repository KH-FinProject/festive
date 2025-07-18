package com.project.festive.festiveserver.ai.service;

import com.project.festive.festiveserver.ai.dto.TravelAnalysis;
import com.project.festive.festiveserver.area.service.AreaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TravelAnalysisServiceImpl implements TravelAnalysisService {

    private final AreaService areaService;
    private final OpenAIService openAIService;
    
    // DB 기반 매핑 사용 (하드코딩 대신)
    // private final Map<String, String> AREA_CODE_MAP = new HashMap<String, String>() {{ ... }};
    // private final Map<String, String> SIGUNGU_CODE_MAP = new HashMap<String, String>() {{ ... }};

    @Override
    public TravelAnalysis createFastAnalysis(String userMessage) {

        
        try {
            // 기본값 설정
            String requestType = determineRequestType(userMessage);
            String duration = extractDurationFromMessageEnhanced(userMessage);
            String keyword = extractKeywordFromRequest(userMessage);
            String intent = "여행 추천";
            
            // 지역 정보 추출 (DB 기반 매핑 사용)
            RegionInfo regionInfo = extractRegionInfo(userMessage);
            String region = regionInfo.getRegionName();
            String areaCode = regionInfo.getAreaCode();
            String sigunguCode = regionInfo.getSigunguCode();
            
            // 선호 콘텐츠 타입 감지
            String preferredContentType = detectPreferredContentType(userMessage);
            
            TravelAnalysis analysis = new TravelAnalysis(requestType, region, keyword, duration, intent, areaCode, sigunguCode);
            analysis.setPreferredContentType(preferredContentType);
            

            return analysis;
            
        } catch (Exception e) {
            log.error("❌ 빠른 분석 실패: {}", e.getMessage(), e);
            // 기본 분석 반환
            return new TravelAnalysis("travel_only", "한국", userMessage, "1일", "여행 추천");
        }
    }

    @Override
    public String detectPreferredContentType(String message) {
        String lowerMessage = message.toLowerCase();
        
        // 여행코스 관련 키워드
        if (lowerMessage.contains("코스") || lowerMessage.contains("일정") || 
            lowerMessage.contains("루트") || lowerMessage.contains("동선")) {
            return "25"; // 여행코스
        }
        
        // 관광지 관련 키워드
        if (lowerMessage.contains("관광지") || lowerMessage.contains("명소") || 
            lowerMessage.contains("볼거리") || lowerMessage.contains("구경")) {
            return "12"; // 관광지
        }
        
        // 문화시설 관련 키워드
        if (lowerMessage.contains("박물관") || lowerMessage.contains("미술관") || 
            lowerMessage.contains("전시") || lowerMessage.contains("문화")) {
            return "14"; // 문화시설
        }
        
        // 축제 관련 키워드
        if (lowerMessage.contains("축제") || lowerMessage.contains("행사") || 
            lowerMessage.contains("이벤트") || lowerMessage.contains("페스티벌")) {
            return "15"; // 축제공연행사
        }
        
        // 🍽️ 음식 관련 키워드 (단순 맛집 추천과 여행 맛집 구분)
        if (lowerMessage.contains("맛집") || lowerMessage.contains("음식") || 
            lowerMessage.contains("식당") || lowerMessage.contains("먹거리")) {
            
            // 여행 키워드가 없으면 단순 맛집 검색
            boolean hasTravelContext = lowerMessage.contains("여행") || lowerMessage.contains("코스") ||
                                     lowerMessage.contains("일정") || lowerMessage.contains("루트") ||
                                     lowerMessage.contains("박") || lowerMessage.contains("당일");
            
            if (!hasTravelContext) {
                log.info("🍽️ 단순 맛집 검색 감지: 여행 컨텍스트 없음");
                return "SIMPLE_FOOD"; // 단순 맛집 검색 표시
            }
            
            return "39"; // 음식점 (여행 맛집)
        }
        
        // 쇼핑 관련 키워드
        if (lowerMessage.contains("쇼핑") || lowerMessage.contains("시장") || 
            lowerMessage.contains("백화점") || lowerMessage.contains("아울렛") ||
            lowerMessage.contains("쇼핑몰") || lowerMessage.contains("마켓") ||
            lowerMessage.contains("상점") || lowerMessage.contains("매장") ||
            lowerMessage.contains("구매") || lowerMessage.contains("쇼핑센터")) {
            return "38"; // 쇼핑
        }
        
        // 레포츠 관련 키워드
        if (lowerMessage.contains("레포츠") || lowerMessage.contains("체험") || 
            lowerMessage.contains("액티비티") || lowerMessage.contains("스포츠") ||
            lowerMessage.contains("모험") || lowerMessage.contains("야외활동") ||
            lowerMessage.contains("어드벤처")) {
            return "28"; // 레포츠
        }
        
        // 숙박 관련 키워드
        if (lowerMessage.contains("숙박") || lowerMessage.contains("호텔") || 
            lowerMessage.contains("펜션") || lowerMessage.contains("리조트") ||
            lowerMessage.contains("민박") || lowerMessage.contains("게스트하우스") ||
            lowerMessage.contains("숙소") || lowerMessage.contains("잠잘곳")) {
            return "32"; // 숙박
        }
        
        return null; // 특별한 선호도 없음
    }

    @Override
    public boolean isTravelOrFestivalRelated(String message) {
        if (message == null || message.trim().isEmpty()) {
            return false;
        }
        
        String lowerMessage = message.toLowerCase().trim();
        
        // 🚫 너무 짧거나 애매한 요청은 거부
        if (lowerMessage.length() <= 2) {
            return false;
        }
        
        // 🚫 단순한 단어만 있는 경우 거부 (지역명이나 구체적인 키워드 없이)
        String[] ambiguousWords = {"추천", "알려줘", "찾아줘", "뭐가", "어떤", "좋은", "괜찮은"};
        for (String ambiguous : ambiguousWords) {
            if (lowerMessage.equals(ambiguous)) {
                return false; // 단독으로 사용된 경우 거부
            }
        }
        
        // 여행 관련 키워드 (구체적인 키워드만)
        String[] travelKeywords = {
            "여행", "관광", "휴가", "여행지", "관광지", "명소", "볼거리",
            "일정", "코스", "루트", "동선", "가볼만한",
            "박물관", "미술관", "전시", "문화", "역사", "유적",
            "맛집", "음식", "식당", "먹거리", "카페",
            "숙박", "호텔", "펜션", "민박", "리조트",
            "축제", "행사", "이벤트", "페스티벌", "공연",
            "해변", "바다", "산", "강", "호수", "공원",
            "온천", "스파", "체험", "액티비티"
        };
        
        // 추천 키워드는 다른 키워드와 함께 사용될 때만 유효
        boolean hasRecommendationWord = lowerMessage.contains("추천");
        boolean hasOtherTravelKeyword = false;
        
        for (String keyword : travelKeywords) {
            if (lowerMessage.contains(keyword)) {
                hasOtherTravelKeyword = true;
                break;
            }
        }
        
        // "추천"이 있으면서 다른 여행 키워드도 있는 경우에만 유효
        if (hasRecommendationWord && hasOtherTravelKeyword) {
            return true;
        }
        
        // "추천"이 없고 다른 여행 키워드가 있는 경우
        if (!hasRecommendationWord && hasOtherTravelKeyword) {
            return true;
        }
        
        // 지역명 체크 - 하지만 지역명만 있고 다른 키워드가 없으면 애매한 요청으로 간주
        Map<String, String> areaCodeMapping = areaService.getAreaCodeMapping();
        boolean hasRegionName = false;
        for (String region : areaCodeMapping.keySet()) {
            if (lowerMessage.contains(region.toLowerCase())) {
                hasRegionName = true;
                break;
            }
        }
        
        // 지역명이 있으면서 다른 여행 키워드도 있는 경우에만 유효
        if (hasRegionName && (hasOtherTravelKeyword || hasRecommendationWord)) {
            return true;
        }
        
        // 기간이 포함된 경우 (박, 일 등) - 지역명과 함께 있어야 함
        if (lowerMessage.matches(".*\\d+박.*") || lowerMessage.matches(".*\\d+일.*")) {
            return hasRegionName; // 지역명이 있어야 유효한 여행 요청
        }
        
        return false;
    }

    @Override
    public String extractDurationFromMessageEnhanced(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "1일";
        }
        
        String lowerMessage = message.toLowerCase();
        
        // 🍽️ 단순 맛집 추천인 경우 기간 설정하지 않음
        boolean hasSimpleFoodRequest = (lowerMessage.contains("맛집") || lowerMessage.contains("음식") || 
                                       lowerMessage.contains("식당") || lowerMessage.contains("먹거리")) &&
                                      (lowerMessage.contains("추천") || lowerMessage.contains("알려") || 
                                       lowerMessage.contains("찾아"));
        
        boolean hasTravelContext = lowerMessage.contains("여행") || lowerMessage.contains("코스") ||
                                 lowerMessage.contains("일정") || lowerMessage.contains("루트") ||
                                 lowerMessage.contains("박") || lowerMessage.contains("당일");
        
        if (hasSimpleFoodRequest && !hasTravelContext) {
            log.info("🍽️ 단순 맛집 추천 - 기간 설정하지 않음");
            return null; // 기간 없음
        }
        
        // 패턴 매칭으로 기간 추출
        Pattern[] patterns = {
            Pattern.compile("(\\d+)박\\s*(\\d+)일"), // "2박3일"
            Pattern.compile("(\\d+)박"), // "2박"
            Pattern.compile("(\\d+)일"), // "3일"
            Pattern.compile("(\\d+)시간"), // "5시간"
        };
        
        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(lowerMessage);
            if (matcher.find()) {
                if (pattern.pattern().contains("박.*일")) {
                    // "2박3일" 형태
                    int nights = Integer.parseInt(matcher.group(1));
                    int days = Integer.parseInt(matcher.group(2));
                    
                    // 🚫 4박5일 제한: 4박을 초과하면 4박5일로 제한
                    if (nights > 4) {
                        return "4박5일";
                    }
                    
                    return nights + "박" + days + "일";
                } else if (pattern.pattern().contains("박")) {
                    // "2박" 형태 -> "2박3일"로 변환
                    int nights = Integer.parseInt(matcher.group(1));
                    
                    // 🚫 4박5일 제한: 4박을 초과하면 4박5일로 제한
                    if (nights > 4) {
                        return "4박5일";
                    }
                    
                    return nights + "박" + (nights + 1) + "일";
                } else if (pattern.pattern().contains("일")) {
                    // "3일" 형태
                    int days = Integer.parseInt(matcher.group(1));
                    
                    // 🚫 5일 제한: 5일을 초과하면 4박5일로 제한
                    if (days > 5) {
                        return "4박5일";
                    }
                    
                    return days + "일";
                } else if (pattern.pattern().contains("시간")) {
                    // "5시간" -> "1일"로 변환
                    return "1일";
                }
            }
        }
        
        // 키워드 기반 추정 (4박5일 제한 적용)
        if (lowerMessage.contains("당일") || lowerMessage.contains("하루")) {
            return "1일";
        } else if (lowerMessage.contains("1박") || lowerMessage.contains("주말")) {
            return "1박2일";
        } else if (lowerMessage.contains("2박")) {
            return "2박3일";
        } else if (lowerMessage.contains("3박")) {
            return "3박4일";
        } else if (lowerMessage.contains("4박")) {
            return "4박5일";
        } else if (lowerMessage.contains("5박") || lowerMessage.contains("6박") || lowerMessage.contains("7박") || 
                   lowerMessage.contains("8박") || lowerMessage.contains("9박") || lowerMessage.contains("10박")) {
            return "4박5일";
        }
        
        return "1일"; // 기본값
    }

    @Override
    public String mapRegionToAreaCode(String region) {
        if (region == null || region.trim().isEmpty()) {
            return null;
        }
        
        // DB 기반 매핑 사용
        Map<String, String> areaCodeMapping = areaService.getAreaCodeMapping();
        return areaCodeMapping.get(region.trim());
    }

    @Override
    public RegionInfo extractRegionInfo(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return new RegionInfo(null, null, "한국");
        }
        
        String message = userMessage.toLowerCase().trim();
        
        // 🚇 역사명 기반 강제 매핑 (우선순위 최고) - 명동역 문제 해결
        if (message.contains("명동역") || message.contains("명동")) {
            log.info("🚇 역사명 강제 매핑: 명동역 → 서울 중구");
            return new RegionInfo("1", "1_24", "명동역");
        }
        if (message.contains("홍대입구역") || message.contains("홍대")) {
            log.info("🚇 역사명 강제 매핑: 홍대 → 서울 마포구");
            return new RegionInfo("1", "1_13", "홍대");
        }
        if (message.contains("강남역") || message.contains("강남")) {
            log.info("🚇 역사명 강제 매핑: 강남역 → 서울 강남구");
            return new RegionInfo("1", "1_11", "강남역");
        }
        if (message.contains("신촌역") || message.contains("신촌")) {
            log.info("🚇 역사명 강제 매핑: 신촌 → 서울 서대문구");
            return new RegionInfo("1", "1_5", "신촌");
        }
        if (message.contains("이태원역") || message.contains("이태원")) {
            log.info("🚇 역사명 강제 매핑: 이태원 → 서울 용산구");
            return new RegionInfo("1", "1_21", "이태원");
        }
        if (message.contains("잠실역") || message.contains("잠실")) {
            log.info("🚇 역사명 강제 매핑: 잠실 → 서울 송파구");
            return new RegionInfo("1", "1_18", "잠실");
        }
        
        // DB 기반 시군구 매핑 사용
        Map<String, String> sigunguCodeMapping = areaService.getSigunguCodeMapping();
        

        
        // 🚫 일반적인 조사/어미 제외 리스트 (역사명 고려하여 조정)
        String[] excludedWords = {
            "로", "에", "으로", "에서", "까지", "부터", "와", "과", "을", "를", "이", "가", "의", "도", "만", "라서", "라고",
            "고", "면", "리", "번지", "호", "층", "가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하",
            "동", "구" // 추가: 너무 일반적인 단어는 지역명으로 부적절 (명동역 문제 해결)
        };
        
        // 시군구 코드 먼저 확인 (더 구체적이므로) - 길이 순으로 정렬하여 긴 이름부터 매칭
        List<Map.Entry<String, String>> sortedEntries = sigunguCodeMapping.entrySet().stream()
            .sorted((a, b) -> Integer.compare(b.getKey().length(), a.getKey().length())) // 길이 내림차순
            .collect(Collectors.toList());
        
        for (Map.Entry<String, String> entry : sortedEntries) {
            String cityName = entry.getKey();
            String normalizedCityName = cityName.toLowerCase().trim();
            
            // 🚫 너무 짧거나 일반적인 조사/어미는 제외 (최소 3글자 이상)
            if (cityName.length() <= 2) {
                log.debug("🚫 너무 짧은 지역명 스킵: '{}'", cityName);
                continue; // 2글자 이하는 제외
            }
            
            boolean isExcluded = false;
            for (String excluded : excludedWords) {
                if (cityName.equals(excluded)) {
                    log.debug("🚫 제외된 단어로 인한 매칭 스킵: '{}'", cityName);
                    isExcluded = true;
                    break;
                }
            }
            if (isExcluded) continue;
            
            // 🚫 의미 있는 지역명인지 추가 검증
            if (!isValidRegionName(cityName)) {
                log.debug("🚫 유효하지 않은 지역명 스킵: '{}'", cityName);
                continue;
            }
            

            
            // 더 정확한 매칭을 위한 다양한 패턴 체크
            boolean isMatched = false;
            String matchType = "";
            
            // 1. 정확한 매칭 (통영시 -> 통영시)
            if (message.contains(normalizedCityName)) {
                isMatched = true;
                matchType = "정확한 매칭";
            }
            // 2. 시/군/구 제거 매칭 (통영시 -> 통영)
            else if (normalizedCityName.endsWith("시") || normalizedCityName.endsWith("군") || normalizedCityName.endsWith("구")) {
                String baseCity = normalizedCityName.substring(0, normalizedCityName.length() - 1);
                if (baseCity.length() >= 2 && message.contains(baseCity)) { // 최소 2글자 이상
                    isMatched = true;
                    matchType = "시/군/구 제거 매칭";
                }
            }
            // 3. 반대 매칭 (통영 -> 통영시) - 단, 충분히 긴 이름만
            else if (cityName.length() > 2) {
                String baseCityName = cityName.substring(0, cityName.length() - 1);
                if (baseCityName.length() >= 2 && message.contains(baseCityName.toLowerCase())) {
                    isMatched = true;
                    matchType = "반대 매칭";
                }
            }
            
            if (isMatched) {
                String sigunguCode = entry.getValue();
                String[] parts = sigunguCode.split("_");
                String areaCode = parts[0];
                String regionName = findRegionNameByAreaCode(areaCode) + " " + cityName;
                

                
                return new RegionInfo(areaCode, sigunguCode, regionName);
            }
        }
        
        // DB 기반 지역 매핑 사용 (광역시/도)
        Map<String, String> areaCodeMapping = areaService.getAreaCodeMapping();
        
        for (Map.Entry<String, String> entry : areaCodeMapping.entrySet()) {
            String regionName = entry.getKey();
            if (message.contains(regionName.toLowerCase())) {
                String areaCode = entry.getValue();
                return new RegionInfo(areaCode, null, regionName);
            }
        }
        
        // 🤖 AI 기반 지역 추출 시도
        RegionInfo aiRegionInfo = extractRegionWithAI(userMessage, sigunguCodeMapping, areaCodeMapping);
        if (aiRegionInfo != null) {
            // AI가 추론한 지역명이 DB 목록과 정확히 매칭되는지 검증
            RegionInfo validatedRegion = validateAndRefineAIRegion(aiRegionInfo, userMessage, sigunguCodeMapping, areaCodeMapping);
            if (validatedRegion != null) {
                return validatedRegion;
            }
        }
        
        log.warn("⚠️ 지역 매핑 실패 - 전국으로 설정: '{}'", userMessage);
        return new RegionInfo(null, null, "한국");
    }

    @Override
    public String findRegionNameByAreaCode(String areaCode) {
        if (areaCode == null) return null;
        
        // 역매핑을 위한 검색
        Map<String, String> areaCodeMapping = areaService.getAreaCodeMapping();
        for (Map.Entry<String, String> entry : areaCodeMapping.entrySet()) {
            if (entry.getValue().equals(areaCode)) {
                return entry.getKey();
            }
        }
        
        return "알 수 없음";
    }

    @Override
    public String determineRequestType(String message) {
        String lowerMessage = message.toLowerCase().replace(" ", "");
        
        log.info("🔍 요청 타입 분석 시작: '{}'", message);
        
        // 0️⃣ 단순 맛집/음식점 추천 체크 (여행과 구분)
        boolean hasSimpleFoodRequest = (lowerMessage.contains("맛집") || lowerMessage.contains("음식") || 
                                       lowerMessage.contains("식당") || lowerMessage.contains("먹거리")) &&
                                      (lowerMessage.contains("추천") || lowerMessage.contains("알려") || 
                                       lowerMessage.contains("찾아"));
        
        boolean hasTravelContext = lowerMessage.contains("여행") || lowerMessage.contains("코스") ||
                                 lowerMessage.contains("일정") || lowerMessage.contains("루트") ||
                                 lowerMessage.contains("박") || lowerMessage.contains("당일");
        
        if (hasSimpleFoodRequest && !hasTravelContext) {
            log.info("🍽️ 단순 맛집 추천 감지 → food_only");
            return "food_only";
        }
        
        // 1. 여행/축제 관련성 체크
        if (!isTravelOrFestivalRelated(message)) {
            log.info("❌ 여행/축제 관련 없음 → unclear_request");
            return "unclear_request";
        }
        
        // 🎯 3가지 기능 명확 구분
        
        // 1️⃣ 축제 기반 여행코스 추천 (festival_travel)
        // - "축제" + ("여행코스", "일정", "계획", "추천", "박", "일")
        boolean hasFestivalKeyword = lowerMessage.contains("축제") || lowerMessage.contains("페스티벌") || 
                                   lowerMessage.contains("행사") || lowerMessage.contains("이벤트");
        
        boolean hasTravelPlanKeyword = lowerMessage.contains("여행코스") || lowerMessage.contains("여행계획") || 
                                     lowerMessage.contains("일정") || lowerMessage.contains("코스") || 
                                     lowerMessage.contains("루트") || lowerMessage.contains("동선") ||
                                     lowerMessage.contains("박") || 
                                     (lowerMessage.contains("추천") && (lowerMessage.contains("여행") || lowerMessage.contains("계획")));
        
        if (hasFestivalKeyword && hasTravelPlanKeyword) {
            log.info("🎪✈️ 축제 기반 여행코스 추천 감지 → festival_travel");
            return "festival_travel";
        }
        
        // 2️⃣ 순수 축제 검색 (festival_info)
        // - "축제" + ("알려줘", "정보", "찾아줘", "검색", "뭐있어", "목록") 
        // - 또는 특정 키워드 + ("알려줘", "정보") (예: "드론 알려줘")
        boolean hasInfoRequestKeyword = lowerMessage.contains("알려줘") || lowerMessage.contains("정보") || 
                                      lowerMessage.contains("찾아줘") || lowerMessage.contains("검색") || 
                                      lowerMessage.contains("뭐있어") || lowerMessage.contains("목록") ||
                                      lowerMessage.contains("리스트") || lowerMessage.contains("소개") ||
                                      lowerMessage.contains("있나") || lowerMessage.contains("있어");
        
        // 특정 키워드 감지 (드론, 벚꽃 등)
        boolean hasSpecificKeyword = hasSpecificFestivalKeyword(message);
        
        // 🎯 축제 정보 검색 우선 판별
        if (hasFestivalKeyword && hasInfoRequestKeyword && !hasTravelPlanKeyword) {
            log.info("🎪📋 축제 정보 검색 감지 (축제+정보요청) → festival_info");
            return "festival_info";
        }
        
        // 🎯 특정 키워드 기반 축제 검색
        if (hasSpecificKeyword && hasInfoRequestKeyword && !hasTravelPlanKeyword) {
            log.info("🎯📋 키워드 기반 축제 검색 감지 → festival_info");
            return "festival_info";
        }
        
        // 🎯 특정 키워드만 있는 경우도 축제 검색으로 처리 (예: "서울 벚꽃축제")
        if (hasSpecificKeyword && !hasTravelPlanKeyword) {
            log.info("🌸 특정 키워드 기반 축제 검색 → festival_info");
            return "festival_info";
        }
        
        // 🎯 축제 키워드만 있고 명확한 지시어가 없는 경우도 축제 정보 검색
        if (hasFestivalKeyword && !hasTravelPlanKeyword && !hasInfoRequestKeyword) {
            // 단순히 "서울 축제" 같은 요청도 축제 정보 검색으로 처리
            log.info("🎪❓ 축제 키워드만 있음 → festival_info (기본값)");
            return "festival_info";
        }
        
        // 3️⃣ 일반 여행코스 추천 (travel_only)
        // - 축제 키워드 없이 여행 관련 키워드만 있는 경우
        if (hasTravelPlanKeyword && !hasFestivalKeyword) {
            log.info("✈️ 일반 여행코스 추천 감지 → travel_only");
            return "travel_only";
        }
        
        // 🏠 기본값: 일반 여행 추천
        log.info("🔄 기본값 적용 → travel_only");
        return "travel_only";
    }
    
    /**
     * 구체적인 축제 키워드 감지 (드론, 벚꽃, K-POP 등)
     */
    private boolean hasSpecificFestivalKeyword(String message) {
        String lowerMessage = message.toLowerCase();
        
        // 🎯 구체적인 축제 관련 키워드들
        String[] specificKeywords = {
            // 자연/식물
            "벚꽃", "장미", "튤립", "유채", "해바라기", "코스모스", "단풍", "꽃", "불꽃",
            // 기술/현대
            "드론", "로봇", "AI", "VR", "게임", "IT", "핸드폰", "컴퓨터", "기술",
            // 문화/예술
            "K-POP", "KPOP", "케이팝", "재즈", "클래식", "미술", "사진", "영화", "음악",
            // 음식
            "김치", "치킨", "맥주", "와인", "커피", "디저트", "음식", "먹거리",
            // 기타
            "자동차", "패션", "뷰티", "스포츠", "문화", "전통", "역사"
        };
        
        for (String keyword : specificKeywords) {
            if (lowerMessage.contains(keyword)) {
                log.debug("🎯 구체적 키워드 발견: '{}'", keyword);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 간단한 키워드 감지 (순환 호출 방지)
     */
    private boolean hasSimpleKeyword(String message) {
        String[] words = message.split("\\s+");
        for (String word : words) {
            word = word.replaceAll("[^가-힣a-zA-Z]", "").toLowerCase();
            if (word.length() >= 2 && !isSimpleCommonWord(word)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 간단한 공통 단어 체크 (순환 호출 방지용)
     */
    private boolean isSimpleCommonWord(String word) {
        String[] commonWords = {
            "알려줘", "추천", "정보", "축제", "행사", "이벤트", "여행", "계획", "일정", "코스",
            "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원",
            "충북", "충남", "전북", "전남", "경북", "경남", "제주"
        };
        
        for (String common : commonWords) {
            if (word.equals(common)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public String extractKeywordFromRequest(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "";
        }
        
        log.info("🤖 키워드 추출 시작: '{}'", message);
        
        try {
            // 🤖 1단계: AI를 활용한 스마트 키워드 추출
            String aiKeyword = openAIService.extractKeywordWithAI(message);
            
            if (aiKeyword != null && !aiKeyword.trim().isEmpty()) {
                log.info("✅ AI 키워드 추출 성공: '{}' → '{}'", message, aiKeyword);
                return aiKeyword.trim();
            } else {
                log.info("⚠️ AI 키워드 추출 실패, 폴백 방식 사용");
            }
            
        } catch (Exception e) {
            log.warn("❌ AI 키워드 추출 오류, 폴백 방식 사용: {}", e.getMessage());
        }
        
        // 🛡️ 2단계: 강화된 폴백 - 구체적인 키워드 직접 매칭
        log.info("🔄 강화된 폴백 키워드 추출 시작");
        
        String lowerMessage = message.toLowerCase();
        
        // 🎯 구체적인 키워드들을 직접 매칭 (우선순위 순)
        String[] specificKeywords = {
            // 자연/꽃
            "벚꽃", "장미", "튤립", "유채", "해바라기", "코스모스", "단풍", "꽃", "불꽃",
            // 기술/현대
            "드론", "로봇", "AI", "VR", "게임", "IT", "핸드폰", "컴퓨터", "기술",
            // 문화/예술  
            "K-POP", "KPOP", "케이팝", "재즈", "클래식", "미술", "사진", "영화", "음악",
            // 음식
            "김치", "치킨", "맥주", "와인", "커피", "디저트", "음식", "먹거리",
            // 기타
            "자동차", "패션", "뷰티", "스포츠", "문화", "전통", "역사"
        };
        
        for (String keyword : specificKeywords) {
            if (lowerMessage.contains(keyword.toLowerCase())) {
                log.info("🎯 직접 매칭 성공: '{}' → '{}'", message, keyword);
                return keyword;
            }
        }
        
        // 🔍 3단계: 단어 분해 후 키워드 검색
        String[] words = message.split("\\s+");
        
        for (String word : words) {
            // 특수문자 제거하고 정리
            String cleanWord = word.replaceAll("[^가-힣a-zA-Z0-9]", "").toLowerCase();
            
            if (cleanWord.length() >= 2) {
                // 구체적인 키워드인지 체크
                for (String keyword : specificKeywords) {
                    if (cleanWord.equals(keyword.toLowerCase()) || 
                        cleanWord.contains(keyword.toLowerCase()) ||
                        keyword.toLowerCase().contains(cleanWord)) {
                        log.info("🔍 단어 분해 매칭 성공: '{}' → '{}'", message, keyword);
                        return keyword;
                    }
                }
                
                // 일반 단어가 아닌 경우 키워드로 사용
                if (!isCommonWord(cleanWord)) {
                    log.info("📝 일반 키워드 추출: '{}' → '{}'", message, cleanWord);
                    return cleanWord;
                }
            }
        }
        
        log.info("ℹ️ 키워드 추출 결과 없음: '{}' - TourAPI가 전체 검색을 처리합니다", message);
        return "";
    }
    
    /**
     * 일반적인 단어인지 체크 (키워드로 부적절한 단어들)
     */
    private boolean isCommonWord(String word) {
        if (word == null || word.trim().isEmpty()) {
            return true;
        }
        
        String lowerWord = word.toLowerCase().trim();
        
        // 🚫 일반적인 동사/형용사/부사 (키워드가 될 수 없는 것들)
        String[] verbs = {
            "알려줘", "추천", "가자", "가고", "보자", "좋은", "괜찮은", "예쁜", "멋진", "재미있는",
            "찾아줘", "검색", "보여줘", "설명", "소개", "말해줘", "하자", "해줘", "주세요"
        };
        
        // 🗺️ 주요 지역명 (키워드가 아닌 지역 정보)
        String[] regions = {
            "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", 
            "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
            "경기도", "강원도", "충청북도", "충청남도", "전라북도", "전라남도", 
            "경상북도", "경상남도", "제주도"
        };
        
        // ⏰ 시간/기간 관련 (키워드가 아닌 일정 정보)
        String[] timeWords = {
            "당일", "박", "일", "하루", "이틀", "사흘", "나흘", "일주일", "주말", 
            "오전", "오후", "저녁", "아침", "점심", "밤", "새벽", "시간", "분"
        };
        
        // 🎯 일반적인 여행 용어 (너무 포괄적이어서 키워드로 부적절)
        String[] genericTerms = {
            "여행", "계획", "일정", "코스", "루트", "추천", "정보", "리스트", "목록"
        };
        
        // 🏷️ 수식어/접미사 (키워드에서 제외해야 할 불필요한 단어들)
        String[] modifiers = {
            "관련", "축제", "행사", "이벤트", "페스티벌", "대회", "박람회", "쇼", "전시회", "컨벤션",
            "관련된", "위한", "같은", "느낌", "스타일", "테마", "컨셉"
        };
        
        // 🔍 모든 카테고리 체크
        String[][] allCommonWords = {verbs, regions, timeWords, genericTerms, modifiers};
        
        for (String[] category : allCommonWords) {
            for (String common : category) {
                if (lowerWord.equals(common.toLowerCase()) || 
                    lowerWord.contains(common.toLowerCase()) || 
                    common.toLowerCase().contains(lowerWord)) {
                    return true;
                }
            }
        }
        
        // 📏 너무 짧은 단어 (의미가 애매함)
        if (lowerWord.length() <= 1) {
            return true;
        }
        
        // ✅ 나머지는 모두 유효한 키워드로 허용
        return false;
    }
    
    /**
     * 유효한 지역명인지 검증
     */
    private boolean isValidRegionName(String regionName) {
        if (regionName == null || regionName.trim().isEmpty()) {
            return false;
        }
        
        // 🚫 일반적인 조사/어미/단어는 지역명이 아님
        String[] invalidWords = {
            "로", "에", "으로", "에서", "까지", "부터", "와", "과", "을", "를", "이", "가", "의", "도", "만", "라서", "라고",
            "고", "구", "동", "면", "리", "번지", "호", "층", "가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하"
        };
        
        for (String invalid : invalidWords) {
            if (regionName.equals(invalid)) {
                return false;
            }
        }
        
        // ✅ 의미 있는 지역명 패턴 검증
        // 시/군/구/도/특별시/광역시 등이 포함된 경우는 유효
        if (regionName.endsWith("시") || regionName.endsWith("군") || regionName.endsWith("구") || 
            regionName.endsWith("도") || regionName.contains("특별시") || regionName.contains("광역시")) {
            return true;
        }
        
        // 3글자 이상이고 한글로만 구성된 경우는 유효할 가능성 높음
        if (regionName.length() >= 3 && regionName.matches("[가-힣]+")) {
            return true;
        }
        
        return false;
    }
    
    /**
     * AI 기반 지역 추출
     */
    private RegionInfo extractRegionWithAI(String userMessage, Map<String, String> sigunguCodeMapping, Map<String, String> areaCodeMapping) {
        try {
            // 사용 가능한 지역 목록 생성
            StringBuilder availableRegions = new StringBuilder();
            
            // 시군구 정보 추가
            availableRegions.append("**시군구 목록** (지역명 : 지역코드_시군구코드):\n");
            for (Map.Entry<String, String> entry : sigunguCodeMapping.entrySet()) {
                availableRegions.append("- ").append(entry.getKey()).append(" : ").append(entry.getValue()).append("\n");
            }
            
            // 광역시/도 정보 추가
            availableRegions.append("\n**광역시/도 목록** (지역명 : 지역코드):\n");
            for (Map.Entry<String, String> entry : areaCodeMapping.entrySet()) {
                availableRegions.append("- ").append(entry.getKey()).append(" : ").append(entry.getValue()).append("\n");
            }
            
            // AI 호출
            String aiResponse = openAIService.extractRegionWithAI(userMessage, availableRegions.toString());
            
            // JSON 파싱 시도
            return parseAIRegionResponse(aiResponse);
            
        } catch (Exception e) {
            log.error("❌ AI 기반 지역 추출 실패: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * AI 응답을 RegionInfo로 파싱
     */
    private RegionInfo parseAIRegionResponse(String aiResponse) {
        try {
            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                return null;
            }
            
            // JSON 블록 추출
            String jsonStr = aiResponse.trim();
            if (jsonStr.contains("```")) {
                // 코드 블록에서 JSON 추출
                String[] parts = jsonStr.split("```");
                for (String part : parts) {
                    if (part.trim().startsWith("{") && part.trim().endsWith("}")) {
                        jsonStr = part.trim();
                        break;
                    }
                }
            }
            
            // 간단한 JSON 파싱 (Jackson 없이)
            String region = extractJsonValue(jsonStr, "region");
            String areaCode = extractJsonValue(jsonStr, "areaCode");
            String sigunguCode = extractJsonValue(jsonStr, "sigunguCode");
            String confidence = extractJsonValue(jsonStr, "confidence");
            String reasoning = extractJsonValue(jsonStr, "reasoning");
            
            if ("NONE".equals(region) || region == null || region.trim().isEmpty()) {
                log.info("❌ AI 지역 추론 실패: region이 NONE이거나 비어있음");
                return null;
            }
            
            // 🎯 AI 추론 결과 로깅
            log.info("🎯 AI 지역 추론 성공: {} → {}(areaCode: {}, sigunguCode: {})", 
                    reasoning != null ? reasoning : "추론 정보 없음", 
                    region, 
                    areaCode != null ? areaCode : "null", 
                    sigunguCode != null ? sigunguCode : "null");
            
            return new RegionInfo(areaCode, sigunguCode, region);
            
        } catch (Exception e) {
            log.error("❌ AI 응답 파싱 실패: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * AI가 추론한 지역 정보를 DB 매핑과 검증/정제
     */
    private RegionInfo validateAndRefineAIRegion(RegionInfo aiRegion, String userMessage, 
                                                Map<String, String> sigunguCodeMapping, 
                                                Map<String, String> areaCodeMapping) {
        
        if (aiRegion == null || aiRegion.getRegionName() == null) {
            return null;
        }
        
        String aiRegionName = aiRegion.getRegionName().trim();
        String lowerMessage = userMessage.toLowerCase();
        
        // 🚇 역사명 기반 강제 매핑 (AI가 놓친 경우 보정)
        if (lowerMessage.contains("명동역") || lowerMessage.contains("명동")) {
            // 명동역 → 서울 중구 강제 매핑
            log.info("🚇 역사명 강제 매핑: 명동역 → 서울 중구");
            return new RegionInfo("1", "1_24", "명동역");
        }
        if (lowerMessage.contains("홍대입구역") || lowerMessage.contains("홍대")) {
            log.info("🚇 역사명 강제 매핑: 홍대 → 서울 마포구");
            return new RegionInfo("1", "1_13", "홍대");
        }
        if (lowerMessage.contains("강남역") || lowerMessage.contains("강남")) {
            log.info("🚇 역사명 강제 매핑: 강남역 → 서울 강남구");
            return new RegionInfo("1", "1_11", "강남역");
        }
        
        // 1️⃣ AI가 제공한 areaCode와 sigunguCode가 유효한지 먼저 확인
        if (aiRegion.getAreaCode() != null && aiRegion.getSigunguCode() != null) {
            String aiSigunguCode = aiRegion.getAreaCode() + "_" + aiRegion.getSigunguCode();
            
            // DB에서 해당 코드가 실제로 존재하는지 확인
            for (Map.Entry<String, String> entry : sigunguCodeMapping.entrySet()) {
                if (entry.getValue().equals(aiSigunguCode)) {
                    log.info("✅ AI 추론 지역 검증 성공: {} → {} ({})", 
                            aiRegionName, entry.getKey(), aiSigunguCode);
                    return new RegionInfo(aiRegion.getAreaCode(), aiSigunguCode, entry.getKey());
                }
            }
        }
        
        // 2️⃣ 시군구 이름으로 정확 매칭 시도
        List<Map.Entry<String, String>> exactMatches = sigunguCodeMapping.entrySet().stream()
            .filter(entry -> entry.getKey().contains(aiRegionName) || aiRegionName.contains(entry.getKey()))
            .collect(Collectors.toList());
        
        if (exactMatches.size() == 1) {
            // 정확히 하나만 매칭되면 사용
            Map.Entry<String, String> match = exactMatches.get(0);
            String[] codeParts = match.getValue().split("_");
            log.info("✅ AI 추론 지역 단일 매칭: {} → {} ({})", 
                    aiRegionName, match.getKey(), match.getValue());
            return new RegionInfo(codeParts[0], match.getValue(), match.getKey());
        }
        
        // 3️⃣ 여러 매칭이 있을 경우 문맥으로 판단
        if (exactMatches.size() > 1) {
            Map.Entry<String, String> bestMatch = selectBestMatchFromContext(exactMatches, userMessage, aiRegionName);
            if (bestMatch != null) {
                String[] codeParts = bestMatch.getValue().split("_");
                log.info("✅ AI 추론 지역 문맥 매칭: {} → {} ({})", 
                        aiRegionName, bestMatch.getKey(), bestMatch.getValue());
                return new RegionInfo(codeParts[0], bestMatch.getValue(), bestMatch.getKey());
            }
        }
        
        // 4️⃣ 광역시/도 레벨에서 매칭 시도
        for (Map.Entry<String, String> entry : areaCodeMapping.entrySet()) {
            if (entry.getKey().contains(aiRegionName) || aiRegionName.contains(entry.getKey())) {
                log.info("✅ AI 추론 지역 광역 매칭: {} → {} (areaCode: {})", 
                        aiRegionName, entry.getKey(), entry.getValue());
                return new RegionInfo(entry.getValue(), null, entry.getKey());
            }
        }
        
        log.warn("❌ AI 추론 지역 검증 실패: '{}' - DB에서 매칭되는 지역을 찾을 수 없음", aiRegionName);
        return null;
    }
    
    /**
     * 여러 매칭 후보 중에서 문맥상 가장 적절한 것 선택
     */
    private Map.Entry<String, String> selectBestMatchFromContext(List<Map.Entry<String, String>> matches, 
                                                               String userMessage, String aiRegionName) {
        
        String lowerMessage = userMessage.toLowerCase();
        
        // 🚇 서울 관련 키워드가 있으면 서울 지역 우선 (강화된 역사명 감지)
        if (lowerMessage.contains("서울") || lowerMessage.contains("seoul") || 
            lowerMessage.contains("지하철") || lowerMessage.contains("역") ||
            lowerMessage.contains("명동") || lowerMessage.contains("홍대") || lowerMessage.contains("강남") ||
            lowerMessage.contains("신촌") || lowerMessage.contains("이태원") || lowerMessage.contains("잠실") ||
            lowerMessage.contains("여의도") || lowerMessage.contains("청량리") || lowerMessage.contains("건대") ||
            lowerMessage.contains("노량진") || lowerMessage.contains("압구정") || lowerMessage.contains("선릉")) {
            
            for (Map.Entry<String, String> match : matches) {
                if (match.getValue().startsWith("1_")) { // 서울 지역코드
                    log.info("🎯 문맥 매칭: 서울 관련 키워드/역사명 감지 → {}", match.getKey());
                    return match;
                }
            }
        }
        
        // 부산 관련 키워드가 있으면 부산 지역 우선
        if (lowerMessage.contains("부산") || lowerMessage.contains("busan") || 
            lowerMessage.contains("해운대") || lowerMessage.contains("광안리")) {
            
            for (Map.Entry<String, String> match : matches) {
                if (match.getValue().startsWith("6_")) { // 부산 지역코드
                    log.info("🎯 문맥 매칭: 부산 관련 키워드 감지 → {}", match.getKey());
                    return match;
                }
            }
        }
        
        // 대전 관련 키워드가 있으면 대전 지역 우선
        if (lowerMessage.contains("대전") || lowerMessage.contains("daejeon") || 
            lowerMessage.contains("kaist") || lowerMessage.contains("유성")) {
            
            for (Map.Entry<String, String> match : matches) {
                if (match.getValue().startsWith("8_")) { // 대전 지역코드
                    log.info("🎯 문맥 매칭: 대전 관련 키워드 감지 → {}", match.getKey());
                    return match;
                }
            }
        }
        
        // 기본적으로 첫 번째 매칭 반환 (보통 서울이 먼저 나옴)
        log.info("⚠️ 문맥 판단 불가 - 첫 번째 후보 선택: {}", matches.get(0).getKey());
        return matches.get(0);
    }

    /**
     * JSON 문자열에서 값 추출 (간단한 파싱)
     */
    private String extractJsonValue(String json, String key) {
        try {
            String pattern = "\"" + key + "\"\\s*:\\s*\"([^\"]+)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1);
            }
            
            // null 값 처리
            String nullPattern = "\"" + key + "\"\\s*:\\s*null";
            java.util.regex.Pattern pNull = java.util.regex.Pattern.compile(nullPattern);
            java.util.regex.Matcher mNull = pNull.matcher(json);
            if (mNull.find()) {
                return null;
            }
            
            return null;
        } catch (Exception e) {
            log.error("❌ JSON 값 추출 실패: key={}", key, e);
            return null;
        }
    }
} 