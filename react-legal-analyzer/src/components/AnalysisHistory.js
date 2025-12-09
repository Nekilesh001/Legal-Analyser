import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Eye,
  Download,
  Trash2,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  History,
  MoreVertical
} from 'lucide-react';

import { useAnalysis } from '../contexts/AnalysisContext';

const AnalysisHistory = () => {
  const { analysesHistory, deleteAnalysis, exportAnalysis, loadAnalysesHistory } = useAnalysis();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadAnalysesHistory();
  }, []);

  const filteredAnalyses = analysesHistory
    .filter(analysis => {
      const matchesSearch = 
        (analysis.fileMetadata?.fileName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !selectedType || analysis.contractInfo?.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.fileMetadata?.fileName || a.id;
          bValue = b.fileMetadata?.fileName || b.id;
          break;
        case 'type':
          aValue = a.contractInfo?.type || '';
          bValue = b.contractInfo?.type || '';
          break;
        case 'risk':
          aValue = a.analysis?.overallRiskScore || 0;
          bValue = b.analysis?.overallRiskScore || 0;
          break;
        case 'date':
        default:
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const contractTypes = [...new Set(analysesHistory.map(a => a.contractInfo?.type).filter(Boolean))];

  const getRiskColor = (score) => {
    if (score >= 7) return 'text-red-600 bg-red-100';
    if (score >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getRiskIcon = (score) => {
    if (score >= 7) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (score >= 4) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const handleDelete = async (analysisId) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await deleteAnalysis(analysisId);
        alert('Analysis deleted successfully');
      } catch (error) {
        console.error('Error deleting analysis:', error);
        alert('Error deleting analysis');
      }
    }
  };

  const handleExport = (analysis, format = 'json') => {
    try {
      exportAnalysis(analysis, format);
    } catch (error) {
      console.error('Error exporting analysis:', error);
      alert('Error exporting analysis');
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedAnalyses.length} analyses?`)) {
      try {
        for (const analysisId of selectedAnalyses) {
          await deleteAnalysis(analysisId);
        }
        setSelectedAnalyses([]);
        setShowBulkActions(false);
        alert('Analyses deleted successfully');
      } catch (error) {
        console.error('Error deleting analyses:', error);
        alert('Error deleting analyses');
      }
    }
  };

  const toggleSelectAnalysis = (analysisId) => {
    setSelectedAnalyses(prev => 
      prev.includes(analysisId)
        ? prev.filter(id => id !== analysisId)
        : [...prev, analysisId]
    );
  };

  const selectAllAnalyses = () => {
    if (selectedAnalyses.length === filteredAnalyses.length) {
      setSelectedAnalyses([]);
    } else {
      setSelectedAnalyses(filteredAnalyses.map(a => a.id));
    }
  };

  useEffect(() => {
    setShowBulkActions(selectedAnalyses.length > 0);
  }, [selectedAnalyses]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <History className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
        </div>
        <p className="text-lg text-gray-600">
          View and manage your contract analysis history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900">{analysesHistory.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-red-600">
                {analysesHistory.filter(a => a.analysis?.overallRiskScore >= 7).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Medium Risk</p>
              <p className="text-2xl font-bold text-orange-600">
                {analysesHistory.filter(a => a.analysis?.overallRiskScore >= 4 && a.analysis?.overallRiskScore < 7).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Risk</p>
              <p className="text-2xl font-bold text-green-600">
                {analysesHistory.filter(a => a.analysis?.overallRiskScore < 4).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search analyses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {contractTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="risk-desc">Highest Risk</option>
              <option value="risk-asc">Lowest Risk</option>
            </select>
          </div>
        </div>
        
        {showBulkActions && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedAnalyses.length} analyses selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedAnalyses([])}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Table */}
      {filteredAnalyses.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedAnalyses.length === filteredAnalyses.length}
                    onChange={selectAllAnalyses}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAnalyses.map((analysis) => (
                <tr key={analysis.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedAnalyses.includes(analysis.id)}
                      onChange={() => toggleSelectAnalysis(analysis.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {analysis.fileMetadata?.fileName || `Analysis ${analysis.id.slice(-8)}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {analysis.contractInfo?.wordCount?.toLocaleString()} words
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {analysis.contractInfo?.type || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getRiskIcon(analysis.analysis?.overallRiskScore || 0)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(analysis.analysis?.overallRiskScore || 0)}`}>
                        {analysis.analysis?.overallRiskScore || 0}/10
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{new Date(analysis.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(analysis.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/results/${analysis.id}`}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Analysis"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleExport(analysis, 'json')}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Export Analysis"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(analysis.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete Analysis"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis History</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedType
              ? 'No analyses match your search criteria'
              : 'You haven\'t performed any contract analyses yet'}
          </p>
          {!searchQuery && !selectedType && (
            <Link
              to="/analyzer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Start Your First Analysis
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;