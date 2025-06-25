package com.project.festive.festiveserver.websocket.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebsocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws") // 관리자 프론트가 여기에 연결
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    // @Override
    // public void configureMessageBroker(MessageBrokerRegistry registry) {
    //     registry.enableSimpleBroker("/topic"); // ex) /topic/alerts
    //     registry.setApplicationDestinationPrefixes("/app");
    // }
}
