package com.orbit.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FavoriteRepository extends JpaRepository<FavoriteItem, Long> {

    List<FavoriteItem> findByClientIdOrderByCreatedAtDesc(String clientId);

    boolean existsByClientIdAndItemTypeAndExternalId(String clientId, String itemType, String externalId);

    long deleteByClientIdAndItemTypeAndExternalId(String clientId, String itemType, String externalId);
}
