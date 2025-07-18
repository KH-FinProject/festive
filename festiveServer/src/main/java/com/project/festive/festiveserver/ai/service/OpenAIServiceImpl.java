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
            requestBody.put("max_tokens", 4000); // 1500 → 4000으로 대폭 증가
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
        
        prompt.append("**🎯 지능적 지역 추론 규칙**:\n");
        prompt.append("1. **직접 지역명**: 메시지에서 지역명을 찾아서 위 목록에서 정확히 일치하는 것을 선택\n");
        prompt.append("2. **지역명 변형**: 별칭이나 줄임말도 고려 (예: 통영 → 통영시, 부산 → 부산광역시)\n");
        prompt.append("3. **조사/어미 무시**: 조사나 어미는 무시 (예: '통영으로' → '통영시')\n");
        prompt.append("4. **🚇 지하철역/역사 → 지역 추론**: 당신의 지식을 활용해 지하철역이나 기차역이 어느 지역에 있는지 판단\n");
        prompt.append("   예) 명동역 → 서울 중구, 홍대입구역 → 서울 마포구, 부산역 → 부산 동구\n");
        prompt.append("5. **🏛️ 랜드마크/관광지 → 지역 추론**: 유명한 랜드마크나 관광지가 어느 지역에 있는지 판단\n");
        prompt.append("   예) 경복궁 → 서울 종로구, 해운대 → 부산 해운대구, 제주공항 → 제주 제주시\n");
        prompt.append("6. **🏫 대학교/기관 → 지역 추론**: 대학교나 주요 기관이 어느 지역에 있는지 판단\n");
        prompt.append("   예) 서울대 → 서울 관악구, 부산대 → 부산 금정구, KAIST → 대전 유성구\n");
        prompt.append("7. **🏢 상권/동네 → 지역 추론**: 유명한 상권이나 동네명으로 지역 판단\n");
        prompt.append("   예) 강남 → 서울 강남구, 명동 → 서울 중구, 센텀시티 → 부산 해운대구\n");
        prompt.append("8. **일반 지식 활용**: 당신이 알고 있는 한국 지리 지식을 최대한 활용하여 추론\n");
        prompt.append("9. **추론된 지역을 위 목록과 매칭**: 추론한 지역명을 가능한 지역 목록에서 찾아 정확한 코드 반환\n");
        prompt.append("10. **region 필드는 원본 표현 유지**: 사용자가 입력한 원래 지역 표현을 그대로 반환 (예: '명동역' → '명동역', '홍대' → '홍대')\n");
        prompt.append("11. **areaCode와 sigunguCode는 정확한 코드**: DB 목록에서 찾은 정확한 지역코드와 시군구코드 반환\n");
        prompt.append("12. **지역 정보가 없으면 'NONE' 반환**: 명확한 지역 정보가 없거나 추론이 불가능한 경우\n\n");
        
        prompt.append("**응답 형식** (JSON):\n");
        prompt.append("{\n");
        prompt.append("  \"region\": \"사용자가 입력한 원본 지역 표현\",\n");
        prompt.append("  \"areaCode\": \"지역코드\",\n");
        prompt.append("  \"sigunguCode\": \"시군구코드 (없으면 null)\",\n");
        prompt.append("  \"confidence\": \"HIGH|MEDIUM|LOW\",\n");
        prompt.append("  \"reasoning\": \"추론 과정 설명\"\n");
        prompt.append("}\n\n");
        
        prompt.append("**🎯 지능적 추론 예시**:\n");
        prompt.append("1. 지하철역: '명동역 맛집 추천해줘'\n");
        prompt.append("   → 명동역이 서울 중구에 있다는 지식 활용 → 목록에서 '중구' 검색 → 매칭된 코드 반환\n");
        prompt.append("   → {\"region\": \"명동역\", \"areaCode\": \"1\", \"sigunguCode\": \"24\", \"confidence\": \"HIGH\", \"reasoning\": \"명동역은 서울 중구에 위치\"}\n\n");
        
        prompt.append("2. 랜드마크: '경복궁 주변 관광지 알려줘'\n");
        prompt.append("   → 경복궁이 서울 종로구에 있다는 지식 활용 → 목록에서 '종로구' 검색\n");
        prompt.append("   → {\"region\": \"경복궁\", \"areaCode\": \"1\", \"sigunguCode\": \"25\", \"confidence\": \"HIGH\", \"reasoning\": \"경복궁은 서울 종로구에 위치\"}\n\n");
        
        prompt.append("3. 대학교: 'KAIST 근처 맛집 추천'\n");
        prompt.append("   → KAIST가 대전 유성구에 있다는 지식 활용 → 목록에서 '유성구' 검색\n");
        prompt.append("   → {\"region\": \"KAIST\", \"areaCode\": \"8\", \"sigunguCode\": \"3\", \"confidence\": \"HIGH\", \"reasoning\": \"KAIST는 대전 유성구에 위치\"}\n\n");
        
        prompt.append("4. 직접 지역명: '통영 2박3일 음식점위주로'\n");
        prompt.append("   → {\"region\": \"통영\", \"areaCode\": \"36\", \"sigunguCode\": \"17\", \"confidence\": \"HIGH\", \"reasoning\": \"직접적인 지역명 통영시\"}\n\n");
        
        prompt.append("5. 지역 정보 없음: '맛집 추천해줘'\n");
        prompt.append("   → {\"region\": \"NONE\", \"areaCode\": null, \"sigunguCode\": null, \"confidence\": \"LOW\", \"reasoning\": \"지역 정보 없음\"}\n");
        
        return callOpenAI(prompt.toString());
    }
    
    @Override
    public String extractKeywordWithAI(String userMessage) {
        try {
            // 🎯 1단계: 매우 엄격한 AI 프롬프트
            String firstResponse = callStrictKeywordExtractionAI(userMessage);
            if (isValidSpecificKeyword(firstResponse)) {
                log.info("✅ 1단계 AI 키워드 추출 성공: '{}' → '{}'", userMessage, firstResponse);
                return firstResponse;
            }
            
            // 🎯 2단계: 더 엄격한 경고 포함 프롬프트
            log.info("⚠️ 1단계 실패, 2단계 시도");
            String secondResponse = callUltraStrictKeywordExtractionAI(userMessage);
            if (isValidSpecificKeyword(secondResponse)) {
                log.info("✅ 2단계 AI 키워드 추출 성공: '{}' → '{}'", userMessage, secondResponse);
                return secondResponse;
            }
            
            // 🎯 3단계: 완전 실패 시 빈 문자열 반환
            log.info("❌ AI 키워드 추출 완전 실패 - 구체적 키워드 없음: '{}'", userMessage);
            return "";
            
        } catch (Exception e) {
            log.error("❌ AI 키워드 추출 오류: {}", e.getMessage());
            return "";
        }
    }
    
    /**
     * 🎯 1단계: 엄격한 AI 키워드 추출
     */
    private String callStrictKeywordExtractionAI(String userMessage) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("다음 문장에서 구체적인 키워드만 찾아주세요.\n\n");
        prompt.append("문장: \"").append(userMessage).append("\"\n\n");
        
        prompt.append("⚠️ 절대 반환하면 안 되는 단어들:\n");
        prompt.append("축제, 행사, 이벤트, 페스티벌, 여행, 정보, 알려줘, 추천, 계획, 코스, 일정\n");
        prompt.append("서울, 부산, 대구, 인천, 광주, 대전, 울산, 강원, 경기, 충북, 전남 등 지역명\n\n");
        
        prompt.append("✅ 반환해야 할 구체적 키워드 예시:\n");
        prompt.append("벚꽃, 드론, 로봇, K-POP, 음식, 맥주, 와인, 자동차, 게임, AI, VR\n\n");
        
        prompt.append("예시:\n");
        prompt.append("\"서울 벚꽃축제 알려줘\" → 벚꽃\n");
        prompt.append("\"부산 드론 행사 정보\" → 드론\n");
        prompt.append("\"대구 K-POP 페스티벌\" → K-POP\n");
        prompt.append("\"인천 축제 리스트\" → (빈 답변)\n");
        prompt.append("\"서울 여행 추천\" → (빈 답변)\n\n");
        
        prompt.append("답변 (구체적 키워드만, 없으면 빈 답변):");
        
        String response = callOpenAI(prompt.toString());
        return cleanAndValidateResponse(response);
    }
    
    /**
     * 🎯 2단계: 매우 엄격한 AI 키워드 추출
     */
    private String callUltraStrictKeywordExtractionAI(String userMessage) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("🚨 경고: 이전 시도가 실패했습니다. 매우 구체적인 키워드만 찾아주세요!\n\n");
        prompt.append("문장: \"").append(userMessage).append("\"\n\n");
        
        prompt.append("🚫 절대 금지 단어 (반환하면 실패):\n");
        prompt.append("축제, 행사, 이벤트, 페스티벌, 대회, 박람회, 컨벤션, 쇼\n");
        prompt.append("여행, 정보, 알려줘, 추천, 계획, 코스, 일정, 루트\n");
        prompt.append("서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종\n");
        prompt.append("경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주\n\n");
        
        prompt.append("✅ 허용되는 구체적 키워드만:\n");
        prompt.append("- 꽃/식물: 벚꽃, 장미, 튤립, 유채, 해바라기, 코스모스\n");
        prompt.append("- 기술: 드론, 로봇, AI, VR, 게임, IT\n");
        prompt.append("- 문화: K-POP, 재즈, 클래식, 미술, 사진, 영화\n");
        prompt.append("- 음식: 김치, 치킨, 맥주, 와인, 커피\n");
        prompt.append("- 기타: 자동차, 패션, 스포츠\n\n");
        
        prompt.append("구체적 키워드가 없으면 반드시 빈 답변하세요!\n\n");
        prompt.append("답변:");
        
        String response = callOpenAI(prompt.toString());
        return cleanAndValidateResponse(response);
    }
    
    /**
     * 응답 정리 및 검증
     */
    private String cleanAndValidateResponse(String response) {
        if (response == null) return "";
        
        response = response.trim()
            .replaceAll("\\n+", "")
            .replaceAll("\\s+", " ")
            .replaceAll("[^가-힣a-zA-Z0-9\\s-]", "")
            .trim();
        
        // 길이 체크
        if (response.length() > 15 || response.length() < 2) {
            return "";
        }
        
        return response;
    }
    
    /**
     * 구체적이고 유효한 키워드인지 검증
     */
    private boolean isValidSpecificKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return false;
        }
        
        keyword = keyword.toLowerCase().trim();
        
        // 금지 단어 체크 (더 엄격)
        if (isStrictCommonWord(keyword)) {
            return false;
        }
        
        // 구체적인 키워드 화이트리스트 체크
        String[] allowedKeywords = {
            // 자연/식물
            "벚꽃", "장미", "튤립", "유채", "해바라기", "코스모스", "단풍", "꽃", "불꽃",
            // 기술/현대
            "드론", "로봇", "ai", "vr", "게임", "it", "핸드폰", "컴퓨터", "기술",
            // 문화/예술
            "k-pop", "kpop", "케이팝", "재즈", "클래식", "미술", "사진", "영화", "음악",
            // 음식
            "김치", "치킨", "맥주", "와인", "커피", "디저트", "음식", "먹거리",
            // 기타
            "자동차", "패션", "뷰티", "스포츠", "문화", "전통", "역사"
        };
        
        for (String allowed : allowedKeywords) {
            if (keyword.equals(allowed.toLowerCase()) || 
                keyword.contains(allowed.toLowerCase()) ||
                allowed.toLowerCase().contains(keyword)) {
                log.info("✅ 유효한 구체적 키워드 발견: '{}'", keyword);
                return true;
            }
        }
        
        // 화이트리스트에 없는 경우 추가 검증
        // 2글자 이상이고 일반적이지 않은 단어면 허용
        if (keyword.length() >= 2 && !isCommonWord(keyword)) {
            log.info("✅ 일반적이지 않은 키워드로 허용: '{}'", keyword);
            return true;
        }
        
        log.warn("❌ 구체적이지 않은 키워드 거부: '{}'", keyword);
        return false;
    }
    
    /**
     * 일반적인 단어인지 체크 (키워드로 부적절한 단어들)
     */
    private boolean isCommonWord(String word) {
        if (word == null || word.trim().isEmpty()) {
            return true;
        }
        
        String lowerWord = word.toLowerCase().trim();
        
        // 일반적인 단어들 (키워드로 부적절)
        String[] commonWords = {
            "축제", "행사", "이벤트", "페스티벌", "대회", "박람회", "컨벤션", "쇼",
            "여행", "계획", "일정", "코스", "루트", "추천", "정보", "리스트", "목록",
            "알려줘", "찾아줘", "보여줘", "검색", "소개", "설명", "말해줘",
            "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
            "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
            "관련", "위한", "같은", "느낌", "스타일", "테마", "컨셉", "좋은", "괜찮은",
            "추천", "정보", "알려", "찾아", "보여", "말해", "하는", "있는", "되는"
        };
        
        for (String common : commonWords) {
            if (lowerWord.equals(common.toLowerCase()) || 
                lowerWord.contains(common.toLowerCase()) ||
                common.toLowerCase().contains(lowerWord)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 엄격한 접미사 제거
     */
    private String removeUnnecessarySuffixesStrict(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return "";
        }
        
        String[] suffixes = {
            "관련", "축제", "행사", "이벤트", "페스티벌", "대회", "박람회", "쇼", "전시회", "컨벤션",
            "정보", "리스트", "목록", "검색", "추천", "여행", "계획", "일정", "코스", "루트"
        };
        
        String result = keyword;
        
        // 여러 접미사가 붙은 경우를 처리하기 위해 반복 제거
        boolean changed = true;
        while (changed) {
            changed = false;
            for (String suffix : suffixes) {
                if (result.endsWith(suffix)) {
                    String base = result.substring(0, result.length() - suffix.length()).trim();
                    if (base.length() >= 2) { // 최소 2글자 이상이어야 의미있는 키워드
                        result = base;
                        changed = true;
                        break;
                    }
                }
            }
        }
        
        return result;
    }
    
    /**
     * 엄격한 일반 단어 체크 (AI 결과 검증용)
     */
    private boolean isStrictCommonWord(String word) {
        if (word == null || word.trim().isEmpty()) {
            return true;
        }
        
        String lowerWord = word.toLowerCase().trim();
        
        // 🚫 절대 허용하지 않을 단어들
        String[] strictlyForbidden = {
            "축제", "행사", "이벤트", "페스티벌", "대회", "박람회", "쇼", "전시회", "컨벤션",
            "여행", "계획", "일정", "코스", "루트", "추천", "정보", "리스트", "목록",
            "알려줘", "찾아줘", "보여줘", "검색", "소개", "설명", "말해줘",
            "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
            "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
            "관련", "위한", "같은", "느낌", "스타일", "테마", "컨셉"
        };
        
        for (String forbidden : strictlyForbidden) {
            if (lowerWord.equals(forbidden.toLowerCase())) {
                return true;
            }
        }
        
        return false;
    }
} 