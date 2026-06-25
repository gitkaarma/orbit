package com.orbit.provider;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.orbit.model.IssTle;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IssProviderTest {

    private WireMockServer wm;
    private IssProvider provider;

    @BeforeEach
    void setUp() {
        wm = new WireMockServer(options().dynamicPort());
        wm.start();
        provider = new IssProvider(RestClient.builder().baseUrl(wm.baseUrl()).build());
    }

    @AfterEach
    void tearDown() {
        wm.stop();
    }

    @Test
    void parsesThreeLineTle() {
        String tle = """
                ISS (ZARYA)
                1 25544U 98067A   26176.54791667  .00016717  00000-0  10270-3 0  9000
                2 25544  51.6400 208.9163 0006317  69.9862 290.1614 15.50377579400000""";
        wm.stubFor(get(urlPathEqualTo("/NORAD/elements/gp.php")).willReturn(aResponse()
                .withHeader("Content-Type", "text/plain").withBody(tle)));

        IssTle result = provider.tle();

        assertThat(result.name()).isEqualTo("ISS (ZARYA)");
        assertThat(result.line1()).startsWith("1 25544U");
        assertThat(result.line2()).startsWith("2 25544");
    }

    @Test
    void rejectsMalformedTle() {
        wm.stubFor(get(urlPathEqualTo("/NORAD/elements/gp.php")).willReturn(aResponse()
                .withHeader("Content-Type", "text/plain").withBody("No GP data found")));

        assertThatThrownBy(() -> provider.tle()).isInstanceOf(UpstreamException.class);
    }

    @Test
    void mapsUpstreamError() {
        wm.stubFor(get(urlPathEqualTo("/NORAD/elements/gp.php")).willReturn(aResponse().withStatus(500)));
        assertThatThrownBy(() -> provider.tle()).isInstanceOf(UpstreamException.class);
    }
}
