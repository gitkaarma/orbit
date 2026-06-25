package com.orbit.provider;

/** Base type for failures talking to an upstream provider (NASA, ISS). */
public abstract class ProviderException extends RuntimeException {
    protected ProviderException(String message) {
        super(message);
    }

    protected ProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
