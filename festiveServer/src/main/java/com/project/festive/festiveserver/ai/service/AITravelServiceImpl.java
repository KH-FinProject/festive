package com.project.festive.festiveserver.ai.service;

import com.project.festive.festiveserver.ai.dto.ChatRequest;
import com.project.festive.festiveserver.ai.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AITravelServiceImpl implements AITravelService {
    
    @Value("${openai.api.key:}")
    private String openAiApiKey;
    
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

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public ChatResponse generateTravelRecommendation(ChatRequest request) {
        try {
            log.info("🎯 AI 여행 추천 시작: {}", request.getMessage());
            
            // 1. 지역코드 추출
            String areaCode = extractAreaCode(request.getMessage());
            String regionName = AREA_NAME_MAP.getOrDefault(areaCode, "서울");
            log.info("🗺️ 추출된 지역: {} (코드: {})", regionName, areaCode);
            
            // 2. TourAPI 데이터 포함 프롬프트 생성
            String enhancedPrompt = createEnhancedPromptWithTourData(
                request.getMessage(), 
                regionName, 
                request.getFestivalData(), 
                request.getNearbySpots()
            );
            
            // 3. OpenAI API 호출
            String aiResponse = callOpenAI(enhancedPrompt);
            
            // 4. 위치 정보 추출
            List<ChatResponse.LocationInfo> locations = extractLocations(aiResponse);
            
            // 5. 축제 정보 생성 (프론트엔드 데이터 기반)
            ChatResponse.FestivalInfo festivalInfo = createFestivalInfoFromRequest(request.getFestivalData());
            
            ChatResponse response = new ChatResponse();
            response.setContent(aiResponse);
            response.setLocations(locations);
            response.setMainFestival(festivalInfo);
            response.setStreaming(false);
            
            log.info("✅ AI 여행 추천 완료 - 추출된 위치: {}개", locations.size());
            
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
     * TourAPI 데이터를 포함한 향상된 프롬프트 생성
     */
    private String createEnhancedPromptWithTourData(String userQuery, String regionName, 
                                                  ChatRequest.FestivalData festivalData, 
                                                  List<ChatRequest.NearbySpot> nearbySpots) {
        StringBuilder prompt = new StringBuilder();
        
        // 여행 기간 추출
        String duration = "당일치기";
        Pattern durationPattern = Pattern.compile("(\\d+박\\d+일)");
        Matcher matcher = durationPattern.matcher(userQuery.toLowerCase());
        if (matcher.find()) {
            duration = matcher.group(1);
        }
        
        prompt.append(regionName).append(" 지역 ").append(duration).append(" 여행코스를 추천드립니다!\n\n");
        
        // 지역 소개
        prompt.append("[지역 소개]\n");
        prompt.append(regionName).append("은 한국의 아름다운 관광지로 다양한 볼거리와 즐길거리가 가득한 곳입니다.\n");
        
        // 메인축제 정보 (프론트엔드에서 전달받은 실제 TourAPI 데이터)
        if (festivalData != null && festivalData.getTitle() != null) {
            prompt.append("특히 현재 진행 중인 메인축제가 있어 더욱 특별한 여행을 즐길 수 있습니다.\n\n");
            
            if (festivalData.getMapx() != null && festivalData.getMapy() != null) {
                prompt.append("**메인축제:**\n");
                prompt.append("1. **오전 10:00** - ").append(festivalData.getTitle()).append("\n");
                prompt.append("   @location:[").append(festivalData.getMapy()).append(",").append(festivalData.getMapx()).append("] @day:1\n");
                prompt.append("   포인트: 현재 진행 중인 특별한 축제 - ").append(festivalData.getAddr1()).append("\n\n");
            }
            
            log.info("🎪 축제 정보 포함: {}", festivalData.getTitle());
        }
        
        // 근거리 관광지 정보 (프론트엔드에서 전달받은 실제 TourAPI 데이터)
        if (nearbySpots != null && !nearbySpots.isEmpty()) {
            prompt.append("**추천 관광지 (실제 TourAPI 데이터):**\n");
            int spotIndex = festivalData != null ? 2 : 1; // 축제가 있으면 2번부터 시작
            int day = 1;
            
            for (int i = 0; i < Math.min(8, nearbySpots.size()); i++) {
                ChatRequest.NearbySpot spot = nearbySpots.get(i);
                if (spot.getMapx() != null && spot.getMapy() != null && spot.getTitle() != null) {
                    // 3일 이상 여행이면 Day 구분
                    if (duration.contains("박") && spotIndex > 3) {
                        if (spotIndex == 4) day = 2;
                        else if (spotIndex == 7) day = 3;
                    }
                    
                    prompt.append(spotIndex).append(". **");
                    
                    // 시간 설정
                    if (spotIndex <= 3) prompt.append("오후 ").append(12 + (spotIndex-1)*2).append(":00");
                    else if (spotIndex <= 6) prompt.append("오전 ").append(9 + (spotIndex-4)*2).append(":00");
                    else prompt.append("오후 ").append(13 + (spotIndex-7)*2).append(":00");
                    
                    prompt.append("** - ").append(spot.getTitle()).append("\n");
                    prompt.append("   @location:[").append(spot.getMapy()).append(",").append(spot.getMapx()).append("] @day:").append(day).append("\n");
                    prompt.append("   포인트: ").append(spot.getCategoryName() != null ? spot.getCategoryName() : "관광지").append(" - ");
                    
                    String addr = spot.getAddr1();
                    if (addr != null && addr.length() > 20) {
                        addr = addr.substring(0, 20) + "...";
                    }
                    prompt.append(addr != null ? addr : "위치 정보").append("\n\n");
                    
                    spotIndex++;
                }
            }
            
            log.info("🎯 주변 관광지 정보 포함: {}개", nearbySpots.size());
        }
        
        prompt.append("위 정보를 바탕으로 ").append(duration).append(" 여행코스를 Day별로 구성해서 추천해주세요.\n");
        prompt.append("각 장소마다 @location:[위도,경도] @day:숫자 형식을 반드시 포함해주세요.");
        
        return prompt.toString();
    }
    
    /**
     * 프론트엔드 데이터로 FestivalInfo 생성
     */
    private ChatResponse.FestivalInfo createFestivalInfoFromRequest(ChatRequest.FestivalData festivalData) {
        if (festivalData == null || festivalData.getTitle() == null) {
            return null;
        }
        
        // 기간 정보 조합
        String period = "";
        String startDate = festivalData.getEventstartdate();
        String endDate = festivalData.getEventenddate();
        if (startDate != null) {
            period = startDate;
            if (endDate != null && !endDate.equals(startDate)) {
                period += " ~ " + endDate;
            }
        }
        
        ChatResponse.FestivalInfo festivalInfo = new ChatResponse.FestivalInfo(
            festivalData.getTitle(),
            period,
            festivalData.getAddr1(),
            festivalData.getOverview(),
            festivalData.getFirstimage(),
            festivalData.getTel()
        );
        
        return festivalInfo;
    }
    
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
            requestBody.put("temperature", 0.5);
            
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
            log.error("OpenAI API 호출 실패: {}", e.getMessage());
            return "죄송합니다. AI 서비스에 일시적인 문제가 발생했습니다.";
        }
    }
    
    private List<ChatResponse.LocationInfo> extractLocations(String content) {
        List<ChatResponse.LocationInfo> locations = new ArrayList<>();
        
        // @location:[위도,경도] @day:숫자 패턴을 찾기 위한 정규식
        Pattern locationPattern = Pattern.compile("@location:\\[([^,]+),([^\\]]+)\\]\\s*@day:(\\d+)");
        Matcher matcher = locationPattern.matcher(content);
        
        while (matcher.find()) {
            try {
                double latitude = Double.parseDouble(matcher.group(1).trim());
                double longitude = Double.parseDouble(matcher.group(2).trim());
                int day = Integer.parseInt(matcher.group(3).trim());
                
                // 해당 위치 이전의 텍스트에서 장소명 추출
                String beforeLocation = content.substring(0, matcher.start());
                String placeName = extractPlaceNameFromContext(beforeLocation);
                
                if (placeName == null || placeName.isEmpty()) {
                    placeName = "추천 장소 " + (locations.size() + 1);
                }
                
                locations.add(new ChatResponse.LocationInfo(
                    placeName,
                    latitude,
                    longitude,
                    day,
                    "AI 추천 장소입니다."
                ));
                
                log.debug("장소 추출: {} (위도: {}, 경도: {}, Day: {})", placeName, latitude, longitude, day);
                
            } catch (NumberFormatException e) {
                log.warn("위치 정보 파싱 실패: {}", matcher.group());
            }
        }
        
        log.info("추출된 위치 정보: {}개", locations.size());
        return locations;
    }
    
    /**
     * 컨텍스트에서 장소명을 추출하는 헬퍼 메서드
     */
    private String extractPlaceNameFromContext(String context) {
        log.info("🔍 장소명 추출 시작 - 컨텍스트 길이: {}", context.length());
        
        // 역순으로 줄을 확인하여 가장 가까운 장소명 찾기
        String[] lines = context.split("\n");
        
        for (int i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
            String line = lines[i].trim();
            
            if (line.isEmpty()) continue;
            
            log.info("🔎 라인 검사 [{}]: {}", i, line);
            
            // 패턴 1: "1. **광안리 해수욕장**" 형태 (번호와 함께)
            Pattern pattern1 = Pattern.compile("\\d+\\.\\s*\\*\\*([^*]+)\\*\\*");
            Matcher matcher1 = pattern1.matcher(line);
            if (matcher1.find()) {
                String name = matcher1.group(1).trim();
                log.info("📍 패턴1 발견: {}", name);
                if (isValidPlaceName(name)) {
                    log.info("✅ 장소명 추출 성공 (패턴1): {}", name);
                    return name;
                }
            }
            
            // 패턴 2: "- **해운대 해수욕장**" 형태
            Pattern pattern2 = Pattern.compile("-\\s*\\*\\*([^*]+)\\*\\*");
            Matcher matcher2 = pattern2.matcher(line);
            if (matcher2.find()) {
                String name = matcher2.group(1).trim();
                log.info("📍 패턴2 발견: {}", name);
                if (isValidPlaceName(name)) {
                    log.info("✅ 장소명 추출 성공 (패턴2): {}", name);
                    return name;
                }
            }
            
            // 패턴 3: "**해운대 해수욕장**" 형태 (단순)
            Pattern pattern3 = Pattern.compile("\\*\\*([^*]+)\\*\\*");
            Matcher matcher3 = pattern3.matcher(line);
            if (matcher3.find()) {
                String name = matcher3.group(1).trim();
                log.info("📍 패턴3 발견: {}", name);
                if (isValidPlaceName(name)) {
                    log.info("✅ 장소명 추출 성공 (패턴3): {}", name);
                    return name;
                }
            }
        }
        
        log.warn("⚠️ 장소명 추출 실패 - 기본값 사용");
        return null;
    }
    
    /**
     * 유효한 장소명인지 확인
     */
    private boolean isValidPlaceName(String name) {
        if (name == null || name.isEmpty()) {
            log.warn("❌ 장소명이 null 또는 비어있음");
            return false;
        }
        
        log.info("🔍 장소명 유효성 검사: '{}'", name);
        
        // 제외할 패턴들 (더 포괄적)
        String[] excludePatterns = {
            "Day", "day", "시간", "코스", "저녁", "오전", "오후", "포인트",
            "부산에서의", "부산의", "해변과", "문화", "체험", "역사와", "전통을", "느끼다", 
            "자연과", "힐링", "여행", "추천", "아래와", "같이", "드립니다",
            "서울에서의", "서울의", "인천에서의", "인천의"
        };
        
        for (String pattern : excludePatterns) {
            if (name.contains(pattern)) {
                log.warn("❌ 제외 패턴 포함: '{}' -> '{}'", name, pattern);
                return false;
            }
        }
        
        // 시간 형식 제외 (00:00 형태)
        if (name.matches(".*\\d{1,2}:\\d{2}.*")) {
            log.warn("❌ 시간 형식 포함: '{}'", name);
            return false;
        }
        
        // 길이 확인 (2자 이상 30자 이하)
        if (name.length() < 2 || name.length() > 30) {
            log.warn("❌ 부적절한 길이: '{}' ({}자)", name, name.length());
            return false;
        }
        
        // 숫자만으로 구성된 경우 제외
        if (name.matches("^\\d+$")) {
            log.warn("❌ 숫자만 포함: '{}'", name);
            return false;
        }
        
        log.info("✅ 유효한 장소명: '{}'", name);
        return true;
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
} 