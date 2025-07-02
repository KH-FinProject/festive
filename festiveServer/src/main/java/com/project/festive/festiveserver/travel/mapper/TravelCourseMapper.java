package com.project.festive.festiveserver.travel.mapper;

import com.project.festive.festiveserver.travel.entity.TravelCourse;
import com.project.festive.festiveserver.travel.entity.TravelCourseDetail;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 여행코스 MyBatis Mapper
 */
@Mapper
public interface TravelCourseMapper {
    
    /**
     * 여행코스 저장
     */
    int insertTravelCourse(TravelCourse travelCourse);
    
    /**
     * 여행코스 상세 장소 저장
     */
    int insertTravelCourseDetail(TravelCourseDetail detail);
    
    /**
     * 회원별 여행코스 목록 조회
     */
    List<TravelCourse> selectTravelCoursesByMemberNo(@Param("memberNo") Long memberNo);
    
    /**
     * 공유된 여행코스 목록 조회
     */
    List<TravelCourse> selectSharedTravelCourses();
    
    /**
     * 여행코스 상세 정보 조회 (상세 장소 포함)
     */
    TravelCourse selectTravelCourseWithDetails(@Param("courseNo") Long courseNo);
    
    /**
     * 여행코스의 상세 장소 목록 조회
     */
    List<TravelCourseDetail> selectTravelCourseDetails(@Param("courseNo") Long courseNo);
    
    /**
     * 여행코스 삭제
     */
    int deleteTravelCourse(@Param("courseNo") Long courseNo, @Param("memberNo") Long memberNo);
    
    /**
     * 여행코스 공유 상태 변경
     */
    int updateShareStatus(@Param("courseNo") Long courseNo, @Param("memberNo") Long memberNo, @Param("isShared") String isShared);
} 