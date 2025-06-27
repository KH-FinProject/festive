package com.project.festive.festiveserver.ai.controller;

import com.project.festive.festiveserver.ai.dto.ChatRequest;
import com.project.festive.festiveserver.ai.dto.ChatResponse;
import com.project.festive.festiveserver.ai.service.AITravelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
public class AITravelController {
    
    private final AITravelService aiTravelService;
    
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
} 