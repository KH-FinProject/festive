package com.project.festive.festiveserver.booth.mapper;

import com.project.festive.festiveserver.booth.entity.BoothRequest;
import com.project.festive.festiveserver.booth.entity.BoothImg;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface BoothRequestMapper {
    void insertBoothRequest(BoothRequest boothRequest);
    void insertBoothImg(BoothImg boothImg);
    List<BoothRequest> selectAllRequests();
    BoothRequest selectRequestDetail(Long boothNo);
    BoothImg selectBoothImg(Long boothNo);
    void updateAccept(Long boothNo);
    void deleteRequest(Long boothNo);
    void deleteBoothImg(Long boothNo);
} 