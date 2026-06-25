package com.orbit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/** A saved item (APOD, library image, EPIC, or asteroid) for an anonymous client. */
@Entity
@Table(
        name = "favorite_item",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_client_type_ext", columnNames = {"client_id", "item_type", "external_id"}),
        indexes = @Index(name = "idx_fav_client", columnList = "client_id"))
public class FavoriteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id", nullable = false, length = 64)
    private String clientId;

    @Column(name = "item_type", nullable = false, length = 24)
    private String itemType;

    @Column(name = "external_id", nullable = false, length = 256)
    private String externalId;

    @Column(length = 512)
    private String title;

    @Column(name = "image_url", length = 1024)
    private String imageUrl;

    @Column(name = "source_url", length = 1024)
    private String sourceUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FavoriteItem() {
    }

    public FavoriteItem(String clientId, String itemType, String externalId,
                        String title, String imageUrl, String sourceUrl, Instant createdAt) {
        this.clientId = clientId;
        this.itemType = itemType;
        this.externalId = externalId;
        this.title = title;
        this.imageUrl = imageUrl;
        this.sourceUrl = sourceUrl;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getItemType() {
        return itemType;
    }

    public String getExternalId() {
        return externalId;
    }

    public String getTitle() {
        return title;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
