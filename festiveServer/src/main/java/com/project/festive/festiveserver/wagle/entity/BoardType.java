package com.project.festive.festiveserver.wagle.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "BOARD_TYPE")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardType {
    
    @Id
    @Column(name = "BOARD_TYPE_NO")
    @SequenceGenerator(
        name = "board_type_seq",
        sequenceName = "SEQ_BOARD_TYPE_NO",
        allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "board_type_seq")
    private Long boardTypeNo;
    
    @Column(name = "BOARD_TYPE_NAME", nullable = false, length = 50)
    private String boardTypeName;
    
    @Column(name = "BOARD_TYPE_DESC", length = 200)
    private String boardTypeDesc;
} 