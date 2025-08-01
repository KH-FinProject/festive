package com.project.festive.festiveserver.customer.controller;

import com.project.festive.festiveserver.customer.dto.CustomerInquiryDto;
import com.project.festive.festiveserver.customer.service.CustomerService;
import com.project.festive.festiveserver.wagle.dto.CommentDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {
    
    private final CustomerService customerService;
    
    /**
     * 고객센터 게시글 목록 조회 (페이징)
     */
    @GetMapping("/boards")
    public ResponseEntity<Map<String, Object>> getCustomerBoardList(
            @RequestParam(value = "searchType", required = false) String searchType,
            @RequestParam(value = "searchKeyword", required = false) String searchKeyword,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "7") int size) {
        
        try {
            Map<String, Object> result = customerService.getInquiryList(searchType, searchKeyword, status, category, page, size);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("고객센터 게시글 목록 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 고객센터 게시글 상세 조회
     */
    @GetMapping("/boards/{boardNo}")
    public ResponseEntity<CustomerInquiryDto> getCustomerBoardDetail(@PathVariable("boardNo") Long boardNo) {
        try {
            CustomerInquiryDto inquiryDetail = customerService.getInquiryDetail(boardNo);
            return ResponseEntity.ok(inquiryDetail);
        } catch (Exception e) {
            log.error("고객센터 게시글 상세 조회 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 고객센터 문의글 작성
     */
    @PostMapping("/boards")
    public ResponseEntity<String> createCustomerBoard(Authentication authentication, @RequestBody CustomerInquiryDto inquiryDto) {
        try {
            // 안전한 인증 정보 추출
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(401).body("인증 정보가 없습니다.");
            }
            
            Object principal = authentication.getPrincipal();
            if (!(principal instanceof CustomUserDetails)) {
                log.error("인증 정보 타입 오류: {}", principal.getClass().getName());
                return ResponseEntity.status(401).body("유효하지 않은 인증 정보입니다.");
            }
            
            CustomUserDetails userDetails = (CustomUserDetails) principal;
            Long memberNo = userDetails.getMemberNo();
            
            inquiryDto.setMemberNo(memberNo);
            int result = customerService.createInquiry(inquiryDto);
            if (result > 0) {
                return ResponseEntity.ok("문의글이 작성되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("문의글 작성에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("고객센터 문의글 작성 실패", e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    /**
     * 고객센터 문의글 수정
     */
    @PutMapping("/boards/{boardNo}")
    public ResponseEntity<String> updateCustomerBoard(@PathVariable("boardNo") Long boardNo, @RequestBody CustomerInquiryDto inquiryDto) {
        try {
            inquiryDto.setBoardNo(boardNo);
            
            int result = customerService.updateInquiry(inquiryDto);
            if (result > 0) {
                return ResponseEntity.ok("문의글이 수정되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("문의글 수정에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("고객센터 문의글 수정 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    /**
     * 고객센터 문의글 삭제
     */
    @DeleteMapping("/boards/{boardNo}")
    public ResponseEntity<String> deleteCustomerBoard(@PathVariable("boardNo") Long boardNo) {
        try {
            int result = customerService.deleteInquiry(boardNo);
            if (result > 0) {
                return ResponseEntity.ok("문의글이 삭제되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("문의글 삭제에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("고객센터 문의글 삭제 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    /**
     * 고객센터 댓글 목록 조회 (고객센터는 일반적으로 댓글 기능이 제한적)
     */
    @GetMapping("/boards/{boardNo}/comments")
    public ResponseEntity<List<CommentDto>> getCustomerCommentList(@PathVariable("boardNo") Long boardNo) {
        try {
            // 고객센터 문의글의 댓글(답변) 목록 조회
            // CustomerService의 getInquiryDetail을 통해 고객센터 게시글인지 확인
            CustomerInquiryDto inquiry = customerService.getInquiryDetail(boardNo);
            
            // 실제 댓글 목록은 CustomerServiceImpl에서 처리하므로 여기서는 간단히 구현
            // 향후 CustomerService에 getCommentList 메서드 추가 필요
            return ResponseEntity.ok(List.of()); // 임시로 빈 리스트 반환
        } catch (Exception e) {
            log.error("고객센터 댓글 목록 조회 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 고객센터 답변 작성 (관리자용)
     */
    @PostMapping("/boards/{boardNo}/comments")
    public ResponseEntity<String> createCustomerComment(Authentication authentication, @PathVariable("boardNo") Long boardNo, @RequestBody CommentDto commentDto) {
        try {
            // 관리자 권한 확인 로직 추가 (생략)
            // 로그인 사용자 정보에서 memberNo 가져오기
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(401).body("인증 정보가 없습니다.");
            }
            Object principal = authentication.getPrincipal();
            if (!(principal instanceof CustomUserDetails)) {
                log.error("인증 정보 타입 오류: {}", principal.getClass().getName());
                return ResponseEntity.status(401).body("유효하지 않은 인증 정보입니다.");
            }
            CustomUserDetails userDetails = (CustomUserDetails) principal;
            Long memberNo = userDetails.getMemberNo();
            commentDto.setMemberNo(memberNo); // 인증된 관리자 memberNo로 설정

            int result = customerService.createAnswer(boardNo, commentDto);
            if (result > 0) {
                return ResponseEntity.ok("답변이 작성되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("답변 작성에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("고객센터 답변 작성 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    /**
     * 고객센터 답변 수정 (관리자용)
     */
    @PutMapping("/boards/{boardNo}/comments/{commentNo}")
    public ResponseEntity<String> updateCustomerComment(@PathVariable("boardNo") Long boardNo, @PathVariable("commentNo") Long commentNo, @RequestBody CommentDto commentDto) {
        try {
            // 인증/권한 체크 생략(필요시 추가)
            commentDto.setCommentNo(commentNo);
            int result = customerService.updateAnswer(boardNo, commentDto);
            if (result > 0) {
                return ResponseEntity.ok("답변이 수정되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("답변 수정에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("고객센터 답변 수정 실패: boardNo = {}, commentNo = {}", boardNo, commentNo, e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    /**
     * 고객센터 통계 조회 (관리자용)
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getCustomerStatistics() {
        try {
            Map<String, Object> statistics = customerService.getInquiryStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("고객센터 통계 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 미답변 문의 목록 조회 (관리자용)
     */
    @GetMapping("/unanswered")
    public ResponseEntity<List<CustomerInquiryDto>> getUnansweredInquiries() {
        try {
            List<CustomerInquiryDto> unansweredList = customerService.getUnansweredInquiries();
            return ResponseEntity.ok(unansweredList);
        } catch (Exception e) {
            log.error("미답변 문의 목록 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 문의 상태 변경 (관리자용)
     */
    @PatchMapping("/boards/{boardNo}/status")
    public ResponseEntity<String> updateInquiryStatus(@PathVariable("boardNo") Long boardNo, @RequestParam("status") String status) {
        try {
            int result = customerService.updateInquiryStatus(boardNo, status);
            if (result > 0) {
                return ResponseEntity.ok("문의 상태가 변경되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("상태 변경에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("문의 상태 변경 실패: boardNo = {}, status = {}", boardNo, status, e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
} 