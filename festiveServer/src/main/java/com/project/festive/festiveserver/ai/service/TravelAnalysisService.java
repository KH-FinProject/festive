package com.project.festive.festiveserver.ai.service;

import com.project.festive.festiveserver.ai.dto.TravelAnalysis;

/**
 * 여행 분석 관련 서비스 인터페이스
 */
public interface TravelAnalysisService {
    
    /**
     * 빠른 여행 분석 생성
     */
    TravelAnalysis createFastAnalysis(String userMessage);
    
    /**
     * 선호 콘텐츠 타입 감지
     */
    String detectPreferredContentType(String message);
    
    /**
     * 여행 관련 메시지인지 확인
     */
    boolean isTravelOrFestivalRelated(String message);
    
    /**
     * 메시지에서 기간 추출 (향상된 버전)
     */
    String extractDurationFromMessageEnhanced(String message);
    
    /**
     * 지역을 지역코드로 매핑
     */
    String mapRegionToAreaCode(String region);
    
    /**
     * 지역 정보 추출
     */
    RegionInfo extractRegionInfo(String userMessage);
    
    /**
     * 지역코드로 지역명 찾기
     */
    String findRegionNameByAreaCode(String areaCode);
    
    /**
     * 요청 타입 결정
     */
    String determineRequestType(String message);
    
    /**
     * 메시지에서 키워드 추출
     */
    String extractKeywordFromRequest(String message);
    
    /**
     * 지역 정보 클래스
     */
    public static class RegionInfo {
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
} 