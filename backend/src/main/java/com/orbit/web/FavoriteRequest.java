package com.orbit.web;

import jakarta.validation.constraints.NotBlank;

public record FavoriteRequest(
        @NotBlank String itemType,
        @NotBlank String externalId,
        String title,
        String imageUrl,
        String sourceUrl) {
}
