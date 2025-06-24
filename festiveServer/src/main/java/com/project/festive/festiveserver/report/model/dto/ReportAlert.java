package com.project.festive.festiveserver.report.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReportAlert {

    private String message;
    private int reportType;
    private int memberNo;
    
}
