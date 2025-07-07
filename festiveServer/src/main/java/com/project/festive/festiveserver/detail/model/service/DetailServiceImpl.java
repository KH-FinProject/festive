package com.project.festive.festiveserver.detail.model.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.booth.dto.BoothRequestDto;
import com.project.festive.festiveserver.detail.model.dto.FavoritesDto;
import com.project.festive.festiveserver.detail.model.dto.LikesDto;
import com.project.festive.festiveserver.detail.model.mapper.DetailMapper;

@Service
@Transactional(rollbackFor = Exception.class)
public class DetailServiceImpl implements DetailService{
	
	@Autowired
	private DetailMapper mapper;

	// 현재 찜 상태 확인
	@Override
	public boolean selectFavorite(long memberNo, String contentId) {
		
		boolean result = false;
		int checkFavorite = mapper.selectFavorite(memberNo, contentId);
		
		if (checkFavorite > 0) {
			result = true;
		}
		
		return result;
	}
	
	// 찜 상태 변경하기(찜하기 / 해제)
	@Override
	public int changeFavorite(FavoritesDto favorites) {
		int result = 0;
		int checkResult = 0;
		boolean currFavorite = favorites.isCurrFavorite();
		
		if(currFavorite) {
			System.out.println("currFavorite true DB에 insert: " + currFavorite);
			checkResult = mapper.deleteFavorite(favorites);
			result = -1;
		} else {
			System.out.println("currFavorite false delete : " + currFavorite);
			checkResult = mapper.insertFavorite(favorites);
			result = 1;
		}
		
		return result;
	}

	// 좋아요 갯수 가져오기
	@Override
	public int selectLikes(String contentId) {
		System.out.println("contentId : " + contentId);
		return mapper.selectLikes(contentId);
	}
	
	// 좋아요 상태 변경
	@Override
	public int changeLikes(LikesDto likes) {
		
		int result = 0;
		int checkResult = 0;
		boolean currLike = likes.isCurrLike();
		
		if(currLike) {
			System.out.println("currLike true 일때 DB에 delete: " + currLike);
			checkResult = mapper.deleteLike(likes);
			System.out.println("checkResult : " + checkResult);
			result = -1;
		} else {
			System.out.println("currLike false 일때 DB에 insert : " + currLike);
			checkResult = mapper.insertLike(likes);
			System.out.println("checkResult : " + checkResult);
			result = 1;
		}
		
		return result;
	}

	// 참여부스 리스트 받아오기
	@Override
	public List<BoothRequestDto> selectBoothList(String contentId) {
		List<BoothRequestDto> boothList = mapper.selectBoothList(contentId);
		return boothList;
	}


}
