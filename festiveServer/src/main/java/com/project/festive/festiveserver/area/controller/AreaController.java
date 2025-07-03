package com.project.festive.festiveserver.area.controller;

import com.project.festive.festiveserver.area.entity.Area;
import com.project.festive.festiveserver.area.entity.Sigungu;
import com.project.festive.festiveserver.area.service.AreaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/area")
@RequiredArgsConstructor
@Slf4j
public class AreaController {
    
    private final AreaService areaService;
    
    /**
     * 모든 지역코드 조회
     */
    @GetMapping("/areas")
    public ResponseEntity<List<Area>> getAllAreas() {
        log.info("지역코드 목록 조회 요청");
        List<Area> areas = areaService.getAllAreas();
        return ResponseEntity.ok(areas);
    }
    
    /**
     * 특정 지역의 시군구코드 조회
     */
    @GetMapping("/sigungus/{areaCode}")
    public ResponseEntity<List<Sigungu>> getSigungusByAreaCode(@PathVariable String areaCode) {
        log.info("지역코드 {}의 시군구 목록 조회 요청", areaCode);
        List<Sigungu> sigungus = areaService.getSigungusByAreaCode(areaCode);
        return ResponseEntity.ok(sigungus);
    }
    
    /**
     * 지역명으로 지역코드 조회 (AI 서비스용)
     */
    @GetMapping("/area/{areaName}")
    public ResponseEntity<Area> getAreaByAreaName(@PathVariable String areaName) {
        log.info("지역명 {}으로 지역코드 조회 요청", areaName);
        Optional<Area> area = areaService.getAreaByAreaName(areaName);
        return area.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 시군구명으로 시군구코드 조회 (AI 서비스용)
     */
    @GetMapping("/sigungu/{sigunguName}")
    public ResponseEntity<Sigungu> getSigunguBySigunguName(@PathVariable String sigunguName) {
        log.info("시군구명 {}으로 시군구코드 조회 요청", sigunguName);
        Optional<Sigungu> sigungu = areaService.getSigunguBySigunguName(sigunguName);
        return sigungu.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 지역코드와 시군구명으로 시군구코드 조회 (AI 서비스용)
     */
    @GetMapping("/sigungu/{areaCode}/{sigunguName}")
    public ResponseEntity<Sigungu> getSigunguByAreaCodeAndSigunguName(
            @PathVariable String areaCode, 
            @PathVariable String sigunguName) {
        log.info("지역코드 {}와 시군구명 {}으로 시군구코드 조회 요청", areaCode, sigunguName);
        Optional<Sigungu> sigungu = areaService.getSigunguByAreaCodeAndSigunguName(areaCode, sigunguName);
        return sigungu.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 지역코드 매핑 데이터 조회 (AI 서비스 호환)
     */
    @GetMapping("/mapping/area")
    public ResponseEntity<Map<String, String>> getAreaCodeMapping() {
        log.info("지역코드 매핑 데이터 조회 요청");
        Map<String, String> mapping = areaService.getAreaCodeMapping();
        return ResponseEntity.ok(mapping);
    }
    
    /**
     * 시군구코드 매핑 데이터 조회 (AI 서비스 호환)
     */
    @GetMapping("/mapping/sigungu")
    public ResponseEntity<Map<String, String>> getSigunguCodeMapping() {
        log.info("시군구코드 매핑 데이터 조회 요청");
        Map<String, String> mapping = areaService.getSigunguCodeMapping();
        return ResponseEntity.ok(mapping);
    }
} 