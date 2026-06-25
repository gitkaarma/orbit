package com.orbit.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // each test rolls back, keeping the shared H2 clean
class FavoriteApiTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    private static final String BODY = """
            {"itemType":"library","externalId":"PIA1","title":"Dunes","imageUrl":"http://i/x.jpg","sourceUrl":"http://s"}""";

    @Test
    void savesAndListsForAClient() throws Exception {
        mvc.perform(post("/api/favorites").header("X-Client-Id", "c1")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/favorites").header("X-Client-Id", "c1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].itemType").value("library"))
                .andExpect(jsonPath("$[0].externalId").value("PIA1"))
                .andExpect(jsonPath("$[0].title").value("Dunes"));
    }

    @Test
    void savingTheSameItemTwiceIsIdempotent() throws Exception {
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/favorites").header("X-Client-Id", "c2")
                    .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isCreated());
        }
        mvc.perform(get("/api/favorites").header("X-Client-Id", "c2"))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void removesAnItem() throws Exception {
        mvc.perform(post("/api/favorites").header("X-Client-Id", "c3")
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isCreated());

        mvc.perform(delete("/api/favorites/library/PIA1").header("X-Client-Id", "c3"))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/favorites").header("X-Client-Id", "c3"))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void favoritesAreScopedToTheClientId() throws Exception {
        mvc.perform(post("/api/favorites").header("X-Client-Id", "owner")
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isCreated());

        mvc.perform(get("/api/favorites").header("X-Client-Id", "someone-else"))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void rejectsAMissingClientIdHeader() throws Exception {
        mvc.perform(get("/api/favorites")).andExpect(status().isBadRequest());
    }

    @Test
    void rejectsAnInvalidBody() throws Exception {
        mvc.perform(post("/api/favorites").header("X-Client-Id", "c4")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"missing required fields\"}"))
                .andExpect(status().isBadRequest());
    }
}
