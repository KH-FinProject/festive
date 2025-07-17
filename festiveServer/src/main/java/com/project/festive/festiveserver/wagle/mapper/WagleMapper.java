package com.project.festive.festiveserver.wagle.mapper;

import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Mapper
public interface WagleMapper {
    
    // 게시글 목록 조회 (페이징)
    List<BoardDto> selectBoardList(@Param("boardTypeNo") Long boardTypeNo,
                                  @Param("searchType") String searchType,
                                  @Param("searchKeyword") String searchKeyword,
                                  @Param("offset") int offset,
                                  @Param("limit") int limit);
    
    // 게시글 총 개수 조회
    int selectBoardCount(@Param("boardTypeNo") Long boardTypeNo,
                        @Param("searchType") String searchType,
                        @Param("searchKeyword") String searchKeyword);
    
    // 게시글 상세 조회
    BoardDto selectBoardDetail(@Param("boardNo") Long boardNo);
    
    // 게시글 조회수 증가
    void updateBoardViewCount(@Param("boardNo") Long boardNo);
    
    // 게시글 작성
    int insertBoard(BoardDto boardDto);
    
    // 게시글 수정
    int updateBoard(BoardDto boardDto);
    
    // 게시글 삭제 (논리삭제)
    int deleteBoardLogical(@Param("boardNo") Long boardNo);
    
    // 게시글 좋아요 추가
    int insertBoardLike(@Param("boardNo") Long boardNo, @Param("memberNo") Long memberNo);
    
    // 게시글 좋아요 삭제
    int deleteBoardLike(@Param("boardNo") Long boardNo, @Param("memberNo") Long memberNo);
    
    // 게시글 좋아요 여부 확인
    int selectBoardLikeCheck(@Param("boardNo") Long boardNo, @Param("memberNo") Long memberNo);
    
    // 게시글 좋아요 수 업데이트
    void updateBoardLikeCount(@Param("boardNo") Long boardNo);
    
    // 댓글 목록 조회
    List<CommentDto> selectCommentList(@Param("boardNo") Long boardNo);
    
    // 댓글 작성
    int insertComment(CommentDto commentDto);
    
    // 댓글 수정
    int updateComment(CommentDto commentDto);
    
    // 댓글 삭제 (논리삭제)
    int deleteCommentLogical(@Param("commentNo") Long commentNo);
    
    // 게시글 댓글 수 업데이트
    void updateBoardCommentCount(@Param("boardNo") Long boardNo);
} 