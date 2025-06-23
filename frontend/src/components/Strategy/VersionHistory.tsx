import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  User, 
  GitBranch, 
  RotateCcw, 
  Eye, 
  Copy,
  Calendar,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { strategyAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface VersionHistoryProps {
  strategyId: string;
  currentVersion: number;
  onClose: () => void;
  onVersionRestore: (version: number) => void;
}

interface StrategyVersion {
  id: number;
  versionNumber: number;
  changeSummary: string;
  createdAt: string;
  createdByUsername: string;
  createdByName: string;
  isCurrentVersion: boolean;
  snapshotJson: string;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  strategyId,
  currentVersion,
  onClose,
  onVersionRestore
}) => {
  const [versions, setVersions] = useState<StrategyVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<StrategyVersion | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [strategyId]);

  const fetchVersions = async () => {
    try {
      const response = await strategyAPI.getVersions(strategyId);
      setVersions(response.data);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: number) => {
    if (!window.confirm(`Are you sure you want to restore to version ${version}? This will create a new version with the restored configuration.`)) {
      return;
    }

    setRestoring(version);
    try {
      await strategyAPI.restoreVersion(strategyId, version, {
        changeSummary: `Restored to version ${version}`
      });
      
      toast.success(`Successfully restored to version ${version}`);
      onVersionRestore(version);
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  const toggleExpanded = (versionNumber: number) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionNumber)) {
      newExpanded.delete(versionNumber);
    } else {
      newExpanded.add(versionNumber);
    }
    setExpandedVersions(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVersionConfig = (version: StrategyVersion) => {
    try {
      return JSON.parse(version.snapshotJson);
    } catch {
      return null;
    }
  };

  const getVersionSummary = (version: StrategyVersion) => {
    const config = getVersionConfig(version);
    if (!config) return 'Configuration unavailable';

    const indicators = Object.keys(config.indicators || {});
    const entryConditions = config.rules?.entryConditions?.length || 0;
    const exitConditions = config.rules?.exitConditions?.length || 0;

    return `${indicators.length} indicators, ${entryConditions} entry conditions, ${exitConditions} exit conditions`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                <GitBranch className="h-6 w-6 mr-2 text-blue-400" />
                Version History
              </h2>
              <p className="text-gray-400 mt-1">
                Current version: {currentVersion} • {versions.length} total versions
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-120px)]">
            {/* Version List */}
            <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {versions.map((version) => (
                    <motion.div
                      key={version.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedVersion?.id === version.id
                          ? 'border-blue-500 bg-blue-600/20'
                          : version.isCurrentVersion
                            ? 'border-green-500 bg-green-600/20'
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${
                              version.isCurrentVersion ? 'text-green-400' : 'text-white'
                            }`}>
                              Version {version.versionNumber}
                            </span>
                            {version.isCurrentVersion && (
                              <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                                Current
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-300 text-sm mt-1">
                            {version.changeSummary || 'No description provided'}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{version.createdByName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(version.createdAt)}</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-500 text-xs mt-1">
                            {getVersionSummary(version)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(version.versionNumber);
                            }}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            {expandedVersions.has(version.versionNumber) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          
                          {!version.isCurrentVersion && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(version.versionNumber);
                              }}
                              disabled={restoring === version.versionNumber}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                              title="Restore this version"
                            >
                              {restoring === version.versionNumber ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedVersions.has(version.versionNumber) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-gray-600"
                          >
                            <div className="text-xs text-gray-400 space-y-1">
                              <div>Version ID: {version.id}</div>
                              <div>Created by: {version.createdByUsername}</div>
                              <div>Timestamp: {version.createdAt}</div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Version Details */}
            <div className="w-1/2 overflow-y-auto">
              {selectedVersion ? (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Version {selectedVersion.versionNumber} Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Created by:</span>
                        <span className="text-white ml-2">{selectedVersion.createdByName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Created at:</span>
                        <span className="text-white ml-2">{formatDate(selectedVersion.createdAt)}</span>
                      </div>
                    </div>
                    {selectedVersion.changeSummary && (
                      <div className="mt-3">
                        <span className="text-gray-400">Changes:</span>
                        <p className="text-white mt-1">{selectedVersion.changeSummary}</p>
                      </div>
                    )}
                  </div>

                  {/* Configuration Preview */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">Configuration</h4>
                    
                    {(() => {
                      const config = getVersionConfig(selectedVersion);
                      if (!config) {
                        return (
                          <div className="text-gray-400 text-center py-8">
                            Configuration data unavailable
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {/* Basic Info */}
                          <div className="bg-gray-700/50 rounded-lg p-4">
                            <h5 className="text-white font-medium mb-2">Basic Information</h5>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-400">Name:</span>
                                <span className="text-white ml-2">{config.name}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Description:</span>
                                <span className="text-white ml-2">{config.description || 'No description'}</span>
                              </div>
                              {config.tags && config.tags.length > 0 && (
                                <div>
                                  <span className="text-gray-400">Tags:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {config.tags.map((tag: string, index: number) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Indicators */}
                          {config.indicators && (
                            <div className="bg-gray-700/50 rounded-lg p-4">
                              <h5 className="text-white font-medium mb-2">Indicators</h5>
                              <div className="space-y-2">
                                {Object.entries(config.indicators).map(([name, settings]: [string, any]) => (
                                  <div key={name} className="text-sm">
                                    <span className="text-blue-400 font-medium">{name.toUpperCase()}:</span>
                                    <span className="text-gray-300 ml-2">
                                      {JSON.stringify(settings, null, 0)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Rules */}
                          {config.rules && (
                            <div className="bg-gray-700/50 rounded-lg p-4">
                              <h5 className="text-white font-medium mb-2">Trading Rules</h5>
                              <div className="space-y-3 text-sm">
                                {config.rules.entryConditions && config.rules.entryConditions.length > 0 && (
                                  <div>
                                    <span className="text-green-400 font-medium">Entry Conditions:</span>
                                    <ul className="mt-1 space-y-1">
                                      {config.rules.entryConditions.map((condition: any, index: number) => (
                                        <li key={index} className="text-gray-300 ml-4">
                                          • {condition.type || JSON.stringify(condition)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {config.rules.exitConditions && config.rules.exitConditions.length > 0 && (
                                  <div>
                                    <span className="text-red-400 font-medium">Exit Conditions:</span>
                                    <ul className="mt-1 space-y-1">
                                      {config.rules.exitConditions.map((condition: any, index: number) => (
                                        <li key={index} className="text-gray-300 ml-4">
                                          • {condition.type || JSON.stringify(condition)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {config.rules.riskManagement && (
                                  <div>
                                    <span className="text-yellow-400 font-medium">Risk Management:</span>
                                    <div className="mt-1 text-gray-300 ml-4">
                                      {JSON.stringify(config.rules.riskManagement, null, 2)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Raw JSON (collapsed by default) */}
                          <details className="bg-gray-700/50 rounded-lg p-4">
                            <summary className="text-white font-medium cursor-pointer">
                              Raw Configuration (JSON)
                            </summary>
                            <pre className="mt-2 text-xs text-gray-300 overflow-x-auto">
                              {JSON.stringify(config, null, 2)}
                            </pre>
                          </details>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a version to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VersionHistory;