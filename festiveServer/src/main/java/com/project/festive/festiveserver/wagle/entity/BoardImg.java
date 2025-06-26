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

@Entity
@Table(name = "BOARD_IMG")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardImg {
    
    @Id
    @Column(name = "BOARD_IMG_NO")
    @SequenceGenerator(
        name = "board_img_seq",
        sequenceName = "SEQ_BOARD_IMG_NO",
        allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "board_img_seq")
    private Long boardImgNo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BOARD_NO")
    private Board board;
    
    @Column(name = "BOARD_IMG_ORIGINAL", nullable = false, length = 200)
    private String boardImgOriginal;
    
    @Column(name = "BOARD_IMG_RENAME", nullable = false, length = 200)
    private String boardImgRename;
    
    @Column(name = "BOARD_IMG_PATH", nullable = false, length = 500)
    private String boardImgPath;
    
    @Column(name = "BOARD_IMG_LEVEL", nullable = false)
    private Integer boardImgLevel;
} 