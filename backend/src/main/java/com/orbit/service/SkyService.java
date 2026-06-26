package com.orbit.service;

import com.orbit.model.Apod;
import com.orbit.model.Asteroid;
import com.orbit.model.AsteroidFeed;
import com.orbit.model.SkyContext;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.function.Supplier;

/** Assembles the live sky snapshot used by the AI flight-director narration. */
@Service
public class SkyService {

    private final SpaceService space;

    public SkyService(SpaceService space) {
        this.space = space;
    }

    /**
     * The ISS position is supplied by the caller (the browser propagates it). APOD and the asteroid
     * feed are fetched here, and degrade to null/0 if a source is down, so the narration still runs.
     */
    public SkyContext context(double lat, double lon, double altKm, double speedKmh, boolean daylight) {
        Apod apod = quiet(() -> space.apod(null));
        AsteroidFeed feed = quiet(() -> space.asteroids(
                LocalDate.now().toString(), LocalDate.now().plusDays(6).toString()));

        Asteroid closest = feed == null ? null : feed.asteroids().stream()
                .min(Comparator.comparingDouble(Asteroid::missDistanceLunar)).orElse(null);

        return new SkyContext(
                lat, lon, altKm, speedKmh, daylight,
                apod == null ? null : apod.title(),
                apod == null ? null : summarize(apod.explanation()),
                feed == null ? 0 : feed.count(),
                feed == null ? 0 : feed.hazardousCount(),
                closest == null ? null : closest.name(),
                closest == null ? null : closest.missDistanceLunar(),
                closest == null ? null : closest.closeApproachDate());
    }

    /** First sentence of the APOD explanation, capped, for a one-line mention. */
    private static String summarize(String text) {
        if (text == null || text.isBlank()) return null;
        String trimmed = text.strip();
        int end = trimmed.indexOf(". ");
        String first = end > 0 ? trimmed.substring(0, end + 1) : trimmed;
        if (first.length() > 220) {
            first = first.substring(0, 217).trim() + "…";
        }
        return first;
    }

    private static <T> T quiet(Supplier<T> call) {
        try {
            return call.get();
        } catch (RuntimeException e) {
            return null;
        }
    }
}
