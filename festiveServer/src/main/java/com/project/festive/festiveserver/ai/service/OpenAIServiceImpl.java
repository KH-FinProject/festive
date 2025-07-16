package com.project.festive.festiveserver.ai.service;

import com.project.festive.festiveserver.ai.dto.TravelAnalysis;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAIServiceImpl implements OpenAIService {
    
    @Value("${openai.api.key:}")
    private String openAiApiKey;
    
    private final RestTemplate restTemplate;
    
    // 금지된 일반적인 관광지 목록
    private final List<String> forbiddenPlaces = Arrays.asList(
        "경복궁", "창덕궁", "덕수궁", "창경궁", "종묘",
        "북촌한옥마을", "인사동", "명동", "동대문", "홍대", "강남", "신사동", "가로수길",
        "청계천", "한강공원", "남산타워", "N서울타워", "남산공원",
        "이태원", "압구정", "잠실", "롯데월드", "코엑스",
        "여의도", "63빌딩", "반포한강공원", "뚝섬한강공원"
    );

    @Override
    public String callOpenAI(String prompt) {
        if (openAiApiKey == null || openAiApiKey.trim().isEmpty()) {
            log.warn("OpenAI API 키가 설정되지 않았습니다.");
            return "AI 서비스를 사용할 수 없습니다. 관리자에게 문의해주세요.";
        }

        try {
    

            // OpenAI API 요청 헤더
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + openAiApiKey);
            headers.set("Content-Type", "application/json");

            // 요청 바디 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o-mini");
            requestBody.put("max_tokens", 1500);
            requestBody.put("temperature", 0.7);

            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            requestBody.put("messages", Arrays.asList(message));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // OpenAI API 호출
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/chat/completions",
                request,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                
                if (choices != null && !choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message_response = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message_response.get("content");
                    
        
                    return content.trim();
                }
            }

            log.warn("⚠️ OpenAI API 응답에서 유효한 내용을 찾을 수 없습니다.");
            return "죄송합니다. AI 응답을 생성할 수 없습니다.";

        } catch (Exception e) {
            log.error("❌ OpenAI API 호출 실패: {}", e.getMessage(), e);
            return "AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
    }

    @Override
    public String createDayPointPrompt(List<AITravelServiceImpl.TourAPIResponse.Item> dayItems, int day, String region) {
        if (dayItems == null || dayItems.isEmpty()) {
            return "";
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append(String.format("%s Day %d 여행 포인트를 작성해주세요.\n\n", region, day));
        prompt.append("방문 장소들:\n");
        
        for (int i = 0; i < dayItems.size(); i++) {
            AITravelServiceImpl.TourAPIResponse.Item item = dayItems.get(i);
            prompt.append(String.format("%d. %s", i + 1, item.getTitle()));
            if (item.getAddr1() != null) {
                prompt.append(String.format(" (%s)", item.getAddr1()));
            }
            prompt.append("\n");
        }
        
        prompt.append("\n다음 조건으로 작성해주세요:\n");
        prompt.append("- 각 장소의 특징과 볼거리를 간략히 설명\n");
        prompt.append("- 방문 순서와 동선 고려\n");
        prompt.append("- 실용적인 여행 팁 포함\n");
        prompt.append("- 한국어로 작성\n");
        prompt.append("- 친근하고 따뜻한 톤\n");

        return prompt.toString();
    }

    @Override
    public String callOpenAIForDayPoint(String prompt) {
        return callOpenAI(prompt);
    }

    @Override
    public String formatAIResponseForFrontend(String aiResponse) {
        if (aiResponse == null || aiResponse.trim().isEmpty()) {
            return "여행 정보를 준비하고 있습니다.";
        }

        try {
            String formatted = aiResponse.trim();
            
            // 불필요한 마크다운 문법 제거
            formatted = formatted.replaceAll("#+\\s*", ""); // 헤딩 제거
            formatted = formatted.replaceAll("\\*\\*(.*?)\\*\\*", "$1"); // 볼드 제거
            formatted = formatted.replaceAll("\\*(.*?)\\*", "$1"); // 이탤릭 제거
            formatted = formatted.replaceAll("```[\\s\\S]*?```", ""); // 코드 블록 제거
            
            // 연속된 개행 정리
            formatted = formatted.replaceAll("\n{3,}", "\n\n");
            
            // 불필요한 접두사 제거
            formatted = formatted.replaceAll("^(안녕하세요|답변:|응답:)\\s*", "");
            
            return formatted.trim();
            
        } catch (Exception e) {
            log.error("❌ AI 응답 포맷팅 실패: {}", e.getMessage(), e);
            return aiResponse;
        }
    }

    @Override
    public String createStructuredResponseMessage(TravelAnalysis analysis, List<AITravelServiceImpl.TourAPIResponse.Item> tourAPIData) {
        StringBuilder message = new StringBuilder();
        
        // 기본 여행 정보
        message.append(String.format("**%s 여행 정보**\n\n", analysis.getRegion()));
        
        if (analysis.getDuration() != null) {
            message.append(String.format("**여행 기간**: %s\n", analysis.getDuration()));
        }
        
        // 여행코스 정보 (contentTypeId=25)
        List<AITravelServiceImpl.TourAPIResponse.Item> travelCourses = tourAPIData.stream()
            .filter(item -> "25".equals(item.getContentTypeId()))
            .collect(Collectors.toList());
            
        if (!travelCourses.isEmpty()) {
            message.append("\n**추천 여행코스**\n");
            for (int i = 0; i < Math.min(3, travelCourses.size()); i++) {
                AITravelServiceImpl.TourAPIResponse.Item course = travelCourses.get(i);
                message.append(String.format("• %s\n", course.getTitle()));
            }
        }
        
        // 주요 관광지 (contentTypeId=12)
        List<AITravelServiceImpl.TourAPIResponse.Item> attractions = tourAPIData.stream()
            .filter(item -> "12".equals(item.getContentTypeId()))
            .collect(Collectors.toList());
            
        if (!attractions.isEmpty()) {
            message.append("\n **주요 관광지**\n");
            for (int i = 0; i < Math.min(5, attractions.size()); i++) {
                AITravelServiceImpl.TourAPIResponse.Item attraction = attractions.get(i);
                message.append(String.format("• %s", attraction.getTitle()));
                if (attraction.getAddr1() != null) {
                    String shortAddr = attraction.getAddr1().length() > 20 
                        ? attraction.getAddr1().substring(0, 20) + "..." 
                        : attraction.getAddr1();
                    message.append(String.format(" (%s)", shortAddr));
                }
                message.append("\n");
            }
        }
        
        return message.toString();
    }

    @Override
    public String createTourAPIFirstRecommendation(List<Map<String, Object>> travelCourses, 
                                                  List<Map<String, Object>> otherSpots, 
                                                  String originalMessage, 
                                                  String keyword) {
        StringBuilder recommendation = new StringBuilder();
        
        // 키워드 기반 인사말
        if (keyword != null && !keyword.trim().isEmpty()) {
            recommendation.append(String.format(" **%s** 관련 여행 정보를 찾아드렸어요!\n\n", keyword));
        } else {
            recommendation.append("**맞춤 여행 추천**을 준비했어요!\n\n");
        }
        
        // 여행코스 우선 표시
        if (!travelCourses.isEmpty()) {
            recommendation.append("**추천 여행코스**\n");
            for (int i = 0; i < Math.min(3, travelCourses.size()); i++) {
                Map<String, Object> course = travelCourses.get(i);
                String title = (String) course.get("title");
                recommendation.append(String.format("• %s\n", title != null ? title : "여행코스"));
            }
            recommendation.append("\n");
        }
        
        // 기타 관광지
        if (!otherSpots.isEmpty()) {
            recommendation.append("**주요 여행지**\n");
            for (int i = 0; i < Math.min(5, otherSpots.size()); i++) {
                Map<String, Object> spot = otherSpots.get(i);
                String title = (String) spot.get("title");
                String addr = (String) spot.get("addr1");
                
                recommendation.append(String.format("• %s", title != null ? title : "관광지"));
                if (addr != null && !addr.trim().isEmpty()) {
                    String shortAddr = addr.length() > 30 ? addr.substring(0, 30) + "..." : addr;
                    recommendation.append(String.format(" (%s)", shortAddr));
                }
                recommendation.append("\n");
            }
        }
        
        // 마무리 멘트
        recommendation.append("\n즐거운 여행 되세요! 🎉");
        
        return recommendation.toString();
    }

    @Override
    public String createFestivalSearchResponse(List<Map<String, Object>> festivalData, 
                                             String originalMessage, 
                                             String keyword, 
                                             String region) {
        StringBuilder response = new StringBuilder();
        
        // 🎪 축제 검색 전용 인사말
        if (keyword != null && !keyword.trim().isEmpty()) {
            response.append(String.format("🎪 **%s** 관련 축제 정보를 찾아드렸어요!\n\n", keyword));
        } else {
            String regionText = (region != null && !region.equals("한국")) ? region + " " : "";
            response.append(String.format("🎪 %s축제 정보를 찾아드렸어요!\n\n", regionText));
        }
        
        if (festivalData.isEmpty()) {
            // 축제 데이터가 없는 경우
            response.append("죄송합니다. 현재 진행 중이거나 예정된 축제가 없습니다. 😔\n\n");
            response.append("💡 **다른 검색 키워드를 시도해보세요:**\n");
            response.append("• 벚꽃축제, 불꽃축제, 음식축제, 문화축제\n");
            response.append("• 드론축제, 로봇축제, K-POP 페스티벌\n");
            response.append("• 다른 지역의 축제도 검색해보세요!\n");
        } else {
            // 축제 데이터가 있는 경우 - 축제별 상세 정보 제공
            response.append(String.format("총 **%d개**의 축제를 찾았습니다! 🎉\n\n", festivalData.size()));
            
            // 축제 목록 표시 (최대 10개)
            for (int i = 0; i < Math.min(10, festivalData.size()); i++) {
                Map<String, Object> festival = festivalData.get(i);
                
                String title = getString(festival, "title");
                String addr = getString(festival, "addr1");
                String eventStartDate = getString(festival, "eventstartdate");
                String eventEndDate = getString(festival, "eventenddate");
                String tel = getString(festival, "tel");
                
                response.append(String.format("🎭 **%s**\n", title));
                
                // 축제 일정
                if (eventStartDate != null && !eventStartDate.isEmpty()) {
                    if (eventEndDate != null && !eventEndDate.isEmpty() && !eventStartDate.equals(eventEndDate)) {
                        response.append(String.format("📅 **일정**: %s ~ %s\n", 
                            formatDate(eventStartDate), formatDate(eventEndDate)));
                    } else {
                        response.append(String.format("📅 **일정**: %s\n", formatDate(eventStartDate)));
                    }
                }
                
                // 축제 장소
                if (addr != null && !addr.isEmpty()) {
                    String shortAddr = addr.length() > 40 ? addr.substring(0, 40) + "..." : addr;
                    response.append(String.format("📍 **장소**: %s\n", shortAddr));
                }
                
                // 문의전화
                if (tel != null && !tel.isEmpty() && !tel.equals("null")) {
                    response.append(String.format("📞 **문의**: %s\n", tel));
                }
                
                response.append("\n");
            }
            
            // 축제 팁 및 안내
            response.append("💡 **축제 관람 팁**:\n");
            response.append("• 축제 일정은 변경될 수 있으니 사전에 확인해주세요\n");
            response.append("• 주차 공간이 부족할 수 있으니 대중교통을 이용하세요\n");
            response.append("• 날씨에 따라 행사가 변경될 수 있습니다\n\n");
            
            if (festivalData.size() > 10) {
                response.append(String.format("✨ 더 많은 축제(%d개)는 갤러리에서 확인하실 수 있습니다!", 
                    festivalData.size() - 10));
            }
        }
        
        return response.toString();
    }
    
    /**
     * 안전한 문자열 추출
     */
    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null || "null".equals(String.valueOf(value))) {
            return null;
        }
        return String.valueOf(value).trim();
    }
    
    /**
     * 날짜 포맷팅 (YYYYMMDD → YYYY.MM.DD)
     */
    private String formatDate(String dateString) {
        if (dateString == null || dateString.length() != 8) {
            return dateString;
        }
        
        try {
            String year = dateString.substring(0, 4);
            String month = dateString.substring(4, 6);
            String day = dateString.substring(6, 8);
            return String.format("%s.%s.%s", year, month, day);
        } catch (Exception e) {
            return dateString;
        }
    }

    @Override
    public String removeEmojis(String text) {
        if (text == null) return null;
        
        try {
            // 이모지 유니코드 범위를 정규식으로 제거
            return text.replaceAll(
                "[\uD83C-\uDBFF\uDC00-\uDFFF]" + // 기본 이모지
                "|[\u2600-\u27FF]" +              // 기타 심볼
                "|[\uD83E\uDD00-\uDDFF]" +        // 추가 이모지
                "|[\u2700-\u27BF]",               // 화살표 등
                ""
            ).trim();
        } catch (Exception e) {
            log.debug("이모지 제거 실패: {}", e.getMessage());
            return text;
        }
    }

    @Override
    public boolean containsForbiddenPlaces(String response) {
        if (response == null || response.trim().isEmpty()) {
            return false;
        }
        
        String lowerResponse = response.toLowerCase();
        
        return forbiddenPlaces.stream()
            .anyMatch(place -> lowerResponse.contains(place.toLowerCase()));
    }

    @Override
    public String createRejectionMessage() {
        return "죄송합니다. 현재 실제 여행 데이터를 기반으로 한 추천만 제공하고 있습니다. " +
               "좀 더 구체적인 지역명이나 여행 키워드를 입력해주시면, " +
               "해당 지역의 실제 관광지와 여행코스를 추천해드릴게요! ";
    }
    
    @Override
    public String extractRegionWithAI(String userMessage, String availableRegions) {

        
        StringBuilder prompt = new StringBuilder();
        prompt.append("사용자의 메시지에서 한국의 지역명을 정확히 추출해주세요.\n\n");
        prompt.append("**사용자 메시지**: \"").append(userMessage).append("\"\n\n");
        prompt.append("**가능한 지역 목록**:\n");
        prompt.append(availableRegions).append("\n\n");
        
        prompt.append("**추출 규칙**:\n");
        prompt.append("1. 메시지에서 지역명을 찾아서 위 목록에서 정확히 일치하는 것을 선택\n");
        prompt.append("2. 지역명의 별칭이나 줄임말도 고려 (예: 통영 → 통영시)\n");
        prompt.append("3. 조사나 어미는 무시 (예: '통영으로' → '통영시')\n");
        prompt.append("4. 오타나 표기 변형도 고려\n");
        prompt.append("5. 지역명이 없으면 'NONE' 반환\n\n");
        
        prompt.append("**응답 형식** (JSON):\n");
        prompt.append("{\n");
        prompt.append("  \"region\": \"정확한 지역명\",\n");
        prompt.append("  \"areaCode\": \"지역코드\",\n");
        prompt.append("  \"sigunguCode\": \"시군구코드\",\n");
        prompt.append("  \"confidence\": \"HIGH|MEDIUM|LOW\"\n");
        prompt.append("}\n\n");
        
        prompt.append("**예시**:\n");
        prompt.append("- '통영 2박3일 음식점위주로 여행계획 짜줘' → {\"region\": \"통영시\", \"areaCode\": \"36\", \"sigunguCode\": \"17\", \"confidence\": \"HIGH\"}\n");
        prompt.append("- '부산 여행 가고싶어' → {\"region\": \"부산광역시\", \"areaCode\": \"6\", \"sigunguCode\": null, \"confidence\": \"HIGH\"}\n");
        prompt.append("- '맛집 추천해줘' → {\"region\": \"NONE\", \"areaCode\": null, \"sigunguCode\": null, \"confidence\": \"LOW\"}\n");
        
        return callOpenAI(prompt.toString());
    }
    
    @Override
    public String extractKeywordWithAI(String userMessage) {
        try {
            StringBuilder prompt = new StringBuilder();
            prompt.append("사용자의 메시지에서 검색하고 싶은 핵심 키워드를 추출해주세요.\n\n");
            prompt.append("**사용자 메시지**: \"").append(userMessage).append("\"\n\n");
            
            prompt.append("**키워드 추출 규칙**:\n");
            prompt.append("1. 사용자가 찾고 싶어하는 구체적인 명사형 키워드만 추출\n");
            prompt.append("2. 모든 종류의 키워드 허용 (제한 없음)\n");
            prompt.append("   - 전통적인 축제: 벚꽃, 불꽃, 음식, 문화, 전통 등\n");
            prompt.append("   - 현대적인 축제: 드론, 로봇, IT, 게임, K-POP, 애니메이션 등\n");
            prompt.append("   - 특별한 키워드: 핸드폰, 컴퓨터, 자동차, 패션, 뷰티 등\n");
            prompt.append("   - 모든 가능한 축제/이벤트 주제 포함\n");
            prompt.append("3. **반드시 제외할 것들**:\n");
            prompt.append("   - 지역명: 서울, 부산, 경기도 등\n");
            prompt.append("   - 기간: 2박3일, 하루, 주말 등\n");
            prompt.append("   - 일반 동사: 알려줘, 추천, 가자, 보여줘 등\n");
            prompt.append("   - 수식어/접미사: 관련, 축제, 행사, 이벤트, 페스티벌, 대회, 박람회, 쇼, 전시회, 컨벤션 등\n");
            prompt.append("   - 일반 명사: 정보, 여행, 계획, 코스 등\n");
            prompt.append("4. 순수한 주제어만 추출 (수식어 제거)\n");
            prompt.append("   - '드론관련' → '드론'\n");
            prompt.append("   - '벚꽃축제' → '벚꽃'\n");
            prompt.append("   - '로봇페스티벌' → '로봇'\n");
            prompt.append("5. 키워드가 명확하지 않으면 빈 문자열 반환\n\n");
            
            prompt.append("**응답 형식**: 순수한 키워드 하나만 반환 (설명 없이)\n\n");
            
            prompt.append("**예시**:\n");
            prompt.append("- '서울 벚꽃축제 알려줘' → 벚꽃\n");
            prompt.append("- '부산 드론관련 축제 정보' → 드론\n");
            prompt.append("- '대구 로봇페스티벌 언제야?' → 로봇\n");
            prompt.append("- '인천 게임대회 가고싶어' → 게임\n");
            prompt.append("- '경기도 핸드폰 관련 행사' → 핸드폰\n");
            prompt.append("- '제주도 자동차쇼 정보' → 자동차\n");
            prompt.append("- '강원도 애니메이션축제' → 애니메이션\n");
            prompt.append("- '충남 2박3일 여행계획' → \n");
            prompt.append("- '전북 가볼만한 곳 추천' → \n");
            
            String response = callOpenAI(prompt.toString());
            
            // AI 응답 정리 및 후처리
            if (response != null) {
                response = response.trim()
                    .replaceAll("\\n+", "")
                    .replaceAll("\\s+", " ")
                    .replaceAll("[^가-힣a-zA-Z0-9\\s]", "")
                    .trim();
                
                // 불필요한 접미사 제거 (추가 보안)
                response = removeUnnecessarySuffixes(response);
                    
                // 너무 길거나 짧으면 빈 문자열 반환
                if (response.length() > 10 || response.length() < 2) {
                    return "";
                }
                
                return response;
            }
            
            return "";
            
        } catch (Exception e) {
            log.error("❌ AI 키워드 추출 실패: {}", e.getMessage(), e);
            return "";
        }
    }
    
    /**
     * 키워드에서 불필요한 접미사 제거
     */
    private String removeUnnecessarySuffixes(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return "";
        }
        
        String[] suffixes = {
            "관련", "축제", "행사", "이벤트", "페스티벌", "대회", "박람회", "쇼", "전시회", "컨벤션"
        };
        
        for (String suffix : suffixes) {
            if (keyword.endsWith(suffix)) {
                String base = keyword.substring(0, keyword.length() - suffix.length()).trim();
                if (base.length() >= 2) { // 최소 2글자 이상이어야 의미있는 키워드
                    return base;
                }
            }
        }
        
        return keyword;
    }
} 