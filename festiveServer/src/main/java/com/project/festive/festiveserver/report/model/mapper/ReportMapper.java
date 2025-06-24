package com.project.festive.festiveserver.report.model.mapper;

import com.project.festive.festiveserver.report.model.dto.Report;
import com.project.festive.festiveserver.report.model.dto.ReportDetailResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReportMapper {
    
    // 신고 등록
    int insertReport(Report report);
    
    // 신고 상태 업데이트
    int updateReportStatus(@Param("reportNo") int reportNo, @Param("status") int status);
    
    // 신고 목록 조회
    List<Report> selectReportList();
    
    // 신고 상세 조회
    Report selectReportDetail(int reportNo);
    
    // 신고 상세 조회 (확장: 게시글/댓글/신고내역 모두 반환)
    ReportDetailResponse selectReportDetailResponse(int reportNo);
    
    // 신고 삭제
    int deleteReport(int reportNo);
}
