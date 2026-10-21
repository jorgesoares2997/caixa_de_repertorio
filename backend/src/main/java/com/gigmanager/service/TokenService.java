package com.gigmanager.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Service
public class TokenService {

    private final String secretKey;

    public TokenService(@Value("${app.auth.secret:caixa-de-repertorio-jorge-soares-secret-key-2026-neo}") String secretKey) {
        this.secretKey = secretKey;
    }

    /**
     * Generates a signed token: base64(username:role:timestamp).signature
     */
    public String generateToken(String username, String role) {
        long timestamp = System.currentTimeMillis();
        String payload = username + ":" + role + ":" + timestamp;
        String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String signature = sign(encodedPayload);
        return encodedPayload + "." + signature;
    }

    /**
     * Validates token and returns true if signature matches and role is ADMIN
     */
    public boolean isAdminToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        String[] parts = token.trim().split("\\.");
        if (parts.length != 2) {
            return false;
        }

        String encodedPayload = parts[0];
        String signature = parts[1];

        String expectedSignature = sign(encodedPayload);
        if (!MessageDigest.isEqual(signature.getBytes(StandardCharsets.UTF_8), expectedSignature.getBytes(StandardCharsets.UTF_8))) {
            return false;
        }

        try {
            byte[] decoded = Base64.getUrlDecoder().decode(encodedPayload);
            String payload = new String(decoded, StandardCharsets.UTF_8);
            String[] payloadParts = payload.split(":");
            if (payloadParts.length >= 2) {
                String role = payloadParts[1];
                return "ADMIN".equalsIgnoreCase(role);
            }
        } catch (Exception e) {
            return false;
        }

        return false;
    }

    /**
     * Extracts username from token if valid
     */
    public String extractUsername(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        String[] parts = token.trim().split("\\.");
        if (parts.length != 2) {
            return null;
        }

        String encodedPayload = parts[0];
        String signature = parts[1];

        String expectedSignature = sign(encodedPayload);
        if (!MessageDigest.isEqual(signature.getBytes(StandardCharsets.UTF_8), expectedSignature.getBytes(StandardCharsets.UTF_8))) {
            return null;
        }

        try {
            byte[] decoded = Base64.getUrlDecoder().decode(encodedPayload);
            String payload = new String(decoded, StandardCharsets.UTF_8);
            String[] payloadParts = payload.split(":");
            return payloadParts[0];
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error signing auth token", e);
        }
    }
}
