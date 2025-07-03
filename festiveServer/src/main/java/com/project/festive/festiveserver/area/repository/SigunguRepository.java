package com.project.festive.festiveserver.area.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.project.festive.festiveserver.area.entity.Sigungu;
import com.project.festive.festiveserver.area.entity.Sigungu.SigunguId;

import java.util.List;
import java.util.Optional;

public interface SigunguRepository extends JpaRepository<Sigungu, SigunguId> {
    
    // 지역코드로 시군구 목록 조회 (복합키의 일부 필드이므로 @Query 필요)
    @Query("SELECT s FROM Sigungu s WHERE s.id.areaCode = :areaCode")
    List<Sigungu> findByAreaCode(@Param("areaCode") String areaCode);
    
    // AI 서비스용 조회 메서드 (Spring Data JPA 명명 규칙 활용)
    Optional<Sigungu> findBySigunguName(String sigunguName);
    
    // 복합 조건 조회 (복합키의 일부 필드이므로 @Query 필요)
    @Query("SELECT s FROM Sigungu s WHERE s.id.areaCode = :areaCode AND s.sigunguName = :sigunguName")
    Optional<Sigungu> findByAreaCodeAndSigunguName(@Param("areaCode") String areaCode, @Param("sigunguName") String sigunguName);
    
    // 추가적인 쿼리 메서드는 필요시에만 추가
}
