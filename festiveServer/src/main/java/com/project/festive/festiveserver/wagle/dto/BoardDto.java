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
public class BoardDto {
    
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
    private LocalDateTime boardCreateDate;
    private LocalDateTime boardUpdateDate;
    private String boardDeleteYn;
    private List<String> boardImages;
    
    
    
    // 목록 조회용 생성자
    public BoardDto(Long boardNo, String boardTitle, String memberNickname, 
                   LocalDateTime boardCreateDate, Integer boardViewCount, 
                   Integer boardLikeCount, Integer boardCommentCount) {
        this.boardNo = boardNo;
        this.boardTitle = boardTitle;
        this.memberNickname = memberNickname;
        this.boardCreateDate = boardCreateDate;
        this.boardViewCount = boardViewCount;
        this.boardLikeCount = boardLikeCount;
        this.boardCommentCount = boardCommentCount;
    }
} 