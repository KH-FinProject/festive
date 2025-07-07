package com.project.festive.festiveserver.auth.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EMAIL_AUTH_KEY")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailAuthKey {
    @Id
    @Column(name = "EMAIL", nullable = false, unique = true)
    private String email;

    @Column(name = "AUTH_KEY", nullable = false)
    private String authKey;

    @Column(name = "CREATE_TIME", nullable = false)
    private LocalDateTime createTime;
}
