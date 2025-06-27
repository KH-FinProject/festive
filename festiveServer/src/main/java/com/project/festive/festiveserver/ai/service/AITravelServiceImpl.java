package com.project.festive.festiveserver.ai.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.project.festive.festiveserver.ai.dto.ChatRequest;
import com.project.festive.festiveserver.ai.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AITravelServiceImpl implements AITravelService {
    
    @Value("${openai.api.key:}")
    private String openAiApiKey;
    
    @Value("${tourapi.api.key:}")
    private String tourApiKey;
    
    @Value("${tourapi.api.base.url:}")
    private String tourApiBaseUrl;
    
    private static final String TOUR_API_BASE_URL = "https://apis.data.go.kr/B551011/KorService2";
    
    // 콘텐츠 타입 매핑
    private final Map<String, String> CONTENT_TYPE_MAP = new HashMap<String, String>() {{
        put("12", "관광지");
        put("14", "문화시설"); 
        put("15", "축제공연행사");
        put("25", "여행코스");
        put("28", "레포츠");
        put("38", "쇼핑");
        put("39", "음식점");
    }};
    
    // AI 어시스턴트 지시사항
    private static final String ASSISTANT_INSTRUCTIONS = 
        "한국 여행 전문 AI - 실시간 맞춤 추천\n\n" +
        "**🎯 핵심 임무:**\n" +
        "- 모든 질문에 대해 반드시 여행 코스 추천\n" +
        "- 기본은 당일치기, 사용자가 몇박몇일 명시하면 day별 구분\n" +
        "- Tour API 데이터와 실제 관광지 정보 우선 활용\n\n" +
        "**🚨 절대 필수 답변 형식:**\n\n" +
        "**당일/1일 여행의 경우:**\n" +
        "[지역 소개] (2줄)\n" +
        "[추천 코스]\n" +
        "1. **오전 09:00** - 장소명\n" +
        "   @location:[37.1234,127.5678] @day:1\n" +
        "   포인트: 특별한 매력\n\n" +
        "**몇박몇일 여행의 경우:**\n" +
        "[지역 소개] (2줄)\n" +
        "[Day 1 코스]\n" +
        "1. **오전 09:00** - 장소명\n" +
        "   @location:[37.1234,127.5678] @day:1\n" +
        "   포인트: 특별한 매력\n\n" +
        "[Day 2 코스]\n" +
        "1. **오전 09:00** - 장소명\n" +
        "   @location:[37.3456,127.7890] @day:2\n" +
        "   포인트: 특별한 매력\n\n" +
        "**절대 규칙:**\n" +
        "- Day별 헤더 필수: [Day 1 코스], [Day 2 코스] 형식\n" +
        "- @location:[위도,경도] @day:숫자 형식을 모든 장소에 반드시 포함\n" +
        "- 각 Day마다 최소 3개 코스 추천\n" +
        "- 이모지 사용 금지\n" +
        "- 절대로 중간에 끝내지 말고 요청된 모든 날짜의 일정을 완성";
    
    // 지역코드 매핑 (전국)
    private final Map<String, String> AREA_CODE_MAP = new HashMap<String, String>() {{
        // 광역시/도
        put("서울", "1"); put("인천", "2"); put("대전", "3"); put("대구", "4");
        put("광주", "5"); put("부산", "6"); put("경기", "31"); put("강원", "32");
        put("충북", "33"); put("충남", "34"); put("전북", "35"); put("전남", "36");
        put("경북", "37"); put("경남", "38"); put("제주", "39");
        
        // 경기도 주요 도시
        put("수원", "31"); put("성남", "31"); put("고양", "31"); put("용인", "31");
        put("부천", "31"); put("안산", "31"); put("안양", "31"); put("남양주", "31");
        put("화성", "31"); put("평택", "31"); put("의정부", "31"); put("시흥", "31");
        put("파주", "31"); put("김포", "31"); put("광명", "31"); put("광주", "31");
        put("에버랜드", "31"); put("남이섬", "31");
        
        // 강원도 주요 도시
        put("춘천", "32"); put("원주", "32"); put("강릉", "32"); put("동해", "32");
        put("태백", "32"); put("속초", "32"); put("삼척", "32"); put("홍천", "32");
        put("횡성", "32"); put("영월", "32"); put("평창", "32"); put("정선", "32");
        put("설악산", "32"); put("오대산", "32");
        
        // 충청북도
        put("청주", "33"); put("충주", "33"); put("제천", "33"); put("보은", "33");
        put("옥천", "33"); put("영동", "33"); put("단양", "33");
        
        // 충청남도  
        put("천안", "34"); put("공주", "34"); put("보령", "34"); put("아산", "34");
        put("서산", "34"); put("논산", "34"); put("당진", "34"); put("부여", "34");
        put("서천", "34"); put("태안", "34");
        
        // 전라북도
        put("전주", "35"); put("군산", "35"); put("익산", "35"); put("정읍", "35");
        put("남원", "35"); put("김제", "35"); put("무주", "35"); put("고창", "35");
        put("부안", "35"); put("지리산", "35");
        
        // 전라남도
        put("목포", "36"); put("여수", "36"); put("순천", "36"); put("나주", "36");
        put("광양", "36"); put("담양", "36"); put("곡성", "36"); put("구례", "36");
        put("고흥", "36"); put("보성", "36"); put("화순", "36"); put("장흥", "36");
        put("강진", "36"); put("해남", "36"); put("영암", "36"); put("무안", "36");
        put("완도", "36"); put("진도", "36"); put("신안", "36");
        
        // 경상북도
        put("포항", "37"); put("경주", "37"); put("김천", "37"); put("안동", "37");
        put("구미", "37"); put("영주", "37"); put("영천", "37"); put("상주", "37");
        put("문경", "37"); put("경산", "37"); put("울진", "37"); put("울릉", "37");
        put("불국사", "37"); put("석굴암", "37"); put("하회마을", "37");
        
        // 경상남도
        put("창원", "38"); put("진주", "38"); put("통영", "38"); put("사천", "38");
        put("김해", "38"); put("밀양", "38"); put("거제", "38"); put("양산", "38");
        put("창녕", "38"); put("남해", "38"); put("하동", "38"); put("산청", "38");
        put("함양", "38"); put("거창", "38"); put("합천", "38");
        
        // 제주도
        put("제주시", "39"); put("서귀포", "39"); put("한라산", "39");
        put("성산일출봉", "39"); put("우도", "39"); put("중문", "39");
        
        // 서울 구별/관광지별
        put("명동", "1"); put("강남", "1"); put("홍대", "1"); put("이태원", "1");
        put("종로", "1"); put("마포", "1"); put("송파", "1"); put("용산", "1");
        put("롯데월드", "1"); put("동대문", "1"); put("인사동", "1"); put("북촌", "1");
    }};
    
    // 지역명 매핑
    private final Map<String, String> AREA_NAME_MAP = new HashMap<String, String>() {{
        put("1", "서울"); put("2", "인천"); put("3", "대전"); put("4", "대구");
        put("5", "광주"); put("6", "부산"); put("31", "경기"); put("32", "강원");
        put("33", "충북"); put("34", "충남"); put("35", "전북"); put("36", "전남");
        put("37", "경북"); put("38", "경남"); put("39", "제주");
    }};

//    private final WebClient webClient = WebClient.builder().build();
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public ChatResponse generateTravelRecommendation(ChatRequest request) {
        try {
            log.info("🎯 AI 중심 여행 추천 시작: {}", request.getMessage());
            
            // 🤖 AI가 사용자 입력을 분석하여 지역/키워드/의도 파악
            TravelAnalysis analysis = analyzeUserRequestWithAI(request.getMessage());
            log.info("🧠 AI 분석 결과 - 지역: {}, 키워드: {}, 기간: {}", 
                analysis.getRegion(), analysis.getKeyword(), analysis.getDuration());
            
            // 🌐 여행 관련 요청일 때만 TourAPI 데이터 수집
            List<TourSpot> relevantSpots = new ArrayList<>();
            if (isTravelRelatedRequest(analysis)) {
                log.info("✅ 여행 관련 요청 감지 - TourAPI 호출 시작");
                relevantSpots = fetchRelevantTourData(analysis);
                log.info("📍 TourAPI 검색 결과: {}개 관광지", relevantSpots.size());
            } else {
                log.info("ℹ️ 일반 대화 요청 - TourAPI 호출 생략");
            }
            
            // 🎯 AI가 관련성 평가 및 최적 코스 생성
            String aiResponse = generateIntelligentTravelCourse(request.getMessage(), analysis, relevantSpots);
            
            // 위치 정보 추출
            List<ChatResponse.LocationInfo> locations = extractLocations(aiResponse);
            
            ChatResponse response = new ChatResponse();
            response.setContent(aiResponse);
            response.setRequestType(analysis.getRequestType());
            response.setLocations(locations);
            response.setStreaming(false);
            
            // 축제 정보와 여행코스는 요청 타입에 따라 설정
            if ("festival_only".equals(analysis.getRequestType()) || 
                "festival_with_travel".equals(analysis.getRequestType())) {
                // 축제 정보 생성 및 설정
                List<ChatResponse.FestivalInfo> festivals = createFestivalInfoFromSpots(relevantSpots);
                
                // 축제 정보가 없으면 사용자 키워드로 기본 축제 정보 생성
                if (festivals.isEmpty() && analysis.getKeyword() != null) {
                    log.info("🎭 TourAPI에서 축제 정보를 찾지 못해 기본 축제 정보 생성");
                    ChatResponse.FestivalInfo defaultFestival = createDefaultFestivalInfo(analysis);
                    if (defaultFestival != null) {
                        festivals.add(defaultFestival);
                    }
                }
                
                response.setFestivals(festivals);
                log.info("🎉 최종 축제 정보 설정: {}개", festivals.size());
            }
            
            if ("festival_with_travel".equals(analysis.getRequestType()) || 
                "travel_only".equals(analysis.getRequestType())) {
                // 여행코스 생성 및 설정 (현재는 간단히 설정, 후에 AI로 생성)
                ChatResponse.TravelCourse travelCourse = createTravelCourseFromLocations(locations, analysis);
                response.setTravelCourse(travelCourse);
            }
            
            log.info("✅ AI 중심 여행 추천 완료 - 타입: {}, 위치: {}개", analysis.getRequestType(), locations.size());
            
            return response;
        } catch (Exception e) {
            log.error("AI 여행 추천 생성 실패", e);
            throw new RuntimeException("AI 서비스 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 🧠 AI가 사용자 요청을 분석하여 여행 의도 파악
     */
    private TravelAnalysis analyzeUserRequestWithAI(String userMessage) {
        try {
            log.info("🧠 AI 요청 분석 시작");
            
            String analysisPrompt = 
                "다음 사용자 요청을 정확히 분석해주세요:\n\n" +
                "사용자 요청: \"" + userMessage + "\"\n\n" +
                "다음 형식으로 정확히 응답해주세요:\n\n" +
                "요청타입: [festival_only/festival_with_travel/travel_only/general_chat]\n" +
                "지역: [지역명이 언급되었으면 해당 지역, 없으면 NONE]\n" +
                "키워드: [핵심 키워드들을 콤마로 구분, 없으면 NONE]\n" +
                "기간: [여행 기간이 명시되었으면 해당 기간, 없으면 NONE]\n" +
                "의도: [사용자의 실제 의도를 한 줄로 요약]\n\n" +
                "요청타입 판별 기준:\n" +
                "1. festival_only: 축제만 검색/추천 (예: '부산 불꽃축제 추천해줘')\n" +
                "2. festival_with_travel: 축제 + 여행코스 (예: '부산 불꽃축제 2박3일 코스 추천해줘')\n" +
                "3. travel_only: 일반 여행코스만 (예: '부산 2박3일 여행코스 추천해줘')\n" +
                "4. general_chat: 일반 대화 (인사, 날씨, 기타 질문)\n\n" +
                "주의사항:\n" +
                "- 축제/불꽃/행사 키워드가 있고 기간이 없으면 festival_only\n" +
                "- 축제/불꽃/행사 키워드가 있고 기간이 있으면 festival_with_travel\n" +
                "- 축제 키워드 없이 여행/코스/추천만 있으면 travel_only";
            
            String analysisResult = callOpenAI(analysisPrompt);
            log.info("📋 AI 분석 결과: {}", analysisResult);
            
            return parseAnalysisResult(analysisResult);
        } catch (Exception e) {
            log.error("AI 분석 실패, 기본값 사용", e);
            return createDefaultAnalysis(userMessage);
        }
    }
    
    /**
     * 🌐 AI 분석 결과로 관련 TourAPI 데이터 수집
     */
    private List<TourSpot> fetchRelevantTourData(TravelAnalysis analysis) {
        List<TourSpot> allSpots = new ArrayList<>();
        
        try {
            // 지역코드 매핑
            String areaCode = mapRegionToAreaCode(analysis.getRegion());
            log.info("🗺️ 지역 '{}' → 지역코드 '{}'", analysis.getRegion(), areaCode);
            
            // 키워드 기반 검색 우선
            if (analysis.getKeyword() != null && !analysis.getKeyword().equals("일반관광")) {
                List<TourSpot> keywordSpots = searchByKeyword(analysis.getKeyword(), areaCode);
                allSpots.addAll(keywordSpots);
                log.info("🔍 키워드 '{}' 검색 결과: {}개", analysis.getKeyword(), keywordSpots.size());
            }
            
            // 지역 기반 관광지 추가 검색
            List<TourSpot> regionalSpots = searchByRegion(areaCode, analysis.getKeyword());
            allSpots.addAll(regionalSpots);
            log.info("🏛️ 지역 검색 결과: {}개 추가", regionalSpots.size());
            
            // 중복 제거 및 관련성 순 정렬
            allSpots = removeDuplicatesAndSort(allSpots, analysis);
            log.info("✨ 최종 정제 결과: {}개 관광지", allSpots.size());
            
        } catch (Exception e) {
            log.error("TourAPI 데이터 수집 실패", e);
        }
        
        return allSpots;
    }
    
    /**
     * 🎯 AI가 수집된 데이터로 지능적인 응답 생성
     */
    private String generateIntelligentTravelCourse(String originalMessage, TravelAnalysis analysis, List<TourSpot> spots) {
        String requestType = analysis.getRequestType();
        
        // 일반 대화인 경우
        if ("general_chat".equals(requestType)) {
            String generalPrompt = "다음 사용자 질문에 친근하고 도움이 되는 답변을 해주세요:\n\n" +
                "사용자 질문: \"" + originalMessage + "\"\n\n" +
                "주의사항:\n" +
                "- 여행 코스를 제안하지 마세요\n" +
                "- @location이나 @day 같은 특수 태그를 사용하지 마세요\n" +
                "- 사용자의 실제 질문에 맞는 적절한 답변을 해주세요\n" +
                "- 만약 여행 관련 도움이 필요하면 구체적인 지역이나 키워드를 알려달라고 안내해주세요";
            
            return callOpenAI(generalPrompt);
        }
        
        // 축제만 검색인 경우
        if ("festival_only".equals(requestType)) {
            return generateFestivalOnlyResponse(originalMessage, analysis, spots);
        }
        
        // 축제 + 여행코스 또는 일반 여행코스인 경우
        if ("festival_with_travel".equals(requestType) || "travel_only".equals(requestType)) {
            return generateTravelCourseResponse(originalMessage, analysis, spots);
        }
        
        // 기본 fallback
        return generateTravelCourseResponse(originalMessage, analysis, spots);
    }
    
    // AI 분석 결과를 담는 클래스
    private static class TravelAnalysis {
        private String requestType;
        private String region;
        private String keyword;
        private String duration;
        private String intent;
        
        public TravelAnalysis(String requestType, String region, String keyword, String duration, String intent) {
            this.requestType = requestType;
            this.region = region;
            this.keyword = keyword;
            this.duration = duration;
            this.intent = intent;
        }
        
        // Getters
        public String getRequestType() { return requestType; }
        public String getRegion() { return region; }
        public String getKeyword() { return keyword; }
        public String getDuration() { return duration; }
        public String getIntent() { return intent; }
    }
    
    // TourAPI 관광지 정보를 담는 클래스
    private static class TourSpot {
        private String title;
        private String category;
        private String addr;
        private String mapx;
        private String mapy;
        private String image;
        private double relevanceScore;
        
        public TourSpot(String title, String category, String addr, String mapx, String mapy) {
            this.title = title;
            this.category = category;
            this.addr = addr;
            this.mapx = mapx;
            this.mapy = mapy;
            this.relevanceScore = 0.5; // 기본값
        }
        
        // Getters and Setters
        public String getTitle() { return title; }
        public String getCategory() { return category; }
        public String getAddr() { return addr; }
        public String getMapx() { return mapx; }
        public String getMapy() { return mapy; }
        public String getImage() { return image; }
        public double getRelevanceScore() { return relevanceScore; }
        
        public void setTitle(String title) { this.title = title; }
        public void setCategory(String category) { this.category = category; }
        public void setAddr(String addr) { this.addr = addr; }
        public void setMapx(String mapx) { this.mapx = mapx; }
        public void setMapy(String mapy) { this.mapy = mapy; }
        public void setRelevanceScore(double score) { this.relevanceScore = score; }
        public void setImage(String image) { this.image = image; }
    }
    
    /**
     * AI 분석 결과 파싱
     */
    private TravelAnalysis parseAnalysisResult(String analysisResult) {
        String requestType = extractValue(analysisResult, "요청타입:");
        String region = extractValue(analysisResult, "지역:");
        String keyword = extractValue(analysisResult, "키워드:");
        String duration = extractValue(analysisResult, "기간:");
        String intent = extractValue(analysisResult, "의도:");
        
        // NONE 값들을 null로 처리
        if ("NONE".equals(region)) region = null;
        if ("NONE".equals(keyword)) keyword = null;
        if ("NONE".equals(duration)) duration = null;
        
        return new TravelAnalysis(
            requestType != null ? requestType : "general_chat",
            region != null ? region : "서울",
            keyword != null ? keyword : "일반관광", 
            duration != null ? duration : "당일치기",
            intent != null ? intent : "사용자 요청"
        );
    }
    
    /**
     * 기본 분석 결과 생성 (AI 분석 실패 시)
     */
    private TravelAnalysis createDefaultAnalysis(String userMessage) {
        // 간단한 키워드 매칭으로 기본값 설정
        String region = "서울";
        for (Map.Entry<String, String> entry : AREA_CODE_MAP.entrySet()) {
            if (userMessage.contains(entry.getKey())) {
                region = entry.getKey();
                break;
            }
        }
        
        return new TravelAnalysis("general_chat", region, "일반관광", "당일치기", "일반적인 여행");
    }
    
    /**
     * 여행 관련 요청인지 판별 (requestType 기반)
     */
    private boolean isTravelRelatedRequest(TravelAnalysis analysis) {
        String requestType = analysis.getRequestType();
        
        // general_chat인 경우 TourAPI 호출 안함
        if ("general_chat".equals(requestType)) {
            log.info("🔍 일반대화 요청 - TourAPI 호출 생략");
            return false;
        }
        
        // festival_only, festival_with_travel, travel_only인 경우 TourAPI 호출
        boolean needsTourAPI = "festival_only".equals(requestType) || 
                              "festival_with_travel".equals(requestType) || 
                              "travel_only".equals(requestType);
        
        log.info("🔍 요청타입: {} → TourAPI 호출: {}", requestType, needsTourAPI);
        
        return needsTourAPI;
    }
    
    /**
     * 텍스트에서 값 추출 유틸리티
     */
    private String extractValue(String text, String key) {
        try {
            Pattern pattern = Pattern.compile(key + "\\s*(.+?)(?:\\n|$)");
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                return matcher.group(1).trim().replaceAll("^\\[|\\]$", "");
            }
        } catch (Exception e) {
            log.warn("값 추출 실패: {}", key);
        }
        return null;
    }
    
    /**
     * 지역명을 지역코드로 매핑 (확장된 매핑)
     */
    private String mapRegionToAreaCode(String region) {
        if (region == null) return "1";
        
        // 완전 일치 우선
        String directMatch = AREA_CODE_MAP.get(region);
        if (directMatch != null) {
            return directMatch;
        }
        
        // 부분 일치 검색
        for (Map.Entry<String, String> entry : AREA_CODE_MAP.entrySet()) {
            if (region.contains(entry.getKey()) || entry.getKey().contains(region)) {
                return entry.getValue();
            }
        }
        
        return "1"; // 기본값: 서울
    }
    
    /**
     * 키워드로 TourAPI 검색 (실제 구현)
     */
    private List<TourSpot> searchByKeyword(String keyword, String areaCode) {
        List<TourSpot> spots = new ArrayList<>();
        
        try {
            log.info("🔍 TourAPI 키워드 검색 시작: '{}' (지역코드: {})", keyword, areaCode);
            
            // TourAPI 키워드 검색 URL 구성
            String url = (tourApiBaseUrl != null ? tourApiBaseUrl : TOUR_API_BASE_URL) + "/searchKeyword2?" +
                "serviceKey=" + tourApiKey +
                "&numOfRows=20" +
                "&pageNo=1" +
                "&MobileOS=ETC" +
                "&MobileApp=festive" +
                "&keyword=" + java.net.URLEncoder.encode(keyword, "UTF-8") +
                "&_type=json" +
                "&arrange=A";
            
            // 지역코드가 있으면 추가
            if (areaCode != null && !areaCode.isEmpty()) {
                url += "&areaCode=" + areaCode;
            }
            
            log.info("📡 TourAPI 요청 URL: {}", url);
            
            // RestTemplate으로 API 호출 (String으로 받아서 XML 파싱)
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String responseBody = response.getBody();
                log.info("✅ TourAPI 응답 수신: {} bytes", responseBody.length());
                log.debug("📄 TourAPI 응답 (처음 200자): {}", responseBody.substring(0, Math.min(200, responseBody.length())));
                
                // JSON 또는 XML 응답 데이터 파싱
                if (responseBody.trim().startsWith("{")) {
                    // JSON 응답 처리
                    spots = parseJsonTourApiResponse(responseBody, keyword);
                    log.info("🎯 키워드 '{}' JSON 검색 결과: {}개", keyword, spots.size());
                } else {
                    // XML 응답 처리
                    spots = parseXmlTourApiResponse(responseBody, keyword);
                    log.info("🎯 키워드 '{}' XML 검색 결과: {}개", keyword, spots.size());
                }
                
            } else {
                log.warn("❌ TourAPI 키워드 검색 실패: HTTP {}", response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ TourAPI 키워드 검색 오류", e);
        }
        
        return spots;
    }
    
    /**
     * 지역으로 TourAPI 검색 (실제 구현)
     */
    private List<TourSpot> searchByRegion(String areaCode, String keyword) {
        List<TourSpot> spots = new ArrayList<>();
        
        try {
            log.info("🏛️ TourAPI 지역 검색 시작: 지역코드 '{}' (키워드: {})", areaCode, keyword);
            
            // 다양한 콘텐츠 타입으로 검색 (관광지, 문화시설, 축제, 음식점 등)
            String[] contentTypes = {"12", "14", "15", "39"}; // 관광지, 문화시설, 축제, 음식점
            
            for (String contentTypeId : contentTypes) {
                String categoryName = CONTENT_TYPE_MAP.get(contentTypeId);
                
                try {
                    String url = (tourApiBaseUrl != null ? tourApiBaseUrl : TOUR_API_BASE_URL) + "/areaBasedList2?" +
                        "serviceKey=" + tourApiKey +
                        "&numOfRows=15" +
                        "&pageNo=1" +
                        "&MobileOS=ETC" +
                        "&MobileApp=festive" +
                        "&areaCode=" + areaCode +
                        "&contentTypeId=" + contentTypeId +
                        "&listYN=Y" +
                        "&arrange=A" +
                        "&_type=json";
                    
                    log.info("📡 {} 검색: {}", categoryName, url.substring(0, 120) + "...");
                    
                    ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
                    
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        String responseBody = response.getBody();
                        List<TourSpot> categorySpots;
                        
                        // JSON 또는 XML 응답 데이터 파싱
                        if (responseBody.trim().startsWith("{")) {
                            categorySpots = parseJsonTourApiResponse(responseBody, keyword);
                        } else {
                            categorySpots = parseXmlTourApiResponse(responseBody, keyword);
                        }
                        
                        // 카테고리 정보 설정
                        categorySpots.forEach(spot -> {
                            spot.setCategory(categoryName);
                            // 키워드와의 관련성 점수 계산
                            if (keyword != null && !keyword.isEmpty()) {
                                spot.setRelevanceScore(calculateRelevanceScore(spot, keyword));
                            }
                        });
                        
                        spots.addAll(categorySpots);
                        log.info("✅ {} 검색 결과: {}개", categoryName, categorySpots.size());
                        
                    } else {
                        log.warn("❌ {} 검색 실패: HTTP {}", categoryName, response.getStatusCode());
                    }
                    
                } catch (Exception e) {
                    log.warn("❌ {} 검색 오류: {}", categoryName, e.getMessage());
                }
            }
            
            log.info("🎯 지역코드 '{}' 전체 검색 결과: {}개", areaCode, spots.size());
            
        } catch (Exception e) {
            log.error("❌ TourAPI 지역 검색 전체 오류", e);
        }
        
        return spots;
    }
    
    /**
     * TourAPI XML 응답 데이터 파싱
     */
    private List<TourSpot> parseXmlTourApiResponse(String xmlResponse, String keyword) {
        List<TourSpot> spots = new ArrayList<>();
        
        try {
            // XML 문서 파싱
            javax.xml.parsers.DocumentBuilderFactory factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
            javax.xml.parsers.DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(new java.io.ByteArrayInputStream(xmlResponse.getBytes("UTF-8")));
            
            // 에러 응답 확인
            org.w3c.dom.NodeList errorMsgNodes = doc.getElementsByTagName("errMsg");
            org.w3c.dom.NodeList returnAuthMsgNodes = doc.getElementsByTagName("returnAuthMsg");
            
            if (errorMsgNodes.getLength() > 0 || returnAuthMsgNodes.getLength() > 0) {
                String errorMsg = errorMsgNodes.getLength() > 0 ? errorMsgNodes.item(0).getTextContent() : "";
                String authMsg = returnAuthMsgNodes.getLength() > 0 ? returnAuthMsgNodes.item(0).getTextContent() : "";
                log.warn("❌ TourAPI 에러 응답 - 에러: {}, 인증: {}", errorMsg, authMsg);
                return spots;
            }
            
            // totalCount 확인
            org.w3c.dom.NodeList totalCountNodes = doc.getElementsByTagName("totalCount");
            int totalCount = 0;
            if (totalCountNodes.getLength() > 0) {
                try {
                    totalCount = Integer.parseInt(totalCountNodes.item(0).getTextContent());
                } catch (NumberFormatException e) {
                    log.warn("⚠️ totalCount 파싱 실패");
                }
            }
            
            if (totalCount == 0) {
                log.info("ℹ️ 검색 결과가 없습니다 (totalCount: 0)");
                return spots;
            }
            
            // item 노드들 추출
            org.w3c.dom.NodeList itemNodes = doc.getElementsByTagName("item");
            log.info("📋 파싱할 아이템 수: {}", itemNodes.getLength());
            
            for (int i = 0; i < itemNodes.getLength(); i++) {
                try {
                    org.w3c.dom.Node itemNode = itemNodes.item(i);
                    TourSpot spot = createTourSpotFromXmlNode(itemNode, keyword);
                    if (spot != null) {
                        spots.add(spot);
                    }
                } catch (Exception e) {
                    log.warn("⚠️ 아이템 파싱 실패: {}", e.getMessage());
                }
            }
            
        } catch (Exception e) {
            log.error("❌ TourAPI XML 파싱 실패", e);
        }
        
        return spots;
    }
    
    /**
     * TourAPI JSON 응답 데이터 파싱
     */
    private List<TourSpot> parseJsonTourApiResponse(String jsonResponse, String keyword) {
        List<TourSpot> spots = new ArrayList<>();
        
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(jsonResponse);
            
            // 응답 구조: response -> header -> resultCode 확인
            JsonNode responseNode = rootNode.get("response");
            if (responseNode == null) {
                log.warn("⚠️ TourAPI JSON 응답에 'response' 키가 없습니다");
                return spots;
            }
            
            JsonNode headerNode = responseNode.get("header");
            if (headerNode != null) {
                String resultCode = headerNode.get("resultCode").asText();
                String resultMsg = headerNode.get("resultMsg").asText();
                
                if (!"0000".equals(resultCode)) {
                    log.warn("❌ TourAPI 에러 응답 - 코드: {}, 메시지: {}", resultCode, resultMsg);
                    return spots;
                }
            }
            
            // body -> items -> item 추출
            JsonNode bodyNode = responseNode.get("body");
            if (bodyNode == null) {
                log.warn("⚠️ TourAPI JSON 응답에 'body' 키가 없습니다");
                return spots;
            }
            
            // totalCount 확인
            int totalCount = bodyNode.has("totalCount") ? bodyNode.get("totalCount").asInt() : 0;
            if (totalCount == 0) {
                log.info("ℹ️ 검색 결과가 없습니다 (totalCount: 0)");
                return spots;
            }
            
            JsonNode itemsNode = bodyNode.get("items");
            if (itemsNode == null) {
                log.warn("⚠️ JSON 응답에 'items' 키가 없습니다");
                return spots;
            }
            
            JsonNode itemNode = itemsNode.get("item");
            if (itemNode == null) {
                log.warn("⚠️ items에 'item' 키가 없습니다");
                return spots;
            }
            
            // item이 배열인지 단일 객체인지 확인
            if (itemNode.isArray()) {
                log.info("📋 파싱할 JSON 아이템 수: {}", itemNode.size());
                for (JsonNode item : itemNode) {
                    TourSpot spot = createTourSpotFromJsonNode(item, keyword);
                    if (spot != null) {
                        spots.add(spot);
                    }
                }
            } else {
                log.info("📋 파싱할 JSON 아이템 수: 1");
                TourSpot spot = createTourSpotFromJsonNode(itemNode, keyword);
                if (spot != null) {
                    spots.add(spot);
                }
            }
            
        } catch (Exception e) {
            log.error("❌ TourAPI JSON 파싱 실패", e);
        }
        
        return spots;
    }
    
    /**
     * JSON 노드에서 TourSpot 객체 생성
     */
    private TourSpot createTourSpotFromJsonNode(JsonNode itemNode, String keyword) {
        try {
            String title = itemNode.has("title") ? itemNode.get("title").asText() : null;
            String addr1 = itemNode.has("addr1") ? itemNode.get("addr1").asText() : null;
            String mapx = itemNode.has("mapx") ? itemNode.get("mapx").asText() : null;
            String mapy = itemNode.has("mapy") ? itemNode.get("mapy").asText() : null;
            String contentTypeId = itemNode.has("contenttypeid") ? itemNode.get("contenttypeid").asText() : null;
            
            // 필수 정보 검증
            if (title == null || title.trim().isEmpty() || 
                mapx == null || mapx.trim().isEmpty() || 
                mapy == null || mapy.trim().isEmpty()) {
                return null;
            }
            
            // 좌표 유효성 검증
            try {
                double lat = Double.parseDouble(mapy);
                double lng = Double.parseDouble(mapx);
                if (lat <= 0 || lng <= 0) {
                    return null;
                }
            } catch (NumberFormatException e) {
                return null;
            }
            
            String category = CONTENT_TYPE_MAP.getOrDefault(contentTypeId, "기타");
            
            TourSpot spot = new TourSpot(
                title.trim(),
                category,
                addr1 != null ? addr1.trim() : "",
                mapx.trim(),
                mapy.trim()
            );
            
            // 추가 정보 설정
            if (itemNode.has("firstimage")) {
                String firstimage = itemNode.get("firstimage").asText();
                if (firstimage != null && !firstimage.trim().isEmpty()) {
                    spot.setImage(firstimage.trim());
                }
            }
            
            // 관련성 점수 계산
            if (keyword != null && !keyword.isEmpty()) {
                spot.setRelevanceScore(calculateRelevanceScore(spot, keyword));
            }
            
            log.debug("✅ JSON TourSpot 생성: {} ({})", spot.getTitle(), spot.getCategory());
            return spot;
            
        } catch (Exception e) {
            log.warn("⚠️ JSON TourSpot 생성 실패: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * XML 노드에서 텍스트 값 추출
     */
    private String getTextContentFromXmlNode(org.w3c.dom.Node parentNode, String tagName) {
        try {
            org.w3c.dom.NodeList nodeList = ((org.w3c.dom.Element) parentNode).getElementsByTagName(tagName);
            if (nodeList.getLength() > 0) {
                return nodeList.item(0).getTextContent();
            }
        } catch (Exception e) {
            // 조용히 실패 처리
        }
        return null;
    }
    
    /**
     * XML 노드에서 TourSpot 객체 생성
     */
    private TourSpot createTourSpotFromXmlNode(org.w3c.dom.Node itemNode, String keyword) {
        try {
            String title = getTextContentFromXmlNode(itemNode, "title");
            String addr1 = getTextContentFromXmlNode(itemNode, "addr1");
            String mapx = getTextContentFromXmlNode(itemNode, "mapx");
            String mapy = getTextContentFromXmlNode(itemNode, "mapy");
            String contentTypeId = getTextContentFromXmlNode(itemNode, "contenttypeid");
            
            // 필수 정보 검증
            if (title == null || title.trim().isEmpty() || 
                mapx == null || mapx.trim().isEmpty() || 
                mapy == null || mapy.trim().isEmpty()) {
                return null;
            }
            
            // 좌표 유효성 검증
            try {
                double lat = Double.parseDouble(mapy);
                double lng = Double.parseDouble(mapx);
                if (lat <= 0 || lng <= 0) {
                    return null;
                }
            } catch (NumberFormatException e) {
                return null;
            }
            
            String category = CONTENT_TYPE_MAP.getOrDefault(contentTypeId, "기타");
            
            TourSpot spot = new TourSpot(
                title.trim(),
                category,
                addr1 != null ? addr1.trim() : "",
                mapx.trim(),
                mapy.trim()
            );
            
            // 추가 정보 설정
            String firstimage = getTextContentFromXmlNode(itemNode, "firstimage");
            if (firstimage != null && !firstimage.trim().isEmpty()) {
                spot.setImage(firstimage.trim());
            }
            
            // 관련성 점수 계산
            if (keyword != null && !keyword.isEmpty()) {
                spot.setRelevanceScore(calculateRelevanceScore(spot, keyword));
            }
            
            log.debug("✅ TourSpot 생성: {} ({})", spot.getTitle(), spot.getCategory());
            return spot;
            
        } catch (Exception e) {
            log.warn("⚠️ TourSpot 생성 실패: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * TourAPI 아이템에서 TourSpot 객체 생성
     */
    private TourSpot createTourSpotFromItem(Map<String, Object> item, String keyword) {
        try {
            String title = (String) item.get("title");
            String addr1 = (String) item.get("addr1");
            String mapx = (String) item.get("mapx");
            String mapy = (String) item.get("mapy");
            String contentTypeId = (String) item.get("contenttypeid");
            
            // 필수 정보 검증
            if (title == null || title.trim().isEmpty() || 
                mapx == null || mapx.trim().isEmpty() || 
                mapy == null || mapy.trim().isEmpty()) {
                return null;
            }
            
            // 좌표 유효성 검증
            try {
                double lat = Double.parseDouble(mapy);
                double lng = Double.parseDouble(mapx);
                if (lat <= 0 || lng <= 0) {
                    return null;
                }
            } catch (NumberFormatException e) {
                return null;
            }
            
            String category = CONTENT_TYPE_MAP.getOrDefault(contentTypeId, "기타");
            
            TourSpot spot = new TourSpot(
                title.trim(),
                category,
                addr1 != null ? addr1.trim() : "",
                mapx.trim(),
                mapy.trim()
            );
            
            // 추가 정보 설정
            String firstimage = (String) item.get("firstimage");
            if (firstimage != null && !firstimage.trim().isEmpty()) {
                spot.setImage(firstimage.trim());
            }
            
            // 관련성 점수 계산
            if (keyword != null && !keyword.isEmpty()) {
                spot.setRelevanceScore(calculateRelevanceScore(spot, keyword));
            }
            
            log.debug("✅ TourSpot 생성: {} ({})", spot.getTitle(), spot.getCategory());
            return spot;
            
        } catch (Exception e) {
            log.warn("⚠️ TourSpot 생성 실패: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * 키워드와 관광지의 관련성 점수 계산
     */
    private double calculateRelevanceScore(TourSpot spot, String keyword) {
        double score = 0.5; // 기본 점수
        
        if (keyword == null || keyword.isEmpty() || spot.getTitle() == null) {
            return score;
        }
        
        String title = spot.getTitle().toLowerCase();
        String keywordLower = keyword.toLowerCase();
        
        // 제목에 키워드가 포함되어 있으면 높은 점수
        if (title.contains(keywordLower)) {
            score = 0.9;
        }
        // 키워드와 관련된 카테고리면 중간 점수
        else if (isRelatedCategory(spot.getCategory(), keyword)) {
            score = 0.7;
        }
        
        return score;
    }
    
    /**
     * 키워드와 카테고리의 관련성 확인
     */
    private boolean isRelatedCategory(String category, String keyword) {
        if (category == null || keyword == null) return false;
        
        String keywordLower = keyword.toLowerCase();
        
        // 축제 관련 키워드
        if ((keywordLower.contains("축제") || keywordLower.contains("불꽃") || 
             keywordLower.contains("공연") || keywordLower.contains("이벤트")) &&
            category.equals("축제공연행사")) {
            return true;
        }
        
        // 음식 관련 키워드
        if ((keywordLower.contains("맛집") || keywordLower.contains("음식") || 
             keywordLower.contains("식당") || keywordLower.contains("카페")) &&
            category.equals("음식점")) {
            return true;
        }
        
        // 관광 관련 키워드
        if ((keywordLower.contains("관광") || keywordLower.contains("여행") || 
             keywordLower.contains("명소")) &&
            category.equals("관광지")) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 중복 제거 및 관련성 기반 정렬
     */
    private List<TourSpot> removeDuplicatesAndSort(List<TourSpot> spots, TravelAnalysis analysis) {
        // TODO: 중복 제거 및 AI 기반 관련성 점수 계산
        return spots.stream()
            .distinct()
            .sorted((a, b) -> Double.compare(b.getRelevanceScore(), a.getRelevanceScore()))
            .limit(20)
            .collect(Collectors.toList());
    }
    
    /**
     * TourSpot 리스트에서 축제 정보 리스트 생성
     */
    private List<ChatResponse.FestivalInfo> createFestivalInfoFromSpots(List<TourSpot> spots) {
        List<ChatResponse.FestivalInfo> festivals = new ArrayList<>();
        
        // 축제 관련 스팟만 필터링
        List<TourSpot> festivalSpots = spots.stream()
            .filter(spot -> "축제공연행사".equals(spot.getCategory()))
            .limit(10) // 최대 10개
            .collect(Collectors.toList());
        
        log.info("🔍 축제 스팟 필터링 결과: {}개 (전체: {}개)", festivalSpots.size(), spots.size());
        
        // 디버깅: 모든 스팟의 카테고리 확인
        for (TourSpot spot : spots) {
            log.debug("📋 스팟: {} - 카테고리: {}", spot.getTitle(), spot.getCategory());
        }
        
        for (TourSpot spot : festivalSpots) {
            ChatResponse.FestivalInfo festival = new ChatResponse.FestivalInfo();
            festival.setName(spot.getTitle());
            festival.setPeriod("TourAPI 정보 확인 필요"); // 상세 정보 API 별도 호출 필요
            festival.setLocation(spot.getAddr());
            festival.setDescription(spot.getCategory() + " - " + spot.getTitle());
            festival.setImage(spot.getImage());
            festival.setContact("정보 없음");
            festival.setContentId(""); // TourAPI contentId 설정 필요
            festival.setContentTypeId("15"); // 축제공연행사
            festival.setMapX(spot.getMapx());
            festival.setMapY(spot.getMapy());
            festival.setAddr1(spot.getAddr());
            festival.setTel("정보 없음");
            
            festivals.add(festival);
        }
        
        log.info("🎭 축제 정보 생성 완료: {}개", festivals.size());
        return festivals;
    }
    
    /**
     * 기본 축제 정보 생성 (TourAPI에서 데이터가 없을 때)
     */
    private ChatResponse.FestivalInfo createDefaultFestivalInfo(TravelAnalysis analysis) {
        try {
            String region = analysis.getRegion() != null ? analysis.getRegion() : "지역";
            String keyword = analysis.getKeyword() != null ? analysis.getKeyword() : "축제";
            
            ChatResponse.FestivalInfo festival = new ChatResponse.FestivalInfo();
            
            // 키워드 기반 축제명 생성
            if (keyword.contains("불꽃")) {
                festival.setName(region + " 불꽃축제");
                festival.setDescription("아름다운 불꽃이 하늘을 수놓는 " + region + "의 대표 축제입니다. 화려한 불꽃쇼와 함께 다양한 문화 행사가 펼쳐집니다.");
            } else if (keyword.contains("벚꽃")) {
                festival.setName(region + " 벚꽃축제");
                festival.setDescription("봄의 전령 벚꽃이 만개하는 " + region + "의 아름다운 축제입니다. 벚꽃 구경과 함께 다양한 봄 축제를 즐길 수 있습니다.");
            } else if (keyword.contains("음식") || keyword.contains("맛")) {
                festival.setName(region + " 음식축제");
                festival.setDescription(region + "의 대표 음식과 지역 특산물을 맛볼 수 있는 미식 축제입니다.");
            } else {
                festival.setName(region + " " + keyword + " 축제");
                festival.setDescription(region + "에서 열리는 " + keyword + " 관련 특별한 축제입니다.");
            }
            
            // 기본 정보 설정
            festival.setPeriod("축제 일정은 현지 확인이 필요합니다");
            festival.setLocation(region);
            festival.setContact("지역 관광 안내소 또는 공식 홈페이지 확인");
            festival.setContentId("");
            festival.setContentTypeId("15");
            festival.setAddr1(region + " 일원");
            festival.setTel("현지 문의");
            
            // 지역별 기본 좌표 설정
            if (region.contains("부산")) {
                festival.setMapX("129.0756");
                festival.setMapY("35.1796");
            } else if (region.contains("서울")) {
                festival.setMapX("126.9780");
                festival.setMapY("37.5665");
            } else if (region.contains("제주")) {
                festival.setMapX("126.5312");
                festival.setMapY("33.4996");
            } else {
                festival.setMapX("127.0000");
                festival.setMapY("37.0000");
            }
            
            log.info("🎪 기본 축제 정보 생성: {}", festival.getName());
            return festival;
            
        } catch (Exception e) {
            log.error("기본 축제 정보 생성 실패", e);
            return null;
        }
    }
    
    /**
     * 위치 정보에서 여행코스 생성
     */
    private ChatResponse.TravelCourse createTravelCourseFromLocations(List<ChatResponse.LocationInfo> locations, TravelAnalysis analysis) {
        ChatResponse.TravelCourse travelCourse = new ChatResponse.TravelCourse();
        travelCourse.setCourseTitle(analysis.getRegion() + " " + analysis.getDuration() + " 여행코스");
        
        // 기간에서 일수 추출
        int totalDays = extractDaysFromDuration(analysis.getDuration());
        travelCourse.setTotalDays(totalDays);
        
        // Day별로 위치들을 그룹화
        Map<Integer, List<ChatResponse.LocationInfo>> locationsByDay = locations.stream()
            .collect(Collectors.groupingBy(ChatResponse.LocationInfo::getDay));
        
        List<ChatResponse.DailySchedule> dailySchedules = new ArrayList<>();
        
        for (int day = 1; day <= totalDays; day++) {
            List<ChatResponse.LocationInfo> dayLocations = locationsByDay.getOrDefault(day, new ArrayList<>());
            
            ChatResponse.DailySchedule dailySchedule = new ChatResponse.DailySchedule();
            dailySchedule.setDay(day);
            dailySchedule.setTheme("Day " + day + " - " + analysis.getKeyword() + " 탐방");
            
            List<ChatResponse.PlaceInfo> places = new ArrayList<>();
            for (ChatResponse.LocationInfo location : dayLocations) {
                ChatResponse.PlaceInfo place = new ChatResponse.PlaceInfo();
                place.setName(location.getName());
                place.setType("attraction"); // 기본값
                place.setAddress("주소 정보 없음");
                place.setDescription(location.getDescription());
                place.setLatitude(location.getLatitude());
                place.setLongitude(location.getLongitude());
                place.setVisitTime(location.getDescription()); // 시간 정보가 description에 있음
                place.setDuration("1시간"); // 기본값
                place.setCategory(analysis.getKeyword());
                
                places.add(place);
            }
            
            dailySchedule.setPlaces(places);
            dailySchedules.add(dailySchedule);
        }
        
        travelCourse.setDailySchedule(dailySchedules);
        
        log.info("🗓️ 여행코스 생성 완료: {}일 코스", totalDays);
        return travelCourse;
    }
    
    /**
     * 기간 문자열에서 일수 추출
     */
    private int extractDaysFromDuration(String duration) {
        if (duration == null) return 1;
        
        if (duration.contains("2박3일")) return 3;
        if (duration.contains("1박2일")) return 2;
        if (duration.contains("3박4일")) return 4;
        if (duration.contains("4박5일")) return 5;
        
        // "N일" 패턴 찾기
        Pattern pattern = Pattern.compile("(\\d+)일");
        Matcher matcher = pattern.matcher(duration);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        
        return 1; // 기본값: 당일치기
    }

    @Override
    public ChatResponse.LocationInfo extractLocationInfo(String content) {
        // 위치 정보 추출 로직 (정규식 사용)
        Pattern locationPattern = Pattern.compile("@location:\\[([^,]+),([^\\]]+)\\]\\s*@day:(\\d+)");
        Matcher matcher = locationPattern.matcher(content);
        
        if (matcher.find()) {
            return new ChatResponse.LocationInfo(
                "추천 장소",
                Double.parseDouble(matcher.group(1).trim()),
                Double.parseDouble(matcher.group(2).trim()),
                Integer.parseInt(matcher.group(3).trim()),
                "AI 추천 장소입니다."
            );
        }
        
        return null;
    }

    /**
     * OpenAI API 호출
     */
    private String callOpenAI(String prompt) {
        try {
            log.info("🤖 OpenAI API 호출 시작");
            
            if (openAiApiKey == null || openAiApiKey.isEmpty()) {
                log.warn("❌ OpenAI API 키가 설정되지 않았습니다.");
                return "죄송합니다. AI 서비스 설정에 문제가 있습니다.";
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + openAiApiKey);
            headers.set("Content-Type", "application/json");
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o-mini");
            requestBody.put("max_tokens", 1500);
            requestBody.put("temperature", 0.7);
            
            List<Map<String, Object>> messages = new ArrayList<>();
            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", ASSISTANT_INSTRUCTIONS);
            messages.add(systemMessage);
            
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            
            requestBody.put("messages", messages);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            log.info("📤 OpenAI 요청 전송 중...");
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/chat/completions",
                entity,
                Map.class
            );
            
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    String content = (String) message.get("content");
                    
                    log.info("✅ OpenAI 응답 수신 완료 - 길이: {}", content.length());
                    return content;
                }
            }
            
            log.warn("❌ OpenAI 응답 파싱 실패");
            return "죄송합니다. AI 응답을 처리할 수 없습니다.";
            
        } catch (Exception e) {
            log.error("OpenAI API 호출 실패", e);
            return "죄송합니다. AI 서비스에 일시적인 문제가 발생했습니다.";
        }
    }
    
    /**
     * AI 응답에서 위치 정보 추출
     */
    private List<ChatResponse.LocationInfo> extractLocations(String content) {
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        try {
            Pattern locationPattern = Pattern.compile("@location:\\[([\\d\\.]+),([\\d\\.]+)\\]\\s*@day:(\\d+)");
            Matcher matcher = locationPattern.matcher(content);
            
            int spotIndex = 0;
            while (matcher.find()) {
                double lat = Double.parseDouble(matcher.group(1).trim());
                double lng = Double.parseDouble(matcher.group(2).trim());
                int day = Integer.parseInt(matcher.group(3).trim());
                
                if (lat > 0 && lng > 0 && day > 0 && day <= 10) {
                    // 장소명 추출 시도
                    String placeName = extractPlaceNameFromContext(content, matcher.start());
                    
                    if (placeName == null || placeName.isEmpty()) {
                        placeName = "Day " + day + " 코스 " + (spotIndex + 1);
                    }
                    
                    // 시간 정보 추출 시도
                    String timeInfo = extractTimeFromContext(content, matcher.start());
                    
                    ChatResponse.LocationInfo location = new ChatResponse.LocationInfo(
                        placeName,
                        lat,
                        lng,
                        day,
                        timeInfo != null ? timeInfo : "시간 정보 없음"
                    );
                    
                    locations.add(location);
                    spotIndex++;
                    
                    log.info("📍 위치 추출: {} (Day {}, {}, {})", placeName, day, lat, lng);
                }
            }
            
            log.info("🎯 총 {}개 위치 추출 완료", locations.size());
            
        } catch (Exception e) {
            log.error("위치 정보 추출 실패", e);
        }
        
        return locations;
    }
    
    /**
     * 문맥에서 장소명 추출
     */
    private String extractPlaceNameFromContext(String content, int locationIndex) {
        try {
            // @location 태그 앞의 텍스트에서 장소명 찾기
            String beforeLocation = content.substring(Math.max(0, locationIndex - 200), locationIndex);
            String[] lines = beforeLocation.split("\n");
            
            // 가장 가까운 줄에서 장소명 패턴 찾기
            for (int i = lines.length - 1; i >= 0; i--) {
                String line = lines[i].trim();
                
                // "1. **오전 09:00** - 장소명" 패턴
                Pattern namePattern = Pattern.compile("\\d+\\.*\\s*\\*\\*[^*]*\\*\\*\\s*-\\s*(.+?)(?:\\s|$)");
                Matcher nameMatcher = namePattern.matcher(line);
                if (nameMatcher.find()) {
                    String name = nameMatcher.group(1).trim();
                    if (isValidPlaceName(name)) {
                        return name;
                    }
                }
                
                // "- 장소명" 패턴
                if (line.startsWith("-") && line.length() > 2) {
                    String name = line.substring(1).trim();
                    if (isValidPlaceName(name)) {
                        return name;
                    }
                }
            }
            
        } catch (Exception e) {
            log.warn("장소명 추출 실패", e);
        }
        
        return null;
    }
    
    /**
     * 문맥에서 시간 정보 추출
     */
    private String extractTimeFromContext(String content, int locationIndex) {
        try {
            String beforeLocation = content.substring(Math.max(0, locationIndex - 100), locationIndex);
            
            // **오전/오후 시간** 패턴 찾기
            Pattern timePattern = Pattern.compile("\\*\\*([^*]*(?:오전|오후)[^*]*)\\*\\*");
            Matcher timeMatcher = timePattern.matcher(beforeLocation);
            
            String lastTime = null;
            while (timeMatcher.find()) {
                lastTime = timeMatcher.group(1).trim();
            }
            
            return lastTime;
            
        } catch (Exception e) {
            log.warn("시간 정보 추출 실패", e);
        }
        
        return null;
    }
    
    /**
     * 유효한 장소명인지 확인
     */
    private boolean isValidPlaceName(String name) {
        if (name == null || name.trim().isEmpty() || name.length() < 2) {
            return false;
        }
        
        // 불필요한 문자나 패턴 제외
        if (name.contains("@location") || name.contains("@day") || 
            name.matches(".*\\d{2}:\\d{2}.*") || name.matches("Day \\d+.*")) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 축제만 검색하는 경우의 응답 생성
     */
    private String generateFestivalOnlyResponse(String originalMessage, TravelAnalysis analysis, List<TourSpot> spots) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("🎭 축제 정보 전문가로서 다음 요청에 대한 축제 정보를 제공해주세요:\n\n");
        prompt.append("📝 사용자 요청: ").append(originalMessage).append("\n\n");
        
        // 축제 관련 TourAPI 데이터
        List<TourSpot> festivalSpots = spots.stream()
            .filter(spot -> "축제공연행사".equals(spot.getCategory()))
            .limit(5)
            .collect(Collectors.toList());
        
        if (!festivalSpots.isEmpty()) {
            prompt.append("🌟 실제 축제 정보 (TourAPI):\n");
            for (int i = 0; i < festivalSpots.size(); i++) {
                TourSpot spot = festivalSpots.get(i);
                prompt.append(String.format("%d. %s\n", i + 1, spot.getTitle()));
                prompt.append(String.format("   위치: %s\n", spot.getAddr()));
                prompt.append(String.format("   좌표: [%s, %s]\n", spot.getMapy(), spot.getMapx()));
                prompt.append("\n");
            }
        }
        
        prompt.append("📋 생성 지시사항:\n");
        prompt.append("1. 위 실제 축제 데이터를 바탕으로 축제 정보만 제공\n");
        prompt.append("2. 각 축제의 특징과 매력 포인트 설명\n");
        prompt.append("3. 여행코스는 제안하지 말고 축제 정보에만 집중\n");
        prompt.append("4. @location이나 @day 태그 사용하지 말기\n");
        prompt.append("5. 축제 일정, 위치, 특징 등 유용한 정보 포함\n\n");
        
        prompt.append("사용자가 요청한 축제 정보를 상세히 안내해주세요.");
        
        return callOpenAI(prompt.toString());
    }
    
    /**
     * 여행코스 생성하는 경우의 응답 생성
     */
    private String generateTravelCourseResponse(String originalMessage, TravelAnalysis analysis, List<TourSpot> spots) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("🤖 AI 여행 전문가로서 다음 정보를 바탕으로 최적의 여행코스를 생성해주세요:\n\n");
        
        // 사용자 원본 요청
        prompt.append("📝 사용자 요청: ").append(originalMessage).append("\n\n");
        
        // AI 분석 결과
        prompt.append("🧠 AI 분석 결과:\n");
        prompt.append("- 목적지: ").append(analysis.getRegion()).append("\n");
        prompt.append("- 여행 테마: ").append(analysis.getKeyword()).append("\n");
        prompt.append("- 여행 기간: ").append(analysis.getDuration()).append("\n");
        prompt.append("- 여행 의도: ").append(analysis.getIntent()).append("\n\n");
        
        // 실제 TourAPI 데이터
        if (!spots.isEmpty()) {
            prompt.append("🌟 실제 관광지 데이터 (TourAPI):\n");
            for (int i = 0; i < Math.min(spots.size(), 15); i++) {
                TourSpot spot = spots.get(i);
                prompt.append(String.format("%d. %s (%s)\n", 
                    i + 1, spot.getTitle(), spot.getCategory()));
                prompt.append(String.format("   위치: [%s, %s] - %s\n", 
                    spot.getMapy(), spot.getMapx(), spot.getAddr()));
                if (spot.getRelevanceScore() > 0.8) {
                    prompt.append("   ⭐ 키워드 연관성 높음\n");
                }
                prompt.append("\n");
            }
        }
        
        // AI 생성 지시사항
        prompt.append("📋 생성 지시사항:\n");
        prompt.append("1. 위 실제 데이터를 최대한 활용하여 현실적인 코스 구성\n");
        prompt.append("2. ").append(analysis.getDuration()).append(" 일정에 맞는 적절한 일정 배분\n");
        prompt.append("3. '").append(analysis.getKeyword()).append("' 테마와 연관성이 높은 장소 우선 배치\n");
        prompt.append("4. 지리적 동선을 고려한 효율적인 순서\n");
        prompt.append("5. 각 장소마다 @location:[위도,경도] @day:숫자 형식 필수 포함\n");
        prompt.append("6. 실제 좌표 데이터가 있는 곳은 정확한 좌표 사용\n\n");
        
        prompt.append("위 정보를 바탕으로 사용자 요청에 완벽히 맞는 여행코스를 생성해주세요.");
        
        return callOpenAI(prompt.toString());
    }
} 