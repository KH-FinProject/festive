package com.project.festive.festiveserver.area.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AreaResponseDto {
    private String areaCode;
    private String areaName;
} 