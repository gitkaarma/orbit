package com.orbit.provider;

/** A transient upstream failure (5xx, network, timeout). Retried by the {@code upstream} retry instance. */
public class UpstreamException extends ProviderException {
    public UpstreamException(String message) {
        super(message);
    }

    public UpstreamException(String message, Throwable cause) {
        super(message, cause);
    }
}
