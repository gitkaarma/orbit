package com.orbit.provider;

/** The upstream provider rate-limited us (HTTP 429). Not retried. */
public class RateLimitException extends ProviderException {
    public RateLimitException(String message) {
        super(message);
    }
}
