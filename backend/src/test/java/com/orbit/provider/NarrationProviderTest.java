package com.orbit.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.orbit.config.OrbitProperties;
import com.orbit.model.SkyContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.assertj.core.api.Assertions.assertThat;

class NarrationProviderTest {

    private static final SkyContext CTX = new SkyContext(
            28.5, -80.6, 420.0, 27600.0, true,
            "Pillars of Creation", "A famous star-forming nebula.",
            5, 1, "(2024 AB)", 3.2, "2026-06-26");

    private WireMockServer wm;

    @BeforeEach
    void setUp() {
        wm = new WireMockServer(options().dynamicPort());
        wm.start();
    }

    @AfterEach
    void tearDown() {
        wm.stop();
    }

    private NarrationProvider provider(String apiKey) {
        OrbitProperties props = new OrbitProperties(null, null, null, null, null,
                new OrbitProperties.Gemini(wm.baseUrl(), apiKey, "gemini-2.0-flash"));
        RestClient client = RestClient.builder().baseUrl(wm.baseUrl()).build();
        return new NarrationProvider(client, props, new ObjectMapper());
    }

    @Test
    void streamsGeminiSseDeltas() {
        String sse = """
                data: {"candidates":[{"content":{"parts":[{"text":"Good evening. "}]}}]}

                data: {"candidates":[{"content":{"parts":[{"text":"[[focus:iss]] The station glides on."}]}}]}

                """;
        wm.stubFor(post(urlPathMatching(".*streamGenerateContent"))
                .withQueryParam("alt", equalTo("sse"))
                .willReturn(aResponse().withStatus(200)
                        .withHeader("Content-Type", "text/event-stream")
                        .withBody(sse)));

        StringBuilder out = new StringBuilder();
        provider("a-real-key").stream(CTX, out::append);

        assertThat(out.toString())
                .contains("Good evening. ")
                .contains("[[focus:iss]] The station glides on.");
    }

    @Test
    void fallsBackToTemplatedWhenGeminiFailsBeforeOutput() {
        wm.stubFor(post(urlPathMatching(".*streamGenerateContent"))
                .willReturn(aResponse().withStatus(429).withBody("quota exceeded")));

        StringBuilder out = new StringBuilder();
        provider("a-real-key").stream(CTX, out::append);

        // No tokens arrived from Gemini, so the grounded fallback runs instead of erroring.
        assertThat(out.toString()).contains("[[focus:iss]]").contains("Pillars of Creation");
    }

    @Test
    void templatedFallbackIsGroundedAndTagged() {
        String text = NarrationProvider.templated(CTX);

        assertThat(text)
                .contains("[[focus:iss]]")
                .contains("[[highlight:starlink]]")
                .contains("[[highlight:navigation]]")
                .contains("[[reset]]")
                .contains("Pillars of Creation")
                .contains("5 near-Earth asteroids")
                .contains("lunar distances");
    }
}
