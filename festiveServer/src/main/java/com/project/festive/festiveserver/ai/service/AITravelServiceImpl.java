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
import org.springframework.web.util.UriComponentsBuilder;
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
    
    @Value("${tour.api.service-key:}")
    private String tourApiServiceKey;
    
    // 지역코드 및 시군구 코드 매핑
    private final Map<String, String> AREA_CODE_MAP = new HashMap<String, String>() {{
        // 광역시/도
        put("서울", "1"); put("인천", "2"); put("대전", "3"); put("대구", "4");
        put("광주", "5"); put("부산", "6"); put("울산", "7"); put("세종", "8");
        put("경기", "31"); put("강원", "32"); put("충북", "33"); put("충남", "34");
        put("전북", "35"); put("전남", "36"); put("경북", "37"); put("경남", "38"); put("제주", "39");
    }};
    
    // 시군구 코드 매핑 (지역코드_시군구코드 형태)
    private final Map<String, String> SIGUNGU_CODE_MAP = new HashMap<String, String>() {{
        // 서울특별시 (1)
        put("강남구", "1_1"); put("강동구", "1_2"); put("강북구", "1_3"); put("강서구", "1_4");
        put("관악구", "1_5"); put("광진구", "1_6"); put("구로구", "1_7"); put("금천구", "1_8");
        put("노원구", "1_9"); put("도봉구", "1_10"); put("동대문구", "1_11"); put("동작구", "1_12");
        put("마포구", "1_13"); put("서대문구", "1_14"); put("서초구", "1_15"); put("성동구", "1_16");
        put("성북구", "1_17"); put("송파구", "1_18"); put("양천구", "1_19"); put("영등포구", "1_20");
        put("용산구", "1_21"); put("은평구", "1_22"); put("종로구", "1_23"); put("중구", "1_24"); put("중랑구", "1_25");
        
        // 인천광역시 (2) - 주요 구/군만 추가
        put("중구", "2_1"); put("동구", "2_2"); put("미추홀구", "2_3"); put("연수구", "2_4");
        put("남동구", "2_5"); put("부평구", "2_6"); put("계양구", "2_7"); put("서구", "2_8");
        put("강화군", "2_9"); put("옹진군", "2_10");
        
        // 대전광역시 (3)
        put("동구", "3_1"); put("중구", "3_2"); put("서구", "3_3"); put("유성구", "3_4"); put("대덕구", "3_5");
        
        // 대구광역시 (4)
        put("중구", "4_1"); put("동구", "4_2"); put("서구", "4_3"); put("남구", "4_4");
        put("북구", "4_5"); put("수성구", "4_6"); put("달서구", "4_7"); put("달성군", "4_8");
        
        // 광주광역시 (5)
        put("동구", "5_1"); put("서구", "5_2"); put("남구", "5_3"); put("북구", "5_4"); put("광산구", "5_5");
        
        // 부산광역시 (6)
        put("중구", "6_1"); put("서구", "6_2"); put("동구", "6_3"); put("영도구", "6_4");
        put("부산진구", "6_5"); put("동래구", "6_6"); put("남구", "6_7"); put("북구", "6_8");
        put("해운대구", "6_9"); put("사하구", "6_10"); put("금정구", "6_11"); put("강서구", "6_12");
        put("연제구", "6_13"); put("수영구", "6_14"); put("사상구", "6_15"); put("기장군", "6_16");
        
        // 울산광역시 (7)
        put("중구", "7_1"); put("남구", "7_2"); put("동구", "7_3"); put("북구", "7_4"); put("울주군", "7_5");
        
        // 경기도 (31) - 주요 시/군만 추가
        put("수원시", "31_1"); put("성남시", "31_2"); put("고양시", "31_3"); put("용인시", "31_4");
        put("부천시", "31_5"); put("안산시", "31_6"); put("안양시", "31_7"); put("남양주시", "31_8");
        put("화성시", "31_9"); put("평택시", "31_10"); put("의정부시", "31_11"); put("시흥시", "31_12");
        put("파주시", "31_13"); put("김포시", "31_14"); put("광명시", "31_15"); put("광주시", "31_16");
        
        // 강원특별자치도 (32)
        put("춘천시", "32_1"); put("원주시", "32_2"); put("강릉시", "32_3"); put("동해시", "32_4");
        put("태백시", "32_5"); put("속초시", "32_6"); put("삼척시", "32_7"); put("홍천군", "32_8");
        put("횡성군", "32_9"); put("영월군", "32_10"); put("평창군", "32_11"); put("정선군", "32_12");
        put("철원군", "32_13"); put("화천군", "32_14"); put("양구군", "32_15"); put("인제군", "32_16");
        put("고성군", "32_17"); put("양양군", "32_18");
        
        // 충청북도 (33)
        put("청주시", "33_1"); put("충주시", "33_2"); put("제천시", "33_3"); put("보은군", "33_4");
        put("옥천군", "33_5"); put("영동군", "33_6"); put("증평군", "33_7"); put("진천군", "33_8");
        put("괴산군", "33_9"); put("음성군", "33_10"); put("단양군", "33_11");
        
        // 충청남도 (34)
        put("천안시", "34_1"); put("공주시", "34_2"); put("보령시", "34_3"); put("아산시", "34_4");
        put("서산시", "34_5"); put("논산시", "34_6"); put("계룡시", "34_7"); put("당진시", "34_8");
        put("금산군", "34_9"); put("부여군", "34_10"); put("서천군", "34_11"); put("청양군", "34_12");
        put("홍성군", "34_13"); put("예산군", "34_14"); put("태안군", "34_15");
        
        // 전북특별자치도 (35)
        put("전주시", "35_1"); put("군산시", "35_2"); put("익산시", "35_3"); put("정읍시", "35_4");
        put("남원시", "35_5"); put("김제시", "35_6"); put("완주군", "35_7"); put("진안군", "35_8");
        put("무주군", "35_9"); put("장수군", "35_10"); put("임실군", "35_11"); put("순창군", "35_12");
        put("고창군", "35_13"); put("부안군", "35_14");
        
        // 전라남도 (36)
        put("목포시", "36_1"); put("여수시", "36_2"); put("순천시", "36_3"); put("나주시", "36_4");
        put("광양시", "36_5"); put("담양군", "36_6"); put("곡성군", "36_7"); put("구례군", "36_8");
        put("고흥군", "36_9"); put("보성군", "36_10"); put("화순군", "36_11"); put("장흥군", "36_12");
        put("강진군", "36_13"); put("해남군", "36_14"); put("영암군", "36_15"); put("무안군", "36_16");
        put("함평군", "36_17"); put("영광군", "36_18"); put("장성군", "36_19"); put("완도군", "36_20");
        put("진도군", "36_21"); put("신안군", "36_22");
        
        // 경상북도 (37)
        put("포항시", "37_1"); put("경주시", "37_2"); put("김천시", "37_3"); put("안동시", "37_4");
        put("구미시", "37_5"); put("영주시", "37_6"); put("영천시", "37_7"); put("상주시", "37_8");
        put("문경시", "37_9"); put("경산시", "37_10"); put("군위군", "37_11"); put("의성군", "37_12");
        put("청송군", "37_13"); put("영양군", "37_14"); put("영덕군", "37_15"); put("청도군", "37_16");
        put("고령군", "37_17"); put("성주군", "37_18"); put("칠곡군", "37_19"); put("예천군", "37_20");
        put("봉화군", "37_21"); put("울진군", "37_22"); put("울릉군", "37_23");
        
        // 경상남도 (38)
        put("창원시", "38_1"); put("진주시", "38_2"); put("통영시", "38_3"); put("사천시", "38_4");
        put("김해시", "38_5"); put("밀양시", "38_6"); put("거제시", "38_7"); put("양산시", "38_8");
        put("의령군", "38_9"); put("함안군", "38_10"); put("창녕군", "38_11"); put("고성군", "38_12");
        put("남해군", "38_13"); put("하동군", "38_14"); put("산청군", "38_15"); put("함양군", "38_16");
        put("거창군", "38_17"); put("합천군", "38_18");
        
        // 제주도 (39)
        put("제주시", "39_1"); put("서귀포시", "39_2");
    }};

    private final RestTemplate restTemplate;
    
    // 생성자에서 UTF-8 인코딩 설정된 RestTemplate 초기화
    public AITravelServiceImpl() {
        this.restTemplate = new RestTemplate();
        // UTF-8 인코딩 명시적 설정
        this.restTemplate.getMessageConverters().forEach(converter -> {
            if (converter instanceof org.springframework.http.converter.StringHttpMessageConverter) {
                ((org.springframework.http.converter.StringHttpMessageConverter) converter).setDefaultCharset(java.nio.charset.StandardCharsets.UTF_8);
            }
        });
    }

    @Override
    public ChatResponse generateTravelRecommendation(ChatRequest request) {
        try {
            log.info("🎯 AI 여행 추천 시작: {}", request.getMessage());
            
            // 🔄 TourAPI 데이터 기반 재생성 요청인지 확인 (레거시 지원)
            if (request.getTourApiData() != null && !request.getTourApiData().isEmpty()) {
                log.info("🌐 레거시 TourAPI 데이터 기반 AI 응답 재생성: {}개 관광지", request.getTourApiData().size());
                return regenerateWithTourAPIData(request);
            }
            
            // 🚀 속도 개선: AI 분석 없이 직접 파싱으로 빠른 처리
            TravelAnalysis analysis = createFastAnalysis(request.getMessage());
            log.info("⚡ 빠른 분석 완료 - 타입: {}, 지역: {}, 기간: {}", 
                    analysis.getRequestType(), analysis.getRegion(), analysis.getDuration());

            // 🌐 2단계: 백엔드에서 모든 처리 완료
            ChatResponse response = generateInitialResponseWithAnalysis(request.getMessage(), analysis);
            
            log.info("✅ AI 여행 추천 완료");
            return response;

        } catch (Exception e) {
            log.error("AI 여행 추천 생성 중 오류 발생", e);
            throw new RuntimeException("AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", e);
        }
    }
    
    /**
     * 🎯 백엔드에서 TourAPI 데이터 수집 후 완성된 응답 생성
     */
    private ChatResponse generateInitialResponseWithAnalysis(String originalMessage, TravelAnalysis analysis) {
        try {
            log.info("🌐 백엔드에서 TourAPI 데이터 수집 시작");
            
            // 일반 대화인 경우 TourAPI 호출 없이 바로 응답
            if ("general_chat".equals(analysis.getRequestType())) {
                String basicResponse = generateBasicTravelResponse(originalMessage, analysis);
                
                ChatResponse response = new ChatResponse();
                response.setContent(basicResponse);
                response.setRequestType(analysis.getRequestType());
                response.setStreaming(false);
                response.setLocations(new ArrayList<>());
                response.setFestivals(new ArrayList<>());
                response.setTravelCourse(null);
                
                return response;
            }
            
            // TourAPI 데이터 수집
            List<TourAPIResponse.Item> tourAPIData = collectTourismDataSecurely(analysis);
            log.info("✅ TourAPI 데이터 수집 완료: {}개", tourAPIData.size());
            
            // TourAPI 데이터를 Map 형태로 변환
            List<Map<String, Object>> tourApiDataMaps = tourAPIData.stream()
                .map(this::convertToMap)
                .collect(Collectors.toList());
            
            // TourAPI 데이터로 완성된 AI 응답 생성
            ChatResponse response = generateResponseWithSecureTourAPIData(originalMessage, analysis, tourAPIData);
            
            log.info("🎯 백엔드에서 완성된 응답 생성 완료 - 지역: {}, 타입: {}", analysis.getRegion(), analysis.getRequestType());
            return response;
            
        } catch (Exception e) {
            log.error("백엔드 응답 생성 실패", e);
            throw new RuntimeException("백엔드 응답 생성 중 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 🌐 백엔드에서 안전하게 TourAPI 데이터 수집
     */
    private List<TourAPIResponse.Item> collectTourismDataSecurely(TravelAnalysis analysis) {
        List<TourAPIResponse.Item> allItems = new ArrayList<>();
        
        String areaCode = analysis.getAreaCode() != null ? analysis.getAreaCode() : "1";
        String sigunguCode = analysis.getSigunguCode();
        String keyword = analysis.getKeyword();
        String requestType = analysis.getRequestType();
        
        log.info("🌐 백엔드 TourAPI 호출 시작 - 지역코드: {}, 시군구코드: {}, 키워드: {}", 
                areaCode, sigunguCode != null ? sigunguCode : "없음", keyword);
        
        try {
            // 키워드가 있으면 키워드 검색 우선
            if (keyword != null && !keyword.isEmpty()) {
                List<TourAPIResponse.Item> keywordResults = searchTourismByKeyword(keyword, areaCode, sigunguCode);
                allItems.addAll(keywordResults);
                log.info("🔍 키워드 검색 결과: {}개", keywordResults.size());
            }
            
            // 축제 검색 (축제 요청이거나 키워드가 축제 관련인 경우)
            if (requestType.contains("festival") || 
                (keyword != null && (keyword.contains("축제") || keyword.contains("불꽃") || keyword.contains("벚꽃")))) {
                List<TourAPIResponse.Item> festivalResults = searchFestivals(areaCode, sigunguCode);
                addUniqueItems(allItems, festivalResults);
                log.info("🎪 축제 검색 결과: {}개", festivalResults.size());
            }
            
            // 일반 관광지 검색 (다양한 컨텐츠 타입)
            String[] contentTypes = {"25", "12", "14", "15", "39"}; // 여행코스, 관광지, 문화시설, 축제, 음식점
            for (String contentType : contentTypes) {
                List<TourAPIResponse.Item> items = fetchTourismDataSecurely(areaCode, sigunguCode, contentType);
                addUniqueItems(allItems, items);
                
                if (allItems.size() >= 30) break; // 충분한 데이터 수집 시 중단
            }
            
        } catch (Exception e) {
            log.error("TourAPI 데이터 수집 중 오류", e);
        }
        
        // 여행코스를 최우선으로 정렬
        allItems.sort((a, b) -> {
            boolean aIsCourse = "25".equals(a.getContentTypeId());
            boolean bIsCourse = "25".equals(b.getContentTypeId());
            if (aIsCourse && !bIsCourse) return -1;
            if (!aIsCourse && bIsCourse) return 1;
            return 0;
        });
        
        // 최대 20개로 제한
        if (allItems.size() > 20) {
            allItems = allItems.subList(0, 20);
        }
        
        log.info("✅ TourAPI 데이터 수집 완료: {}개 (여행코스 우선 정렬)", allItems.size());
        return allItems;
    }
    
    /**
     * 중복 제거하여 아이템 추가
     */
    private void addUniqueItems(List<TourAPIResponse.Item> existingItems, List<TourAPIResponse.Item> newItems) {
        for (TourAPIResponse.Item newItem : newItems) {
            boolean exists = existingItems.stream()
                .anyMatch(existing -> existing.getTitle().equals(newItem.getTitle()));
            if (!exists) {
                existingItems.add(newItem);
            }
        }
    }
    
    /**
     * 🤖 TourAPI 데이터로 AI 응답 생성
     */
    private ChatResponse generateResponseWithSecureTourAPIData(String originalMessage, TravelAnalysis analysis, List<TourAPIResponse.Item> tourAPIData) {
        try {
            // TourAPI 데이터를 Map 형태로 변환 (기존 재생성 로직 호환)
            List<Map<String, Object>> tourApiDataMaps = tourAPIData.stream()
                .map(this::convertToMap)
                .collect(Collectors.toList());
            
            // 🎯 요청 기간 정보 추출
            String duration = analysis.getDuration() != null ? analysis.getDuration() : "2박3일";
            int requiredPlaces = calculateRequiredPlaces(duration);
            int totalDays = getTotalDaysFromDuration(duration);
            
            // 기존 재생성 로직 활용
            ChatRequest tempRequest = new ChatRequest();
            tempRequest.setMessage(originalMessage);
            tempRequest.setTourApiData(tourApiDataMaps);
            tempRequest.setStrictMode(true); // 엄격 모드로 실제 데이터만 사용
            
            // 🎯 직접 응답 생성 (regenerateWithTourAPIData 로직 사용하지 않고)
            ChatResponse response = new ChatResponse();
            
            // AI 응답 생성
            String keyword = extractKeywordFromRequest(originalMessage);
            List<Map<String, Object>> travelCourses = tourApiDataMaps.stream()
                .filter(spot -> "25".equals(String.valueOf(spot.get("contenttypeid"))))
                .collect(Collectors.toList());
            List<Map<String, Object>> otherSpots = tourApiDataMaps.stream()
                .filter(spot -> !"25".equals(String.valueOf(spot.get("contenttypeid"))))
                .collect(Collectors.toList());
            
            String aiResponse = createTourAPIFirstRecommendation(travelCourses, otherSpots, originalMessage, keyword);
            
            response.setContent(aiResponse);
            response.setRequestType(analysis.getRequestType());
            response.setStreaming(false);
            
            // 🎯 요청 기간에 맞게 위치 정보 생성
            List<ChatResponse.LocationInfo> locations = createLocationsFromTourAPIDataWithLimit(
                    tourApiDataMaps, requiredPlaces, totalDays);
            response.setLocations(locations);
            
            // 축제 정보 생성
            List<ChatResponse.FestivalInfo> festivals = createFestivalInfoFromTourAPI(tourApiDataMaps);
            response.setFestivals(festivals);
            
            // 여행 코스 정보 생성
            ChatResponse.TravelCourse travelCourse = createTravelCourseFromTourAPI(locations, tourApiDataMaps);
            response.setTravelCourse(travelCourse);
            
            log.info("🎯 직접 생성된 응답 - 위치: {}개, 축제: {}개, 기간: {}", 
                    locations.size(), festivals.size(), duration);
            
            return response;
            
        } catch (Exception e) {
            log.error("TourAPI 데이터 기반 AI 응답 생성 실패", e);
            
            // 폴백: 기본 응답 생성
            ChatResponse response = new ChatResponse();
            response.setContent("죄송합니다. 현재 해당 지역의 관광정보를 불러오는데 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
            response.setRequestType(analysis.getRequestType());
            response.setStreaming(false);
            response.setLocations(new ArrayList<>());
            response.setFestivals(new ArrayList<>());
            
            return response;
        }
    }
    
    /**
     * TourAPI Item을 Map으로 변환
     */
    private Map<String, Object> convertToMap(TourAPIResponse.Item item) {
        Map<String, Object> map = new HashMap<>();
        map.put("title", item.getTitle());
        map.put("addr1", item.getAddr1());
        map.put("mapx", item.getMapX());
        map.put("mapy", item.getMapY());
        map.put("contenttypeid", item.getContentTypeId());
        map.put("firstimage", item.getFirstImage());
        map.put("tel", item.getTel());
        map.put("contentid", item.getContentId());
        return map;
    }
    
    /**
     * 🚀 속도 개선: AI 없이 빠른 직접 분석
     */
    private TravelAnalysis createFastAnalysis(String userMessage) {
        try {
            log.info("⚡ 빠른 분석 시작: {}", userMessage);
            
            // 요청 타입 판별
            String requestType = "travel_only";
            String lowerMessage = userMessage.toLowerCase();
            
            if (lowerMessage.contains("축제") && (lowerMessage.contains("여행") || lowerMessage.contains("코스"))) {
                requestType = "festival_with_travel";
            } else if (lowerMessage.contains("축제") || lowerMessage.contains("불꽃") || lowerMessage.contains("벚꽃")) {
                requestType = "festival_only";
            } else if (!lowerMessage.contains("여행") && !lowerMessage.contains("코스") && !lowerMessage.contains("추천")) {
                requestType = "general_chat";
            }
            
            // 지역 정보 추출
            RegionInfo regionInfo = extractRegionInfo(userMessage);
            
            // 여행 기간 추출 - 더 강화된 로직
            String duration = extractDurationFromMessageEnhanced(userMessage);
            
            // 키워드 추출
            String keyword = extractKeywordFromRequest(userMessage);
            
            TravelAnalysis analysis = new TravelAnalysis(
                requestType, 
                regionInfo.getRegionName(), 
                keyword, 
                duration, 
                "빠른 분석 완료"
            );
            
            analysis.setAreaCode(regionInfo.getAreaCode());
            analysis.setSigunguCode(regionInfo.getSigunguCode());
            
            log.info("⚡ 빠른 분석 완료 - 타입: {}, 지역: {}, 기간: {}, 키워드: {}", 
                    requestType, regionInfo.getRegionName(), duration, keyword);
            
            return analysis;
            
        } catch (Exception e) {
            log.error("빠른 분석 실패, 기본값 사용", e);
            return createDefaultAnalysis(userMessage);
        }
    }

    /**
     * 🧠 AI가 사용자 요청을 분석하여 여행 의도 파악 (레거시)
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
                "1. festival_only: 축제만 검색/추천\n" +
                "2. festival_with_travel: 축제 + 여행코스\n" +
                "3. travel_only: 일반 여행코스만\n" +
                "4. general_chat: 일반 대화\n\n" +
                "기간 인식 규칙:\n" +
                "- '당일치기', '당일' → 당일치기\n" +
                "- '1박2일', '1박 2일' → 1박2일\n" +
                "- '2박3일', '2박 3일' → 2박3일\n" +
                "- '3박4일', '3박 4일' → 3박4일\n" +
                "- '4박5일', '4박 5일' → 4박5일\n" +
                "- '5박6일', '5박 6일' → 5박6일\n" +
                "- '6박7일', '6박 7일' → 6박7일\n" +
                "- 숫자만 있는 경우: '2일' → 1박2일, '3일' → 2박3일, '4일' → 3박4일";
            
            String analysisResult = callOpenAI(analysisPrompt);
            log.info("📋 AI 분석 결과: {}", analysisResult);
            
            return parseAnalysisResult(analysisResult);
        } catch (Exception e) {
            log.error("AI 분석 실패, 기본값 사용", e);
            return createDefaultAnalysis(userMessage);
        }
    }
    
    /**
     * 기본 AI 여행 응답 생성
     */
    private String generateBasicTravelResponse(String originalMessage, TravelAnalysis analysis) {
        String requestType = analysis.getRequestType();
        
        // 일반 대화인 경우
        if ("general_chat".equals(requestType)) {
            String generalPrompt = "다음 사용자 질문에 친근하고 도움이 되는 답변을 해주세요:\n\n" +
                "사용자 질문: \"" + originalMessage + "\"\n\n" +
                "주의사항:\n" +
                "- 여행 코스를 제안하지 마세요\n" +
                "- @location이나 @day 같은 특수 태그를 사용하지 마세요\n" +
                "- 사용자의 실제 질문에 맞는 적절한 답변을 해주세요";
            
            return callOpenAI(generalPrompt);
        }
        
        // 여행 관련 요청
        String duration = analysis.getDuration() != null ? analysis.getDuration() : "당일치기";
        String region = analysis.getRegion() != null ? analysis.getRegion() : "서울";
        String keyword = analysis.getKeyword() != null ? analysis.getKeyword() : "여행";
        
        log.info("🎯 AI 응답 생성 준비 - 지역: {}, 기간: {}, 키워드: {}", region, duration, keyword);
        
        // 여행 기간에 맞는 일수와 추천 개수 계산
        int totalDays;
        int recommendCount;
        
        if ("당일치기".equals(duration)) {
            totalDays = 1;
            recommendCount = 3;
        } else if ("1박2일".equals(duration)) {
            totalDays = 2;
            recommendCount = 4;
        } else if ("2박3일".equals(duration)) {
            totalDays = 3;
            recommendCount = 6;
        } else if ("3박4일".equals(duration)) {
            totalDays = 4;
            recommendCount = 8;
        } else if ("4박5일".equals(duration)) {
            totalDays = 5;
            recommendCount = 10;
        } else if ("5박6일".equals(duration)) {
            totalDays = 6;
            recommendCount = 12;
        } else {
            // 기본값 또는 다른 형태의 기간 처리
            log.warn("⚠️ 인식되지 않은 기간: {}, 기본값 사용", duration);
            totalDays = 2;
            recommendCount = 4;
        }
        
        log.info("📊 여행 계획 설정 - 총 {}일, {}개 장소 추천", totalDays, recommendCount);
        
        // Day별 장소 개수 계산 (균등 분배 + 첫날 조금 더)
        int placesPerDay = recommendCount / totalDays;
        int extraPlaces = recommendCount % totalDays;
        
        // Day별 배치 계획 생성
        StringBuilder dayPlanBuilder = new StringBuilder();
        for (int day = 1; day <= totalDays; day++) {
            int placesForThisDay = placesPerDay + (day <= extraPlaces ? 1 : 0);
            dayPlanBuilder.append(String.format("   - Day %d: %d개 장소 필수\n", day, placesForThisDay));
        }
        
        String travelPrompt = String.format(
            "🎯 %s %s 여행코스 추천 (총 %d일간 %d개 장소)\n\n" +
            "사용자 요청: \"%s\"\n" +
            "목적지: %s\n" +
            "여행 기간: %s\n" +
            "테마: %s\n\n" +
            "🚨 **Day별 배치 필수 규칙**:\n" +
            "%s" +
            "\n" +
            "📋 **출력 형식 (정확히 준수)**:\n" +
            "장소명 @location:[위도,경도] @day:숫자\n" +
            "설명: 간단한 장소 설명\n\n" +
            "⚠️ **절대 금지사항**:\n" +
            "- 이모지, 특수기호, 마크다운 기호 사용 금지\n" +
            "- @day:1 없이 장소만 나열하는 것 금지\n" +
            "- 모든 장소가 Day 1에만 몰리는 것 절대 금지\n\n" +
            "✅ **필수 준수사항**:\n" +
            "1. 총 %d일 모든 날짜에 장소 배치 필수\n" +
            "2. Day 1: @day:1, Day 2: @day:2, Day 3: @day:3 등 구분 필수\n" +
            "3. 하루에 너무 많은 장소 배치 금지 (최대 3-4개)\n" +
            "4. 실제 존재하는 관광지 이름만 사용\n" +
            "5. 정확한 위도/경도 좌표 제공\n\n" +
            "🔥 **중요**: %d일 동안 총 %d개 장소를 Day별로 균등 분배하여 추천하세요!\n" +
            "Day 1에만 모든 장소를 배치하면 안 됩니다. 반드시 %d일 모두에 고르게 분배하세요.\n\n" +
            "지금 %s %s 여행코스를 위 규칙에 따라 생성해주세요:",
            region, duration, totalDays, recommendCount, originalMessage, region, duration, keyword,
            dayPlanBuilder.toString(),
            totalDays,
            totalDays, recommendCount, totalDays,
            region, duration
        );
        
        log.info("🤖 AI 프롬프트 전송 - 총 {}일, {}개 장소 요청", totalDays, recommendCount);
        
        return callOpenAI(travelPrompt);
    }
    
    /**
     * TravelAnalysis 내부 클래스
     */
    private static class TravelAnalysis {
        private String requestType;
        private String region;
        private String keyword;
        private String duration;
        private String intent;
        private String areaCode;
        private String sigunguCode;
        
        public TravelAnalysis(String requestType, String region, String keyword, String duration, String intent) {
            this.requestType = requestType;
            this.region = region;
            this.keyword = keyword;
            this.duration = duration;
            this.intent = intent;
        }
        
        public TravelAnalysis(String requestType, String region, String keyword, String duration, String intent, String areaCode, String sigunguCode) {
            this.requestType = requestType;
            this.region = region;
            this.keyword = keyword;
            this.duration = duration;
            this.intent = intent;
            this.areaCode = areaCode;
            this.sigunguCode = sigunguCode;
        }
        
        public String getRequestType() { return requestType; }
        public String getRegion() { return region; }
        public String getKeyword() { return keyword; }
        public String getDuration() { return duration; }
        public String getIntent() { return intent; }
        public String getAreaCode() { return areaCode; }
        public String getSigunguCode() { return sigunguCode; }
        
        public void setAreaCode(String areaCode) { this.areaCode = areaCode; }
        public void setSigunguCode(String sigunguCode) { this.sigunguCode = sigunguCode; }
    }
    
    /**
     * AI 분석 결과 파싱
     */
    private TravelAnalysis parseAnalysisResult(String analysisResult) {
        try {
            String requestType = extractValue(analysisResult, "요청타입");
            String region = extractValue(analysisResult, "지역");
            String keyword = extractValue(analysisResult, "키워드");
            String duration = extractValue(analysisResult, "기간");
            String intent = extractValue(analysisResult, "의도");
            
            TravelAnalysis analysis = new TravelAnalysis(
                requestType != null ? requestType : "travel_only",
                "NONE".equals(region) ? null : region,
                "NONE".equals(keyword) ? null : keyword,
                "NONE".equals(duration) ? null : duration,
                intent
            );
            
            // 지역 정보로부터 지역코드와 시군구코드 추출
            if (analysis.getRegion() != null) {
                RegionInfo regionInfo = extractRegionInfo(analysis.getRegion());
                analysis.setAreaCode(regionInfo.getAreaCode());
                analysis.setSigunguCode(regionInfo.getSigunguCode());
                log.info("🗺️ 분석된 지역 정보 - 지역: {}, 지역코드: {}, 시군구코드: {}", 
                        regionInfo.getRegionName(), regionInfo.getAreaCode(), 
                        regionInfo.getSigunguCode() != null ? regionInfo.getSigunguCode() : "없음");
            }
            
            return analysis;
        } catch (Exception e) {
            log.error("분석 결과 파싱 실패", e);
            return createDefaultAnalysis("");
        }
    }
    
    /**
     * 기본 분석 결과 생성
     */
    private TravelAnalysis createDefaultAnalysis(String userMessage) {
        String defaultType = "travel_only";
        if (userMessage.toLowerCase().contains("축제") || userMessage.toLowerCase().contains("불꽃")) {
            defaultType = "festival_only";
        }
        
        // 사용자 메시지에서 지역 정보 추출
        RegionInfo regionInfo = extractRegionInfo(userMessage);
        
        // 사용자 메시지에서 여행 기간 추출
        String duration = extractDurationFromMessage(userMessage);
        
        TravelAnalysis analysis = new TravelAnalysis(defaultType, regionInfo.getRegionName(), null, duration, "여행 추천 요청");
        analysis.setAreaCode(regionInfo.getAreaCode());
        analysis.setSigunguCode(regionInfo.getSigunguCode());
        
        log.info("🎯 기본 분석 - 지역: {}, 기간: {}, 지역코드: {}, 시군구코드: {}", 
                regionInfo.getRegionName(), duration, regionInfo.getAreaCode(), 
                regionInfo.getSigunguCode() != null ? regionInfo.getSigunguCode() : "없음");
        
        return analysis;
    }

    /**
     * 🚀 강화된 여행 기간 추출 - 더 정확한 인식
     */
    private String extractDurationFromMessageEnhanced(String message) {
        if (message == null) return "당일치기";
        
        String lowerMessage = message.toLowerCase().replaceAll("\\s+", "");
        log.info("🔍 기간 추출 분석: '{}'", lowerMessage);
        
        // 1. 명확한 박수일 패턴 매칭 (공백 제거된 상태)
        if (lowerMessage.contains("1박2일")) { log.info("✅ 1박2일 인식"); return "1박2일"; }
        if (lowerMessage.contains("2박3일")) { log.info("✅ 2박3일 인식"); return "2박3일"; }
        if (lowerMessage.contains("3박4일")) { log.info("✅ 3박4일 인식"); return "3박4일"; }
        if (lowerMessage.contains("4박5일")) { log.info("✅ 4박5일 인식"); return "4박5일"; }
        if (lowerMessage.contains("5박6일")) { log.info("✅ 5박6일 인식"); return "5박6일"; }
        if (lowerMessage.contains("6박7일")) { log.info("✅ 6박7일 인식"); return "6박7일"; }
        
        // 2. 공백이 있는 패턴도 확인
        String originalLower = message.toLowerCase();
        if (originalLower.contains("1박 2일")) { log.info("✅ 1박 2일 인식"); return "1박2일"; }
        if (originalLower.contains("2박 3일")) { log.info("✅ 2박 3일 인식"); return "2박3일"; }
        if (originalLower.contains("3박 4일")) { log.info("✅ 3박 4일 인식"); return "3박4일"; }
        if (originalLower.contains("4박 5일")) { log.info("✅ 4박 5일 인식"); return "4박5일"; }
        if (originalLower.contains("5박 6일")) { log.info("✅ 5박 6일 인식"); return "5박6일"; }
        if (originalLower.contains("6박 7일")) { log.info("✅ 6박 7일 인식"); return "6박7일"; }
        
        // 3. 정규식으로 박/일 패턴 찾기
        Pattern nightDayPattern = Pattern.compile("(\\d+)박\\s?(\\d+)일");
        Matcher nightDayMatcher = nightDayPattern.matcher(originalLower);
        if (nightDayMatcher.find()) {
            int nights = Integer.parseInt(nightDayMatcher.group(1));
            int days = Integer.parseInt(nightDayMatcher.group(2));
            String result = nights + "박" + days + "일";
            log.info("✅ 정규식으로 {}박{}일 인식 -> {}", nights, days, result);
            return result;
        }
        
        // 4. 일수만 있는 경우 (예: "3일 여행", "4일간", "3일코스")
        Pattern dayOnlyPattern = Pattern.compile("(\\d+)일");
        Matcher dayMatcher = dayOnlyPattern.matcher(lowerMessage);
        if (dayMatcher.find()) {
            int days = Integer.parseInt(dayMatcher.group(1));
            String result = switch (days) {
                case 1 -> "당일치기";
                case 2 -> "1박2일";
                case 3 -> "2박3일";
                case 4 -> "3박4일";
                case 5 -> "4박5일";
                case 6 -> "5박6일";
                case 7 -> "6박7일";
                default -> days > 7 ? "6박7일" : "2박3일";
            };
            log.info("✅ {}일 -> {} 변환", days, result);
            return result;
        }
        
        // 5. 당일치기 패턴
        if (lowerMessage.contains("당일") || lowerMessage.contains("하루") || lowerMessage.contains("데이")) {
            log.info("✅ 당일치기 인식");
            return "당일치기";
        }
        
        log.info("❌ 기간 인식 실패, 기본값 사용: 당일치기");
        return "당일치기"; // 기본값
    }

    /**
     * 사용자 메시지에서 여행 기간 추출 (레거시)
     */
    private String extractDurationFromMessage(String message) {
        if (message == null) return "당일치기";
        
        String lowerMessage = message.toLowerCase();
        
        // 박수일 패턴 매칭
        if (lowerMessage.contains("1박2일") || lowerMessage.contains("1박 2일")) return "1박2일";
        if (lowerMessage.contains("2박3일") || lowerMessage.contains("2박 3일")) return "2박3일";
        if (lowerMessage.contains("3박4일") || lowerMessage.contains("3박 4일")) return "3박4일";
        if (lowerMessage.contains("4박5일") || lowerMessage.contains("4박 5일")) return "4박5일";
        if (lowerMessage.contains("5박6일") || lowerMessage.contains("5박 6일")) return "5박6일";
        if (lowerMessage.contains("6박7일") || lowerMessage.contains("6박 7일")) return "6박7일";
        
        // 일수만 있는 경우 (예: "3일 여행", "4일간")
        Pattern dayPattern = Pattern.compile("(\\d+)일");
        Matcher matcher = dayPattern.matcher(lowerMessage);
        if (matcher.find()) {
            int days = Integer.parseInt(matcher.group(1));
            switch (days) {
                case 1: return "당일치기";
                case 2: return "1박2일";
                case 3: return "2박3일";
                case 4: return "3박4일";
                case 5: return "4박5일";
                case 6: return "5박6일";
                case 7: return "6박7일";
                default: return "2박3일";
            }
        }
        
        // 당일치기 패턴
        if (lowerMessage.contains("당일") || lowerMessage.contains("하루")) {
            return "당일치기";
        }
        
        return "당일치기"; // 기본값
    }
    
    /**
     * 분석 결과에서 특정 값 추출 (개선된 정규식)
     */
    private String extractValue(String text, String key) {
        try {
            // 개선된 정규식: 다음 키 또는 문장 끝까지 매칭
            Pattern pattern = Pattern.compile(key + ":\\s*([^\\n]+?)(?=\\s+[가-힣]+:|\\n|$)");
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String value = matcher.group(1).trim();
                // 마지막에 남은 불필요한 텍스트 제거
                value = value.replaceAll("\\s+(지역|키워드|기간|의도).*$", "").trim();
                return value.isEmpty() ? null : value;
            }
        } catch (Exception e) {
            log.debug("값 추출 실패: {} from {}", key, text);
        }
        return null;
    }
    
    /**
     * 지역명을 지역코드로 매핑
     */
    private String mapRegionToAreaCode(String region) {
        if (region == null) return "1"; // 기본값: 서울
        return AREA_CODE_MAP.getOrDefault(region, "1");
    }
    
    /**
     * 시군구명에서 지역코드와 시군구코드 추출
     */
    private RegionInfo extractRegionInfo(String userMessage) {
        if (userMessage == null) return new RegionInfo("1", null, "서울");
        
        // 시군구 매핑에서 찾기
        for (String sigunguName : SIGUNGU_CODE_MAP.keySet()) {
            if (userMessage.contains(sigunguName)) {
                String code = SIGUNGU_CODE_MAP.get(sigunguName);
                String[] parts = code.split("_");
                String areaCode = parts[0];
                String sigunguCode = parts[1];
                
                // 지역명 찾기
                String regionName = findRegionNameByAreaCode(areaCode);
                
                log.info("🏘️ 시군구 감지: {} -> 지역코드: {}, 시군구코드: {}", sigunguName, areaCode, sigunguCode);
                return new RegionInfo(areaCode, sigunguCode, regionName + " " + sigunguName);
            }
        }
        
        // 시군구가 없으면 광역시/도에서 찾기
        for (String regionName : AREA_CODE_MAP.keySet()) {
            if (userMessage.contains(regionName)) {
                String areaCode = AREA_CODE_MAP.get(regionName);
                log.info("🗺️ 광역시/도 감지: {} -> 지역코드: {}", regionName, areaCode);
                return new RegionInfo(areaCode, null, regionName);
            }
        }
        
        return new RegionInfo("1", null, "서울"); // 기본값
    }
    
    /**
     * 지역코드로 지역명 찾기
     */
    private String findRegionNameByAreaCode(String areaCode) {
        for (Map.Entry<String, String> entry : AREA_CODE_MAP.entrySet()) {
            if (entry.getValue().equals(areaCode)) {
                return entry.getKey();
            }
        }
        return "서울";
    }
    
    /**
     * 지역 정보 클래스
     */
    private static class RegionInfo {
        private String areaCode;
        private String sigunguCode;
        private String regionName;
        
        public RegionInfo(String areaCode, String sigunguCode, String regionName) {
            this.areaCode = areaCode;
            this.sigunguCode = sigunguCode;
            this.regionName = regionName;
        }
        
        public String getAreaCode() { return areaCode; }
        public String getSigunguCode() { return sigunguCode; }
        public String getRegionName() { return regionName; }
        public boolean hasSigunguCode() { return sigunguCode != null; }
    }
    
    /**
     * AI 응답에서 위치 정보 추출
     */
    private List<ChatResponse.LocationInfo> extractLocationsFromAIResponse(String content, TravelAnalysis analysis) {
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        try {
            Pattern locationPattern = Pattern.compile("@location:\\[([0-9.\\-]+),([0-9.\\-]+)\\]\\s*@day:(\\d+)");
            Matcher matcher = locationPattern.matcher(content);
            
            while (matcher.find()) {
                double latitude = Double.parseDouble(matcher.group(1));
                double longitude = Double.parseDouble(matcher.group(2));
                int day = Integer.parseInt(matcher.group(3));
                
                String placeName = extractPlaceNameFromContext(content, matcher.start());
                String time = extractTimeFromContext(content, matcher.start());
                
                ChatResponse.LocationInfo location = new ChatResponse.LocationInfo();
                location.setName(placeName);
                location.setLatitude(latitude);
                location.setLongitude(longitude);
                location.setDay(day);
                // time 필드는 LocationInfo에 없으므로 description에 시간 정보 포함
                location.setDescription("AI 추천 관광지 (" + time + ")");
                
                locations.add(location);
                log.info("📍 위치 추출: {} ({}, {}) Day {}", placeName, latitude, longitude, day);
            }
            
        } catch (Exception e) {
            log.error("위치 정보 추출 실패", e);
        }
        
        return locations;
    }
    
    /**
     * 문맥에서 장소명 추출 (개선된 버전)
     */
    private String extractPlaceNameFromContext(String content, int locationIndex) {
        try {
            String[] lines = content.split("\n");
            String targetLine = null;
            
            // @location이 포함된 라인 찾기
            for (String line : lines) {
                if (line.contains("@location") && content.indexOf(line) <= locationIndex) {
                    targetLine = line;
                    break;
                }
            }
            
            if (targetLine != null) {
                String placeName = extractPlaceNameFromLine(targetLine);
                if (isValidPlaceName(placeName)) {
                    return placeName;
                }
            }
            
            // 이전 라인들에서 장소명 찾기 (백업 전략)
            String[] allLines = content.split("\n");
            for (int i = 0; i < allLines.length; i++) {
                String line = allLines[i];
                if (line.contains("@location") && content.indexOf(line) <= locationIndex) {
                    // 현재 라인의 이전 라인들 검사
                    for (int j = Math.max(0, i-2); j <= i; j++) {
                        String checkLine = allLines[j];
                        String placeName = extractPlaceNameFromLine(checkLine);
                        if (isValidPlaceName(placeName)) {
                            return placeName;
                        }
                    }
                }
            }
            
        } catch (Exception e) {
            log.debug("장소명 추출 실패", e);
        }
        
        // 추출에 실패한 경우 더 구체적인 기본값 제공
        return "여행지";
    }
    
    /**
     * 라인에서 장소명을 추출하는 헬퍼 메서드
     */
    private String extractPlaceNameFromLine(String line) {
        if (line == null || line.trim().isEmpty()) {
            return null;
        }
        
        // 1. **로 둘러싸인 장소명 찾기
        Pattern boldPattern = Pattern.compile("\\*\\*([^*]+)\\*\\*");
        Matcher boldMatcher = boldPattern.matcher(line);
        if (boldMatcher.find()) {
            String placeName = boldMatcher.group(1).trim();
            if (isValidPlaceName(placeName)) {
                return placeName;
            }
        }
        
        // 2. 번호. 형태로 시작하는 장소명 찾기
        Pattern numberPattern = Pattern.compile("^\\s*\\d+\\.\\s*([^@-]+)");
        Matcher numberMatcher = numberPattern.matcher(line);
        if (numberMatcher.find()) {
            String placeName = numberMatcher.group(1).trim()
                                  .replaceAll("\\*\\*", "")  // ** 제거
                                  .replaceAll("\\s*-.*", ""); // - 이후 내용 제거
            if (isValidPlaceName(placeName)) {
                return placeName;
            }
        }
        
        // 3. @location 앞의 텍스트에서 장소명 추출
        if (line.contains("@location")) {
            String beforeLocation = line.substring(0, line.indexOf("@location")).trim();
            String placeName = beforeLocation.replaceAll("^\\d+\\.\\s*", "")
                                           .replaceAll("\\*\\*", "")
                                           .replaceAll("\\s*-.*", "")
                                           .replaceAll("[^가-힣a-zA-Z0-9\\s]", "")
                                           .trim();
            if (isValidPlaceName(placeName)) {
                return placeName;
            }
        }
        
        return null;
    }
    
    /**
     * 유효한 장소명인지 검사
     */
    private boolean isValidPlaceName(String placeName) {
        if (placeName == null || placeName.trim().isEmpty()) {
            return false;
        }
        
        placeName = placeName.trim();
        
        // 너무 짧은 이름 제외
        if (placeName.length() < 2) {
            return false;
        }
        
        // 너무 긴 이름 제외 (설명이 포함된 경우)
        if (placeName.length() > 30) {
            return false;
        }
        
        // 의미없는 일반적인 표현들 제외
        String[] invalidNames = {
            "관광지", "여행지", "추천관광지", "day별 추천관광지", 
            "Day별 추천관광지", "추천여행지", "여행코스", "관광코스",
            "첫 번째", "두 번째", "세 번째", "장소", "목적지",
            "관광명소", "여행명소", "추천장소", "방문지"
        };
        
        for (String invalid : invalidNames) {
            if (placeName.equalsIgnoreCase(invalid) || placeName.contains(invalid)) {
                return false;
            }
        }
        
        // 숫자만 있는 경우 제외
        if (placeName.matches("^\\d+$")) {
            return false;
        }
        
        // 특수문자만 있는 경우 제외
        if (placeName.matches("^[^가-힣a-zA-Z0-9]+$")) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 문맥에서 시간 정보 추출
     */
    private String extractTimeFromContext(String content, int locationIndex) {
        try {
            String[] lines = content.split("\n");
            for (String line : lines) {
                if (line.contains("@location") && content.indexOf(line) <= locationIndex) {
                    Pattern timePattern = Pattern.compile("(\\d{1,2}:\\d{2}|오전|오후|아침|점심|저녁)");
                    Matcher matcher = timePattern.matcher(line);
                    if (matcher.find()) {
                        return matcher.group(1);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("시간 추출 실패", e);
        }
        return "09:00";
    }
    
    /**
     * 여행 코스 생성
     */
    private ChatResponse.TravelCourse createTravelCourseFromLocations(List<ChatResponse.LocationInfo> locations, TravelAnalysis analysis) {
        ChatResponse.TravelCourse travelCourse = new ChatResponse.TravelCourse();
        
        if (locations.isEmpty()) {
            log.warn("위치 정보가 없어 기본 여행 코스 생성");
            String region = analysis.getRegion() != null ? analysis.getRegion() : "서울";
            String duration = analysis.getDuration() != null ? analysis.getDuration() : "당일치기";
            travelCourse.setCourseTitle(region + " " + duration + " 여행코스");
            // TravelCourse에 description, duration 필드가 없으므로 제거
            return travelCourse;
        }
        
        String region = analysis.getRegion() != null ? analysis.getRegion() : "서울";
        String duration = analysis.getDuration() != null ? analysis.getDuration() : "당일치기";
        
        travelCourse.setCourseTitle(region + " " + duration + " 여행코스");
        // TravelCourse에 description, duration 필드가 없으므로 제거
        
        return travelCourse;
    }
    
    /**
     * OpenAI API 호출 (이모지 제거 포함)
     */
    private String callOpenAI(String prompt) {
        try {
            String apiUrl = "https://api.openai.com/v1/chat/completions";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + openAiApiKey);
            headers.set("Content-Type", "application/json; charset=UTF-8");
            headers.set("Accept-Charset", "UTF-8");
            
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o-mini");
            requestBody.put("messages", List.of(message));
            requestBody.put("max_tokens", 3000);
            requestBody.put("temperature", 0.7);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);
            
            if (response.getBody() != null && response.getBody().containsKey("choices")) {
                List<Map> choices = (List<Map>) response.getBody().get("choices");
                if (!choices.isEmpty()) {
                    Map choice = choices.get(0);
                    Map message_response = (Map) choice.get("message");
                    String content = (String) message_response.get("content");
                    
                    // 이모지 제거
                    return removeEmojis(content);
                }
            }
            
            throw new RuntimeException("OpenAI API 응답이 올바르지 않습니다.");
            
        } catch (Exception e) {
            log.error("OpenAI API 호출 실패", e);
            throw new RuntimeException("AI 서비스 호출 중 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 텍스트에서 이모지 및 특수기호 완전 제거
     */
    private String removeEmojis(String text) {
        if (text == null) return null;
        
        // 이모지 및 특수기호 완전 제거
        String cleaned = text
            // 기본 이모지 제거 (유니코드 범위별)
            .replaceAll("[\\p{So}\\p{Cn}]", "")
            .replaceAll("[\u2600-\u27BF]", "")      // Miscellaneous Symbols
            .replaceAll("[\uD83C\uDF00-\uD83D\uDDFF]", "")  // Emoticons  
            .replaceAll("[\uD83D\uDE00-\uD83D\uDE4F]", "")  // Emoticons
            .replaceAll("[\uD83D\uDE80-\uD83D\uDEFF]", "")  // Transport and Map
            .replaceAll("[\uD83E\uDD00-\uD83E\uDDFF]", "")  // Supplemental Symbols
            .replaceAll("[\u2190-\u21FF]", "")      // Arrows
            .replaceAll("[\u2700-\u27BF]", "")      // Dingbats
            .replaceAll("[\uFE00-\uFE0F]", "")      // Variation Selectors
            .replaceAll("[\u200D]", "")             // Zero Width Joiner
            
            // 자주 사용되는 이모지들 직접 제거
            .replace("🎯", "").replace("🗺️", "").replace("📝", "")
            .replace("⏰", "").replace("🎨", "").replace("📋", "")
            .replace("📍", "").replace("🏛️", "").replace("🔒", "")
            .replace("⚠️", "").replace("🚨", "").replace("✅", "")
            .replace("❌", "").replace("🤖", "").replace("🌐", "")
            .replace("🎭", "").replace("🔄", "").replace("💡", "")
            .replace("📊", "").replace("🎪", "").replace("🌟", "")
            .replace("💫", "").replace("⭐", "").replace("🎨", "")
            .replace("🏷️", "").replace("📌", "").replace("🔍", "")
            .replace("✨", "").replace("🌈", "").replace("🎉", "")
            .replace("🎊", "").replace("🎈", "").replace("🎁", "")
            .replace("🎀", "").replace("🌸", "").replace("🌺", "")
            .replace("🌻", "").replace("🌼", "").replace("🌷", "")
            .replace("💐", "").replace("🌿", "").replace("🍀", "")
            .replace("🌱", "").replace("🌳", "").replace("🌲", "")
            .replace("🏔️", "").replace("🗻", "").replace("🏞️", "")
            .replace("🏜️", "").replace("🏖️", "").replace("🏝️", "")
            .replace("🌊", "").replace("🌋", "").replace("⛰️", "")
            
            // 화살표 및 기타 특수 기호 제거
            .replace("→", "").replace("←", "").replace("↑", "").replace("↓", "")
            .replace("▶", "").replace("◀", "").replace("▲", "").replace("▼", "")
            .replace("●", "").replace("○", "").replace("■", "").replace("□", "")
            .replace("◆", "").replace("◇", "").replace("★", "").replace("☆", "")
            .replace("♥", "").replace("♡", "").replace("♠", "").replace("♣", "")
            .replace("♦", "").replace("♧", "").replace("※", "").replace("◎", "")
            .replace("◈", "").replace("▣", "").replace("◐", "").replace("◑", "")
            .replace("▒", "").replace("▓", "").replace("░", "").replace("▬", "")
            
            // 마크다운 스타일 기호 제거
            .replace("**", "").replace("*", "").replace("###", "").replace("##", "").replace("#", "")
            .replace("---", "").replace("___", "").replace("```", "").replace("`", "")
            
            // 괄호 안의 특수문자들 제거
            .replaceAll("\\[[^\\]]*\\]", "")  // [내용] 형태 제거
            .replaceAll("\\([^\\)]*특구[^\\)]*\\)", "") // (특구 관련) 제거
            
            // 여러 공백을 하나로 정리하고 앞뒤 공백 제거
            .replaceAll("\\s+", " ")
            .trim();
            
        // 빈 줄이 연속으로 나오는 것 방지
        cleaned = cleaned.replaceAll("\\n\\s*\\n", "\n");
        
        return cleaned;
    }
    
    @Override
    public ChatResponse.LocationInfo extractLocationInfo(String content) {
        List<ChatResponse.LocationInfo> locations = extractLocationsFromAIResponse(content, createDefaultAnalysis(""));
        return locations.isEmpty() ? null : locations.get(0);
    }
    
    /**
     * 🌐 백엔드에서 안전한 TourAPI 호출 (서비스키 보호)
     */
    private List<TourAPIResponse.Item> fetchTourismDataSecurely(String areaCode, String sigunguCode, String contentTypeId) {
        try {
            String baseUrl = "https://apis.data.go.kr/B551011/KorService2/areaBasedList2";
            
            // UriComponentsBuilder로 기본 파라미터 구성 (서비스키 제외)
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive") // 정상 버전
                .queryParam("_type", "json") // JSON 응답 요청
                .queryParam("arrange", "O")
                .queryParam("contentTypeId", contentTypeId)
                .queryParam("areaCode", areaCode);
            
            // 시군구 코드가 있으면 추가
            if (sigunguCode != null && !sigunguCode.isEmpty()) {
                builder.queryParam("sigunguCode", sigunguCode);
                log.info("🏘️ 시군구 코드 적용: {}", sigunguCode);
            }
            
            // 서비스키를 직접 추가 (이중 인코딩 방지)
            String urlWithoutServiceKey = builder.toUriString();
            String finalUrl = urlWithoutServiceKey + "&serviceKey=" + tourApiServiceKey;
            
            log.info("🌐 TourAPI 요청: 컨텐츠타입={}, 지역코드={}, 시군구코드={}", 
                    contentTypeId, areaCode, sigunguCode != null ? sigunguCode : "없음");
            log.info("📡 TourAPI 요청 URL: {}", finalUrl);
            
            // URI.create로 추가 인코딩 방지
            ResponseEntity<String> response = restTemplate.getForEntity(java.net.URI.create(finalUrl), String.class);
            
            log.info("📥 TourAPI 응답 상태: {}", response.getStatusCode());
            if (response.getBody() != null) {
                log.info("📄 TourAPI 응답 데이터 (처음 500자): {}", 
                    response.getBody().length() > 500 ? response.getBody().substring(0, 500) + "..." : response.getBody());
            }
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<TourAPIResponse.Item> items = parseTourAPIResponse(response.getBody());
                log.info("✅ TourAPI 성공: {}개 데이터 수집", items.size());
                return items;
            } else {
                log.warn("⚠️ TourAPI 응답 오류: {}", response.getStatusCode());
                return new ArrayList<>();
            }
            
        } catch (Exception e) {
            log.error("❌ TourAPI 호출 실패: 컨텐츠타입={}, 지역코드={}", contentTypeId, areaCode, e);
            return new ArrayList<>();
        }
    }
    
    /**
     * 🔍 키워드 검색 TourAPI 호출
     */
    private List<TourAPIResponse.Item> searchTourismByKeyword(String keyword, String areaCode, String sigunguCode) {
        try {
            String baseUrl = "https://apis.data.go.kr/B551011/KorService2/searchKeyword2";
            
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("_type", "json") // JSON 응답 요청
                .queryParam("arrange", "O")
                .queryParam("keyword", keyword)
                .queryParam("areaCode", areaCode);
            
            if (sigunguCode != null && !sigunguCode.isEmpty()) {
                builder.queryParam("sigunguCode", sigunguCode);
            }
            
            String urlWithoutServiceKey = builder.toUriString();
            String finalUrl = urlWithoutServiceKey + "&serviceKey=" + tourApiServiceKey;
            
            log.info("🔍 키워드 검색: '{}', 지역코드={}, 시군구코드={}", 
                    keyword, areaCode, sigunguCode != null ? sigunguCode : "없음");
            log.info("📡 키워드 검색 URL: {}", finalUrl);
            
            ResponseEntity<String> response = restTemplate.getForEntity(java.net.URI.create(finalUrl), String.class);
            
            log.info("📥 키워드 검색 응답 상태: {}", response.getStatusCode());
            if (response.getBody() != null) {
                log.info("📄 키워드 검색 응답 데이터 (처음 500자): {}", 
                    response.getBody().length() > 500 ? response.getBody().substring(0, 500) + "..." : response.getBody());
            }
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<TourAPIResponse.Item> items = parseTourAPIResponse(response.getBody());
                log.info("✅ 키워드 검색 성공: {}개 데이터", items.size());
                return items;
            }
            
        } catch (Exception e) {
            log.error("❌ 키워드 검색 실패: keyword={}", keyword, e);
        }
        return new ArrayList<>();
    }
    
    /**
     * 🎪 축제 검색 TourAPI 호출
     */
    private List<TourAPIResponse.Item> searchFestivals(String areaCode, String sigunguCode) {
        try {
            String baseUrl = "https://apis.data.go.kr/B551011/KorService2/searchFestival2";
            
            // 현재 날짜부터 검색
            String today = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
            
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("_type", "json") // JSON 응답 요청
                .queryParam("eventStartDate", today)
                .queryParam("areaCode", areaCode);
            
            if (sigunguCode != null && !sigunguCode.isEmpty()) {
                builder.queryParam("sigunguCode", sigunguCode);
            }
            
            String urlWithoutServiceKey = builder.toUriString();
            String finalUrl = urlWithoutServiceKey + "&serviceKey=" + tourApiServiceKey;
            
            log.info("🎪 축제 검색: 지역코드={}, 시군구코드={}, 시작일={}", 
                    areaCode, sigunguCode != null ? sigunguCode : "없음", today);
            log.info("📡 축제 검색 URL: {}", finalUrl);
            
            ResponseEntity<String> response = restTemplate.getForEntity(java.net.URI.create(finalUrl), String.class);
            
            log.info("📥 축제 검색 응답 상태: {}", response.getStatusCode());
            if (response.getBody() != null) {
                log.info("📄 축제 검색 응답 데이터 (처음 500자): {}", 
                    response.getBody().length() > 500 ? response.getBody().substring(0, 500) + "..." : response.getBody());
            }
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<TourAPIResponse.Item> items = parseTourAPIResponse(response.getBody());
                log.info("✅축제 검색 성공: {}개 데이터", items.size());
                return items;
            }
            
        } catch (Exception e) {
            log.error("❌ 축제 검색 실패: areaCode={}", areaCode, e);
        }
        return new ArrayList<>();
    }
    
    /**
     * TourAPI JSON/XML 응답 파싱
     */
    private List<TourAPIResponse.Item> parseTourAPIResponse(String response) {
        List<TourAPIResponse.Item> items = new ArrayList<>();
        
        try {
            // 응답이 XML인지 JSON인지 확인
            if (response.trim().startsWith("<")) {
                log.info("🔍 XML 응답 감지, XML 파싱 시작");
                items = parseXMLResponse(response);
                log.info("📋 XML 파싱 완료: {}개 아이템", items.size());
            } else {
                log.info("🔍 JSON 응답 감지, JSON 파싱 시작");
                items = parseJSONResponse(response);
                log.info("📋 JSON 파싱 완료: {}개 아이템", items.size());
            }
            
        } catch (Exception e) {
            log.error("❌ 응답 파싱 실패", e);
        }
        
        return items;
    }
    
    /**
     * JSON 응답 파싱
     */
    private List<TourAPIResponse.Item> parseJSONResponse(String jsonResponse) {
        List<TourAPIResponse.Item> items = new ArrayList<>();
        
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(jsonResponse);
            
            JsonNode itemsNode = root.path("response").path("body").path("items").path("item");
            
            if (itemsNode.isArray()) {
                for (JsonNode itemNode : itemsNode) {
                    TourAPIResponse.Item item = parseItemJson(itemNode);
                    if (item != null) {
                        items.add(item);
                    }
                }
            }
            
        } catch (Exception e) {
            log.error("❌ JSON 파싱 실패", e);
        }
        
        return items;
    }
    
    /**
     * XML 응답 파싱
     */
    private List<TourAPIResponse.Item> parseXMLResponse(String xmlResponse) {
        List<TourAPIResponse.Item> items = new ArrayList<>();
        
        try {
            // XML에서 <item> 태그들을 찾아서 파싱
            String[] itemBlocks = xmlResponse.split("<item>");
            
            for (int i = 1; i < itemBlocks.length; i++) { // 첫 번째는 헤더 부분이므로 건너뜀
                String itemBlock = itemBlocks[i];
                if (itemBlock.contains("</item>")) {
                    itemBlock = itemBlock.substring(0, itemBlock.indexOf("</item>"));
                    TourAPIResponse.Item item = parseXMLItem(itemBlock);
                    if (item != null) {
                        items.add(item);
                    }
                }
            }
            
        } catch (Exception e) {
            log.error("❌ XML 파싱 실패", e);
        }
        
        return items;
    }
    
    /**
     * 개별 XML 아이템 파싱
     */
    private TourAPIResponse.Item parseXMLItem(String xmlItem) {
        try {
            TourAPIResponse.Item item = new TourAPIResponse.Item();
            
            item.setTitle(extractXMLValue(xmlItem, "title"));
            item.setAddr1(extractXMLValue(xmlItem, "addr1"));
            item.setMapX(extractXMLValue(xmlItem, "mapx"));
            item.setMapY(extractXMLValue(xmlItem, "mapy"));
            item.setContentTypeId(extractXMLValue(xmlItem, "contenttypeid"));
            item.setFirstImage(extractXMLValue(xmlItem, "firstimage"));
            item.setTel(extractXMLValue(xmlItem, "tel"));
            item.setContentId(extractXMLValue(xmlItem, "contentid"));
            
            // 필수 정보가 있는지 확인
            if (item.getTitle() != null && item.getMapX() != null && item.getMapY() != null) {
                return item;
            }
            
        } catch (Exception e) {
            log.debug("XML 아이템 파싱 실패", e);
        }
        return null;
    }
    
    /**
     * XML에서 특정 태그 값 추출
     */
    private String extractXMLValue(String xml, String tagName) {
        try {
            String startTag = "<" + tagName + ">";
            String endTag = "</" + tagName + ">";
            
            int startIndex = xml.indexOf(startTag);
            if (startIndex == -1) return null;
            
            startIndex += startTag.length();
            int endIndex = xml.indexOf(endTag, startIndex);
            if (endIndex == -1) return null;
            
            String value = xml.substring(startIndex, endIndex).trim();
            return value.isEmpty() ? null : value;
            
        } catch (Exception e) {
            log.debug("XML 값 추출 실패: {}", tagName, e);
            return null;
        }
    }
    
    /**
     * 개별 아이템 JSON 파싱
     */
    private TourAPIResponse.Item parseItemJson(JsonNode itemNode) {
        try {
            TourAPIResponse.Item item = new TourAPIResponse.Item();
            
            item.setTitle(getJsonValue(itemNode, "title"));
            item.setAddr1(getJsonValue(itemNode, "addr1"));
            item.setMapX(getJsonValue(itemNode, "mapx"));
            item.setMapY(getJsonValue(itemNode, "mapy"));
            item.setContentTypeId(getJsonValue(itemNode, "contenttypeid"));
            item.setFirstImage(getJsonValue(itemNode, "firstimage"));
            item.setTel(getJsonValue(itemNode, "tel"));
            item.setContentId(getJsonValue(itemNode, "contentid"));
            
            // 필수 정보가 있는지 확인
            if (item.getTitle() != null && item.getMapX() != null && item.getMapY() != null) {
                return item;
            }
            
        } catch (Exception e) {
            log.debug("아이템 파싱 실패", e);
        }
        return null;
    }
    
    /**
     * JSON에서 특정 필드 값 추출
     */
    private String getJsonValue(JsonNode node, String fieldName) {
        try {
            JsonNode fieldNode = node.path(fieldName);
            if (!fieldNode.isMissingNode() && !fieldNode.isNull()) {
                String value = fieldNode.asText().trim();
                return value.isEmpty() ? null : value;
            }
        } catch (Exception e) {
            log.debug("JSON 값 추출 실패: {}", fieldName, e);
        }
        return null;
    }
    
    /**
     * TourAPI 응답 아이템 클래스
     */
    public static class TourAPIResponse {
        public static class Item {
            private String title;
            private String addr1;
            private String mapX;
            private String mapY;
            private String contentTypeId;
            private String firstImage;
            private String tel;
            private String contentId;
            
            // Getters and Setters
            public String getTitle() { return title; }
            public void setTitle(String title) { this.title = title; }
            
            public String getAddr1() { return addr1; }
            public void setAddr1(String addr1) { this.addr1 = addr1; }
            
            public String getMapX() { return mapX; }
            public void setMapX(String mapX) { this.mapX = mapX; }
            
            public String getMapY() { return mapY; }
            public void setMapY(String mapY) { this.mapY = mapY; }
            
            public String getContentTypeId() { return contentTypeId; }
            public void setContentTypeId(String contentTypeId) { this.contentTypeId = contentTypeId; }
            
            public String getFirstImage() { return firstImage; }
            public void setFirstImage(String firstImage) { this.firstImage = firstImage; }
            
            public String getTel() { return tel; }
            public void setTel(String tel) { this.tel = tel; }
            
            public String getContentId() { return contentId; }
            public void setContentId(String contentId) { this.contentId = contentId; }
        }
    }
    
    /**
     * 🔄 프론트엔드 TourAPI 데이터로 AI 응답 재생성 (엄격 모드 지원)
     */
    private ChatResponse regenerateWithTourAPIData(ChatRequest request) {
        try {
            log.info("🌐 TourAPI 데이터 기반 재생성 시작");
            
            List<Map<String, Object>> tourApiData = request.getTourApiData();
            String originalMessage = request.getMessage();
            
            // 여행코스 데이터와 일반 관광지 데이터 분리
            List<Map<String, Object>> travelCourses = tourApiData.stream()
                .filter(spot -> "25".equals(String.valueOf(spot.get("contenttypeid"))))
                .collect(Collectors.toList());
            
            List<Map<String, Object>> otherSpots = tourApiData.stream()
                .filter(spot -> !"25".equals(String.valueOf(spot.get("contenttypeid"))))
                .collect(Collectors.toList());
            
            log.info("📊 데이터 분류 - 여행코스: {}개, 기타 관광지: {}개", travelCourses.size(), otherSpots.size());
            
            // 키워드 추출
            String keyword = extractKeywordFromRequest(originalMessage);
            
            // 🎯 요청 기간 추출
            String duration = extractDurationFromMessageEnhanced(originalMessage);
            int requiredPlaces = calculateRequiredPlaces(duration);
            int totalDays = getTotalDaysFromDuration(duration);
            
            // ✅ TourAPI 우선 + AI 보완 방식으로 AI 응답 생성
            String aiResponse = createTourAPIFirstRecommendation(travelCourses, otherSpots, originalMessage, keyword);
            log.info("✅ TourAPI 우선 AI 응답 생성 완료");
            
            // 최종 응답 구성
            ChatResponse response = new ChatResponse();
            response.setContent(aiResponse);
            response.setRequestType(determineRequestType(originalMessage));
            response.setStreaming(false);
            
            // 🎯 요청 기간에 맞게 위치 정보 생성 (제한된 개수)
            List<ChatResponse.LocationInfo> locations = createLocationsFromTourAPIDataWithLimit(
                    tourApiData, requiredPlaces, totalDays);
            response.setLocations(locations);
            
            // 축제 정보 생성
            List<ChatResponse.FestivalInfo> festivals = createFestivalInfoFromTourAPI(tourApiData);
            response.setFestivals(festivals);
            
            // 여행 코스 정보 생성
            ChatResponse.TravelCourse travelCourse = createTravelCourseFromTourAPI(locations, tourApiData);
            response.setTravelCourse(travelCourse);
            
            log.info("📍 생성된 데이터 - 위치: {}개, 축제: {}개, 여행코스: {}, 요청기간: {}", 
                    locations.size(), festivals.size(), travelCourse != null ? "생성" : "없음", duration);
            
            log.info("🎯 TourAPI 기반 응답 재생성 완료");
            return response;
            
        } catch (Exception e) {
            log.error("TourAPI 기반 재생성 실패", e);
            throw new RuntimeException("AI 재생성 중 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 요청 기간에 맞게 제한된 LocationInfo 생성
     */
    private List<ChatResponse.LocationInfo> createLocationsFromTourAPIDataWithLimit(
            List<Map<String, Object>> tourApiData, int requiredPlaces, int totalDays) {
        
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        int dayCounter = 1;
        int placesPerDay = Math.max(1, requiredPlaces / totalDays);
        int extraPlaces = requiredPlaces % totalDays;
        int currentDayPlaceCount = 0;
        int processedCount = 0;
        
        log.info("🎯 위치 생성 계획 - 총 {}개, {}일 일정, 일당 {}개", requiredPlaces, totalDays, placesPerDay);
        
        for (Map<String, Object> data : tourApiData) {
            if (processedCount >= requiredPlaces) break; // 필요한 개수만큼만 처리
            
            try {
                String mapX = String.valueOf(data.get("mapx"));
                String mapY = String.valueOf(data.get("mapy"));
                String title = String.valueOf(data.get("title"));
                String addr1 = String.valueOf(data.get("addr1"));
                
                // 좌표가 있는 데이터만 처리
                if (!"null".equals(mapX) && !"null".equals(mapY) && 
                    !"null".equals(title) && !mapX.isEmpty() && !mapY.isEmpty()) {
                    
                    ChatResponse.LocationInfo location = new ChatResponse.LocationInfo();
                    location.setName(title);
                    location.setLatitude(Double.parseDouble(mapY)); // 위도
                    location.setLongitude(Double.parseDouble(mapX)); // 경도
                    
                    // 🎯 Day별 정확한 분배
                    location.setDay(dayCounter);
                    
                    // 🏠 실제 주소 정보 설정
                    if (!"null".equals(addr1) && !addr1.isEmpty()) {
                        location.setDescription(addr1);
                    } else {
                        location.setDescription("주소 정보 없음");
                    }
                    
                    // 🖼️ 이미지 설정
                    String firstImage = String.valueOf(data.get("firstimage"));
                    if (!"null".equals(firstImage) && !firstImage.isEmpty()) {
                        location.setImage(firstImage);
                    }
                    
                    // 콘텐츠 타입별 카테고리 설정
                    String contentTypeId = String.valueOf(data.get("contenttypeid"));
                    location.setCategory(getContentTypeNameByCode(contentTypeId));
                    
                    // 시간 정보 설정 (장소 순서에 따라)
                    if (currentDayPlaceCount == 0) {
                        location.setTime("오전 09:00");
                    } else if (currentDayPlaceCount == 1) {
                        location.setTime("오후 13:00");
                    } else if (currentDayPlaceCount == 2) {
                        location.setTime("오후 16:00");
                    }
                    
                    locations.add(location);
                    processedCount++;
                    
                    // Day 카운터 증가 로직 (현재 Day에 필요한 만큼 채웠는지 확인)
                    int placesForCurrentDay = placesPerDay + (dayCounter <= extraPlaces ? 1 : 0);
                    currentDayPlaceCount++;
                    
                    if (currentDayPlaceCount >= placesForCurrentDay && dayCounter < totalDays) {
                        dayCounter++;
                        currentDayPlaceCount = 0;
                    }
                    
                    log.info("📍 위치 생성: {} (Day {}, {}) - 주소: {}", 
                            title, location.getDay(), location.getTime(), location.getDescription());
                }
            } catch (Exception e) {
                log.debug("위치 정보 생성 실패: {}", data.get("title"), e);
            }
        }
        
        log.info("📍 요청 기간에 맞게 위치 정보 생성 완료: {}개, 총 {}일 일정", 
                locations.size(), Math.min(dayCounter, totalDays));
        return locations;
    }
    
    // ✅ 엄격모드 제거: 모든 관광지 사용 허용
    
    /**
     * ✅ TourAPI 우선 + AI 보완 방식 추천 생성
     */
    private String createTourAPIFirstRecommendation(List<Map<String, Object>> travelCourses, 
                                                   List<Map<String, Object>> otherSpots, 
                                                   String originalMessage, 
                                                   String keyword) {
        
        // 🎯 1단계: TourAPI 실제 데이터 수집
        List<String> realPlaces = new ArrayList<>();
        List<Map<String, Object>> realPlaceDetails = new ArrayList<>();
        
        // 여행코스 우선 추가
        for (Map<String, Object> course : travelCourses) {
            String title = String.valueOf(course.get("title"));
            if (title != null && !title.equals("null")) {
                realPlaces.add(title);
                realPlaceDetails.add(course);
            }
        }
        
        // 일반 관광지 추가
        for (Map<String, Object> spot : otherSpots) {
            String title = String.valueOf(spot.get("title"));
            if (title != null && !title.equals("null")) {
                realPlaces.add(title);
                realPlaceDetails.add(spot);
            }
        }
        
        log.info("🌐 TourAPI 실제 데이터: {}개 수집 완료", realPlaces.size());
        
        // 🎯 2단계: 사용자 요청에서 기간 분석
        String duration = extractDurationFromMessageEnhanced(originalMessage);
        int requiredPlaces = calculateRequiredPlaces(duration);
        
        // 🎯 Day별 분배 계산
        int totalDays = getTotalDaysFromDuration(duration);
        int placesPerDay = Math.max(1, requiredPlaces / totalDays);
        int extraPlaces = requiredPlaces % totalDays;
        
        log.info("📊 요청 분석 - 기간: {}, 총 {}일, 일당 {}개 장소, 필요 총 {}개, 보유 데이터: {}개", 
                duration, totalDays, placesPerDay, requiredPlaces, realPlaces.size());
        
        // 🎯 3단계: TourAPI 우선 + AI 보완 프롬프트 생성
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("🎯 ").append(originalMessage).append(" 요청에 맞는 Day별 여행코스를 추천해주세요.\n\n");
        
        if (!realPlaces.isEmpty()) {
            prompt.append("✅ **우선 사용할 실제 TourAPI 데이터** (한국관광공사 검증):\n");
            for (int i = 0; i < Math.min(realPlaces.size(), requiredPlaces); i++) {
                Map<String, Object> details = realPlaceDetails.get(i);
                prompt.append(String.format("%d. %s\n", i+1, realPlaces.get(i)));
                if (details.get("addr1") != null && !details.get("addr1").toString().equals("null")) {
                    prompt.append(String.format("   - 위치: %s\n", details.get("addr1")));
                }
                prompt.append(String.format("   - 좌표: [%s,%s]\n", 
                    details.get("mapy"), details.get("mapx")));
            }
            prompt.append("\n");
        }
        
        prompt.append("📋 **Day별 여행 일정 생성 규칙**:\n");
        prompt.append("1. ").append(duration).append("(총 ").append(totalDays).append("일)에 맞춰 Day별로 명확히 구분해주세요\n");
        
        // Day별 배치 계획 상세 명시
        for (int day = 1; day <= totalDays; day++) {
            int placesForThisDay = placesPerDay + (day <= extraPlaces ? 1 : 0);
            prompt.append("   - **Day ").append(day).append("**: 정확히 ")
                  .append(placesForThisDay).append("개 장소 추천 (필수)\n");
        }
        
        prompt.append("2. 위의 TourAPI 실제 데이터를 **최대한 우선적으로** 사용해주세요\n");
        prompt.append("3. 데이터가 부족하면 유명한 관광지로 보완하되, 반드시 Day별 개수를 맞춰주세요\n");
        prompt.append("4. 각 장소마다 '@location:[위도,경도] @day:숫자' 형식 필수 포함\n");
        prompt.append("5. Day별로 시간순 배치 (오전 9시 → 오후 1시 → 오후 4시 순)\n");
        prompt.append("6. 이모지나 특수기호는 사용하지 마세요\n");
        prompt.append("7. 자연스러운 한국어로 작성해주세요\n\n");
        
        prompt.append("🗓️ **응답 형식 예시**:\n");
        prompt.append("Day 1\n");
        prompt.append("오전 9:00 - [장소명1] @location:[위도,경도] @day:1\n");
        prompt.append("오후 1:00 - [장소명2] @location:[위도,경도] @day:1\n");
        prompt.append("오후 4:00 - [장소명3] @location:[위도,경도] @day:1\n\n");
        prompt.append("Day 2\n");
        prompt.append("오전 9:00 - [장소명4] @location:[위도,경도] @day:2\n");
        prompt.append("...\n\n");
        
        prompt.append("🎯 **").append(duration).append(" 일정으로 총 ").append(totalDays)
              .append("일간 Day별 여행코스를 정확히 추천해주세요!**\n");
        prompt.append("(TourAPI 실제 데이터 우선 + 부족한 부분만 AI 보완 + Day별 정확한 분배)");
        
        return callOpenAI(prompt.toString());
    }
    
    /**
     * 여행 기간에서 총 일수 추출
     */
    private int getTotalDaysFromDuration(String duration) {
        switch (duration) {
            case "당일치기": return 1;
            case "1박2일": return 2;
            case "2박3일": return 3;
            case "3박4일": return 4;
            case "4박5일": return 5;
            case "5박6일": return 6;
            case "6박7일": return 7;
            default: return 2;
        }
    }
    
    /**
     * 기간별 필요 장소 수 계산
     */
    private int calculateRequiredPlaces(String duration) {
        switch (duration) {
            case "당일치기": return 3;
            case "1박2일": return 4;
            case "2박3일": return 6;
            case "3박4일": return 8;
            case "4박5일": return 10;
            case "5박6일": return 12;
            case "6박7일": return 14;
            default: return 6;
        }
    }
    
    // ✅ 엄격모드 제거로 불필요해진 메서드 제거됨
    
    /**
     * 콘텐츠 타입 코드를 이름으로 변환
     */
    private String getContentTypeNameByCode(String contentTypeId) {
        Map<String, String> typeMap = new HashMap<>();
        typeMap.put("12", "관광지");
        typeMap.put("14", "문화시설");
        typeMap.put("15", "축제공연행사");
        typeMap.put("25", "여행코스");
        typeMap.put("28", "레포츠");
        typeMap.put("38", "쇼핑");
        typeMap.put("39", "음식점");
        return typeMap.getOrDefault(contentTypeId, "기타");
    }
    
    // 유틸리티 메서드들
    private String extractKeywordFromRequest(String message) {
        if (message.contains("축제") || message.contains("불꽃")) return "축제";
        if (message.contains("맛집") || message.contains("음식")) return "음식";
        if (message.contains("문화") || message.contains("박물관")) return "문화";
        return "관광";
    }
    
    private String determineRequestType(String message) {
        if (message.contains("축제")) {
            return message.contains("여행") || message.contains("코스") ? "festival_with_travel" : "festival_only";
        }
        return "travel_only";
    }
    
    /**
     * TourAPI 데이터에서 직접 LocationInfo 생성 (요청 기간에 맞게 제한)
     */
    private List<ChatResponse.LocationInfo> createLocationsFromTourAPIData(List<Map<String, Object>> tourApiData) {
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        // 🎯 필요한 개수 계산 (요청 메시지에서 기간 추출)
        // 현재 요청된 기간에 맞게 제한
        int maxLocations = Math.min(tourApiData.size(), 15); // 최대 15개로 제한
        
        int dayCounter = 1;
        int placesPerDay = 3; // 하루에 3개 장소 기준
        int currentDayPlaceCount = 0;
        int processedCount = 0;
        
        for (Map<String, Object> data : tourApiData) {
            if (processedCount >= maxLocations) break; // 필요한 개수만큼만 처리
            
            try {
                String mapX = String.valueOf(data.get("mapx"));
                String mapY = String.valueOf(data.get("mapy"));
                String title = String.valueOf(data.get("title"));
                String addr1 = String.valueOf(data.get("addr1"));
                
                // 좌표가 있는 데이터만 처리
                if (!"null".equals(mapX) && !"null".equals(mapY) && 
                    !"null".equals(title) && !mapX.isEmpty() && !mapY.isEmpty()) {
                    
                    ChatResponse.LocationInfo location = new ChatResponse.LocationInfo();
                    location.setName(title);
                    location.setLatitude(Double.parseDouble(mapY)); // 위도
                    location.setLongitude(Double.parseDouble(mapX)); // 경도
                    
                    // 🎯 Day별 균등 분배 로직
                    location.setDay(dayCounter);
                    
                    // 🏠 실제 주소 정보 설정
                    if (!"null".equals(addr1) && !addr1.isEmpty()) {
                        location.setDescription(addr1);
                    } else {
                        location.setDescription("주소 정보 없음");
                    }
                    
                    // 🖼️ 이미지 설정
                    String firstImage = String.valueOf(data.get("firstimage"));
                    if (!"null".equals(firstImage) && !firstImage.isEmpty()) {
                        location.setImage(firstImage);
                    }
                    
                    // 콘텐츠 타입별 카테고리 설정
                    String contentTypeId = String.valueOf(data.get("contenttypeid"));
                    location.setCategory(getContentTypeNameByCode(contentTypeId));
                    
                    // 시간 정보 설정 (장소 순서에 따라)
                    if (currentDayPlaceCount == 0) {
                        location.setTime("오전 09:00");
                    } else if (currentDayPlaceCount == 1) {
                        location.setTime("오후 13:00");
                    } else if (currentDayPlaceCount == 2) {
                        location.setTime("오후 16:00");
                    }
                    
                    locations.add(location);
                    processedCount++;
                    
                    // Day 카운터 증가 로직
                    currentDayPlaceCount++;
                    if (currentDayPlaceCount >= placesPerDay) {
                        dayCounter++;
                        currentDayPlaceCount = 0;
                    }
                    
                    log.info("📍 위치 생성: {} (Day {}, {}) - 주소: {}", 
                            title, location.getDay(), location.getTime(), location.getDescription());
                }
            } catch (Exception e) {
                log.debug("위치 정보 생성 실패: {}", data.get("title"), e);
            }
        }
        
        log.info("📍 TourAPI에서 위치 정보 생성: {}개, 총 {}일 일정 (요청 기간에 맞게 제한)", 
                locations.size(), dayCounter);
        return locations;
    }
    

    
    private List<ChatResponse.FestivalInfo> createFestivalInfoFromTourAPI(List<Map<String, Object>> tourApiData) {
        List<ChatResponse.FestivalInfo> festivals = tourApiData.stream()
            .filter(data -> "15".equals(String.valueOf(data.get("contenttypeid"))))
            .map(data -> {
                ChatResponse.FestivalInfo festival = new ChatResponse.FestivalInfo();
                festival.setName(String.valueOf(data.get("title")));
                festival.setLocation(String.valueOf(data.get("addr1")));
                festival.setImage(String.valueOf(data.get("firstimage")));
                festival.setContact(String.valueOf(data.get("tel")));
                festival.setContentId(String.valueOf(data.get("contentid")));
                festival.setContentTypeId(String.valueOf(data.get("contenttypeid")));
                festival.setMapX(String.valueOf(data.get("mapx")));
                festival.setMapY(String.valueOf(data.get("mapy")));
                festival.setAddr1(String.valueOf(data.get("addr1")));
                festival.setTel(String.valueOf(data.get("tel")));
                
                // 축제 기간 설정
                String startDate = String.valueOf(data.get("eventstartdate"));
                String endDate = String.valueOf(data.get("eventenddate"));
                if (!"null".equals(startDate) && !"null".equals(endDate) && 
                    !startDate.isEmpty() && !endDate.isEmpty()) {
                    festival.setPeriod(formatDatePeriod(startDate, endDate));
                } else {
                    festival.setPeriod("기간 미정");
                }
                
                festival.setDescription("한국관광공사에서 제공하는 축제 정보입니다.");
                return festival;
            })
            .collect(Collectors.toList());
            
        log.info("🎪 축제 정보 생성: {}개", festivals.size());
        return festivals;
    }
    
    /**
     * 날짜 기간 포맷팅
     */
    private String formatDatePeriod(String startDate, String endDate) {
        try {
            if (startDate.length() == 8 && endDate.length() == 8) {
                String formattedStart = startDate.substring(0, 4) + "." + 
                                       startDate.substring(4, 6) + "." + 
                                       startDate.substring(6, 8);
                String formattedEnd = endDate.substring(0, 4) + "." + 
                                     endDate.substring(4, 6) + "." + 
                                     endDate.substring(6, 8);
                return formattedStart + " ~ " + formattedEnd;
            }
        } catch (Exception e) {
            log.debug("날짜 포맷팅 실패: {} ~ {}", startDate, endDate, e);
        }
        return startDate + " ~ " + endDate;
    }
    
    private ChatResponse.TravelCourse createTravelCourseFromTourAPI(List<ChatResponse.LocationInfo> locations, List<Map<String, Object>> tourApiData) {
        ChatResponse.TravelCourse travelCourse = new ChatResponse.TravelCourse();
        
        // 여행코스 데이터에서 제목 찾기
        String courseTitle = tourApiData.stream()
            .filter(data -> "25".equals(String.valueOf(data.get("contenttypeid"))))
            .map(data -> String.valueOf(data.get("title")))
            .findFirst()
            .orElse("AI 추천 여행코스");
        
        travelCourse.setCourseTitle(courseTitle);
        
        // 🎯 실제 위치 개수와 Day 정보를 기반으로 총 일수 계산
        int maxDay = locations.stream()
            .mapToInt(ChatResponse.LocationInfo::getDay)
            .max()
            .orElse(1);
        
        travelCourse.setTotalDays(maxDay);
        
        // 일별 일정 생성
        List<ChatResponse.DailySchedule> dailySchedules = new ArrayList<>();
        
        for (int day = 1; day <= maxDay; day++) {
            ChatResponse.DailySchedule dailySchedule = new ChatResponse.DailySchedule();
            dailySchedule.setDay(day);
            dailySchedule.setTheme("Day " + day + " 일정");
            
            // 🎯 람다 표현식에서 사용하기 위해 final 변수로 복사
            final int currentDay = day;
            
            // 해당 날짜의 장소들 필터링
            List<ChatResponse.LocationInfo> dayLocations = locations.stream()
                .filter(location -> location.getDay() == currentDay)
                .collect(Collectors.toList());
            
            List<ChatResponse.PlaceInfo> places = new ArrayList<>();
            
            for (ChatResponse.LocationInfo location : dayLocations) {
                ChatResponse.PlaceInfo place = new ChatResponse.PlaceInfo();
                place.setName(location.getName());
                place.setType("attraction");
                place.setAddress(location.getDescription());
                place.setDescription(location.getCategory() + " - " + location.getName());
                place.setLatitude(location.getLatitude());
                place.setLongitude(location.getLongitude());
                place.setVisitTime(location.getTime() != null ? location.getTime() : "시간 미정");
                place.setDuration("2시간"); // 기본값
                place.setCategory(location.getCategory());
                
                places.add(place);
            }
            
            dailySchedule.setPlaces(places);
            dailySchedules.add(dailySchedule);
        }
        
        travelCourse.setDailySchedule(dailySchedules);
        
        log.info("🗺️ 여행코스 생성: {}, {}일 일정, 총 {}개 장소", 
                courseTitle, maxDay, locations.size());
        
        return travelCourse;
    }
} 