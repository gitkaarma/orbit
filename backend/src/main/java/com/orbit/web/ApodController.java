package com.orbit.web;

import com.orbit.model.Apod;
import com.orbit.service.SpaceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/apod")
public class ApodController {

    private final SpaceService service;

    public ApodController(SpaceService service) {
        this.service = service;
    }

    /** Astronomy Picture of the Day. Omit {@code date} for today. */
    @GetMapping
    public Apod apod(@RequestParam(required = false) String date) {
        if (date != null && !date.isBlank()) {
            Dates.parse(date);
        }
        return service.apod(date);
    }

    /** A range of APODs (newest first) for the archive grid. Defaults to the last 12 days. */
    @GetMapping("/range")
    public List<Apod> range(@RequestParam(required = false) String start,
                            @RequestParam(required = false) String end) {
        LocalDate e = end == null || end.isBlank() ? LocalDate.now() : Dates.parse(end);
        LocalDate s = start == null || start.isBlank() ? e.minusDays(11) : Dates.parse(start);
        if (s.isAfter(e)) {
            throw new IllegalArgumentException("start must be on or before end");
        }
        return service.apodRange(s.toString(), e.toString());
    }
}
