package com.project.festive.festiveserver.travel.controller;

import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
import com.project.festive.festiveserver.travel.dto.TravelCourseSaveRequest;
import com.project.festive.festiveserver.travel.entity.TravelCourse;
import com.project.festive.festiveserver.travel.entity.TravelCourseDetail;
import com.project.festive.festiveserver.travel.service.TravelCourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 여행코스 저장/공유 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/travel-course")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173"})
public class TravelCourseController {
    
    private final TravelCourseService travelCourseService;
    
    /**
     * AI 여행코스 저장
     */
    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> saveTravelCourse(
            @RequestBody TravelCourseSaveRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 로그인 확인
            if (userDetails == null) {
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }
            
            Long memberNo = userDetails.getMemberNo();
            log.info("🚀 여행코스 저장 요청 - 회원: {}, 제목: {}", memberNo, request.getCourseTitle());
            
            // 입력값 검증
            if (request.getCourseTitle() == null || request.getCourseTitle().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "여행코스 제목을 입력해주세요.");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (request.getLocations() == null || request.getLocations().isEmpty()) {
                response.put("success", false);
                response.put("message", "저장할 여행 장소가 없습니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 여행코스 저장
            Long courseNo = travelCourseService.saveTravelCourse(request, memberNo);
            
            response.put("success", true);
            response.put("message", "여행코스가 성공적으로 저장되었습니다.");
            response.put("courseNo", courseNo);
            
            log.info("✅ 여행코스 저장 완료 - 코스번호: {}", courseNo);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 여행코스 저장 실패", e);
            response.put("success", false);
            response.put("message", "여행코스 저장에 실패했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * 회원별 여행코스 목록 조회
     */
    @GetMapping("/my-courses")
    public ResponseEntity<Map<String, Object>> getMyCourses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (userDetails == null) {
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }
            
            Long memberNo = userDetails.getMemberNo();
            List<TravelCourse> courses = travelCourseService.getMemberTravelCourses(memberNo);
            
            response.put("success", true);
            response.put("courses", courses);
            response.put("count", courses.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 여행코스 목록 조회 실패", e);
            response.put("success", false);
            response.put("message", "여행코스 목록 조회에 실패했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * 공유된 여행코스 목록 조회
     */
    @GetMapping("/shared-courses")
    public ResponseEntity<Map<String, Object>> getSharedCourses() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<TravelCourse> courses = travelCourseService.getSharedTravelCourses();
            
            response.put("success", true);
            response.put("courses", courses);
            response.put("count", courses.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 공유 여행코스 목록 조회 실패", e);
            response.put("success", false);
            response.put("message", "공유 여행코스 목록 조회에 실패했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * 여행코스 상세 정보 조회
     */
    @GetMapping("/{courseNo}")
    public ResponseEntity<Map<String, Object>> getCourseDetails(@PathVariable Long courseNo) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            TravelCourse course = travelCourseService.getTravelCourseWithDetails(courseNo);
            List<TravelCourseDetail> details = travelCourseService.getTravelCourseDetails(courseNo);
            
            if (course == null) {
                response.put("success", false);
                response.put("message", "존재하지 않는 여행코스입니다.");
                return ResponseEntity.notFound().build();
            }
            
            response.put("success", true);
            response.put("course", course);
            response.put("details", details);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 여행코스 상세 조회 실패", e);
            response.put("success", false);
            response.put("message", "여행코스 상세 조회에 실패했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * 여행코스 삭제 (본인만 가능)
     */
    @DeleteMapping("/{courseNo}")
    public ResponseEntity<Map<String, Object>> deleteCourse(
            @PathVariable Long courseNo,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (userDetails == null) {
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }
            
            Long memberNo = userDetails.getMemberNo();
            boolean deleted = travelCourseService.deleteTravelCourse(courseNo, memberNo);
            
            if (deleted) {
                response.put("success", true);
                response.put("message", "여행코스가 삭제되었습니다.");
            } else {
                response.put("success", false);
                response.put("message", "삭제 권한이 없거나 존재하지 않는 여행코스입니다.");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 여행코스 삭제 실패", e);
            response.put("success", false);
            response.put("message", "여행코스 삭제에 실패했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }
} 