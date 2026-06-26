package com.orbit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class AsyncConfig {

    /** Small daemon pool for SSE narration streams (each blocks while the model emits / the fallback paces). */
    @Bean(destroyMethod = "shutdown")
    ExecutorService skyExecutor() {
        return Executors.newFixedThreadPool(4, runnable -> {
            Thread thread = new Thread(runnable, "sky-brief");
            thread.setDaemon(true);
            return thread;
        });
    }
}
