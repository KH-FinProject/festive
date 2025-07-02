package com.project.festive.festiveserver.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerInquiryDto {
    
    // 기본 게시글 정보
    private Long boardNo;
    private Long boardTypeNo;
    private String boardTypeName;
    private Long memberNo;
    private String memberNickname;
    private String boardTitle;
    private String boardContent;
    private Integer boardViewCount;
    private Integer boardLikeCount;
    private Integer boardCommentCount;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime boardCreateDate;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime boardUpdateDate;
    private String boardDeleteYn;
    
    // 고객센터 전용 정보
    private String inquiryStatus;     // 문의 상태 (대기중, 답변완료, 처리중)
    private boolean hasAnswer;        // 답변 여부
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime answerDate; // 답변 작성일
    private String answerContent;     // 답변 내용 (간단 요약)
    private Long answerMemberNo;      // 답변자 번호
    private String answerMemberName;  // 답변자 이름
    private Long answerCommentNo;
    
    // 우선순위 (긴급, 일반, 낮음)
    private String priority;
    
    // 카테고리 (회원가입, 서비스이용, 기술문의, 기타)
    private String category;
    
    // 고객 연락처 (선택사항)
    private String customerEmail;
    private String customerPhone;

    public Long getAnswerCommentNo() { return answerCommentNo; }
    public void setAnswerCommentNo(Long answerCommentNo) { this.answerCommentNo = answerCommentNo; }
} 