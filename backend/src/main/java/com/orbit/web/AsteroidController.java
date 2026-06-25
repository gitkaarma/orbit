package com.orbit.web;

import com.orbit.model.AsteroidFeed;
import com.orbit.service.SpaceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@RestController
@RequestMapping("/api/asteroids")
public class AsteroidController {

    private final SpaceService service;

    public AsteroidController(SpaceService service) {
        this.service = service;
    }

    /** Near-Earth objects on close approach. Defaults to the next 7 days; range is capped at 7 days (NeoWs limit). */
    @GetMapping
    public AsteroidFeed feed(@RequestParam(required = false) String start,
                             @RequestParam(required = false) String end) {
        LocalDate s = start == null || start.isBlank() ? LocalDate.now() : Dates.parse(start);
        LocalDate e = end == null || end.isBlank() ? s.plusDays(6) : Dates.parse(end);
        if (e.isBefore(s)) {
            throw new IllegalArgumentException("end must be on or after start");
        }
        // NeoWs allows a 7-day inclusive window; a 7-day *gap* (start..start+7) is 8 days and is rejected.
        if (ChronoUnit.DAYS.between(s, e) > 6) {
            throw new IllegalArgumentException("Date range must be 7 days or fewer");
        }
        return service.asteroids(s.toString(), e.toString());
    }
}
