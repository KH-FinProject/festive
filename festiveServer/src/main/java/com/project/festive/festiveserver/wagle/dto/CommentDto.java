package com.project.festive.festiveserver.wagle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    
    private Long commentNo;
    private Long boardNo;
    private Long memberNo;
    private String memberNickname;
    private String commentContent;
    private Long commentParentNo;
    private LocalDateTime commentCreateDate;
    private LocalDateTime commentUpdateDate;
    private String commentDeleteYn;
    private List<CommentDto> replies;
    
    // 목록 조회용 생성자
    public CommentDto(Long commentNo, Long boardNo, Long memberNo, String memberNickname,
                     String commentContent, Long commentParentNo, LocalDateTime commentCreateDate) {
        this.commentNo = commentNo;
        this.boardNo = boardNo;
        this.memberNo = memberNo;
        this.memberNickname = memberNickname;
        this.commentContent = commentContent;
        this.commentParentNo = commentParentNo;
        this.commentCreateDate = commentCreateDate;
    }
} 