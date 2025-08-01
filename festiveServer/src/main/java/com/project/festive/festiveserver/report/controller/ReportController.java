package com.project.festive.festiveserver.report.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.festive.festiveserver.report.model.dto.Report;
import com.project.festive.festiveserver.report.model.dto.ReportAlert;
import com.project.festive.festiveserver.report.model.service.ReportService;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // 신고 등록 API
    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody Report report) {
        try {
            int result = reportService.createReport(report);
            if (result > 0) {   
                return ResponseEntity.ok().body("신고가 성공적으로 접수되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("신고 접수에 실패했습니다.");
            }
        } catch (Exception e) {
        	e.printStackTrace();
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }

    // 신고 목록 조회 API (관리자용)
    @GetMapping
    public ResponseEntity<List<Report>> getReportList() {
        List<Report> reports = reportService.getReportList();
        return ResponseEntity.ok(reports);
    }

    // 신고 상세 조회 API
    @GetMapping("/{reportNo}")
    public ResponseEntity<Report> getReportDetail(@PathVariable("reportNo") int reportNo) {
        Report report = reportService.getReportDetail(reportNo);
        if (report != null) {
            return ResponseEntity.ok(report);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 신고 상태 업데이트 API (관리자용)
    @PutMapping("/{reportNo}/status")
    public ResponseEntity<?> updateReportStatus(
            @PathVariable("reportNo") int reportNo,
            @RequestParam("status") int status) {
        try {
            int result = reportService.updateReportStatus(reportNo, status);
            if (result > 0) {
                return ResponseEntity.ok().body("신고 상태가 업데이트되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("신고 상태 업데이트에 실패했습니다.");
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }

    // 신고 상세 조회 (확장: 게시글/댓글/신고내역 모두 반환)
    @GetMapping("/{reportNo}/detail")
    public ResponseEntity<?> getReportDetailResponse(@PathVariable("reportNo") int reportNo) {
        var detail = reportService.getReportDetailResponse(reportNo);
        if (detail != null) {
            return ResponseEntity.ok(detail);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 신고 삭제(허위신고)
    @DeleteMapping("/{reportNo}")
    public ResponseEntity<?> deleteReport(@PathVariable("reportNo") int reportNo) {
        int result = reportService.deleteReport(reportNo);
        if (result > 0) {
            return ResponseEntity.ok().body("신고가 삭제되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("신고 삭제에 실패했습니다.");
        }
    }

    // 회원 제재(제재 카운트 증가)
    @PostMapping("/sanction/{memberNo}")
    public ResponseEntity<?> increaseSanctionCount(@PathVariable("memberNo") long memberNo) {
        int result = reportService.increaseSanctionCount(memberNo);
        if (result > 0) {
            return ResponseEntity.ok().body("회원 제재 카운트가 증가되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("회원 제재에 실패했습니다.");
        }
    }

    // 회원 제재 취소(제재 카운트 1 감소)
    @PostMapping("/sanction-cancel/{memberNo}")
    public ResponseEntity<?> decreaseSanctionCount(@PathVariable("memberNo") long memberNo) {
        int result = reportService.decreaseSanctionCount(memberNo);
        if (result > 0) {
            return ResponseEntity.ok().body("회원 제재 카운트가 감소되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("회원 제재 취소에 실패했습니다.");
        }
    }
}
