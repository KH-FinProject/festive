package com.project.festive.festiveserver.ai.service;

import com.project.festive.festiveserver.ai.dto.TravelAnalysis;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class TravelAnalysisServiceImpl implements TravelAnalysisService {

    // 지역코드 매핑
    private final Map<String, String> AREA_CODE_MAP = new HashMap<String, String>() {{
        // 광역시/도 - 정식명칭과 줄임형 모두 지원
        put("서울", "1"); put("서울특별시", "1");
        put("인천", "2"); put("인천광역시", "2");
        put("대전", "3"); put("대전광역시", "3");
        put("대구", "4"); put("대구광역시", "4");
        put("광주", "5"); put("광주광역시", "5");
        put("부산", "6"); put("부산광역시", "6");
        put("울산", "7"); put("울산광역시", "7");
        put("세종", "8"); put("세종특별자치시", "8");
        put("경기", "31"); put("경기도", "31");
        put("강원", "32"); put("강원도", "32"); put("강원특별자치도", "32");
        put("충북", "33"); put("충청북도", "33");
        put("충남", "34"); put("충청남도", "34");
        put("경북", "35"); put("경상북도", "35");
        put("경남", "36"); put("경상남도", "36");
        put("전북", "37"); put("전라북도", "37"); put("전북특별자치도", "37");
        put("전남", "38"); put("전라남도", "38");
        put("제주", "39"); put("제주도", "39"); put("제주특별자치도", "39");
    }};
    
    // 시군구 코드 매핑
    private final Map<String, String> SIGUNGU_CODE_MAP = new HashMap<String, String>() {{
        // 경상남도 (36) - 주요 도시들
        put("거제시", "36_1"); put("거제", "36_1");
        put("거창군", "36_2"); put("거창", "36_2");
        put("고성군", "36_3"); put("고성", "36_3");
        put("김해시", "36_4"); put("김해", "36_4");
        put("남해군", "36_5"); put("남해", "36_5");
        put("마산시", "36_6"); put("마산", "36_6");
        put("밀양시", "36_7"); put("밀양", "36_7");
        put("사천시", "36_8"); put("사천", "36_8");
        put("산청군", "36_9"); put("산청", "36_9");
        put("양산시", "36_10"); put("양산", "36_10");
        put("의령군", "36_12"); put("의령", "36_12");
        put("진주시", "36_13"); put("진주", "36_13");
        put("진해시", "36_14"); put("진해", "36_14");
        put("창녕군", "36_15"); put("창녕", "36_15");
        put("창원시", "36_16"); put("창원", "36_16");
        put("통영시", "36_17"); put("통영", "36_17");
        put("하동군", "36_18"); put("하동", "36_18");
        put("함안군", "36_19"); put("함안", "36_19");
        put("함양군", "36_20"); put("함양", "36_20");
        put("합천군", "36_21"); put("합천", "36_21");
        // 다른 지역들도 추가 가능
    }};

    @Override
    public TravelAnalysis createFastAnalysis(String userMessage) {
        log.info("🔍 빠른 여행 분석 시작 - 메시지: {}", userMessage);
        
        try {
            // 기본값 설정
            String requestType = determineRequestType(userMessage);
            String duration = extractDurationFromMessageEnhanced(userMessage);
            String keyword = extractKeywordFromRequest(userMessage);
            String intent = "여행 추천";
            
            // 지역 정보 추출
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
        for (String region : AREA_CODE_MAP.keySet()) {
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
                    return matcher.group(1) + "박" + matcher.group(2) + "일";
                } else if (pattern.pattern().contains("박")) {
                    // "2박" 형태 -> "2박3일"로 변환
                    int nights = Integer.parseInt(matcher.group(1));
                    return nights + "박" + (nights + 1) + "일";
                } else if (pattern.pattern().contains("일")) {
                    // "3일" 형태
                    return matcher.group(1) + "일";
                } else if (pattern.pattern().contains("시간")) {
                    // "5시간" -> "1일"로 변환
                    return "1일";
                }
            }
        }
        
        // 키워드 기반 추정
        if (lowerMessage.contains("당일") || lowerMessage.contains("하루")) {
            return "1일";
        } else if (lowerMessage.contains("1박") || lowerMessage.contains("주말")) {
            return "1박2일";
        } else if (lowerMessage.contains("2박")) {
            return "2박3일";
        } else if (lowerMessage.contains("3박")) {
            return "3박4일";
        }
        
        return "1일"; // 기본값
    }

    @Override
    public String mapRegionToAreaCode(String region) {
        if (region == null || region.trim().isEmpty()) {
            return null;
        }
        
        return AREA_CODE_MAP.get(region.trim());
    }

    @Override
    public RegionInfo extractRegionInfo(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return new RegionInfo(null, null, "한국");
        }
        
        String message = userMessage.toLowerCase();
        
        // 시군구 코드 먼저 확인 (더 구체적이므로)
        for (Map.Entry<String, String> entry : SIGUNGU_CODE_MAP.entrySet()) {
            String cityName = entry.getKey();
            if (message.contains(cityName.toLowerCase())) {
                String sigunguCode = entry.getValue();
                String[] parts = sigunguCode.split("_");
                String areaCode = parts[0];
                String regionName = findRegionNameByAreaCode(areaCode) + " " + cityName;
                
                log.info("🎯 시군구 매핑 발견: {} → areaCode: {}, sigunguCode: {}", cityName, areaCode, sigunguCode);
                return new RegionInfo(areaCode, sigunguCode, regionName);
            }
        }
        
        // 광역시/도 코드 확인
        for (Map.Entry<String, String> entry : AREA_CODE_MAP.entrySet()) {
            String regionName = entry.getKey();
            if (message.contains(regionName.toLowerCase())) {
                String areaCode = entry.getValue();
                log.info("🎯 지역 매핑 발견: {} → areaCode: {}", regionName, areaCode);
                return new RegionInfo(areaCode, null, regionName);
            }
        }
        
        return new RegionInfo(null, null, "한국");
    }

    @Override
    public String findRegionNameByAreaCode(String areaCode) {
        for (Map.Entry<String, String> entry : AREA_CODE_MAP.entrySet()) {
            if (entry.getValue().equals(areaCode)) {
                return entry.getKey();
            }
        }
        return "알 수 없음";
    }

    @Override
    public String determineRequestType(String message) {
        String lowerMessage = message.toLowerCase();
        
        if (lowerMessage.contains("축제") || lowerMessage.contains("행사") || 
            lowerMessage.contains("이벤트") || lowerMessage.contains("페스티벌")) {
            return "festival";
        }
        
        return "travel_only";
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
            "자연", "경치", "풍경"
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
} 