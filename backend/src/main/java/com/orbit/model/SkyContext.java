package com.orbit.model;

/**
 * A snapshot of "the sky right now", assembled for the AI flight-director narration. ISS state
 * comes from the client (it propagates the live position); the rest is fetched server-side.
 * Any text field may be null if its source was unavailable.
 */
public record SkyContext(
        double issLat,
        double issLon,
        double issAltKm,
        double issSpeedKmh,
        boolean issDaylight,
        String apodTitle,
        String apodSummary,
        int asteroidCount,
        int hazardousCount,
        String closestAsteroidName,
        Double closestApproachLunar,
        String closestApproachDate) {
}
