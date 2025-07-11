package com.project.festive.festiveserver.admin.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatisticsDto {
    
    // 전체 통계 정보
    private int totalMembers;           // 총 회원 수
    private int activeMembers;          // 활성 회원 수
    private int withdrawMembers;        // 탈퇴 회원 수
    private int weeklyNewMembers;       // 주간 신규 회원 수
    private int weeklyWithdrawMembers;  // 주간 탈퇴 회원 수
    private int returnMembers;          // 전체 활성 회원 수 (탈퇴하지 않은 회원)
    
    // 일별 통계 데이터
    private List<DailyStatistics> dailyStatistics;
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyStatistics {
        private LocalDate date;
        private String dayName;
        private int newMembers;
        private int withdrawMembers;
        private int activeMembers;
        private int returnMembers;  // 재방문 회원 수 (가입 후 7일 이상)
    }
} 