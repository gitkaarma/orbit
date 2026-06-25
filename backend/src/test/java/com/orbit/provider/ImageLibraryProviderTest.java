package com.orbit.provider;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.orbit.model.LibraryItem;
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

class ImageLibraryProviderTest {

    private WireMockServer wm;
    private ImageLibraryProvider provider;

    @BeforeEach
    void setUp() {
        wm = new WireMockServer(options().dynamicPort());
        wm.start();
        provider = new ImageLibraryProvider(RestClient.builder().baseUrl(wm.baseUrl()).build());
    }

    @AfterEach
    void tearDown() {
        wm.stop();
    }

    @Test
    void normalizesThumbnailVariantsRegardlessOfWhatNasaReturns() {
        // NASA's links[0].href is inconsistent: sometimes the 26 MB ~orig, sometimes ~medium.
        String json = """
                {"collection":{"items":[
                  {"data":[{"nasa_id":"PIA1","title":"Dunes on Mars","description":"d","date_created":"2020-01-01T00:00:00Z","center":"JPL","keywords":["mars"]}],
                   "links":[{"href":"https://images-assets.nasa.gov/image/PIA1/PIA1~orig.jpg"}]},
                  {"data":[{"nasa_id":"PIA2","title":"The Moon"}],
                   "links":[{"href":"https://images-assets.nasa.gov/image/PIA2/PIA2~medium.jpg"}]}
                ]}}""";
        wm.stubFor(get(urlPathEqualTo("/search")).willReturn(okJson(json)));

        List<LibraryItem> items = provider.search("mars", 1);

        assertThat(items).hasSize(2);
        LibraryItem first = items.get(0);
        assertThat(first.nasaId()).isEqualTo("PIA1");
        assertThat(first.title()).isEqualTo("Dunes on Mars");
        assertThat(first.thumbUrl()).endsWith("PIA1~thumb.jpg");   // small, for the grid
        assertThat(first.imageUrl()).endsWith("PIA1~medium.jpg");  // crisp, for the lightbox
        // The 26 MB original is never derived.
        assertThat(items).noneMatch(i -> i.imageUrl().contains("~orig"));
        assertThat(items.get(1).thumbUrl()).endsWith("PIA2~thumb.jpg");
    }

    @Test
    void capsResultsAtSixty() {
        StringBuilder sb = new StringBuilder("{\"collection\":{\"items\":[");
        for (int i = 0; i < 75; i++) {
            if (i > 0) sb.append(',');
            sb.append("{\"data\":[{\"nasa_id\":\"ID").append(i).append("\",\"title\":\"T").append(i)
              .append("\"}],\"links\":[{\"href\":\"https://images-assets.nasa.gov/image/ID").append(i)
              .append("/ID").append(i).append("~thumb.jpg\"}]}");
        }
        sb.append("]}}");
        wm.stubFor(get(urlPathEqualTo("/search")).willReturn(okJson(sb.toString())));

        assertThat(provider.search("mars", 1)).hasSize(60);
    }

    @Test
    void mapsRateLimitToTypedException() {
        wm.stubFor(get(urlPathEqualTo("/search")).willReturn(aResponse().withStatus(429)));
        assertThatThrownBy(() -> provider.search("mars", 1)).isInstanceOf(RateLimitException.class);
    }

    @Test
    void mapsServerErrorToUpstreamException() {
        wm.stubFor(get(urlPathEqualTo("/search")).willReturn(aResponse().withStatus(503)));
        assertThatThrownBy(() -> provider.search("mars", 1)).isInstanceOf(UpstreamException.class);
    }
}
