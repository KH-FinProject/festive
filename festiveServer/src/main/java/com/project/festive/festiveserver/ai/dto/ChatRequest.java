package com.project.festive.festiveserver.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    private String message;           // 사용자 메시지
    private String region;           // 지역 정보 (선택사항)
    private List<ChatMessage> history; // 대화 기록
    private FestivalData festivalData; // 축제 정보 (TourAPI)
    private List<NearbySpot> nearbySpots; // 주변 관광지 정보 (TourAPI)
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FestivalData {
        private String title;           // 축제명
        private String eventstartdate; // 시작일
        private String eventenddate;   // 종료일
        private String addr1;          // 주소
        private String firstimage;     // 이미지
        private String overview;       // 설명
        private String tel;            // 연락처
        private String mapx;           // 경도
        private String mapy;           // 위도
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NearbySpot {
        private String title;          // 관광지명
        private String addr1;          // 주소
        private String mapx;           // 경도
        private String mapy;           // 위도
        private String categoryName;   // 카테고리 (관광지, 문화시설 등)
        private String tel;            // 연락처
        private String firstimage;     // 이미지
    }
} 