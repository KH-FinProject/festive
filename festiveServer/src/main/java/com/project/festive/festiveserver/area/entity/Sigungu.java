package com.project.festive.festiveserver.area.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "SIGUNGU")
public class Sigungu {
    @EmbeddedId // 복합키 사용
    private SigunguId id;
    
    @Column(name = "SIGUNGU_NAME")
    private String sigunguName;
    
    @ManyToOne(fetch = FetchType.LAZY) // 다대일 관계
    @MapsId("areaCode") // 복합키 중 areaCode 매핑
    @JoinColumn(name = "AREA_CODE")
    private Area area;
    
    @Data
    @Embeddable // 복합키 클래스
    public static class SigunguId implements java.io.Serializable {
        @Column(name = "AREA_CODE")
        private String areaCode;
        
        @Column(name = "SIGUNGU_CODE")
        private String sigunguCode;
    }
}
