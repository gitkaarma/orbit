package com.orbit.service;

import com.orbit.domain.FavoriteItem;
import com.orbit.domain.FavoriteRepository;
import com.orbit.model.FavoriteDto;
import com.orbit.web.FavoriteRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteRepository repo;

    public FavoriteService(FavoriteRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public void add(String clientId, FavoriteRequest r) {
        if (!repo.existsByClientIdAndItemTypeAndExternalId(clientId, r.itemType(), r.externalId())) {
            repo.save(new FavoriteItem(clientId, r.itemType(), r.externalId(),
                    r.title(), r.imageUrl(), r.sourceUrl(), Instant.now()));
        }
    }

    @Transactional
    public void remove(String clientId, String itemType, String externalId) {
        repo.deleteByClientIdAndItemTypeAndExternalId(clientId, itemType, externalId);
    }

    @Transactional(readOnly = true)
    public List<FavoriteDto> list(String clientId) {
        return repo.findByClientIdOrderByCreatedAtDesc(clientId).stream()
                .map(f -> new FavoriteDto(f.getItemType(), f.getExternalId(), f.getTitle(),
                        f.getImageUrl(), f.getSourceUrl(), f.getCreatedAt().toString()))
                .toList();
    }
}
