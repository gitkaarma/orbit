package com.orbit.web;

/** Uniform error body. {@code retryable} tells the client whether a quick retry is reasonable. */
public record ApiError(String error, String message, boolean retryable) {
}
