package com.project.festive.festiveserver.travel.dto;

import java.util.List;

/**
 * 여행코스 저장 요청 DTO
 */
public class TravelCourseSaveRequest {
    private String courseTitle;      // 사용자가 입력한 여행코스 제목
    private String isShared;         // 공유 여부 (Y/N)
    private String thumbnailImage;   // 썸네일 이미지 URL (선택사항)
    private String regionName;       // 지역명
    private String areaCode;         // TourAPI 지역코드
    private String sigunguCode;      // TourAPI 시군구코드
    private Integer totalDays;       // 총 여행일수
    private String requestType;      // 요청타입
    private String courseDescription; // AI가 생성한 day별 코스 설명
    private List<LocationInfo> locations; // 장소 정보 리스트

    // 장소 정보 내부 클래스
    public static class LocationInfo {
        private String name;           // 장소명
        private String address;        // 주소
        private Double latitude;       // 위도
        private Double longitude;      // 경도
        private String image;          // 이미지 URL
        private String tel;           // 전화번호
        private String category;      // 카테고리
        private String contentId;     // TourAPI ContentID
        private String contentTypeId; // TourAPI ContentTypeID
        private Integer day;          // 몇일차
        private Integer order;        // 방문 순서

        // 기본 생성자
        public LocationInfo() {}

        // Getter & Setter
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }

        public String getTel() { return tel; }
        public void setTel(String tel) { this.tel = tel; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getContentId() { return contentId; }
        public void setContentId(String contentId) { this.contentId = contentId; }

        public String getContentTypeId() { return contentTypeId; }
        public void setContentTypeId(String contentTypeId) { this.contentTypeId = contentTypeId; }

        public Integer getDay() { return day; }
        public void setDay(Integer day) { this.day = day; }

        public Integer getOrder() { return order; }
        public void setOrder(Integer order) { this.order = order; }
    }

    // 기본 생성자
    public TravelCourseSaveRequest() {}

    // Getter & Setter
    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getIsShared() { return isShared; }
    public void setIsShared(String isShared) { this.isShared = isShared; }

    public String getThumbnailImage() { return thumbnailImage; }
    public void setThumbnailImage(String thumbnailImage) { this.thumbnailImage = thumbnailImage; }

    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }

    public String getAreaCode() { return areaCode; }
    public void setAreaCode(String areaCode) { this.areaCode = areaCode; }

    public String getSigunguCode() { return sigunguCode; }
    public void setSigunguCode(String sigunguCode) { this.sigunguCode = sigunguCode; }

    public Integer getTotalDays() { return totalDays; }
    public void setTotalDays(Integer totalDays) { this.totalDays = totalDays; }

    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }

    public String getCourseDescription() { return courseDescription; }
    public void setCourseDescription(String courseDescription) { this.courseDescription = courseDescription; }

    public List<LocationInfo> getLocations() { return locations; }
    public void setLocations(List<LocationInfo> locations) { this.locations = locations; }

    @Override
    public String toString() {
        return "TravelCourseSaveRequest{" +
                "courseTitle='" + courseTitle + '\'' +
                ", isShared='" + isShared + '\'' +
                ", regionName='" + regionName + '\'' +
                ", totalDays=" + totalDays +
                ", locationsCount=" + (locations != null ? locations.size() : 0) +
                '}';
    }
} 