package com.project.festive.festiveserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FestiveServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(FestiveServerApplication.class, args);
	}

}
