package com.orbit.web;

import com.orbit.model.SkyContext;
import com.orbit.provider.NarrationProvider;
import com.orbit.service.SkyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ExecutorService;

@RestController
@RequestMapping("/api/sky")
public class SkyController {

    private static final Logger log = LoggerFactory.getLogger(SkyController.class);

    private final SkyService sky;
    private final NarrationProvider narration;
    private final ExecutorService executor;

    public SkyController(SkyService sky, NarrationProvider narration, ExecutorService skyExecutor) {
        this.sky = sky;
        this.narration = narration;
        this.executor = skyExecutor;
    }

    /**
     * Streams the AI flight-director narration as Server-Sent Events. Each default event carries a
     * JSON {@code {"t":"…"}} text delta; a trailing {@code done} event closes the stream. The ISS
     * position is supplied by the client, which propagates the live position locally.
     */
    @GetMapping(value = "/brief", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter brief(@RequestParam double lat,
                            @RequestParam double lon,
                            @RequestParam(defaultValue = "0") double alt,
                            @RequestParam(defaultValue = "0") double speed,
                            @RequestParam(defaultValue = "true") boolean day) {
        SseEmitter emitter = new SseEmitter(120_000L);
        executor.execute(() -> {
            try {
                SkyContext ctx = sky.context(lat, lon, alt, speed, day);
                narration.stream(ctx, delta -> send(emitter, delta));
                emitter.send(SseEmitter.event().name("done").data("{}", MediaType.APPLICATION_JSON));
                emitter.complete();
            } catch (Exception e) {
                // Closing abnormally surfaces as a connection error on the EventSource client.
                log.warn("Narration stream failed: {}", e.getMessage());
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }

    private void send(SseEmitter emitter, String delta) {
        try {
            emitter.send(SseEmitter.event().data(new Chunk(delta), MediaType.APPLICATION_JSON));
        } catch (IOException e) {
            throw new NarrationAbort(e); // unchecked: cleanly aborts the streaming lambda on disconnect
        }
    }

    private static final class NarrationAbort extends RuntimeException {
        NarrationAbort(Throwable cause) {
            super(cause);
        }
    }

    record Chunk(String t) {
    }
}
