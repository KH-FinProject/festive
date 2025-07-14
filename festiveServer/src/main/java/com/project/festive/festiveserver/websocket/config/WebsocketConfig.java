package com.project.festive.festiveserver.websocket.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebsocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                    "http://localhost:5173", 
                    "http://localhost:3000",
                    "http://127.0.0.1:5173",
                    "https://www.festivekorea.site",
                    "https://festivekorea.site",
                    "https://api.festivekorea.site"
                )
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 심플 브로커 활성화
        registry.enableSimpleBroker("/topic");
        // 애플리케이션 목적지 접두사
        registry.setApplicationDestinationPrefixes("/app");
    }
}