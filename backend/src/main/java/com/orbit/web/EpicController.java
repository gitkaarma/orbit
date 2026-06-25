package com.orbit.web;

import com.orbit.model.EpicImage;
import com.orbit.service.SpaceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/epic")
public class EpicController {

    private final SpaceService service;

    public EpicController(SpaceService service) {
        this.service = service;
    }

    /** Latest full-disk images of Earth from DSCOVR/EPIC. */
    @GetMapping("/latest")
    public List<EpicImage> latest() {
        return service.epicLatest();
    }
}
