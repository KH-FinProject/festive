package com.project.festive.festiveserver.area.service;

import com.project.festive.festiveserver.area.entity.Area;
import com.project.festive.festiveserver.area.entity.Sigungu;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface AreaService {
    // 스케줄러용 업데이트 메서드
    void updateAreaCodes();
    void updateSigunguCodes();
    
    // 기본 조회 메서드
    List<Area> getAllAreas();
    List<Sigungu> getSigungusByAreaCode(String areaCode);
    
    // AI 서비스용 조회 메서드
    Optional<Area> getAreaByAreaName(String areaName);
    Optional<Sigungu> getSigunguBySigunguName(String sigunguName);
    Optional<Sigungu> getSigunguByAreaCodeAndSigunguName(String areaCode, String sigunguName);
    
    // 매핑 데이터 제공 (AI 서비스 호환)
    Map<String, String> getAreaCodeMapping();
    Map<String, String> getSigunguCodeMapping();
} 