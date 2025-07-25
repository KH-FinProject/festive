package com.project.festive.festiveserver.common.schuduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.project.festive.festiveserver.auth.service.AuthService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 토큰 및 인증키 관리를 위한 스케줄러
 * 매일 새벽 2시에 만료된 리프레시 토큰과 인증키들을 정리합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthScheduler {

    private final AuthService authService;

    /**
     * 매일 새벽 2시에 만료된 리프레시 토큰들을 삭제합니다.
     * cron 표현식: "0 0 2 * * ?" (매일 새벽 2시)
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupExpiredRefreshTokens() {
        try {
            log.info("만료된 리프레시 토큰 정리 작업을 시작합니다.");
            int deletedCount = authService.deleteExpiredRefreshTokens();
            log.info("만료된 리프레시 토큰 정리 작업이 완료되었습니다. 삭제된 토큰 수: {}", deletedCount);
        } catch (Exception e) {
            log.error("만료된 리프레시 토큰 정리 작업 중 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 매일 새벽 2시 30분에 만료된 인증키들을 삭제합니다.
     * cron 표현식: "0 30 2 * * ?" (매일 새벽 2시 30분)
     */
    @Scheduled(cron = "0 30 2 * * ?")
    public void cleanupExpiredAuthKeys() {
        try {
            log.info("만료된 인증키 정리 작업을 시작합니다.");
            int deletedCount = authService.deleteExpiredAuthKeys();
            log.info("만료된 인증키 정리 작업이 완료되었습니다. 삭제된 인증키 수: {}", deletedCount);
        } catch (Exception e) {
            log.error("만료된 인증키 정리 작업 중 오류가 발생했습니다.", e);
        }
    }
}