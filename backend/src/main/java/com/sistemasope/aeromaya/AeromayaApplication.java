package com.sistemasope.aeromaya;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AeromayaApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure().directory("../").ignoreIfMissing().load();
        dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));
		SpringApplication.run(AeromayaApplication.class, args);
	}

}
