package com.project.festive.festiveserver.booth.entity;

import lombok.Data;
import java.util.Date;

@Data
public class BoothRequest {
    private Long boothNo; // BOOTH_NO
    private Long memberNo; // MEMBER_NO
    private String contentId; // CONTENT_ID (축제 ID)
    private String applicantName; // APPLICANT_NAME (신청자 이름)
    private String applicantCompany; // APPLICANT_COMPANY (기업명)
    private Date boothStartDate; // BOOTH_START_DATE
    private Date boothEndDate; // BOOTH_END_DATE
    private String boothTel; // BOOTH_TEL
    private String products; // PRODUCTS (판매 품목)
    private String boothImg; // BOOTH_IMG (대표 이미지 URL)
    private Integer boothType; // BOOTH_TYPE (1=플리마켓, 2=푸드트럭)
    private String boothAccept; // BOOTH_ACCEPT ('Y'/'N')
    private String contentTitle; // CONTENT_TITLE (축제명)
} 