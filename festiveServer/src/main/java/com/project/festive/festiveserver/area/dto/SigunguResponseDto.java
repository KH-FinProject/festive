package com.project.festive.festiveserver.area.dto;

import com.project.festive.festiveserver.area.entity.Sigungu;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SigunguResponseDto {
    private String areaCode;
    private String sigunguCode;
    private String sigunguName;
    private String areaName;
    
    public static SigunguResponseDto from(Sigungu sigungu) {
        if (sigungu == null) {
            return null;
        }
        
        return SigunguResponseDto.builder()
                .areaCode(sigungu.getId().getAreaCode())
                .sigunguCode(sigungu.getId().getSigunguCode())
                .sigunguName(sigungu.getSigunguName())
                .areaName(sigungu.getArea() != null ? sigungu.getArea().getAreaName() : null)
                .build();
    }
} 