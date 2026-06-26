package com.orbit.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "orbit")
public record OrbitProperties(Cors cors, Http http, Nasa nasa, Iss iss, Library library, Gemini gemini) {

    public record Cors(List<String> allowedOrigins) {
    }

    public record Http(int connectTimeoutMs, int readTimeoutMs) {
    }

    public record Nasa(String baseUrl, String apiKey) {
    }

    public record Iss(String baseUrl, String fallbackBaseUrl) {
    }

    public record Library(String baseUrl) {
    }

    /** Google Gemini for the AI "flight director" narration. {@code apiKey} blank ⇒ grounded fallback. */
    public record Gemini(String baseUrl, String apiKey, String model) {
    }
}
