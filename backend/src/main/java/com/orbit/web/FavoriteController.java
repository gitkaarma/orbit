package com.orbit.web;

import com.orbit.model.FavoriteDto;
import com.orbit.service.FavoriteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Anonymous favorites keyed by a browser-generated {@code X-Client-Id} header. No login. */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService service;

    public FavoriteController(FavoriteService service) {
        this.service = service;
    }

    @GetMapping
    public List<FavoriteDto> list(@RequestHeader("X-Client-Id") String clientId) {
        return service.list(clientId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void add(@RequestHeader("X-Client-Id") String clientId, @Valid @RequestBody FavoriteRequest request) {
        service.add(clientId, request);
    }

    @DeleteMapping("/{itemType}/{externalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@RequestHeader("X-Client-Id") String clientId,
                       @PathVariable String itemType,
                       @PathVariable String externalId) {
        service.remove(clientId, itemType, externalId);
    }
}
