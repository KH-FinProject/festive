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
     * 여행코스 상세 정보 조회 (공유된 코스는 인증 없이, 개인 코스는 본인만 접근 가능)
     */
    @GetMapping("/{courseNo}")
    public ResponseEntity<Map<String, Object>> getCourseDetails(
            @PathVariable("courseNo") Long courseNo,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            TravelCourse course = travelCourseService.getTravelCourseWithDetails(courseNo);
            
            if (course == null) {
                response.put("success", false);
                response.put("message", "존재하지 않는 여행코스입니다.");
                return ResponseEntity.notFound().build();
            }
            
            // 공유된 코스가 아닌 경우 본인 확인 필요
            if (!"Y".equals(course.getIsShared())) {
                if (userDetails == null) {
                    response.put("success", false);
                    response.put("message", "로그인이 필요합니다.");
                    return ResponseEntity.status(401).body(response);
                }
                
                // 본인 코스가 아닌 경우 접근 거부
                if (!course.getMemberNo().equals(userDetails.getMemberNo())) {
                    response.put("success", false);
                    response.put("message", "접근 권한이 없습니다.");
                    return ResponseEntity.status(403).body(response);
                }
            }
            
            List<TravelCourseDetail> details = travelCourseService.getTravelCourseDetails(courseNo);
            
            response.put("success", true);
            response.put("course", course);
            response.put("details", details);
            
            log.info("✅ 여행코스 상세 조회 성공 - 코스번호: {}, 공유여부: {}", 
                    courseNo, course.getIsShared());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 여행코스 상세 조회 실패 - 코스번호: {}", courseNo, e);
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
            @PathVariable("courseNo") Long courseNo,
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
    
    /**
     * 여행코스 공유 상태 변경 (본인만 가능)
     */
    @PatchMapping("/{courseNo}/share-status")
    public ResponseEntity<Map<String, Object>> updateShareStatus(
            @PathVariable("courseNo") Long courseNo,
            @RequestParam String isShared,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (userDetails == null) {
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }
            
            // 공유 상태 값 검증
            if (!"Y".equals(isShared) && !"N".equals(isShared)) {
                response.put("success", false);
                response.put("message", "올바르지 않은 공유 상태 값입니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            Long memberNo = userDetails.getMemberNo();
            boolean updated = travelCourseService.updateShareStatus(courseNo, memberNo, isShared);
            
            if (updated) {
                response.put("success", true);
                response.put("message", "Y".equals(isShared) ? "여행코스가 공유되었습니다." : "여행코스 공유가 취소되었습니다.");
                response.put("isShared", isShared);
            } else {
                response.put("success", false);
                response.put("message", "수정 권한이 없거나 존재하지 않는 여행코스입니다.");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 여행코스 공유 상태 변경 실패", e);
            response.put("success", false);
            response.put("message", "공유 상태 변경에 실패했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }
} 