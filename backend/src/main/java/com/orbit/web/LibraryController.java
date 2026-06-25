package com.orbit.web;

import com.orbit.model.LibraryItem;
import com.orbit.service.SpaceService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/library")
@Validated
public class LibraryController {

    private final SpaceService service;

    public LibraryController(SpaceService service) {
        this.service = service;
    }

    /** Search the NASA Image and Video Library (images). */
    @GetMapping("/search")
    public List<LibraryItem> search(@RequestParam("q") @NotBlank String q,
                                    @RequestParam(defaultValue = "1") int page) {
        return service.searchLibrary(q, page);
    }
}
