package com.project.festive.festiveserver.wagle.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.project.festive.festiveserver.wagle.entity.Board;

@Repository
public interface WagleRepository extends JpaRepository<Board, Long> {

    @Query("SELECT b.boardContent FROM Board b")
    public List<String> findAllBoardContent();
    
}
