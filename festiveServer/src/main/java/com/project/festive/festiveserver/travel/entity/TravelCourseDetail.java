package com.project.festive.festiveserver.travel.entity;

/**
 * AI 여행코스 상세 장소 엔티티
 */
public class TravelCourseDetail {
    private Long detailNo;          // 상세 번호 (PK)
    private Long courseNo;          // 여행코스 번호 (FK)
    private Integer dayNumber;      // 몇일차
    private Integer visitOrder;     // 방문 순서
    private String placeName;       // 장소명
    private String placeAddress;    // 장소 주소
    private Double latitude;        // 위도
    private Double longitude;       // 경도
    private String placeImage;      // 장소 이미지 URL
    private String placeTel;        // 전화번호
    private String placeCategory;   // 장소 카테고리
    private String contentId;       // TourAPI ContentID
    private String contentTypeId;   // TourAPI ContentTypeID

    // 기본 생성자
    public TravelCourseDetail() {}

    // 전체 생성자
    public TravelCourseDetail(Long detailNo, Long courseNo, Integer dayNumber, Integer visitOrder,
                             String placeName, String placeAddress, Double latitude, Double longitude,
                             String placeImage, String placeTel, String placeCategory,
                             String contentId, String contentTypeId) {
        this.detailNo = detailNo;
        this.courseNo = courseNo;
        this.dayNumber = dayNumber;
        this.visitOrder = visitOrder;
        this.placeName = placeName;
        this.placeAddress = placeAddress;
        this.latitude = latitude;
        this.longitude = longitude;
        this.placeImage = placeImage;
        this.placeTel = placeTel;
        this.placeCategory = placeCategory;
        this.contentId = contentId;
        this.contentTypeId = contentTypeId;
    }

    // Getter & Setter
    public Long getDetailNo() { return detailNo; }
    public void setDetailNo(Long detailNo) { this.detailNo = detailNo; }

    public Long getCourseNo() { return courseNo; }
    public void setCourseNo(Long courseNo) { this.courseNo = courseNo; }

    public Integer getDayNumber() { return dayNumber; }
    public void setDayNumber(Integer dayNumber) { this.dayNumber = dayNumber; }

    public Integer getVisitOrder() { return visitOrder; }
    public void setVisitOrder(Integer visitOrder) { this.visitOrder = visitOrder; }

    public String getPlaceName() { return placeName; }
    public void setPlaceName(String placeName) { this.placeName = placeName; }

    public String getPlaceAddress() { return placeAddress; }
    public void setPlaceAddress(String placeAddress) { this.placeAddress = placeAddress; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getPlaceImage() { return placeImage; }
    public void setPlaceImage(String placeImage) { this.placeImage = placeImage; }

    public String getPlaceTel() { return placeTel; }
    public void setPlaceTel(String placeTel) { this.placeTel = placeTel; }

    public String getPlaceCategory() { return placeCategory; }
    public void setPlaceCategory(String placeCategory) { this.placeCategory = placeCategory; }

    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }

    public String getContentTypeId() { return contentTypeId; }
    public void setContentTypeId(String contentTypeId) { this.contentTypeId = contentTypeId; }

    @Override
    public String toString() {
        return "TravelCourseDetail{" +
                "detailNo=" + detailNo +
                ", courseNo=" + courseNo +
                ", dayNumber=" + dayNumber +
                ", visitOrder=" + visitOrder +
                ", placeName='" + placeName + '\'' +
                ", placeCategory='" + placeCategory + '\'' +
                '}';
    }
} 