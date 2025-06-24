package com.project.festive.festiveserver.report.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReportDetailResponse {
    // 신고 공통 정보
    private int reportNo;
    private int reportType; // 0: 게시글, 1: 댓글
    private String reportReason;
    private String reportTime;
    private int reportStatus;

    // 신고 대상 회원 정보
    private int memberNo;
    private String memberNickname;

    // 게시글 정보
    private Integer boardNo;
    private String boardTitle;
    private String boardContent;

    // 댓글 정보 (댓글 신고일 때만)
    private Integer commentNo;
    private String commentContent;
    private String commentWriteDate;
} 