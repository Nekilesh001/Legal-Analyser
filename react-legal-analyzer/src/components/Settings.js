import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Download,
  Trash2,
  AlertTriangle
} from 'lucide-react';

import { useAnalysis } from '../contexts/AnalysisContext';

const Settings = () => {
  const { analysesHistory } = useAnalysis();
  const [settings, setSettings] = useState({
    defaultContractType: 'auto',
    analysisDepth: 'comprehensive',
    language: 'en',
    exportFormat: 'json',
    enableOCR: true,
    ocrLanguages: ['English', 'Hindi'],
    notifications: {
      analysisComplete: true,
      highRiskAlerts: true,
      weeklyReports: false
    },
    privacy: {
      storeAnalysisHistory: true,
      shareAnonymousData: false
    }
  });
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('legalAnalyzerSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleOCRLanguageToggle = (language) => {
    const currentLanguages = settings.ocrLanguages;
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(lang => lang !== language)
      : [...currentLanguages, language];
    
    handleSettingChange('ocrLanguages', newLanguages);
  };

  const saveSettings = () => {
    localStorage.setItem('legalAnalyzerSettings', JSON.stringify(settings));
    setHasChanges(false);
    alert('Settings saved successfully!');
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      const defaultSettings = {
        defaultContractType: 'auto',
        analysisDepth: 'comprehensive',
        language: 'en',
        exportFormat: 'json',
        enableOCR: true,
        ocrLanguages: ['English', 'Hindi'],
        notifications: {
          analysisComplete: true,
          highRiskAlerts: true,
          weeklyReports: false
        },
        privacy: {
          storeAnalysisHistory: true,
          shareAnonymousData: false
        }
      };
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  const clearAllData = () => {
    if (window.confirm('This will delete all your analysis history and settings. This action cannot be undone. Are you sure?')) {
      localStorage.clear();
      // Clear IndexedDB
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('LegalAnalyzerDB');
        indexedDB.deleteDatabase('LegalKnowledgeBase');
      }
      alert('All data cleared successfully. Please refresh the page.');
    }
  };

  const exportAllData = () => {
    const exportData = {
      settings,
      analysisHistory: analysesHistory,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `legal_analyzer_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'analysis', label: 'Analysis', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Database }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' }
  ];

  const ocrLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Marathi', 'Punjabi'];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <SettingsIcon className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-lg text-gray-600">
          Customize your Legal Contract Analyzer experience
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interface Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Export Format
                    </label>
                    <select
                      value={settings.exportFormat}
                      onChange={(e) => handleSettingChange('exportFormat', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Settings */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Analysis Preferences</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Contract Type
                    </label>
                    <select
                      value={settings.defaultContractType}
                      onChange={(e) => handleSettingChange('defaultContractType', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="auto">Auto-detect</option>
                      <option value="employment">Employment Contract</option>
                      <option value="vendor">Vendor Agreement</option>
                      <option value="lease">Lease Agreement</option>
                      <option value="service">Service Agreement</option>
                      <option value="general">General Contract</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Analysis Depth
                    </label>
                    <select
                      value={settings.analysisDepth}
                      onChange={(e) => handleSettingChange('analysisDepth', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="basic">Basic Analysis</option>
                      <option value="comprehensive">Comprehensive Analysis</option>
                      <option value="detailed">Detailed Legal Review</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">OCR Settings</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableOCR}
                        onChange={(e) => handleSettingChange('enableOCR', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable OCR for scanned documents</span>
                    </label>
                    
                    {settings.enableOCR && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          OCR Languages
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {ocrLanguages.map((lang) => (
                            <label key={lang} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.ocrLanguages.includes(lang)}
                                onChange={() => handleOCRLanguageToggle(lang)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-xs text-gray-700">{lang}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">Analysis Complete</span>
                      <p className="text-sm text-gray-600">Get notified when contract analysis is finished</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.analysisComplete}
                      onChange={(e) => handleSettingChange('notifications.analysisComplete', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">High Risk Alerts</span>
                      <p className="text-sm text-gray-600">Get alerted when high-risk contracts are detected</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.highRiskAlerts}
                      onChange={(e) => handleSettingChange('notifications.highRiskAlerts', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">Weekly Reports</span>
                      <p className="text-sm text-gray-600">Receive weekly analysis summary reports</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.weeklyReports}
                      onChange={(e) => handleSettingChange('notifications.weeklyReports', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Privacy & Data */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Privacy & Data Settings</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">Store Analysis History</span>
                      <p className="text-sm text-gray-600">Keep your analysis history in local browser storage</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.privacy.storeAnalysisHistory}
                      onChange={(e) => handleSettingChange('privacy.storeAnalysisHistory', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">Share Anonymous Usage Data</span>
                      <p className="text-sm text-gray-600">Help improve the service by sharing anonymous usage statistics</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.privacy.shareAnonymousData}
                      onChange={(e) => handleSettingChange('privacy.shareAnonymousData', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Data Privacy Notice</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        All contract data is processed locally in your browser. We do not transmit or store your contract content on our servers. Your data remains private and secure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Advanced Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Export All Data</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Download a backup of all your settings and analysis history
                        </p>
                        <button
                          onClick={exportAllData}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4" />
                          <span>Export Data</span>
                        </button>
                      </div>
                      
                      <div className="border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-900 mb-2">Clear All Data</h4>
                        <p className="text-sm text-red-600 mb-3">
                          Permanently delete all settings, analysis history, and knowledge base data
                        </p>
                        <button
                          onClick={clearAllData}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Clear All Data</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Analysis History:</span>
                          <p className="text-gray-600">{analysesHistory.length} analyses stored</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Storage Used:</span>
                          <p className="text-gray-600">~{Math.round(JSON.stringify(analysesHistory).length / 1024)} KB</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Browser Storage:</span>
                          <p className="text-gray-600">IndexedDB + LocalStorage</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-800">Danger Zone</h4>
                        <p className="text-sm text-red-700 mt-1">
                          These actions are irreversible. Please proceed with caution.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex space-x-4">
                <button
                  onClick={saveSettings}
                  disabled={!hasChanges}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium ${
                    hasChanges
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
                
                <button
                  onClick={resetSettings}
                  className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset to Defaults</span>
                </button>
              </div>
              
              {hasChanges && (
                <span className="text-sm text-orange-600 font-medium">
                  You have unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;