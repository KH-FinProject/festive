package com.project.festive.festiveserver.ai.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
import org.springframework.http.converter.StringHttpMessageConverter;
import java.nio.charset.StandardCharsets;
import jakarta.annotation.PostConstruct;
import org.springframework.web.util.UriComponentsBuilder;
import com.project.festive.festiveserver.ai.dto.ChatRequest;
import com.project.festive.festiveserver.ai.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor  
@Slf4j
public class AITravelServiceImpl implements AITravelService {
    
    private final TourAPIService tourAPIService;
    private final OpenAIService openAIService;
    private final TravelAnalysisService travelAnalysisService;
    
    // 임시 필드들 (기존 코드와의 호환성을 위해)
    @Value("${tour.api.service-key:}")
    private String tourApiServiceKey;
    
    @Value("${openai.api.key:}")
    private String openAiApiKey;
    
    // 지역코드 및 시군구 코드 매핑
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
        put("경북", "35"); put("경상북도", "35");  // 🔧 올바른 코드: 35
        put("경남", "36"); put("경상남도", "36");  // 🔧 올바른 코드: 36
        put("전북", "37"); put("전라북도", "37"); put("전북특별자치도", "37");  // 🔧 올바른 코드: 37
        put("전남", "38"); put("전라남도", "38");  // 🔧 올바른 코드: 38
        put("제주", "39"); put("제주도", "39"); put("제주특별자치도", "39");
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
        
        // 강원특별자치도 (32) - 주요 시군구 줄임형 추가
        put("춘천시", "32_1"); put("춘천", "32_1");
        put("원주시", "32_2"); put("원주", "32_2");
        put("강릉시", "32_3"); put("강릉", "32_3");
        put("동해시", "32_4"); put("동해", "32_4");
        put("태백시", "32_5"); put("태백", "32_5");
        put("속초시", "32_6"); put("속초", "32_6");
        put("삼척시", "32_7"); put("삼척", "32_7");
        put("홍천군", "32_8"); put("홍천", "32_8");
        put("횡성군", "32_9"); put("횡성", "32_9");
        put("영월군", "32_10"); put("영월", "32_10");
        put("평창군", "32_11"); put("평창", "32_11");
        put("정선군", "32_12"); put("정선", "32_12");
        put("철원군", "32_13"); put("철원", "32_13");
        put("화천군", "32_14"); put("화천", "32_14");
        put("양구군", "32_15"); put("양구", "32_15");
        put("인제군", "32_16"); put("인제", "32_16");
        put("고성군", "32_17"); put("고성", "32_17");
        put("양양군", "32_18"); put("양양", "32_18");
        
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
        
        // 전라남도 (36) - 주요 관광지 줄임형 추가
        put("목포시", "36_1"); put("목포", "36_1");
        put("여수시", "36_2"); put("여수", "36_2");
        put("순천시", "36_3"); put("순천", "36_3");
        put("나주시", "36_4"); put("나주", "36_4");
        put("광양시", "36_5"); put("광양", "36_5");
        put("담양군", "36_6"); put("담양", "36_6");
        put("곡성군", "36_7"); put("곡성", "36_7");
        put("구례군", "36_8"); put("구례", "36_8");
        put("고흥군", "36_9"); put("고흥", "36_9");
        put("보성군", "36_10"); put("보성", "36_10");
        put("화순군", "36_11"); put("화순", "36_11");
        put("장흥군", "36_12"); put("장흥", "36_12");
        put("강진군", "36_13"); put("강진", "36_13");
        put("해남군", "36_14"); put("해남", "36_14");
        put("영암군", "36_15"); put("영암", "36_15");
        put("무안군", "36_16"); put("무안", "36_16");
        put("함평군", "36_17"); put("함평", "36_17");
        put("영광군", "36_18"); put("영광", "36_18");
        put("장성군", "36_19"); put("장성", "36_19");
        put("완도군", "36_20"); put("완도", "36_20");
        put("진도군", "36_21"); put("진도", "36_21");
        put("신안군", "36_22"); put("신안", "36_22");
        
        // 경상북도 (37) - 주요 관광지 줄임형 추가
        put("포항시", "37_1"); put("포항", "37_1");
        put("경주시", "37_2"); put("경주", "37_2");
        put("김천시", "37_3"); put("김천", "37_3");
        put("안동시", "37_4"); put("안동", "37_4");
        put("구미시", "37_5"); put("구미", "37_5");
        put("영주시", "37_6"); put("영주", "37_6");
        put("영천시", "37_7"); put("영천", "37_7");
        put("상주시", "37_8"); put("상주", "37_8");
        put("문경시", "37_9"); put("문경", "37_9");
        put("경산시", "37_10"); put("경산", "37_10");
        put("군위군", "37_11"); put("군위", "37_11");
        put("의성군", "37_12"); put("의성", "37_12");
        put("청송군", "37_13"); put("청송", "37_13");
        put("영양군", "37_14"); put("영양", "37_14");
        put("영덕군", "37_15"); put("영덕", "37_15");
        put("청도군", "37_16"); put("청도", "37_16");
        put("고령군", "37_17"); put("고령", "37_17");
        put("성주군", "37_18"); put("성주", "37_18");
        put("칠곡군", "37_19"); put("칠곡", "37_19");
        put("예천군", "37_20"); put("예천", "37_20");
        put("봉화군", "37_21"); put("봉화", "37_21");
        put("울진군", "37_22"); put("울진", "37_22");
        put("울릉군", "37_23"); put("울릉", "37_23");
        
        // 경상남도 (36) - 시/군명과 줄임형 모두 지원 (TourAPI 기준)
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
        put("통영시", "36_17"); put("통영", "36_17");  // 🎯 통영 올바른 코드
        put("하동군", "36_18"); put("하동", "36_18");
        put("함안군", "36_19"); put("함안", "36_19");
        put("함양군", "36_20"); put("함양", "36_20");
        put("합천군", "36_21"); put("합천", "36_21");
        
        // 제주특별자치도 (39) - 줄임형 추가
        put("제주시", "39_1"); put("제주", "39_1");
        put("서귀포시", "39_2"); put("서귀포", "39_2");
    }};

    // RestTemplate은 아래에서 초기화
    
    // UTF-8 인코딩이 설정된 RestTemplate
    private RestTemplate restTemplate;
    
    @PostConstruct
    private void initRestTemplate() {
        restTemplate = new RestTemplate();
        // UTF-8 인코딩을 위한 StringHttpMessageConverter 설정
        StringHttpMessageConverter stringConverter = new StringHttpMessageConverter(StandardCharsets.UTF_8);
        stringConverter.setWriteAcceptCharset(false); // Accept-Charset 헤더 생성 방지
        
        // 기존 메시지 컨버터 중 StringHttpMessageConverter를 UTF-8로 교체
        restTemplate.getMessageConverters().removeIf(converter -> 
            converter instanceof StringHttpMessageConverter);
        restTemplate.getMessageConverters().add(0, stringConverter);
    }

    @Override
    public ChatResponse generateTravelRecommendation(ChatRequest request) {
        try {
            log.info("🎯 여행/축제 전용 AI 추천 시작: {}", request.getMessage());
            
            // 🔄 TourAPI 데이터 기반 재생성 요청인지 확인 (레거시 지원)
            if (request.getTourApiData() != null && !request.getTourApiData().isEmpty()) {
                log.info("🌐 레거시 TourAPI 데이터 기반 AI 응답 재생성: {}개 관광지", request.getTourApiData().size());
                return regenerateWithTourAPIData(request);
            }
            
            // 🚀 속도 개선: AI 분석 없이 직접 파싱으로 빠른 처리 + 여행/축제 전용 검증
            TravelAnalysis analysis;
            try {
                analysis = createFastAnalysis(request.getMessage());
            } catch (IllegalArgumentException e) {
                if ("INVALID_REQUEST".equals(e.getMessage())) {
                    // 🚫 여행/축제 관련 질문이 아닌 경우 정중하게 거부
                    ChatResponse response = new ChatResponse();
                    response.setContent(createRejectionMessage());
                    response.setRequestType("rejected");
                    response.setStreaming(false);
                    response.setLocations(new ArrayList<>());
                    response.setFestivals(new ArrayList<>());
                    response.setTravelCourse(null);
                    
                    log.info("❌ 일반 대화 요청 거부됨: {}", request.getMessage());
                    return response;
                }
                throw e;
            }
            
            log.info("⚡ 빠른 분석 완료 - 타입: {}, 지역: {}, 기간: {}", 
                    analysis.getRequestType(), analysis.getRegion(), analysis.getDuration());

            // 🌐 2단계: 백엔드에서 모든 처리 완료 (TourAPI 데이터 기반으로만 응답)
            ChatResponse response = generateDataBasedResponseOnly(request.getMessage(), analysis);
            
            log.info("✅ 여행/축제 전용 AI 추천 완료");
            return response;

        } catch (Exception e) {
            log.error("여행/축제 전용 AI 추천 생성 중 오류 발생", e);
            throw new RuntimeException("여행/축제 정보 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", e);
        }
    }
    
    /**
     * 🚫 일반 대화 거부 메시지 생성
     */
    private String createRejectionMessage() {
        return "안녕하세요! 저는 **여행과 축제 전문 AI**입니다. 🎪✈️\n\n" +
               "다음과 같은 질문에만 답변드릴 수 있어요:\n\n" +
               " **여행 계획**\n" +
               "• \"서울 2박3일 여행코스 추천해줘\"\n" +
               "• \"부산 당일치기 여행지 알려줘\"\n" +
               "• \"제주도 가볼만한 곳 추천\"\n\n" +
               " **축제 정보**\n" +
               "• \"인천 벚꽃축제 정보 알려줘\"\n" +
               "• \"서울 불꽃축제 언제야?\"\n" +
               "• \"강원도 축제 추천해줘\"\n\n" +
               " **관광지 추천**\n" +
               "• \"경기도 관광지 추천\"\n" +
               "• \"대전 가볼만한 곳\"\n" +
               "• \"충남 여행코스\"\n\n" +
               "여행이나 축제 관련 질문을 해주시면 최고의 추천을 드릴게요! 😊";
    }
    
    /**
     * 🎯 TourAPI 데이터만을 기반으로 한 구조화된 응답 생성 (AI 없이)
     */
    private ChatResponse generateDataBasedResponseOnly(String originalMessage, TravelAnalysis analysis) {
        try {
            log.info("🌐 TourAPI 데이터만으로 구조화된 응답 생성 시작");
            
            // TourAPI 데이터 수집
            List<TourAPIResponse.Item> tourAPIData = collectTourismDataSecurely(analysis);
            log.info("✅ TourAPI 데이터 수집 완료: {}개", tourAPIData.size());
            
            // 🚨 TourAPI 데이터가 없는 경우 처리
            if (tourAPIData.isEmpty()) {
                log.warn("⚠️ TourAPI 데이터가 없음 - 데이터 없음 응답 생성");
                return createNoDataResponse(analysis);
            }
            
            // TourAPI 데이터를 Map 형태로 변환
            List<Map<String, Object>> tourApiDataMaps = tourAPIData.stream()
                .map(this::convertToMap)
                .collect(Collectors.toList());
            
            // 🎯 요청 기간 정보 추출
            String duration = analysis.getDuration() != null ? analysis.getDuration() : "2박3일";
            int requiredPlaces = calculateRequiredPlaces(duration);
            int totalDays = getTotalDaysFromDuration(duration);
            
            // 최종 응답 구성 (AI 응답 없이 데이터만 기반)
            ChatResponse response = new ChatResponse();
            
            // 🏗️ 구조화된 응답 메시지 생성 (AI 없이)
            String structuredContent = createStructuredResponseMessage(analysis, tourAPIData);
            response.setContent(structuredContent);
            response.setRequestType(analysis.getRequestType());
            response.setStreaming(false);
            
            // 🎯 지역 정보 설정 (저장할 때 사용)
            response.setRegionName(analysis.getRegion());
            response.setAreaCode(analysis.getAreaCode());
            
            // 📝 AI가 생성한 day별 코스 설명 저장 (프론트엔드 표시용)
            response.setCourseDescription(structuredContent);
            
            // 🎯 요청 기간에 맞게 위치 정보 생성 (선호하는 contentType 고려)
            List<ChatResponse.LocationInfo> locations = createLocationsFromTourAPIDataWithPreference(
                    tourApiDataMaps, requiredPlaces, totalDays, analysis.getPreferredContentType());
            response.setLocations(locations);
            
            // 축제 정보 생성
            List<ChatResponse.FestivalInfo> festivals = createFestivalInfoFromTourAPI(tourApiDataMaps);
            response.setFestivals(festivals);
            
            // 여행 코스 정보 생성
            ChatResponse.TravelCourse travelCourse = createTravelCourseFromTourAPI(locations, tourApiDataMaps);
            response.setTravelCourse(travelCourse);
            
            log.info("🎯 데이터 기반 응답 생성 완료 - 지역: {}, 타입: {}, 위치: {}개", 
                    analysis.getRegion(), analysis.getRequestType(), locations.size());
            return response;
            
        } catch (Exception e) {
            log.error("데이터 기반 응답 생성 실패", e);
            throw new RuntimeException("여행 정보 처리 중 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 🚨 TourAPI 데이터가 없는 경우 응답 생성
     */
    private ChatResponse createNoDataResponse(TravelAnalysis analysis) {
        ChatResponse response = new ChatResponse();
        
        String region = analysis.getRegion() != null ? analysis.getRegion() : "해당 지역";
        String keyword = analysis.getKeyword() != null ? analysis.getKeyword() : "";
        String requestType = analysis.getRequestType();
        
        // 🎯 요청 타입에 따른 응답 메시지 생성
        StringBuilder content = new StringBuilder();
        
        if ("festival_only".equals(requestType) || "festival_with_travel".equals(requestType)) {
            // 축제 요청인 경우
            content.append("네! ").append(region);
            if (!keyword.isEmpty()) {
                content.append(" ").append(keyword).append("축제");
            } else {
                content.append(" 축제");
            }
            content.append(" 알려드리겠습니다.\n\n");
            content.append("찾아봤지만, 현재는 없는것같아요 ㅠ 다시 검색을 해주세요");
        } else {
            // 여행 요청인 경우  
            content.append("네! ").append(region).append(" 여행 정보를 찾아드리겠습니다.\n\n");
            content.append("찾아봤지만, 현재는 없는것같아요 ㅠ 다시 검색을 해주세요");
        }
        
        response.setContent(content.toString());
        response.setRequestType("no_data"); // 🎯 특별한 타입 설정으로 교통안내 숨김 처리
        response.setStreaming(false);
        response.setLocations(new ArrayList<>());
        response.setFestivals(new ArrayList<>());
        response.setTravelCourse(null);
        
        log.info("🚨 데이터 없음 응답 생성 완료 - 지역: {}, 키워드: {}", region, keyword);
        return response;
    }
    
    /**
     * 🏗️ TourAPI 데이터 기반 구조화된 응답 메시지 생성 (AI 없이)
     */
    private String createStructuredResponseMessage(TravelAnalysis analysis, List<TourAPIResponse.Item> tourAPIData) {
        StringBuilder response = new StringBuilder();
        
        String region = analysis.getRegion() != null ? analysis.getRegion() : "선택하신 지역";
        String duration = analysis.getDuration() != null ? analysis.getDuration() : "2박3일";
        String requestType = analysis.getRequestType();
        
        // 🎯 자연스러운 인사 메시지
        if ("festival_only".equals(requestType)) {
            response.append("네! ").append(region).append(" 축제 정보를 찾아드리겠습니다.\n\n");
        } else if ("festival_with_travel".equals(requestType)) {
            response.append("네! ").append(region).append(" ").append(duration).append(" 축제와 여행코스를 함께 추천해드리겠습니다.\n\n");
        } else {
            response.append("네! ").append(region).append(" ").append(duration).append(" 여행코스를 추천해드리겠습니다.\n\n");
        }
        
        // 🎯 실제 데이터 기반 Day별 일정 생성
        int totalDays = getTotalDaysFromDuration(duration);
        List<TourAPIResponse.Item> selectedItems = tourAPIData.stream()
            .limit(totalDays * 4) // day별 4개씩
            .collect(Collectors.toList());
        
        for (int day = 1; day <= totalDays; day++) {
            response.append("Day ").append(day).append("\n");
            
            // 해당 day의 장소들 추출 (4개씩)
            int startIndex = (day - 1) * 4;
            int endIndex = Math.min(startIndex + 4, selectedItems.size());
            
            if (startIndex < selectedItems.size()) {
                for (int i = startIndex; i < endIndex; i++) {
                    TourAPIResponse.Item item = selectedItems.get(i);
                    response.append("- ").append(item.getTitle()).append("\n");
                }
                
                // AI가 작성하는 포인트 (실제 장소들을 기반으로)
                String dayPointPrompt = createDayPointPrompt(selectedItems.subList(startIndex, endIndex), day, region);
                String dayPoint = callOpenAIForDayPoint(dayPointPrompt);
                response.append("포인트: ").append(dayPoint).append("\n\n");
            }
        }
        
        // 마무리 메시지
        response.append("즐거운 여행 보내시길 바랍니다! ^^");
        
        return response.toString();
    }
    
    /**
     * Day별 포인트 생성을 위한 프롬프트 생성
     */
    private String createDayPointPrompt(List<TourAPIResponse.Item> dayItems, int day, String region) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("다음은 ").append(region).append(" 여행 ").append(day).append("일차 일정입니다.\n");
        prompt.append("장소 목록:\n");
        
        for (TourAPIResponse.Item item : dayItems) {
            prompt.append("- ").append(item.getTitle());
            if (item.getAddr1() != null && !item.getAddr1().isEmpty()) {
                prompt.append(" (").append(item.getAddr1()).append(")");
            }
            prompt.append("\n");
        }
        
        prompt.append("\n이 일정의 특징과 포인트를 한 문장으로 요약해주세요. ");
        prompt.append("이동 동선, 테마, 또는 특별한 매력 등을 언급하며 여행자에게 도움이 되는 간단한 팁을 포함해주세요.");
        
        return prompt.toString();
    }
    
    /**
     * OpenAI를 호출하여 Day별 포인트 생성
     */
    private String callOpenAIForDayPoint(String prompt) {
        try {
            String aiResponse = callOpenAI(prompt);
            if (aiResponse != null && !aiResponse.trim().isEmpty()) {
                return aiResponse.trim();
            }
        } catch (Exception e) {
            log.debug("OpenAI 호출 실패, 기본 메시지 사용", e);
        }
        
        // 폴백: 기본 메시지
        return "다양한 장소들을 효율적으로 둘러볼 수 있는 일정입니다!";
    }
    
    /**
     * 🎨 AI 응답을 프론트엔드에서 파싱하기 쉽도록 포맷팅
     */
    private String formatAIResponseForFrontend(String aiResponse) {
        if (aiResponse == null || aiResponse.trim().isEmpty()) {
            return "죄송합니다. 응답을 생성하는데 문제가 발생했습니다.";
        }
        
        String formatted = aiResponse.trim();
        
        // 1. Day 앞에 줄바꿈 추가 (첫 번째 Day는 제외)
        formatted = formatted.replaceAll("(?<!^)\\s*(Day\\s*\\d+)", "\n\n$1");
        
        // 2. Day 뒤에 줄바꿈 추가
        formatted = formatted.replaceAll("(Day\\s*\\d+)\\s*", "$1\n");
        
        // 3. "- " 앞에 줄바꿈 추가 (이미 줄바꿈이 있으면 추가하지 않음)
        formatted = formatted.replaceAll("(?<!\\n)\\s*(-\\s+[^\\n]+)", "\n$1");
        
        // 4. 각 "- " 항목 뒤에 줄바꿈 추가
        formatted = formatted.replaceAll("(-\\s+[^\\n\\r]+)(?!\\n)", "$1\n");
        
        // 5. "포인트:" 앞에 줄바꿈 추가
        formatted = formatted.replaceAll("(?<!\\n)\\s*(포인트\\s*:)", "\n$1");
        
        // 6. "포인트:" 뒤에 공백이 없으면 추가
        formatted = formatted.replaceAll("(포인트\\s*:)(?!\\s)", "$1 ");
        
        // 7. 포인트 내용 뒤에 두 번 줄바꿈 추가 (다음 Day와 구분)
        formatted = formatted.replaceAll("(포인트\\s*:[^\\n\\r]+)(?=\\s*Day|$)", "$1\n");
        
        // 8. 마지막 마무리 메시지 앞에 줄바꿈 추가
        formatted = formatted.replaceAll("(?<!\\n)\\s*(즐거운\\s*여행)", "\n\n$1");
        
        // 9. 중복된 줄바꿈 정리 (3개 이상의 연속 줄바꿈을 2개로)
        formatted = formatted.replaceAll("\\n{3,}", "\n\n");
        
        // 10. 시작과 끝의 불필요한 줄바꿈 제거
        formatted = formatted.replaceAll("^\\n+|\\n+$", "");
        
        log.debug("🎨 AI 응답 포맷팅 완료:\n{}", formatted);
        
        return formatted;
    }
    
    /**
     * 🌐 백엔드에서 안전하게 TourAPI 데이터 수집
     */
    private List<TourAPIResponse.Item> collectTourismDataSecurely(TravelAnalysis analysis) {
        List<TourAPIResponse.Item> allItems = new ArrayList<>();
        
        String areaCode = analysis.getAreaCode(); // null이면 전국 검색
        String sigunguCode = analysis.getSigunguCode();
        String keyword = analysis.getKeyword();
        String requestType = analysis.getRequestType();
        String preferredContentType = analysis.getPreferredContentType();
        
        log.info("🌐 백엔드 TourAPI 호출 시작 - 지역코드: {}, 시군구코드: {}, 키워드: {}, 요청타입: {}", 
                areaCode != null ? areaCode : "전국", sigunguCode != null ? sigunguCode : "없음", keyword, requestType);
        
        try {
            // 🎪 축제 요청인 경우 - 축제 데이터만 수집
            if (requestType.contains("festival")) {
                log.info("🎪 축제 전용 모드 - 축제 데이터만 수집");
                
                // 키워드가 있으면 키워드 검색만 (축제 관련)
                if (keyword != null && !keyword.isEmpty()) {
                    log.info("🔍 키워드 축제 검색: {}", keyword);
                    List<TourAPIResponse.Item> keywordResults = searchTourismByKeyword(keyword, areaCode, sigunguCode);
                    // 축제 데이터만 필터링
                    List<TourAPIResponse.Item> festivalKeywordResults = keywordResults.stream()
                        .filter(item -> "15".equals(item.getContentTypeId()))
                        .collect(Collectors.toList());
                    allItems.addAll(festivalKeywordResults);
                    log.info("🔍 키워드 축제 검색 결과: {}개 (키워드 검색만 실행)", festivalKeywordResults.size());
                } 
                // 키워드가 없을 때만 일반 축제 검색
                else {
                    log.info("🎪 일반 축제 검색 (키워드 없음)");
                    List<TourAPIResponse.Item> festivalResults = searchFestivals(areaCode, sigunguCode);
                    addUniqueItems(allItems, festivalResults);
                    log.info("🎪 일반 축제 검색 결과: {}개", festivalResults.size());
                }
                
                // 최대 20개로 제한
                if (allItems.size() > 20) {
                    allItems = allItems.subList(0, 20);
                }
                
                log.info("✅ 축제 전용 데이터 수집 완료: {}개", allItems.size());
                return allItems;
            }
            
            // 🗺️ 여행 요청인 경우 - 여행 관련 데이터만 수집 (축제 제외)
            else {
                log.info("🗺️ 여행 전용 모드 - 축제 제외하고 여행 관련 데이터만 수집");
                
                // 🎯 선호하는 contentType이 있으면 먼저 수집 (우선 처리)
                if (preferredContentType != null) {
                    // 🌈 복합 키워드 처리
                    if (preferredContentType.startsWith("MULTI:")) {
                        String[] multiTypes = preferredContentType.substring(6).split(",");
                        log.info("🌈 복합 타입 처리 시작: {}개 타입", multiTypes.length);
                        
                        for (String contentType : multiTypes) {
                            // 축제(15) 제외
                            if ("15".equals(contentType)) {
                                log.info("⏭️ 축제 타입 건너뛰기 (여행 전용 모드)");
                                continue;
                            }
                            
                            log.info("🎯 복합 타입 {} ({}) 수집 시작", contentType, getContentTypeNameByCode(contentType));
                            List<TourAPIResponse.Item> typeItems = fetchTourismDataSecurely(areaCode, sigunguCode, contentType);
                            allItems.addAll(typeItems);
                            log.info("✅ 복합 타입 {} 수집 완료: {}개", getContentTypeNameByCode(contentType), typeItems.size());
                        }
                    } else {
                        // 축제(15) 제외
                        if ("15".equals(preferredContentType)) {
                            log.info("⏭️ 선호타입이 축제이지만 여행 전용 모드이므로 건너뛰기");
                        } else {
                            // 🎯 단일 타입 처리 (기존 로직)
                            log.info("🎯 선호 타입 {} ({}) 우선 수집 시작", preferredContentType, getContentTypeNameByCode(preferredContentType));
                            List<TourAPIResponse.Item> preferredItems = fetchTourismDataSecurely(areaCode, sigunguCode, preferredContentType);
                            allItems.addAll(preferredItems);
                            log.info("✅ 선호 타입 수집 완료: {}개", preferredItems.size());
                        }
                    }
                }
                
                // 키워드가 있으면 키워드 검색 (여행 관련만)
                if (keyword != null && !keyword.isEmpty()) {
                    List<TourAPIResponse.Item> keywordResults = searchTourismByKeyword(keyword, areaCode, sigunguCode);
                    // 축제 데이터 제외
                    List<TourAPIResponse.Item> travelKeywordResults = keywordResults.stream()
                        .filter(item -> !"15".equals(item.getContentTypeId()))
                        .collect(Collectors.toList());
                    addUniqueItems(allItems, travelKeywordResults);
                    log.info("🔍 키워드 여행 검색 결과: {}개 (축제 제외, 중복 제거 후 총 {}개)", travelKeywordResults.size(), allItems.size());
                }
                
                // 🌈 다양성을 위해 여행 관련 콘텐츠 타입 수집 (축제 제외)
                String[] contentTypes = {"25", "12", "14", "28", "32", "38", "39"}; // 여행코스, 관광지, 문화시설, 레포츠, 숙박, 쇼핑, 음식점 (축제 15 제외)
                Set<String> alreadyCollectedTypes = new HashSet<>();
                
                // 이미 수집한 타입들 확인
                if (preferredContentType != null) {
                    if (preferredContentType.startsWith("MULTI:")) {
                        String[] multiTypes = preferredContentType.substring(6).split(",");
                        alreadyCollectedTypes.addAll(Arrays.asList(multiTypes));
                    } else {
                        alreadyCollectedTypes.add(preferredContentType);
                    }
                }
                
                for (String contentType : contentTypes) {
                    // 이미 수집한 타입은 건너뛰기
                    if (alreadyCollectedTypes.contains(contentType)) {
                        log.info("⏭️ ContentType {} ({}) - 이미 우선 수집됨, 건너뛰기", contentType, getContentTypeNameByCode(contentType));
                        continue;
                    }
                    
                    log.info("🌐 ContentType {} ({}) 수집 시작", contentType, getContentTypeNameByCode(contentType));
                    
                    List<TourAPIResponse.Item> items = fetchTourismDataSecurely(areaCode, sigunguCode, contentType);
                    
                    log.info("📊 ContentType {} 수집 완료: {}개", getContentTypeNameByCode(contentType), items.size());
                    
                    addUniqueItems(allItems, items);
                    
                    // 🎯 충분한 데이터 수집 완료
                    int maxItems = 30;
                    if (allItems.size() >= maxItems) {
                        log.info("📊 충분한 여행 데이터 수집 완료: {}개 (최대 {}개)", allItems.size(), maxItems);
                        break;
                    }
                }
                
                // 최대 20개로 제한
                if (allItems.size() > 20) {
                    allItems = allItems.subList(0, 20);
                }
                
                log.info("✅ 여행 전용 데이터 수집 완료: {}개 (축제 완전 제외)", allItems.size());
                return allItems;
            }
            
        } catch (Exception e) {
            log.error("TourAPI 데이터 수집 중 오류", e);
        }
        
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
     * 두 지점 간의 거리를 계산 (Haversine 공식 사용)
     * @param lat1 첫 번째 지점의 위도
     * @param lon1 첫 번째 지점의 경도
     * @param lat2 두 번째 지점의 위도
     * @param lon2 두 번째 지점의 경도
     * @return 두 지점 간의 거리 (km)
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // 지구의 반지름 (km)
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c; // 거리 (km)
    }
    

    
    /**
     * TourAPI Item을 Map으로 변환
     */
    private Map<String, Object> convertToMap(TourAPIResponse.Item item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("title", item.getTitle());
        map.put("addr1", item.getAddr1());
        map.put("mapx", item.getMapX());
        map.put("mapy", item.getMapY());
        map.put("contenttypeid", item.getContentTypeId());
        map.put("firstimage", item.getFirstImage());
        map.put("tel", item.getTel());
        map.put("contentid", item.getContentId());
        map.put("eventstartdate", item.getEventStartDate());
        map.put("eventenddate", item.getEventEndDate());
        map.put("overview", item.getOverview());
        
        // contentTypeId에 따른 처리 및 detailCommon2 API 호출
        String contentTypeId = item.getContentTypeId();
        
        try {
            // 모든 타입에 대해 detailCommon2 API를 호출하여 상세 정보 가져오기
            TourAPIResponse.Item detailInfo = fetchDetailCommon2(item.getContentId());
            if (detailInfo != null) {
                // overview 정보 업데이트
                if (detailInfo.getOverview() != null && !detailInfo.getOverview().trim().isEmpty()) {
                    map.put("overview", detailInfo.getOverview());
                }
                
                if ("25".equals(contentTypeId)) {
                    // 여행코스는 "여행코스"로 표시
                    map.put("category", "여행코스");
                } else {
                    // 그 외 타입들은 실제 주소 정보로 표시
                    if (detailInfo.getAddr1() != null && !detailInfo.getAddr1().trim().isEmpty()) {
                        map.put("addr1", detailInfo.getAddr1());
                        map.put("category", detailInfo.getAddr1());
                    } else {
                        map.put("category", getContentTypeNameByCode(contentTypeId));
                    }
                }
            } else {
                // detailCommon2 호출 실패 시 기본 처리
                if ("25".equals(contentTypeId)) {
                    map.put("category", "여행코스");
                } else {
                    map.put("category", getContentTypeNameByCode(contentTypeId));
                }
            }
        } catch (Exception e) {
            log.warn("detailCommon2 API 호출 실패 - contentId: {}", item.getContentId(), e);
            if ("25".equals(contentTypeId)) {
                map.put("category", "여행코스");
            } else {
                map.put("category", getContentTypeNameByCode(contentTypeId));
            }
        }
        
        return map;
    }
    
    /**
     * TourAPI detailCommon2 호출하여 상세 정보 가져오기
     */
    private TourAPIResponse.Item fetchDetailCommon2(String contentId) {
        try {
            log.info("🔍 detailCommon2 API 호출 - contentId: {}", contentId);
            
            String url = UriComponentsBuilder.fromHttpUrl("https://apis.data.go.kr/B551011/KorService2/detailCommon2")
                    .queryParam("MobileOS", "ETC")
                    .queryParam("MobileApp", "festive")
                    .queryParam("contentId", contentId)
                    .build(false)
                    .toUriString() + "&serviceKey=" + tourApiServiceKey;
            
            log.debug("detailCommon2 URL: {}", url);
            
            ResponseEntity<String> response = restTemplate.getForEntity(java.net.URI.create(url), String.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String responseBody = response.getBody();
                log.debug("detailCommon2 응답 데이터 길이: {}", responseBody.length());
                
                // XML 응답 파싱
                List<TourAPIResponse.Item> items = parseDetailCommon2Response(responseBody);
                
                if (!items.isEmpty()) {
                    TourAPIResponse.Item item = items.get(0);
                    log.info("✅ detailCommon2 정보 조회 성공 - contentId: {}, addr1: {}, overview 길이: {}", 
                            contentId, item.getAddr1(), 
                            item.getOverview() != null ? item.getOverview().length() : 0);
                    return item;
                } else {
                    log.warn("⚠️ detailCommon2 응답에서 데이터를 찾을 수 없음 - contentId: {}", contentId);
                }
            } else {
                log.warn("⚠️ detailCommon2 API 호출 실패 - contentId: {}, 상태코드: {}", 
                        contentId, response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("detailCommon2 API 호출 중 오류 발생 - contentId: {}", contentId, e);
        }
        
        return null;
    }
    
    /**
     * detailCommon2 응답 파싱
     */
    private List<TourAPIResponse.Item> parseDetailCommon2Response(String response) {
        List<TourAPIResponse.Item> items = new ArrayList<>();
        
        try {
            // XML 파싱
            String itemsSection = response;
            
            // <item> 태그들 추출
            String[] itemBlocks = itemsSection.split("<item>");
            
            for (int i = 1; i < itemBlocks.length; i++) {
                String itemBlock = itemBlocks[i];
                if (itemBlock.contains("</item>")) {
                    itemBlock = itemBlock.substring(0, itemBlock.indexOf("</item>"));
                    TourAPIResponse.Item item = parseDetailCommon2Item(itemBlock);
                    if (item != null) {
                        items.add(item);
                    }
                }
            }
            
        } catch (Exception e) {
            log.error("detailCommon2 응답 파싱 실패", e);
        }
        
        return items;
    }
    
    /**
     * detailCommon2 개별 아이템 파싱
     */
    private TourAPIResponse.Item parseDetailCommon2Item(String xmlItem) {
        try {
            TourAPIResponse.Item item = new TourAPIResponse.Item();
            
            // addr1 추출
            String addr1 = extractXMLValue(xmlItem, "addr1");
            item.setAddr1(addr1);
            
            // overview 추출
            String overview = extractXMLValue(xmlItem, "overview");
            // HTML 태그 제거 및 특수문자 디코딩
            if (overview != null && !overview.trim().isEmpty()) {
                overview = overview.replaceAll("<[^>]*>", "") // HTML 태그 제거
                        .replace("&lt;", "<")
                        .replace("&gt;", ">")
                        .replace("&amp;", "&")
                        .replace("&quot;", "\"")
                        .replace("&#39;", "'")
                        .replace("&nbsp;", " ")
                        .trim();
            }
            item.setOverview(overview);
            
            // contentId 추출
            String contentId = extractXMLValue(xmlItem, "contentid");
            item.setContentId(contentId);
            
            log.debug("✅ detailCommon2 아이템 파싱 완료 - contentId: {}, addr1: {}, overview 길이: {}", 
                    contentId, addr1, overview != null ? overview.length() : 0);
            
            return item;
            
        } catch (Exception e) {
            log.error("detailCommon2 아이템 파싱 실패", e);
            return null;
        }
    }
    
    /**
     * 🚀 속도 개선: AI 없이 빠른 직접 분석 + 여행/축제 관련 질문만 허용
     */
    private TravelAnalysis createFastAnalysis(String userMessage) {
        try {
            log.info("⚡ 빠른 분석 시작: {}", userMessage);
            
            // 🚫 여행/축제 관련 질문인지 먼저 검증
            if (!isTravelOrFestivalRelated(userMessage)) {
                log.warn("❌ 여행/축제 관련 질문이 아님: {}", userMessage);
                throw new IllegalArgumentException("INVALID_REQUEST");
            }
            
            // 요청 타입 판별
            String requestType = "travel_only";
            String lowerMessage = userMessage.toLowerCase();
            
            if (lowerMessage.contains("축제") && (lowerMessage.contains("여행") || lowerMessage.contains("코스"))) {
                requestType = "festival_with_travel";
            } else if (lowerMessage.contains("축제") || lowerMessage.contains("불꽃") || lowerMessage.contains("벚꽃")) {
                requestType = "festival_only";
            }
            
            // 지역 정보 추출
            RegionInfo regionInfo = extractRegionInfo(userMessage);
            
            // 여행 기간 추출 - 더 강화된 로직
            String duration = extractDurationFromMessageEnhanced(userMessage);
            
            // 키워드 추출
            String keyword = extractKeywordFromRequest(userMessage);
            
            // 🎯 선호하는 contentType 감지
            String preferredContentType = detectPreferredContentType(userMessage);
            
            TravelAnalysis analysis = new TravelAnalysis(
                requestType, 
                regionInfo.getRegionName(), 
                keyword, 
                duration, 
                "여행/축제 전용 AI 분석 완료"
            );
            
            analysis.setAreaCode(regionInfo.getAreaCode());
            analysis.setSigunguCode(regionInfo.getSigunguCode());
            analysis.setPreferredContentType(preferredContentType);
            
            log.info("⚡ 여행/축제 전용 분석 완료 - 타입: {}, 지역: {}, 기간: {}, 키워드: {}, 선호ContentType: {}", 
                    requestType, regionInfo.getRegionName(), duration, keyword, 
                    preferredContentType != null ? getContentTypeNameByCode(preferredContentType) : "다양한 추천");
            
            return analysis;
            
        } catch (IllegalArgumentException e) {
            if ("INVALID_REQUEST".equals(e.getMessage())) {
                throw e; // 재던지기
            }
            log.error("빠른 분석 실패, 기본값 사용", e);
            
            // 기본값으로 전국 2박3일 여행 설정
            TravelAnalysis analysis = new TravelAnalysis(
                "travel_only", "전국", "관광", "2박3일", "여행/축제 전용 기본 분석"
            );
            analysis.setAreaCode(null); // 전국
            analysis.setSigunguCode(null);
            return analysis;
        } catch (Exception e) {
            log.error("빠른 분석 실패, 기본값 사용", e);
            
            // 기본값으로 전국 2박3일 여행 설정
            TravelAnalysis analysis = new TravelAnalysis(
                "travel_only", "전국", "관광", "2박3일", "여행/축제 전용 기본 분석"
            );
            analysis.setAreaCode(null); // 전국
            analysis.setSigunguCode(null);
            return analysis;
        }
    }
    
    /**
     * 🎯 사용자 요청에서 선호하는 contentType 감지 (복합 키워드 및 랜덤 선택 지원)
     */
    private String detectPreferredContentType(String message) {
        if (message == null || message.trim().isEmpty()) {
            return null;
        }
        
        String lowerMessage = message.toLowerCase().replace(" ", "");
        
        // 🚀 여행코스 위주 키워드 (구체적인 키워드만)
        String[] courseKeywords = {
            "여행코스위주", "코스위주", "루트위주", "코스추천", "루트추천", 
            "드라이브코스", "관광루트", "여행루트", "여행경로"
        };
        
        // 🏛️ 관광지 위주 키워드
        String[] attractionKeywords = {
            "관광지", "명소", "볼거리", "구경거리", "관광명소", "관광위주",
            "관광지위주", "명소위주", "볼거리위주", "유명한곳", "가볼만한곳"
        };
        
        // 🏃‍♀️ 레포츠 위주 키워드
        String[] sportsKeywords = {
            "레포츠", "체험", "액티비티", "스포츠", "모험", "야외활동",
            "레포츠위주", "체험위주", "액티비티위주", "활동적인", "어드벤처"
        };
        
        // 🏨 숙박시설 키워드
        String[] accommodationKeywords = {
            "숙박", "호텔", "펜션", "리조트", "게스트하우스", "민박",
            "숙박시설", "잠잘곳", "머물곳", "숙소", "숙박위주"
        };
        
        // 🛍️ 쇼핑 위주 키워드
        String[] shoppingKeywords = {
            "쇼핑", "백화점", "아울렛", "시장", "쇼핑몰", "구매",
            "쇼핑위주", "쇼핑센터", "마켓", "상점", "매장"
        };
        
        // 🍽️ 음식점/맛집 키워드
        String[] foodKeywords = {
            "맛집", "음식점", "식당", "먹거리", "음식", "요리",
            "맛집위주", "음식위주", "먹을거리", "미식", "그루메"
        };
        
        // 🎯 복합 키워드 감지 - 여러 타입이 동시에 언급된 경우
        List<String> detectedTypes = new ArrayList<>();
        
        // 각 키워드 타입별 매칭 검사
        for (String keyword : courseKeywords) {
            if (lowerMessage.contains(keyword)) {
                detectedTypes.add("25");
                log.info("🚀 여행코스 키워드 감지: {}", keyword);
                break;
            }
        }
        
        for (String keyword : attractionKeywords) {
            if (lowerMessage.contains(keyword)) {
                detectedTypes.add("12");
                log.info("🏛️ 관광지 키워드 감지: {}", keyword);
                break;
            }
        }
        
        for (String keyword : sportsKeywords) {
            if (lowerMessage.contains(keyword)) {
                detectedTypes.add("28");
                log.info("🏃‍♀️ 레포츠 키워드 감지: {}", keyword);
                break;
            }
        }
        
        for (String keyword : accommodationKeywords) {
            if (lowerMessage.contains(keyword)) {
                detectedTypes.add("32");
                log.info("🏨 숙박시설 키워드 감지: {}", keyword);
                break;
            }
        }
        
        for (String keyword : shoppingKeywords) {
            if (lowerMessage.contains(keyword)) {
                detectedTypes.add("38");
                log.info("🛍️ 쇼핑 키워드 감지: {}", keyword);
                break;
            }
        }
        
        for (String keyword : foodKeywords) {
            if (lowerMessage.contains(keyword)) {
                detectedTypes.add("39");
                log.info("🍽️ 음식점/맛집 키워드 감지: {}", keyword);
                break;
            }
        }
        
        // 🎲 결과 처리
        if (detectedTypes.isEmpty()) {
            // 일반적인 요청 (키워드 없음) - 랜덤 선택
            String[] randomTypes = {"25", "12", "14", "28", "32", "38", "39"}; // 다양한 타입
            String randomType = randomTypes[new java.util.Random().nextInt(randomTypes.length)];
            log.info("🎲 일반 요청 감지, 랜덤 선택: {} ({})", randomType, getContentTypeNameByCode(randomType));
            return randomType;
        } else if (detectedTypes.size() == 1) {
            // 단일 타입 요청
            String selectedType = detectedTypes.get(0);
            log.info("🎯 단일 타입 요청: {} ({})", selectedType, getContentTypeNameByCode(selectedType));
            return selectedType;
        } else {
            // 🌈 복합 키워드 요청 - 첫 번째 감지된 타입을 주 타입으로 사용하되, 다른 타입도 수집함을 표시
            String primaryType = detectedTypes.get(0);
            log.info("🌈 복합 키워드 요청 감지: {}개 타입, 주타입: {} ({})", 
                    detectedTypes.size(), primaryType, getContentTypeNameByCode(primaryType));
            
            // 복합 타입들을 쉼표로 구분하여 저장 (나중에 처리할 수 있도록)
            String combinedTypes = String.join(",", detectedTypes);
            log.info("🔗 복합 타입들: {}", combinedTypes);
            
            return "MULTI:" + combinedTypes; // 복합 타입 표시
        }
    }
    
    /**
     * 🔍 여행/축제 관련 질문인지 검증
     */
    private boolean isTravelOrFestivalRelated(String message) {
        if (message == null || message.trim().isEmpty()) {
            return false;
        }
        
        String lowerMessage = message.toLowerCase().replace(" ", "");
        
        // 🎯 여행 관련 키워드
        String[] travelKeywords = {
            "여행", "관광", "코스", "추천", "여행지", "관광지", "여행코스", "관광코스",
            "가볼만한곳", "구경", "둘러보기", "나들이", "드라이브", "당일치기",
            "1박2일", "2박3일", "3박4일", "박", "일", "숙박", "호텔", "펜션"
        };
        
        // 🎪 축제 관련 키워드  
        String[] festivalKeywords = {
            "축제", "불꽃", "벚꽃", "페스티벌", "행사", "이벤트", "문화제", "음악제",
            "먹거리", "체험", "공연", "전시", "박람회", "마켓", "장터"
        };
        
        // 🗺️ 지역 관련 키워드 (광역시/도 + 주요 도시)
        String[] regionKeywords = {
            // 광역시/도
            "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
            "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
            // 주요 도시들
            "통영", "거제", "김해", "진주", "창원", "밀양",  // 경남
            "경주", "포항", "안동", "구미", "영주",        // 경북  
            "여수", "순천", "목포", "광양", "보성",        // 전남
            "춘천", "강릉", "속초", "평창", "정선",        // 강원
            // 서울 주요 지역
            "강남", "강북", "홍대", "명동", "이태원", "압구정", "잠실", "송파"
        };
        
        // 여행 키워드 체크
        for (String keyword : travelKeywords) {
            if (lowerMessage.contains(keyword)) {
                log.debug("✅ 여행 키워드 감지: {}", keyword);
                return true;
            }
        }
        
        // 축제 키워드 체크
        for (String keyword : festivalKeywords) {
            if (lowerMessage.contains(keyword)) {
                log.debug("✅ 축제 키워드 감지: {}", keyword);
                return true;
            }
        }
        
        // 지역 키워드 + 기본 동사 조합 체크
        boolean hasRegion = false;
        for (String keyword : regionKeywords) {
            if (lowerMessage.contains(keyword)) {
                hasRegion = true;
                break;
            }
        }
        
        if (hasRegion) {
            String[] actionKeywords = {"가기", "가자", "갈래", "보기", "보자", "볼래", "알려줘", "추천"};
            for (String action : actionKeywords) {
                if (lowerMessage.contains(action)) {
                    log.debug("✅ 지역+액션 키워드 감지");
                    return true;
                }
            }
        }
        
        log.warn("❌ 여행/축제 관련 키워드 없음: {}", message);
        return false;
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
        private String preferredContentType; // 선호하는 contentType (25, 12, 28, 32, 38, 39)
        
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
            this.preferredContentType = null; // 기본값
        }
        
        public String getRequestType() { return requestType; }
        public String getRegion() { return region; }
        public String getKeyword() { return keyword; }
        public String getDuration() { return duration; }
        public String getIntent() { return intent; }
        public String getAreaCode() { return areaCode; }
        public String getSigunguCode() { return sigunguCode; }
        public String getPreferredContentType() { return preferredContentType; }
        
        public void setAreaCode(String areaCode) { this.areaCode = areaCode; }
        public void setSigunguCode(String sigunguCode) { this.sigunguCode = sigunguCode; }
        public void setPreferredContentType(String preferredContentType) { this.preferredContentType = preferredContentType; }
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
        if (userMessage == null) return new RegionInfo(null, null, "전국");
        
        log.info("🔍 지역 정보 추출 시작: '{}'", userMessage);
        
        // 🎯 간단한 지역 매핑 - 주요 도시/지역명 직접 매핑
        String lowerMessage = userMessage.toLowerCase();
        
        // 🌍 전국 키워드 체크
        if (lowerMessage.contains("전국") || lowerMessage.contains("전체") || lowerMessage.contains("모든")) {
            log.info("🌍 전국 키워드 감지 -> 전국 검색");
            return new RegionInfo(null, null, "전국");
        }
        
        // 경상남도 주요 도시 (통영 포함)
        if (lowerMessage.contains("통영") || lowerMessage.contains("거제") || lowerMessage.contains("김해") || 
            lowerMessage.contains("진주") || lowerMessage.contains("창원") || lowerMessage.contains("밀양")) {
            
            // 통영의 경우 시군구 코드도 함께 설정
            if (lowerMessage.contains("통영")) {
                log.info("🏘️ 통영시 감지 -> 지역코드: 36, 시군구코드: 36_17");
                return new RegionInfo("36", "36_17", "통영시");
            }
            
            log.info("🏘️ 경상남도 도시 감지 -> 지역코드: 36");
            return new RegionInfo("36", null, "경상남도");
        }
        
        // 경상북도 주요 도시
        if (lowerMessage.contains("경주") || lowerMessage.contains("포항") || lowerMessage.contains("안동") || 
            lowerMessage.contains("구미") || lowerMessage.contains("영주")) {
            log.info("🏘️ 경상북도 도시 감지 -> 지역코드: 35");
            return new RegionInfo("35", null, "경상북도");
        }
        
        // 전라남도 주요 도시
        if (lowerMessage.contains("여수") || lowerMessage.contains("순천") || lowerMessage.contains("목포") || 
            lowerMessage.contains("광양") || lowerMessage.contains("보성")) {
            log.info("🏘️ 전라남도 도시 감지 -> 지역코드: 38");
            return new RegionInfo("38", null, "전라남도");
        }
        
        // 강원도 주요 도시
        if (lowerMessage.contains("춘천") || lowerMessage.contains("강릉") || lowerMessage.contains("속초") || 
            lowerMessage.contains("평창") || lowerMessage.contains("정선")) {
            log.info("🏘️ 강원도 도시 감지 -> 지역코드: 32");
            return new RegionInfo("32", null, "강원도");
        }
        
        // 제주도
        if (lowerMessage.contains("제주") || lowerMessage.contains("서귀포")) {
            log.info("🏘️ 제주도 감지 -> 지역코드: 39");
            return new RegionInfo("39", null, "제주도");
        }
        
        // 광역시/도에서 찾기
        for (String regionName : AREA_CODE_MAP.keySet()) {
            if (userMessage.contains(regionName)) {
                String areaCode = AREA_CODE_MAP.get(regionName);
                log.info("🗺️ 광역시/도 감지: '{}' -> 지역코드: {}", regionName, areaCode);
                return new RegionInfo(areaCode, null, regionName);
            }
        }
        
        log.info("⚠️ 지역 매칭 실패, 기본값(전국) 사용");
        return new RegionInfo(null, null, "전국"); // 기본값을 전국으로 변경
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
        // TourAPI 전용 프로젝트에서는 더 이상 사용되지 않음
        return null;
    }
    
    /**
     * 🌐 백엔드에서 안전한 TourAPI 호출 (서비스키 보호)
     */
    private List<TourAPIResponse.Item> fetchTourismDataSecurely(String areaCode, String sigunguCode, String contentTypeId) {
        try {
            String baseUrl = "https://apis.data.go.kr/B551011/KorService2/areaBasedList2";
            
            // UriComponentsBuilder로 기본 파라미터 구성 (서비스키 제외)
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("numOfRows", "30")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive") // 정상 버전
                .queryParam("_type", "json") // JSON 응답 요청
                .queryParam("arrange", "o")
                .queryParam("contentTypeId", contentTypeId);
            
            // areaCode가 있을 때만 추가 (null이면 전국 검색)
            if (areaCode != null && !areaCode.isEmpty()) {
                builder.queryParam("areaCode", areaCode);
                log.info("🗺️ 지역 코드 적용: {}", areaCode);
            } else {
                log.info("🌍 전국 검색 모드");
            }
            
            // 시군구 코드가 있으면 추가 (36_17 형태에서 17만 추출)
            if (sigunguCode != null && !sigunguCode.isEmpty()) {
                String actualSigunguCode = sigunguCode;
                if (sigunguCode.contains("_")) {
                    actualSigunguCode = sigunguCode.split("_")[1];
                }
                builder.queryParam("sigunguCode", actualSigunguCode);
                log.info("🏘️ 시군구 코드 적용: {} -> {}", sigunguCode, actualSigunguCode);
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
            
            // 🔤 한글 키워드 URL 인코딩
            String encodedKeyword;
            try {
                encodedKeyword = java.net.URLEncoder.encode(keyword, "UTF-8");
            } catch (java.io.UnsupportedEncodingException e) {
                log.error("키워드 인코딩 실패: {}", keyword, e);
                encodedKeyword = keyword; // 폴백: 원본 키워드 사용
            }
            
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("numOfRows", "50")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("arrange", "O");  // 이미지가 있는 데이터 우선 정렬
            
            // areaCode가 있을 때만 추가 (null이면 전국 검색)
            if (areaCode != null && !areaCode.isEmpty()) {
                builder.queryParam("areaCode", areaCode);
                log.info("🗺️ 키워드 검색 지역 코드 적용: {}", areaCode);
            } else {
                log.info("🌍 키워드 검색 전국 모드");
            }
            
            if (sigunguCode != null && !sigunguCode.isEmpty()) {
                String actualSigunguCode = sigunguCode;
                if (sigunguCode.contains("_")) {
                    actualSigunguCode = sigunguCode.split("_")[1];
                }
                builder.queryParam("sigunguCode", actualSigunguCode);
            }
            
            // 인코딩된 키워드를 수동으로 추가
            String urlWithoutServiceKey = builder.toUriString();
            String finalUrl = urlWithoutServiceKey + "&keyword=" + encodedKeyword + "&serviceKey=" + tourApiServiceKey;
            
            log.info("🔍 키워드 검색: '{}' -> '{}', 지역코드={}, 시군구코드={}", 
                    keyword, encodedKeyword, areaCode, sigunguCode != null ? sigunguCode : "없음");
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
                
                // 🎪 축제 데이터 필터링 및 로깅
                List<TourAPIResponse.Item> festivalItems = items.stream()
                    .filter(item -> "15".equals(item.getContentTypeId()))
                    .collect(Collectors.toList());
                
                if (!festivalItems.isEmpty()) {
                    log.info("🎭 키워드 검색에서 축제 발견: {}개", festivalItems.size());
                    for (int i = 0; i < Math.min(3, festivalItems.size()); i++) {
                        TourAPIResponse.Item festival = festivalItems.get(i);
                        log.info("  - 축제 샘플 {}: {} (시작:{}, 종료:{}, 이미지:{})", 
                            i+1, festival.getTitle(), festival.getEventStartDate(), festival.getEventEndDate(),
                            festival.getFirstImage() != null ? "있음" : "없음");
                    }
                }
                
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
                .queryParam("numOfRows", "50")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("arrange", "O")  // 이미지가 있는 데이터 우선 정렬
                .queryParam("eventStartDate", today);
            
            // areaCode가 있을 때만 추가 (null이면 전국 검색)
            if (areaCode != null && !areaCode.isEmpty()) {
                builder.queryParam("areaCode", areaCode);
                log.info("🗺️ 축제 검색 지역 코드 적용: {}", areaCode);
            } else {
                log.info("🌍 축제 검색 전국 모드");
            }
            
            if (sigunguCode != null && !sigunguCode.isEmpty()) {
                String actualSigunguCode = sigunguCode;
                if (sigunguCode.contains("_")) {
                    actualSigunguCode = sigunguCode.split("_")[1];
                }
                builder.queryParam("sigunguCode", actualSigunguCode);
            }
            
            String urlWithoutServiceKey = builder.toUriString();
            String finalUrl = urlWithoutServiceKey + "&serviceKey=" + tourApiServiceKey;
            
            log.info("🎪 축제 검색: 지역코드={}, 시군구코드={}, 시작일={}", 
                    areaCode, sigunguCode != null ? sigunguCode : "없음", today);
            log.info("📡 축제 검색 URL: {}", finalUrl);
            
            ResponseEntity<String> response = restTemplate.getForEntity(java.net.URI.create(finalUrl), String.class);
            
            log.info("📥 축제 검색 응답 상태: {}", response.getStatusCode());
            if (response.getBody() != null) {
                log.info("📄 축제 검색 응답 데이터 (처음 1000자): {}", 
                    response.getBody().length() > 1000 ? response.getBody().substring(0, 1000) + "..." : response.getBody());
            }
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<TourAPIResponse.Item> items = parseTourAPIResponse(response.getBody());
                log.info("✅ 축제 검색 성공: {}개 데이터", items.size());
                
                // 🎪 축제 데이터만 필터링 및 로깅
                List<TourAPIResponse.Item> festivalItems = items.stream()
                    .filter(item -> "15".equals(item.getContentTypeId()))
                    .collect(Collectors.toList());
                
                log.info("🎭 축제(contentTypeId=15) 필터링 결과: {}개", festivalItems.size());
                
                // 축제 데이터 샘플 로깅
                for (int i = 0; i < Math.min(3, festivalItems.size()); i++) {
                    TourAPIResponse.Item festival = festivalItems.get(i);
                    log.info("  - 축제 샘플 {}: {} (시작:{}, 종료:{}, 이미지:{})", 
                        i+1, festival.getTitle(), festival.getEventStartDate(), festival.getEventEndDate(),
                        festival.getFirstImage() != null ? "있음" : "없음");
                }
                
                return items; // 원본 items 반환 (다른 타입도 포함)
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
                    TourAPIResponse.Item item = parseJsonNodeToItem(itemNode);
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
     * JsonNode를 TourAPIResponse.Item으로 변환
     */
    private TourAPIResponse.Item parseJsonNodeToItem(JsonNode itemNode) {
        try {
            TourAPIResponse.Item item = new TourAPIResponse.Item();
            
            item.setTitle(getJsonNodeValue(itemNode, "title"));
            item.setAddr1(getJsonNodeValue(itemNode, "addr1"));
            item.setMapX(getJsonNodeValue(itemNode, "mapx"));
            item.setMapY(getJsonNodeValue(itemNode, "mapy"));
            item.setContentTypeId(getJsonNodeValue(itemNode, "contenttypeid"));
            item.setFirstImage(getJsonNodeValue(itemNode, "firstimage"));
            item.setTel(getJsonNodeValue(itemNode, "tel"));
            item.setContentId(getJsonNodeValue(itemNode, "contentid"));
            
            // 축제 데이터에 필요한 추가 필드들 파싱
            if ("15".equals(item.getContentTypeId())) {
                item.setEventStartDate(getJsonNodeValue(itemNode, "eventstartdate"));
                item.setEventEndDate(getJsonNodeValue(itemNode, "eventenddate"));
            }
            
            // 필수 정보가 있는지 확인 - 축제는 좌표 없어도 허용
            if (item.getTitle() != null) {
                // 축제(contentTypeId=15)는 좌표가 없어도 허용
                if ("15".equals(item.getContentTypeId())) {
                    return item;
                }
                // 다른 타입은 좌표 필수
                if (item.getMapX() != null && item.getMapY() != null) {
                    return item;
                }
            }
            
        } catch (Exception e) {
            log.debug("JSON 아이템 파싱 실패", e);
        }
        return null;
    }
    
    /**
     * JsonNode에서 특정 필드 값 추출
     */
    private String getJsonNodeValue(JsonNode node, String fieldName) {
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
            
            // 🎪 축제 데이터에 필요한 추가 필드들 파싱
            String contentTypeId = item.getContentTypeId();
            if ("15".equals(contentTypeId)) {
                item.setEventStartDate(extractXMLValue(xmlItem, "eventstartdate"));
                item.setEventEndDate(extractXMLValue(xmlItem, "eventenddate"));
                log.debug("🎭 축제 XML 파싱: {} (시작:{}, 종료:{})", 
                    item.getTitle(), item.getEventStartDate(), item.getEventEndDate());
            }
            
            // 필수 정보가 있는지 확인 - 축제는 좌표 없어도 허용
            if (item.getTitle() != null) {
                // 축제(contentTypeId=15)는 좌표가 없어도 허용
                if ("15".equals(contentTypeId)) {
                    return item;
                }
                // 다른 타입은 좌표 필수
                if (item.getMapX() != null && item.getMapY() != null) {
                    return item;
                }
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
            private String eventStartDate; // 축제 시작일
            private String eventEndDate;   // 축제 종료일
            private String overview;       // 개요/소개글
            
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
            
            public String getEventStartDate() { return eventStartDate; }
            public void setEventStartDate(String eventStartDate) { this.eventStartDate = eventStartDate; }
            
            public String getEventEndDate() { return eventEndDate; }
            public void setEventEndDate(String eventEndDate) { this.eventEndDate = eventEndDate; }
            
            public String getOverview() { return overview; }
            public void setOverview(String overview) { this.overview = overview; }
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
        
        return createLocationsFromTourAPIDataWithPreference(tourApiData, requiredPlaces, totalDays, null);
    }
    
    /**
     * 선호하는 contentType을 고려한 위치 생성
     */
    private List<ChatResponse.LocationInfo> createLocationsFromTourAPIDataWithPreference(
            List<Map<String, Object>> tourApiData, int requiredPlaces, int totalDays, String preferredContentType) {
        
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        Set<String> usedPlaces = new HashSet<>(); // 중복 방지용
        
        log.info("🎯 위치 생성 시작 - 총 {}개 데이터, 필요 {}개, {}일 일정, 선호타입: {}", 
            tourApiData.size(), requiredPlaces, totalDays, 
            preferredContentType != null ? getContentTypeNameByCode(preferredContentType) : "다양한 추천");
        
        // 🎪 축제 검색인지 확인 - 축제 데이터가 있고 다른 타입이 적으면 축제 검색으로 판단
        long festivalCount = tourApiData.stream()
            .filter(data -> "15".equals(String.valueOf(data.get("contenttypeid"))))
            .count();
        long otherCount = tourApiData.stream()
            .filter(data -> !"15".equals(String.valueOf(data.get("contenttypeid"))))
            .count();
            
        boolean isFestivalSearch = festivalCount > 0 && festivalCount >= otherCount;
        
        if (isFestivalSearch) {
            log.info("🎪 축제 검색 감지 - 축제 데이터를 locations로 변환: {}개", festivalCount);
            
            // 축제 데이터를 locations로 변환
            List<Map<String, Object>> festivalData = tourApiData.stream()
                .filter(data -> "15".equals(String.valueOf(data.get("contenttypeid"))))
                .collect(Collectors.toList());
                
            for (Map<String, Object> data : festivalData) {
                try {
                    String mapX = String.valueOf(data.get("mapx"));
                    String mapY = String.valueOf(data.get("mapy"));
                    String title = String.valueOf(data.get("title"));
                    
                    if (!"null".equals(mapX) && !"null".equals(mapY) && 
                        !"null".equals(title) && !mapX.isEmpty() && !mapY.isEmpty()) {
                        
                        // ✅ 이미 축제 정보 생성 단계에서 좌표 유효성 검사를 통과한 데이터만 여기에 도달
                        double latitude = Double.parseDouble(mapY); // 위도
                        double longitude = Double.parseDouble(mapX); // 경도
                        
                        ChatResponse.LocationInfo location = new ChatResponse.LocationInfo();
                        location.setName(title);
                        location.setLatitude(latitude);
                        location.setLongitude(longitude);
                        location.setDay(1); // 축제는 모두 1일차로 설정
                        location.setTime("종일");
                        location.setDescription(String.valueOf(data.get("addr1")));
                        location.setImage(String.valueOf(data.get("firstimage")));
                        location.setCategory("축제");
                        
                        locations.add(location);
                        log.info("🎪 축제 마커 생성: {} - 위도: {}, 경도: {}", 
                                location.getName(), location.getLatitude(), location.getLongitude());
                    }
                } catch (Exception e) {
                    log.warn("축제 위치 정보 생성 실패: {}", data.get("title"), e);
                }
            }
            
            log.info("✅ 축제 locations 생성 완료: {}개", locations.size());
            return locations;
        }
        
        // 🎯 모든 종류의 장소들을 분류
        Map<String, List<Map<String, Object>>> placesByType = new HashMap<>();
        String[] allTypes = {"25", "12", "14", "15", "28", "32", "38", "39"}; // 여행코스, 관광지, 문화시설, 축제, 레포츠, 숙박, 쇼핑, 음식점
        
        for (String type : allTypes) {
            List<Map<String, Object>> places = tourApiData.stream()
                .filter(data -> {
                    String contentTypeId = String.valueOf(data.get("contenttypeid"));
                    return type.equals(contentTypeId);
                })
                .collect(Collectors.toList());
            placesByType.put(type, places);
            
            log.info("📊 타입 {} ({}) 분류 완료: {}개", 
                type, getContentTypeNameByCode(type), places.size());
                
            // 각 타입별 샘플 데이터 로그
            if (!places.isEmpty()) {
                Map<String, Object> sample = places.get(0);
                log.debug("  - 샘플: {} (ID: {})", sample.get("title"), sample.get("contentid"));
            }
        }
        
        // 🎯 선호 타입별 처리 분기
        if (preferredContentType != null) {
            log.info("🎯 {} 위주 추천 모드 시작", getContentTypeNameByCode(preferredContentType));
            
            if ("25".equals(preferredContentType)) {
                // 🚀 여행코스 위주 모드
                return createTravelCoursePreferredSchedule(placesByType, requiredPlaces, totalDays, usedPlaces);
            } else if ("12".equals(preferredContentType)) {
                // 🏛️ 관광지 위주 모드
                return createAttractionPreferredSchedule(placesByType, requiredPlaces, totalDays, usedPlaces);
            } else if ("39".equals(preferredContentType)) {
                // 🍽️ 맛집 위주 모드
                return createFoodPreferredSchedule(placesByType, requiredPlaces, totalDays, usedPlaces);
            } else {
                // 🎨 기타 특정 타입 위주 모드
                return createSpecificTypePreferredSchedule(placesByType, preferredContentType, requiredPlaces, totalDays, usedPlaces);
            }
        } else {
            // 🌈 다양한 추천 모드
            return createDiverseSchedule(placesByType, requiredPlaces, totalDays, usedPlaces);
        }
    }
    
    /**
     * 🚀 여행코스 위주 일정 생성
     */
    private List<ChatResponse.LocationInfo> createTravelCoursePreferredSchedule(
            Map<String, List<Map<String, Object>>> placesByType, int requiredPlaces, int totalDays, Set<String> usedPlaces) {
        
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        List<Map<String, Object>> travelCourses = placesByType.get("25");
        
        log.info("🚀 여행코스 위주 일정 생성 - 여행코스: {}개 사용 가능", travelCourses.size());
        
        int currentDay = 1;
        int placesPerDay = Math.max(3, requiredPlaces / totalDays);
        
        for (int i = 0; i < requiredPlaces && currentDay <= totalDays; i++) {
            // 장소 선택: 여행코스 우선, 그 다음 관광지
            Map<String, Object> selectedPlace = selectNextPlace(Arrays.asList(
                placesByType.get("25"), // 여행코스 우선
                placesByType.get("12"), // 관광지
                placesByType.get("39")  // 음식점
            ), usedPlaces);
            
            if (selectedPlace != null) {
                ChatResponse.LocationInfo location = createLocationInfo(selectedPlace, currentDay, null);
                locations.add(location);
                usedPlaces.add(String.valueOf(selectedPlace.get("title")));
                
                log.info("✅ Day {} 추가: {} ({})", 
                    currentDay, selectedPlace.get("title"), 
                    getContentTypeNameByCode(String.valueOf(selectedPlace.get("contenttypeid"))));
            }
            
            // Day 변경 로직
            if ((i + 1) % placesPerDay == 0) {
                currentDay++;
                log.info("📅 Day {} 완료, Day {}로 이동", currentDay - 1, currentDay);
            }
        }
        
        return locations;
    }
    
    /**
     * 🏛️ 관광지 위주 일정 생성
     */
    private List<ChatResponse.LocationInfo> createAttractionPreferredSchedule(
            Map<String, List<Map<String, Object>>> placesByType, int requiredPlaces, int totalDays, Set<String> usedPlaces) {
        
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        log.info("🏛️ 관광지 위주 일정 생성 - 관광지: {}개, 여행코스: {}개 사용 가능", 
            placesByType.get("12").size(), placesByType.get("25").size());
        
        int currentDay = 1;
        int placesPerDay = Math.max(3, requiredPlaces / totalDays);
        
        for (int i = 0; i < requiredPlaces && currentDay <= totalDays; i++) {
            // 장소 선택: 관광지 > 여행코스 > 문화시설 > 음식점 순
            Map<String, Object> selectedPlace = selectNextPlace(Arrays.asList(
                placesByType.get("12"), // 관광지 우선
                placesByType.get("25"), // 여행코스
                placesByType.get("14"), // 문화시설
                placesByType.get("39")  // 음식점
            ), usedPlaces);
            
            if (selectedPlace != null) {
                ChatResponse.LocationInfo location = createLocationInfo(selectedPlace, currentDay, null);
                locations.add(location);
                usedPlaces.add(String.valueOf(selectedPlace.get("title")));
                
                log.info("✅ Day {} 추가: {} ({})", 
                    currentDay, selectedPlace.get("title"), 
                    getContentTypeNameByCode(String.valueOf(selectedPlace.get("contenttypeid"))));
            }
            
            if ((i + 1) % placesPerDay == 0) {
                currentDay++;
                log.info("📅 Day {} 완료, Day {}로 이동", currentDay - 1, currentDay);
            }
        }
        
        return locations;
    }
    
    /**
     * 🍽️ 맛집 위주 일정 생성
     */
    private List<ChatResponse.LocationInfo> createFoodPreferredSchedule(
            Map<String, List<Map<String, Object>>> placesByType, int requiredPlaces, int totalDays, Set<String> usedPlaces) {
        
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        log.info("🍽️ 맛집 위주 일정 생성 - 음식점: {}개 사용 가능", placesByType.get("39").size());
        
        int currentDay = 1;
        int placesPerDay = Math.max(3, requiredPlaces / totalDays);
        
        for (int i = 0; i < requiredPlaces && currentDay <= totalDays; i++) {
            // 장소 선택: 음식점 위주로, 중간에 관광지나 쇼핑몰 배치
            Map<String, Object> selectedPlace = selectNextPlace(Arrays.asList(
                placesByType.get("39"), // 음식점 우선
                placesByType.get("12"), // 관광지
                placesByType.get("38"), // 쇼핑
                placesByType.get("25")  // 여행코스
            ), usedPlaces);
            
            if (selectedPlace != null) {
                ChatResponse.LocationInfo location = createLocationInfo(selectedPlace, currentDay, null);
                locations.add(location);
                usedPlaces.add(String.valueOf(selectedPlace.get("title")));
                
                log.info("✅ Day {} 추가: {} ({})", 
                    currentDay, selectedPlace.get("title"), 
                    getContentTypeNameByCode(String.valueOf(selectedPlace.get("contenttypeid"))));
            }
            
            if ((i + 1) % placesPerDay == 0) {
                currentDay++;
                log.info("📅 Day {} 완료, Day {}로 이동", currentDay - 1, currentDay);
            }
        }
        
        return locations;
    }
    
    /**
     * 🎨 기타 특정 타입 위주 일정 생성
     */
    private List<ChatResponse.LocationInfo> createSpecificTypePreferredSchedule(
            Map<String, List<Map<String, Object>>> placesByType, String preferredType, 
            int requiredPlaces, int totalDays, Set<String> usedPlaces) {
        
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        log.info("🎨 {} 위주 일정 생성", getContentTypeNameByCode(preferredType));
        
        int currentDay = 1;
        int placesPerDay = Math.max(3, requiredPlaces / totalDays);
        
        for (int i = 0; i < requiredPlaces && currentDay <= totalDays; i++) {
            // 장소 선택: 선호 타입 우선, 그 다음 관광지, 여행코스 순
            Map<String, Object> selectedPlace = selectNextPlace(Arrays.asList(
                placesByType.get(preferredType), // 선호 타입 우선
                placesByType.get("12"), // 관광지
                placesByType.get("25"), // 여행코스
                placesByType.get("39")  // 음식점
            ), usedPlaces);
            
            if (selectedPlace != null) {
                ChatResponse.LocationInfo location = createLocationInfo(selectedPlace, currentDay, null);
                locations.add(location);
                usedPlaces.add(String.valueOf(selectedPlace.get("title")));
                
                log.info("✅ Day {} 추가: {} ({})", 
                    currentDay, selectedPlace.get("title"), 
                    getContentTypeNameByCode(String.valueOf(selectedPlace.get("contenttypeid"))));
            }
            
            if ((i + 1) % placesPerDay == 0) {
                currentDay++;
                log.info("📅 Day {} 완료, Day {}로 이동", currentDay - 1, currentDay);
            }
        }
        
        return locations;
    }
    
    /**
     * 🌈 다양한 추천 일정 생성
     */
    private List<ChatResponse.LocationInfo> createDiverseSchedule(
            Map<String, List<Map<String, Object>>> placesByType, int requiredPlaces, int totalDays, Set<String> usedPlaces) {
        
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        log.info("🌈 다양한 추천 일정 생성");
        
        int currentDay = 1;
        int placesPerDay = Math.max(3, requiredPlaces / totalDays);
        
        for (int i = 0; i < requiredPlaces && currentDay <= totalDays; i++) {
            // 장소 선택: 다양한 타입을 순환하며 선택
            Map<String, Object> selectedPlace = selectNextPlace(Arrays.asList(
                placesByType.get("25"), // 여행코스
                placesByType.get("12"), // 관광지
                placesByType.get("39"), // 음식점
                placesByType.get("14"), // 문화시설
                placesByType.get("28"), // 레포츠
                placesByType.get("38")  // 쇼핑
            ), usedPlaces);
            
            if (selectedPlace != null) {
                ChatResponse.LocationInfo location = createLocationInfo(selectedPlace, currentDay, null);
                locations.add(location);
                usedPlaces.add(String.valueOf(selectedPlace.get("title")));
                
                log.info("✅ Day {} 추가: {} ({})", 
                    currentDay, selectedPlace.get("title"), 
                    getContentTypeNameByCode(String.valueOf(selectedPlace.get("contenttypeid"))));
            }
            
            if ((i + 1) % placesPerDay == 0) {
                currentDay++;
                log.info("📅 Day {} 완료, Day {}로 이동", currentDay - 1, currentDay);
            }
        }
        
        return locations;
    }
    
    /**
     * 🎯 우선순위에 따라 다음 장소 선택 (중복 방지)
     */
    private Map<String, Object> selectNextPlace(List<List<Map<String, Object>>> priorityLists, Set<String> usedPlaces) {
        for (List<Map<String, Object>> places : priorityLists) {
            if (places != null) {
                for (Map<String, Object> place : places) {
                    String title = String.valueOf(place.get("title"));
                    if (!usedPlaces.contains(title)) {
                        return place;
                    }
                }
            }
        }
        return null; // 사용 가능한 장소 없음
    }
    
    /**
     * 단일 위치 정보 생성 헬퍼 메소드
     */
    private ChatResponse.LocationInfo createLocationInfo(Map<String, Object> data, int day, String time) {
        try {
            String mapX = String.valueOf(data.get("mapx"));
            String mapY = String.valueOf(data.get("mapy"));
            String title = String.valueOf(data.get("title"));
            String addr1 = String.valueOf(data.get("addr1"));
            String contentTypeId = String.valueOf(data.get("contenttypeid"));
            
            // 좌표가 있는 데이터만 처리
            if (!"null".equals(mapX) && !"null".equals(mapY) && 
                !"null".equals(title) && !mapX.isEmpty() && !mapY.isEmpty()) {
                
                double latitude = Double.parseDouble(mapY); // 위도
                double longitude = Double.parseDouble(mapX); // 경도
                
                // ✅ 한국 좌표 유효성 검사
                if (!isValidKoreanCoordinate(latitude, longitude)) {
                    log.warn("❌ 잘못된 여행지 좌표 필터링: {} - 위도: {}, 경도: {} (한국 영역 밖)", title, latitude, longitude);
                    return null; // 잘못된 좌표는 위치 정보 생성하지 않음
                }
                
                ChatResponse.LocationInfo location = new ChatResponse.LocationInfo();
                location.setName(title);
                location.setLatitude(latitude);
                location.setLongitude(longitude);
                location.setDay(day);
                if (time != null) {
                    location.setTime(time);
                }
                
                // 🏠 시/군/구 정보 설정
                String cityDistrict = null;
                
                // 🎯 여행코스 데이터 특별 처리
                if ("25".equals(contentTypeId)) {
                    cityDistrict = extractRegionFromTravelCourseTitle(title);
                }
                
                // 주소에서 추출 시도
                if (cityDistrict == null && addr1 != null && !"null".equals(addr1) && !addr1.trim().isEmpty()) {
                    cityDistrict = extractCityDistrictFromAddress(addr1);
                }
                
                // 폴백 처리
                if (cityDistrict == null || "정보 없음".equals(cityDistrict)) {
                    if ("25".equals(contentTypeId)) {
                        cityDistrict = "다양한 지역 코스";
                    } else {
                        String category = getContentTypeNameByCode(contentTypeId);
                        cityDistrict = category + " 관련 장소";
                    }
                }
                
                // 📍 주소 정보를 description에 설정
                String finalDescription;
                
                if ("25".equals(contentTypeId)) {
                    // 여행코스는 지역 정보 표시
                    finalDescription = cityDistrict;
                } else {
                    // 그 외 타입들은 실제 주소 표시
                    if (addr1 != null && !"null".equals(addr1) && !addr1.trim().isEmpty()) {
                        finalDescription = addr1.trim();
                    } else {
                        finalDescription = cityDistrict;
                    }
                }
                
                location.setDescription(finalDescription);
                
                // 🖼️ 이미지 설정
                String firstImage = String.valueOf(data.get("firstimage"));
                if (firstImage != null && 
                    !"null".equals(firstImage) && 
                    !firstImage.trim().isEmpty() &&
                    !"undefined".equals(firstImage) &&
                    firstImage.startsWith("http")) {
                    location.setImage(firstImage.trim());
                }
                
                // 콘텐츠 타입별 카테고리 설정
                location.setCategory(getContentTypeNameByCode(contentTypeId));
                
                // 🎯 TourAPI 정보 설정 (DB 저장용)
                String contentId = String.valueOf(data.get("contentid"));
                if (contentId != null && !"null".equals(contentId) && !contentId.trim().isEmpty()) {
                    location.setContentId(contentId.trim());
                }
                location.setContentTypeId(contentTypeId);
                
                return location;
            }
        } catch (Exception e) {
            log.debug("위치 정보 생성 실패: {}", data.get("title"), e);
        }
        
        return null;
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
                  .append(placesForThisDay).append("개 장소 추천 (여행코스 1개 + 다양한 종류의 장소들)\n");
        }
        
        prompt.append("2. **각 Day별 구성 원칙**: 여행코스(25) 1개 + 다양한 종류의 장소들 (관광지, 문화시설, 레포츠, 쇼핑, 음식점 등)\n");
        prompt.append("3. **시간대별 최적화**: 점심/저녁시간-음식점, 오후-쇼핑/문화시설, 오전-관광지/레포츠, 저녁-축제공연\n");
        prompt.append("4. 같은 Day 내 장소들은 서로 20km 이내에 위치하도록 배치\n");
        prompt.append("5. 위의 TourAPI 실제 데이터를 **최대한 우선적으로** 사용해주세요\n");
        prompt.append("6. 데이터가 부족하면 해당 시간대에 적합한 장소로 보완하되, 반드시 Day별 개수를 맞춰주세요\n");
        prompt.append("7. 각 장소마다 '@location:[위도,경도] @day:숫자' 형식 필수 포함\n");
        prompt.append("8. Day별로 시간순 배치하되 시간대별 특성 고려 (오전-관광지, 점심-음식점, 오후-쇼핑/문화, 저녁-축제)\n");
        prompt.append("9. 이모지나 특수기호는 사용하지 마세요\n");
        prompt.append("10. 자연스러운 한국어로 작성해주세요\n\n");
        
        prompt.append("🗓️ **응답 형식 예시**:\n");
        prompt.append("Day 1\n");
        prompt.append("오전 9:00 - [여행코스명] @location:[위도,경도] @day:1\n");
        prompt.append("오전 10:00 - [관광지명] @location:[위도,경도] @day:1\n");
        prompt.append("오후 12:00 - [음식점명] @location:[위도,경도] @day:1\n");
        prompt.append("오후 14:00 - [문화시설명] @location:[위도,경도] @day:1\n");
        prompt.append("오후 16:00 - [쇼핑몰명] @location:[위도,경도] @day:1\n");
        prompt.append("오후 18:00 - [음식점명] @location:[위도,경도] @day:1\n\n");
        prompt.append("Day 2\n");
        prompt.append("오전 9:00 - [여행코스명] @location:[위도,경도] @day:2\n");
        prompt.append("오전 10:00 - [레포츠시설명] @location:[위도,경도] @day:2\n");
        prompt.append("오후 19:00 - [축제행사명] @location:[위도,경도] @day:2\n");
        prompt.append("...\n\n");
        
        prompt.append("🎯 **").append(duration).append(" 일정으로 총 ").append(totalDays)
              .append("일간 다양하고 실용적인 Day별 여행코스를 정확히 추천해주세요!**\n");
        prompt.append("(TourAPI 실제 데이터 우선 + 다양한 종류의 장소 조합 + 시간대별 최적화 + Day별 정확한 분배)");
        
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
     * 기간별 필요 장소 수 계산 (day별 4-5개 보장)
     */
    private int calculateRequiredPlaces(String duration) {
        int totalDays = getTotalDaysFromDuration(duration);
        int placesPerDay = 4; // day별 기본 4개 (기존 3개에서 증가)
        int baseRequirement = totalDays * placesPerDay;
        
        // 기간별 추가 장소 할당 (더 긴 기간일수록 여유롭게)
        switch (duration) {
            case "당일치기": 
                return Math.max(baseRequirement, 4); // 1일 * 4개 = 4개
            case "1박2일": 
                return Math.max(baseRequirement, 9); // 2일 * 4개 + 여유 1개 = 9개
            case "2박3일": 
                return Math.max(baseRequirement, 14); // 3일 * 4개 + 여유 2개 = 14개
            case "3박4일": 
                return Math.max(baseRequirement, 18); // 4일 * 4개 + 여유 2개 = 18개
            case "4박5일": 
                return Math.max(baseRequirement, 23); // 5일 * 4개 + 여유 3개 = 23개
            case "5박6일": 
                return Math.max(baseRequirement, 28); // 6일 * 4개 + 여유 4개 = 28개
            case "6박7일": 
                return Math.max(baseRequirement, 33); // 7일 * 4개 + 여유 5개 = 33개
            default: 
                return Math.max(baseRequirement, 14); // 기본값
        }
    }
    
    // ✅ 엄격모드 제거로 불필요해진 메서드 제거됨
    
    /**
     * 콘텐츠 타입 코드를 이름으로 변환 (확장된 버전)
     */
    private String getContentTypeNameByCode(String contentTypeId) {
        Map<String, String> typeMap = new HashMap<>();
        typeMap.put("12", "관광지");
        typeMap.put("14", "문화시설");
        typeMap.put("15", "축제공연행사");
        typeMap.put("25", "여행코스");
        typeMap.put("28", "레포츠");
        typeMap.put("32", "숙박");
        typeMap.put("38", "쇼핑");
        typeMap.put("39", "음식점");
        return typeMap.getOrDefault(contentTypeId, "기타");
    }
    
    /**
     * 콘텐츠 타입별 추천 시간대 반환
     */
    private String[] getRecommendedTimesForContentType(String contentTypeId) {
        switch (contentTypeId) {
            case "25": // 여행코스
                return new String[]{"오전 09:00"};
            case "12": // 관광지
                return new String[]{"오전 10:00", "오후 14:00", "오후 16:00"};
            case "14": // 문화시설
                return new String[]{"오전 10:00", "오후 14:00"};
            case "15": // 축제공연행사
                return new String[]{"오후 19:00", "오후 20:00"};
            case "28": // 레포츠
                return new String[]{"오전 09:00", "오후 14:00"};
            case "32": // 숙박
                return new String[]{"오후 15:00", "오후 21:00"};
            case "38": // 쇼핑
                return new String[]{"오후 13:00", "오후 15:00", "오후 17:00"};
            case "39": // 음식점
                return new String[]{"오후 12:00", "오후 18:00", "오후 19:00"};
            default:
                return new String[]{"오후 14:00"};
        }
    }
    
    // 유틸리티 메서드들
    private String extractKeywordFromRequest(String message) {
        if (message == null || message.trim().isEmpty()) {
            return null;
        }
        
        String lowerMessage = message.toLowerCase();
        
        // 🎪 축제 관련 키워드 (확장된 버전)
        // 🌸 꽃/자연 관련
        if (lowerMessage.contains("벚꽃")) return "벚꽃";
        if (lowerMessage.contains("장미")) return "장미";
        if (lowerMessage.contains("튤립")) return "튤립";
        if (lowerMessage.contains("연꽃")) return "연꽃";
        if (lowerMessage.contains("유채")) return "유채";
        if (lowerMessage.contains("해바라기")) return "해바라기";
        if (lowerMessage.contains("코스모스")) return "코스모스";
        if (lowerMessage.contains("단풍")) return "단풍";
        if (lowerMessage.contains("꽃")) return "꽃";
        
        // 🎆 빛/불꽃 관련
        if (lowerMessage.contains("불꽃")) return "불꽃";
        if (lowerMessage.contains("드론")) return "드론";
        if (lowerMessage.contains("빛")) return "빛";
        if (lowerMessage.contains("조명")) return "조명";
        if (lowerMessage.contains("일루미네이션")) return "일루미네이션";
        if (lowerMessage.contains("레이저")) return "레이저";
        if (lowerMessage.contains("led")) return "LED";
        
        // 🎵 음악/공연 관련
        if (lowerMessage.contains("음악제")) return "음악제";
        if (lowerMessage.contains("kpop") || lowerMessage.contains("k-pop")) return "K-POP";
        if (lowerMessage.contains("콘서트")) return "콘서트";
        if (lowerMessage.contains("페스티벌")) return "페스티벌";
        if (lowerMessage.contains("버스킹")) return "버스킹";
        if (lowerMessage.contains("재즈")) return "재즈";
        if (lowerMessage.contains("클래식")) return "클래식";
        if (lowerMessage.contains("국악")) return "국악";
        
        // 🎭 문화/예술 관련
        if (lowerMessage.contains("문화제")) return "문화제";
        if (lowerMessage.contains("예술제")) return "예술제";
        if (lowerMessage.contains("미디어아트")) return "미디어아트";
        if (lowerMessage.contains("퍼포먼스")) return "퍼포먼스";
        if (lowerMessage.contains("전시")) return "전시";
        if (lowerMessage.contains("체험")) return "체험";
        
        // 🏮 전통/역사 관련
        if (lowerMessage.contains("전통")) return "전통";
        if (lowerMessage.contains("한복")) return "한복";
        if (lowerMessage.contains("궁궐")) return "궁궐";
        if (lowerMessage.contains("한옥")) return "한옥";
        if (lowerMessage.contains("민속")) return "민속";
        if (lowerMessage.contains("역사")) return "역사";
        
        // 🍜 음식 관련
        if (lowerMessage.contains("먹거리")) return "먹거리";
        if (lowerMessage.contains("푸드")) return "푸드";
        if (lowerMessage.contains("맛")) return "맛";
        if (lowerMessage.contains("치킨")) return "치킨";
        if (lowerMessage.contains("맥주")) return "맥주";
        if (lowerMessage.contains("와인")) return "와인";
        if (lowerMessage.contains("디저트")) return "디저트";
        
        // 🌊 계절/자연 관련
        if (lowerMessage.contains("겨울")) return "겨울";
        if (lowerMessage.contains("여름")) return "여름";
        if (lowerMessage.contains("봄")) return "봄";
        if (lowerMessage.contains("가을")) return "가을";
        if (lowerMessage.contains("바다")) return "바다";
        if (lowerMessage.contains("해변")) return "해변";
        if (lowerMessage.contains("강")) return "강";
        if (lowerMessage.contains("호수")) return "호수";
        if (lowerMessage.contains("산")) return "산";
        if (lowerMessage.contains("눈")) return "눈";
        if (lowerMessage.contains("얼음")) return "얼음";
        
        // 🎉 특별 이벤트 관련
        if (lowerMessage.contains("크리스마스")) return "크리스마스";
        if (lowerMessage.contains("신년")) return "신년";
        if (lowerMessage.contains("추석")) return "추석";
        if (lowerMessage.contains("한가위")) return "한가위";
        if (lowerMessage.contains("설날")) return "설날";
        if (lowerMessage.contains("어린이날")) return "어린이날";
        if (lowerMessage.contains("할로윈")) return "할로윈";
        
        // 🎮 엔터테인먼트 관련
        if (lowerMessage.contains("게임")) return "게임";
        if (lowerMessage.contains("e스포츠") || lowerMessage.contains("esports")) return "e스포츠";
        if (lowerMessage.contains("애니메이션")) return "애니메이션";
        if (lowerMessage.contains("웹툰")) return "웹툰";
        if (lowerMessage.contains("캐릭터")) return "캐릭터";
        
        // 🚀 기술/혁신 관련
        if (lowerMessage.contains("vr") || lowerMessage.contains("가상현실")) return "VR";
        if (lowerMessage.contains("ar") || lowerMessage.contains("증강현실")) return "AR";
        if (lowerMessage.contains("로봇")) return "로봇";
        if (lowerMessage.contains("ai") || lowerMessage.contains("인공지능")) return "AI";
        
        // 🍽️ 음식 관련 키워드 (여행용)
        if (lowerMessage.contains("맛집") || lowerMessage.contains("음식점") || lowerMessage.contains("식당")) return "맛집";
        if (lowerMessage.contains("음식")) return "음식";
        
        // 🏛️ 문화/역사 관련 키워드 (여행용)
        if (lowerMessage.contains("박물관") || lowerMessage.contains("미술관")) return "박물관";
        if (lowerMessage.contains("문화")) return "문화";
        
        // 🌊 자연/경관 관련 키워드 (여행용)
        if (lowerMessage.contains("한강")) return "한강";
        if (lowerMessage.contains("등산")) return "등산";
        if (lowerMessage.contains("공원")) return "공원";
        
        // 🛍️ 쇼핑 관련 키워드
        if (lowerMessage.contains("쇼핑") || lowerMessage.contains("시장")) return "쇼핑";
        
        // 🎯 순수한 "축제"는 키워드로 사용하지 않음 (순수한 축제 검색을 위해)
        // "축제"라는 단어만 있고 구체적인 키워드가 없으면 null 반환
        
        return null; // 구체적인 키워드가 없으면 null 반환
    }
    
    private String determineRequestType(String message) {
        if (message.contains("축제")) {
            return message.contains("여행") || message.contains("코스") ? "festival_with_travel" : "festival_only";
        }
        return "travel_only";
    }
    

    

    
    private List<ChatResponse.FestivalInfo> createFestivalInfoFromTourAPI(List<Map<String, Object>> tourApiData) {
        log.info("🎪 축제 정보 생성 시작 - 전체 데이터: {}개", tourApiData.size());
        
        // 모든 데이터의 contentTypeId 로깅
        for (Map<String, Object> data : tourApiData) {
            String contentTypeId = String.valueOf(data.get("contenttypeid"));
            String title = String.valueOf(data.get("title"));
            log.info("  - 데이터: {} (ContentType: {})", title, contentTypeId);
        }
        
        List<ChatResponse.FestivalInfo> festivals = tourApiData.stream()
            .filter(data -> {
                String contentTypeId = String.valueOf(data.get("contenttypeid"));
                boolean isFestival = "15".equals(contentTypeId);
                if (isFestival) {
                    log.info("✅ 축제 데이터 발견: {} (ContentType: {})", data.get("title"), contentTypeId);
                    
                    // 🔍 좌표 유효성 추가 검사
                    String mapX = String.valueOf(data.get("mapx"));
                    String mapY = String.valueOf(data.get("mapy"));
                    
                    if (mapX != null && !mapX.equals("null") && !mapX.isEmpty() &&
                        mapY != null && !mapY.equals("null") && !mapY.isEmpty()) {
                        try {
                            double longitude = Double.parseDouble(mapX);
                            double latitude = Double.parseDouble(mapY);
                            
                            if (!isValidKoreanCoordinate(latitude, longitude)) {
                                log.warn("❌ 잘못된 좌표로 인한 축제 제외: {} - 위도: {}, 경도: {} (한국 영역 밖)", 
                                        data.get("title"), latitude, longitude);
                                return false; // 잘못된 좌표를 가진 축제는 완전 제외
                            }
                        } catch (NumberFormatException e) {
                            log.warn("⚠️ 좌표 파싱 실패로 인한 축제 제외: {} - mapX: {}, mapY: {}", 
                                    data.get("title"), mapX, mapY);
                            return false; // 좌표 파싱 실패한 축제도 제외
                        }
                    } else {
                        log.warn("⚠️ 좌표 정보 없음으로 인한 축제 제외: {}", data.get("title"));
                        return false; // 좌표 정보가 없는 축제도 제외
                    }
                }
                return isFestival;
            })
            .map(data -> {
                ChatResponse.FestivalInfo festival = new ChatResponse.FestivalInfo();
                festival.setName(String.valueOf(data.get("title")));
                
                // 🏠 주소 정보 개선
                String addr1 = String.valueOf(data.get("addr1"));
                if (addr1 != null && 
                    !"null".equals(addr1) && 
                    !addr1.trim().isEmpty() && 
                    !"undefined".equals(addr1) &&
                    !addr1.equals("")) {
                    festival.setLocation(addr1.trim());
                } else {
                    festival.setLocation("장소 정보 확인 중");
                }
                
                // 🖼️ 이미지 정보 개선
                String firstImage = String.valueOf(data.get("firstimage"));
                if (firstImage != null && 
                    !"null".equals(firstImage) && 
                    !firstImage.trim().isEmpty() &&
                    !"undefined".equals(firstImage) &&
                    firstImage.startsWith("http")) {
                    festival.setImage(firstImage.trim());
                }
                
                // 📞 연락처 정보 개선
                String tel = String.valueOf(data.get("tel"));
                if (tel != null && 
                    !"null".equals(tel) && 
                    !tel.trim().isEmpty() && 
                    !"undefined".equals(tel) &&
                    !tel.equals("")) {
                    festival.setContact(tel.trim());
                } else {
                    festival.setContact("연락처 정보 없음");
                }
                
                festival.setContentId(String.valueOf(data.get("contentid")));
                festival.setContentTypeId(String.valueOf(data.get("contenttypeid")));
                
                // 🗺️ 좌표 정보 설정 - 카카오맵 호환성을 위해 다양한 필드명 지원
                String mapX = String.valueOf(data.get("mapx"));
                String mapY = String.valueOf(data.get("mapy"));
                festival.setMapX(mapX);
                festival.setMapY(mapY);
                
                // 🎯 프론트엔드 카카오맵을 위한 추가 좌표 필드 설정
                // ✅ 이미 filter 단계에서 좌표 유효성 검사를 통과한 축제들만 여기에 도달
                if (mapX != null && !mapX.equals("null") && !mapX.isEmpty() &&
                    mapY != null && !mapY.equals("null") && !mapY.isEmpty()) {
                    try {
                        // longitude = mapX (경도), latitude = mapY (위도)
                        double longitude = Double.parseDouble(mapX);
                        double latitude = Double.parseDouble(mapY);
                        festival.setLongitude(longitude);
                        festival.setLatitude(latitude);
                        log.info("🗺️ 축제 좌표 설정: {} - 위도: {}, 경도: {}", festival.getName(), latitude, longitude);
                    } catch (NumberFormatException e) {
                        log.warn("⚠️ 축제 좌표 파싱 실패: {} - mapX: {}, mapY: {}", festival.getName(), mapX, mapY);
                    }
                }
                
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
        
        // 🎲 축제 데이터도 랜덤 섞기
        java.util.Collections.shuffle(festivals);
        log.info("🎪 축제 정보 생성: {}개 (랜덤 섞기 완료)", festivals.size());
        
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
    
    /**
     * 한국 좌표 유효성 검사
     * @param latitude 위도
     * @param longitude 경도  
     * @return 한국 영역 내 좌표인지 여부
     */
    private boolean isValidKoreanCoordinate(double latitude, double longitude) {
        // 한국의 대략적인 좌표 범위 (여유분 포함)
        // 위도: 33.0 ~ 39.0 (제주도 마라도 ~ 북한 국경 + 여유분)
        // 경도: 124.0 ~ 132.0 (백령도 ~ 독도 + 여유분)
        
        boolean isLatitudeValid = latitude >= 33.0 && latitude <= 39.0;
        boolean isLongitudeValid = longitude >= 124.0 && longitude <= 132.0;
        
        if (!isLatitudeValid || !isLongitudeValid) {
            log.debug("🌍 좌표 유효성 검사 실패 - 위도: {} (유효범위: 33.0~39.0), 경도: {} (유효범위: 124.0~132.0)", 
                     latitude, longitude);
            return false;
        }
        
        return true;
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
            .filter(location -> location.getDay() != null)  // null 체크 추가
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
    
    /**
     * 🎯 여행코스 제목에서 지역명 추출
     */
    private String extractRegionFromTravelCourseTitle(String title) {
        if (title == null || title.trim().isEmpty()) return null;
        
        // 주요 지역명 패턴 매칭
        String[] regions = {
            "서울", "부산", "인천", "대구", "대전", "광주", "울산", "세종",
            "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
            "수원", "성남", "고양", "용인", "부천", "안산", "안양", "남양주", "화성",
            "춘천", "원주", "강릉", "속초", "청주", "충주", "천안", "아산", "전주", 
            "군산", "익산", "목포", "여수", "순천", "광양", "포항", "경주", "구미",
            "안동", "창원", "진주", "통영", "김해", "양산", "제주시", "서귀포"
        };
        
        for (String region : regions) {
            if (title.contains(region)) {
                // 구체적인 지역명이 있으면 해당 지역 반환
                if (region.length() > 2) {
                    return region;
                } else {
                    // 광역시/도명인 경우 "지역" 추가
                    return region + " 지역";
                }
            }
        }
        
        // 특정 키워드 기반 지역 추정
        if (title.contains("한강") || title.contains("남산") || title.contains("명동") || title.contains("홍대")) {
            return "서울 지역";
        }
        if (title.contains("해운대") || title.contains("광안리") || title.contains("태종대")) {
            return "부산 지역";
        }
        if (title.contains("올레길") || title.contains("한라산") || title.contains("성산일출봉")) {
            return "제주 지역";
        }
        if (title.contains("경복궁") || title.contains("창덕궁") || title.contains("덕수궁")) {
            return "서울 지역";
        }
        
        return null; // 지역명을 찾을 수 없는 경우
    }
    
    /**
     * 지역코드와 시군구코드로 시/군/구명 추출
     */
    private String extractCityDistrictName(String areaCode, String sigunguCode) {
        try {
            // 광역시/도명 찾기
            String regionName = findRegionNameByAreaCode(areaCode);
            if (regionName == null) return "정보 없음";
            
            // 시군구 매핑에서 찾기
            String sigunguKey = areaCode + "_" + sigunguCode;
            
            // 시군구코드 역매핑을 위한 검색
            for (Map.Entry<String, String> entry : SIGUNGU_CODE_MAP.entrySet()) {
                if (entry.getValue().equals(sigunguKey)) {
                    return regionName + " " + entry.getKey();
                }
            }
            
            // 매핑에 없으면 지역명만 반환
            return regionName;
            
        } catch (Exception e) {
            log.debug("시/군/구명 추출 실패: areaCode={}, sigunguCode={}", areaCode, sigunguCode, e);
            return "정보 없음";
        }
    }
    
    /**
     * 전체 주소에서 시/군/구 부분만 추출 (백업 방법)
     */
    private String extractCityDistrictFromAddress(String fullAddress) {
        if (fullAddress == null || fullAddress.trim().isEmpty()) {
            return "정보 없음";
        }
        
        try {
            // "서울특별시 종로구 ..." → "서울 종로구"
            // "인천광역시 강화군 ..." → "인천 강화군"
            String address = fullAddress.trim();
            
            // 광역시/도 부분 추출
            String cityPart = "";
            String districtPart = "";
            
            if (address.contains("특별시")) {
                cityPart = address.substring(0, address.indexOf("특별시")).trim();
            } else if (address.contains("광역시")) {
                cityPart = address.substring(0, address.indexOf("광역시")).trim();
            } else if (address.contains("특별자치도")) {
                cityPart = address.substring(0, address.indexOf("특별자치도")).trim();
            } else if (address.contains("도")) {
                cityPart = address.substring(0, address.indexOf("도")).trim() + "도";
            }
            
            // 시/군/구 부분 추출
            String[] parts = address.split(" ");
            for (String part : parts) {
                if (part.endsWith("시") || part.endsWith("군") || part.endsWith("구")) {
                    if (!part.equals(cityPart + "특별시") && 
                        !part.equals(cityPart + "광역시") && 
                        !part.equals(cityPart + "특별자치도")) {
                        districtPart = part;
                        break;
                    }
                }
            }
            
            if (!cityPart.isEmpty() && !districtPart.isEmpty()) {
                return cityPart + " " + districtPart;
            } else if (!cityPart.isEmpty()) {
                return cityPart;
            } else {
                return "정보 없음";
            }
            
        } catch (Exception e) {
            log.debug("주소에서 시/군/구 추출 실패: {}", fullAddress, e);
            return "정보 없음";
        }
    }

    // getPlaceImages 메서드는 TourAPIService로 이동됨
    
    /**
     * detailImage2 XML 응답을 파싱하여 이미지 정보 추출
     */
    private List<Map<String, Object>> parseDetailImageResponse(String xmlResponse) {
        List<Map<String, Object>> images = new ArrayList<>();
        
        try {
            // XML에서 <item> 태그들을 찾아서 처리
            String[] items = xmlResponse.split("<item>");
            
            for (int i = 1; i < items.length; i++) { // 첫 번째는 헤더이므로 제외
                String item = items[i];
                
                // 각 이미지 정보 추출
                String originImgUrl = extractXMLValue(item, "originimgurl");
                String smallImageUrl = extractXMLValue(item, "smallimageurl");
                String imgName = extractXMLValue(item, "imgname");
                
                if (originImgUrl != null && !originImgUrl.trim().isEmpty()) {
                    Map<String, Object> imageInfo = new HashMap<>();
                    imageInfo.put("originImgUrl", originImgUrl.trim());
                    imageInfo.put("smallImageUrl", smallImageUrl != null ? smallImageUrl.trim() : "");
                    imageInfo.put("imgName", imgName != null ? imgName.trim() : "");
                    
                    images.add(imageInfo);
                }
            }
            
            log.info("🖼️ 파싱된 이미지 개수: {}", images.size());
            
        } catch (Exception e) {
            log.error("❌ detailImage2 XML 파싱 실패: {}", e.getMessage(), e);
        }
        
        return images;
    }
} 