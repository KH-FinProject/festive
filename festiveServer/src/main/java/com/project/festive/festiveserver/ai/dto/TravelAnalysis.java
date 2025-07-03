package com.project.festive.festiveserver.ai.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * 여행 분석 정보를 담는 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TravelAnalysis {
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
    }
} 