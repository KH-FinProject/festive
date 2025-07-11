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
        recommendation.append("\n 각 장소를 클릭하면 더 자세한 정보를 확인할 수 있어요!");
        recommendation.append("\n 지도에서 위치도 함께 확인해보세요!");
        
        return recommendation.toString();
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
} 