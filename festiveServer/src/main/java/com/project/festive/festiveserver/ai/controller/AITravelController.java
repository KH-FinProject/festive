package com.project.festive.festiveserver.ai.controller;

import com.project.festive.festiveserver.ai.dto.ChatRequest;
import com.project.festive.festiveserver.ai.dto.ChatResponse;
import com.project.festive.festiveserver.ai.service.AITravelService;
import com.project.festive.festiveserver.ai.service.TourAPIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// import reactor.core.publisher.Flux;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AITravelController {
    
    private final AITravelService aiTravelService;
    private final TourAPIService tourAPIService;
    
    /**
     * AI 여행 추천 채팅 (일반 응답)
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> generateTravelRecommendation(@RequestBody ChatRequest request) {
        
        try {
            ChatResponse response = aiTravelService.generateTravelRecommendation(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("AI 여행 추천 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // SSE 스트리밍 기능은 제거됨
    
    // TourAPI 관련 엔드포인트 제거 - 프론트엔드에서 직접 처리
    
    /**
     * 상태 확인
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("AI Travel Service is running!");
    }
    
    // TourApiRequest DTO 제거 - 더 이상 필요하지 않음
    
    /**
     * 장소의 상세 이미지들을 가져오는 API
     */
    @GetMapping("/place-images/{contentId}")
    public ResponseEntity<Map<String, Object>> getPlaceImages(@PathVariable String contentId) {
        try {
            
            List<Map<String, Object>> images = tourAPIService.getPlaceImages(contentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("images", images);
            response.put("count", images.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("장소 이미지 조회 실패 - contentId: {}, error: {}", contentId, e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "이미지를 불러올 수 없습니다.");
            errorResponse.put("images", new ArrayList<>());
            
            return ResponseEntity.ok(errorResponse);
        }
    }
    
    /**
     * 장소의 상세 정보(overview)를 가져오는 API
     */
    @GetMapping("/place-overview/{contentId}")
    public ResponseEntity<Map<String, Object>> getPlaceOverview(@PathVariable String contentId) {
        try {
            
            // detailCommon2 API 호출
            var detailInfo = tourAPIService.fetchDetailCommon2(contentId);
            
            Map<String, Object> response = new HashMap<>();
            
            // 상세 로그 추가
            if (detailInfo != null) {
                // 로그 제거됨
            }
            
            if (detailInfo != null && detailInfo.getOverview() != null && 
                !detailInfo.getOverview().trim().isEmpty()) {
                response.put("success", true);
                response.put("overview", detailInfo.getOverview().trim());
                response.put("placeName", detailInfo.getTitle());
            } else {
                response.put("success", false);
                response.put("message", "상세 정보가 없어 AI 설명을 사용합니다.");
                response.put("overview", "");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 장소 상세 정보 조회 실패 - contentId: {}, error: {}", contentId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "상세 정보를 불러올 수 없습니다.");
            errorResponse.put("overview", "");
            
            return ResponseEntity.ok(errorResponse);
        }
    }
} 