package com.project.festive.festiveserver.area.converter;

import org.springframework.stereotype.Component;

import com.project.festive.festiveserver.area.dto.AreaResponseDto;
import com.project.festive.festiveserver.area.entity.Area;

@Component
public class AreaConverter {

    public static AreaResponseDto toDto(Area area) {
        if (area == null) {
            return null;
        }
        
        return AreaResponseDto.builder()
                .areaCode(area.getAreaCode())
                .areaName(area.getAreaName())
                .build();
    }
} 