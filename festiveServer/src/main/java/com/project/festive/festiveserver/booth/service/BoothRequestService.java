package com.project.festive.festiveserver.booth.service;

import com.project.festive.festiveserver.booth.dto.BoothRequestDto;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface BoothRequestService {
    void createBoothRequest(BoothRequestDto dto, MultipartFile image);
    List<BoothRequestDto> getAllRequests();
    BoothRequestDto getRequestDetail(Long boothNo);
    void acceptRequest(Long boothNo);
    void rejectRequest(Long boothNo);
} 