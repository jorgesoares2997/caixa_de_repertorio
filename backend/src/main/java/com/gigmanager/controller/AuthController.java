package com.gigmanager.controller;

import com.gigmanager.controller.dto.LoginRequestDTO;
import com.gigmanager.controller.dto.LoginResponseDTO;
import com.gigmanager.domain.AppUser;
import com.gigmanager.repository.UserRepository;
import com.gigmanager.service.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class AuthController {

    private final UserRepository userRepository;
    private final TokenService tokenService;

    public AuthController(UserRepository userRepository, TokenService tokenService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Usuário e senha são obrigatórios."));
        }

        String username = request.getUsername().trim();
        String password = request.getPassword().trim();

        Optional<AppUser> userOpt = userRepository.findByUsernameIgnoreCase(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Usuário ou senha incorretos."));
        }

        AppUser user = userOpt.get();
        if (!password.equals(user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Usuário ou senha incorretos."));
        }

        String token = tokenService.generateToken(user.getUsername(), user.getRole());

        LoginResponseDTO response = LoginResponseDTO.builder()
                .token(token)
                .username(user.getUsername())
                .name(user.getName() != null ? user.getName() : "Jorge Soares")
                .role(user.getRole())
                .message("Autenticação realizada com sucesso!")
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/visitor")
    public ResponseEntity<LoginResponseDTO> loginAsVisitor() {
        LoginResponseDTO response = LoginResponseDTO.builder()
                .token(null)
                .username("visitante")
                .name("Visitante")
                .role("VISITOR")
                .message("Acesso como visitante concedido.")
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> checkAuth(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        }

        if (tokenService.isAdminToken(token)) {
            String username = tokenService.extractUsername(token);
            return ResponseEntity.ok(Map.of(
                    "authenticated", true,
                    "username", username != null ? username : "jorgeadmin123",
                    "role", "ADMIN",
                    "name", "Jorge Soares"
            ));
        }

        return ResponseEntity.ok(Map.of(
                "authenticated", false,
                "role", "VISITOR",
                "name", "Visitante"
        ));
    }
}
