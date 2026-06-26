package com.orbit.provider;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.orbit.model.IssTle;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IssProviderTest {

    private static final String PRIMARY = "/api/tle/25544";
    private static final String FALLBACK = "/v1/satellites/25544/tles";

    private WireMockServer wm;
    private IssProvider provider;

    @BeforeEach
    void setUp() {
        wm = new WireMockServer(options().dynamicPort());
        wm.start();
        // Both sources point at the same WireMock; they're distinguished by path.
        RestClient client = RestClient.builder().baseUrl(wm.baseUrl()).build();
        provider = new IssProvider(client, client);
    }

    @AfterEach
    void tearDown() {
        wm.stop();
    }

    @Test
    void parsesPrimaryTleJson() {
        wm.stubFor(get(urlPathEqualTo(PRIMARY)).willReturn(okJson("""
                {"satelliteId":25544,"name":"ISS (ZARYA)",
                 "line1":"1 25544U 98067A   26175.15560926  .00007363  00000+0  13975-3 0  9991",
                 "line2":"2 25544  51.6326 265.6000 0004427 224.4953 135.5681 15.49396189572839"}""")));

        IssTle result = provider.tle();

        assertThat(result.name()).isEqualTo("ISS (ZARYA)");
        assertThat(result.line1()).startsWith("1 25544U");
        assertThat(result.line2()).startsWith("2 25544");
    }

    @Test
    void fallsBackToSecondaryWhenPrimaryFails() {
        wm.stubFor(get(urlPathEqualTo(PRIMARY)).willReturn(aResponse().withStatus(500)));
        wm.stubFor(get(urlPathEqualTo(FALLBACK)).willReturn(okJson("""
                {"id":"25544","header":"ISS (ZARYA)",
                 "line1":"1 25544U 98067A   26175.15560926  .00007363  00000+0  13975-3 0  9991",
                 "line2":"2 25544  51.6326 265.6000 0004427 224.4953 135.5681 15.49396189572839"}""")));

        IssTle result = provider.tle();

        assertThat(result.name()).isEqualTo("ISS (ZARYA)");
        assertThat(result.line2()).startsWith("2 25544");
    }

    @Test
    void throwsWhenBothSourcesFail() {
        wm.stubFor(get(urlPathEqualTo(PRIMARY)).willReturn(aResponse().withStatus(500)));
        wm.stubFor(get(urlPathEqualTo(FALLBACK)).willReturn(aResponse().withStatus(503)));

        assertThatThrownBy(() -> provider.tle()).isInstanceOf(UpstreamException.class);
    }

    @Test
    void rejectsMalformedResponseFromBoth() {
        wm.stubFor(get(urlPathEqualTo(PRIMARY)).willReturn(okJson("{\"name\":\"iss\"}")));
        wm.stubFor(get(urlPathEqualTo(FALLBACK)).willReturn(okJson("{\"header\":\"iss\"}")));

        assertThatThrownBy(() -> provider.tle()).isInstanceOf(UpstreamException.class);
    }
}
