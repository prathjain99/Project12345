package com.quantcrux.repository;

import com.quantcrux.model.StrategyVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StrategyVersionRepository extends JpaRepository<StrategyVersion, Long> {
    
    /**
     * Find all versions for a specific strategy ordered by version number descending
     */
    @Query("SELECT sv FROM StrategyVersion sv " +
           "JOIN FETCH sv.createdBy " +
           "WHERE sv.strategy.id = :strategyId " +
           "ORDER BY sv.versionNumber DESC")
    List<StrategyVersion> findByStrategyIdOrderByVersionNumberDesc(@Param("strategyId") Long strategyId);

    /**
     * Find a specific version of a strategy
     */
    @Query("SELECT sv FROM StrategyVersion sv " +
           "JOIN FETCH sv.createdBy " +
           "WHERE sv.strategy.id = :strategyId AND sv.versionNumber = :versionNumber")
    Optional<StrategyVersion> findByStrategyIdAndVersionNumber(@Param("strategyId") Long strategyId, 
                                                              @Param("versionNumber") Integer versionNumber);

    /**
     * Find the latest version of a strategy
     */
    @Query("SELECT sv FROM StrategyVersion sv " +
           "JOIN FETCH sv.createdBy " +
           "WHERE sv.strategy.id = :strategyId " +
           "ORDER BY sv.versionNumber DESC " +
           "LIMIT 1")
    Optional<StrategyVersion> findLatestVersionByStrategyId(@Param("strategyId") Long strategyId);

    /**
     * Get the next version number for a strategy
     */
    @Query("SELECT COALESCE(MAX(sv.versionNumber), 0) + 1 FROM StrategyVersion sv WHERE sv.strategy.id = :strategyId")
    Integer getNextVersionNumber(@Param("strategyId") Long strategyId);

    /**
     * Count versions for a strategy
     */
    @Query("SELECT COUNT(sv) FROM StrategyVersion sv WHERE sv.strategy.id = :strategyId")
    Long countByStrategyId(@Param("strategyId") Long strategyId);

    /**
     * Find versions created by a specific user
     */
    @Query("SELECT sv FROM StrategyVersion sv " +
           "JOIN FETCH sv.strategy s " +
           "JOIN FETCH sv.createdBy " +
           "WHERE sv.createdBy.id = :userId " +
           "ORDER BY sv.createdAt DESC")
    List<StrategyVersion> findByCreatedByIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}