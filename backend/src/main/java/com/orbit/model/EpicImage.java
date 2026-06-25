package com.orbit.model;

/** A full-disk image of Earth from DSCOVR/EPIC, with the sub-satellite point. */
public record EpicImage(
        String identifier,
        String caption,
        String date,
        String imageUrl,
        String thumbUrl,
        double lat,
        double lon) {
}
