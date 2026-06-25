package com.orbit.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.orbit.config.OrbitProperties;
import com.orbit.model.Apod;
import com.orbit.model.Asteroid;
import com.orbit.model.AsteroidFeed;
import com.orbit.model.EpicImage;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/** Adapter for NASA's Open APIs (APOD, NeoWs asteroids, EPIC). Owns the API key. */
@Component
public class NasaProvider {

    private final RestClient client;
    private final String apiKey;

    public NasaProvider(@Qualifier("nasaClient") RestClient client, OrbitProperties props) {
        this.client = client;
        this.apiKey = props.nasa().apiKey();
    }

    @Retry(name = "upstream")
    public Apod apod(String date) {
        JsonNode n = get(b -> {
            b.path("/planetary/apod").queryParam("api_key", apiKey).queryParam("thumbs", true);
            if (date != null && !date.isBlank()) {
                b.queryParam("date", date);
            }
            return b.build();
        });
        return mapApod(n);
    }

    @Retry(name = "upstream")
    public List<Apod> apodRange(String start, String end) {
        JsonNode arr = get(b -> b.path("/planetary/apod")
                .queryParam("api_key", apiKey)
                .queryParam("thumbs", true)
                .queryParam("start_date", start)
                .queryParam("end_date", end)
                .build());
        List<Apod> out = new ArrayList<>();
        if (arr != null && arr.isArray()) {
            arr.forEach(n -> out.add(mapApod(n)));
        }
        out.sort(Comparator.comparing(Apod::date).reversed()); // newest first
        return out;
    }

    @Retry(name = "upstream")
    public AsteroidFeed asteroids(String start, String end) {
        JsonNode root = get(b -> b.path("/neo/rest/v1/feed")
                .queryParam("start_date", start)
                .queryParam("end_date", end)
                .queryParam("api_key", apiKey)
                .build());
        if (root == null) {
            throw new UpstreamException("NASA returned an empty asteroid feed");
        }
        List<Asteroid> list = new ArrayList<>();
        JsonNode byDate = root.path("near_earth_objects");
        byDate.forEach(day -> day.forEach(a -> list.add(mapAsteroid(a))));
        list.sort(Comparator.comparingDouble(Asteroid::missDistanceKm));
        int hazardous = (int) list.stream().filter(Asteroid::hazardous).count();
        return new AsteroidFeed(start, end, list.size(), hazardous, list);
    }

    @Retry(name = "upstream")
    public List<EpicImage> epicLatest() {
        JsonNode arr = get(b -> b.path("/EPIC/api/natural").queryParam("api_key", apiKey).build());
        List<EpicImage> out = new ArrayList<>();
        if (arr != null && arr.isArray()) {
            arr.forEach(n -> out.add(mapEpic(n)));
        }
        return out;
    }

    // --- mapping ---------------------------------------------------------------

    private static Apod mapApod(JsonNode n) {
        String media = str(n, "media_type");
        String url = str(n, "url"); // embeddable player for video, the image itself for image
        // For images the thumbnail is the image. For videos, thumbs=true usually gives a still;
        // when NASA omits it, leave the thumbnail null rather than point an <img> at a video.
        String tnail = str(n, "thumbnail_url");
        String thumbnail = "video".equals(media)
                ? (tnail != null && !tnail.isBlank() ? tnail : null)
                : url;
        return new Apod(
                str(n, "date"), str(n, "title"), str(n, "explanation"), media,
                url, thumbnail, str(n, "hdurl"), str(n, "copyright"));
    }

    private static Asteroid mapAsteroid(JsonNode a) {
        JsonNode meters = a.path("estimated_diameter").path("meters");
        JsonNode cad = a.path("close_approach_data").path(0);
        return new Asteroid(
                str(a, "id"),
                cleanName(str(a, "name")),
                meters.path("estimated_diameter_min").asDouble(),
                meters.path("estimated_diameter_max").asDouble(),
                str(cad, "close_approach_date"),
                cad.path("miss_distance").path("kilometers").asDouble(),
                cad.path("miss_distance").path("lunar").asDouble(),
                cad.path("relative_velocity").path("kilometers_per_hour").asDouble(),
                a.path("is_potentially_hazardous_asteroid").asBoolean(false),
                a.path("absolute_magnitude_h").asDouble());
    }

    private static EpicImage mapEpic(JsonNode n) {
        String date = str(n, "date");          // "2026-06-22 00:50:23"
        String image = str(n, "image");
        String url = "", thumb = "";
        if (date != null && image != null && date.length() >= 10) {
            String y = date.substring(0, 4), m = date.substring(5, 7), d = date.substring(8, 10);
            // Keyless image host so the API key never reaches the browser.
            String dir = "https://epic.gsfc.nasa.gov/archive/natural/" + y + "/" + m + "/" + d;
            url = dir + "/png/" + image + ".png";       // ~3 MB full disk
            thumb = dir + "/thumbs/" + image + ".jpg";   // ~7 KB, for the rotation timeline
        }
        JsonNode c = n.path("centroid_coordinates");
        return new EpicImage(str(n, "identifier"), str(n, "caption"), date, url, thumb,
                c.path("lat").asDouble(), c.path("lon").asDouble());
    }

    /** NeoWs names look like "(2024 AB1)" or "419880 (2011 AH37)"; trim the wrapping parens. */
    private static String cleanName(String name) {
        if (name == null) return null;
        return name.replace("(", "").replace(")", "").trim();
    }

    // --- http ------------------------------------------------------------------

    private JsonNode get(Function<UriBuilder, URI> uriFn) {
        try {
            return client.get().uri(uriFn).retrieve().body(JsonNode.class);
        } catch (RestClientResponseException e) {
            int sc = e.getStatusCode().value();
            if (sc == 404) throw new NotFoundException("NASA resource not found");
            if (sc == 429) throw new RateLimitException("NASA rate limit reached");
            throw new UpstreamException("NASA returned HTTP " + sc, e);
        } catch (ResourceAccessException e) {
            throw new UpstreamException("NASA unreachable or timed out", e);
        }
    }

    private static String str(JsonNode n, String field) {
        JsonNode v = n.get(field);
        return v == null || v.isNull() ? null : v.asText();
    }
}
