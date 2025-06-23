import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit, 
  Eye, 
  GitBranch, 
  Tag, 
  User, 
  Calendar, 
  Globe, 
  Lock,
  Play,
  Download,
  Share2,
  Star,
  TrendingUp,
  BarChart3,
  Settings
} from 'lucide-react';
import { strategyAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const StrategyView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [strategy, setStrategy] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStrategy();
    }
  }, [id]);

  const fetchStrategy = async () => {
    try {
      const response = await strategyAPI.getStrategy(id!);
      const strategyData = response.data;
      setStrategy(strategyData);
      setIsOwner(strategyData.createdByUsername === user?.username);
      
      // Parse the latest version configuration
      if (strategyData.versionSnapshot) {
        try {
          const parsedConfig = JSON.parse(strategyData.versionSnapshot);
          setConfig(parsedConfig);
        } catch (error) {
          console.error('Failed to parse strategy configuration:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch strategy:', error);
      toast.error('Failed to load strategy');
      navigate('/dashboard/strategies');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/dashboard/strategies/edit/${id}`);
  };

  const handleBacktest = () => {
    navigate(`/dashboard/backtesting?strategy=${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-400 mb-2">Strategy Not Found</h2>
        <p className="text-gray-500">The strategy you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/strategies')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{strategy.name}</h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{strategy.createdByName}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(strategy.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <GitBranch className="h-4 w-4" />
                <span>Version {strategy.currentVersion}</span>
              </div>
              <div className="flex items-center space-x-1">
                {strategy.isPublic ? (
                  <>
                    <Globe className="h-4 w-4 text-green-400" />
                    <span className="text-green-400">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-gray-400" />
                    <span>Private</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBacktest}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <Play className="h-4 w-4" />
            <span>Backtest</span>
          </motion.button>

          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Strategy Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Description</h3>
                <p className="text-gray-300">
                  {strategy.description || config?.description || 'No description provided.'}
                </p>
              </div>

              {(strategy.tags || config?.tags) && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {(strategy.tags || config?.tags || []).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Strategy Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Complexity:</span>
                  <span className="text-white">{config?.metadata?.complexity || 'Medium'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Timeframe:</span>
                  <span className="text-white">{config?.metadata?.timeframe || '1h'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Indicators:</span>
                  <span className="text-white">{Object.keys(config?.indicators || {}).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry Rules:</span>
                  <span className="text-white">{config?.rules?.entryConditions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Exit Rules:</span>
                  <span className="text-white">{config?.rules?.exitConditions?.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Risk Management</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Stop Loss:</span>
                  <span className="text-white">{config?.rules?.riskManagement?.stopLoss || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Take Profit:</span>
                  <span className="text-white">{config?.rules?.riskManagement?.takeProfit || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Position Size:</span>
                  <span className="text-white">{config?.rules?.riskManagement?.positionSize || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Technical Configuration */}
      {config && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Indicators */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
              Technical Indicators
            </h2>

            {config.indicators && Object.keys(config.indicators).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(config.indicators).map(([name, settings]: [string, any]) => (
                  <div key={name} className="p-4 bg-gray-700/50 rounded-lg">
                    <h3 className="text-white font-medium mb-2">{name.toUpperCase()}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(settings).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="text-white">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No indicators configured</p>
              </div>
            )}
          </motion.div>

          {/* Trading Rules */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-green-400" />
              Trading Rules
            </h2>

            <div className="space-y-6">
              {/* Entry Conditions */}
              <div>
                <h3 className="text-green-400 font-medium mb-3">Entry Conditions</h3>
                {config.rules?.entryConditions && config.rules.entryConditions.length > 0 ? (
                  <div className="space-y-2">
                    {config.rules.entryConditions.map((condition: any, index: number) => (
                      <div key={index} className="p-3 bg-green-600/10 border border-green-500/20 rounded-lg">
                        <div className="text-sm text-white">
                          {typeof condition === 'object' ? (
                            <div>
                              <span className="font-medium">{condition.type || 'Custom Condition'}</span>
                              {condition.threshold && (
                                <span className="text-gray-300 ml-2">
                                  (Threshold: {condition.threshold})
                                </span>
                              )}
                            </div>
                          ) : (
                            condition
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No entry conditions defined</p>
                )}
              </div>

              {/* Exit Conditions */}
              <div>
                <h3 className="text-red-400 font-medium mb-3">Exit Conditions</h3>
                {config.rules?.exitConditions && config.rules.exitConditions.length > 0 ? (
                  <div className="space-y-2">
                    {config.rules.exitConditions.map((condition: any, index: number) => (
                      <div key={index} className="p-3 bg-red-600/10 border border-red-500/20 rounded-lg">
                        <div className="text-sm text-white">
                          {typeof condition === 'object' ? (
                            <div>
                              <span className="font-medium">{condition.type || 'Custom Condition'}</span>
                              {condition.threshold && (
                                <span className="text-gray-300 ml-2">
                                  (Threshold: {condition.threshold})
                                </span>
                              )}
                            </div>
                          ) : (
                            condition
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No exit conditions defined</p>
                )}
              </div>

              {/* Risk Management */}
              {config.rules?.riskManagement && (
                <div>
                  <h3 className="text-yellow-400 font-medium mb-3">Risk Management</h3>
                  <div className="p-4 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {Object.entries(config.rules.riskManagement).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="text-white">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Performance Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
          Performance Metrics
        </h2>
        
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Performance Data</h3>
          <p className="text-gray-500 mb-4">
            Run a backtest to see how this strategy performs against historical data.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBacktest}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg mx-auto"
          >
            <Play className="h-4 w-4" />
            <span>Run Backtest</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default StrategyView;