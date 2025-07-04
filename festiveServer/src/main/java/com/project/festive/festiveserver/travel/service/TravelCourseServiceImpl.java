package com.project.festive.festiveserver.travel.service;

import com.project.festive.festiveserver.travel.dto.TravelCourseSaveRequest;
import com.project.festive.festiveserver.travel.entity.TravelCourse;
import com.project.festive.festiveserver.travel.entity.TravelCourseDetail;
import com.project.festive.festiveserver.travel.mapper.TravelCourseMapper;
import com.project.festive.festiveserver.area.service.AreaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * 여행코스 서비스 구현체
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TravelCourseServiceImpl implements TravelCourseService {
    
    private final TravelCourseMapper travelCourseMapper;
    private final AreaService areaService;
    
    @Override
    @Transactional
    public Long saveTravelCourse(TravelCourseSaveRequest request, Long memberNo) {
        try {
            log.info("🚀 여행코스 저장 시작 - 회원: {}, 제목: {}", memberNo, request.getCourseTitle());
            
            // 1. 메인 여행코스 저장
            TravelCourse travelCourse = new TravelCourse();
            travelCourse.setMemberNo(memberNo);
            travelCourse.setCourseTitle(request.getCourseTitle());
            travelCourse.setThumbnailImage(request.getThumbnailImage());
            
            // areaCode가 null이거나 빈 문자열이면 시군구 매칭 시도 후 "전국"으로 처리
            String regionName = request.getRegionName();
            String areaCode = request.getAreaCode();
            String sigunguCode = request.getSigunguCode();
            
            if (areaCode == null || areaCode.trim().isEmpty()) {
                log.info("🔍 areaCode가 null입니다. 시군구 매칭을 시도합니다 - regionName: {}", regionName);
                
                // 시군구 매칭 시도
                SigunguMatchResult matchResult = tryMatchSigunguFromRegionName(regionName);
                
                if (matchResult != null) {
                    areaCode = matchResult.getAreaCode();
                    sigunguCode = matchResult.getSigunguCode();
                    log.info("✅ 시군구 매칭 성공 - regionName: {}, areaCode: {}, sigunguCode: {}", 
                             regionName, areaCode, sigunguCode);
                } else {
                    // 시군구 매칭도 실패하면 전국으로 처리
                    regionName = "전국";
                    areaCode = "0"; // 전국 코드로 설정
                    sigunguCode = null; // 전국일 때는 시군구 코드 없음
                    log.info("⚠️ 시군구 매칭 실패, 전국으로 처리 - regionName: {}", regionName);
                }
            }
            
            travelCourse.setRegionName(regionName);
            travelCourse.setAreaCode(areaCode);
            travelCourse.setSigunguCode(sigunguCode);
            travelCourse.setTotalDays(request.getTotalDays());
            travelCourse.setRequestType(request.getRequestType());
            travelCourse.setIsShared(request.getIsShared());
            travelCourse.setCourseDescription(request.getCourseDescription()); // AI가 생성한 day별 코스 설명
            
            int courseResult = travelCourseMapper.insertTravelCourse(travelCourse);
            if (courseResult <= 0) {
                throw new RuntimeException("여행코스 저장에 실패했습니다.");
            }
            
            Long courseNo = travelCourse.getCourseNo();
            log.info("✅ 메인 여행코스 저장 완료 - 코스번호: {}", courseNo);
            
            // 2. 상세 장소들 저장
            if (request.getLocations() != null && !request.getLocations().isEmpty()) {
                int savedCount = 0;
                for (TravelCourseSaveRequest.LocationInfo location : request.getLocations()) {
                    TravelCourseDetail detail = new TravelCourseDetail();
                    detail.setCourseNo(courseNo);
                    detail.setDayNumber(location.getDay());
                    detail.setVisitOrder(location.getOrder());
                    detail.setPlaceName(location.getName());
                    detail.setLatitude(location.getLatitude());
                    detail.setLongitude(location.getLongitude());
                    detail.setPlaceImage(location.getImage());
                    detail.setPlaceTel(location.getTel());
                    detail.setPlaceCategory(location.getCategory());
                    detail.setContentId(location.getContentId());
                    detail.setContentTypeId(location.getContentTypeId());
                    
                    int detailResult = travelCourseMapper.insertTravelCourseDetail(detail);
                    if (detailResult > 0) {
                        savedCount++;
                    }
                }
                log.info("✅ 상세 장소 저장 완료 - 총 {}개", savedCount);
            }
            
            log.info("🎉 여행코스 저장 완료 - 코스번호: {}", courseNo);
            return courseNo;
            
        } catch (Exception e) {
            log.error("❌ 여행코스 저장 실패", e);
            throw new RuntimeException("여행코스 저장 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    public List<TravelCourse> getMemberTravelCourses(Long memberNo) {
        log.info("📋 회원별 여행코스 목록 조회 - 회원: {}", memberNo);
        return travelCourseMapper.selectTravelCoursesByMemberNo(memberNo);
    }
    
    @Override
    public List<TravelCourse> getSharedTravelCourses() {
        log.info("🌐 공유된 여행코스 목록 조회");
        return travelCourseMapper.selectSharedTravelCourses();
    }
    
    @Override
    public TravelCourse getTravelCourseWithDetails(Long courseNo) {
        log.info("📝 여행코스 상세 정보 조회 - 코스번호: {}", courseNo);
        return travelCourseMapper.selectTravelCourseWithDetails(courseNo);
    }
    
    @Override
    public List<TravelCourseDetail> getTravelCourseDetails(Long courseNo) {
        log.info("📍 여행코스 상세 장소 목록 조회 - 코스번호: {}", courseNo);
        return travelCourseMapper.selectTravelCourseDetails(courseNo);
    }
    
    @Override
    @Transactional
    public boolean deleteTravelCourse(Long courseNo, Long memberNo) {
        log.info("🗑️ 여행코스 삭제 - 코스번호: {}, 회원: {}", courseNo, memberNo);
        try {
            int result = travelCourseMapper.deleteTravelCourse(courseNo, memberNo);
            boolean success = result > 0;
            if (success) {
                log.info("✅ 여행코스 삭제 완료 - 코스번호: {}", courseNo);
            } else {
                log.warn("⚠️ 여행코스 삭제 실패 - 권한 없음 또는 존재하지 않음");
            }
            return success;
        } catch (Exception e) {
            log.error("❌ 여행코스 삭제 실패", e);
            return false;
        }
    }
    
    @Override
    @Transactional
    public boolean updateShareStatus(Long courseNo, Long memberNo, String isShared) {
        log.info("🔄 여행코스 공유 상태 변경 - 코스번호: {}, 회원: {}, 공유상태: {}", courseNo, memberNo, isShared);
        try {
            int result = travelCourseMapper.updateShareStatus(courseNo, memberNo, isShared);
            boolean success = result > 0;
            if (success) {
                log.info("✅ 여행코스 공유 상태 변경 완료 - 코스번호: {}, 공유상태: {}", courseNo, isShared);
            } else {
                log.warn("⚠️ 여행코스 공유 상태 변경 실패 - 권한 없음 또는 존재하지 않음");
            }
            return success;
        } catch (Exception e) {
            log.error("❌ 여행코스 공유 상태 변경 실패", e);
            return false;
        }
    }
    
    /**
     * 시군구 매칭 결과를 담는 내부 클래스
     */
    private static class SigunguMatchResult {
        private final String areaCode;
        private final String sigunguCode;
        
        public SigunguMatchResult(String areaCode, String sigunguCode) {
            this.areaCode = areaCode;
            this.sigunguCode = sigunguCode;
        }
        
        public String getAreaCode() { return areaCode; }
        public String getSigunguCode() { return sigunguCode; }
    }
    
    /**
     * 지역명에서 시군구 매칭을 시도하여 areaCode와 sigunguCode를 찾는 메서드
     * @param regionName 지역명 (예: "경상남도 통영시", "통영", "통영시" 등)
     * @return 매칭된 SigunguMatchResult, 실패하면 null
     */
    private SigunguMatchResult tryMatchSigunguFromRegionName(String regionName) {
        if (regionName == null || regionName.trim().isEmpty()) {
            return null;
        }
        
        try {
            String normalizedRegionName = regionName.toLowerCase().trim();
            log.info("🔍 시군구 매칭 시도 - 입력: '{}'", regionName);
            
            // DB에서 시군구 매핑 정보 가져오기
            Map<String, String> sigunguCodeMapping = areaService.getSigunguCodeMapping();
            
            // 시군구 매칭 시도
            for (Map.Entry<String, String> entry : sigunguCodeMapping.entrySet()) {
                String sigunguName = entry.getKey();
                String sigunguCode = entry.getValue(); // "36_17" 형태
                
                // 다양한 매칭 패턴 시도
                if (isRegionNameMatch(normalizedRegionName, sigunguName)) {
                    // sigunguCode에서 areaCode 추출 (예: "36_17" → "36")
                    String areaCode = sigunguCode.split("_")[0];
                    String actualSigunguCode = sigunguCode.split("_")[1];
                    log.info("✅ 시군구 매칭 성공 - '{}' → 시군구: {}, areaCode: {}, sigunguCode: {}", 
                             regionName, sigunguName, areaCode, actualSigunguCode);
                    return new SigunguMatchResult(areaCode, actualSigunguCode);
                }
            }
            
            log.info("⚠️ 시군구 매칭 실패 - 매칭되는 시군구 없음: '{}'", regionName);
            return null;
            
        } catch (Exception e) {
            log.error("❌ 시군구 매칭 중 오류 발생 - regionName: {}", regionName, e);
            return null;
        }
    }
    
    /**
     * 지역명과 시군구명이 매칭되는지 확인하는 헬퍼 메서드
     */
    private boolean isRegionNameMatch(String normalizedRegionName, String sigunguName) {
        String normalizedSigunguName = sigunguName.toLowerCase().trim();
        
        // 1. 정확한 매칭 (통영시 -> 통영시)
        if (normalizedRegionName.contains(normalizedSigunguName)) {
            return true;
        }
        
        // 2. 시/군/구 제거 매칭 (통영시 -> 통영)
        if (normalizedSigunguName.endsWith("시") || normalizedSigunguName.endsWith("군") || normalizedSigunguName.endsWith("구")) {
            String baseSigunguName = normalizedSigunguName.substring(0, normalizedSigunguName.length() - 1);
            if (normalizedRegionName.contains(baseSigunguName)) {
                return true;
            }
        }
        
        // 3. 반대 매칭 (통영 -> 통영시)
        if (sigunguName.length() > 2) {
            String baseSigunguName = sigunguName.substring(0, sigunguName.length() - 1).toLowerCase();
            if (normalizedRegionName.contains(baseSigunguName)) {
                return true;
            }
        }
        
        return false;
    }
} 