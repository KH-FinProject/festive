package com.project.festive.festiveserver.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.project.festive.festiveserver.auth.entity.AuthKey;

@Repository
public interface AuthKeyRepository extends JpaRepository<AuthKey, Long> {

    /**
     * 이메일로 인증키를 조회합니다.
     * @param email 이메일
     * @return 인증키 엔티티
     */
    AuthKey findByEmail(String email);
    
    /**
     * 이메일로 인증키를 업데이트합니다.
     * @param email 이메일
     * @param authKey 인증키
     * @return 업데이트된 행의 수
     */
    @Modifying
    @Query("UPDATE AuthKey a SET a.authKey = :authKey, a.createTime = :createTime WHERE a.email = :email")
    int updateAuthKeyByEmail(@Param("email") String email, @Param("authKey") String authKey, @Param("createTime") String createTime);
    
    /**
     * 이메일로 인증키를 삭제합니다.
     * @param email 이메일
     */
    void deleteByEmail(String email);
}
