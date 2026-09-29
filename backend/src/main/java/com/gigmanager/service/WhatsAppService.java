package com.gigmanager.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class WhatsAppService {

    @Value("${evolution-api.url}")
    private String evolutionApiUrl;

    @Value("${evolution-api.apikey}")
    private String evolutionApiKey;

    @Value("${evolution-api.instance}")
    private String evolutionApiInstance;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendMessage(String targetNumber, String message) {
        try {
            String url = evolutionApiUrl + "/message/sendText/" + evolutionApiInstance;

            Map<String, Object> body = Map.of(
                    "number", targetNumber,
                    "options", Map.of("delay", 1200, "presence", "composing"),
                    "textMessage", Map.of("text", message)
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", evolutionApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, entity, String.class);

        } catch (Exception e) {
            System.err.println("[WhatsAppService] Failed to send message: " + e.getMessage());
        }
    }
}
