package com.project.festive.festiveserver.area.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "AREA")
public class Area {
    @Id
    private String areaCode;
    private String areaName;
    
    // 시군구 리스트
    @OneToMany(mappedBy = "area", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Sigungu> sigungus;
}
