package com.orbit.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.orbit.model.LibraryItem;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

/** Adapter for the NASA Image and Video Library (images-api.nasa.gov). No API key required. */
@Component
public class ImageLibraryProvider {

    private static final int MAX_RESULTS = 60;

    private final RestClient client;

    public ImageLibraryProvider(@Qualifier("libraryClient") RestClient client) {
        this.client = client;
    }

    @Retry(name = "upstream")
    public List<LibraryItem> search(String query, int page) {
        JsonNode root = get(b -> b.path("/search")
                .queryParam("q", query)
                .queryParam("media_type", "image")
                .queryParam("page", Math.max(1, page))
                .build());
        if (root == null) {
            throw new UpstreamException("Image library returned an empty response");
        }

        List<LibraryItem> out = new ArrayList<>();
        for (JsonNode item : root.path("collection").path("items")) {
            String thumb = item.path("links").path(0).path("href").asText("");
            if (thumb.isEmpty()) {
                continue;
            }
            JsonNode data = item.path("data").path(0);
            List<String> keywords = new ArrayList<>();
            data.path("keywords").forEach(k -> keywords.add(k.asText()));
            out.add(new LibraryItem(
                    str(data, "nasa_id"),
                    str(data, "title"),
                    str(data, "description"),
                    str(data, "date_created"),
                    str(data, "center"),
                    variant(thumb, "thumb"),  // ~50KB for the grid
                    variant(thumb, "medium"), // ~160KB, crisp for the lightbox
                    keywords));
            if (out.size() >= MAX_RESULTS) {
                break;
            }
        }
        return out;
    }

    private JsonNode get(Function<UriBuilder, URI> uriFn) {
        try {
            return client.get().uri(uriFn).retrieve().body(JsonNode.class);
        } catch (RestClientResponseException e) {
            int sc = e.getStatusCode().value();
            if (sc == 404) throw new NotFoundException("Image library resource not found");
            if (sc == 429) throw new RateLimitException("Image library rate limit");
            throw new UpstreamException("Image library returned HTTP " + sc, e);
        } catch (ResourceAccessException e) {
            throw new UpstreamException("Image library unreachable", e);
        }
    }

    /**
     * NASA's search returns a thumbnail href with an arbitrary size token ("~orig", "~medium", ...),
     * sometimes the 26 MB original. Re-point it at a known-good variant. "~thumb" and "~medium" are
     * present for every asset; "~large"/"~orig" are not, so we never derive those.
     */
    private static String variant(String href, String size) {
        int tilde = href.lastIndexOf('~');
        int dot = href.lastIndexOf('.');
        if (tilde < 0 || dot <= tilde) {
            return href;
        }
        return href.substring(0, tilde) + "~" + size + href.substring(dot);
    }

    private static String str(JsonNode n, String field) {
        JsonNode v = n.get(field);
        return v == null || v.isNull() ? null : v.asText();
    }
}
