package com.orbit.web;

import com.orbit.model.IssTle;
import com.orbit.service.SpaceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/iss")
public class IssController {

    private final SpaceService service;

    public IssController(SpaceService service) {
        this.service = service;
    }

    /** ISS orbital elements (TLE). The client propagates the live position from these. */
    @GetMapping("/tle")
    public IssTle tle() {
        return service.issTle();
    }
}
