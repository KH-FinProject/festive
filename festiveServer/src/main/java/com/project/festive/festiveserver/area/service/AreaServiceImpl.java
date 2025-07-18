package com.project.festive.festiveserver.area.service;

import com.project.festive.festiveserver.area.dto.TourAreaResponse;
import com.project.festive.festiveserver.area.entity.Area;
import com.project.festive.festiveserver.area.entity.Sigungu;
import com.project.festive.festiveserver.area.repository.AreaRepository;
import com.project.festive.festiveserver.area.repository.SigunguRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.HashMap;
import org.springframework.http.ResponseEntity;
import java.net.URI;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AreaServiceImpl implements AreaService {

    private final AreaRepository areaRepository;
    private final SigunguRepository sigunguRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${tour.api.service-key}")
    private String tourApiServiceKey;

    private static final String AREA_CODE_URL = "http://apis.data.go.kr/B551011/KorService2/areaCode2";
    private static final String SIGUNGU_CODE_URL = "http://apis.data.go.kr/B551011/KorService2/areaCode2";

    @Override
    public void updateAreaCodes() {
        log.info("지역코드 업데이트 시작");
        
        try {
            // TourAPI에서 지역코드 조회
            String url = String.format("%s?serviceKey=%s&MobileOS=WEB&MobileApp=festive&_type=json&numOfRows=100",
                    AREA_CODE_URL, tourApiServiceKey);
            
            TourAreaResponse response = getJsonResponse(url, TourAreaResponse.class);
            
            if (response == null || response.getResponse() == null || 
                response.getResponse().getBody() == null || 
                response.getResponse().getBody().getItems() == null) {
                log.error("TourAPI 응답이 올바르지 않습니다.");
                return;
            }

            List<TourAreaResponse.Item> tourAreas = response.getResponse().getBody().getItems().getItem();
            
            if (tourAreas == null || tourAreas.isEmpty()) {
                log.warn("지역코드 데이터가 비어있습니다.");
                return;
            }
            
            // 기존 지역코드 조회
            List<Area> existingAreas = areaRepository.findAll();
            Map<String, Area> existingAreaMap = existingAreas.stream()
                    .collect(Collectors.toMap(Area::getAreaCode, area -> area));
            
            // 새로운 지역코드 Set
            Set<String> newAreaCodes = tourAreas.stream()
                    .map(TourAreaResponse.Item::getCode)
                    .collect(Collectors.toSet());
            
            // 기존 지역코드 Set
            Set<String> existingAreaCodes = existingAreaMap.keySet();
            
            // 삭제할 지역코드 (기존에 있지만 새로운 데이터에 없는 것)
            Set<String> toDelete = existingAreaCodes.stream()
                    .filter(code -> !newAreaCodes.contains(code))
                    .collect(Collectors.toSet());
            
            // 삭제 실행
            for (String areaCode : toDelete) {
                areaRepository.deleteById(areaCode);
            }
            
            // 추가/업데이트
            for (TourAreaResponse.Item tourArea : tourAreas) {
                String areaCode = tourArea.getCode();
                String areaName = tourArea.getName();
                
                Area area = existingAreaMap.get(areaCode);
                if (area == null) {
                    // 새로 추가
                    area = new Area();
                    area.setAreaCode(areaCode);
                    area.setAreaName(areaName);
                    areaRepository.save(area);
                } else if (!areaName.equals(area.getAreaName())) {
                    // 이름이 변경된 경우 업데이트
                    area.setAreaName(areaName);
                    areaRepository.save(area);
                }
            }
            
            log.info("지역코드 업데이트 완료. 추가/업데이트: {}, 삭제: {}", 
                    tourAreas.size(), toDelete.size());
                    
        } catch (Exception e) {
            log.error("지역코드 업데이트 중 오류 발생", e);
        }
    }

    @Override
    public void updateSigunguCodes() {
        log.info("시군구코드 업데이트 시작");
        
        try {
            // 모든 지역코드 조회
            List<Area> areas = areaRepository.findAll();
            
            for (Area area : areas) {
                updateSigunguCodesForArea(area.getAreaCode());
            }
            
            log.info("시군구코드 업데이트 완료");
            
        } catch (Exception e) {
            log.error("시군구코드 업데이트 중 오류 발생", e);
        }
    }
    
    @Override
    public List<Area> getAllAreas() {
        return areaRepository.findAll();
    }
    
    @Override
    public List<Sigungu> getSigungusByAreaCode(String areaCode) {
        return sigunguRepository.findByAreaCode(areaCode);
    }
    
    @Override
    public Optional<Area> getAreaByAreaName(String areaName) {
        return areaRepository.findByAreaName(areaName);
    }
    
    @Override
    public Optional<Sigungu> getSigunguBySigunguName(String sigunguName) {
        return sigunguRepository.findBySigunguName(sigunguName);
    }
    
    @Override
    public Optional<Sigungu> getSigunguByAreaCodeAndSigunguName(String areaCode, String sigunguName) {
        return sigunguRepository.findByAreaCodeAndSigunguName(areaCode, sigunguName);
    }
    
    @Override
    public Map<String, String> getAreaCodeMapping() {
        List<Area> areas = areaRepository.findAll();
        Map<String, String> mapping = new HashMap<>();
        
        for (Area area : areas) {
            // 정식명칭과 줄임형 모두 매핑
            mapping.put(area.getAreaName(), area.getAreaCode());
            
            // 줄임형 처리 (예: "서울특별시" -> "서울")
            String shortName = getShortAreaName(area.getAreaName());
            if (!shortName.equals(area.getAreaName())) {
                mapping.put(shortName, area.getAreaCode());
            }
        }
        
        return mapping;
    }
    
    @Override
    public Map<String, String> getSigunguCodeMapping() {
        List<Area> areas = areaRepository.findAll();
        Map<String, String> mapping = new HashMap<>();
        
        for (Area area : areas) {
            List<Sigungu> sigungus = sigunguRepository.findByAreaCode(area.getAreaCode());
            
            for (Sigungu sigungu : sigungus) {
                String sigunguCode = area.getAreaCode() + "_" + sigungu.getId().getSigunguCode();
                mapping.put(sigungu.getSigunguName(), sigunguCode);
                
                // 줄임형 처리 (예: "강남구" -> "강남")
                String shortName = getShortSigunguName(sigungu.getSigunguName());
                if (!shortName.equals(sigungu.getSigunguName())) {
                    mapping.put(shortName, sigunguCode);
                }
            }
        }
        
        return mapping;
    }
    
    private String getShortAreaName(String fullName) {
        // 지역명 줄임형 처리
        if (fullName.endsWith("특별시")) {
            return fullName.replace("특별시", "");
        } else if (fullName.endsWith("광역시")) {
            return fullName.replace("광역시", "");
        } else if (fullName.endsWith("특별자치시")) {
            return fullName.replace("특별자치시", "");
        } else if (fullName.endsWith("도")) {
            return fullName.replace("도", "");
        } else if (fullName.endsWith("특별자치도")) {
            return fullName.replace("특별자치도", "");
        }
        return fullName;
    }
    
    private String getShortSigunguName(String fullName) {
        // 시군구명 줄임형 처리
        if (fullName.endsWith("시")) {
            return fullName.replace("시", "");
        } else if (fullName.endsWith("군")) {
            return fullName.replace("군", "");
        } else if (fullName.endsWith("구")) {
            return fullName.replace("구", "");
        }
        return fullName;
    }
    
    private void updateSigunguCodesForArea(String areaCode) {
    try {
        // Area 엔티티 조회
        Area area = areaRepository.findById(areaCode)
                .orElseThrow(() -> new IllegalStateException("Area not found: " + areaCode));

        // TourAPI에서 시군구코드 조회
        String url = String.format("%s?serviceKey=%s&MobileOS=WEB&MobileApp=festive&_type=json&numOfRows=100&areaCode=%s",
                SIGUNGU_CODE_URL, tourApiServiceKey, areaCode);
        
        TourAreaResponse response = getJsonResponse(url, TourAreaResponse.class);
        
        if (response == null || response.getResponse() == null || 
            response.getResponse().getBody() == null || 
            response.getResponse().getBody().getItems() == null) {
            log.warn("지역코드 {}의 시군구 데이터가 없습니다.", areaCode);
            return;
        }

        List<TourAreaResponse.Item> tourSigungus = response.getResponse().getBody().getItems().getItem();
        
        if (tourSigungus == null || tourSigungus.isEmpty()) {
            log.warn("지역코드 {}의 시군구 데이터가 비어있습니다.", areaCode);
            return;
        }
        
        // 기존 시군구코드 조회
        List<Sigungu> existingSigungus = sigunguRepository.findByAreaCode(areaCode);
        Map<String, Sigungu> existingSigunguMap = existingSigungus.stream()
                .collect(Collectors.toMap(s -> s.getId().getSigunguCode(), sigungu -> sigungu));
        
        // 추가/업데이트
        for (TourAreaResponse.Item tourSigungu : tourSigungus) {
            String sigunguCode = tourSigungu.getCode();
            String sigunguName = tourSigungu.getName();
            
            Sigungu sigungu = existingSigunguMap.get(sigunguCode);
            if (sigungu == null) {
                // 새로 추가
                sigungu = new Sigungu();
                Sigungu.SigunguId id = new Sigungu.SigunguId();
                id.setAreaCode(areaCode);
                id.setSigunguCode(sigunguCode);
                sigungu.setId(id);
                sigungu.setSigunguName(sigunguName);
                sigungu.setArea(area);  // Area 엔티티 설정
                sigunguRepository.save(sigungu);
            } else if (!sigunguName.equals(sigungu.getSigunguName())) {
                // 이름이 변경된 경우 업데이트
                sigungu.setSigunguName(sigunguName);
                sigungu.setArea(area);  // Area 엔티티 설정
                sigunguRepository.save(sigungu);
            }
        }
        
    } catch (Exception e) {
        log.error("지역코드 {}의 시군구코드 업데이트 중 오류 발생", areaCode, e);
    }
}
    
    /**
     * JSON 응답을 안전하게 처리하는 헬퍼 메서드
     * RestTemplate과 ObjectMapper를 사용하여 더 견고한 JSON 처리를 제공
     */
    private <T> T getJsonResponse(String url, Class<T> responseType) {
    try {
        // 수정된 URL 처리 방식
        URI uri = URI.create(url);
        ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
        String jsonResponse = response.getBody();
        
        if (jsonResponse != null && !jsonResponse.trim().isEmpty()) {
            // XML 응답인 경우 건너뛰기
            if (jsonResponse.trim().startsWith("<")) {
                log.warn("XML 응답을 받았습니다. JSON 응답이 필요합니다.");
                return null;
            }
            
            return objectMapper.readValue(jsonResponse, responseType);
        }
        
        log.error("API 응답이 비어있습니다: {}", url);
        return null;
        
    } catch (Exception e) {
        log.error("API 처리 중 오류 발생: {}", e.getMessage());
        return null;
    }
}
}