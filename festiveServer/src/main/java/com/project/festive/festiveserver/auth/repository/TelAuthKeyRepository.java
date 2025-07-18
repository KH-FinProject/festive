package com.project.festive.festiveserver.auth.repository;

import com.project.festive.festiveserver.auth.entity.TelAuthKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface TelAuthKeyRepository extends JpaRepository<TelAuthKey, String> {
	
	/**
	 * 만료된 전화번호 인증키들을 삭제합니다.
	 * @param expirationTime 만료 기준 시간
	 * @return 삭제된 인증키의 개수
	 */
	@Modifying
	@Query("DELETE FROM TelAuthKey t WHERE t.createTime < :expirationTime")
	int deleteAllByCreateTimeBefore(@Param("expirationTime") LocalDateTime expirationTime);
} 