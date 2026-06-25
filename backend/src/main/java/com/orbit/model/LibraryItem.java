package com.orbit.model;

import java.util.List;

/** A result from the NASA Image and Video Library search. */
public record LibraryItem(
        String nasaId,
        String title,
        String description,
        String dateCreated,
        String center,
        String thumbUrl,
        String imageUrl,
        List<String> keywords) {
}
