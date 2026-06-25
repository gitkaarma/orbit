package com.orbit.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI orbitOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Orbit API")
                .version("v1")
                .description("Backend-for-frontend for the Orbit space dashboard. Proxies NASA Open APIs, "
                        + "the NASA Image Library, and the ISS position; caches responses; persists favorites."));
    }
}
