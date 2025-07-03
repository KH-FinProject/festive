package com.project.festive.festiveserver.ai.service;

import com.project.festive.festiveserver.ai.dto.ChatRequest;
import com.project.festive.festiveserver.ai.dto.ChatResponse;
// TourApiRequest import 제거 - 프론트엔드에서 직접 처리
// import reactor.core.publisher.Flux;
import java.util.List;
import java.util.Map;

public interface AITravelService {
    
    /**
     * AI 여행 추천 채팅 (일반 응답)
     */
    ChatResponse generateTravelRecommendation(ChatRequest request);
    
    /**
     * AI 여행 추천 채팅 (스트리밍 응답) - 임시 비활성화
     */
    // Flux<String> generateTravelRecommendationStream(ChatRequest request);
    
    /**
     * 위치 정보 추출
     */
    ChatResponse.LocationInfo extractLocationInfo(String content);
    
    // TourAPI 관련 메서드들 제거 - 프론트엔드에서 직접 처리
} 