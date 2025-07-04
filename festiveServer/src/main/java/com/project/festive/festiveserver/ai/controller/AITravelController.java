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
@CrossOrigin(origins = "http://localhost:5173")
public class AITravelController {
    
    private final AITravelService aiTravelService;
    private final TourAPIService tourAPIService;
    
    /**
     * AI 여행 추천 채팅 (일반 응답)
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> generateTravelRecommendation(@RequestBody ChatRequest request) {
        log.info("AI 여행 추천 요청: {}", request.getMessage());
        
        try {
            ChatResponse response = aiTravelService.generateTravelRecommendation(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("AI 여행 추천 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * AI 여행 추천 채팅 (스트리밍 응답) - 임시 비활성화
     */
    /*
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> generateTravelRecommendationStream(@RequestBody ChatRequest request) {
        log.info("AI 여행 추천 스트리밍 요청: {}", request.getMessage());
        
        return aiTravelService.generateTravelRecommendationStream(request)
                .onErrorReturn("죄송합니다. 서비스에 일시적인 문제가 발생했습니다.");
    }
    */
    
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
            log.info("장소 이미지 요청 - contentId: {}", contentId);
            
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
            log.info("📝 장소 상세 정보 요청 - contentId: {}", contentId);
            
            // detailCommon2 API 호출
            var detailInfo = tourAPIService.fetchDetailCommon2(contentId);
            
            Map<String, Object> response = new HashMap<>();
            
            // 상세 로그 추가
            log.info("📝 detailCommon2 호출 결과: {}", detailInfo != null ? "성공" : "실패");
            if (detailInfo != null) {
                log.info("📝 detailInfo 분석 - title: {}, overview: {}, overview 길이: {}", 
                        detailInfo.getTitle(),
                        detailInfo.getOverview() != null ? "존재" : "null",
                        detailInfo.getOverview() != null ? detailInfo.getOverview().length() : 0);
            }
            
            if (detailInfo != null && detailInfo.getOverview() != null && 
                !detailInfo.getOverview().trim().isEmpty()) {
                response.put("success", true);
                response.put("overview", detailInfo.getOverview().trim());
                response.put("placeName", detailInfo.getTitle());
                log.info("✅ 상세 정보 조회 성공 - contentId: {}, overview 길이: {}", 
                        contentId, detailInfo.getOverview().trim().length());
            } else {
                response.put("success", false);
                response.put("message", "상세 정보가 없어 AI 설명을 사용합니다.");
                response.put("overview", "");
                log.info("⚠️ 상세 정보 없음 - contentId: {}, fallback 사용 (detailInfo: {})", 
                        contentId, detailInfo != null ? "존재하지만 overview 없음" : "null");
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