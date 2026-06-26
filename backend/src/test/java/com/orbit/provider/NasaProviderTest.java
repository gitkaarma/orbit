package com.orbit.provider;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.orbit.config.OrbitProperties;
import com.orbit.model.Apod;
import com.orbit.model.AsteroidFeed;
import com.orbit.model.EpicImage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class NasaProviderTest {

    private WireMockServer wm;
    private NasaProvider provider;

    @BeforeEach
    void setUp() {
        wm = new WireMockServer(options().dynamicPort());
        wm.start();
        OrbitProperties props = new OrbitProperties(
                null, null, new OrbitProperties.Nasa(wm.baseUrl(), "TEST_KEY"), null, null, null);
        provider = new NasaProvider(RestClient.builder().baseUrl(wm.baseUrl()).build(), props);
    }

    @AfterEach
    void tearDown() {
        wm.stop();
    }

    @Test
    void parsesApodImage() {
        wm.stubFor(get(urlPathEqualTo("/planetary/apod")).willReturn(okJson("""
                {"date":"2026-06-25","title":"Rays over Sicily","explanation":"The Sun has just set.",
                 "media_type":"image","url":"https://apod/img.jpg","hdurl":"https://apod/hd.jpg","copyright":"A. Photographer"}""")));

        Apod apod = provider.apod("2026-06-25");

        assertThat(apod.title()).isEqualTo("Rays over Sicily");
        assertThat(apod.mediaType()).isEqualTo("image");
        assertThat(apod.url()).isEqualTo("https://apod/img.jpg");
        assertThat(apod.thumbnailUrl()).isEqualTo("https://apod/img.jpg"); // image: same as url
        assertThat(apod.hdurl()).isEqualTo("https://apod/hd.jpg");
        assertThat(apod.copyright()).isEqualTo("A. Photographer");
    }

    @Test
    void keepsVideoEmbedUrlAndStillThumbnail() {
        wm.stubFor(get(urlPathEqualTo("/planetary/apod")).willReturn(okJson("""
                {"date":"2026-06-20","title":"A Flight","explanation":"e","media_type":"video",
                 "url":"https://youtube/embed/x","thumbnail_url":"https://apod/still.jpg"}""")));

        Apod apod = provider.apod(null);

        assertThat(apod.mediaType()).isEqualTo("video");
        assertThat(apod.url()).isEqualTo("https://youtube/embed/x");   // the player, for the iframe
        assertThat(apod.thumbnailUrl()).isEqualTo("https://apod/still.jpg"); // a still, for grids
    }

    @Test
    void cleansAsteroidNamesSortsAndCountsHazardous() {
        wm.stubFor(get(urlPathEqualTo("/neo/rest/v1/feed")).willReturn(okJson("""
                {"near_earth_objects":{"2026-06-25":[
                  {"id":"1","name":"(2024 AB1)","is_potentially_hazardous_asteroid":false,"absolute_magnitude_h":22.1,
                   "estimated_diameter":{"meters":{"estimated_diameter_min":30,"estimated_diameter_max":70}},
                   "close_approach_data":[{"close_approach_date":"2026-06-26",
                     "miss_distance":{"kilometers":"5000000","lunar":"13.0"},
                     "relative_velocity":{"kilometers_per_hour":"40000"}}]},
                  {"id":"2","name":"152637 (1997 NC1)","is_potentially_hazardous_asteroid":true,"absolute_magnitude_h":17.8,
                   "estimated_diameter":{"meters":{"estimated_diameter_min":700,"estimated_diameter_max":1500}},
                   "close_approach_data":[{"close_approach_date":"2026-06-27",
                     "miss_distance":{"kilometers":"2500000","lunar":"6.5"},
                     "relative_velocity":{"kilometers_per_hour":"31000"}}]}
                ]}}""")));

        AsteroidFeed feed = provider.asteroids("2026-06-25", "2026-07-01");

        assertThat(feed.count()).isEqualTo(2);
        assertThat(feed.hazardousCount()).isEqualTo(1);
        // Sorted nearest-first by km, and parens stripped from the name.
        assertThat(feed.asteroids().get(0).name()).isEqualTo("152637 1997 NC1");
        assertThat(feed.asteroids().get(0).missDistanceLunar()).isEqualTo(6.5);
        assertThat(feed.asteroids().get(1).name()).isEqualTo("2024 AB1");
    }

    @Test
    void buildsKeylessEpicUrls() {
        wm.stubFor(get(urlPathEqualTo("/EPIC/api/natural")).willReturn(okJson("""
                [{"identifier":"20260622005516","caption":"Earth","image":"epic_1b_20260622005516",
                  "date":"2026-06-22 00:50:27","centroid_coordinates":{"lat":17.75,"lon":168.31}}]""")));

        List<EpicImage> images = provider.epicLatest();

        assertThat(images).hasSize(1);
        EpicImage img = images.get(0);
        assertThat(img.imageUrl())
                .isEqualTo("https://epic.gsfc.nasa.gov/archive/natural/2026/06/22/png/epic_1b_20260622005516.png");
        assertThat(img.thumbUrl())
                .isEqualTo("https://epic.gsfc.nasa.gov/archive/natural/2026/06/22/thumbs/epic_1b_20260622005516.jpg");
        assertThat(img.lat()).isEqualTo(17.75);
        // The API key never appears in a browser-facing URL.
        assertThat(img.imageUrl()).doesNotContain("api_key");
    }

    @Test
    void mapsNotFoundAndRateLimit() {
        wm.stubFor(get(urlPathEqualTo("/planetary/apod")).willReturn(aResponse().withStatus(404)));
        assertThatThrownBy(() -> provider.apod("1990-01-01")).isInstanceOf(NotFoundException.class);

        wm.resetAll();
        wm.stubFor(get(urlPathEqualTo("/planetary/apod")).willReturn(aResponse().withStatus(429)));
        assertThatThrownBy(() -> provider.apod(null)).isInstanceOf(RateLimitException.class);
    }
}
