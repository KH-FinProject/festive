package com.project.festive.festiveserver.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String content;              // AI 응답 내용
    private List<LocationInfo> locations; // 추출된 위치 정보
    private FestivalInfo mainFestival;   // 메인 축제 정보
    private boolean isStreaming;         // 스트리밍 여부
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationInfo {
        private String name;        // 장소명
        private Double latitude;    // 위도
        private Double longitude;   // 경도
        private Integer day;        // 몇째 날
        private String description; // 설명
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FestivalInfo {
        private String name;        // 축제명
        private String period;      // 기간
        private String location;    // 장소
        private String description; // 설명
        private String image;       // 이미지 URL
        private String contact;     // 연락처
    }
} 