package com.orbit.provider;

import com.orbit.model.IssTle;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Fetches the ISS orbital elements (TLE) from Celestrak. The browser propagates the live
 * position from these with satellite.js, so there's no per-frame polling and no rate limits.
 */
@Component
public class IssProvider {

    private static final String ISS_CATALOG_NUMBER = "25544";

    private final RestClient client;

    public IssProvider(@Qualifier("issClient") RestClient client) {
        this.client = client;
    }

    @Retry(name = "upstream")
    public IssTle tle() {
        String body;
        try {
            body = client.get()
                    .uri("/NORAD/elements/gp.php?CATNR={n}&FORMAT=tle", ISS_CATALOG_NUMBER)
                    .retrieve()
                    .body(String.class);
        } catch (RestClientResponseException e) {
            throw new UpstreamException("TLE source returned HTTP " + e.getStatusCode().value(), e);
        } catch (ResourceAccessException e) {
            throw new UpstreamException("TLE source unreachable", e);
        }
        if (body == null || body.isBlank()) {
            throw new UpstreamException("Empty TLE response");
        }
        String[] lines = body.strip().split("\\r?\\n");
        if (lines.length < 3) {
            throw new UpstreamException("Malformed TLE response");
        }
        return new IssTle(lines[0].trim(), lines[1].trim(), lines[2].trim());
    }
}
