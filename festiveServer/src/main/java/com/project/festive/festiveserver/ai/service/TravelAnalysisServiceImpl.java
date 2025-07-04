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
        log.info("🔍 빠른 여행 분석 시작 - 메시지: {}", userMessage);
        
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
            
            log.info("✅ 빠른 분석 완료 - 지역: {}, 기간: {}, 타입: {}", region, duration, requestType);
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
        
        // 음식 관련 키워드
        if (lowerMessage.contains("맛집") || lowerMessage.contains("음식") || 
            lowerMessage.contains("식당") || lowerMessage.contains("먹거리")) {
            return "39"; // 음식점
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
        
        String lowerMessage = message.toLowerCase();
        
        // 여행 관련 키워드
        String[] travelKeywords = {
            "여행", "관광", "휴가", "여행지", "관광지", "명소", "볼거리",
            "일정", "코스", "루트", "동선", "가볼만한", "추천",
            "박물관", "미술관", "전시", "문화", "역사", "유적",
            "맛집", "음식", "식당", "먹거리", "카페",
            "숙박", "호텔", "펜션", "민박", "리조트",
            "축제", "행사", "이벤트", "페스티벌", "공연",
            "해변", "바다", "산", "강", "호수", "공원",
            "온천", "스파", "체험", "액티비티"
        };
        
        for (String keyword : travelKeywords) {
            if (lowerMessage.contains(keyword)) {
                return true;
            }
        }
        
        // 지역명이 포함되어 있으면 여행 관련으로 간주
        Map<String, String> areaCodeMapping = areaService.getAreaCodeMapping();
        for (String region : areaCodeMapping.keySet()) {
            if (lowerMessage.contains(region.toLowerCase())) {
                return true;
            }
        }
        
        return false;
    }

    @Override
    public String extractDurationFromMessageEnhanced(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "1일";
        }
        
        String lowerMessage = message.toLowerCase();
        
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
                        log.info("⚠️ 여행 기간 제한: {}박{}일 → 4박5일로 제한됨", nights, days);
                        return "4박5일";
                    }
                    
                    return nights + "박" + days + "일";
                } else if (pattern.pattern().contains("박")) {
                    // "2박" 형태 -> "2박3일"로 변환
                    int nights = Integer.parseInt(matcher.group(1));
                    
                    // 🚫 4박5일 제한: 4박을 초과하면 4박5일로 제한
                    if (nights > 4) {
                        log.info("⚠️ 여행 기간 제한: {}박 → 4박5일로 제한됨", nights);
                        return "4박5일";
                    }
                    
                    return nights + "박" + (nights + 1) + "일";
                } else if (pattern.pattern().contains("일")) {
                    // "3일" 형태
                    int days = Integer.parseInt(matcher.group(1));
                    
                    // 🚫 5일 제한: 5일을 초과하면 4박5일로 제한
                    if (days > 5) {
                        log.info("⚠️ 여행 기간 제한: {}일 → 4박5일로 제한됨", days);
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
            log.info("⚠️ 여행 기간 제한: 5박 이상 요청 → 4박5일로 제한됨");
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
        log.info("🔍 지역 정보 추출 시작 - 입력: '{}'", userMessage);
        
        // DB 기반 시군구 매핑 사용
        Map<String, String> sigunguCodeMapping = areaService.getSigunguCodeMapping();
        log.info("📊 시군구 매핑 데이터 개수: {}", sigunguCodeMapping.size());
        
        // 🔎 통영 관련 디버깅: 시군구 매핑에 통영 데이터가 있는지 확인
        boolean hasChangwon = sigunguCodeMapping.containsKey("창원시");
        boolean hasTongyeong = sigunguCodeMapping.containsKey("통영시");
        boolean hasTongyeongShort = sigunguCodeMapping.containsKey("통영");
        String tongyeongCode = sigunguCodeMapping.get("통영시");
        String tongyeongShortCode = sigunguCodeMapping.get("통영");
        
        log.info("🐛 [TONGYEONG DEBUG] 창원시: {}, 통영시: {}, 통영: {}", hasChangwon, hasTongyeong, hasTongyeongShort);
        log.info("🐛 [TONGYEONG DEBUG] 통영시 코드: {}, 통영 코드: {}", tongyeongCode, tongyeongShortCode);
        
        if (message.contains("통영")) {
            log.info("🐛 [TONGYEONG DEBUG] '통영' 키워드 감지! 메시지: '{}'", message);
        }
        
        // 🚫 일반적인 조사/어미 제외 리스트 (대폭 강화)
        String[] excludedWords = {
            "로", "에", "으로", "에서", "까지", "부터", "와", "과", "을", "를", "이", "가", "의", "도", "만", "라서", "라고",
            "고", "구", "동", "면", "리", "번지", "호", "층", "가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하"
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
            
            // 🔎 통영 관련 디버깅
            if (cityName.contains("통영")) {
                log.info("🐛 [TONGYEONG DEBUG] 시군구 데이터에서 통영 발견: '{}'", cityName);
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
                
                log.info("✅ 시군구 매핑 성공: '{}' → areaCode: {}, sigunguCode: {}, regionName: {} (매칭타입: {})", 
                        cityName, areaCode, sigunguCode, regionName, matchType);
                
                // 🔎 통영 관련 추가 디버깅
                if (cityName.contains("통영")) {
                    log.info("🎯 [TONGYEONG SUCCESS] 통영 지역 인식 성공! 최종 결과 - areaCode: {}, sigunguCode: {}", areaCode, sigunguCode);
                }
                
                return new RegionInfo(areaCode, sigunguCode, regionName);
            }
        }
        
        // DB 기반 지역 매핑 사용 (광역시/도)
        Map<String, String> areaCodeMapping = areaService.getAreaCodeMapping();
        log.info("📊 지역 매핑 데이터 개수: {}", areaCodeMapping.size());
        
        for (Map.Entry<String, String> entry : areaCodeMapping.entrySet()) {
            String regionName = entry.getKey();
            if (message.contains(regionName.toLowerCase())) {
                String areaCode = entry.getValue();
                log.info("✅ 지역 매핑 성공: '{}' → areaCode: {}", regionName, areaCode);
                return new RegionInfo(areaCode, null, regionName);
            }
        }
        
        // 🔎 매핑 실패 시 추가 디버깅
        if (message.contains("통영")) {
            log.error("❌ [TONGYEONG ERROR] '통영' 키워드가 있음에도 매핑 실패! 메시지: '{}'", userMessage);
            log.error("❌ [TONGYEONG ERROR] 시군구 매핑 데이터 샘플 5개:");
            int count = 0;
            for (Map.Entry<String, String> entry : sigunguCodeMapping.entrySet()) {
                if (count++ < 5) {
                    log.error("  - '{}' → '{}'", entry.getKey(), entry.getValue());
                }
            }
        }
        
        // 🤖 AI 기반 지역 추출 시도
        log.info("🤖 기존 매핑 실패 - AI 기반 지역 추출 시도");
        RegionInfo aiRegionInfo = extractRegionWithAI(userMessage, sigunguCodeMapping, areaCodeMapping);
        if (aiRegionInfo != null) {
            return aiRegionInfo;
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
        String lowerMessage = message.toLowerCase();
        
        log.info("🔍 RequestType 분류 시작 - 메시지: {}", message);
        
        // 1. 축제 관련 키워드 확인
        boolean hasFestivalKeyword = lowerMessage.contains("축제") || lowerMessage.contains("행사") || 
                                   lowerMessage.contains("이벤트") || lowerMessage.contains("페스티벌");
        
        // 2. 여행 계획 관련 키워드 확인
        boolean hasTravelPlanKeyword = lowerMessage.contains("계획") || lowerMessage.contains("일정") || 
                                     lowerMessage.contains("코스") || lowerMessage.contains("여행") || 
                                     lowerMessage.contains("루트") || lowerMessage.contains("동선") ||
                                     lowerMessage.contains("짜") || lowerMessage.contains("추천") ||
                                     lowerMessage.contains("박") || lowerMessage.contains("일");
        
        // 3. 단순 정보 요청 키워드 확인
        boolean hasInfoRequestKeyword = lowerMessage.contains("알려줘") || lowerMessage.contains("소개") || 
                                      lowerMessage.contains("정보") || lowerMessage.contains("뭐가") ||
                                      lowerMessage.contains("어떤") || lowerMessage.contains("찾아줘") ||
                                      lowerMessage.contains("검색") || lowerMessage.contains("리스트") ||
                                      lowerMessage.contains("목록");
        
        String requestType;
        
        if (hasFestivalKeyword && hasTravelPlanKeyword) {
            // 축제 + 여행 계획 키워드 = 축제 기반 여행 계획
            requestType = "festival_travel";
            log.info("🎪 축제 기반 여행 계획 요청으로 분류");
        } else if (hasFestivalKeyword && hasInfoRequestKeyword) {
            // 축제 + 정보 요청 키워드 = 단순 축제 정보 요청
            requestType = "festival_info";
            log.info("ℹ️ 단순 축제 정보 요청으로 분류");
        } else if (hasFestivalKeyword) {
            // 축제 키워드만 있는 경우 - 문맥에 따라 판단
            if (lowerMessage.contains("위주") || lowerMessage.contains("중심") || lowerMessage.contains("기반")) {
                requestType = "festival_travel";
                log.info("🎪 축제 위주 여행 계획 요청으로 분류 (위주/중심/기반 키워드)");
            } else {
                requestType = "festival_info";
                log.info("ℹ️ 기본 축제 정보 요청으로 분류");
            }
        } else if (hasTravelPlanKeyword) {
            // 여행 계획 키워드만 있는 경우 = 일반 여행 계획
            requestType = "travel_only";
            log.info("🗺️ 일반 여행 계획 요청으로 분류");
        } else {
            // 기본값
            requestType = "travel_only";
            log.info("🗺️ 기본 여행 계획 요청으로 분류 (기본값)");
        }
        
        log.info("✅ RequestType 분류 완료: {} (축제키워드: {}, 여행계획키워드: {}, 정보요청키워드: {})", 
                requestType, hasFestivalKeyword, hasTravelPlanKeyword, hasInfoRequestKeyword);
        
        return requestType;
    }

    @Override
    public String extractKeywordFromRequest(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "";
        }
        
        String lowerMessage = message.toLowerCase();
        
        // 특정 키워드 패턴 추출
        String[] keywordPatterns = {
            "맛집", "음식", "카페", "디저트",
            "박물관", "미술관", "전시", "문화",
            "해변", "바다", "산", "강", "호수",
            "온천", "스파", "휴양",
            "쇼핑", "시장", "백화점",
            "체험", "액티비티", "레저",
            "역사", "유적", "문화재",
            "자연", "경치", "풍경",
            "여행", "계획", "코스", "일정", "루트", "축제", "페스티벌", "행사"
        };
        
        for (String pattern : keywordPatterns) {
            if (lowerMessage.contains(pattern)) {
                return pattern;
            }
        }
        
        // 간단한 키워드 추출 (공백으로 분리해서 의미있는 단어 찾기)
        String[] words = message.split("\\s+");
        for (String word : words) {
            if (word.length() >= 2 && !word.matches("\\d+")) {
                // 특수문자 제거
                word = word.replaceAll("[^가-힣a-zA-Z]", "");
                if (word.length() >= 2) {
                    return word;
                }
            }
        }
        
        return "";
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
            log.info("🤖 AI 지역 추출 응답: {}", aiResponse);
            
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
            
            if ("NONE".equals(region) || region == null || region.trim().isEmpty()) {
                log.info("🤖 AI가 지역을 찾지 못함");
                return null;
            }
            
            log.info("🎯 AI 지역 추출 성공: region={}, areaCode={}, sigunguCode={}, confidence={}", 
                    region, areaCode, sigunguCode, confidence);
            
            return new RegionInfo(areaCode, sigunguCode, region);
            
        } catch (Exception e) {
            log.error("❌ AI 응답 파싱 실패: {}", e.getMessage(), e);
            return null;
        }
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