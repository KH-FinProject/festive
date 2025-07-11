package com.project.festive.festiveserver.area.dto;

import com.project.festive.festiveserver.area.entity.Area;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AreaDetailDto {
    private String areaCode;
    private String areaName;
    
    public static AreaDetailDto from(Area area) {
        if (area == null) {
            return null;
        }
        
        return AreaDetailDto.builder()
                .areaCode(area.getAreaCode())
                .areaName(area.getAreaName())
                .build();
    }
} 