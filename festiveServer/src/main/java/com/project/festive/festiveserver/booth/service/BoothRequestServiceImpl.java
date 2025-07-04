package com.project.festive.festiveserver.booth.service;

import com.project.festive.festiveserver.booth.dto.BoothRequestDto;
import com.project.festive.festiveserver.booth.entity.BoothRequest;
import com.project.festive.festiveserver.booth.mapper.BoothRequestMapper;
import com.project.festive.festiveserver.ai.service.TourAPIService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoothRequestServiceImpl implements BoothRequestService {
    private final BoothRequestMapper boothRequestMapper;
    private final TourAPIService tourAPIService;
    // 실제 파일 저장 경로는 절대경로로 지정
    private static final String UPLOAD_DIR = "C:/upload/festive/booth/";

    @Override
    public void createBoothRequest(BoothRequestDto dto, MultipartFile image) {
        BoothRequest entity = new BoothRequest();
        entity.setMemberNo(dto.getMemberNo());
        entity.setContentId(dto.getContentId());
        entity.setApplicantName(dto.getApplicantName());
        entity.setApplicantCompany(dto.getApplicantCompany());
        entity.setBoothStartDate(dto.getBoothStartDate());
        entity.setBoothEndDate(dto.getBoothEndDate());
        entity.setBoothTel(dto.getBoothTel());
        entity.setProducts(dto.getProducts());
        entity.setBoothType(dto.getBoothType());
        entity.setBoothAccept("N");
        entity.setContentTitle(dto.getContentTitle()); // 축제명 저장
        // 이미지 저장
        if (image != null && !image.isEmpty()) {
            try {
                File dir = new File(UPLOAD_DIR);
                if (!dir.exists()) dir.mkdirs();
                String ext = "";
                String originalName = image.getOriginalFilename();
                int dotIdx = originalName != null ? originalName.lastIndexOf('.') : -1;
                if (dotIdx > -1) ext = originalName.substring(dotIdx);
                String fileName = UUID.randomUUID().toString() + ext;
                File dest = new File(dir, fileName);
                image.transferTo(dest);
                // DB에는 상대경로로 저장 (프론트에서 접근 가능하도록)
                entity.setBoothImg("/upload/festive/booth/" + fileName);
            } catch (IOException e) {
                throw new RuntimeException("이미지 저장 실패", e);
            }
        }
        boothRequestMapper.insertBoothRequest(entity);
    }

    @Override
    public List<BoothRequestDto> getAllRequests() {
        List<BoothRequest> list = boothRequestMapper.selectAllRequests();
        List<BoothRequestDto> result = new ArrayList<>();
        for (BoothRequest entity : list) {
            BoothRequestDto dto = new BoothRequestDto();
            dto.setBoothNo(entity.getBoothNo());
            dto.setMemberNo(entity.getMemberNo());
            dto.setContentId(entity.getContentId());
            dto.setApplicantName(entity.getApplicantName());
            dto.setApplicantCompany(entity.getApplicantCompany());
            dto.setBoothStartDate(entity.getBoothStartDate());
            dto.setBoothEndDate(entity.getBoothEndDate());
            dto.setBoothTel(entity.getBoothTel());
            dto.setProducts(entity.getProducts());
            dto.setBoothImg(entity.getBoothImg());
            dto.setBoothType(entity.getBoothType());
            dto.setBoothAccept(entity.getBoothAccept());
            dto.setContentTitle(entity.getContentTitle()); // 축제명 포함
            result.add(dto);
        }
        return result;
    }

    @Override
    public BoothRequestDto getRequestDetail(Long boothNo) {
        BoothRequest entity = boothRequestMapper.selectRequestDetail(boothNo);
        if (entity == null) return null;
        BoothRequestDto dto = new BoothRequestDto();
        dto.setBoothNo(entity.getBoothNo());
        dto.setMemberNo(entity.getMemberNo());
        dto.setContentId(entity.getContentId());
        dto.setApplicantName(entity.getApplicantName());
        dto.setApplicantCompany(entity.getApplicantCompany());
        dto.setBoothStartDate(entity.getBoothStartDate());
        dto.setBoothEndDate(entity.getBoothEndDate());
        dto.setBoothTel(entity.getBoothTel());
        dto.setProducts(entity.getProducts());
        dto.setBoothImg(entity.getBoothImg());
        dto.setBoothType(entity.getBoothType());
        dto.setBoothAccept(entity.getBoothAccept());
        dto.setContentTitle(entity.getContentTitle()); // 축제명 포함
        return dto;
    }

    @Override
    public void acceptRequest(Long boothNo) {
        boothRequestMapper.updateAccept(boothNo);
    }

    @Override
    public void rejectRequest(Long boothNo) {
        boothRequestMapper.deleteRequest(boothNo);
    }
} 