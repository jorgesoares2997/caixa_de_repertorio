package com.gigmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GigManagerApplication {

	public static void main(String[] args) {
		SpringApplication.run(GigManagerApplication.class, args);
	}

}
