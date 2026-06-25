package com.orbit.model;

/** A near-Earth object on a close approach. Distances/sizes pre-computed for the UI. */
public record Asteroid(
        String id,
        String name,
        double diameterMinM,
        double diameterMaxM,
        String closeApproachDate,
        double missDistanceKm,
        double missDistanceLunar,
        double velocityKmh,
        boolean hazardous,
        double magnitude) {
}
