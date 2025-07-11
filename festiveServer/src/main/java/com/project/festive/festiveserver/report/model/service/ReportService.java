package com.project.festive.festiveserver.report.model.service;

import com.project.festive.festiveserver.report.model.dto.Report;
import java.util.List;

public interface ReportService {
    
    // 신고 등록
    int createReport(Report report);
    
    // 신고 상태 업데이트
    int updateReportStatus(int reportNo, int status);
    
    // 신고 목록 조회
    List<Report> getReportList();
    
    // 신고 상세 조회
    Report getReportDetail(int reportNo);
    
    // 신고 상세 조회 (확장)
    com.project.festive.festiveserver.report.model.dto.ReportDetailResponse getReportDetailResponse(int reportNo);
    
    // 신고 삭제
    int deleteReport(int reportNo);
    
    // 회원 제재(제재 카운트 증가)
    int increaseSanctionCount(long memberNo);

    // 회원 제재(제재 카운트 감소)
    int decreaseSanctionCount(long memberNo);
}
