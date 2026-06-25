package com.orbit.service;

import com.orbit.config.CacheConfig;
import com.orbit.model.Apod;
import com.orbit.model.AsteroidFeed;
import com.orbit.model.EpicImage;
import com.orbit.model.IssTle;
import com.orbit.model.LibraryItem;
import com.orbit.provider.ImageLibraryProvider;
import com.orbit.provider.IssProvider;
import com.orbit.provider.NasaProvider;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/** Application-facing space data, cached per endpoint. The ISS position is deliberately uncached. */
@Service
public class SpaceService {

    private final NasaProvider nasa;
    private final ImageLibraryProvider library;
    private final IssProvider iss;

    public SpaceService(NasaProvider nasa, ImageLibraryProvider library, IssProvider iss) {
        this.nasa = nasa;
        this.library = library;
        this.iss = iss;
    }

    @Cacheable(cacheNames = CacheConfig.APOD, key = "#date == null ? 'today' : #date")
    public Apod apod(String date) {
        return nasa.apod(date);
    }

    @Cacheable(cacheNames = CacheConfig.APOD_RANGE, key = "#start + ':' + #end")
    public List<Apod> apodRange(String start, String end) {
        return nasa.apodRange(start, end);
    }

    @Cacheable(cacheNames = CacheConfig.LIBRARY, key = "#query.toLowerCase() + ':' + #page")
    public List<LibraryItem> searchLibrary(String query, int page) {
        return library.search(query, page);
    }

    @Cacheable(cacheNames = CacheConfig.ASTEROIDS, key = "#start + ':' + #end")
    public AsteroidFeed asteroids(String start, String end) {
        return nasa.asteroids(start, end);
    }

    @Cacheable(cacheNames = CacheConfig.EPIC)
    public List<EpicImage> epicLatest() {
        return nasa.epicLatest();
    }

    @Cacheable(cacheNames = CacheConfig.ISS_TLE)
    public IssTle issTle() {
        return iss.tle();
    }
}
