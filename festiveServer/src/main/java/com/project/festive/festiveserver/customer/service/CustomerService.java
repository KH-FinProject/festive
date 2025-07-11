package com.project.festive.festiveserver.customer.service;

import com.project.festive.festiveserver.customer.dto.CustomerInquiryDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;

import java.util.List;
import java.util.Map;

public interface CustomerService {
    
    /**
     * 고객센터 문의글 목록 조회 (페이징)
     */
    Map<String, Object> getInquiryList(String searchType, String searchKeyword, 
                                      String status, String category, int page, int size);
    
    /**
     * 고객센터 문의글 상세 조회
     */
    CustomerInquiryDto getInquiryDetail(Long boardNo);
    
    /**
     * 고객센터 문의글 작성
     */
    int createInquiry(CustomerInquiryDto inquiryDto);
    
    /**
     * 고객센터 문의글 수정
     */
    int updateInquiry(CustomerInquiryDto inquiryDto);
    
    /**
     * 고객센터 문의글 삭제
     */
    int deleteInquiry(Long boardNo);
    
    /**
     * 관리자 답변 작성
     */
    int createAnswer(Long boardNo, CommentDto answerDto);
    
    /**
     * 문의 상태 변경 (관리자용)
     */
    int updateInquiryStatus(Long boardNo, String status);
    
    /**
     * 문의 통계 조회 (관리자용)
     */
    Map<String, Object> getInquiryStatistics();
    
    /**
     * 미답변 문의 목록 조회 (관리자용)
     */
    List<CustomerInquiryDto> getUnansweredInquiries();
    
    /**
     * 답변(댓글) 수정
     */
    int updateAnswer(Long boardNo, CommentDto commentDto);
} 