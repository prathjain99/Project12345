package com.quantcrux.controller;

import com.quantcrux.dto.MessageResponse;
import com.quantcrux.dto.StrategyVersionDTO;
import com.quantcrux.service.StrategyVersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, maxAge = 3600)
@RestController
@RequestMapping("/api/strategies")
public class StrategyVersionController {

    @Autowired
    private StrategyVersionService versionService;

    /**
     * Get all versions of a strategy
     */
    @GetMapping("/{strategyId}/versions")
    public ResponseEntity<List<StrategyVersionDTO>> getStrategyVersions(
            @PathVariable Long strategyId,
            Authentication authentication) {
        try {
            List<StrategyVersionDTO> versions = versionService.getStrategyVersions(strategyId, authentication.getName());
            return ResponseEntity.ok(versions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get a specific version of a strategy
     */
    @GetMapping("/{strategyId}/versions/{versionNumber}")
    public ResponseEntity<StrategyVersionDTO> getStrategyVersion(
            @PathVariable Long strategyId,
            @PathVariable Integer versionNumber,
            Authentication authentication) {
        try {
            StrategyVersionDTO version = versionService.getStrategyVersion(strategyId, versionNumber, authentication.getName());
            return ResponseEntity.ok(version);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Create a new version of a strategy
     */
    @PostMapping("/{strategyId}/versions")
    public ResponseEntity<?> createStrategyVersion(
            @PathVariable Long strategyId,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            String snapshotJson = (String) request.get("snapshotJson");
            String changeSummary = (String) request.get("changeSummary");

            if (snapshotJson == null || snapshotJson.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Snapshot JSON is required"));
            }

            StrategyVersionDTO version = versionService.createVersion(
                    strategyId, snapshotJson, changeSummary, authentication.getName());
            
            return ResponseEntity.ok(version);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to create version: " + e.getMessage()));
        }
    }

    /**
     * Get the latest version of a strategy
     */
    @GetMapping("/{strategyId}/versions/latest")
    public ResponseEntity<StrategyVersionDTO> getLatestVersion(
            @PathVariable Long strategyId,
            Authentication authentication) {
        try {
            StrategyVersionDTO version = versionService.getLatestVersion(strategyId, authentication.getName());
            return ResponseEntity.ok(version);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Restore strategy to a specific version
     */
    @PostMapping("/{strategyId}/versions/{versionNumber}/restore")
    public ResponseEntity<?> restoreToVersion(
            @PathVariable Long strategyId,
            @PathVariable Integer versionNumber,
            @RequestBody(required = false) Map<String, String> request,
            Authentication authentication) {
        try {
            String changeSummary = request != null ? request.get("changeSummary") : null;
            
            StrategyVersionDTO version = versionService.restoreToVersion(
                    strategyId, versionNumber, changeSummary, authentication.getName());
            
            return ResponseEntity.ok(version);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to restore version: " + e.getMessage()));
        }
    }

    /**
     * Compare two versions of a strategy
     */
    @GetMapping("/{strategyId}/versions/compare")
    public ResponseEntity<?> compareVersions(
            @PathVariable Long strategyId,
            @RequestParam Integer version1,
            @RequestParam Integer version2,
            Authentication authentication) {
        try {
            Map<String, Object> comparison = versionService.compareVersions(
                    strategyId, version1, version2, authentication.getName());
            
            return ResponseEntity.ok(comparison);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to compare versions: " + e.getMessage()));
        }
    }

    /**
     * Get version statistics for a strategy
     */
    @GetMapping("/{strategyId}/versions/statistics")
    public ResponseEntity<?> getVersionStatistics(
            @PathVariable Long strategyId,
            Authentication authentication) {
        try {
            Map<String, Object> statistics = versionService.getVersionStatistics(strategyId, authentication.getName());
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to get statistics: " + e.getMessage()));
        }
    }
}