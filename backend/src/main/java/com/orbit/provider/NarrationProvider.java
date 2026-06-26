package com.orbit.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orbit.config.OrbitProperties;
import com.orbit.model.SkyContext;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Consumer;

/**
 * Produces the AI flight-director narration as a stream of text deltas. With a Gemini API key it
 * streams a fresh, grounded narration token-by-token from the model; without one it falls back to a
 * deterministic, equally-grounded templated narration, paced to feel like live typing. Either way
 * the text carries inline action tags ([[focus:iss]], [[highlight:starlink]], …) that drive the globe.
 */
@Component
public class NarrationProvider {

    private final RestClient gemini;
    private final OrbitProperties.Gemini config;
    private final ObjectMapper mapper;

    public NarrationProvider(@Qualifier("geminiClient") RestClient gemini, OrbitProperties props, ObjectMapper mapper) {
        this.gemini = gemini;
        this.config = props.gemini();
        this.mapper = mapper;
    }

    public boolean aiEnabled() {
        return config.apiKey() != null && !config.apiKey().isBlank();
    }

    /** Streams the narration; {@code onDelta} receives each text fragment as it is produced. */
    public void stream(SkyContext ctx, Consumer<String> onDelta) {
        if (!aiEnabled()) {
            streamTemplated(ctx, onDelta);
            return;
        }
        boolean[] started = {false};
        try {
            streamGemini(ctx, delta -> {
                started[0] = true;
                onDelta.accept(delta);
            });
        } catch (RuntimeException e) {
            if (started[0]) throw e; // already mid-stream; can't cleanly restart
            // Gemini unavailable (rate limit, outage) before any output → grounded fallback, so the
            // visitor still gets a brief instead of an error. Free-tier per-minute limits make this real.
            streamTemplated(ctx, onDelta);
        }
    }

    // --- Gemini ------------------------------------------------------------------------------

    private void streamGemini(SkyContext ctx, Consumer<String> onDelta) {
        String body = requestBody(ctx);
        String path = "/v1beta/models/" + config.model() + ":streamGenerateContent?alt=sse";
        try {
            gemini.post()
                    .uri(path)
                    .header("x-goog-api-key", config.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .exchange((request, response) -> {
                        if (!response.getStatusCode().is2xxSuccessful()) {
                            String err = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
                            throw new UpstreamException("Gemini HTTP " + response.getStatusCode().value() + ": " + err);
                        }
                        try (BufferedReader reader =
                                     new BufferedReader(new InputStreamReader(response.getBody(), StandardCharsets.UTF_8))) {
                            String line;
                            while ((line = reader.readLine()) != null) {
                                if (!line.startsWith("data:")) continue;
                                String json = line.substring(5).trim();
                                if (json.isEmpty() || json.equals("[DONE]")) continue;
                                JsonNode parts = mapper.readTree(json)
                                        .path("candidates").path(0).path("content").path("parts");
                                for (JsonNode part : parts) {
                                    String text = part.path("text").asText("");
                                    if (!text.isEmpty()) onDelta.accept(text);
                                }
                            }
                        }
                        return null;
                    });
        } catch (UpstreamException e) {
            throw e;
        } catch (Exception e) {
            throw new UpstreamException("Gemini narration failed", e);
        }
    }

    private String requestBody(SkyContext ctx) {
        try {
            String facts = mapper.writeValueAsString(ctx);
            String prompt = """
                    You are the flight director at a space observatory, narrating the sky in real time to a \
                    visitor. Speak in warm, vivid, present-tense prose: about 110-150 words, 4-6 short \
                    sentences. Use ONLY the facts provided; never invent numbers or names. Embed these control \
                    tags inline, exactly as written, at the moment you mention the thing (they steer a 3D globe \
                    and are invisible to the listener):
                      [[focus:iss]]            when you turn to the ISS
                      [[highlight:starlink]]   when you mention Starlink or mega-constellations
                      [[highlight:navigation]] when you mention GPS or navigation satellites
                      [[reset]]                when you pan back out to the whole sky
                    Begin by focusing the ISS and end by focusing the ISS. No markdown, no headings.

                    FACTS (JSON):
                    """ + facts;
            return mapper.writeValueAsString(Map.of(
                    "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of(
                            "temperature", 0.85,
                            "maxOutputTokens", 800,
                            // 2.5-class models spend tokens "thinking" first; disable it so the whole
                            // budget (and the first tokens) go to the narration, not hidden reasoning.
                            "thinkingConfig", Map.of("thinkingBudget", 0))));
        } catch (Exception e) {
            throw new UpstreamException("Could not build Gemini request", e);
        }
    }

    // --- Grounded fallback -------------------------------------------------------------------

    private void streamTemplated(SkyContext ctx, Consumer<String> onDelta) {
        String narration = templated(ctx);
        // Emit token-by-token (tags stay intact, they contain no spaces) so it feels like live typing.
        for (String token : narration.split(" ")) {
            if (token.isEmpty()) continue;
            onDelta.accept(token + " ");
            sleep(38);
        }
    }

    static String templated(SkyContext ctx) {
        StringBuilder b = new StringBuilder();
        b.append("Welcome back to the observatory. Here is the sky, exactly as it is right now. ");
        b.append("[[focus:iss]] ");
        b.append("The International Space Station is passing over ")
                .append(coords(ctx.issLat(), ctx.issLon()))
                .append(ctx.issDaylight() ? ", bathed in daylight" : ", slipping through Earth's shadow");
        if (ctx.issAltKm() > 0) {
            b.append(", about ").append(Math.round(ctx.issAltKm())).append(" kilometres up");
        }
        if (ctx.issSpeedKmh() > 0) {
            b.append(" and racing along at ").append(String.format(Locale.US, "%,d", Math.round(ctx.issSpeedKmh())))
                    .append(" kilometres an hour");
        }
        b.append(". ");
        b.append("[[highlight:starlink]] ");
        b.append("All around it the mega-constellations crowd low orbit, Starlink and OneWeb in their thousands, ")
                .append("threading between the older satellites. ");
        b.append("[[highlight:navigation]] ");
        b.append("Higher up ride the navigation fleets, GPS and Galileo and their kin, the quiet machinery ")
                .append("behind every map on Earth. ");
        b.append("[[reset]] ");
        if (ctx.asteroidCount() > 0) {
            b.append("Farther out, ").append(ctx.asteroidCount())
                    .append(ctx.asteroidCount() == 1 ? " near-Earth asteroid drifts" : " near-Earth asteroids drift")
                    .append(" past us this week");
            if (ctx.hazardousCount() > 0) {
                b.append(", ").append(ctx.hazardousCount()).append(" of them worth watching");
            }
            b.append(". ");
            if (ctx.closestAsteroidName() != null && ctx.closestApproachLunar() != null) {
                b.append("The closest, ").append(cleanName(ctx.closestAsteroidName())).append(", threads by at ")
                        .append(String.format(Locale.US, "%.1f", ctx.closestApproachLunar()))
                        .append(" lunar distances. ");
            }
        }
        if (ctx.apodTitle() != null && !ctx.apodTitle().isBlank()) {
            b.append("And today's view from NASA is \"").append(ctx.apodTitle()).append("\"");
            if (ctx.apodSummary() != null && !ctx.apodSummary().isBlank()) {
                b.append(" — ").append(ctx.apodSummary());
            }
            b.append(" ");
        }
        b.append("[[focus:iss]] ");
        b.append("Meanwhile the station sails on, chasing a fresh sunrise every ninety minutes.");
        return b.toString();
    }

    private static String coords(double lat, double lon) {
        return String.format(Locale.US, "%.1f°%s, %.1f°%s",
                Math.abs(lat), lat >= 0 ? "N" : "S", Math.abs(lon), lon >= 0 ? "E" : "W");
    }

    private static String cleanName(String name) {
        return name.replace("(", "").replace(")", "").trim();
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new UpstreamException("Narration interrupted", e);
        }
    }
}
