package com.quantcrux.service;

import com.quantcrux.dto.StrategyVersionDTO;
import com.quantcrux.model.Strategy;
import com.quantcrux.model.StrategyVersion;
import com.quantcrux.model.User;
import com.quantcrux.repository.StrategyRepository;
import com.quantcrux.repository.StrategyVersionRepository;
import com.quantcrux.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class StrategyVersionService {

    @Autowired
    private StrategyVersionRepository versionRepository;

    @Autowired
    private StrategyRepository strategyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Create a new version of a strategy
     */
    public StrategyVersionDTO createVersion(Long strategyId, String snapshotJson, 
                                          String changeSummary, String username) {
        User user = getUserByUsername(username);
        Strategy strategy = getStrategyByIdAndUser(strategyId, user);

        // Get next version number
        Integer nextVersion = versionRepository.getNextVersionNumber(strategyId);

        // Create new version
        StrategyVersion version = new StrategyVersion(
            strategy, nextVersion, snapshotJson, changeSummary, user
        );

        StrategyVersion savedVersion = versionRepository.save(version);

        // Update strategy's current version
        strategy.setCurrentVersion(nextVersion);
        strategyRepository.save(strategy);

        return StrategyVersionDTO.fromVersion(savedVersion, nextVersion);
    }

    /**
     * Get all versions of a strategy
     */
    @Transactional(readOnly = true)
    public List<StrategyVersionDTO> getStrategyVersions(Long strategyId, String username) {
        User user = getUserByUsername(username);
        Strategy strategy = getStrategyByIdAndUser(strategyId, user);

        List<StrategyVersion> versions = versionRepository.findByStrategyIdOrderByVersionNumberDesc(strategyId);
        
        return versions.stream()
                .map(version -> StrategyVersionDTO.fromVersion(version, strategy.getCurrentVersion()))
                .collect(Collectors.toList());
    }

    /**
     * Get a specific version of a strategy
     */
    @Transactional(readOnly = true)
    public StrategyVersionDTO getStrategyVersion(Long strategyId, Integer versionNumber, String username) {
        User user = getUserByUsername(username);
        Strategy strategy = getStrategyByIdAndUser(strategyId, user);

        StrategyVersion version = versionRepository.findByStrategyIdAndVersionNumber(strategyId, versionNumber)
                .orElseThrow(() -> new RuntimeException("Strategy version not found"));

        return StrategyVersionDTO.fromVersion(version, strategy.getCurrentVersion());
    }

    /**
     * Get the latest version of a strategy
     */
    @Transactional(readOnly = true)
    public StrategyVersionDTO getLatestVersion(Long strategyId, String username) {
        User user = getUserByUsername(username);
        Strategy strategy = getStrategyByIdAndUser(strategyId, user);

        StrategyVersion version = versionRepository.findLatestVersionByStrategyId(strategyId)
                .orElseThrow(() -> new RuntimeException("No versions found for strategy"));

        return StrategyVersionDTO.fromVersion(version, strategy.getCurrentVersion());
    }

    /**
     * Restore a strategy to a specific version
     */
    public StrategyVersionDTO restoreToVersion(Long strategyId, Integer versionNumber, 
                                             String changeSummary, String username) {
        User user = getUserByUsername(username);
        Strategy strategy = getStrategyByIdAndUser(strategyId, user);

        // Get the version to restore
        StrategyVersion versionToRestore = versionRepository.findByStrategyIdAndVersionNumber(strategyId, versionNumber)
                .orElseThrow(() -> new RuntimeException("Strategy version not found"));

        // Create a new version with the restored configuration
        String restoredSnapshot = versionToRestore.getSnapshotJson();
        String restoreChangeSummary = changeSummary != null ? changeSummary : 
                "Restored to version " + versionNumber;

        return createVersion(strategyId, restoredSnapshot, restoreChangeSummary, username);
    }

    /**
     * Compare two versions of a strategy
     */
    @Transactional(readOnly = true)
    public Map<String, Object> compareVersions(Long strategyId, Integer version1, Integer version2, String username) {
        User user = getUserByUsername(username);
        getStrategyByIdAndUser(strategyId, user); // Verify access

        StrategyVersion v1 = versionRepository.findByStrategyIdAndVersionNumber(strategyId, version1)
                .orElseThrow(() -> new RuntimeException("Version " + version1 + " not found"));

        StrategyVersion v2 = versionRepository.findByStrategyIdAndVersionNumber(strategyId, version2)
                .orElseThrow(() -> new RuntimeException("Version " + version2 + " not found"));

        try {
            Map<String, Object> config1 = objectMapper.readValue(v1.getSnapshotJson(), Map.class);
            Map<String, Object> config2 = objectMapper.readValue(v2.getSnapshotJson(), Map.class);

            return Map.of(
                "version1", Map.of(
                    "number", v1.getVersionNumber(),
                    "createdAt", v1.getCreatedAt(),
                    "changeSummary", v1.getChangeSummary(),
                    "configuration", config1
                ),
                "version2", Map.of(
                    "number", v2.getVersionNumber(),
                    "createdAt", v2.getCreatedAt(),
                    "changeSummary", v2.getChangeSummary(),
                    "configuration", config2
                ),
                "differences", calculateDifferences(config1, config2)
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to compare versions: " + e.getMessage());
        }
    }

    /**
     * Get version statistics for a strategy
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getVersionStatistics(Long strategyId, String username) {
        User user = getUserByUsername(username);
        Strategy strategy = getStrategyByIdAndUser(strategyId, user);

        Long versionCount = versionRepository.countByStrategyId(strategyId);
        List<StrategyVersion> versions = versionRepository.findByStrategyIdOrderByVersionNumberDesc(strategyId);

        return Map.of(
            "totalVersions", versionCount,
            "currentVersion", strategy.getCurrentVersion(),
            "firstVersion", versions.isEmpty() ? null : versions.get(versions.size() - 1),
            "latestVersion", versions.isEmpty() ? null : versions.get(0),
            "versionsThisMonth", versions.stream()
                    .filter(v -> v.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusMonths(1)))
                    .count()
        );
    }

    // Private helper methods

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Strategy getStrategyByIdAndUser(Long strategyId, User user) {
        return strategyRepository.findByIdAndUserWithUser(strategyId, user)
                .orElseThrow(() -> new RuntimeException("Strategy not found or access denied"));
    }

    private Map<String, Object> calculateDifferences(Map<String, Object> config1, Map<String, Object> config2) {
        // Simple difference calculation - in a real implementation, this would be more sophisticated
        return Map.of(
            "hasChanges", !config1.equals(config2),
            "changedFields", findChangedFields(config1, config2),
            "summary", "Configuration comparison completed"
        );
    }

    private List<String> findChangedFields(Map<String, Object> config1, Map<String, Object> config2) {
        // Simplified field comparison - would need recursive comparison for nested objects
        return config1.keySet().stream()
                .filter(key -> !java.util.Objects.equals(config1.get(key), config2.get(key)))
                .collect(Collectors.toList());
    }
}