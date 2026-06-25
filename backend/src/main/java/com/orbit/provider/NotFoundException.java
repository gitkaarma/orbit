package com.orbit.provider;

/** The requested resource doesn't exist upstream (HTTP 404). Not retried. */
public class NotFoundException extends ProviderException {
    public NotFoundException(String message) {
        super(message);
    }
}
