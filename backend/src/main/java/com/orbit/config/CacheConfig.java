package com.orbit.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/** Per-endpoint in-memory TTLs (Caffeine). The ISS position is never cached: it must stay live. */
@Configuration
public class CacheConfig {

    public static final String APOD = "apod";
    public static final String APOD_RANGE = "apodRange";
    public static final String LIBRARY = "library";
    public static final String ASTEROIDS = "asteroids";
    public static final String EPIC = "epic";
    public static final String ISS_TLE = "issTle";

    @Bean
    CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCaffeine(Caffeine.newBuilder().expireAfterWrite(Duration.ofMinutes(30)).maximumSize(300));
        manager.registerCustomCache(APOD, build(Duration.ofHours(1), 60));
        manager.registerCustomCache(APOD_RANGE, build(Duration.ofHours(6), 30));
        manager.registerCustomCache(LIBRARY, build(Duration.ofMinutes(30), 200));
        manager.registerCustomCache(ASTEROIDS, build(Duration.ofHours(1), 20));
        manager.registerCustomCache(EPIC, build(Duration.ofHours(1), 10));
        manager.registerCustomCache(ISS_TLE, build(Duration.ofHours(6), 4));
        return manager;
    }

    private static com.github.benmanes.caffeine.cache.Cache<Object, Object> build(Duration ttl, int max) {
        return Caffeine.newBuilder().expireAfterWrite(ttl).maximumSize(max).build();
    }
}
