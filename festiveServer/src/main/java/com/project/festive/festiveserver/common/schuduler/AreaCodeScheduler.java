package com.project.festive.festiveserver.common.schuduler;

import com.project.festive.festiveserver.area.service.AreaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AreaCodeScheduler {
    
    private final AreaService areaService;
    
    // 매주 새벽 2시에 실행 (지역코드 업데이트)
    @Scheduled(cron = "0 0 2 * * 1")
    public void updateAreaCode() {
        log.info("지역코드 스케줄러 실행 시작");
        try {
            areaService.updateAreaCodes();
            log.info("지역코드 스케줄러 실행 완료");
        } catch (Exception e) {
            log.error("지역코드 스케줄러 실행 중 오류 발생", e);
        }
    }
    
    // 매주 새벽 3시에 실행 (시군구코드 업데이트)
    @Scheduled(cron = "0 0 3 * * 1")
    public void updateSigunguCode() {
        log.info("시군구코드 스케줄러 실행 시작");
        try {
            areaService.updateSigunguCodes();
            log.info("시군구코드 스케줄러 실행 완료");
        } catch (Exception e) {
            log.error("시군구코드 스케줄러 실행 중 오류 발생", e);
        }
    }
}
