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
@Table(name = "COMMENT")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    
    @Id
    @Column(name = "COMMENT_NO")
    @SequenceGenerator(
        name = "comment_seq",
        sequenceName = "SEQ_COMMENT_NO",
        allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "comment_seq")
    private Long commentNo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BOARD_NO")
    private Board board;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBER_NO")
    private Member member;
    
    @Column(name = "COMMENT_CONTENT", nullable = false, length = 1000)
    private String commentContent;
    
    @Column(name = "COMMENT_PARENT_NO")
    private Long commentParentNo;
    
    @Column(name = "COMMENT_CREATE_DATE", nullable = false)
    private LocalDateTime commentCreateDate;
    
    @Column(name = "COMMENT_UPDATE_DATE")
    private LocalDateTime commentUpdateDate;
    
    @Column(name = "COMMENT_DELETE_YN", nullable = false, length = 1)
    @Builder.Default
    private String commentDeleteYn = "N";
} 