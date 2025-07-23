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
import com.project.festive.festiveserver.wagle.mapper.WagleMapper;

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

    @Autowired
    private WagleMapper wagleMapper;

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
        // 신고 상태 업데이트
        int result = reportMapper.updateReportStatus(reportNo, status);
        // 게시글/댓글 논리삭제 또는 복구 처리 추가
        Report report = reportMapper.selectReportDetail(reportNo);
        if (report != null) {
            // 처리완료(1)면 삭제, 대기(0)면 복구
            if (status == 1) {
                if (report.getReportType() == 0) {
                    // 게시글
                    wagleMapper.deleteBoardLogical((long) report.getReportBoardNo());
                } else if (report.getReportType() == 1) {
                    // 댓글
                    wagleMapper.deleteCommentLogical((long) report.getReportBoardNo());
                }
            } else if (status == 0) {
                if (report.getReportType() == 0) {
                    // 게시글 복구
                    wagleMapper.updateBoardDelFlN((long) report.getReportBoardNo());
                } else if (report.getReportType() == 1) {
                    // 댓글 복구
                    wagleMapper.updateCommentDelFlN((long) report.getReportBoardNo());
                }
            }
        }
        return result;
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
