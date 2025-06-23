import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Save, 
  History, 
  Eye, 
  Settings, 
  Plus, 
  Trash2, 
  Copy,
  GitBranch,
  Clock,
  User,
  Tag,
  Globe,
  Lock
} from 'lucide-react';
import { strategyAPI } from '../../services/api';
import toast from 'react-hot-toast';
import VersionHistory from './VersionHistory';

interface StrategyConfig {
  name: string;
  description: string;
  tags: string[];
  isPublic: boolean;
  indicators: {
    [key: string]: any;
  };
  rules: {
    entryConditions: any[];
    exitConditions: any[];
    riskManagement: any;
  };
  metadata: {
    [key: string]: any;
  };
}

const StrategyEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [strategy, setStrategy] = useState<StrategyConfig>({
    name: '',
    description: '',
    tags: [],
    isPublic: false,
    indicators: {
      rsi: {
        period: 14,
        oversoldThreshold: 30,
        overboughtThreshold: 70
      }
    },
    rules: {
      entryConditions: [],
      exitConditions: [],
      riskManagement: {
        stopLoss: 5.0,
        takeProfit: 10.0,
        positionSize: 1.0
      }
    },
    metadata: {
      complexity: 'medium',
      timeframe: '1h'
    }
  });

  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchStrategy();
    }
  }, [id, isEditing]);

  const fetchStrategy = async () => {
    try {
      const response = await strategyAPI.getStrategy(id!);
      const strategyData = response.data;
      
      // If we have version data, use it; otherwise use the basic strategy data
      if (strategyData.versionSnapshot) {
        const config = JSON.parse(strategyData.versionSnapshot);
        setStrategy(config);
      } else {
        // Convert basic strategy data to our config format
        setStrategy({
          name: strategyData.name,
          description: strategyData.description || '',
          tags: strategyData.tags || [],
          isPublic: strategyData.isPublic || false,
          indicators: {
            rsi: {
              period: strategyData.rsiPeriod || 14,
              oversoldThreshold: 30,
              overboughtThreshold: 70
            },
            ema: {
              short: strategyData.emaShort || 10,
              long: strategyData.emaLong || 20
            },
            macd: {
              fast: strategyData.macdFast || 12,
              slow: strategyData.macdSlow || 26,
              signal: strategyData.macdSignal || 9
            }
          },
          rules: {
            entryConditions: [{
              type: strategyData.entryCondition || 'rsi_oversold',
              threshold: 30
            }],
            exitConditions: [{
              type: strategyData.exitCondition || 'rsi_overbought',
              threshold: 70
            }],
            riskManagement: {
              stopLoss: strategyData.stopLoss || 5.0,
              takeProfit: strategyData.takeProfit || 10.0,
              positionSize: strategyData.positionSize || 1.0
            }
          },
          metadata: {
            complexity: 'medium',
            timeframe: '1h'
          }
        });
      }
      
      setCurrentVersion(strategyData.currentVersion || 1);
    } catch (error) {
      console.error('Failed to fetch strategy:', error);
      toast.error('Failed to load strategy');
    }
  };

  const handleSave = async () => {
    if (!strategy.name.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }

    setSaving(true);
    try {
      const configJson = JSON.stringify(strategy, null, 2);
      
      if (isEditing) {
        // Create new version
        await strategyAPI.createVersion(id!, {
          snapshotJson: configJson,
          changeSummary: changeSummary || 'Updated strategy configuration'
        });
        toast.success('Strategy version saved successfully!');
        setChangeSummary('');
        setCurrentVersion(prev => prev + 1);
      } else {
        // Create new strategy
        const newStrategy = await strategyAPI.createStrategy({
          name: strategy.name,
          description: strategy.description,
          tags: strategy.tags,
          isPublic: strategy.isPublic,
          configurationJson: configJson,
          changeSummary: 'Initial strategy version'
        });
        
        toast.success('Strategy created successfully!');
        navigate(`/dashboard/strategies/edit/${newStrategy.data.id}`);
      }
    } catch (error) {
      toast.error('Failed to save strategy');
      console.error('Strategy save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !strategy.tags.includes(newTag.trim())) {
      setStrategy(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setStrategy(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addIndicator = (type: string) => {
    const defaultConfigs = {
      rsi: { period: 14, oversoldThreshold: 30, overboughtThreshold: 70 },
      sma: { period: 20 },
      ema: { period: 12 },
      macd: { fast: 12, slow: 26, signal: 9 },
      bollinger: { period: 20, stdDev: 2 },
      atr: { period: 14 }
    };

    setStrategy(prev => ({
      ...prev,
      indicators: {
        ...prev.indicators,
        [type]: defaultConfigs[type as keyof typeof defaultConfigs] || {}
      }
    }));
  };

  const removeIndicator = (type: string) => {
    setStrategy(prev => {
      const newIndicators = { ...prev.indicators };
      delete newIndicators[type];
      return {
        ...prev,
        indicators: newIndicators
      };
    });
  };

  const updateIndicator = (type: string, config: any) => {
    setStrategy(prev => ({
      ...prev,
      indicators: {
        ...prev.indicators,
        [type]: config
      }
    }));
  };

  const addCondition = (type: 'entry' | 'exit') => {
    const newCondition = {
      type: 'rsi_oversold',
      threshold: 30,
      action: type === 'entry' ? 'buy' : 'sell'
    };

    setStrategy(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [type === 'entry' ? 'entryConditions' : 'exitConditions']: [
          ...prev.rules[type === 'entry' ? 'entryConditions' : 'exitConditions'],
          newCondition
        ]
      }
    }));
  };

  const removeCondition = (type: 'entry' | 'exit', index: number) => {
    setStrategy(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [type === 'entry' ? 'entryConditions' : 'exitConditions']: 
          prev.rules[type === 'entry' ? 'entryConditions' : 'exitConditions'].filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">
            {isEditing ? 'Edit Strategy' : 'Create Strategy'}
          </h1>
          <p className="text-gray-400 mt-1">
            {isEditing ? `Version ${currentVersion}` : 'Design your quantitative trading strategy'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {isEditing && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowVersionHistory(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                <History className="h-4 w-4" />
                <span>Version History</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/dashboard/strategies/${id}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </motion.button>
            </>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Strategy'}</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Strategy Name</label>
              <input
                type="text"
                value={strategy.name}
                onChange={(e) => setStrategy(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter strategy name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={strategy.description}
                onChange={(e) => setStrategy(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 h-24"
                placeholder="Describe your strategy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {strategy.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-300 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Add tag"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Public Strategy</label>
              <button
                onClick={() => setStrategy(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  strategy.isPublic 
                    ? 'bg-green-600/20 text-green-400' 
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {strategy.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                <span>{strategy.isPublic ? 'Public' : 'Private'}</span>
              </button>
            </div>

            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Change Summary</label>
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your changes (optional)"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <GitBranch className="h-5 w-5 mr-2" />
              Technical Indicators
            </h3>
            <div className="relative">
              <select
                onChange={(e) => e.target.value && addIndicator(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                value=""
              >
                <option value="">Add Indicator</option>
                <option value="rsi">RSI</option>
                <option value="sma">SMA</option>
                <option value="ema">EMA</option>
                <option value="macd">MACD</option>
                <option value="bollinger">Bollinger Bands</option>
                <option value="atr">ATR</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(strategy.indicators).map(([type, config]) => (
              <div key={type} className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">{type.toUpperCase()}</h4>
                  <button
                    onClick={() => removeIndicator(type)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(config as any).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-400 mb-1">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </label>
                      <input
                        type="number"
                        value={value as number}
                        onChange={(e) => updateIndicator(type, {
                          ...config,
                          [key]: parseFloat(e.target.value) || 0
                        })}
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trading Rules */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Trading Rules
          </h3>

          <div className="space-y-6">
            {/* Entry Conditions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-green-400 font-medium">Entry Conditions</h4>
                <button
                  onClick={() => addCondition('entry')}
                  className="text-green-400 hover:text-green-300"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {strategy.rules.entryConditions.map((condition, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-green-600/10 rounded">
                    <select
                      value={condition.type}
                      onChange={(e) => {
                        const newConditions = [...strategy.rules.entryConditions];
                        newConditions[index] = { ...condition, type: e.target.value };
                        setStrategy(prev => ({
                          ...prev,
                          rules: { ...prev.rules, entryConditions: newConditions }
                        }));
                      }}
                      className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value="rsi_oversold">RSI Oversold</option>
                      <option value="rsi_overbought">RSI Overbought</option>
                      <option value="ema_cross_up">EMA Cross Up</option>
                      <option value="ema_cross_down">EMA Cross Down</option>
                      <option value="macd_bullish">MACD Bullish</option>
                      <option value="macd_bearish">MACD Bearish</option>
                    </select>
                    <button
                      onClick={() => removeCondition('entry', index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exit Conditions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-red-400 font-medium">Exit Conditions</h4>
                <button
                  onClick={() => addCondition('exit')}
                  className="text-red-400 hover:text-red-300"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {strategy.rules.exitConditions.map((condition, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-red-600/10 rounded">
                    <select
                      value={condition.type}
                      onChange={(e) => {
                        const newConditions = [...strategy.rules.exitConditions];
                        newConditions[index] = { ...condition, type: e.target.value };
                        setStrategy(prev => ({
                          ...prev,
                          rules: { ...prev.rules, exitConditions: newConditions }
                        }));
                      }}
                      className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value="rsi_oversold">RSI Oversold</option>
                      <option value="rsi_overbought">RSI Overbought</option>
                      <option value="ema_cross_up">EMA Cross Up</option>
                      <option value="ema_cross_down">EMA Cross Down</option>
                      <option value="macd_bullish">MACD Bullish</option>
                      <option value="macd_bearish">MACD Bearish</option>
                    </select>
                    <button
                      onClick={() => removeCondition('exit', index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Management */}
            <div>
              <h4 className="text-yellow-400 font-medium mb-3">Risk Management</h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Stop Loss (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={strategy.rules.riskManagement.stopLoss}
                    onChange={(e) => setStrategy(prev => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        riskManagement: {
                          ...prev.rules.riskManagement,
                          stopLoss: parseFloat(e.target.value) || 0
                        }
                      }
                    }))}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Take Profit (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={strategy.rules.riskManagement.takeProfit}
                    onChange={(e) => setStrategy(prev => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        riskManagement: {
                          ...prev.rules.riskManagement,
                          takeProfit: parseFloat(e.target.value) || 0
                        }
                      }
                    }))}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Position Size</label>
                  <input
                    type="number"
                    step="0.1"
                    value={strategy.rules.riskManagement.positionSize}
                    onChange={(e) => setStrategy(prev => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        riskManagement: {
                          ...prev.rules.riskManagement,
                          positionSize: parseFloat(e.target.value) || 0
                        }
                      }
                    }))}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Version History Modal */}
      {showVersionHistory && isEditing && (
        <VersionHistory
          strategyId={id!}
          currentVersion={currentVersion}
          onClose={() => setShowVersionHistory(false)}
          onVersionRestore={(version) => {
            setCurrentVersion(version);
            fetchStrategy();
            setShowVersionHistory(false);
          }}
        />
      )}
    </div>
  );
};

export default StrategyEditor;