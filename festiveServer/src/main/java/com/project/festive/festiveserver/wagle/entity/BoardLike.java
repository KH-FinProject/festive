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
@Table(name = "BOARD_LIKE")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardLike {
    
    @Id
    @Column(name = "LIKE_NO")
    @SequenceGenerator(
        name = "board_like_seq",
        sequenceName = "SEQ_BOARD_LIKE_NO",
        allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "board_like_seq")
    private Long likeNo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BOARD_NO")
    private Board board;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBER_NO")
    private Member member;
    
    @Column(name = "LIKE_CREATE_DATE", nullable = false)
    private LocalDateTime likeCreateDate;
} 