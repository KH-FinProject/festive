package com.project.festive.festiveserver.ai.service;

import java.util.List;
import java.util.Map;

/**
 * TourAPI 관련 서비스 인터페이스
 */
public interface TourAPIService {
    
    /**
     * 관광지 데이터 안전하게 조회
     */
    List<AITravelServiceImpl.TourAPIResponse.Item> fetchTourismDataSecurely(String areaCode, String sigunguCode, String contentTypeId);
    
    /**
     * 키워드로 관광지 검색
     */
    List<AITravelServiceImpl.TourAPIResponse.Item> searchTourismByKeyword(String keyword, String areaCode, String sigunguCode);
    
    /**
     * 축제 정보 검색
     */
    List<AITravelServiceImpl.TourAPIResponse.Item> searchFestivals(String areaCode, String sigunguCode);
    
    /**
     * 장소의 상세 이미지들을 가져오기
     */
    List<Map<String, Object>> getPlaceImages(String contentId);
    
    /**
     * detailCommon2 API로 상세 정보 조회
     */
    AITravelServiceImpl.TourAPIResponse.Item fetchDetailCommon2(String contentId);
    
    /**
     * detailIntro2 API로 축제 날짜 정보 조회
     */
    AITravelServiceImpl.TourAPIResponse.Item fetchDetailIntro2(String contentId, String contentTypeId);
    
    /**
     * TourAPI 아이템을 Map으로 변환 (overview 포함)
     */
    Map<String, Object> convertToMap(AITravelServiceImpl.TourAPIResponse.Item item);
    
    /**
     * TourAPI 응답 파싱 (XML/JSON 모두 지원)
     */
    List<AITravelServiceImpl.TourAPIResponse.Item> parseTourAPIResponse(String response);
} 