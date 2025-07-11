package com.project.festive.festiveserver.auth.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.festive.festiveserver.auth.entity.RefreshToken;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long>  {

	// expirationDate가 특정 시각 이전인 토큰들을 삭제
	int deleteAllByExpirationDateBefore(LocalDateTime now);
}
