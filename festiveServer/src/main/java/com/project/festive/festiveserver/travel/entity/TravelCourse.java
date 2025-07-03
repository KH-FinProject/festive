package com.project.festive.festiveserver.travel.entity;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * AI 여행코스 메인 엔티티
 */
public class TravelCourse {
    private Long courseNo;           // 여행코스 번호 (PK)
    private Long memberNo;           // 회원 번호 (FK)
    private String courseTitle;      // 여행코스 제목
    private String thumbnailImage;   // 썸네일 이미지 URL
    private String regionName;       // 지역명
    private String areaCode;         // TourAPI 지역코드
    private Integer totalDays;       // 총 여행일수
    private String requestType;      // 요청타입
    private String isShared;         // 공유여부 (Y/N)
    private String courseDescription; // AI가 생성한 day별 코스 설명
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdDate; // 생성일시
    
    // 조인으로 가져올 회원 정보
    private String memberNickname;   // 회원 닉네임
    private String memberName;       // 회원 이름
    private String memberProfileImage; // 회원 프로필 이미지

    // 기본 생성자
    public TravelCourse() {}

    // 전체 생성자
    public TravelCourse(Long courseNo, Long memberNo, String courseTitle, String thumbnailImage, 
                       String regionName, String areaCode, Integer totalDays, String requestType, 
                       String isShared, String courseDescription, LocalDateTime createdDate) {
        this.courseNo = courseNo;
        this.memberNo = memberNo;
        this.courseTitle = courseTitle;
        this.thumbnailImage = thumbnailImage;
        this.regionName = regionName;
        this.areaCode = areaCode;
        this.totalDays = totalDays;
        this.requestType = requestType;
        this.isShared = isShared;
        this.courseDescription = courseDescription;
        this.createdDate = createdDate;
    }

    // Getter & Setter
    public Long getCourseNo() { return courseNo; }
    public void setCourseNo(Long courseNo) { this.courseNo = courseNo; }

    public Long getMemberNo() { return memberNo; }
    public void setMemberNo(Long memberNo) { this.memberNo = memberNo; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getThumbnailImage() { return thumbnailImage; }
    public void setThumbnailImage(String thumbnailImage) { this.thumbnailImage = thumbnailImage; }

    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }

    public String getAreaCode() { return areaCode; }
    public void setAreaCode(String areaCode) { this.areaCode = areaCode; }

    public Integer getTotalDays() { return totalDays; }
    public void setTotalDays(Integer totalDays) { this.totalDays = totalDays; }

    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }

    public String getIsShared() { return isShared; }
    public void setIsShared(String isShared) { this.isShared = isShared; }

    public String getCourseDescription() { return courseDescription; }
    public void setCourseDescription(String courseDescription) { this.courseDescription = courseDescription; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }

    public String getMemberNickname() { return memberNickname; }
    public void setMemberNickname(String memberNickname) { this.memberNickname = memberNickname; }

    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public String getMemberProfileImage() { return memberProfileImage; }
    public void setMemberProfileImage(String memberProfileImage) { this.memberProfileImage = memberProfileImage; }

    @Override
    public String toString() {
        return "TravelCourse{" +
                "courseNo=" + courseNo +
                ", memberNo=" + memberNo +
                ", courseTitle='" + courseTitle + '\'' +
                ", regionName='" + regionName + '\'' +
                ", totalDays=" + totalDays +
                ", isShared='" + isShared + '\'' +
                '}';
    }
} 