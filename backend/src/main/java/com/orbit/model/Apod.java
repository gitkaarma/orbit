package com.orbit.model;

/**
 * NASA Astronomy Picture of the Day. {@code mediaType} is "image" or "video".
 * For videos, {@code url} is the embeddable player and {@code thumbnailUrl} is a still frame;
 * for images the two are the same.
 */
public record Apod(
        String date,
        String title,
        String explanation,
        String mediaType,
        String url,
        String thumbnailUrl,
        String hdurl,
        String copyright) {
}
