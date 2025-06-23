package com.quantcrux.controller;

import com.quantcrux.dto.StrategyCreateRequest;
import com.quantcrux.dto.StrategyDTO;
import com.quantcrux.model.Strategy;
import com.quantcrux.model.User;
import com.quantcrux.repository.StrategyRepository;
import com.quantcrux.repository.UserRepository;
import com.quantcrux.service.StrategyService;
import com.quantcrux.service.StrategyVersionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, maxAge = 3600)
@RestController
@RequestMapping("/api/strategies")
public class StrategyController {

    @Autowired
    private StrategyService strategyService;

    @Autowired
    private StrategyVersionService versionService;

    @Autowired
    private StrategyRepository strategyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Get all strategies for the authenticated user using DTO projection
     */
    @GetMapping
    public ResponseEntity<List<StrategyDTO>> getAllStrategies(Authentication authentication) {
        List<StrategyDTO> strategies = strategyService.getUserStrategies(authentication.getName());
        return ResponseEntity.ok(strategies);
    }

    /**
     * Create a new strategy with initial version
     */
    @PostMapping
    public ResponseEntity<Strategy> createStrategy(@Valid @RequestBody StrategyCreateRequest request, 
                                                 Authentication authentication) {
        try {
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Create the strategy entity
            Strategy strategy = new Strategy();
            strategy.setName(request.getName());
            strategy.setDescription(request.getDescription());
            strategy.setUser(user);
            
            // Set tags if provided
            if (request.getTags() != null && !request.getTags().isEmpty()) {
                // Convert tags list to array for PostgreSQL
                String[] tagsArray = request.getTags().toArray(new String[0]);
                // Note: This would need to be handled differently in the actual entity
                // For now, we'll store as a simple list in the assetList field as a workaround
                strategy.setAssetList(request.getTags());
            }
            
            // Set default indicator values (these would be overridden by the JSON config)
            if (strategy.getIndicators() == null) {
                strategy.setIndicators(new Strategy.Indicators());
            }
            if (strategy.getRules() == null) {
                strategy.setRules(new Strategy.Rules());
            }
            
            Strategy savedStrategy = strategyRepository.save(strategy);
            
            // Create initial version if configuration JSON is provided
            if (request.getConfigurationJson() != null && !request.getConfigurationJson().trim().isEmpty()) {
                try {
                    versionService.createVersion(
                        savedStrategy.getId(),
                        request.getConfigurationJson(),
                        request.getChangeSummary() != null ? request.getChangeSummary() : "Initial strategy version",
                        authentication.getName()
                    );
                } catch (Exception e) {
                    // Log error but don't fail the strategy creation
                    System.err.println("Failed to create initial version: " + e.getMessage());
                }
            }
            
            return ResponseEntity.ok(savedStrategy);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to create strategy: " + e.getMessage());
        }
    }

    /**
     * Get a specific strategy by ID using DTO projection with version data
     */
    @GetMapping("/{id}")
    public ResponseEntity<StrategyDTO> getStrategy(@PathVariable Long id, Authentication authentication) {
        try {
            // Get basic strategy data
            StrategyDTO strategy = strategyService.getStrategy(authentication.getName(), id);
            
            // Try to get the latest version data
            try {
                var latestVersion = versionService.getLatestVersion(id, authentication.getName());
                if (latestVersion != null) {
                    // Add version data to the strategy DTO
                    strategy.setCreatedAt(latestVersion.getCreatedAt());
                    // You might want to add a versionSnapshot field to StrategyDTO
                    // strategy.setVersionSnapshot(latestVersion.getSnapshotJson());
                }
            } catch (Exception e) {
                // Version data not available, continue with basic strategy data
                System.err.println("Could not load version data: " + e.getMessage());
            }
            
            return ResponseEntity.ok(strategy);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update an existing strategy (creates a new version)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStrategy(@PathVariable Long id,
                                          @Valid @RequestBody StrategyCreateRequest request,
                                          Authentication authentication) {
        try {
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Strategy strategy = strategyRepository.findByIdAndUserWithUser(id, user)
                    .orElseThrow(() -> new RuntimeException("Strategy not found"));
            
            // Update basic strategy information
            strategy.setName(request.getName());
            strategy.setDescription(request.getDescription());
            
            if (request.getTags() != null) {
                strategy.setAssetList(request.getTags()); // Temporary workaround
            }
            
            Strategy updatedStrategy = strategyRepository.save(strategy);
            
            // Create new version if configuration is provided
            if (request.getConfigurationJson() != null && !request.getConfigurationJson().trim().isEmpty()) {
                versionService.createVersion(
                    id,
                    request.getConfigurationJson(),
                    request.getChangeSummary() != null ? request.getChangeSummary() : "Updated strategy configuration",
                    authentication.getName()
                );
            }
            
            return ResponseEntity.ok(updatedStrategy);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update strategy: " + e.getMessage());
        }
    }

    /**
     * Delete a strategy
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStrategy(@PathVariable Long id, Authentication authentication) {
        try {
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Strategy strategy = strategyRepository.findByIdAndUserWithUser(id, user)
                    .orElseThrow(() -> new RuntimeException("Strategy not found"));
            
            strategyRepository.delete(strategy);
            
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete strategy: " + e.getMessage());
        }
    }
}