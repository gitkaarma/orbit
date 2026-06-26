package com.orbit.config;

import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.ClientHttpRequestFactorySettings;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Bean
    ClientHttpRequestFactory orbitRequestFactory(OrbitProperties props) {
        ClientHttpRequestFactorySettings settings = ClientHttpRequestFactorySettings.defaults()
                .withConnectTimeout(Duration.ofMillis(props.http().connectTimeoutMs()))
                .withReadTimeout(Duration.ofMillis(props.http().readTimeoutMs()));
        return ClientHttpRequestFactoryBuilder.detect().build(settings);
    }

    @Bean
    RestClient nasaClient(OrbitProperties props, ClientHttpRequestFactory factory) {
        return RestClient.builder().baseUrl(props.nasa().baseUrl()).requestFactory(factory).build();
    }

    @Bean
    RestClient issClient(OrbitProperties props, ClientHttpRequestFactory factory) {
        return RestClient.builder().baseUrl(props.iss().baseUrl()).requestFactory(factory).build();
    }

    @Bean
    RestClient issFallbackClient(OrbitProperties props, ClientHttpRequestFactory factory) {
        return RestClient.builder().baseUrl(props.iss().fallbackBaseUrl()).requestFactory(factory).build();
    }

    @Bean
    RestClient libraryClient(OrbitProperties props, ClientHttpRequestFactory factory) {
        return RestClient.builder().baseUrl(props.library().baseUrl()).requestFactory(factory).build();
    }
}
