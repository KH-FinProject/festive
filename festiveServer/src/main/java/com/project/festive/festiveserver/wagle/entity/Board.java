package com.project.festive.festiveserver.wagle.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

import com.project.festive.festiveserver.member.entity.Member;

@Entity
@Table(name = "BOARD")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Board {
    
    @Id
    @Column(name = "BOARD_NO")
    @SequenceGenerator(
        name = "board_seq",
        sequenceName = "SEQ_BOARD_NO",
        allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "board_seq")
    private Long boardNo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BOARD_TYPE_NO")
    private BoardType boardType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBER_NO")
    private Member member;
    
    @Column(name = "BOARD_TITLE", nullable = false, length = 200)
    private String boardTitle;
    
    @Column(name = "BOARD_CONTENT", nullable = false, length = 4000)
    private String boardContent;
    
    @Column(name = "BOARD_VIEW_COUNT", nullable = false)
    @Builder.Default
    private Integer boardViewCount = 0;
    
    @Column(name = "BOARD_LIKE_COUNT", nullable = false)
    @Builder.Default
    private Integer boardLikeCount = 0;
    
    @Column(name = "BOARD_COMMENT_COUNT", nullable = false)
    @Builder.Default
    private Integer boardCommentCount = 0;
    
    @Column(name = "BOARD_CREATE_DATE", nullable = false)
    private LocalDateTime boardCreateDate;
    
    @Column(name = "BOARD_UPDATE_DATE")
    private LocalDateTime boardUpdateDate;
    
    @Column(name = "BOARD_DELETE_YN", nullable = false, length = 1)
    @Builder.Default
    private String boardDeleteYn = "N";
} 