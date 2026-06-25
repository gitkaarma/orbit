package com.orbit.model;

/** A saved favorite returned to the client. {@code addedAt} is an ISO-8601 instant. */
public record FavoriteDto(
        String itemType,
        String externalId,
        String title,
        String imageUrl,
        String sourceUrl,
        String addedAt) {
}
