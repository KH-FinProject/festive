package com.project.festive.festiveserver.detail.model.dto;

import lombok.Data;

@Data
public class FestivalDetailDto {
    private String contentId;
    private String title;
    private String image;
    private String date;
    private String location;
    private int likeCount;
    // 필요시 status, description 등 추가 가능
} 