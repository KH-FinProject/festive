package com.project.festive.festiveserver.detail.model.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.detail.model.dto.FavoritesDto;
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
			System.out.println("currFavorite 거짓일때 DB에 insert: " + currFavorite);
			checkResult = mapper.deleteFavorite(favorites);
			result = -1;
		} else {
			System.out.println("currFavorite 참일때 delete : " + currFavorite);
			checkResult = mapper.insertFavorite(favorites);
			result = 1;
		}
		
		return result;
	}


}
