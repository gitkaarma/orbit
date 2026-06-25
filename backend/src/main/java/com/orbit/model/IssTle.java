package com.orbit.model;

/** Two-line element set for the ISS. The client propagates the live position from this. */
public record IssTle(String name, String line1, String line2) {
}
