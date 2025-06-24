package com.project.festive.festiveserver.report.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Report {

    private int reportNo; // 신고 번호
    private int memberNo; // 신고 당한 회원 번호
    private int reporterNo; // 신고한 회원 번호
    private String reportTime; // 신고 시간
    private String reportReason; // 신고 사유
    private int reportStatus; // 관리자 처리여부 (0: 대기, 1: 처리완료)
    private int reportType; // 신고 타입 (게시글: 0, 댓글: 1)
    private int reportBoardNo; // 신고 게시글 번호

}
