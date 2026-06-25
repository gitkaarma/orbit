package com.orbit.model;

import java.util.List;

public record AsteroidFeed(
        String start,
        String end,
        int count,
        int hazardousCount,
        List<Asteroid> asteroids) {
}
