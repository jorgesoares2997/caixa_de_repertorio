package com.gigmanager.config;

import com.gigmanager.domain.AppUser;
import com.gigmanager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final UserRepository userRepository;

    public DataInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        // Ensure the single admin user exists in database with requested credentials
        if (userRepository.findByUsernameIgnoreCase("jorgeadmin123").isEmpty()) {
            AppUser admin = AppUser.builder()
                    .username("jorgeadmin123")
                    .password("87594291")
                    .role("ADMIN")
                    .name("Jorge Soares")
                    .build();
            userRepository.save(admin);
            log.info(">>> [DataInitializer] Admin user 'jorgeadmin123' successfully registered in database.");
        } else {
            // Guarantee password matches the requested credential
            userRepository.findByUsernameIgnoreCase("jorgeadmin123").ifPresent(user -> {
                if (!"87594291".equals(user.getPassword())) {
                    user.setPassword("87594291");
                    user.setRole("ADMIN");
                    userRepository.save(user);
                    log.info(">>> [DataInitializer] Admin password updated to match '87594291'.");
                }
            });
        }
    }
}
