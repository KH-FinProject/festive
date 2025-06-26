package com.project.festive.festiveserver.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private String role;     // "user" 또는 "assistant"
    private String content;  // 메시지 내용
    private String timestamp; // 메시지 시간
} 