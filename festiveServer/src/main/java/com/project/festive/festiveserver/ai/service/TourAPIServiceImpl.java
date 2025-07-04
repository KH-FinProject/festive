package com.project.festive.festiveserver.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TourAPIServiceImpl implements TourAPIService {

    @Value("${tour.api.service-key:}")
    private String tourApiServiceKey;
    
    private final RestTemplate restTemplate;

    @Override
    public List<AITravelServiceImpl.TourAPIResponse.Item> fetchTourismDataSecurely(String areaCode, String sigunguCode, String contentTypeId) {

        
        List<AITravelServiceImpl.TourAPIResponse.Item> results = new ArrayList<>();
        
        try {
            // UriComponentsBuilder로 기본 파라미터 구성 (serviceKey 제외)
            UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString("https://apis.data.go.kr/B551011/KorService2/areaBasedList2")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("_type", "json")
                .queryParam("arrange", "O")
                .queryParam("numOfRows", "20")  // 50 → 20으로 제한하여 성능 개선
                .queryParam("areaCode", areaCode);
            
            // 시군구코드가 있고 "_" 포함되어 있으면 분리해서 사용
            if (sigunguCode != null && !sigunguCode.trim().isEmpty() && sigunguCode.contains("_")) {
                String[] parts = sigunguCode.split("_");
                if (parts.length >= 2) {
                    builder.queryParam("sigunguCode", parts[1]);
                }
            }
            
            if (contentTypeId != null && !contentTypeId.trim().isEmpty()) {
                builder.queryParam("contentTypeId", contentTypeId);
            }
            
            // URL 구성 후 serviceKey를 직접 추가 (이중 인코딩 방지)
            String url = builder.build().toUriString();
            url += "&serviceKey=" + tourApiServiceKey;
            
            
            // RestTemplate로 API 호출 (URI.create 사용으로 추가 인코딩 방지)
            ResponseEntity<String> response = restTemplate.getForEntity(
                java.net.URI.create(url), 
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String responseBody = response.getBody();
    
                
                // 응답 파싱 (JSON/XML 자동 감지)
                results = parseTourAPIResponse(responseBody);
                
                
                // 축제 데이터인 경우 추가 로깅
                if ("15".equals(contentTypeId)) {
                    for (int i = 0; i < Math.min(3, results.size()); i++) {
                        AITravelServiceImpl.TourAPIResponse.Item item = results.get(i);
                    }
                }
            } else {
                log.warn("❌ TourAPI 응답 실패 - status: {}", response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ TourAPI 데이터 조회 실패 - areaCode: {}, contentTypeId: {}, error: {}", areaCode, contentTypeId, e.getMessage(), e);
        }
        
        return results;
    }

    @Override
    public List<AITravelServiceImpl.TourAPIResponse.Item> searchTourismByKeyword(String keyword, String areaCode, String sigunguCode) {

        
        List<AITravelServiceImpl.TourAPIResponse.Item> results = new ArrayList<>();
        
        try {
            // 기본 파라미터 구성 (serviceKey 제외)
            UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString("https://apis.data.go.kr/B551011/KorService2/searchKeyword2")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("_type", "json")
                .queryParam("arrange", "O")
                .queryParam("keyword", keyword)
                .queryParam("areaCode", areaCode);
            
            // 시군구코드 처리
            if (sigunguCode != null && !sigunguCode.trim().isEmpty() && sigunguCode.contains("_")) {
                String[] parts = sigunguCode.split("_");
                if (parts.length >= 2) {
                    builder.queryParam("sigunguCode", parts[1]);
                }
            }
            
            String url = builder.build().toUriString();
            url += "&serviceKey=" + tourApiServiceKey;
            
            
            ResponseEntity<String> response = restTemplate.getForEntity(
                java.net.URI.create(url), 
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                results = parseTourAPIResponse(response.getBody());
            }
            
        } catch (Exception e) {
            log.error("❌ 키워드 검색 실패 - keyword: {}, error: {}", keyword, e.getMessage(), e);
        }
        
        return results;
    }

    @Override
    public List<AITravelServiceImpl.TourAPIResponse.Item> searchFestivals(String areaCode, String sigunguCode) {
        
        List<AITravelServiceImpl.TourAPIResponse.Item> results = new ArrayList<>();
        
        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString("https://apis.data.go.kr/B551011/KorService2/searchFestival2")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("_type", "json")
                .queryParam("arrange", "O")
                .queryParam("areaCode", areaCode);
            
            if (sigunguCode != null && !sigunguCode.trim().isEmpty() && sigunguCode.contains("_")) {
                String[] parts = sigunguCode.split("_");
                if (parts.length >= 2) {
                    builder.queryParam("sigunguCode", parts[1]);
                }
            }
            
            String url = builder.build().toUriString();
            url += "&serviceKey=" + tourApiServiceKey;
            
            ResponseEntity<String> response = restTemplate.getForEntity(
                java.net.URI.create(url), 
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                results = parseTourAPIResponse(response.getBody());
    
            }
            
        } catch (Exception e) {
            log.error("❌ 축제 검색 실패 - error: {}", e.getMessage(), e);
        }
        
        return results;
    }

    @Override
    public List<Map<String, Object>> getPlaceImages(String contentId) {
        
        List<Map<String, Object>> images = new ArrayList<>();
        
        try {
            String url = UriComponentsBuilder
                .fromUriString("https://apis.data.go.kr/B551011/KorService2/detailImage2")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("_type", "json")
                .queryParam("contentId", contentId)
                .build()
                .toUriString();
            
            url += "&serviceKey=" + tourApiServiceKey;
            
            ResponseEntity<String> response = restTemplate.getForEntity(
                java.net.URI.create(url), 
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                images = parseDetailImageResponse(response.getBody());
            }
            
        } catch (Exception e) {
            log.error("❌ 장소 이미지 조회 실패 - contentId: {}, error: {}", contentId, e.getMessage(), e);
        }
        
        return images;
    }

    @Override
    public AITravelServiceImpl.TourAPIResponse.Item fetchDetailCommon2(String contentId) {
        
        try {
            String url = UriComponentsBuilder
                .fromUriString("https://apis.data.go.kr/B551011/KorService2/detailCommon2")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "festive")
                .queryParam("_type", "json")
                .queryParam("contentId", contentId)
                .build()
                .toUriString();
            
            url += "&serviceKey=" + tourApiServiceKey;
            
            ResponseEntity<String> response = restTemplate.getForEntity(
                java.net.URI.create(url), 
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<AITravelServiceImpl.TourAPIResponse.Item> items = parseDetailCommon2Response(response.getBody());
                if (!items.isEmpty()) {
                    return items.get(0);
                }
            }
        } catch (Exception e) {
            log.error("❌ 상세 정보 조회 실패 - contentId: {}, error: {}", contentId, e.getMessage(), e);
        }
        
        return null;
    }

    @Override
    public Map<String, Object> convertToMap(AITravelServiceImpl.TourAPIResponse.Item item) {
        Map<String, Object> map = new HashMap<>();
        
        try {
            map.put("title", item.getTitle() != null ? item.getTitle() : "제목 없음");
            map.put("addr1", item.getAddr1() != null ? item.getAddr1() : "");
            map.put("mapx", item.getMapX() != null ? item.getMapX() : "");
            map.put("mapy", item.getMapY() != null ? item.getMapY() : "");
            map.put("contenttypeid", item.getContentTypeId() != null ? item.getContentTypeId() : "");
            map.put("firstimage", item.getFirstImage() != null ? item.getFirstImage() : "");
            map.put("tel", item.getTel() != null ? item.getTel() : "");
            map.put("contentid", item.getContentId() != null ? item.getContentId() : "");
            
            // 축제 관련 정보
            if (item.getEventStartDate() != null) {
                map.put("eventstartdate", item.getEventStartDate());
            }
            if (item.getEventEndDate() != null) {
                map.put("eventenddate", item.getEventEndDate());
            }
            
            // overview 정보가 없으면 detailCommon2에서 가져오기
            if (item.getOverview() != null && !item.getOverview().trim().isEmpty()) {
                map.put("overview", item.getOverview());
            } else if (item.getContentId() != null) {
                // detailCommon2 API로 overview 정보 가져오기
                AITravelServiceImpl.TourAPIResponse.Item detailItem = fetchDetailCommon2(item.getContentId());
                if (detailItem != null && detailItem.getOverview() != null) {
                    map.put("overview", detailItem.getOverview());
                } else {
                    map.put("overview", "");
                }
            } else {
                map.put("overview", "");
            }
            
            // description 필드는 contentTypeId에 따라 설정
            String contentTypeId = item.getContentTypeId();
            if ("25".equals(contentTypeId)) {
                // 여행코스는 "여행코스" 표시
                map.put("description", "여행코스");
            } else {
                // 그 외는 주소 정보 표시
                map.put("description", item.getAddr1() != null ? item.getAddr1() : "위치 정보 없음");
            }
            
        } catch (Exception e) {
            log.error("❌ TourAPI Item → Map 변환 실패: {}", e.getMessage(), e);
        }
        
        return map;
    }

    @Override
    public List<AITravelServiceImpl.TourAPIResponse.Item> parseTourAPIResponse(String response) {
        if (response == null || response.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        // JSON 전용 파싱
        return parseJSONResponse(response);
    }
    
    // Private helper methods
    
    private List<Map<String, Object>> parseDetailImageResponse(String response) {
        List<Map<String, Object>> images = new ArrayList<>();
        
        try {
            // JSON 응답 파싱
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode itemsNode = rootNode.path("response").path("body").path("items").path("item");
            
            if (itemsNode.isArray()) {
                for (JsonNode itemNode : itemsNode) {
                    Map<String, Object> imageInfo = parseImageJsonNode(itemNode);
                    if (imageInfo != null) {
                        images.add(imageInfo);
                    }
                }
            } else if (!itemsNode.isMissingNode()) {
                Map<String, Object> imageInfo = parseImageJsonNode(itemsNode);
                if (imageInfo != null) {
                    images.add(imageInfo);
                }
            }
            
        } catch (Exception e) {
            log.error("❌ detailImage2 응답 파싱 실패: {}", e.getMessage(), e);
        }
        
        return images;
    }
    
    private Map<String, Object> parseImageJsonNode(JsonNode itemNode) {
        try {
            String originImgUrl = getJsonNodeValue(itemNode, "originimgurl");
            String smallImageUrl = getJsonNodeValue(itemNode, "smallimageurl");
            String imgName = getJsonNodeValue(itemNode, "imgname");
            
            if (originImgUrl != null && !originImgUrl.trim().isEmpty()) {
                Map<String, Object> imageInfo = new HashMap<>();
                imageInfo.put("originImgUrl", originImgUrl);
                imageInfo.put("smallImageUrl", smallImageUrl != null ? smallImageUrl : "");
                imageInfo.put("imgName", imgName != null ? imgName : "");
                
                return imageInfo;
            }
        } catch (Exception e) {
            log.debug("이미지 JSON 노드 파싱 실패: {}", e.getMessage());
        }
        return null;
    }
    
    private List<AITravelServiceImpl.TourAPIResponse.Item> parseDetailCommon2Response(String response) {
        return parseTourAPIResponse(response);
    }
    
    private List<AITravelServiceImpl.TourAPIResponse.Item> parseJSONResponse(String jsonResponse) {
        List<AITravelServiceImpl.TourAPIResponse.Item> items = new ArrayList<>();
        
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            
            JsonNode itemsNode = rootNode.path("response").path("body").path("items").path("item");
            
            if (itemsNode.isArray()) {
                for (JsonNode itemNode : itemsNode) {
                    AITravelServiceImpl.TourAPIResponse.Item item = parseJsonNodeToItem(itemNode);
                    if (item != null) {
                        items.add(item);
                    }
                }
            } else if (!itemsNode.isMissingNode()) {
                AITravelServiceImpl.TourAPIResponse.Item item = parseJsonNodeToItem(itemsNode);
                if (item != null) {
                    items.add(item);
                }
            }
            
        } catch (Exception e) {
            log.error("❌ JSON 응답 파싱 실패: {}", e.getMessage(), e);
        }
        
        return items;
    }
    
    private AITravelServiceImpl.TourAPIResponse.Item parseJsonNodeToItem(JsonNode itemNode) {
        try {
            AITravelServiceImpl.TourAPIResponse.Item item = new AITravelServiceImpl.TourAPIResponse.Item();
            
            item.setTitle(getJsonNodeValue(itemNode, "title"));
            item.setAddr1(getJsonNodeValue(itemNode, "addr1"));
            item.setMapX(getJsonNodeValue(itemNode, "mapx"));
            item.setMapY(getJsonNodeValue(itemNode, "mapy"));
            item.setContentTypeId(getJsonNodeValue(itemNode, "contenttypeid"));
            item.setFirstImage(getJsonNodeValue(itemNode, "firstimage"));
            item.setTel(getJsonNodeValue(itemNode, "tel"));
            item.setContentId(getJsonNodeValue(itemNode, "contentid"));
            item.setEventStartDate(getJsonNodeValue(itemNode, "eventstartdate"));
            item.setEventEndDate(getJsonNodeValue(itemNode, "eventenddate"));
            item.setOverview(getJsonNodeValue(itemNode, "overview"));
            
            return item;
        } catch (Exception e) {
            log.debug("JSON 노드 파싱 실패: {}", e.getMessage());
            return null;
        }
    }
    
    private String getJsonNodeValue(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.get(fieldName);
        if (fieldNode != null && !fieldNode.isNull() && !fieldNode.asText().trim().isEmpty()) {
            return fieldNode.asText().trim();
        }
        return null;
    }
    
    /**
     * 콘텐츠 타입 이름 반환
     */
    private String getContentTypeName(String contentTypeId) {
        switch (contentTypeId) {
            case "12": return "관광지";
            case "14": return "문화시설";
            case "15": return "축제공연행사";
            case "25": return "여행코스";
            case "28": return "레포츠";
            case "32": return "숙박";
            case "38": return "쇼핑";
            case "39": return "음식점";
            default: return "기타";
        }
    }

} 