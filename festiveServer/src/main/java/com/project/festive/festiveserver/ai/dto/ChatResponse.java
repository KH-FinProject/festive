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
    private String requestType;          // 요청 타입 (festival_only, festival_with_travel, travel_only)
    private List<LocationInfo> locations; // 카카오맵 표시용 위치 정보
    private List<FestivalInfo> festivals; // 축제 정보 리스트 (TourAPI 데이터)
    private TravelCourse travelCourse;   // 구조화된 여행코스
    private boolean isStreaming;         // 스트리밍 여부
    private Map<String, Object> analysisInfo; // 프론트엔드 TourAPI 호출용 분석 정보
    private String regionName;           // 지역명 (여행코스 저장용)
    private String areaCode;             // 지역코드 (여행코스 저장용)
    private String courseDescription;    // AI가 생성한 day별 코스 설명 (프론트엔드 표시용)
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationInfo {
        private String name;        // 장소명
        private Double latitude;    // 위도
        private Double longitude;   // 경도
        private Integer day;        // 몇째 날
        private String time;        // 방문 시간 (예: 오전 09:00)
        private String description; // 설명
        private String image;       // 이미지 URL (TourAPI)
        private String category;    // 카테고리 (관광지, 문화시설 등)
        private String contentId;   // TourAPI ContentID (DB 저장용)
        private String contentTypeId; // TourAPI ContentTypeID (DB 저장용)
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
        private String contentId;   // TourAPI contentId
        private String contentTypeId; // 콘텐츠 타입
        private String mapX;        // 경도 (String)
        private String mapY;        // 위도 (String)
        private String addr1;       // 주소
        private String tel;         // 전화번호
        // 🗺️ 카카오맵 호환을 위한 Double 타입 좌표
        private Double latitude;    // 위도 (Double)
        private Double longitude;   // 경도 (Double)
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TravelCourse {
        private String courseTitle; // 코스 제목
        private Integer totalDays;  // 총 일수
        private List<DailySchedule> dailySchedule; // 일별 일정
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySchedule {
        private Integer day;        // 날짜 (1, 2, 3...)
        private String theme;       // 하루 테마
        private List<PlaceInfo> places; // 장소 리스트
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaceInfo {
        private String name;        // 장소명
        private String type;        // 타입 (attraction, restaurant, accommodation 등)
        private String address;     // 주소
        private String description; // 설명
        private Double latitude;    // 위도
        private Double longitude;   // 경도
        private String visitTime;   // 방문 시간
        private String duration;    // 소요 시간
        private String category;    // 카테고리
    }
} 