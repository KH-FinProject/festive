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
import com.project.festive.festiveserver.area.service.AreaService;

@Service
@RequiredArgsConstructor  
@Slf4j
public class AITravelServiceImpl implements AITravelService {
    
    private final TourAPIService tourAPIService;
    private final OpenAIService openAIService;
    private final AreaService areaService;
    private final TravelAnalysisService travelAnalysisService;
    
    // API 키 설정
    @Value("${tour.api.service-key:}")
    private String tourApiServiceKey;
    
    @Value("${openai.api.key:}")
    private String openAiApiKey;
    
    // 하드코딩된 지역코드 매핑 제거 - DB에서 동적으로 가져옴
    
    // RestTemplate은 아래에서 초기화
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
            log.info(" 여행/축제 전용 AI 추천 시작: {}", request.getMessage());
            
            // TourAPI 데이터 기반 재생성 요청인지 확인 (레거시 지원)
            if (request.getTourApiData() != null && !request.getTourApiData().isEmpty()) {
                log.info("🌐 레거시 TourAPI 데이터 기반 AI 응답 재생성: {}개 관광지", request.getTourApiData().size());
                return regenerateWithTourAPIData(request);
            }
            
            // 속도 개선: AI 분석 없이 직접 파싱으로 빠른 처리 + 여행/축제 전용 검증
            TravelAnalysis analysis;
            try {
                analysis = createFastAnalysis(request.getMessage());
                
                // 🚫 애매한 요청 체크
                if ("unclear_request".equals(analysis.getRequestType())) {
                    return createUnclearRequestResponse();
                }
                
            } catch (IllegalArgumentException e) {
                if ("INVALID_REQUEST".equals(e.getMessage())) {
                    // 여행/축제 관련 질문이 아닌 경우 정중하게 거부
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
            
            log.info("여행/축제 전용 AI 추천 완료");
            return response;

        } catch (Exception e) {
            log.error("여행/축제 전용 AI 추천 생성 중 오류 발생", e);
            throw new RuntimeException("여행/축제 정보 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", e);
        }
    }
    
    /**
     *  일반 대화 거부 메시지 생성
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
     * 애매한 요청에 대한 응답 생성 (이용법 안내)
     */
    private ChatResponse createUnclearRequestResponse() {
        ChatResponse response = new ChatResponse();
        
        StringBuilder content = new StringBuilder();
        content.append("제가 응답하기 어렵습니다. 이용법을 다시한번 숙지해주세요.\n\n");
        content.append("⭐ 올바른 이용 방법:\n");
        content.append("• \"서울 2박3일 여행계획 짜줘\" - 다양한 타입 랜덤 추천\n");
        content.append("• \"부산 1박2일 관광지 위주로 추천해줘\" - 관광지 중심\n");
        content.append("• \"제주도 당일치기 음식점 위주로 짜줘\" - 맛집 탐방\n");
        content.append("• \"경주 2박3일 여행코스 위주로 계획해줘\" - 여행코스 중심\n");
        content.append("• \"대구 1박2일 문화시설 위주로 추천\" - 문화/박물관 중심\n");
        content.append("• \"인천 당일치기 레포츠 위주로 짜줘\" - 레포츠/체험 중심\n");
        content.append("• \"광주 1박2일 쇼핑 위주로 계획해줘\" - 쇼핑몰/시장 중심\n\n");
        content.append("🎪 축제 검색:\n");
        content.append("• \"서울 축제 알려줘\" - 단순 축제 정보\n");
        content.append("• \"부산 축제위주 2박3일 여행계획\" - 축제 기반 여행코스\n\n");
        content.append("⚠️ 주의사항:\n");
        content.append("• 최대 4박5일까지만 여행 계획을 세울 수 있습니다\n");
        content.append("• 지역명과 기간을 명확히 말씀해주세요\n");
        content.append("• 여행/축제 관련 요청만 처리 가능합니다");
        
        response.setContent(content.toString());
        response.setRequestType("unclear_request");
        response.setStreaming(false);
        response.setLocations(new ArrayList<>());
        response.setFestivals(new ArrayList<>());
        response.setTravelCourse(null);
        
        return response;
    }
    
    /**
     * 🎯 TourAPI 데이터만을 기반으로 한 구조화된 응답 생성 (AI 없이)
     */
    private ChatResponse generateDataBasedResponseOnly(String originalMessage, TravelAnalysis analysis) {
        try {
            log.info("🎯 데이터 기반 응답 생성 시작 - 지역: {}, 타입: {}", analysis.getRegion(), analysis.getRequestType());
            
            // 🎪 축제 위주 여행 코스인 경우 preferredContentType 설정
            String requestType = analysis.getRequestType();
            log.info("🔍 PreferredContentType 설정 확인 - requestType: {}, 원본메시지: {}", requestType, originalMessage);
            
            if ("festival_travel".equals(requestType)) {
                analysis.setPreferredContentType("15"); // 축제공연행사 우선
                log.info("🎪 축제 기반 여행 계획 - 축제공연행사 위주 설정 (contentType: 15)");
            } else {
                log.info("ℹ️ 일반 여행 계획 - 기본 설정 유지");
            }
            
            // TourAPI 데이터 수집
            List<TourAPIResponse.Item> tourAPIData = collectTourismDataSecurely(analysis);
            
            if (tourAPIData.isEmpty()) {
                log.warn("⚠️ TourAPI 데이터가 없습니다. NoData 응답을 생성합니다.");
                return createNoDataResponse(analysis);
            }
            
            // TourAPI Item을 Map으로 변환
            List<Map<String, Object>> tourApiDataMaps = tourAPIData.stream()
                .map(this::convertToMap)
                .collect(Collectors.toList());
            
            ChatResponse response = new ChatResponse();
            
            // 🎪 축제 검색 요청인 경우 축제 전용 응답 생성
            if ("festival_only".equals(requestType) || "festival_info".equals(requestType)) {
                log.info("🎪 축제 검색 전용 응답 생성 시작");
                
                // 축제 데이터만 필터링
                List<Map<String, Object>> festivalDataMaps = tourApiDataMaps.stream()
                    .filter(data -> "15".equals(String.valueOf(data.get("contenttypeid"))))
                    .collect(Collectors.toList());
                
                log.info("🎭 축제 데이터 필터링 완료: {}개", festivalDataMaps.size());
                
                // 축제 전용 응답 생성
                String festivalContent = openAIService.createFestivalSearchResponse(
                    festivalDataMaps, 
                    originalMessage, 
                    analysis.getKeyword(), 
                    analysis.getRegion()
                );
                
                response.setContent(festivalContent);
                response.setCourseDescription(festivalContent);
                response.setRequestType(requestType);
                response.setStreaming(false);
                response.setRegionName(analysis.getRegion());
                response.setAreaCode(analysis.getAreaCode());
                
                // 축제 정보 생성
                List<ChatResponse.FestivalInfo> festivals = createFestivalInfoFromTourAPI(festivalDataMaps);
                response.setFestivals(festivals);
                
                // 🗺️ 축제 검색에서도 카카오맵 마커 표시를 위한 LocationInfo 생성
                List<ChatResponse.LocationInfo> festivalLocations = createFestivalLocationsForMap(festivals);
                response.setLocations(festivalLocations);
                log.info("🗺️ 축제 마커용 LocationInfo 생성: {}개", festivalLocations.size());
                
                response.setTravelCourse(null);
                
                log.info("🎪 축제 검색 전용 응답 완료: {}개 축제", festivals.size());
                return response;
            }
            
            // 🗺️ 여행 코스 요청인 경우 기존 로직 사용
            log.info("🗺️ 여행 코스 요청 - 기존 응답 방식 사용");
            
            // 요청 분석
            String duration = analysis.getDuration();
            int requiredPlaces = calculateRequiredPlaces(duration);
            int totalDays = getTotalDaysFromDuration(duration);
            
            // 🎯 먼저 실제 위치 정보 생성 (선호하는 contentType 고려)
            List<ChatResponse.LocationInfo> locations = createLocationsFromTourAPIDataWithPreference(
                    tourApiDataMaps, requiredPlaces, totalDays, analysis.getPreferredContentType());
            
            // 🎯 생성된 locations를 바탕으로 구조화된 메시지 생성
            String structuredContent = createStructuredResponseMessageFromLocations(analysis, locations);
            
            // AI가 생성한 day별 코스 설명 저장 (프론트엔드 표시용)
            response.setCourseDescription(structuredContent);
            
            // 응답 기본 정보 설정
            response.setContent(structuredContent);
            response.setRequestType(analysis.getRequestType());
            response.setStreaming(false);
            response.setRegionName(analysis.getRegion());
            response.setAreaCode(analysis.getAreaCode());
            response.setLocations(locations);
            
            // 여행 코스 요청인 경우 축제 정보 제외
            response.setFestivals(new ArrayList<>());
            log.info("🗺️ 여행 코스 요청 - 축제 정보 생성 제외");
            
            // 여행 코스 정보 생성
            ChatResponse.TravelCourse travelCourse = createTravelCourseFromTourAPI(locations, tourApiDataMaps);
            response.setTravelCourse(travelCourse);
            
            log.info("데이터 기반 응답 생성 완료 - 지역: {}, 타입: {}, 위치: {}개", 
                    analysis.getRegion(), analysis.getRequestType(), locations.size());
            return response;
            
        } catch (Exception e) {
            log.error("데이터 기반 응답 생성 실패", e);
            throw new RuntimeException("여행 정보 처리 중 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 생성된 locations를 바탕으로 구조화된 응답 메시지 생성
     */
    private String createStructuredResponseMessageFromLocations(TravelAnalysis analysis, List<ChatResponse.LocationInfo> locations) {
        StringBuilder response = new StringBuilder();
        
        String region = analysis.getRegion() != null ? analysis.getRegion() : "선택하신 지역";
        String duration = analysis.getDuration() != null ? analysis.getDuration() : "2박3일";
        String requestType = analysis.getRequestType();
        
        // 자연스러운 인사 메시지
        if ("festival_only".equals(requestType)) {
            response.append("네! ").append(region).append(" 축제 정보를 찾아드리겠습니다.\n\n");
        } else {
            // travel_only 또는 기타 여행 요청
            response.append("네! ").append(region).append(" ").append(duration).append(" 여행코스를 추천해드리겠습니다.\n\n");
        }
        
        // 🎯 실제 생성된 locations를 Day별로 그룹화
        Map<Integer, List<ChatResponse.LocationInfo>> dayGroups = locations.stream()
            .collect(Collectors.groupingBy(ChatResponse.LocationInfo::getDay));
        
        // Day별로 정렬하여 메시지 생성
        dayGroups.keySet().stream()
            .sorted()
            .forEach(day -> {
                List<ChatResponse.LocationInfo> dayLocations = dayGroups.get(day);
                response.append("Day ").append(day).append("\n");
                
                // 해당 Day의 장소들 나열
                dayLocations.forEach(location -> {
                    response.append("- ").append(location.getName()).append("\n");
                });
                
                // Day별 포인트 생성
                String dayPoint = generateDayPointFromLocations(dayLocations, day, region);
                response.append("포인트: ").append(dayPoint).append("\n\n");
            });
        
        // 마무리 메시지
        response.append("즐거운 여행 보내시길 바랍니다! ^^");
        
        return response.toString();
    }
    
    /**
     * 생성된 locations를 바탕으로 Day별 포인트 생성
     */
    private String generateDayPointFromLocations(List<ChatResponse.LocationInfo> dayLocations, int day, String region) {
        if (dayLocations.isEmpty()) {
            return "다양한 장소들을 효율적으로 둘러볼 수 있는 일정입니다!";
        }
        
        StringBuilder prompt = new StringBuilder();
        prompt.append("다음은 ").append(region).append(" 여행 ").append(day).append("일차 일정입니다.\n");
        prompt.append("장소 목록:\n");
        
        for (ChatResponse.LocationInfo location : dayLocations) {
            prompt.append("- ").append(location.getName());
            if (location.getDescription() != null && !location.getDescription().isEmpty()) {
                prompt.append(" (").append(location.getDescription()).append(")");
            }
            prompt.append("\n");
        }
        
        prompt.append("\n이 일정의 특징과 포인트를 한 문장으로 요약해주세요. ");
        prompt.append("이동 동선, 테마, 또는 특별한 매력 등을 언급하며 여행자에게 도움이 되는 간단한 팁을 포함해주세요.");
        
        try {
            String aiResponse = callOpenAI(prompt.toString());
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
     * TourAPI 데이터가 없는 경우 응답 생성
     */
    private ChatResponse createNoDataResponse(TravelAnalysis analysis) {
        ChatResponse response = new ChatResponse();
        
        String region = analysis.getRegion() != null ? analysis.getRegion() : "해당 지역";
        String keyword = analysis.getKeyword() != null && !analysis.getKeyword().trim().isEmpty() ? analysis.getKeyword() : "";
        String requestType = analysis.getRequestType();
        
        // 🎯 키워드 유무와 요청 타입에 따른 정확한 메시지 생성
        StringBuilder content = new StringBuilder();
        
        if (!keyword.isEmpty()) {
            // 🔍 키워드 검색인 경우 - 명확한 키워드 검색 실패 메시지
            if ("festival_info".equals(requestType) || "festival_travel".equals(requestType)) {
                content.append("죄송합니다. **").append(keyword).append("**으로 ");
                if (!region.equals("해당 지역") && !region.equals("한국")) {
                    content.append(region).append(" 지역에서 ");
                }
                content.append("검색해봤지만, 관련 축제는 현재 존재하지 않네요. 😔\n\n");
                
                content.append("🔍 **다른 검색어로 시도해보세요:**\n");
                content.append("• \"").append(region).append(" 벚꽃축제 알려줘\"\n");
                content.append("• \"").append(region).append(" 불꽃축제 정보\"\n");
                content.append("• \"").append(region).append(" 음식축제 언제야?\"\n");
                content.append("• \"").append(region).append(" 문화축제 추천\"\n\n");
                
                content.append("📅 시기를 바꿔서 검색해보시거나, 다른 지역의 축제도 확인해보세요!");
            } else {
                // 일반 여행에서 키워드 검색 실패
                content.append("죄송합니다. **").append(keyword).append("**와 관련된 ");
                if (!region.equals("해당 지역") && !region.equals("한국")) {
                    content.append(region).append(" ");
                }
                content.append("여행지나 관광지를 찾을 수 없습니다. 😔\n\n");
                
                content.append("🔍 **다른 키워드로 시도해보세요:**\n");
                content.append("• \"").append(region).append(" 관광지 추천\"\n");
                content.append("• \"").append(region).append(" 맛집 위주 여행\"\n");
                content.append("• \"").append(region).append(" 문화시설 추천\"\n");
                content.append("• \"").append(region).append(" 자연경관 여행\"\n\n");
                
                content.append("🌟 특정 키워드 대신 여행 테마나 관심사로 검색해보세요!");
            }
        } else {
            // 🗺️ 일반 지역 검색인데 데이터가 없는 경우
            if ("festival_info".equals(requestType)) {
                content.append("죄송합니다. ").append(region).append(" 지역의 축제 정보를 찾을 수 없습니다. 😔\n\n");
                content.append("🎪 **다른 방법으로 시도해보세요:**\n");
                content.append("• 구체적인 축제명으로 검색 (예: \"벚꽃축제\")\n");
                content.append("• 인근 지역의 축제 확인\n");
                content.append("• 다른 시기의 축제 정보 검색\n\n");
            } else if ("festival_travel".equals(requestType)) {
                content.append("죄송합니다. ").append(region).append(" 지역의 축제 기반 여행 정보를 찾을 수 없습니다. 😔\n\n");
                content.append("🚀 **다른 방법으로 시도해보세요:**\n");
                content.append("• 일반 여행코스로 검색\n");
                content.append("• 인근 지역의 축제 여행\n");
                content.append("• 특정 축제명으로 검색\n\n");
            } else {
                content.append("죄송합니다. ").append(region).append(" 지역의 여행 정보를 찾을 수 없습니다. 😔\n\n");
                content.append("🌍 **다른 방법으로 시도해보세요:**\n");
                content.append("• 더 구체적인 지역명 사용\n");
                content.append("• 여행 테마 추가 (예: \"관광지 위주\")\n");
                content.append("• 인근 도시나 광역시 검색\n\n");
            }
            
            content.append("💡 **도움말**: \"경기도 2박3일 여행계획\" 처럼 지역과 기간을 함께 입력하시면 더 좋은 결과를 얻으실 수 있어요!");
        }
        
        response.setContent(content.toString());
        response.setRequestType("no_data"); // 특별한 타입 설정으로 교통안내 숨김 처리
        response.setStreaming(false);
        response.setLocations(new ArrayList<>());
        response.setFestivals(new ArrayList<>());
        response.setTravelCourse(null);
        
        log.info("💭 검색 결과 없음 응답 생성 - 지역: {}, 키워드: {}, 타입: {}", region, keyword, requestType);
        return response;
    }
    
    /**
     * TourAPI 데이터 기반 구조화된 응답 메시지 생성 (AI 없이)
     */
    private String createStructuredResponseMessage(TravelAnalysis analysis, List<TourAPIResponse.Item> tourAPIData) {
        StringBuilder response = new StringBuilder();
        
        String region = analysis.getRegion() != null ? analysis.getRegion() : "선택하신 지역";
        String duration = analysis.getDuration() != null ? analysis.getDuration() : "2박3일";
        String requestType = analysis.getRequestType();
        
        //  자연스러운 인사 메시지
        if ("festival_info".equals(requestType)) {
            response.append("네! ").append(region).append(" 축제 정보를 찾아드리겠습니다.\n\n");
        } else if ("festival_travel".equals(requestType)) {
            response.append("네! ").append(region).append(" 축제 위주 ").append(duration).append(" 여행코스를 추천해드리겠습니다.\n\n");
        } else {
            // travel_only 또는 기타 여행 요청
            response.append("네! ").append(region).append(" ").append(duration).append(" 여행코스를 추천해드리겠습니다.\n\n");
        }
        
        // 실제 데이터 기반 Day별 일정 생성
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
     *  백엔드에서 안전하게 TourAPI 데이터 수집
     */
    private List<TourAPIResponse.Item> collectTourismDataSecurely(TravelAnalysis analysis) {
        List<TourAPIResponse.Item> allItems = new ArrayList<>();
        
        String areaCode = analysis.getAreaCode(); // null이면 전국 검색
        String sigunguCode = analysis.getSigunguCode();
        String keyword = analysis.getKeyword();
        String requestType = analysis.getRequestType();
        String preferredContentType = analysis.getPreferredContentType();
        String regionName = analysis.getRegion();
        
        log.info(" 백엔드 TourAPI 호출 시작 - 지역명: {}, 지역코드: {}, 시군구코드: {}, 키워드: {}, 요청타입: {}", 
                regionName, areaCode != null ? areaCode : "전국", sigunguCode != null ? sigunguCode : "없음", keyword, requestType);
        
        // 🔎 통영 관련 디버깅
        if (regionName != null && regionName.contains("통영")) {
            log.info("🎯 [TONGYEONG API] 통영 TourAPI 호출 시작!");
            log.info("🎯 [TONGYEONG API] 파라미터 - areaCode: {}, sigunguCode: {}", areaCode, sigunguCode);
        }
        
        try {
            // 🎪 순수 축제 검색 요청인 경우 - 축제 데이터만 수집 (좌표 보완 포함)
            if ("festival_info".equals(requestType)) {
                log.info("🎪 순수 축제 검색 모드 - 축제 데이터 전용 수집");
                return collectFestivalOnlyData(areaCode, sigunguCode, keyword);
            }
            
            // 🎪 축제 기반 여행코스 요청인 경우 - 축제 + 여행 관련 데이터 수집
            if ("festival_travel".equals(requestType)) {
                log.info("🎪 축제 위주 여행 계획 모드 - 축제 우선 + 여행 데이터 수집");
                
                // 축제 데이터 우선 수집 (좌표 보완 포함)
                List<TourAPIResponse.Item> festivalItems = collectFestivalOnlyData(areaCode, sigunguCode, keyword);
                allItems.addAll(festivalItems);
                log.info("🎭 축제 데이터 수집 완료: {}개", festivalItems.size());
                
                // 🎯 축제 위주 여행 계획에서 축제 데이터가 부족하면 다른 타입으로 적극 보완
                int festivalCount = festivalItems.size();
                if (festivalCount < 8) {  // 2박3일 기준 12개 필요하므로 8개 미만이면 부족
                    log.info("⚠️ 축제 위주 여행 계획 - 축제 데이터 부족 감지! 다른 타입으로 보완합니다. (축제: {}개 < 8개)", festivalCount);
                    
                    // 관광지, 문화시설, 음식점을 추가로 수집 (축제와 어울리는 타입들)
                    String[] supplementTypes = {"12", "14", "39", "25", "38"}; // 관광지, 문화시설, 음식점, 여행코스, 쇼핑
                    
                    for (String supplementType : supplementTypes) {
                        log.info("🔄 보완 타입 {} ({}) 수집 시작", supplementType, getContentTypeNameByCode(supplementType));
                        List<TourAPIResponse.Item> supplementItems = fetchTourismDataSecurely(areaCode, sigunguCode, supplementType);
                        addUniqueItems(allItems, supplementItems);
                        log.info("✅ 보완 타입 {} 수집 완료: {}개 (총: {}개)", 
                            getContentTypeNameByCode(supplementType), supplementItems.size(), allItems.size());
                        
                        // 충분한 데이터가 모였으면 중단
                        if (allItems.size() >= 20) {
                            log.info("🎯 충분한 보완 데이터 수집 완료: {}개", allItems.size());
                            break;
                        }
                    }
                    
                    log.info("✅ 축제 위주 여행 계획 데이터 보완 완료: {}개 (축제: {}개, 보완: {}개)", 
                        allItems.size(), festivalCount, allItems.size() - festivalCount);
                }
                
                // 최대 40개로 제한
                if (allItems.size() > 40) {
                    allItems = allItems.subList(0, 40);
                }
                
                log.info("🎪 축제 위주 여행 계획 데이터 수집 완료: {}개", allItems.size());
                return allItems;
            }
            
            // 여행 요청인 경우 - 축제 포함 여행 관련 데이터 수집
            else {
                log.info("🗺️ 여행 전용 모드 - 축제 포함 여행 관련 데이터 수집");
                
                //  선호하는 contentType이 있으면 먼저 수집 (우선 처리)
                if (preferredContentType != null) {
                    // 복합 키워드 처리
                    if (preferredContentType.startsWith("MULTI:")) {
                        String[] multiTypes = preferredContentType.substring(6).split(",");
                        log.info(" 복합 타입 처리 시작: {}개 타입", multiTypes.length);
                        
                        for (String contentType : multiTypes) {
                            log.info(" 복합 타입 {} ({}) 수집 시작", contentType, getContentTypeNameByCode(contentType));
                            List<TourAPIResponse.Item> typeItems = fetchTourismDataSecurely(areaCode, sigunguCode, contentType);
                            allItems.addAll(typeItems);
                            log.info(" 복합 타입 {} 수집 완료: {}개", getContentTypeNameByCode(contentType), typeItems.size());
                        }
                    } else {
                        // 🎯 단일 타입 처리 (축제 포함)
                        log.info(" 선호 타입 {} ({}) 우선 수집 시작", preferredContentType, getContentTypeNameByCode(preferredContentType));
                        List<TourAPIResponse.Item> preferredItems = fetchTourismDataSecurely(areaCode, sigunguCode, preferredContentType);
                        allItems.addAll(preferredItems);
                        log.info(" 선호 타입 수집 완료: {}개", preferredItems.size());
                        
                        // 🎪 축제 위주 여행 계획이고 축제 데이터가 부족한 경우 적극적으로 보완
                        if ("15".equals(preferredContentType)) {
                            int festivalCount = preferredItems.size();
                            log.info("🎪 축제 위주 여행 계획 - 축제 데이터: {}개", festivalCount);
                            
                            // 축제 데이터가 5개 미만이면 부족으로 판단하여 다른 데이터로 보완
                            if (festivalCount < 5) {
                                log.info("⚠️ 축제 데이터 부족 감지! 다른 타입으로 적극 보완합니다. (축제: {}개 < 5개)", festivalCount);
                                
                                // 관광지, 음식점, 문화시설을 추가로 수집
                                String[] supplementTypes = {"12", "39", "14", "25", "38"}; // 관광지, 음식점, 문화시설, 여행코스, 쇼핑
                                
                                for (String supplementType : supplementTypes) {
                                    log.info(" 보완 타입 {} ({}) 수집 시작", supplementType, getContentTypeNameByCode(supplementType));
                                    List<TourAPIResponse.Item> supplementItems = fetchTourismDataSecurely(areaCode, sigunguCode, supplementType);
                                    addUniqueItems(allItems, supplementItems);
                                    log.info(" 보완 타입 {} 수집 완료: {}개 (총: {}개)", 
                                        getContentTypeNameByCode(supplementType), supplementItems.size(), allItems.size());
                                    
                                    // 충분한 데이터가 모였으면 중단
                                    if (allItems.size() >= 20) {
                                        log.info("🎯 충분한 보완 데이터 수집 완료: {}개", allItems.size());
                                        break;
                                    }
                                }
                                
                                log.info("✅ 축제 위주 여행 계획 데이터 보완 완료: {}개 (축제: {}개, 기타: {}개)", 
                                    allItems.size(), festivalCount, allItems.size() - festivalCount);
                            }
                        }
                    }
                }
                
                // 키워드가 있으면 키워드 검색 (축제 포함)
                if (keyword != null && !keyword.isEmpty()) {
                    List<TourAPIResponse.Item> keywordResults = searchTourismByKeyword(keyword, areaCode, sigunguCode);
                    addUniqueItems(allItems, keywordResults);
                    log.info(" 키워드 검색 결과: {}개 (축제 포함, 중복 제거 후 총 {}개)", keywordResults.size(), allItems.size());
                }
                
                //  다양성을 위해 여행 관련 콘텐츠 타입 수집 (축제 포함) - 아직 충분하지 않은 경우에만
                if (allItems.size() < 15) {
                    log.info("📊 데이터가 부족합니다. 추가 수집을 진행합니다. (현재: {}개)", allItems.size());
                    
                    String[] contentTypes = {"25", "12", "15", "14", "28", "32", "38", "39"}; // 여행코스, 관광지, 축제공연행사, 문화시설, 레포츠, 숙박, 쇼핑, 음식점
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
                            log.info("⏭ContentType {} ({}) - 이미 우선 수집됨, 건너뛰기", contentType, getContentTypeNameByCode(contentType));
                            continue;
                        }
                        
                        log.info(" ContentType {} ({}) 수집 시작", contentType, getContentTypeNameByCode(contentType));
                        
                        List<TourAPIResponse.Item> items = fetchTourismDataSecurely(areaCode, sigunguCode, contentType);
                        
                        log.info("ContentType {} 수집 완료: {}개", getContentTypeNameByCode(contentType), items.size());
                        
                        addUniqueItems(allItems, items);
                        
                        //  충분한 데이터 수집 완료
                        int maxItems = 30;
                        if (allItems.size() >= maxItems) {
                            log.info(" 충분한 데이터 수집 완료: {}개 (최대 {}개)", allItems.size(), maxItems);
                            break;
                        }
                    }
                }
                
                // 최대 40개로 증량
                if (allItems.size() > 40) {
                    allItems = allItems.subList(0, 40);
                }
                
                log.info("여행 데이터 수집 완료: {}개 (축제 포함)", allItems.size());
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
                    .queryParam("_type", "json") // JSON 응답 요청
                    .queryParam("contentId", contentId)
                    .build(false)
                    .toUriString() + "&serviceKey=" + tourApiServiceKey;
            
            log.debug("detailCommon2 URL: {}", url);
            
            ResponseEntity<String> response = restTemplate.getForEntity(java.net.URI.create(url), String.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String responseBody = response.getBody();
                log.debug("detailCommon2 응답 데이터 길이: {}", responseBody.length());
                
                // JSON 응답 파싱
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
     * detailCommon2 JSON 응답 파싱
     */
    private List<TourAPIResponse.Item> parseDetailCommon2Response(String response) {
        List<TourAPIResponse.Item> items = new ArrayList<>();
        
        try {
            // JSON 파싱
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(response);
            
            JsonNode itemsNode = root.path("response").path("body").path("items").path("item");
            
            if (itemsNode.isArray()) {
                for (JsonNode itemNode : itemsNode) {
                    TourAPIResponse.Item item = parseDetailCommon2Item(itemNode);
                    if (item != null) {
                        items.add(item);
                    }
                }
            } else if (!itemsNode.isMissingNode()) {
                // 단일 아이템인 경우
                TourAPIResponse.Item item = parseDetailCommon2Item(itemsNode);
                if (item != null) {
                    items.add(item);
                }
            }
            
        } catch (Exception e) {
            log.error("detailCommon2 JSON 응답 파싱 실패", e);
        }
        
        return items;
    }
    
    /**
     * detailCommon2 개별 JSON 아이템 파싱
     */
    private TourAPIResponse.Item parseDetailCommon2Item(JsonNode itemNode) {
        try {
            TourAPIResponse.Item item = new TourAPIResponse.Item();
            
            // addr1 추출
            String addr1 = getJsonNodeValue(itemNode, "addr1");
            item.setAddr1(addr1);
            
            // overview 추출
            String overview = getJsonNodeValue(itemNode, "overview");
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
            String contentId = getJsonNodeValue(itemNode, "contentid");
            item.setContentId(contentId);
            
            log.debug("✅ detailCommon2 JSON 아이템 파싱 완료 - contentId: {}, addr1: {}, overview 길이: {}", 
                    contentId, addr1, overview != null ? overview.length() : 0);
            
            return item;
            
        } catch (Exception e) {
            log.error("detailCommon2 JSON 아이템 파싱 실패", e);
            return null;
        }
    }
    
    /**
     * 🚀 TravelAnalysisService로 위임 (AI 기반 매핑 포함)
     */
    private TravelAnalysis createFastAnalysis(String userMessage) {
        try {
            // TravelAnalysisService로 완전히 위임
            com.project.festive.festiveserver.ai.dto.TravelAnalysis serviceAnalysis = 
                travelAnalysisService.createFastAnalysis(userMessage);
            
            // DTO -> 내부 클래스 변환
            TravelAnalysis analysis = new TravelAnalysis(
                serviceAnalysis.getRequestType(),
                serviceAnalysis.getRegion(), 
                serviceAnalysis.getKeyword(),
                serviceAnalysis.getDuration(),
                serviceAnalysis.getIntent()
            );
            
            analysis.setAreaCode(serviceAnalysis.getAreaCode());
            analysis.setSigunguCode(serviceAnalysis.getSigunguCode());
            analysis.setPreferredContentType(serviceAnalysis.getPreferredContentType());
            
            return analysis;
            
        } catch (Exception e) {
            log.error("TravelAnalysisService 호출 실패, 기본값 사용", e);
            
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
        
        // 🎪 축제/행사 위주 키워드 (가장 우선적으로 체크)
        String[] festivalKeywords = {
            "축제위주", "축제", "페스티벌", "행사위주", "행사", "이벤트",
            "축제중심", "행사중심", "페스티벌위주", "공연행사", "문화행사", "지역축제"
        };
        
        // 🚀 여행코스 위주 키워드 (구체적인 키워드만)
        String[] courseKeywords = {
            "여행코스위주", "코스위주", "루트위주", "코스추천", "루트추천", 
            "드라이브코스", "여행루트", "여행경로"
        };
        
        // 🏛️ 관광지 위주 키워드
        String[] attractionKeywords = {
            "관광지", "명소", "볼거리", "구경거리", "관광명소", "관광위주",
            "관광지위주", "명소위주", "볼거리위주", "유명한곳", "가볼만한곳","관광루트"
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
        
        // 🎪 축제 키워드 체크 (최우선)
        for (String keyword : festivalKeywords) {
            if (lowerMessage.contains(keyword)) {
                detectedTypes.add("15");
                log.info("🎪 축제/행사 키워드 감지: {}", keyword);
                break;
            }
        }
        
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
        
        // 1. 명확한 박수일 패턴 매칭 (공백 제거된 상태, 4박5일 제한)
        if (lowerMessage.contains("1박2일")) { log.info("✅ 1박2일 인식"); return "1박2일"; }
        if (lowerMessage.contains("2박3일")) { log.info("✅ 2박3일 인식"); return "2박3일"; }
        if (lowerMessage.contains("3박4일")) { log.info("✅ 3박4일 인식"); return "3박4일"; }
        if (lowerMessage.contains("4박5일")) { log.info("✅ 4박5일 인식"); return "4박5일"; }
        if (lowerMessage.contains("5박6일") || lowerMessage.contains("6박7일") || lowerMessage.contains("7박8일") || 
            lowerMessage.contains("8박9일") || lowerMessage.contains("9박10일") || lowerMessage.contains("10박11일")) { 
            log.info("⚠️ 여행 기간 제한: 5박 이상 요청 → 4박5일로 제한됨"); 
            return "4박5일"; 
        }
        
        // 2. 공백이 있는 패턴도 확인 (4박5일 제한)
        String originalLower = message.toLowerCase();
        if (originalLower.contains("1박 2일")) { log.info("✅ 1박 2일 인식"); return "1박2일"; }
        if (originalLower.contains("2박 3일")) { log.info("✅ 2박 3일 인식"); return "2박3일"; }
        if (originalLower.contains("3박 4일")) { log.info("✅ 3박 4일 인식"); return "3박4일"; }
        if (originalLower.contains("4박 5일")) { log.info("✅ 4박 5일 인식"); return "4박5일"; }
        if (originalLower.contains("5박 6일") || originalLower.contains("6박 7일") || originalLower.contains("7박 8일") ||
            originalLower.contains("8박 9일") || originalLower.contains("9박 10일") || originalLower.contains("10박 11일")) { 
            log.info("⚠️ 여행 기간 제한: 5박 이상 요청 → 4박5일로 제한됨"); 
            return "4박5일"; 
        }
        
        // 3. 정규식으로 박/일 패턴 찾기 (4박5일 제한)
        Pattern nightDayPattern = Pattern.compile("(\\d+)박\\s?(\\d+)일");
        Matcher nightDayMatcher = nightDayPattern.matcher(originalLower);
        if (nightDayMatcher.find()) {
            int nights = Integer.parseInt(nightDayMatcher.group(1));
            int days = Integer.parseInt(nightDayMatcher.group(2));
            
            // 🚫 4박5일 제한
            if (nights > 4) {
                log.info("⚠️ 여행 기간 제한: {}박{}일 → 4박5일로 제한됨", nights, days);
                return "4박5일";
            }
            
            String result = nights + "박" + days + "일";
            log.info("✅ 정규식으로 {}박{}일 인식 -> {}", nights, days, result);
            return result;
        }
        
        // 4. 일수만 있는 경우 (예: "3일 여행", "4일간", "3일코스", 4박5일 제한)
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
                default -> {
                    if (days > 5) {
                        log.info("⚠️ 여행 기간 제한: {}일 → 4박5일로 제한됨", days);
                        yield "4박5일";
                    } else {
                        yield "2박3일";
                    }
                }
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
        if (region == null || region.trim().isEmpty()) {
            return null;
        }
        
        // DB에서 지역코드 매핑 정보 가져오기
        Map<String, String> areaCodeMap = areaService.getAreaCodeMapping();
        return areaCodeMap.get(region.trim());
    }
    
    /**
     * 시군구명에서 지역코드와 시군구코드 추출
     */
    private RegionInfo extractRegionInfo(String userMessage) {
        // 🎯 TravelAnalysisService로 위임 (AI 기반 매핑 포함)
        TravelAnalysisService.RegionInfo regionInfo = travelAnalysisService.extractRegionInfo(userMessage);
        
        // TravelAnalysisService.RegionInfo -> AITravelServiceImpl.RegionInfo 변환
        return new RegionInfo(regionInfo.getAreaCode(), regionInfo.getSigunguCode(), regionInfo.getRegionName());
    }
    
    /**
     * 지역코드로 지역명 찾기 (TravelAnalysisService로 위임)
     */
    private String findRegionNameByAreaCode(String areaCode) {
        return travelAnalysisService.findRegionNameByAreaCode(areaCode);
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
                .queryParam("numOfRows", "80") // 30 → 80으로 증량
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
                log.info("TourAPI 성공: {}개 데이터 수집", items.size());
                return items;
            } else {
                log.warn("TourAPI 응답 오류: {}", response.getStatusCode());
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
                .queryParam("numOfRows", "100") // 50 → 100으로 증량 (키워드 검색)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("_type", "json") // JSON 응답 요청
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
                .queryParam("numOfRows", "80") // 50 → 80으로 증량 (축제 검색)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("_type", "json") // JSON 응답 요청
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
     * TourAPI JSON 응답 파싱 (JSON 전용)
     */
    private List<TourAPIResponse.Item> parseTourAPIResponse(String response) {
        List<TourAPIResponse.Item> items = new ArrayList<>();
        
        try {
            log.info("🔍 JSON 응답 파싱 시작");
            items = parseJSONResponse(response);
            log.info("📋 JSON 파싱 완료: {}개 아이템", items.size());
            
        } catch (Exception e) {
            log.error("❌ JSON 응답 파싱 실패", e);
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
                String startDate = getJsonNodeValue(itemNode, "eventstartdate");
                String endDate = getJsonNodeValue(itemNode, "eventenddate");
                
                item.setEventStartDate(startDate);
                item.setEventEndDate(endDate);
                
                log.debug("🎪 축제 날짜 파싱: {} - 시작일: {}, 종료일: {}", 
                    item.getTitle(), startDate, endDate);
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
            
        // 🔍 축제 위주 여행 계획인지 더 강력하게 확인
        boolean isFestivalBasedTravel = "15".equals(preferredContentType);
        log.info("🎪 축제 위주 여행 계획 여부: {}", isFestivalBasedTravel);
        
        // 🎪 축제 검색인지 확인 - 축제 데이터가 있고 다른 타입이 적으면 축제 검색으로 판단
        // 단, 축제 위주 여행 코스 요청(preferredContentType="15")은 제외
        long festivalCount = tourApiData.stream()
            .filter(data -> "15".equals(String.valueOf(data.get("contenttypeid"))))
            .count();
        long otherCount = tourApiData.stream()
            .filter(data -> !"15".equals(String.valueOf(data.get("contenttypeid"))))
            .count();
            
        // ✅ 축제 위주 여행 계획인 경우 축제 검색으로 판단하지 않음
        boolean isFestivalSearch = festivalCount > 0 && festivalCount >= otherCount && 
                                  !isFestivalBasedTravel; // 축제 위주 여행 계획이 아닌 경우만 축제 검색으로 판단
        
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
                        
                        // 🎪 축제는 간단하게 축제명만 표시
                        location.setDescription(title + " - 축제");
                        
                        String firstImage = String.valueOf(data.get("firstimage"));
                        location.setImage(processImageUrl(firstImage));
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
            } else if ("15".equals(preferredContentType)) {
                // 🎪 축제공연행사 위주 모드
                return createFestivalPreferredSchedule(placesByType, requiredPlaces, totalDays, usedPlaces);
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
     * 🎪 축제공연행사 위주 일정 생성 (강화된 버전)
     */
    private List<ChatResponse.LocationInfo> createFestivalPreferredSchedule(
            Map<String, List<Map<String, Object>>> placesByType, int requiredPlaces, int totalDays, Set<String> usedPlaces) {
        
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        log.info("🎪 축제 위주 일정 생성 시작 - 필요장소: {}개, 총일수: {}일", requiredPlaces, totalDays);
        
        List<Map<String, Object>> festivals = placesByType.get("15");
        List<Map<String, Object>> attractions = placesByType.get("12");
        List<Map<String, Object>> foods = placesByType.get("39");
        List<Map<String, Object>> cultures = placesByType.get("14");
        List<Map<String, Object>> courses = placesByType.get("25");
        
        int festivalCount = festivals != null ? festivals.size() : 0;
        int attractionCount = attractions != null ? attractions.size() : 0;
        int foodCount = foods != null ? foods.size() : 0;
        int cultureCount = cultures != null ? cultures.size() : 0;
        int courseCount = courses != null ? courses.size() : 0;
        
        log.info("🎪 수집된 데이터 현황:");
        log.info("  - 축제: {}개", festivalCount);
        log.info("  - 관광지: {}개", attractionCount);
        log.info("  - 음식점: {}개", foodCount);
        log.info("  - 문화시설: {}개", cultureCount);
        log.info("  - 여행코스: {}개", courseCount);
        
        // 축제 데이터 상세 로깅
        if (festivals != null && !festivals.isEmpty()) {
            log.info("🎭 축제 데이터 목록:");
            for (int i = 0; i < Math.min(5, festivals.size()); i++) {
                Map<String, Object> festival = festivals.get(i);
                log.info("  - 축제 {}: {}", i+1, festival.get("title"));
            }
            if (festivals.size() > 5) {
                log.info("  - ... 총 {}개 축제", festivals.size());
            }
        }
        
        // 🎯 Day별 최소 장소 수 계산 (균등 분배)
        int placesPerDay = Math.max(3, requiredPlaces / totalDays); // 최소 3개씩
        log.info("🗓️ Day별 계획된 장소 수: {}개", placesPerDay);
        
        // 🎪 축제 위주이므로 각 Day에 최소 1개씩 축제 배치 시도
        for (int day = 1; day <= totalDays; day++) {
            List<Map<String, Object>> dayPlaces = new ArrayList<>();
            log.info("📅 Day {} 일정 생성 시작", day);
            
            // 1. 축제부터 우선 배치 (각 Day에 축제 1~2개)
            int dayFestivalCount = 0;
            int targetFestivalPerDay = Math.min(2, Math.max(1, festivalCount / totalDays + 1));
            
            if (festivals != null && !festivals.isEmpty()) {
                for (Map<String, Object> festival : festivals) {
                    String title = String.valueOf(festival.get("title"));
                    if (!usedPlaces.contains(title) && dayFestivalCount < targetFestivalPerDay) {
                        dayPlaces.add(festival);
                        usedPlaces.add(title);
                        dayFestivalCount++;
                        log.info("  ✅ Day {} 축제 추가: {}", day, title);
                    }
                }
            }
            
            // 2. 부족한 만큼 다른 타입으로 보완
            int currentDayPlaces = dayPlaces.size();
            int needMorePlaces = placesPerDay - currentDayPlaces;
            
            if (needMorePlaces > 0) {
                log.info("  🔄 Day {} 추가 장소 필요: {}개", day, needMorePlaces);
                
                // 우선순위: 관광지 -> 음식점 -> 문화시설 -> 여행코스
                List<List<Map<String, Object>>> priorityLists = new ArrayList<>();
                if (attractions != null) priorityLists.add(attractions);
                if (foods != null) priorityLists.add(foods);
                if (cultures != null) priorityLists.add(cultures);
                if (courses != null) priorityLists.add(courses);
                
                int added = 0;
                for (List<Map<String, Object>> typeList : priorityLists) {
                    if (added >= needMorePlaces) break;
                    
                    for (Map<String, Object> place : typeList) {
                        if (added >= needMorePlaces) break;
                        
                        String title = String.valueOf(place.get("title"));
                        if (!usedPlaces.contains(title)) {
                            dayPlaces.add(place);
                            usedPlaces.add(title);
                            added++;
                            
                            String contentType = String.valueOf(place.get("contenttypeid"));
                            String typeName = getContentTypeNameByCode(contentType);
                            log.info("  ✅ Day {} 보완 장소 추가: {} ({})", day, title, typeName);
                        }
                    }
                }
            }
            
            // 3. Day 정보로 LocationInfo 생성
            for (int i = 0; i < dayPlaces.size(); i++) {
                Map<String, Object> place = dayPlaces.get(i);
                String time = (i == 0) ? "오전" : (i == 1) ? "점심" : (i == 2) ? "오후" : "저녁";
                ChatResponse.LocationInfo location = createLocationInfo(place, day, time);
                
                if (location != null) {  // null 체크 추가
                    locations.add(location);
                } else {
                    log.warn("  ⚠️ Day {} LocationInfo 생성 실패 - place: {}", day, place.get("title"));
                }
            }
            
            log.info("📋 Day {} 완료 - 총 {}개 장소 (축제: {}개, 기타: {}개)", 
                    day, dayPlaces.size(), dayFestivalCount, dayPlaces.size() - dayFestivalCount);
        }
        
        // 🎯 최종 결과 로깅
        int totalFestivalInSchedule = (int) locations.stream()
            .filter(loc -> loc != null && "축제공연행사".equals(loc.getCategory()))  // null 체크 추가
            .count();
        
        log.info("🎪 축제 위주 일정 생성 완료:");
        log.info("  - 총 장소: {}개", locations.size());
        log.info("  - 축제 장소: {}개", totalFestivalInSchedule);
        log.info("  - 총 일수: {}일", totalDays);
        log.info("  - Day별 분배: {}", locations.stream()
            .filter(loc -> loc != null)  // null 체크 추가
            .collect(Collectors.groupingBy(ChatResponse.LocationInfo::getDay, Collectors.counting())));
        
        // 🛡️ null 값 제거 후 반환 (프론트엔드 안전성 확보)
        List<ChatResponse.LocationInfo> filteredLocations = locations.stream()
            .filter(loc -> loc != null)
            .collect(Collectors.toList());
        
        log.info("🔧 null 제거 후 최종 장소 수: {}개", filteredLocations.size());
        
        return filteredLocations;
    }
    
    /**
     * 🍽️ 맛집 위주 일정 생성 (음식점 부족 시 관광지로 보완)
     */
    private List<ChatResponse.LocationInfo> createFoodPreferredSchedule(
            Map<String, List<Map<String, Object>>> placesByType, int requiredPlaces, int totalDays, Set<String> usedPlaces) {
        
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        List<Map<String, Object>> restaurants = placesByType.get("39");
        List<Map<String, Object>> attractions = placesByType.get("12");
        
        int restaurantCount = restaurants != null ? restaurants.size() : 0;
        int attractionCount = attractions != null ? attractions.size() : 0;
        
        log.info("🍽️ 맛집 위주 일정 생성 - 음식점: {}개, 관광지: {}개 사용 가능", restaurantCount, attractionCount);
        
        // 🎯 음식점 부족 여부 체크 및 비율 계산
        boolean restaurantShortage = restaurantCount < (requiredPlaces * 0.6); // 필요한 60% 미만이면 부족
        
        if (restaurantShortage && attractionCount > 0) {
            log.info("⚠️ 음식점 데이터 부족 감지! 관광지로 보완합니다. (음식점: {}개 vs 필요: {}개)", 
                    restaurantCount, (int)(requiredPlaces * 0.6));
        }
        
        int currentDay = 1;
        int placesPerDay = Math.max(3, requiredPlaces / totalDays);
        
        for (int i = 0; i < requiredPlaces && currentDay <= totalDays; i++) {
            Map<String, Object> selectedPlace = null;
            
            if (restaurantShortage && attractionCount > 0) {
                // 🏛️ 부족할 때: 음식점과 관광지를 적절히 섞어서 선택
                // 2:1 비율로 음식점:관광지 선택 (음식점이 부족하더라도 우선순위 유지)
                if (i % 3 == 0 || i % 3 == 1) {
                    // 음식점 우선 시도
                    selectedPlace = selectNextPlace(Arrays.asList(
                        placesByType.get("39"), // 음식점 우선
                        placesByType.get("12"), // 음식점 부족 시 관광지로 보완
                        placesByType.get("38"), // 쇼핑
                        placesByType.get("25")  // 여행코스
                    ), usedPlaces);
                } else {
                    // 관광지 우선 시도 (다양성 확보)
                    selectedPlace = selectNextPlace(Arrays.asList(
                        placesByType.get("12"), // 관광지 우선
                        placesByType.get("39"), // 음식점
                        placesByType.get("14"), // 문화시설
                        placesByType.get("25")  // 여행코스
                    ), usedPlaces);
                }
            } else {
                // 🍽️ 충분할 때: 기존 방식으로 음식점 위주 선택
                selectedPlace = selectNextPlace(Arrays.asList(
                    placesByType.get("39"), // 음식점 우선
                    placesByType.get("12"), // 관광지
                    placesByType.get("38"), // 쇼핑
                    placesByType.get("25")  // 여행코스
                ), usedPlaces);
            }
            
            if (selectedPlace != null) {
                ChatResponse.LocationInfo location = createLocationInfo(selectedPlace, currentDay, null);
                locations.add(location);
                usedPlaces.add(String.valueOf(selectedPlace.get("title")));
                
                String contentType = getContentTypeNameByCode(String.valueOf(selectedPlace.get("contenttypeid")));
                log.info("✅ Day {} 추가: {} ({})", currentDay, selectedPlace.get("title"), contentType);
                
                // 🍽️ 음식점과 관광지 비율 로깅
                if (restaurantShortage && (contentType.equals("음식점") || contentType.equals("관광지"))) {
                    long currentRestaurants = locations.stream()
                        .filter(loc -> loc.getCategory() != null && loc.getCategory().equals("음식점"))
                        .count();
                    long currentAttractions = locations.stream()
                        .filter(loc -> loc.getCategory() != null && loc.getCategory().equals("관광지"))
                        .count();
                    log.info("   📊 현재 비율 - 음식점: {}개, 관광지: {}개", currentRestaurants, currentAttractions);
                }
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
                placesByType.get("15"), // 축제공연행사
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
                
                // 📍 주소 정보를 description에 설정 (undefined 방지)
                String finalDescription;
                
                if ("25".equals(contentTypeId)) {
                    // 여행코스는 지역 정보 표시
                    finalDescription = (cityDistrict != null && !cityDistrict.trim().isEmpty()) ? 
                        cityDistrict : title + " 코스";
                } else {
                    // 그 외 타입들은 실제 주소 표시
                    if (addr1 != null && !"null".equals(addr1) && !addr1.trim().isEmpty()) {
                        finalDescription = addr1.trim();
                    } else if (cityDistrict != null && !cityDistrict.trim().isEmpty()) {
                        finalDescription = cityDistrict;
                    } else {
                        // 모든 정보가 없을 때는 장소명 기반으로 설정
                        finalDescription = title;
                    }
                }
                
                location.setDescription(finalDescription);
                
                // 🖼️ 이미지 설정 (없는 경우 기본 로고 사용)
                String firstImage = String.valueOf(data.get("firstimage"));
                location.setImage(processImageUrl(firstImage));
                
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
        prompt.append("4. 같은 Day 내 장소들은 서로 30km 이내에 위치하도록 배치\n");
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
     * 여행 기간에서 총 일수 추출 (4박5일 제한)
     */
    private int getTotalDaysFromDuration(String duration) {
        switch (duration) {
            case "당일치기": return 1;
            case "1박2일": return 2;
            case "2박3일": return 3;
            case "3박4일": return 4;
            case "4박5일": return 5;
            default: return 2; // 4박5일 제한으로 최대 5일
        }
    }
    
    /**
     * 기간별 필요 장소 수 계산 (day별 4개, 4박5일 제한)
     */
    private int calculateRequiredPlaces(String duration) {
        int totalDays = getTotalDaysFromDuration(duration);
        int placesPerDay = 4; // day별 기본 4개
        
        // 기간별 적절한 장소 수 할당 (4박5일 제한)
        switch (duration) {
            case "당일치기": 
                return 4; // 1일 * 4개 = 4개
            case "1박2일": 
                return 8; // 2일 * 4개 = 8개
            case "2박3일": 
                return 12; // 3일 * 4개 = 12개
            case "3박4일": 
                return 16; // 4일 * 4개 = 16개
            case "4박5일": 
                return 20; // 5일 * 4개 = 20개 (최대값)
            default: 
                return 12; // 기본값 (2박3일 기준)
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
    
    // 유틸리티 메서드들
    private String extractKeywordFromRequest(String message) {
        return travelAnalysisService.extractKeywordFromRequest(message);
    }
    
    private String determineRequestType(String message) {
        String lowerMessage = message.toLowerCase();
        log.info("🔍 RequestType 분류 시작 - 메시지: {}", message);
        
        // 여행 계획/코스 관련 키워드
        boolean hasTravelKeywords = lowerMessage.contains("여행계획") || 
                                   lowerMessage.contains("여행코스") ||
                                   lowerMessage.contains("코스") ||
                                   lowerMessage.contains("일정") ||
                                   lowerMessage.contains("여행") ||
                                   lowerMessage.contains("추천") ||
                                   lowerMessage.contains("루트") ||
                                   lowerMessage.contains("동선");
        
        // 축제 관련 키워드
        boolean hasFestivalKeywords = lowerMessage.contains("축제") ||
                                     lowerMessage.contains("페스티벌") ||
                                     lowerMessage.contains("행사") ||
                                     lowerMessage.contains("공연");
        
        // 단순 정보 요청 키워드
        boolean hasInfoKeywords = lowerMessage.contains("알려줘") ||
                                 lowerMessage.contains("정보") ||
                                 lowerMessage.contains("검색") ||
                                 lowerMessage.contains("찾아줘") ||
                                 lowerMessage.contains("뭐있어") ||
                                 lowerMessage.contains("목록");
        
        log.info("🔍 키워드 분석 - 여행: {}, 축제: {}, 정보: {}", hasTravelKeywords, hasFestivalKeywords, hasInfoKeywords);
        
        if (hasFestivalKeywords) {
            if (hasTravelKeywords) {
                // 축제 키워드 + 여행 키워드 = 축제 위주 여행 코스 (갤러리만)
                log.info("🎪 축제 위주 여행 코스 요청 감지");
                return "travel_only";
            } else if (hasInfoKeywords || (!hasTravelKeywords && hasFestivalKeywords)) {
                // 축제 정보만 요청 = 축제 검색 결과 (축제 정보만)
                log.info("🔍 축제 정보 검색 요청 감지");
                return "festival_only";
            }
        }
        
        // 기본값: 일반 여행
        log.info("🚀 일반 여행 요청으로 분류");
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
                
                // 🏠 주소 정보 개선 - 간단하게 축제명 기반으로 표시
                String addr1 = String.valueOf(data.get("addr1"));
                if (addr1 != null && 
                    !"null".equals(addr1) && 
                    !addr1.trim().isEmpty() && 
                    !"undefined".equals(addr1) &&
                    !addr1.equals("")) {
                    festival.setLocation(addr1.trim());
                } else {
                    // undefined 방지를 위해 축제명 기반으로 설정
                    festival.setLocation(festival.getName() + " 개최지");
                }
                
                // 🖼️ 이미지 정보 개선 (없는 경우 기본 로고 사용)
                String firstImage = String.valueOf(data.get("firstimage"));
                festival.setImage(processImageUrl(firstImage));
                
                // 📞 연락처 정보 개선 (XML 태그 제거 및 정제)
                String tel = String.valueOf(data.get("tel"));
                String cleanedTel = cleanTelNumber(tel);
                festival.setContact(cleanedTel);
                
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
                festival.setTel(cleanedTel);
                
                // 축제 기간 설정 - 더 엄격한 검증
                String startDate = String.valueOf(data.get("eventstartdate"));
                String endDate = String.valueOf(data.get("eventenddate"));
                
                log.info("🗓️ 축제 날짜 확인: {} - 시작일: {}, 종료일: {}", 
                    festival.getName(), startDate, endDate);
                
                if (hasValidDateString(startDate) && hasValidDateString(endDate)) {
                    String formattedPeriod = formatDatePeriod(startDate, endDate);
                    festival.setPeriod(formattedPeriod);
                    log.info("✅ 축제 날짜 포맷팅 성공: {} → {}", festival.getName(), formattedPeriod);
                } else if (hasValidDateString(startDate)) {
                    // 시작일만 있는 경우
                    String formattedStart = formatDatePeriod(startDate, startDate);
                    festival.setPeriod(formattedStart);
                    log.info("✅ 축제 시작일만 설정: {} → {}", festival.getName(), formattedStart);
                } else {
                    // 날짜 정보가 없는 경우 현재 날짜 기준 설정
                    String currentDate = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
                    String fallbackPeriod = "진행 중 (정확한 날짜 미정)";
                    festival.setPeriod(fallbackPeriod);
                    log.warn("⚠️ 축제 날짜 정보 없음, 폴백 사용: {} → {}", festival.getName(), fallbackPeriod);
                }
                
                // 🎪 축제 설명은 간단하게 축제명으로 설정 (undefined 방지)
                festival.setDescription(festival.getName());
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
                
                // 같은 날짜인 경우 하나만 표시
                if (startDate.equals(endDate)) {
                    return formattedStart;
                }
                return formattedStart + " ~ " + formattedEnd;
            }
        } catch (Exception e) {
            log.debug("날짜 포맷팅 실패: {} ~ {}", startDate, endDate, e);
        }
        return startDate + " ~ " + endDate;
    }
    
    /**
     * 유효한 날짜 문자열인지 확인
     */
    private boolean hasValidDateString(String dateString) {
        if (dateString == null || "null".equals(dateString) || dateString.trim().isEmpty()) {
            return false;
        }
        
        // YYYYMMDD 형식인지 확인
        if (dateString.length() == 8) {
            try {
                Integer.parseInt(dateString);
                return true;
            } catch (NumberFormatException e) {
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * 축제 정보를 카카오맵 마커용 LocationInfo로 변환
     */
    private List<ChatResponse.LocationInfo> createFestivalLocationsForMap(List<ChatResponse.FestivalInfo> festivals) {
        if (festivals == null || festivals.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        for (ChatResponse.FestivalInfo festival : festivals) {
            // 좌표가 있는 축제만 LocationInfo로 변환
            if (festival.getLatitude() != null && festival.getLongitude() != null) {
                ChatResponse.LocationInfo location = new ChatResponse.LocationInfo();
                location.setName(festival.getName());
                location.setLatitude(festival.getLatitude());
                location.setLongitude(festival.getLongitude());
                location.setDay(1); // 축제는 모두 1일차로 설정
                location.setTime("종일");
                location.setDescription(festival.getDescription());
                location.setImage(festival.getImage());
                location.setCategory("축제공연행사");
                location.setContentId(festival.getContentId());
                location.setContentTypeId(festival.getContentTypeId());
                
                locations.add(location);
                log.info("🎪 축제 마커 생성: {} - 위도: {}, 경도: {}", 
                    location.getName(), location.getLatitude(), location.getLongitude());
            } else {
                log.warn("⚠️ 좌표 없는 축제, 마커 생성 불가: {} - 위도: {}, 경도: {}", 
                    festival.getName(), festival.getLatitude(), festival.getLongitude());
            }
        }
        
        log.info("🗺️ 축제 마커 생성 완료: 총 {}개 축제 중 {}개 마커 생성", 
            festivals.size(), locations.size());
        
        return locations;
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
        log.info("🎯 TravelCourse 생성 시작 - locations: {}개, tourApiData: {}개", 
                locations != null ? locations.size() : 0, 
                tourApiData != null ? tourApiData.size() : 0);
        
        ChatResponse.TravelCourse travelCourse = new ChatResponse.TravelCourse();
        
        // 🛡️ locations 리스트 안전성 검사
        if (locations == null || locations.isEmpty()) {
            log.warn("❌ locations 리스트가 null이거나 비어있습니다. 기본 여행코스를 생성합니다.");
            
            // 🎯 tourApiData에서 직접 여행코스 정보 생성
            String courseTitle = "AI 추천 여행코스";
            if (tourApiData != null && !tourApiData.isEmpty()) {
                courseTitle = tourApiData.stream()
                    .filter(data -> "25".equals(String.valueOf(data.get("contenttypeid"))))
                    .map(data -> String.valueOf(data.get("title")))
                    .findFirst()
                    .orElse("AI 추천 여행코스");
            }
            
            travelCourse.setCourseTitle(courseTitle);
            travelCourse.setTotalDays(3); // 기본 3일
            
            // 🎯 tourApiData에서 기본 dailySchedule 생성
            List<ChatResponse.DailySchedule> dailySchedules = new ArrayList<>();
            
            // 최대 3일치 기본 일정 생성
            for (int day = 1; day <= 3; day++) {
                ChatResponse.DailySchedule dailySchedule = new ChatResponse.DailySchedule();
                dailySchedule.setDay(day);
                dailySchedule.setTheme("Day " + day + " 일정");
                
                List<ChatResponse.PlaceInfo> places = new ArrayList<>();
                
                // tourApiData에서 해당 day에 맞는 장소 선택 (day당 2-3개씩)
                if (tourApiData != null && !tourApiData.isEmpty()) {
                    int startIndex = (day - 1) * 3;
                    int endIndex = Math.min(startIndex + 3, tourApiData.size());
                    
                    for (int i = startIndex; i < endIndex; i++) {
                        Map<String, Object> data = tourApiData.get(i);
                        
                        ChatResponse.PlaceInfo place = new ChatResponse.PlaceInfo();
                        place.setName(String.valueOf(data.get("title")));
                        place.setType("attraction");
                        place.setAddress(String.valueOf(data.get("addr1")));
                        place.setDescription(getContentTypeNameByCode(String.valueOf(data.get("contenttypeid"))));
                        
                        // 좌표 설정 (있는 경우)
                        try {
                            String mapX = String.valueOf(data.get("mapx"));
                            String mapY = String.valueOf(data.get("mapy"));
                            if (!"null".equals(mapX) && !"null".equals(mapY)) {
                                place.setLatitude(Double.parseDouble(mapY));
                                place.setLongitude(Double.parseDouble(mapX));
                            }
                        } catch (Exception e) {
                            log.debug("좌표 설정 실패: {}", data.get("title"));
                        }
                        
                        place.setVisitTime("시간 미정");
                        place.setDuration("2시간");
                        place.setCategory(getContentTypeNameByCode(String.valueOf(data.get("contenttypeid"))));
                        
                        places.add(place);
                    }
                }
                
                dailySchedule.setPlaces(places);
                dailySchedules.add(dailySchedule);
            }
            
            travelCourse.setDailySchedule(dailySchedules);
            
            log.info("🔧 기본 여행코스 생성 완료: {}, 3일 일정, 총 {}개 일정", 
                    courseTitle, dailySchedules.size());
            
            return travelCourse;
        }
        
        // 여행코스 데이터에서 제목 찾기
        String courseTitle = tourApiData.stream()
            .filter(data -> "25".equals(String.valueOf(data.get("contenttypeid"))))
            .map(data -> String.valueOf(data.get("title")))
            .findFirst()
            .orElse("AI 추천 여행코스");
        
        travelCourse.setCourseTitle(courseTitle);
        
        // 🎯 실제 위치 개수와 Day 정보를 기반으로 총 일수 계산
        int maxDay = locations.stream()
            .filter(location -> location != null && location.getDay() != null)  // location 자체와 getDay() 모두 null 체크
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
                .filter(location -> location != null && location.getDay() != null && location.getDay() == currentDay)
                .collect(Collectors.toList());
            
            List<ChatResponse.PlaceInfo> places = new ArrayList<>();
            
            for (ChatResponse.LocationInfo location : dayLocations) {
                // 🛡️ location이 null이 아닌지 추가 확인
                if (location == null) {
                    log.warn("❌ dayLocations에서 null location 발견, 건너뜀");
                    continue;
                }
                
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
        if (areaCode == null) return "전국";
        
        // DB에서 시군구코드 매핑 정보 가져오기
        Map<String, String> sigunguCodeMap = areaService.getSigunguCodeMapping();
        
        // 시군구 코드가 있으면 시군구명 찾기
        if (sigunguCode != null && !sigunguCode.isEmpty()) {
            String searchCode = areaCode + "_" + sigunguCode;
            for (Map.Entry<String, String> entry : sigunguCodeMap.entrySet()) {
                if (entry.getValue().equals(searchCode)) {
                    return entry.getKey();
                }
            }
        }
        
        // 시군구 코드가 없으면 광역시/도명 반환
        return findRegionNameByAreaCode(areaCode);
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
    
    public String extractAreaCode(String location) {
        if (location == null || location.trim().isEmpty()) {
            return null;
        }

        // DB에서 지역코드 매핑 정보 가져오기
        Map<String, String> areaCodeMap = areaService.getAreaCodeMapping();
        Map<String, String> sigunguCodeMap = areaService.getSigunguCodeMapping();

        String normalizedLocation = location.trim();
        log.info("🗺️ 지역 추출 시도: '{}'", normalizedLocation);

        // 1. 시군구 우선 검색
        for (Map.Entry<String, String> entry : sigunguCodeMap.entrySet()) {
            String sigunguName = entry.getKey();
            String sigunguCode = entry.getValue();
            
            if (normalizedLocation.contains(sigunguName)) {
                String areaCode = sigunguCode.split("_")[0];
                log.info("✅ 시군구 매칭: '{}' -> areaCode: {}", sigunguName, areaCode);
                return areaCode;
            }
        }

        // 2. 광역시/도 검색
        for (Map.Entry<String, String> entry : areaCodeMap.entrySet()) {
            String areaName = entry.getKey();
            String areaCode = entry.getValue();
            
            if (normalizedLocation.contains(areaName)) {
                log.info("✅ 지역 매칭: '{}' -> areaCode: {}", areaName, areaCode);
                return areaCode;
            }
        }

        log.warn("⚠️ 지역코드 매칭 실패: '{}'", normalizedLocation);
        return null;
    }

    /**
     * 전화번호 정제 (XML 태그 제거 및 길이 제한)
     */
    private String cleanTelNumber(String tel) {
        if (tel == null || tel.trim().isEmpty() || "null".equals(tel)) {
            return "연락처 정보 없음";
        }
        
        String cleaned = tel.trim();
        
        // XML 태그 제거
        cleaned = cleaned.replaceAll("<[^>]*>", "");
        
        // HTML 엔티티 제거
        cleaned = cleaned.replaceAll("&[^;]*;", "");
        
        // 연속된 공백을 하나로 변경
        cleaned = cleaned.replaceAll("\\s+", " ");
        
        // 전화번호 패턴 추출 (한국 전화번호 형태만)
        if (cleaned.matches(".*\\d{2,4}-\\d{3,4}-\\d{4}.*")) {
            // 전화번호 패턴이 있는 경우 첫 번째 전화번호만 추출
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d{2,4}-\\d{3,4}-\\d{4})");
            java.util.regex.Matcher matcher = pattern.matcher(cleaned);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        
        // 전화번호 패턴이 없고 너무 길면 잘라내기
        if (cleaned.length() > 50) {
            cleaned = cleaned.substring(0, 50) + "...";
        }
        
        // 여전히 너무 길거나 특수문자가 많으면 기본 메시지 반환
        if (cleaned.length() > 100 || cleaned.contains("<") || cleaned.contains(">")) {
            return "연락처 정보 없음";
        }
        
        return cleaned.trim();
    }

    /**
     * 이미지 URL 처리 (없는 경우 기본 로고 사용)
     */
    private String processImageUrl(String imageUrl) {
        if (imageUrl != null && 
            !"null".equals(imageUrl) && 
            !imageUrl.trim().isEmpty() &&
            !"undefined".equals(imageUrl) &&
            imageUrl.startsWith("http")) {
            return imageUrl.trim();
        }
        
        // 기본 로고 이미지 반환
        return "/logo.png";
    }

    /**
     * 🎪 축제 전용 데이터 수집 (festival_info, festival_only 요청용)
     */
    private List<TourAPIResponse.Item> collectFestivalOnlyData(String areaCode, String sigunguCode, String keyword) {
        List<TourAPIResponse.Item> allItems = new ArrayList<>();
        
        try {
            // 키워드가 있으면 키워드 축제 검색
            if (keyword != null && !keyword.isEmpty()) {
                log.info("🔍 키워드 축제 검색: {}", keyword);
                List<TourAPIResponse.Item> keywordResults = searchTourismByKeyword(keyword, areaCode, sigunguCode);
                // 축제 데이터만 필터링
                List<TourAPIResponse.Item> festivalKeywordResults = keywordResults.stream()
                    .filter(item -> "15".equals(item.getContentTypeId()))
                    .collect(Collectors.toList());
                allItems.addAll(festivalKeywordResults);
                log.info("🎭 키워드 축제 검색 결과: {}개", festivalKeywordResults.size());
            } 
            // 키워드가 없을 때 일반 축제 검색
            else {
                log.info("🎪 일반 축제 검색 (키워드 없음)");
                List<TourAPIResponse.Item> festivalResults = searchFestivals(areaCode, sigunguCode);
                addUniqueItems(allItems, festivalResults);
                log.info("🎭 일반 축제 검색 결과: {}개", festivalResults.size());
            }
            
            // 🗺️ 좌표 정보 보완 (마커 표시 개선을 위해)
            log.info("🗺️ 좌표 정보 보완 시작 - 축제 {}개", allItems.size());
            allItems = enhanceFestivalWithCoordinates(allItems);
            log.info("🗺️ 좌표 정보 보완 완료 - 축제 {}개", allItems.size());
            
            // 📅 날짜 정보 보완 (기간미정 문제 해결을 위해)
            log.info("📅 날짜 정보 보완 시작 전 - 축제 {}개", allItems.size());
            allItems = enhanceFestivalWithDateInfo(allItems);
            log.info("📅 날짜 정보 보완 완료 후 - 축제 {}개", allItems.size());
            
            // 최대 40개로 제한
            if (allItems.size() > 40) {
                allItems = allItems.subList(0, 40);
            }
            
            log.info("🎪 축제 전용 데이터 수집 완료: {}개", allItems.size());
            return allItems;
            
        } catch (Exception e) {
            log.error("❌ 축제 전용 데이터 수집 실패", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * 🗺️ 축제 데이터의 좌표 정보 보완 (강화된 다중 API 시스템)
     */
    private List<TourAPIResponse.Item> enhanceFestivalWithCoordinates(List<TourAPIResponse.Item> festivals) {
        if (festivals == null || festivals.isEmpty()) {
            return festivals;
        }
        
        log.info("🗺️ 축제 좌표 정보 보완 시작: {}개 축제", festivals.size());
        
        int enhanced = 0;
        int failed = 0;
        int alreadyHasCoordinates = 0;
        
        for (TourAPIResponse.Item festival : festivals) {
            log.info("🔍 축제 좌표 검사: {} - 기존 mapX: {}, mapY: {}", 
                festival.getTitle(), festival.getMapX(), festival.getMapY());
            
            // 이미 유효한 좌표가 있는 경우 스킵
            if (hasValidCoordinates(festival)) {
                alreadyHasCoordinates++;
                log.info("✅ 이미 유효한 좌표 보유: {} - ({}, {})", 
                    festival.getTitle(), festival.getMapX(), festival.getMapY());
                continue;
            }
            
            // contentId가 있는 경우에만 상세 정보 조회
            if (festival.getContentId() != null && !festival.getContentId().isEmpty()) {
                try {
                    log.info("🔍 좌표 보완 시도: contentId={}, 축제명={}", 
                        festival.getContentId(), festival.getTitle());
                    
                    // 1단계: detailCommon2 API로 좌표 정보 가져오기
                    Map<String, String> coordinates = fetchCoordinatesFromDetailCommon(festival.getContentId());
                    
                    if (coordinates != null && coordinates.get("mapx") != null && coordinates.get("mapy") != null) {
                        String mapX = coordinates.get("mapx");
                        String mapY = coordinates.get("mapy");
                        
                        // 좌표 유효성 검증
                        if (isValidKoreanCoordinateString(mapX, mapY)) {
                            festival.setMapX(mapX);
                            festival.setMapY(mapY);
                            enhanced++;
                            log.info("✅ detailCommon2로 좌표 보완 성공: {} → ({}, {})", 
                                festival.getTitle(), mapX, mapY);
                        } else {
                            log.warn("❌ detailCommon2에서 잘못된 좌표: {} → ({}, {}) - 한국 범위 밖", 
                                festival.getTitle(), mapX, mapY);
                            failed++;
                        }
                    } else {
                        // 2단계: 좌표 정보가 없는 경우 주소 기반 좌표 추정 시도
                        log.info("⚠️ detailCommon2에서 좌표 없음, 주소 기반 추정 시도: {}", festival.getTitle());
                        
                        String address = festival.getAddr1();
                        if (address != null && !address.trim().isEmpty() && !"null".equals(address)) {
                            Map<String, String> estimatedCoords = estimateCoordinatesFromAddress(address);
                            if (estimatedCoords != null) {
                                festival.setMapX(estimatedCoords.get("mapx"));
                                festival.setMapY(estimatedCoords.get("mapy"));
                                enhanced++;
                                log.info("✅ 주소 기반 좌표 추정 성공: {} → ({}, {})", 
                                    festival.getTitle(), festival.getMapX(), festival.getMapY());
                            } else {
                                log.warn("❌ 주소 기반 좌표 추정 실패: {} - 주소: {}", 
                                    festival.getTitle(), address);
                                failed++;
                            }
                        } else {
                            log.warn("❌ 주소 정보도 없음: {}", festival.getTitle());
                            failed++;
                        }
                    }
                    
                    // API 호출 제한을 위한 지연
                    Thread.sleep(100);
                    
                } catch (Exception e) {
                    failed++;
                    log.error("❌ 좌표 보완 중 오류 발생: {} - {}", festival.getTitle(), e.getMessage(), e);
                }
            } else {
                failed++;
                log.info("❌ contentId 없음: {}", festival.getTitle());
            }
        }
        
        log.info("🗺️ 좌표 보완 완료 - 기존 좌표: {}개, 보완 성공: {}개, 실패: {}개", 
            alreadyHasCoordinates, enhanced, failed);
        return festivals;
    }
    
    /**
     * 문자열 좌표의 한국 유효성 검사
     */
    private boolean isValidKoreanCoordinateString(String mapX, String mapY) {
        if (mapX == null || mapY == null || "null".equals(mapX) || "null".equals(mapY) ||
            mapX.trim().isEmpty() || mapY.trim().isEmpty()) {
            return false;
        }
        
        try {
            double x = Double.parseDouble(mapX);
            double y = Double.parseDouble(mapY);
            return isValidKoreanCoordinate(y, x); // latitude, longitude 순서
        } catch (NumberFormatException e) {
            return false;
        }
    }
    
    /**
     * 주소 기반 좌표 추정 (지역별 대표 좌표)
     */
    private Map<String, String> estimateCoordinatesFromAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return null;
        }
        
        String lowerAddress = address.toLowerCase();
        Map<String, String> coordinates = new HashMap<>();
        
        // 주요 지역별 대표 좌표 (시청 또는 중심지 기준)
        if (lowerAddress.contains("서울")) {
            coordinates.put("mapx", "126.9784"); // 서울시청
            coordinates.put("mapy", "37.5666");
        } else if (lowerAddress.contains("부산")) {
            coordinates.put("mapx", "129.0756"); // 부산시청
            coordinates.put("mapy", "35.1798");
        } else if (lowerAddress.contains("대구")) {
            coordinates.put("mapx", "128.6014"); // 대구시청
            coordinates.put("mapy", "35.8714");
        } else if (lowerAddress.contains("인천")) {
            coordinates.put("mapx", "126.7052"); // 인천시청
            coordinates.put("mapy", "37.4563");
        } else if (lowerAddress.contains("광주")) {
            coordinates.put("mapx", "126.8526"); // 광주시청
            coordinates.put("mapy", "35.1595");
        } else if (lowerAddress.contains("대전")) {
            coordinates.put("mapx", "127.3845"); // 대전시청
            coordinates.put("mapy", "36.3504");
        } else if (lowerAddress.contains("울산")) {
            coordinates.put("mapx", "129.3114"); // 울산시청
            coordinates.put("mapy", "35.5384");
        } else if (lowerAddress.contains("제주")) {
            coordinates.put("mapx", "126.5312"); // 제주시청
            coordinates.put("mapy", "33.4996");
        } else if (lowerAddress.contains("강원")) {
            coordinates.put("mapx", "127.7669"); // 춘천시청
            coordinates.put("mapy", "37.8813");
        } else if (lowerAddress.contains("경기")) {
            coordinates.put("mapx", "127.2084"); // 수원시청
            coordinates.put("mapy", "37.2636");
        } else if (lowerAddress.contains("충북")) {
            coordinates.put("mapx", "127.4889"); // 청주시청
            coordinates.put("mapy", "36.6424");
        } else if (lowerAddress.contains("충남")) {
            coordinates.put("mapx", "126.8000"); // 천안시청
            coordinates.put("mapy", "36.8151");
        } else if (lowerAddress.contains("전북")) {
            coordinates.put("mapx", "127.1530"); // 전주시청
            coordinates.put("mapy", "35.8242");
        } else if (lowerAddress.contains("전남")) {
            coordinates.put("mapx", "126.4628"); // 목포시청
            coordinates.put("mapy", "34.8118");
        } else if (lowerAddress.contains("경북")) {
            coordinates.put("mapx", "128.5055"); // 포항시청
            coordinates.put("mapy", "36.0190");
        } else if (lowerAddress.contains("경남")) {
            coordinates.put("mapx", "128.6890"); // 창원시청
            coordinates.put("mapy", "35.2284");
        } else {
            // 알 수 없는 지역의 경우 서울 중심으로 설정
            log.info("🌍 알 수 없는 지역, 서울 기본 좌표 적용: {}", address);
            coordinates.put("mapx", "126.9784");
            coordinates.put("mapy", "37.5666");
        }
        
        log.info("📍 주소 기반 좌표 추정: {} → ({}, {})", 
            address, coordinates.get("mapx"), coordinates.get("mapy"));
        return coordinates;
    }
    
    /**
     * 유효한 좌표 정보가 있는지 확인
     */
    private boolean hasValidCoordinates(TourAPIResponse.Item item) {
        if (item.getMapX() == null || item.getMapY() == null) {
            return false;
        }
        
        try {
            double x = Double.parseDouble(item.getMapX());
            double y = Double.parseDouble(item.getMapY());
            
            // 유효한 한국 좌표 범위 체크
            return x >= 124.0 && x <= 132.0 && y >= 33.0 && y <= 43.0;
        } catch (NumberFormatException e) {
            return false;
        }
    }
    
    /**
     * 📅 축제 데이터의 날짜 정보 보완 (detailIntro2 API 활용)
     */
    private List<TourAPIResponse.Item> enhanceFestivalWithDateInfo(List<TourAPIResponse.Item> festivals) {
        if (festivals == null || festivals.isEmpty()) {
            return festivals;
        }
        
        log.info("📅 축제 날짜 정보 보완 시작: {}개 축제", festivals.size());
        
        int enhanced = 0;
        int failed = 0;
        
        for (TourAPIResponse.Item festival : festivals) {
            log.info("🔍 축제 검사: {} - 기존 시작일: {}, 종료일: {}", 
                festival.getTitle(), festival.getEventStartDate(), festival.getEventEndDate());
            
            // 이미 날짜 정보가 있는 경우 스킵
            if (hasValidDateInfo(festival)) {
                log.info("⏭️ 이미 유효한 날짜 정보 있음: {} - 시작일: {}", 
                    festival.getTitle(), festival.getEventStartDate());
                continue;
            }
            
            // contentId가 있는 경우에만 상세 정보 조회
            if (festival.getContentId() != null && !festival.getContentId().isEmpty()) {
                try {
                    log.info("🔍 detailIntro2 API 호출 시도 - contentId: {}, 축제명: {}", 
                        festival.getContentId(), festival.getTitle());
                    
                    // detailIntro2 API로 축제 날짜 정보 가져오기
                    TourAPIResponse.Item detailIntroInfo = fetchDetailIntro2(festival.getContentId());
                    
                    if (detailIntroInfo != null) {
                        if (detailIntroInfo.getEventStartDate() != null && !detailIntroInfo.getEventStartDate().isEmpty()) {
                            festival.setEventStartDate(detailIntroInfo.getEventStartDate());
                        }
                        if (detailIntroInfo.getEventEndDate() != null && !detailIntroInfo.getEventEndDate().isEmpty()) {
                            festival.setEventEndDate(detailIntroInfo.getEventEndDate());
                        }
                        enhanced++;
                        log.info("✅ 날짜 정보 보완 성공: {} → 시작:{}, 종료:{}", 
                            festival.getTitle(), festival.getEventStartDate(), festival.getEventEndDate());
                    } else {
                        failed++;
                        log.info("❌ detailIntro2에서 날짜 정보 없음: {}", festival.getTitle());
                    }
                    
                    // API 호출 제한을 위한 약간의 지연
                    Thread.sleep(50);
                    
                } catch (Exception e) {
                    failed++;
                    log.error("❌ 날짜 정보 조회 실패: {} - {}", festival.getTitle(), e.getMessage(), e);
                }
            } else {
                failed++;
                log.info("❌ contentId 없음: {}", festival.getTitle());
            }
        }
        
        log.info("📅 축제 날짜 정보 보완 완료 - 성공: {}개, 실패: {}개", enhanced, failed);
        return festivals;
    }
    
    /**
     * 축제에 유효한 날짜 정보가 있는지 확인 (더 엄격한 검증)
     */
    private boolean hasValidDateInfo(TourAPIResponse.Item festival) {
        String startDate = festival.getEventStartDate();
        String endDate = festival.getEventEndDate();
        
        // 시작일과 종료일 모두 유효해야 함
        boolean hasValidStart = hasValidDateString(startDate);
        boolean hasValidEnd = hasValidDateString(endDate);
        
        log.debug("🗓️ 날짜 정보 검증: {} - 시작일: {} (유효: {}), 종료일: {} (유효: {})", 
            festival.getTitle(), startDate, hasValidStart, endDate, hasValidEnd);
        
        // 최소한 시작일은 있어야 함
        return hasValidStart;
    }
    
    /**
     * detailIntro2 API 호출하여 축제 상세 정보 가져오기
     */
    private TourAPIResponse.Item fetchDetailIntro2(String contentId) {
        try {
            log.info("🔍 detailIntro2 API 호출 시작 - contentId: {}", contentId);
            
            String url = UriComponentsBuilder.fromHttpUrl("https://apis.data.go.kr/B551011/KorService2/detailIntro2")
                    .queryParam("MobileOS", "ETC")
                    .queryParam("MobileApp", "festive")
                    .queryParam("_type", "json")
                    .queryParam("contentTypeId", "15")  // 축제 타입
                    .queryParam("contentId", contentId)
                    .build(false)
                    .toUriString() + "&serviceKey=" + tourApiServiceKey;
            
            log.info("📡 detailIntro2 요청 URL: {}", url);
            
            ResponseEntity<String> response = restTemplate.getForEntity(java.net.URI.create(url), String.class);
            
            log.info("📥 detailIntro2 응답 상태: {}", response.getStatusCode());
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String responseBody = response.getBody();
                log.info("📄 detailIntro2 응답 데이터 길이: {}", responseBody.length());
                log.info("📄 detailIntro2 응답 내용 (처음 500자): {}", 
                    responseBody.length() > 500 ? responseBody.substring(0, 500) + "..." : responseBody);
                
                // JSON 응답 파싱
                List<TourAPIResponse.Item> items = parseDetailIntro2Response(responseBody);
                
                if (!items.isEmpty()) {
                    TourAPIResponse.Item item = items.get(0);
                    log.info("✅ detailIntro2 정보 조회 성공 - contentId: {}, 시작:{}, 종료:{}", 
                            contentId, item.getEventStartDate(), item.getEventEndDate());
                    return item;
                } else {
                    log.warn("⚠️ detailIntro2 응답에서 데이터를 찾을 수 없음 - contentId: {}", contentId);
                }
            } else {
                log.warn("⚠️ detailIntro2 API 호출 실패 - contentId: {}, 상태코드: {}", 
                        contentId, response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ detailIntro2 API 호출 중 오류 발생 - contentId: {}: {}", contentId, e.getMessage(), e);
        }
        
        return null;
    }
    
    /**
     * detailIntro2 JSON 응답 파싱
     */
    private List<TourAPIResponse.Item> parseDetailIntro2Response(String response) {
        List<TourAPIResponse.Item> items = new ArrayList<>();
        
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            JsonNode body = root.path("response").path("body");
            JsonNode itemsNode = body.path("items");
            
            if (itemsNode.isArray() && itemsNode.size() > 0) {
                for (JsonNode itemNode : itemsNode.path("item")) {
                    TourAPIResponse.Item item = parseDetailIntro2Item(itemNode);
                    if (item != null) {
                        items.add(item);
                    }
                }
            } else if (itemsNode.path("item").isObject()) {
                TourAPIResponse.Item item = parseDetailIntro2Item(itemsNode.path("item"));
                if (item != null) {
                    items.add(item);
                }
            }
            
        } catch (Exception e) {
            log.error("detailIntro2 JSON 응답 파싱 실패", e);
        }
        
        return items;
    }
    
    /**
     * detailIntro2 개별 JSON 아이템 파싱
     */
    private TourAPIResponse.Item parseDetailIntro2Item(JsonNode itemNode) {
        try {
            TourAPIResponse.Item item = new TourAPIResponse.Item();
            
            // 축제 날짜 정보 추출
            String eventStartDate = getJsonNodeValue(itemNode, "eventstartdate");
            String eventEndDate = getJsonNodeValue(itemNode, "eventenddate");
            
            item.setEventStartDate(eventStartDate);
            item.setEventEndDate(eventEndDate);
            
            // contentId 추출
            String contentId = getJsonNodeValue(itemNode, "contentid");
            item.setContentId(contentId);
            
            log.debug("✅ detailIntro2 JSON 아이템 파싱 완료 - contentId: {}, 시작:{}, 종료:{}", 
                    contentId, eventStartDate, eventEndDate);
            
            return item;
            
        } catch (Exception e) {
            log.error("detailIntro2 JSON 아이템 파싱 실패", e);
            return null;
        }
    }
    
    /**
     * 🗺️ TourAPI detailCommon에서 좌표 정보 가져오기
     */
    private Map<String, String> fetchCoordinatesFromDetailCommon(String contentId) {
        try {
            String baseUrl = "https://apis.data.go.kr/B551011/KorService2/detailCommon2";
            
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("numOfRows", "1")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("_type", "json")
                .queryParam("contentId", contentId)
                .queryParam("defaultYN", "Y")
                .queryParam("addrinfoYN", "Y")
                .queryParam("mapinfoYN", "Y")
                .queryParam("overviewYN", "N");
            
            String urlWithoutServiceKey = builder.toUriString();
            String finalUrl = urlWithoutServiceKey + "&serviceKey=" + tourApiServiceKey;
            
            log.debug("🗺️ 좌표 조회 API 호출: contentId={}", contentId);
            
            ResponseEntity<String> response = restTemplate.getForEntity(java.net.URI.create(finalUrl), String.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<TourAPIResponse.Item> items = parseTourAPIResponse(response.getBody());
                
                if (!items.isEmpty()) {
                    TourAPIResponse.Item item = items.get(0);
                    if (hasValidCoordinates(item)) {
                        Map<String, String> coordinates = new HashMap<>();
                        coordinates.put("mapx", item.getMapX());
                        coordinates.put("mapy", item.getMapY());
                        return coordinates;
                    }
                }
            }
            
        } catch (Exception e) {
            log.debug("❌ 좌표 조회 실패: contentId={}, error={}", contentId, e.getMessage());
        }
        
        return null;
    }

} 