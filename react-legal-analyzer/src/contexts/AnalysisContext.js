import React, { createContext, useContext, useReducer, useEffect } from 'react';
import Dexie from 'dexie';

// IndexedDB setup for persistent storage
const db = new Dexie('LegalAnalyzerDB');
db.version(1).stores({
  analyses: '++id, timestamp, contractType, riskScore, fileName',
  templates: '++id, name, type, content, createdAt',
  settings: 'key, value'
});

const AnalysisContext = createContext();

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_CURRENT_ANALYSIS: 'SET_CURRENT_ANALYSIS',
  ADD_ANALYSIS: 'ADD_ANALYSIS',
  UPDATE_ANALYSIS: 'UPDATE_ANALYSIS',
  DELETE_ANALYSIS: 'DELETE_ANALYSIS',
  SET_ANALYSES_HISTORY: 'SET_ANALYSES_HISTORY',
  SET_TEMPLATES: 'SET_TEMPLATES',
  ADD_TEMPLATE: 'ADD_TEMPLATE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_PROGRESS: 'SET_PROGRESS'
};

// Initial state
const initialState = {
  loading: false,
  currentAnalysis: null,
  analysesHistory: [],
  templates: [],
  error: null,
  progress: 0
};

// Reducer
const analysisReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_CURRENT_ANALYSIS:
      return { ...state, currentAnalysis: action.payload };
    
    case ACTIONS.ADD_ANALYSIS:
      return {
        ...state,
        analysesHistory: [action.payload, ...state.analysesHistory],
        currentAnalysis: action.payload
      };
    
    case ACTIONS.UPDATE_ANALYSIS:
      return {
        ...state,
        analysesHistory: state.analysesHistory.map(analysis =>
          analysis.id === action.payload.id ? action.payload : analysis
        ),
        currentAnalysis: state.currentAnalysis?.id === action.payload.id 
          ? action.payload 
          : state.currentAnalysis
      };
    
    case ACTIONS.DELETE_ANALYSIS:
      return {
        ...state,
        analysesHistory: state.analysesHistory.filter(analysis => analysis.id !== action.payload),
        currentAnalysis: state.currentAnalysis?.id === action.payload ? null : state.currentAnalysis
      };
    
    case ACTIONS.SET_ANALYSES_HISTORY:
      return { ...state, analysesHistory: action.payload };
    
    case ACTIONS.SET_TEMPLATES:
      return { ...state, templates: action.payload };
    
    case ACTIONS.ADD_TEMPLATE:
      return { ...state, templates: [action.payload, ...state.templates] };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ACTIONS.SET_PROGRESS:
      return { ...state, progress: action.payload };
    
    default:
      return state;
  }
};

// Provider component
export const AnalysisProvider = ({ children }) => {
  const [state, dispatch] = useReducer(analysisReducer, initialState);

  // Load data from IndexedDB on mount
  useEffect(() => {
    loadAnalysesHistory();
    loadTemplates();
  }, []);

  // Actions
  const setLoading = (loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
  };

  const setProgress = (progress) => {
    dispatch({ type: ACTIONS.SET_PROGRESS, payload: progress });
  };

  const setError = (error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  };

  const setCurrentAnalysis = (analysis) => {
    dispatch({ type: ACTIONS.SET_CURRENT_ANALYSIS, payload: analysis });
  };

  const saveAnalysis = async (analysis) => {
    try {
      const analysisWithId = {
        ...analysis,
        id: analysis.id || `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        savedAt: new Date().toISOString()
      };

      // Save to IndexedDB
      await db.analyses.put(analysisWithId);
      
      // Update state
      dispatch({ type: ACTIONS.ADD_ANALYSIS, payload: analysisWithId });
      
      return analysisWithId;
    } catch (error) {
      console.error('Error saving analysis:', error);
      setError('Failed to save analysis');
      throw error;
    }
  };

  const updateAnalysis = async (analysis) => {
    try {
      // Update in IndexedDB
      await db.analyses.put(analysis);
      
      // Update state
      dispatch({ type: ACTIONS.UPDATE_ANALYSIS, payload: analysis });
      
      return analysis;
    } catch (error) {
      console.error('Error updating analysis:', error);
      setError('Failed to update analysis');
      throw error;
    }
  };

  const deleteAnalysis = async (analysisId) => {
    try {
      // Delete from IndexedDB
      await db.analyses.delete(analysisId);
      
      // Update state
      dispatch({ type: ACTIONS.DELETE_ANALYSIS, payload: analysisId });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      setError('Failed to delete analysis');
      throw error;
    }
  };

  const loadAnalysesHistory = async () => {
    try {
      const analyses = await db.analyses.orderBy('timestamp').reverse().toArray();
      dispatch({ type: ACTIONS.SET_ANALYSES_HISTORY, payload: analyses });
    } catch (error) {
      console.error('Error loading analyses history:', error);
      setError('Failed to load analysis history');
    }
  };

  const getAnalysisById = async (id) => {
    try {
      const analysis = await db.analyses.get(id);
      return analysis;
    } catch (error) {
      console.error('Error getting analysis by ID:', error);
      setError('Failed to load analysis');
      throw error;
    }
  };

  const saveTemplate = async (template) => {
    try {
      const templateWithId = {
        ...template,
        id: template.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      };

      // Save to IndexedDB
      await db.templates.put(templateWithId);
      
      // Update state
      dispatch({ type: ACTIONS.ADD_TEMPLATE, payload: templateWithId });
      
      return templateWithId;
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
      throw error;
    }
  };

  const loadTemplates = async () => {
    try {
      const templates = await db.templates.orderBy('createdAt').reverse().toArray();
      dispatch({ type: ACTIONS.SET_TEMPLATES, payload: templates });
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Failed to load templates');
    }
  };

  const exportAnalysis = (analysis, format = 'json') => {
    try {
      let content, mimeType, filename;

      switch (format) {
        case 'json':
          content = JSON.stringify(analysis, null, 2);
          mimeType = 'application/json';
          filename = `analysis_${analysis.id}.json`;
          break;
        
        case 'pdf':
          // PDF export would require additional library like jsPDF
          throw new Error('PDF export not implemented yet');
        
        case 'csv':
          // Convert analysis to CSV format
          const csvData = convertAnalysisToCSV(analysis);
          content = csvData;
          mimeType = 'text/csv';
          filename = `analysis_${analysis.id}.csv`;
          break;
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting analysis:', error);
      setError('Failed to export analysis');
      throw error;
    }
  };

  const getAnalyticsData = () => {
    const { analysesHistory } = state;
    
    if (analysesHistory.length === 0) {
      return {
        totalAnalyses: 0,
        averageRiskScore: 0,
        contractTypeDistribution: {},
        riskTrends: [],
        monthlyAnalyses: []
      };
    }

    // Calculate analytics
    const totalAnalyses = analysesHistory.length;
    const averageRiskScore = analysesHistory.reduce((sum, analysis) => 
      sum + (analysis.analysis?.overallRiskScore || 0), 0) / totalAnalyses;

    // Contract type distribution
    const contractTypeDistribution = analysesHistory.reduce((acc, analysis) => {
      const type = analysis.contractInfo?.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Risk trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAnalyses = analysesHistory.filter(analysis => 
      new Date(analysis.timestamp) >= thirtyDaysAgo
    );

    const riskTrends = recentAnalyses.map(analysis => ({
      date: analysis.timestamp,
      riskScore: analysis.analysis?.overallRiskScore || 0,
      contractType: analysis.contractInfo?.type || 'unknown'
    }));

    // Monthly analyses count
    const monthlyAnalyses = analysesHistory.reduce((acc, analysis) => {
      const month = new Date(analysis.timestamp).toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAnalyses,
      averageRiskScore: Math.round(averageRiskScore * 10) / 10,
      contractTypeDistribution,
      riskTrends,
      monthlyAnalyses: Object.entries(monthlyAnalyses).map(([month, count]) => ({
        month,
        count
      }))
    };
  };

  const value = {
    // State
    ...state,
    
    // Actions
    setLoading,
    setProgress,
    setError,
    clearError,
    setCurrentAnalysis,
    saveAnalysis,
    updateAnalysis,
    deleteAnalysis,
    loadAnalysesHistory,
    getAnalysisById,
    saveTemplate,
    loadTemplates,
    exportAnalysis,
    getAnalyticsData
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
};

// Hook to use the context
export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};

// Utility function to convert analysis to CSV
const convertAnalysisToCSV = (analysis) => {
  const headers = [
    'Analysis ID',
    'Timestamp',
    'Contract Type',
    'Risk Score',
    'Word Count',
    'Language',
    'High Risk Items',
    'Medium Risk Items',
    'Compliance Score'
  ];

  const riskAssessment = analysis.analysis?.riskAssessment || [];
  const highRiskItems = riskAssessment.filter(risk => risk.riskLevel >= 7).length;
  const mediumRiskItems = riskAssessment.filter(risk => risk.riskLevel >= 4 && risk.riskLevel < 7).length;
  const complianceScore = analysis.analysis?.complianceCheck?.overallScore || 0;

  const row = [
    analysis.id,
    analysis.timestamp,
    analysis.contractInfo?.type || '',
    analysis.analysis?.overallRiskScore || 0,
    analysis.contractInfo?.wordCount || 0,
    analysis.contractInfo?.language || '',
    highRiskItems,
    mediumRiskItems,
    complianceScore
  ];

  return [headers.join(','), row.join(',')].join('\n');
};

export default AnalysisContext;