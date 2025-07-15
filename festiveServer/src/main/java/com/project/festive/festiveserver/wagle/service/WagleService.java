package com.project.festive.festiveserver.wagle.service;

import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface WagleService {
    
    // 게시글 목록 조회 (페이징)
    Map<String, Object> getBoardList(Long boardTypeNo, String searchType, String searchKeyword, int page, int size);
    
    // 게시글 상세 조회
    BoardDto getBoardDetail(Long boardNo);
    
    // 게시글 작성
    int createBoard(BoardDto boardDto);
    
    // 게시글 수정
    int updateBoard(BoardDto boardDto);
    
    // 게시글 삭제
    int deleteBoard(Long boardNo);
    
    // 게시글 좋아요 토글
    Map<String, Object> toggleBoardLike(Long boardNo, Long memberNo);
    
    // 게시글 좋아요 상태 확인
    boolean checkBoardLike(Long boardNo, Long memberNo);
    
    // 댓글 목록 조회
    List<CommentDto> getCommentList(Long boardNo);
    
    // 댓글 작성
    int createComment(CommentDto commentDto);
    
    // 댓글 수정
    int updateComment(CommentDto commentDto);
    
    // 댓글 삭제
    int deleteComment(Long commentNo);

    // 이미지 경로 조회
    Set<String> selectDbImageSet();
} 