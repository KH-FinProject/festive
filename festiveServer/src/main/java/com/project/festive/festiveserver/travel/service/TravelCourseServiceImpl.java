package com.project.festive.festiveserver.travel.service;

import com.project.festive.festiveserver.travel.dto.TravelCourseSaveRequest;
import com.project.festive.festiveserver.travel.entity.TravelCourse;
import com.project.festive.festiveserver.travel.entity.TravelCourseDetail;
import com.project.festive.festiveserver.travel.mapper.TravelCourseMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 여행코스 서비스 구현체
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TravelCourseServiceImpl implements TravelCourseService {
    
    private final TravelCourseMapper travelCourseMapper;
    
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
            
            // areaCode가 null이거나 빈 문자열이면 "전국"으로 처리
            String regionName = request.getRegionName();
            String areaCode = request.getAreaCode();
            if (areaCode == null || areaCode.trim().isEmpty()) {
                regionName = "전국";
                areaCode = "0"; // 전국 코드로 설정
            }
            
            travelCourse.setRegionName(regionName);
            travelCourse.setAreaCode(areaCode);
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
} 