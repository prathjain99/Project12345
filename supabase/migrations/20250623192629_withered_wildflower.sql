/*
  # Strategy Versioning System

  1. New Tables
    - `strategy_versions`
      - `id` (bigserial, primary key)
      - `strategy_id` (bigint, foreign key to strategies)
      - `version_number` (integer, incremental version)
      - `snapshot_json` (jsonb, complete strategy configuration)
      - `change_summary` (text, description of changes)
      - `created_at` (timestamp)
      - `created_by` (bigint, foreign key to users)

  2. Schema Changes
    - Add `tags` column to existing `strategies` table
    - Add `current_version` column to track latest version
    - Add `is_public` column for public visibility

  3. Security
    - Enable RLS on `strategy_versions` table
    - Add policies for version access control

  4. Sample Data
    - Create sample strategy versions for demo
*/

-- Create strategy_versions table
CREATE TABLE IF NOT EXISTS strategy_versions (
    id BIGSERIAL PRIMARY KEY,
    strategy_id BIGINT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot_json JSONB NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NOT NULL REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT unique_strategy_version UNIQUE (strategy_id, version_number),
    CONSTRAINT chk_version_number_positive CHECK (version_number > 0)
);

-- Add new columns to strategies table
DO $$
BEGIN
    -- Add tags column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'strategies' AND column_name = 'tags'
    ) THEN
        ALTER TABLE strategies ADD COLUMN tags TEXT[];
    END IF;
    
    -- Add current_version column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'strategies' AND column_name = 'current_version'
    ) THEN
        ALTER TABLE strategies ADD COLUMN current_version INTEGER DEFAULT 1;
    END IF;
    
    -- Add is_public column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'strategies' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE strategies ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'strategies' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE strategies ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_strategy_versions_strategy_id ON strategy_versions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_versions_version_number ON strategy_versions(strategy_id, version_number);
CREATE INDEX IF NOT EXISTS idx_strategy_versions_created_at ON strategy_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_strategies_tags ON strategies USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_strategies_public ON strategies(is_public);
CREATE INDEX IF NOT EXISTS idx_strategies_updated_at ON strategies(updated_at);

-- Enable Row Level Security
ALTER TABLE strategy_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for strategy_versions
CREATE POLICY "Users can view versions of their own strategies"
    ON strategy_versions
    FOR SELECT
    TO authenticated
    USING (
        strategy_id IN (
            SELECT id FROM strategies WHERE user_id = auth.uid()::bigint
        )
    );

CREATE POLICY "Users can view versions of public strategies"
    ON strategy_versions
    FOR SELECT
    TO authenticated
    USING (
        strategy_id IN (
            SELECT id FROM strategies WHERE is_public = true
        )
    );

CREATE POLICY "Users can create versions for their own strategies"
    ON strategy_versions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        strategy_id IN (
            SELECT id FROM strategies WHERE user_id = auth.uid()::bigint
        )
        AND created_by = auth.uid()::bigint
    );

-- Function to create a new strategy version
CREATE OR REPLACE FUNCTION create_strategy_version(
    p_strategy_id BIGINT,
    p_snapshot_json JSONB,
    p_change_summary TEXT DEFAULT NULL,
    p_created_by BIGINT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    next_version INTEGER;
    version_id BIGINT;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO next_version
    FROM strategy_versions 
    WHERE strategy_id = p_strategy_id;
    
    -- Insert new version
    INSERT INTO strategy_versions (
        strategy_id, 
        version_number, 
        snapshot_json, 
        change_summary, 
        created_by
    ) VALUES (
        p_strategy_id,
        next_version,
        p_snapshot_json,
        p_change_summary,
        p_created_by
    ) RETURNING id INTO version_id;
    
    -- Update strategy's current version
    UPDATE strategies 
    SET current_version = next_version,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_strategy_id;
    
    RETURN version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get strategy with latest version
CREATE OR REPLACE FUNCTION get_strategy_with_latest_version(p_strategy_id BIGINT)
RETURNS TABLE (
    strategy_id BIGINT,
    name VARCHAR,
    description TEXT,
    tags TEXT[],
    is_public BOOLEAN,
    user_id BIGINT,
    username VARCHAR,
    user_name VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    current_version INTEGER,
    version_snapshot JSONB,
    version_created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.tags,
        s.is_public,
        s.user_id,
        u.username,
        u.name,
        s.created_at,
        s.updated_at,
        s.current_version,
        sv.snapshot_json,
        sv.created_at
    FROM strategies s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN strategy_versions sv ON s.id = sv.strategy_id AND sv.version_number = s.current_version
    WHERE s.id = p_strategy_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing strategies with initial versions
DO $$
DECLARE
    strategy_record RECORD;
    snapshot_json JSONB;
BEGIN
    FOR strategy_record IN 
        SELECT id, name, description, user_id, ema_short, ema_long, rsi_period, 
               macd_fast, macd_slow, macd_signal, entry_condition, exit_condition,
               stop_loss, take_profit, position_size, created_at
        FROM strategies 
        WHERE current_version IS NULL OR current_version = 1
    LOOP
        -- Create JSON snapshot of current strategy
        snapshot_json := jsonb_build_object(
            'name', strategy_record.name,
            'description', strategy_record.description,
            'indicators', jsonb_build_object(
                'ema_short', strategy_record.ema_short,
                'ema_long', strategy_record.ema_long,
                'rsi_period', strategy_record.rsi_period,
                'macd_fast', strategy_record.macd_fast,
                'macd_slow', strategy_record.macd_slow,
                'macd_signal', strategy_record.macd_signal
            ),
            'rules', jsonb_build_object(
                'entry_condition', strategy_record.entry_condition,
                'exit_condition', strategy_record.exit_condition,
                'stop_loss', strategy_record.stop_loss,
                'take_profit', strategy_record.take_profit,
                'position_size', strategy_record.position_size
            ),
            'metadata', jsonb_build_object(
                'created_at', strategy_record.created_at,
                'version_type', 'initial'
            )
        );
        
        -- Insert initial version if it doesn't exist
        INSERT INTO strategy_versions (
            strategy_id, 
            version_number, 
            snapshot_json, 
            change_summary, 
            created_by
        ) VALUES (
            strategy_record.id,
            1,
            snapshot_json,
            'Initial strategy version',
            strategy_record.user_id
        ) ON CONFLICT (strategy_id, version_number) DO NOTHING;
        
        -- Update strategy with version info
        UPDATE strategies 
        SET current_version = 1,
            tags = ARRAY['momentum', 'technical-analysis'],
            updated_at = CURRENT_TIMESTAMP
        WHERE id = strategy_record.id;
    END LOOP;
END $$;

-- Create sample RSI-based strategy with multiple versions
DO $$
DECLARE
    rsi_strategy_id BIGINT;
    researcher_user_id BIGINT;
    version1_json JSONB;
    version2_json JSONB;
    version3_json JSONB;
BEGIN
    -- Get researcher user ID
    SELECT id INTO researcher_user_id FROM users WHERE username = 'researcher1' LIMIT 1;
    
    IF researcher_user_id IS NOT NULL THEN
        -- Create RSI-based strategy
        INSERT INTO strategies (
            name, 
            description, 
            user_id, 
            tags,
            is_public,
            ema_short, 
            ema_long, 
            rsi_period, 
            entry_condition, 
            exit_condition, 
            stop_loss, 
            take_profit, 
            position_size,
            current_version
        ) VALUES (
            'RSI Mean Reversion Pro',
            'Advanced RSI-based mean reversion strategy with dynamic thresholds',
            researcher_user_id,
            ARRAY['rsi', 'mean-reversion', 'oversold', 'overbought'],
            true,
            10, 20, 14,
            'rsi_oversold',
            'rsi_overbought',
            3.0, 8.0, 1.0,
            3
        ) RETURNING id INTO rsi_strategy_id;
        
        -- Version 1: Basic RSI strategy
        version1_json := jsonb_build_object(
            'name', 'RSI Mean Reversion Pro',
            'description', 'Basic RSI mean reversion strategy',
            'tags', ARRAY['rsi', 'mean-reversion'],
            'indicators', jsonb_build_object(
                'rsi', jsonb_build_object(
                    'period', 14,
                    'oversold_threshold', 30,
                    'overbought_threshold', 70
                )
            ),
            'rules', jsonb_build_object(
                'entry_conditions', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'rsi_oversold',
                        'threshold', 30,
                        'action', 'buy'
                    )
                ),
                'exit_conditions', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'rsi_overbought',
                        'threshold', 70,
                        'action', 'sell'
                    )
                ),
                'risk_management', jsonb_build_object(
                    'stop_loss', 5.0,
                    'take_profit', 10.0,
                    'position_size', 1.0
                )
            ),
            'metadata', jsonb_build_object(
                'version_type', 'basic',
                'complexity', 'low'
            )
        );
        
        -- Version 2: Enhanced with multiple timeframes
        version2_json := jsonb_build_object(
            'name', 'RSI Mean Reversion Pro',
            'description', 'Enhanced RSI strategy with multiple timeframe analysis',
            'tags', ARRAY['rsi', 'mean-reversion', 'multi-timeframe'],
            'indicators', jsonb_build_object(
                'rsi_short', jsonb_build_object(
                    'period', 14,
                    'timeframe', '1h',
                    'oversold_threshold', 25,
                    'overbought_threshold', 75
                ),
                'rsi_long', jsonb_build_object(
                    'period', 21,
                    'timeframe', '4h',
                    'oversold_threshold', 30,
                    'overbought_threshold', 70
                ),
                'sma', jsonb_build_object(
                    'period', 50,
                    'timeframe', '1h'
                )
            ),
            'rules', jsonb_build_object(
                'entry_conditions', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'and',
                        'conditions', jsonb_build_array(
                            jsonb_build_object('indicator', 'rsi_short', 'operator', '<', 'value', 25),
                            jsonb_build_object('indicator', 'rsi_long', 'operator', '<', 'value', 40),
                            jsonb_build_object('price', 'close', 'operator', '>', 'indicator', 'sma')
                        ),
                        'action', 'buy'
                    )
                ),
                'exit_conditions', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'or',
                        'conditions', jsonb_build_array(
                            jsonb_build_object('indicator', 'rsi_short', 'operator', '>', 'value', 75),
                            jsonb_build_object('indicator', 'rsi_long', 'operator', '>', 'value', 60)
                        ),
                        'action', 'sell'
                    )
                ),
                'risk_management', jsonb_build_object(
                    'stop_loss', 3.0,
                    'take_profit', 8.0,
                    'position_size', 1.5,
                    'max_positions', 3
                )
            ),
            'metadata', jsonb_build_object(
                'version_type', 'enhanced',
                'complexity', 'medium'
            )
        );
        
        -- Version 3: Advanced with dynamic thresholds
        version3_json := jsonb_build_object(
            'name', 'RSI Mean Reversion Pro',
            'description', 'Advanced RSI-based mean reversion strategy with dynamic thresholds and volatility adjustment',
            'tags', ARRAY['rsi', 'mean-reversion', 'oversold', 'overbought', 'dynamic', 'volatility'],
            'indicators', jsonb_build_object(
                'rsi', jsonb_build_object(
                    'period', 14,
                    'timeframe', '1h',
                    'dynamic_thresholds', true
                ),
                'atr', jsonb_build_object(
                    'period', 14,
                    'timeframe', '1h'
                ),
                'bollinger_bands', jsonb_build_object(
                    'period', 20,
                    'std_dev', 2,
                    'timeframe', '1h'
                ),
                'volume_sma', jsonb_build_object(
                    'period', 20,
                    'timeframe', '1h'
                )
            ),
            'rules', jsonb_build_object(
                'entry_conditions', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'and',
                        'conditions', jsonb_build_array(
                            jsonb_build_object(
                                'indicator', 'rsi',
                                'operator', '<',
                                'dynamic_value', jsonb_build_object(
                                    'base', 30,
                                    'volatility_adjustment', true,
                                    'atr_multiplier', 0.5
                                )
                            ),
                            jsonb_build_object('price', 'close', 'operator', '<', 'indicator', 'bb_lower'),
                            jsonb_build_object('volume', 'current', 'operator', '>', 'indicator', 'volume_sma')
                        ),
                        'action', 'buy'
                    )
                ),
                'exit_conditions', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'or',
                        'conditions', jsonb_build_array(
                            jsonb_build_object(
                                'indicator', 'rsi',
                                'operator', '>',
                                'dynamic_value', jsonb_build_object(
                                    'base', 70,
                                    'volatility_adjustment', true,
                                    'atr_multiplier', -0.5
                                )
                            ),
                            jsonb_build_object('price', 'close', 'operator', '>', 'indicator', 'bb_upper')
                        ),
                        'action', 'sell'
                    )
                ),
                'risk_management', jsonb_build_object(
                    'stop_loss_type', 'dynamic',
                    'stop_loss_atr_multiplier', 2.0,
                    'take_profit_type', 'dynamic',
                    'take_profit_atr_multiplier', 3.0,
                    'position_sizing', jsonb_build_object(
                        'type', 'volatility_adjusted',
                        'base_size', 1.0,
                        'max_size', 2.0,
                        'volatility_lookback', 20
                    ),
                    'max_positions', 5,
                    'correlation_limit', 0.7
                )
            ),
            'metadata', jsonb_build_object(
                'version_type', 'advanced',
                'complexity', 'high',
                'features', jsonb_build_array(
                    'dynamic_thresholds',
                    'volatility_adjustment',
                    'multi_indicator',
                    'advanced_risk_management'
                )
            )
        );
        
        -- Insert versions with timestamps spread over time
        INSERT INTO strategy_versions (strategy_id, version_number, snapshot_json, change_summary, created_by, created_at) VALUES
        (rsi_strategy_id, 1, version1_json, 'Initial RSI strategy implementation', researcher_user_id, CURRENT_TIMESTAMP - INTERVAL '15 days'),
        (rsi_strategy_id, 2, version2_json, 'Added multi-timeframe analysis and enhanced entry/exit conditions', researcher_user_id, CURRENT_TIMESTAMP - INTERVAL '7 days'),
        (rsi_strategy_id, 3, version3_json, 'Implemented dynamic thresholds and advanced volatility-based risk management', researcher_user_id, CURRENT_TIMESTAMP - INTERVAL '1 day');
        
    END IF;
END $$;

-- Create view for strategy version history
CREATE OR REPLACE VIEW strategy_version_history AS
SELECT 
    sv.id as version_id,
    sv.strategy_id,
    s.name as strategy_name,
    sv.version_number,
    sv.change_summary,
    sv.created_at as version_created_at,
    u.username as created_by_username,
    u.name as created_by_name,
    sv.snapshot_json,
    CASE 
        WHEN sv.version_number = s.current_version THEN true 
        ELSE false 
    END as is_current_version
FROM strategy_versions sv
JOIN strategies s ON sv.strategy_id = s.id
JOIN users u ON sv.created_by = u.id
ORDER BY sv.strategy_id, sv.version_number DESC;

-- Display summary
SELECT 'Strategy versions created:' as info, COUNT(*) as count FROM strategy_versions;
SELECT 'Strategies with versions:' as info, COUNT(DISTINCT strategy_id) as count FROM strategy_versions;

-- Show sample version history
SELECT 
    strategy_name,
    version_number,
    change_summary,
    version_created_at,
    is_current_version
FROM strategy_version_history 
WHERE strategy_name = 'RSI Mean Reversion Pro'
ORDER BY version_number;

COMMIT;