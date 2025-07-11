package com.project.festive.festiveserver.area.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.project.festive.festiveserver.area.entity.Area;
import java.util.Optional;

public interface AreaRepository extends JpaRepository<Area, String> {
    // 기본 CRUD 메서드만 사용 (findAll, save, deleteById 등)
    
    // AI 서비스용 조회 메서드 (Spring Data JPA 명명 규칙 활용)
    Optional<Area> findByAreaName(String areaName);
    
    // 추가적인 쿼리 메서드는 필요시에만 추가
}
