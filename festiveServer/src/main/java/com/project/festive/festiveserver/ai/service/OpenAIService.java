package com.project.festive.festiveserver.ai.service;

import com.project.festive.festiveserver.ai.dto.TravelAnalysis;
import java.util.List;
import java.util.Map;

/**
 * OpenAI 관련 서비스 인터페이스
 */
public interface OpenAIService {
    
    /**
     * OpenAI API 호출
     */
    String callOpenAI(String prompt);
    
    /**
     * 일정별 포인트 프롬프트 생성
     */
    String createDayPointPrompt(List<AITravelServiceImpl.TourAPIResponse.Item> dayItems, int day, String region);
    
    /**
     * 일정별 포인트를 위한 OpenAI 호출
     */
    String callOpenAIForDayPoint(String prompt);
    
    /**
     * AI 응답을 프론트엔드 형식으로 포맷팅
     */
    String formatAIResponseForFrontend(String aiResponse);
    
    /**
     * 구조화된 응답 메시지 생성
     */
    String createStructuredResponseMessage(TravelAnalysis analysis, List<AITravelServiceImpl.TourAPIResponse.Item> tourAPIData);
    
    /**
     * AI 여행 코스 추천 생성 (TourAPI 데이터 우선)
     */
    String createTourAPIFirstRecommendation(List<Map<String, Object>> travelCourses, 
                                           List<Map<String, Object>> otherSpots, 
                                           String originalMessage, 
                                           String keyword);

    /**
     * 축제 검색 전용 AI 응답 생성
     */
    String createFestivalSearchResponse(List<Map<String, Object>> festivalData, 
                                       String originalMessage, 
                                       String keyword, 
                                       String region);

    /**
     * 이모지 제거
     */
    String removeEmojis(String text);
    
    /**
     * 금지된 장소 포함 여부 확인
     */
    boolean containsForbiddenPlaces(String response);
    
    /**
     * 거부 메시지 생성
     */
    String createRejectionMessage();
    
    /**
     * AI 기반 지역 추출
     */
    String extractRegionWithAI(String userMessage, String availableRegions);
    
    /**
     * AI 키워드 추출
     */
    String extractKeywordWithAI(String userMessage);
} 