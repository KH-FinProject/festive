package com.project.festive.festiveserver.customer.service;

import com.project.festive.festiveserver.customer.dto.CustomerInquiryDto;
import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;
import com.project.festive.festiveserver.wagle.service.WagleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CustomerServiceImpl implements CustomerService {
    
    private final WagleService wagleService;
    
    private static final Long CUSTOMER_BOARD_TYPE = 3L;
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getInquiryList(String searchType, String searchKeyword, 
                                            String status, String category, int page, int size) {
        try {
            // 기본적으로 wagleService를 사용하되, 고객센터 전용 로직 추가
            Map<String, Object> result = wagleService.getBoardList(CUSTOMER_BOARD_TYPE, searchType, searchKeyword, page, size);
            
            // 답변 상태 정보 추가 (향후 확장 가능)
            @SuppressWarnings("unchecked")
            List<BoardDto> boardList = (List<BoardDto>) result.get("boardList");
            
            List<CustomerInquiryDto> inquiryList = boardList.stream()
                .map(this::convertToInquiryDto)
                .collect(Collectors.toList());
            
            result.put("inquiryList", inquiryList);
            result.remove("boardList"); // 기존 boardList 제거
            
            return result;
        } catch (Exception e) {
            log.error("고객센터 문의글 목록 조회 실패", e);
            throw new RuntimeException("문의글 목록 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public CustomerInquiryDto getInquiryDetail(Long boardNo) {
        try {
            BoardDto boardDto = wagleService.getBoardDetail(boardNo);
            if (boardDto == null || !boardDto.getBoardTypeNo().equals(CUSTOMER_BOARD_TYPE)) {
                throw new RuntimeException("해당 문의글을 찾을 수 없습니다.");
            }
            
            CustomerInquiryDto inquiryDto = convertToInquiryDto(boardDto);
            
            // 답변 정보 추가
            List<CommentDto> comments = wagleService.getCommentList(boardNo);
            if (!comments.isEmpty()) {
                CommentDto answer = comments.get(0); // 첫 번째 댓글을 답변으로 간주
                inquiryDto.setHasAnswer(true);
                inquiryDto.setAnswerDate(answer.getCommentCreateDate());
                inquiryDto.setAnswerContent(answer.getCommentContent());
                inquiryDto.setAnswerMemberNo(answer.getMemberNo());
                inquiryDto.setAnswerCommentNo(answer.getCommentNo());
                inquiryDto.setInquiryStatus("답변완료");
            } else {
                inquiryDto.setHasAnswer(false);
                inquiryDto.setInquiryStatus("대기중");
            }
            
            return inquiryDto;
        } catch (Exception e) {
            log.error("고객센터 문의글 상세 조회 실패: boardNo = {}", boardNo, e);
            throw new RuntimeException("문의글 상세 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    public int createInquiry(CustomerInquiryDto inquiryDto) {
        try {
            BoardDto boardDto = convertToBoardDto(inquiryDto);
            boardDto.setBoardTypeNo(CUSTOMER_BOARD_TYPE);

            return wagleService.createBoard(boardDto);
        } catch (Exception e) {
            log.error("고객센터 문의글 작성 실패", e);
            throw new RuntimeException("문의글 작성에 실패했습니다.", e);
        }
    }
    
    @Override
    public int updateInquiry(CustomerInquiryDto inquiryDto) {
        try {
            BoardDto boardDto = convertToBoardDto(inquiryDto);
            return wagleService.updateBoard(boardDto);
        } catch (Exception e) {
            log.error("고객센터 문의글 수정 실패: boardNo = {}", inquiryDto.getBoardNo(), e);
            throw new RuntimeException("문의글 수정에 실패했습니다.", e);
        }
    }
    
    @Override
    public int deleteInquiry(Long boardNo) {
        try {
            return wagleService.deleteBoard(boardNo);
        } catch (Exception e) {
            log.error("고객센터 문의글 삭제 실패: boardNo = {}", boardNo, e);
            throw new RuntimeException("문의글 삭제에 실패했습니다.", e);
        }
    }
    
    @Override
    public int createAnswer(Long boardNo, CommentDto answerDto) {
        try {
            answerDto.setBoardNo(boardNo);
            return wagleService.createComment(answerDto);
        } catch (Exception e) {
            log.error("고객센터 답변 작성 실패: boardNo = {}", boardNo, e);
            throw new RuntimeException("답변 작성에 실패했습니다.", e);
        }
    }
    
    @Override
    public int updateInquiryStatus(Long boardNo, String status) {
        // 향후 BOARD 테이블에 STATUS 컬럼 추가 시 구현
        log.info("문의 상태 변경: boardNo = {}, status = {}", boardNo, status);
        return 1; // 임시 구현
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getInquiryStatistics() {
        try {
            Map<String, Object> result = wagleService.getBoardList(CUSTOMER_BOARD_TYPE, null, null, 1, 1000);
            
            @SuppressWarnings("unchecked")
            List<BoardDto> allInquiries = (List<BoardDto>) result.get("boardList");
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalInquiries", allInquiries.size());
            
            // 답변 상태별 통계 (간단 구현)
            long answeredCount = allInquiries.stream()
                .mapToLong(board -> wagleService.getCommentList(board.getBoardNo()).size() > 0 ? 1L : 0L)
                .sum();
            
            statistics.put("answeredInquiries", answeredCount);
            statistics.put("unansweredInquiries", allInquiries.size() - answeredCount);
            
            return statistics;
        } catch (Exception e) {
            log.error("고객센터 통계 조회 실패", e);
            throw new RuntimeException("통계 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CustomerInquiryDto> getUnansweredInquiries() {
        try {
            Map<String, Object> result = wagleService.getBoardList(CUSTOMER_BOARD_TYPE, null, null, 1, 100);
            
            @SuppressWarnings("unchecked")
            List<BoardDto> allInquiries = (List<BoardDto>) result.get("boardList");
            
            return allInquiries.stream()
                .filter(board -> wagleService.getCommentList(board.getBoardNo()).isEmpty())
                .map(this::convertToInquiryDto)
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("미답변 문의 목록 조회 실패", e);
            throw new RuntimeException("미답변 문의 목록 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    public int updateAnswer(Long boardNo, CommentDto answerDto) {
        answerDto.setBoardNo(boardNo);
        return wagleService.updateComment(answerDto);
    }
    
    // Helper 메서드들
    private CustomerInquiryDto convertToInquiryDto(BoardDto boardDto) {
        CustomerInquiryDto dto = new CustomerInquiryDto();
        dto.setBoardNo(boardDto.getBoardNo());
        dto.setBoardTypeNo(boardDto.getBoardTypeNo());
        dto.setBoardTypeName(boardDto.getBoardTypeName());
        dto.setMemberNo(boardDto.getMemberNo());
        dto.setMemberNickname(boardDto.getMemberNickname());
        dto.setBoardTitle(boardDto.getBoardTitle());
        dto.setBoardContent(boardDto.getBoardContent());
        dto.setBoardViewCount(boardDto.getBoardViewCount());
        dto.setBoardLikeCount(boardDto.getBoardLikeCount());
        dto.setBoardCommentCount(boardDto.getBoardCommentCount());
        dto.setBoardCreateDate(boardDto.getBoardCreateDate());
        dto.setBoardUpdateDate(boardDto.getBoardUpdateDate());
        dto.setBoardDeleteYn(boardDto.getBoardDeleteYn());
        
        // 답변 상태 확인
        List<CommentDto> comments = wagleService.getCommentList(boardDto.getBoardNo());
        if (!comments.isEmpty()) {
            dto.setHasAnswer(true);
            dto.setInquiryStatus("답변완료");
            // 첫 번째 댓글을 답변으로 간주
            CommentDto answer = comments.get(0);
            dto.setAnswerDate(answer.getCommentCreateDate());
            dto.setAnswerContent(answer.getCommentContent());
            dto.setAnswerMemberNo(answer.getMemberNo());
            dto.setAnswerCommentNo(answer.getCommentNo());
        } else {
            dto.setHasAnswer(false);
            dto.setInquiryStatus("대기중");
        }
        
        // 기본값 설정
        dto.setPriority("일반");
        dto.setCategory("기타");
        
        return dto;
    }
    
    private BoardDto convertToBoardDto(CustomerInquiryDto inquiryDto) {
        BoardDto dto = new BoardDto();
        dto.setBoardNo(inquiryDto.getBoardNo());
        dto.setBoardTypeNo(inquiryDto.getBoardTypeNo());
        dto.setMemberNo(inquiryDto.getMemberNo());
        dto.setBoardTitle(inquiryDto.getBoardTitle());
        dto.setBoardContent(inquiryDto.getBoardContent());
        dto.setBoardViewCount(inquiryDto.getBoardViewCount());
        dto.setBoardLikeCount(inquiryDto.getBoardLikeCount());
        dto.setBoardCommentCount(inquiryDto.getBoardCommentCount());
        dto.setBoardCreateDate(inquiryDto.getBoardCreateDate());
        dto.setBoardUpdateDate(inquiryDto.getBoardUpdateDate());
        dto.setBoardDeleteYn(inquiryDto.getBoardDeleteYn());
        
        return dto;
    }
} 