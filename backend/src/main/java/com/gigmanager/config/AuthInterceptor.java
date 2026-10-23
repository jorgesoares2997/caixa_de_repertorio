package com.gigmanager.config;

import com.gigmanager.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;

    public AuthInterceptor(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String method = request.getMethod();
        String uri = request.getRequestURI();

        // Allow CORS pre-flight
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // Allow all auth endpoints
        if (uri.startsWith("/api/auth")) {
            return true;
        }

        // Allow all read-only GET/HEAD requests (portfolio and exploration for visitors)
        if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method)) {
            return true;
        }

        // For all mutating operations (POST, PUT, DELETE, PATCH), verify admin authorization
        String authHeader = request.getHeader("Authorization");
        String token = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        } else {
            // Also check alternate header
            token = request.getHeader("X-Auth-Token");
        }

        if (tokenService.isAdminToken(token)) {
            return true;
        }

        // Block unauthorized mutating operation
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":403,\"error\":\"FORBIDDEN\",\"message\":\"Acesso negado: apenas o administrador tem permissão para adicionar, editar ou excluir dados no acervo.\"}");
        return false;
    }
}
