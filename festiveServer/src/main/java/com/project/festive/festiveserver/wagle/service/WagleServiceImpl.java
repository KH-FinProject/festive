package com.project.festive.festiveserver.wagle.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;
import com.project.festive.festiveserver.wagle.mapper.WagleMapper;
import com.project.festive.festiveserver.wagle.repository.WagleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class WagleServiceImpl implements WagleService {
    
    private final WagleMapper wagleMapper;
    private final WagleRepository wagleRepository;
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBoardList(Long boardTypeNo, String searchType, String searchKeyword, int page, int size) {
        try {
            int offset = (page - 1) * size;
            
            List<BoardDto> boardList = wagleMapper.selectBoardList(boardTypeNo, searchType, searchKeyword, offset, size);
            int totalCount = wagleMapper.selectBoardCount(boardTypeNo, searchType, searchKeyword);
            int totalPages = (int) Math.ceil((double) totalCount / size);
            
            Map<String, Object> result = new HashMap<>();
            result.put("boardList", boardList);
            result.put("totalCount", totalCount);
            result.put("totalPages", totalPages);
            result.put("currentPage", page);
            result.put("size", size);
            
            return result;
        } catch (Exception e) {
            log.error("게시글 목록 조회 중 오류 발생", e);
            throw new RuntimeException("게시글 목록 조회에 실패했습니다.");
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public BoardDto getBoardDetail(Long boardNo) {
        try {
            wagleMapper.updateBoardViewCount(boardNo);
            BoardDto boardDetail = wagleMapper.selectBoardDetail(boardNo);
            
            if (boardDetail == null) {
                throw new RuntimeException("존재하지 않는 게시글입니다.");
            }
            
            List<String> boardImages = wagleMapper.selectBoardImages(boardNo);
            boardDetail.setBoardImages(boardImages);
            
            return boardDetail;
        } catch (Exception e) {
            log.error("게시글 상세 조회 중 오류 발생: boardNo = {}", boardNo, e);
            throw new RuntimeException("게시글 조회에 실패했습니다.");
        }
    }
    
    @Override
    public int createBoard(BoardDto boardDto) {
        try {
            boardDto.setBoardCreateDate(LocalDateTime.now());
            boardDto.setBoardDeleteYn("N");
            return wagleMapper.insertBoard(boardDto);
        } catch (Exception e) {
            log.error("게시글 작성 중 오류 발생", e);
            throw new RuntimeException("게시글 작성에 실패했습니다.");
        }
    }
    
    @Override
    public int updateBoard(BoardDto boardDto) {
        try {
            boardDto.setBoardUpdateDate(LocalDateTime.now());
            return wagleMapper.updateBoard(boardDto);
        } catch (Exception e) {
            log.error("게시글 수정 중 오류 발생", e);
            throw new RuntimeException("게시글 수정에 실패했습니다.");
        }
    }
    
    @Override
    public int deleteBoard(Long boardNo) {
        try {
            return wagleMapper.deleteBoardLogical(boardNo);
        } catch (Exception e) {
            log.error("게시글 삭제 중 오류 발생", e);
            throw new RuntimeException("게시글 삭제에 실패했습니다.");
        }
    }
    
    @Override
    public Map<String, Object> toggleBoardLike(Long boardNo, Long memberNo) {
        try {
            Map<String, Object> result = new HashMap<>();
            int likeCheck = wagleMapper.selectBoardLikeCheck(boardNo, memberNo);
            
            if (likeCheck > 0) {
                wagleMapper.deleteBoardLike(boardNo, memberNo);
                result.put("action", "unlike");
            } else {
                wagleMapper.insertBoardLike(boardNo, memberNo);
                result.put("action", "like");
            }
            
            // 좋아요 수 조회
            BoardDto boardDetail = wagleMapper.selectBoardDetail(boardNo);
            result.put("likeCount", boardDetail.getBoardLikeCount());
            
            return result;
        } catch (Exception e) {
            log.error("게시글 좋아요 처리 중 오류 발생", e);
            throw new RuntimeException("좋아요 처리에 실패했습니다.");
        }
    }
    
    @Override
    public boolean checkBoardLike(Long boardNo, Long memberNo) {
        try {
            int likeCheck = wagleMapper.selectBoardLikeCheck(boardNo, memberNo);
            return likeCheck > 0;
        } catch (Exception e) {
            log.error("게시글 좋아요 상태 확인 중 오류 발생", e);
            return false;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CommentDto> getCommentList(Long boardNo) {
        try {
            List<CommentDto> allComments = wagleMapper.selectCommentList(boardNo);
            
            List<CommentDto> parentComments = allComments.stream()
                .filter(comment -> comment.getCommentParentNo() == null)
                .collect(Collectors.toList());
            
            for (CommentDto parent : parentComments) {
                List<CommentDto> replies = allComments.stream()
                    .filter(comment -> parent.getCommentNo().equals(comment.getCommentParentNo()))
                    .collect(Collectors.toList());
                parent.setReplies(replies);
            }
            
            return parentComments;
        } catch (Exception e) {
            log.error("댓글 목록 조회 중 오류 발생", e);
            throw new RuntimeException("댓글 조회에 실패했습니다.");
        }
    }
    
    @Override
    public int createComment(CommentDto commentDto) {
        try {
            commentDto.setCommentCreateDate(LocalDateTime.now());
            commentDto.setCommentDeleteYn("N");
            
            int result = wagleMapper.insertComment(commentDto);
            
            return result;
        } catch (Exception e) {
            log.error("댓글 작성 중 오류 발생", e);
            throw new RuntimeException("댓글 작성에 실패했습니다.");
        }
    }
    
    @Override
    public int updateComment(CommentDto commentDto) {
        try {
            commentDto.setCommentUpdateDate(LocalDateTime.now());
            return wagleMapper.updateComment(commentDto);
        } catch (Exception e) {
            log.error("댓글 수정 중 오류 발생", e);
            throw new RuntimeException("댓글 수정에 실패했습니다.");
        }
    }
    
    @Override
    public int deleteComment(Long commentNo) {
        try {
            return wagleMapper.deleteCommentLogical(commentNo);
        } catch (Exception e) {
            log.error("댓글 삭제 중 오류 발생", e);
            throw new RuntimeException("댓글 삭제에 실패했습니다.");
        }
    }

    @Override
    public Set<String> selectDbImageSet() {
        Set<String> fileNames = new HashSet<>();

        // 게시글 내용 조회(MarkDown 형식 List)
        List<String> boardContentList = wagleRepository.findAllBoardContent();

        Pattern pattern = Pattern.compile("!\\[[^\\]]*\\]\\(([^)]+)\\)");
        for (String boardContent : boardContentList) {
            Matcher matcher = pattern.matcher(boardContent);
            
            while (matcher.find()) {
                String url = matcher.group(1);
                // base64 등 data:image로 시작하는 경우는 스킵
                if (url.startsWith("data:")) continue;
                // 파일명만 추출
                String[] parts = url.split("/");
                String fileName = parts[parts.length - 1];
                
                fileNames.add(fileName);
            }
        }
        
        return fileNames;
    }
} 