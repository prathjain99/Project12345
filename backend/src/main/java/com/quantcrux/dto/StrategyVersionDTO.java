package com.quantcrux.dto;

import com.quantcrux.model.StrategyVersion;
import com.fasterxml.jackson.annotation.JsonRawValue;

import java.time.LocalDateTime;

public class StrategyVersionDTO {
    private Long id;
    private Long strategyId;
    private String strategyName;
    private Integer versionNumber;
    
    @JsonRawValue
    private String snapshotJson;
    
    private String changeSummary;
    private LocalDateTime createdAt;
    private String createdByUsername;
    private String createdByName;
    private boolean isCurrentVersion;

    // Constructors
    public StrategyVersionDTO() {}

    public StrategyVersionDTO(StrategyVersion version, boolean isCurrentVersion) {
        this.id = version.getId();
        this.strategyId = version.getStrategy().getId();
        this.strategyName = version.getStrategy().getName();
        this.versionNumber = version.getVersionNumber();
        this.snapshotJson = version.getSnapshotJson();
        this.changeSummary = version.getChangeSummary();
        this.createdAt = version.getCreatedAt();
        this.createdByUsername = version.getCreatedBy().getUsername();
        this.createdByName = version.getCreatedBy().getName();
        this.isCurrentVersion = isCurrentVersion;
    }

    // Static factory method
    public static StrategyVersionDTO fromVersion(StrategyVersion version, Integer currentVersion) {
        return new StrategyVersionDTO(version, version.getVersionNumber().equals(currentVersion));
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStrategyId() { return strategyId; }
    public void setStrategyId(Long strategyId) { this.strategyId = strategyId; }

    public String getStrategyName() { return strategyName; }
    public void setStrategyName(String strategyName) { this.strategyName = strategyName; }

    public Integer getVersionNumber() { return versionNumber; }
    public void setVersionNumber(Integer versionNumber) { this.versionNumber = versionNumber; }

    public String getSnapshotJson() { return snapshotJson; }
    public void setSnapshotJson(String snapshotJson) { this.snapshotJson = snapshotJson; }

    public String getChangeSummary() { return changeSummary; }
    public void setChangeSummary(String changeSummary) { this.changeSummary = changeSummary; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public boolean isCurrentVersion() { return isCurrentVersion; }
    public void setCurrentVersion(boolean currentVersion) { isCurrentVersion = currentVersion; }
}