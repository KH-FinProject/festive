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
        
        // DB 기반 시군구 매핑 사용
        Map<String, String> sigunguCodeMapping = areaService.getSigunguCodeMapping();
        

        
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
        
        // 0. 먼저 여행/축제 관련성 체크
        if (!isTravelOrFestivalRelated(message)) {
            return "unclear_request";
        }
        
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
        
        // 4. 키워드 추출하여 축제성 검사
        String extractedKeyword = extractKeywordFromRequest(message);
        boolean hasExtractedKeyword = extractedKeyword != null && !extractedKeyword.trim().isEmpty();
        
        String requestType;
        
        if (hasFestivalKeyword && hasTravelPlanKeyword) {
            // 축제 + 여행 계획 키워드 = 축제 기반 여행 계획
            requestType = "festival_travel";
        } else if (hasFestivalKeyword && hasInfoRequestKeyword) {
            // 축제 + 정보 요청 키워드 = 단순 축제 정보 요청
            requestType = "festival_info";
        } else if (hasFestivalKeyword) {
            // 축제 키워드만 있는 경우 - 문맥에 따라 판단
            if (lowerMessage.contains("위주") || lowerMessage.contains("중심") || lowerMessage.contains("기반")) {
                requestType = "festival_travel";
            } else {
                requestType = "festival_info";
            }
        } else if (hasExtractedKeyword && hasInfoRequestKeyword && !hasTravelPlanKeyword) {
            // 🎪 키워드 + 정보 요청 = 축제 검색 (예: "서울 드론 알려줘", "부산 로봇 정보")
            log.info("🎪 키워드 기반 축제 검색 감지: 키워드='{}', 메시지='{}'", extractedKeyword, message);
            requestType = "festival_info";
        } else if (hasTravelPlanKeyword) {
            // 여행 계획 키워드만 있는 경우 = 일반 여행 계획
            requestType = "travel_only";
        } else {
            // 기본값
            requestType = "travel_only";
        }
        
        log.info("🔍 요청 타입 결정: '{}' → requestType: {}", message, requestType);
        return requestType;
    }

    @Override
    public String extractKeywordFromRequest(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "";
        }
        
        log.info("🤖 AI 기반 키워드 추출 시작: {}", message);
        
        try {
            // 🤖 1단계: AI를 활용한 스마트 키워드 추출
            String aiKeyword = openAIService.extractKeywordWithAI(message);
            
            if (aiKeyword != null && !aiKeyword.trim().isEmpty()) {
                log.info("✅ AI 키워드 추출 성공: '{}' → '{}'", message, aiKeyword);
                return aiKeyword.trim();
            }
            
            log.info("⚠️ AI 키워드 추출 결과 없음, 폴백 방식 사용");
            
        } catch (Exception e) {
            log.warn("❌ AI 키워드 추출 실패, 폴백 방식 사용: {}", e.getMessage());
        }
        
        // 🛡️ 2단계: 폴백 - 간단한 단어 추출 (제한 없음)
        log.info("🔄 AI 실패, 기본 단어 추출 방식 사용");
        
        String[] words = message.split("\\s+");
        for (String word : words) {
            if (word.length() >= 2 && !word.matches("\\d+")) {
                word = word.replaceAll("[^가-힣a-zA-Z]", "");
                if (word.length() >= 2) {
                    // 지역명, 기간, 일반 동사는 제외하되, 모든 명사형 키워드는 허용
                    if (!isCommonWord(word)) {
                        log.info("📝 폴백 키워드 추출: '{}'", word);
                        return word;
                    }
                }
            }
        }
        
        // 3단계: 마지막 시도 - 더 유연한 추출
        String cleanMessage = message.toLowerCase()
            .replaceAll("[^가-힣a-zA-Z\\s]", " ") // 특수문자를 공백으로
            .replaceAll("\\s+", " ") // 여러 공백을 하나로
            .trim();
            
        String[] cleanWords = cleanMessage.split(" ");
        for (String word : cleanWords) {
            if (word.length() >= 2 && !isCommonWord(word)) {
                log.info("🔍 정제된 키워드 추출: '{}'", word);
                return word;
            }
        }
        
        log.info("ℹ️ 키워드 추출 결과 없음: '{}' - TourAPI가 모든 검색을 처리합니다", message);
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
            
            if ("NONE".equals(region) || region == null || region.trim().isEmpty()) {
                return null;
            }
            
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