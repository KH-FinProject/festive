package com.project.festive.festiveserver.booth.controller;

import com.project.festive.festiveserver.booth.dto.BoothRequestDto;
import com.project.festive.festiveserver.booth.service.BoothRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/booth")
@RequiredArgsConstructor
public class BoothRequestController {
    private final BoothRequestService boothRequestService;

    @PostMapping("/request")
    public ResponseEntity<?> createBoothRequest(
            @ModelAttribute BoothRequestDto dto,
            @RequestParam("image") MultipartFile image) {
        System.out.println("=== 부스 신청 요청 도착 ===");
        try {
            boothRequestService.createBoothRequest(dto, image);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace(); // 반드시 콘솔에 출력
            return ResponseEntity.status(500).body("에러: " + e.getMessage());
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<List<BoothRequestDto>> getAllRequests() {
        List<BoothRequestDto> list = boothRequestService.getAllRequests();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/request/{boothNo}")
    public ResponseEntity<BoothRequestDto> getRequestDetail(@PathVariable Long boothNo) {
        BoothRequestDto dto = boothRequestService.getRequestDetail(boothNo);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/request/{boothNo}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable Long boothNo) {
        boothRequestService.acceptRequest(boothNo);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/request/{boothNo}")
    public ResponseEntity<?> rejectRequest(@PathVariable Long boothNo) {
        boothRequestService.rejectRequest(boothNo);
        return ResponseEntity.ok().build();
    }
} 