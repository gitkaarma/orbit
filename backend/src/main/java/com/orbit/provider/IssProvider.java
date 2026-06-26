package com.orbit.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.orbit.model.IssTle;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Fetches the ISS orbital elements (TLE); the browser propagates the live position from them with
 * satellite.js, so there's no per-frame polling and no rate limits. Two cloud-friendly sources are
 * tried in order for resilience (the primary is fast, the fallback is slower but independent).
 * Celestrak is deliberately not used: it silently drops connections from datacenter IPs, so it
 * never resolves from a host like Render.
 */
@Component
public class IssProvider {

    private static final String ISS_CATALOG_NUMBER = "25544";

    private final RestClient primary;   // tle.ivanstanojevic.me  -> {name, line1, line2}
    private final RestClient fallback;  // wheretheiss.at         -> {header, line1, line2}

    public IssProvider(@Qualifier("issClient") RestClient primary,
                       @Qualifier("issFallbackClient") RestClient fallback) {
        this.primary = primary;
        this.fallback = fallback;
    }

    @Retry(name = "upstream")
    public IssTle tle() {
        try {
            JsonNode body = primary.get()
                    .uri("/api/tle/{id}", ISS_CATALOG_NUMBER)
                    .retrieve()
                    .body(JsonNode.class);
            return parse(body, "name");
        } catch (Exception primaryFailed) {
            return fromFallback();
        }
    }

    private IssTle fromFallback() {
        try {
            JsonNode body = fallback.get()
                    .uri("/v1/satellites/{id}/tles", ISS_CATALOG_NUMBER)
                    .retrieve()
                    .body(JsonNode.class);
            return parse(body, "header");
        } catch (RestClientResponseException e) {
            throw new UpstreamException("TLE sources unavailable (HTTP " + e.getStatusCode().value() + ")", e);
        } catch (ResourceAccessException e) {
            throw new UpstreamException("TLE sources unreachable", e);
        }
    }

    private static IssTle parse(JsonNode body, String nameField) {
        if (body == null) {
            throw new UpstreamException("Empty TLE response");
        }
        String line1 = text(body, "line1");
        String line2 = text(body, "line2");
        if (line1 == null || line2 == null) {
            throw new UpstreamException("Malformed TLE response");
        }
        String name = text(body, nameField);
        return new IssTle(name != null ? name : "ISS (ZARYA)", line1, line2);
    }

    private static String text(JsonNode n, String field) {
        JsonNode v = n.get(field);
        if (v == null || v.isNull()) return null;
        String s = v.asText().trim();
        return s.isEmpty() ? null : s;
    }
}
