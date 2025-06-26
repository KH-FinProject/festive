package com.project.festive.festiveserver.report.model.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.project.festive.festiveserver.member.mapper.MemberMapper;
import com.project.festive.festiveserver.report.model.dto.Report;
import com.project.festive.festiveserver.report.model.dto.ReportAlert;
import com.project.festive.festiveserver.report.model.mapper.ReportMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ReportServiceImpl implements ReportService {

    @Autowired
    private ReportMapper reportMapper;
    @Autowired
    private MemberMapper memberMapper;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public int createReport(Report report) {
        // 현재 시간 설정
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        report.setReportTime(now.format(formatter));
        report.setReportStatus(0); // 대기 상태로 설정
        log.info("📥 신고 요청 들어옴: {}", report);
        // 신고 등록
        int result = reportMapper.insertReport(report);
        log.info("신고 등록 결과: {}", result);
        if (result > 0) {
            // 관리자에게 실시간 알림 전송
            sendReportAlert(report);
        }
        
        return result;
    }

    @Override
    public int updateReportStatus(int reportNo, int status) {
        return reportMapper.updateReportStatus(reportNo, status);
    }

    @Override
    public List<Report> getReportList() {
        return reportMapper.selectReportList();
    }

    @Override
    public Report getReportDetail(int reportNo) {
        return reportMapper.selectReportDetail(reportNo);
    }

    @Override
    public com.project.festive.festiveserver.report.model.dto.ReportDetailResponse getReportDetailResponse(int reportNo) {
        return reportMapper.selectReportDetailResponse(reportNo);
    }
    
    // 관리자에게 실시간 신고 알림 전송
    private void sendReportAlert(Report report) {
        ReportAlert alert = ReportAlert.builder()
                .message("새로운 신고가 접수되었습니다.")
                .reportType(report.getReportType())
                .memberNo(report.getMemberNo())
                .build();
        messagingTemplate.convertAndSend("/topic/admin-alerts", alert);
    }

    @Override
    public int deleteReport(int reportNo) {
        return reportMapper.deleteReport(reportNo);
    }

    @Override
    public int increaseSanctionCount(long memberNo) {
        // memberMapper 호출 필요(Autowired)
        return memberMapper.increaseSanctionCount(memberNo);
    }

    @Override
    public int decreaseSanctionCount(long memberNo) {
        return memberMapper.decreaseSanctionCount(memberNo);
    }
}
