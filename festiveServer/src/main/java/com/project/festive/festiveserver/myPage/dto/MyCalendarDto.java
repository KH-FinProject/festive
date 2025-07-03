package com.project.festive.festiveserver.myPage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MyCalendarDto {
	
//	private String contentId;
//    private String title;
//    private String startDate; // "YYYY-MM-DD" 형식
//    private String endDate;   // "YYYY-MM-DD" 형식
//    private String imageUrl;
//    
//    
//    private String firstImage;
//    private String addr1;
//    private String overview;
    
    
    private String contentId;
    private String title;
    private String startDate; // "YYYYMMDD" 형식
    private String endDate;   // "YYYYMMDD" 형식
    private String place;

}
