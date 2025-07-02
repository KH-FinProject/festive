package com.project.festive.festiveserver.travel.service;

import com.project.festive.festiveserver.travel.dto.TravelCourseSaveRequest;
import com.project.festive.festiveserver.travel.entity.TravelCourse;
import com.project.festive.festiveserver.travel.entity.TravelCourseDetail;

import java.util.List;

/**
 * 여행코스 서비스 인터페이스
 */
public interface TravelCourseService {
    
    /**
     * 여행코스 저장
     * @param request 저장 요청 데이터
     * @param memberNo 회원 번호
     * @return 저장된 여행코스 번호
     */
    Long saveTravelCourse(TravelCourseSaveRequest request, Long memberNo);
    
    /**
     * 회원별 여행코스 목록 조회
     * @param memberNo 회원 번호
     * @return 여행코스 목록
     */
    List<TravelCourse> getMemberTravelCourses(Long memberNo);
    
    /**
     * 공유된 여행코스 목록 조회
     * @return 공유된 여행코스 목록
     */
    List<TravelCourse> getSharedTravelCourses();
    
    /**
     * 여행코스 상세 정보 조회
     * @param courseNo 여행코스 번호
     * @return 여행코스 상세 정보
     */
    TravelCourse getTravelCourseWithDetails(Long courseNo);
    
    /**
     * 여행코스의 상세 장소 목록 조회
     * @param courseNo 여행코스 번호
     * @return 상세 장소 목록
     */
    List<TravelCourseDetail> getTravelCourseDetails(Long courseNo);
    
    /**
     * 여행코스 삭제
     * @param courseNo 여행코스 번호
     * @param memberNo 회원 번호 (소유자 확인용)
     * @return 삭제 성공 여부
     */
    boolean deleteTravelCourse(Long courseNo, Long memberNo);
} 