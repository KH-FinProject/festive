package com.project.festive.festiveserver.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    private String message;           // 사용자 메시지
    private String region;           // 지역 정보 (선택사항)
    private List<ChatMessage> history; // 대화 기록
} 