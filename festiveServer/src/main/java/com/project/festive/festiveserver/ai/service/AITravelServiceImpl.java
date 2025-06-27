package com.project.festive.festiveserver.ai.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.project.festive.festiveserver.ai.dto.ChatRequest;
import com.project.festive.festiveserver.ai.dto.ChatResponse;

// TourApiRequest import 제거
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AITravelServiceImpl implements AITravelService {
    
    @Value("${openai.api.key:}")
    private String openAiApiKey;
    
    @Value("${tourapi.service.key}")
    private String tourapiServiceKey;
    
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
            log.info("🎯 AI 여행 추천 시작: {}", request.getMessage());
            
            // 1. 지역코드 추출
            String areaCode = extractAreaCode(request.getMessage());
            String regionName = AREA_NAME_MAP.getOrDefault(areaCode, "서울");
            log.info("🗺️ 추출된 지역: {} (코드: {})", regionName, areaCode);
            
            // 2. TourAPI에서 메인축제 + 근거리 관광지 정보 수집
            Map<String, Object> tourData = fetchTourData(areaCode);
            
            // 3. OpenAI 프롬프트 생성 (TourAPI 데이터 포함)
            String enhancedPrompt = createEnhancedPrompt(request.getMessage(), regionName, tourData);
            
            // 4. OpenAI API 호출
            String aiResponse = callOpenAIWithTourData(enhancedPrompt);
            
            // 5. 위치 정보 추출
            List<ChatResponse.LocationInfo> locations = extractLocations(aiResponse);
            
            ChatResponse response = new ChatResponse();
            response.setContent(aiResponse);
            response.setLocations(locations);
            // FestivalInfo 객체 생성 (임시로 null 설정, 프론트엔드에서 처리)
            response.setMainFestival(null);
            response.setStreaming(false);
            
            return response;
        } catch (Exception e) {
            log.error("AI 여행 추천 생성 실패", e);
            throw new RuntimeException("AI 서비스 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 지역코드 추출 메서드
     */
    private String extractAreaCode(String query) {
        String cleanQuery = query.toLowerCase();
        
        // 상세 지역명 우선 검색
        for (Map.Entry<String, String> entry : AREA_CODE_MAP.entrySet()) {
            if (cleanQuery.contains(entry.getKey().toLowerCase())) {
                return entry.getValue();
            }
        }
        
        return "1"; // 기본값: 서울
    }
    
    /**
     * TourAPI 데이터 수집 (메인축제 + 근거리 관광지)
     */
    private Map<String, Object> fetchTourData(String areaCode) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 현재 날짜
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            
            // 1. 메인축제 검색
            String festivalUrl = String.format(
                "https://apis.data.go.kr/B551011/KorService2/searchFestival2?" +
                "serviceKey=%s&numOfRows=50&pageNo=1&MobileOS=ETC&MobileApp=festive" +
                "&eventStartDate=%s&_type=json&arrange=C&areaCode=%s",
                tourapiServiceKey, today, areaCode
            );
            
            Map<String, Object> mainFestival = fetchMainFestival(festivalUrl);
            result.put("mainFestival", mainFestival);
            
            // 2. 메인축제 좌표로 근거리 관광지 검색
            if (mainFestival != null && mainFestival.get("mapx") != null && mainFestival.get("mapy") != null) {
                List<Map<String, Object>> nearbySpots = fetchNearbySpots(
                    (String) mainFestival.get("mapx"), 
                    (String) mainFestival.get("mapy")
                );
                result.put("nearbySpots", nearbySpots);
            } else {
                result.put("nearbySpots", new ArrayList<>());
            }
            
        } catch (Exception e) {
            log.error("❌ TourAPI 데이터 수집 오류: {}", e.getMessage());
            result.put("mainFestival", null);
            result.put("nearbySpots", new ArrayList<>());
        }
        
        return result;
    }
    
    /**
     * 메인축제 검색 및 랜덤 선택
     */
    private Map<String, Object> fetchMainFestival(String url) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> data = response.getBody();
            
            if (data != null && data.containsKey("response")) {
                Map<String, Object> responseData = (Map<String, Object>) data.get("response");
                Map<String, Object> body = (Map<String, Object>) responseData.get("body");
                
                if (body != null && body.containsKey("items")) {
                    Map<String, Object> items = (Map<String, Object>) body.get("items");
                    Object item = items.get("item");
                    
                    if (item instanceof List) {
                        List<Map<String, Object>> festivals = (List<Map<String, Object>>) item;
                        if (!festivals.isEmpty()) {
                            // 랜덤 선택
                            int randomIndex = new Random().nextInt(festivals.size());
                            Map<String, Object> selectedFestival = festivals.get(randomIndex);
                            log.info("🎪 선택된 메인축제: {}", selectedFestival.get("title"));
                            return selectedFestival;
                        }
                    } else if (item instanceof Map) {
                        log.info("🎪 단일 축제: {}", ((Map<String, Object>) item).get("title"));
                        return (Map<String, Object>) item;
                    }
                }
            }
        } catch (Exception e) {
            log.error("❌ 메인축제 검색 오류: {}", e.getMessage());
        }
        
        return null;
    }
    
    /**
     * 근거리 관광지 검색
     */
    private List<Map<String, Object>> fetchNearbySpots(String mapX, String mapY) {
        List<Map<String, Object>> allSpots = new ArrayList<>();
        
        // 콘텐츠 타입별 검색
        String[] contentTypes = {"12", "14", "15", "25", "28", "38", "39"}; // 관광지, 문화시설, 축제, 여행코스, 레포츠, 쇼핑, 음식점
        String[] typeNames = {"관광지", "문화시설", "축제공연행사", "여행코스", "레포츠", "쇼핑", "음식점"};
        
        for (int i = 0; i < contentTypes.length; i++) {
            try {
                String nearbyUrl = String.format(
                    "https://apis.data.go.kr/B551011/KorService2/locationBasedList2?" +
                    "serviceKey=%s&numOfRows=10&pageNo=1&MobileOS=ETC&MobileApp=festive" +
                    "&_type=json&mapX=%s&mapY=%s&radius=100000&contentTypeId=%s&arrange=E",
                    tourapiServiceKey, mapX, mapY, contentTypes[i]
                );
                
                ResponseEntity<Map> response = restTemplate.getForEntity(nearbyUrl, Map.class);
                Map<String, Object> data = response.getBody();
                
                if (data != null && data.containsKey("response")) {
                    Map<String, Object> responseData = (Map<String, Object>) data.get("response");
                    Map<String, Object> body = (Map<String, Object>) responseData.get("body");
                    
                    if (body != null && body.containsKey("items")) {
                        Map<String, Object> items = (Map<String, Object>) body.get("items");
                        Object item = items.get("item");
                        
                        if (item instanceof List) {
                            List<Map<String, Object>> spots = (List<Map<String, Object>>) item;
                            for (Map<String, Object> spot : spots) {
                                spot.put("categoryName", typeNames[i]);
                                allSpots.add(spot);
                            }
                        } else if (item instanceof Map) {
                            Map<String, Object> spot = (Map<String, Object>) item;
                            spot.put("categoryName", typeNames[i]);
                            allSpots.add(spot);
                        }
                    }
                }
                
                log.info("🏛️ {} 검색 완료", typeNames[i]);
                
            } catch (Exception e) {
                log.error("❌ {} 검색 오류: {}", typeNames[i], e.getMessage());
            }
            
            if (allSpots.size() >= 30) break; // 충분한 데이터 수집
        }
        
        log.info("🎯 총 근거리 관광지: {}개", allSpots.size());
        return allSpots;
    }
    
    /**
     * AI 프롬프트 생성 (TourAPI 데이터 포함)
     */
    private String createEnhancedPrompt(String userQuery, String regionName, Map<String, Object> tourData) {
        StringBuilder prompt = new StringBuilder();
        
        // 여행 기간 추출
        String duration = "당일치기";
        Pattern durationPattern = Pattern.compile("(\\d+박\\d+일)");
        Matcher matcher = durationPattern.matcher(userQuery.toLowerCase());
        if (matcher.find()) {
            duration = matcher.group(1);
        }
        
        prompt.append("🎯 ").append(regionName).append(" 지역 ").append(duration).append(" 여행코스를 추천드립니다!\n\n");
        
        // 지역 소개
        prompt.append("[지역 소개]\n");
        prompt.append(regionName).append("은 한국의 아름다운 관광지로 다양한 볼거리와 즐길거리가 가득한 곳입니다.\n");
        
        // 메인축제 정보
        Map<String, Object> mainFestival = (Map<String, Object>) tourData.get("mainFestival");
        if (mainFestival != null) {
            prompt.append("특히 현재 진행 중인 메인축제가 있어 더욱 특별한 여행을 즐길 수 있습니다.\n\n");
            prompt.append("**🎪 메인축제 정보:**\n");
            prompt.append("- 축제명: ").append(mainFestival.get("title")).append("\n");
            prompt.append("- 위치: ").append(mainFestival.getOrDefault("addr1", "정보 없음")).append("\n");
            if (mainFestival.get("eventstartdate") != null) {
                prompt.append("- 기간: ").append(mainFestival.get("eventstartdate"));
                if (mainFestival.get("eventenddate") != null) {
                    prompt.append(" ~ ").append(mainFestival.get("eventenddate"));
                }
                prompt.append("\n");
            }
            prompt.append("- 좌표: [").append(mainFestival.get("mapy")).append(",").append(mainFestival.get("mapx")).append("]\n\n");
        }
        
        // 근거리 관광지 정보
        List<Map<String, Object>> nearbySpots = (List<Map<String, Object>>) tourData.get("nearbySpots");
        if (nearbySpots != null && !nearbySpots.isEmpty()) {
            prompt.append("**🏛️ 메인축제 근처 추천 관광지 (실제 TourAPI 데이터):**\n");
            for (int i = 0; i < Math.min(10, nearbySpots.size()); i++) {
                Map<String, Object> spot = nearbySpots.get(i);
                prompt.append(i + 1).append(". ").append(spot.get("title")).append("\n");
                prompt.append("   위치: ").append(spot.getOrDefault("addr1", "정보 없음")).append("\n");
                prompt.append("   분류: ").append(spot.getOrDefault("categoryName", "관광지")).append("\n");
                if (spot.get("mapx") != null && spot.get("mapy") != null) {
                    prompt.append("   좌표: [").append(spot.get("mapy")).append(",").append(spot.get("mapx")).append("]\n");
                }
                prompt.append("\n");
            }
        }
        
        // AI 지시사항
        prompt.append("**📋 여행코스 구성 지침:**\n");
        prompt.append("1. 위의 메인축제를 반드시 첫 번째 코스에 포함해주세요\n");
        prompt.append("2. 위의 근거리 관광지 목록에서 실제 장소명과 좌표를 사용해주세요\n");
        prompt.append("3. 각 Day마다 최소 3-5개 코스를 추천해주세요\n");
        prompt.append("4. 장소 간 거리는 최대 50km 이내로 제한해주세요\n");
        prompt.append("5. 모든 코스에 @location:[위도,경도] @day:숫자 형식을 포함해주세요\n\n");
        
        // 출력 형식 예시
        prompt.append("**🔥 출력 형식 (반드시 지켜주세요):**\n\n");
        prompt.append("[Day 1 코스]\n");
        if (mainFestival != null) {
            prompt.append("1. **오전 09:00** - ").append(mainFestival.get("title")).append("\n");
            prompt.append("   @location:[").append(mainFestival.get("mapy")).append(",").append(mainFestival.get("mapx")).append("] @day:1\n");
            prompt.append("   포인트: 메인축제 참가\n\n");
        } else {
            prompt.append("1. **오전 09:00** - 경복궁\n");
            prompt.append("   @location:[37.5796,126.9770] @day:1\n");
            prompt.append("   포인트: 조선왕조 대표 궁궐\n\n");
        }
        
        prompt.append("2. **오후 12:00** - [위 관광지 목록 중 하나]\n");
        prompt.append("   @location:[실제좌표] @day:1\n");
        prompt.append("   포인트: 특별한 매력\n\n");
        
        prompt.append("3. **오후 15:00** - [위 관광지 목록 중 하나]\n");
        prompt.append("   @location:[실제좌표] @day:1\n");
        prompt.append("   포인트: 특별한 매력\n\n");
        
        if (duration.contains("2박") || duration.contains("3박")) {
            prompt.append("[Day 2 코스]\n");
            prompt.append("1. **오전 09:00** - [위 관광지 목록 중 하나]\n");
            prompt.append("   @location:[실제좌표] @day:2\n");
            prompt.append("   포인트: 특별한 매력\n\n");
        }
        
        prompt.append("**⚠️ 중요: 위의 관광지 목록에 있는 실제 장소명과 좌표를 반드시 사용해주세요!**\n\n");
        prompt.append("사용자 요청: ").append(userQuery).append("\n");
        prompt.append("위 정보를 바탕으로 ").append(duration).append(" 여행코스를 추천해주세요.");
        
        log.info("📝 생성된 프롬프트 길이: {}자", prompt.length());
        return prompt.toString();
    }
    
    /**
     * OpenAI API 호출 (TourAPI 데이터 포함)
     */
    private String callOpenAIWithTourData(String prompt) {
        try {
            // OpenAI API 키 확인
            if (openAiApiKey == null || openAiApiKey.isEmpty()) {
                log.warn("OpenAI API 키가 설정되지 않았습니다. 샘플 응답을 반환합니다.");
                return "죄송합니다. OpenAI API 키가 설정되지 않았습니다.";
            }
            
            // 요청 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + openAiApiKey);
            headers.set("Content-Type", "application/json");
            
            // 요청 바디 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o-mini");
            requestBody.put("max_tokens", 1500);
            requestBody.put("temperature", 0.7);
            
            List<Map<String, String>> messages = new ArrayList<>();
            
            messages.add(Map.of("role", "system", "content", 
                "당신은 한국 여행 전문가입니다. 사용자에게 실용적이고 구체적인 여행코스를 추천해주세요."));
            
            messages.add(Map.of("role", "user", "content", prompt));
            
            requestBody.put("messages", messages);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // OpenAI API 호출
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.openai.com/v1/chat/completions", HttpMethod.POST, entity, Map.class);
            
            // 응답 파싱
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            
            throw new RuntimeException("OpenAI API 응답 파싱 실패");
            
        } catch (Exception e) {
            log.error("OpenAI API 호출 실패", e);
            return "죄송합니다. AI 응답 생성 중 오류가 발생했습니다.";
        }
    }
    
    // 모든 TourAPI 관련 메서드 제거 - 프론트엔드에서 직접 처리
    
    /*
    @Override
    public Flux<String> generateTravelRecommendationStream(ChatRequest request) {
        return Flux.fromIterable(Arrays.asList(
            "안녕하세요! ",
            "여행 코스를 ",
            "추천해드리겠습니다.\n\n",
            "요청하신 지역의 ",
            "멋진 축제와 ",
            "관광지를 ",
            "소개해드릴게요!"
        )).delayElements(Duration.ofMillis(100));
    }
    */
    
    @Override
    public ChatResponse.LocationInfo extractLocationInfo(String content) {
        // 위치 정보 추출 로직 (정규식 사용)
        Pattern locationPattern = Pattern.compile("@location:\\[([^,]+),([^\\]]+)\\]\\s*@day:(\\d+)");
        Matcher matcher = locationPattern.matcher(content);
        
        if (matcher.find()) {
            return new ChatResponse.LocationInfo(
                "추천 장소",
                Double.parseDouble(matcher.group(1)),
                Double.parseDouble(matcher.group(2)),
                Integer.parseInt(matcher.group(3)),
                "AI 추천 장소입니다."
            );
        }
        
        return null;
    }
    
    private String callOpenAI(ChatRequest request) {
        try {
            // OpenAI API 키 확인
            if (openAiApiKey == null || openAiApiKey.isEmpty()) {
                log.warn("OpenAI API 키가 설정되지 않았습니다. 샘플 응답을 반환합니다.");
                return generateSampleResponse(request);
            }
            
            // 요청 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + openAiApiKey);
            headers.set("Content-Type", "application/json");
            
            // 요청 바디 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o-mini");
            requestBody.put("max_tokens", 1500);
            requestBody.put("temperature", 0.5);
            
            List<Map<String, String>> messages = new ArrayList<>();
            
            // 랜덤성을 위한 시드 추가
            long randomSeed = System.currentTimeMillis() % 1000;
            
            messages.add(Map.of("role", "system", "content", 
                "한국 여행 전문 AI - 실시간 맞춤 추천 (시드: " + randomSeed + ")\n\n" +
                "**🎯 핵심 임무:**\n" +
                "- 모든 질문에 대해 반드시 여행 코스 추천 (축제, 관광, 여행 등 모든 키워드)\n" +
                "- 기본은 당일치기 코스이며, 사용자가 몇박몇일을 명시하면 day별 구분\n" +
                "- 매번 다른 다양한 코스를 추천해야 함 (같은 지역이라도 다른 루트/장소)\n" +
                "- 축제 정보가 있으면 반드시 포함하여 추천\n\n" +
                
                "**🚨 절대 필수 답변 형식 (위치정보 없으면 지도에 표시 안됨!):**\n\n" +
                
                "**당일/1일 여행의 경우 (기본):**\n" +
                "[지역 소개] (2줄)\n" +
                "[추천 코스]\n" +
                "1. **오전 09:00** - 장소명\n" +
                "   @location:[37.1234,127.5678] @day:1\n" +
                "   포인트: 특별한 매력\n\n" +
                "2. **오후 12:00** - 장소명\n" +
                "   @location:[37.2345,127.6789] @day:1\n" +
                "   포인트: 특별한 매력\n\n" +
                "3. **오후 15:00** - 장소명\n" +
                "   @location:[37.3456,127.7890] @day:1\n" +
                "   포인트: 특별한 매력\n\n" +
                
                "**몇박몇일 여행의 경우 (1박2일, 2박3일 등):**\n" +
                "[지역 소개] (2줄)\n" +
                "[Day 1 코스]\n" +
                "1. **오전 09:00** - 경복궁\n" +
                "   @location:[37.1234,127.5678] @day:1\n" +
                "   포인트: 조선왕조 대표 궁궐\n\n" +
                "2. **오후 12:00** - 북촌한옥마을\n" +
                "   @location:[37.2345,127.6789] @day:1\n" +
                "   포인트: 전통 한옥 체험\n\n" +
                "3. **오후 15:00** - 인사동\n" +
                "   @location:[37.3456,127.7890] @day:1\n" +
                "   포인트: 전통문화 거리\n\n" +
                
                "[Day 2 코스]\n" +
                "1. **오전 09:00** - 남산타워\n" +
                "   @location:[37.4567,127.8901] @day:2\n" +
                "   포인트: 서울 전망 명소\n\n" +
                "2. **오후 12:00** - 명동쇼핑가\n" +
                "   @location:[37.5678,127.9012] @day:2\n" +
                "   포인트: 쇼핑과 맛집\n\n" +
                "3. **오후 15:00** - 청계천\n" +
                "   @location:[37.6789,127.0123] @day:2\n" +
                "   포인트: 도심 속 휴식공간\n\n" +
                
                "[Day 3 코스] (2박3일의 경우)\n" +
                "1. **오전 09:00** - 한강공원\n" +
                "   @location:[37.7890,127.1234] @day:3\n" +
                "   포인트: 자연과 휴식\n\n" +
                
                "**🚨🚨🚨 절대 규칙 (반드시 지켜야 함!):**\n" +
                "- 어떤 질문이든 반드시 여행 코스를 추천해야 함\n" +
                "- **Day별 섹션 헤더 필수: [Day 1 코스], [Day 2 코스] 형식으로 명확히 구분**\n" +
                "- **2박3일이면 Day 1, Day 2, Day 3 모든 일정을 완성해야 함**\n" +
                "- **1박2일이면 Day 1, Day 2 모든 일정을 완성해야 함**\n" +
                "- @location:[위도,경도] @day:숫자 형식을 모든 장소에 반드시 포함\n" +
                "- 위도, 경도는 실제 소수점 숫자여야 함 (예: 37.5665, 126.9780)\n" +
                "- Day별로 구분하여 각 Day마다 최소 3개 코스 추천\n" +
                "- 위치정보가 없으면 지도에 마커가 표시되지 않음\n" +
                "- 이모지 사용 금지\n" +
                "- 반드시 구체적인 여행 코스 제공\n" +
                "- **절대로 중간에 끝내지 말고 요청된 모든 날짜의 일정을 완성하세요**\n" +
                "- **Day별 헤더 예시: [Day 1 코스], [Day 2 코스], [Day 3 코스] - 이 형식 반드시 지켜주세요!**\n" +
                "- **매번 다른 다양한 장소를 추천하세요 (같은 지역이라도 다른 루트)**\n" +
                "- **각 장소 간 거리는 최대 50km 이내로 제한**"));
            
            messages.add(Map.of("role", "user", "content", request.getMessage()));
            
            requestBody.put("messages", messages);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // OpenAI API 호출
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.openai.com/v1/chat/completions", HttpMethod.POST, entity, Map.class);
            
            // 응답 파싱
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            
            throw new RuntimeException("OpenAI API 응답 파싱 실패");
            
        } catch (Exception e) {
            log.error("OpenAI API 호출 실패", e);
            return generateSampleResponse(request);
        }
    }
    
    private String generateSampleResponse(ChatRequest request) {
        String region = request.getRegion() != null ? request.getRegion() : "요청하신";
        return "안녕하세요! " + region + " 지역의 멋진 축제 여행 코스를 추천해드리겠습니다.\n\n" +
                "🎪 추천 코스:\n\n" +
                "**1일차**\n" +
                "- 오전: 지역 대표 축제 참가\n" +
                "- 오후: 전통 체험 활동\n" +
                "- 저녁: 지역 특산물 맛보기\n\n" +
                "**2일차**\n" +
                "- 오전: 문화유적지 관람\n" +
                "- 오후: 자연 명소 탐방\n" +
                "- 저녁: 축제 공연 관람\n\n" +
                "즐거운 여행 되세요! 🎉";
    }
    
    private List<ChatResponse.LocationInfo> extractLocations(String content) {
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        // 샘플 위치 정보 (실제로는 AI 응답에서 추출)
        locations.add(new ChatResponse.LocationInfo(
            "축제 메인 회장", 37.5665, 126.9780, 1, "주요 축제가 열리는 곳"
        ));
        
        return locations;
    }
} 