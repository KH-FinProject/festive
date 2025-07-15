package com.project.festive.festiveserver.common.schuduler;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.project.festive.festiveserver.wagle.service.WagleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ServerImageScheduler {

    private WagleService service;

    @Value("${spring.resources.board-image}")
    private String boardFolderPath;

    @Value("${spring.resources.static-locations}")
    private String profileFolderPath;
    
    @Scheduled(cron = "0 0 3 * * *") // 매일 새벽 3시
    public void cleanupUnusedImages() {
        // 1. DB에서 사용 중인 이미지 파일명 조회 (Set으로 변환)
        Set<String> dbImageSet = service.selectDbImageSet();

        // 2. 서버 폴더 목록 조회
        File[] boardFiles = new File(boardFolderPath).listFiles();
        File[] memberFiles = new File(profileFolderPath).listFiles();

        // Null 체크
        boardFiles = boardFiles != null ? boardFiles : new File[0];
        memberFiles = memberFiles != null ? memberFiles : new File[0];

        // 3. 두 배열 합치기
        List<File> allFiles = new ArrayList<>();
        allFiles.addAll(Arrays.asList(boardFiles));
        allFiles.addAll(Arrays.asList(memberFiles));

        // 서버에 이미지가 없을 경우 종료
        if (allFiles.isEmpty()) return;

        // 4. 비교 및 삭제
        allFiles.stream()
            .filter(file -> !dbImageSet.contains(file.getName()))
            .forEach(file -> {
                log.info("삭제 대상 파일: {}", file.getName());
                if (file.delete()) {
                    log.info("삭제 성공: {}", file.getName());
                } else {
                    log.warn("삭제 실패: {}", file.getName());
                }
            });
    }
}
