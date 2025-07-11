package com.project.festive.festiveserver.auth.repository;

import com.project.festive.festiveserver.auth.entity.EmailAuthKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailAuthKeyRepository extends JpaRepository<EmailAuthKey, String> {
} 