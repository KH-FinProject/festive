package com.project.festive.festiveserver.area.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "AREA")
public class Area {
    @Id
    @Column(name = "AREA_CODE", nullable = false)
    private String areaCode;
    @Column(name = "AREA_NAME", nullable = false)
    private String areaName;
    
    // 시군구 리스트
    @OneToMany(mappedBy = "area", fetch = FetchType.LAZY)
    private List<Sigungu> sigungus;
}
