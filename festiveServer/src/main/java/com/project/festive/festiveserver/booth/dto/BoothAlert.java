package com.project.festive.festiveserver.booth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoothAlert {
    private String message;
    private String applicantName;
    private String contentTitle;
} 