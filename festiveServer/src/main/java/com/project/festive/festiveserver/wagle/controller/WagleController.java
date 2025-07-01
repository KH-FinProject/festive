package com.project.festive.festiveserver.wagle.controller;

import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;
import com.project.festive.festiveserver.wagle.service.WagleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wagle")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@Slf4j
public class WagleController {
    
    private final WagleService wagleService;
    
    /**
     * 게시글 목록 조회 (페이징)
     */
    @GetMapping("/boards")
    public ResponseEntity<Map<String, Object>> getBoardList(
            @RequestParam(value = "boardTypeNo", defaultValue = "1") Long boardTypeNo,
            @RequestParam(value = "searchType", required = false) String searchType,
            @RequestParam(value = "searchKeyword", required = false) String searchKeyword,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "7") int size) {
        
        try {
            Map<String, Object> result = wagleService.getBoardList(boardTypeNo, searchType, searchKeyword, page, size);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("게시글 목록 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 게시글 상세 조회
     */
    @GetMapping("/boards/{boardNo}")
    public ResponseEntity<BoardDto> getBoardDetail(@PathVariable("boardNo") Long boardNo) {
        try {
            BoardDto boardDetail = wagleService.getBoardDetail(boardNo);
            return ResponseEntity.ok(boardDetail);
        } catch (Exception e) {
            log.error("게시글 상세 조회 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 게시글 작성
     */
    @PostMapping("/boards")
    public ResponseEntity<String> createBoard(@RequestBody BoardDto boardDto) {
        try {
            // 안전한 인증 정보 추출
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
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
            
            boardDto.setMemberNo(memberNo);
            // boardTypeNo가 없으면 기본값 1(일반 게시판)로 설정
            if (boardDto.getBoardTypeNo() == null) {
                boardDto.setBoardTypeNo(1L);
            }
            int result = wagleService.createBoard(boardDto);
            if (result > 0) {
                return ResponseEntity.ok("게시글이 작성되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("게시글 작성에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("게시글 작성 실패", e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    /**
     * 게시글 수정
     */
    @PutMapping("/boards/{boardNo}")
    public ResponseEntity<String> updateBoard(@PathVariable("boardNo") Long boardNo, @RequestBody BoardDto boardDto) {
        try {
            boardDto.setBoardNo(boardNo);
            int result = wagleService.updateBoard(boardDto);
            if (result > 0) {
                return ResponseEntity.ok("게시글이 수정되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("게시글 수정에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("게시글 수정 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    /**
     * 게시글 삭제
     */
    @DeleteMapping("/boards/{boardNo}")
    public ResponseEntity<String> deleteBoard(@PathVariable("boardNo") Long boardNo) {
        try {
            int result = wagleService.deleteBoard(boardNo);
            if (result > 0) {
                return ResponseEntity.ok("게시글이 삭제되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("게시글 삭제에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("게시글 삭제 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    /**
     * 게시글 좋아요 토글
     */
    @PostMapping("/boards/{boardNo}/like")
    public ResponseEntity<Map<String, Object>> toggleBoardLike(@PathVariable("boardNo") Long boardNo) {
        try {
            // 안전한 인증 정보 추출
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(401).build();
            }
            
            Object principal = authentication.getPrincipal();
            if (!(principal instanceof CustomUserDetails)) {
                log.error("인증 정보 타입 오류: {}", principal.getClass().getName());
                return ResponseEntity.status(401).build();
            }
            
            CustomUserDetails userDetails = (CustomUserDetails) principal;
            Long memberNo = userDetails.getMemberNo();
            
            Map<String, Object> result = wagleService.toggleBoardLike(boardNo, memberNo);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("게시글 좋아요 처리 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 게시글 좋아요 상태 확인
     */
    @GetMapping("/boards/{boardNo}/like/check")
    public ResponseEntity<Map<String, Object>> checkBoardLike(@PathVariable("boardNo") Long boardNo) {
        try {
            // 안전한 인증 정보 추출
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(401).build();
            }
            
            Object principal = authentication.getPrincipal();
            if (!(principal instanceof CustomUserDetails)) {
                log.error("인증 정보 타입 오류: {}", principal.getClass().getName());
                return ResponseEntity.status(401).build();
            }
            
            CustomUserDetails userDetails = (CustomUserDetails) principal;
            Long memberNo = userDetails.getMemberNo();
            
            boolean liked = wagleService.checkBoardLike(boardNo, memberNo);
            Map<String, Object> result = Map.of("liked", liked);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("게시글 좋아요 상태 확인 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 댓글 목록 조회
     */
    @GetMapping("/boards/{boardNo}/comments")
    public ResponseEntity<List<CommentDto>> getCommentList(@PathVariable("boardNo") Long boardNo) {
        try {
            List<CommentDto> comments = wagleService.getCommentList(boardNo);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            log.error("댓글 목록 조회 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 댓글 작성
     */
    @PostMapping("/boards/{boardNo}/comments")
    public ResponseEntity<String> createComment(@PathVariable("boardNo") Long boardNo, @RequestBody CommentDto commentDto) {
        try {
            // 안전한 인증 정보 추출
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
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
            
            commentDto.setMemberNo(memberNo);
            commentDto.setBoardNo(boardNo);
            int result = wagleService.createComment(commentDto);
            if (result > 0) {
                return ResponseEntity.ok("댓글이 작성되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("댓글 작성에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("댓글 작성 실패: boardNo = {}", boardNo, e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    /**
     * 댓글 수정
     */
    @PutMapping("/comments/{commentNo}")
    public ResponseEntity<String> updateComment(@PathVariable("commentNo") Long commentNo, @RequestBody CommentDto commentDto) {
        try {
            commentDto.setCommentNo(commentNo);
            int result = wagleService.updateComment(commentDto);
            if (result > 0) {
                return ResponseEntity.ok("댓글이 수정되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("댓글 수정에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("댓글 수정 실패: commentNo = {}", commentNo, e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
    
    /**
     * 댓글 삭제
     */
    @DeleteMapping("/comments/{commentNo}")
    public ResponseEntity<String> deleteComment(@PathVariable("commentNo") Long commentNo) {
        try {
            int result = wagleService.deleteComment(commentNo);
            if (result > 0) {
                return ResponseEntity.ok("댓글이 삭제되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("댓글 삭제에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("댓글 삭제 실패: commentNo = {}", commentNo, e);
            return ResponseEntity.internalServerError().body("서버 오류가 발생했습니다.");
        }
    }
} 