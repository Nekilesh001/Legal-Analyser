import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  FileText,
  Download,
  Calendar,
  Filter,
  AlertTriangle,
  CheckCircle,
  Activity,
  Users,
  Clock
} from 'lucide-react';

import { useAnalysis } from '../contexts/AnalysisContext';

const Reports = () => {
  const { analysesHistory, getAnalyticsData } = useAnalysis();
  const [dateRange, setDateRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('risk');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const data = getAnalyticsData();
    setAnalytics(data);
  }, [analysesHistory, getAnalyticsData]);

  const generateReport = (format) => {
    if (!analytics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      summary: {
        totalAnalyses: analytics.totalAnalyses,
        averageRiskScore: analytics.averageRiskScore,
        highRiskContracts: analysesHistory.filter(a => a.analysis?.overallRiskScore >= 7).length,
        complianceRate: Math.round((analysesHistory.filter(a => a.analysis?.complianceCheck?.overallScore >= 70).length / analytics.totalAnalyses) * 100) || 0
      },
      contractTypeDistribution: analytics.contractTypeDistribution,
      riskTrends: analytics.riskTrends,
      monthlyAnalyses: analytics.monthlyAnalyses
    };

    let content, mimeType, filename;

    if (format === 'json') {
      content = JSON.stringify(reportData, null, 2);
      mimeType = 'application/json';
      filename = `legal_analysis_report_${new Date().toISOString().split('T')[0]}.json`;
    } else if (format === 'csv') {
      const csvHeaders = ['Date', 'Contract Type', 'Risk Score', 'Compliance Score', 'File Name'];
      const csvRows = analysesHistory.map(analysis => [
        new Date(analysis.timestamp).toLocaleDateString(),
        analysis.contractInfo?.type || 'Unknown',
        analysis.analysis?.overallRiskScore || 0,
        analysis.analysis?.complianceCheck?.overallScore || 0,
        analysis.fileMetadata?.fileName || analysis.id
      ]);
      
      content = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      mimeType = 'text/csv';
      filename = `legal_analysis_report_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFilteredAnalyses = () => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return analysesHistory.filter(analysis => 
      new Date(analysis.timestamp) >= cutoffDate
    );
  };

  const filteredAnalyses = getFilteredAnalyses();
  const highRiskCount = filteredAnalyses.filter(a => a.analysis?.overallRiskScore >= 7).length;
  const mediumRiskCount = filteredAnalyses.filter(a => a.analysis?.overallRiskScore >= 4 && a.analysis?.overallRiskScore < 7).length;
  const lowRiskCount = filteredAnalyses.filter(a => a.analysis?.overallRiskScore < 4).length;
  const avgRiskScore = filteredAnalyses.length > 0 
    ? filteredAnalyses.reduce((sum, a) => sum + (a.analysis?.overallRiskScore || 0), 0) / filteredAnalyses.length 
    : 0;
  const complianceRate = filteredAnalyses.length > 0
    ? Math.round((filteredAnalyses.filter(a => a.analysis?.complianceCheck?.overallScore >= 70).length / filteredAnalyses.length) * 100)
    : 0;

  // Contract type distribution for filtered data
  const contractTypeDistribution = filteredAnalyses.reduce((acc, analysis) => {
    const type = analysis.contractInfo?.type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const totalContracts = Object.values(contractTypeDistribution).reduce((sum, count) => sum + count, 0);

  // Risk trend data (last 7 days)
  const riskTrendData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayAnalyses = filteredAnalyses.filter(a => {
      const analysisDate = new Date(a.timestamp);
      return analysisDate.toDateString() === date.toDateString();
    });
    
    const avgRisk = dayAnalyses.length > 0
      ? dayAnalyses.reduce((sum, a) => sum + (a.analysis?.overallRiskScore || 0), 0) / dayAnalyses.length
      : 0;
    
    riskTrendData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      risk: Math.round(avgRisk * 10) / 10,
      count: dayAnalyses.length
    });
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <BarChart3 className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        </div>
        <p className="text-lg text-gray-600">
          Comprehensive insights into your contract analysis data
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="risk">Risk Analysis</option>
                <option value="compliance">Compliance</option>
                <option value="volume">Analysis Volume</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('csv')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => generateReport('json')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900">{filteredAnalyses.length}</p>
              <p className="text-sm text-gray-500 mt-1">
                Last {dateRange} days
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(avgRiskScore * 10) / 10}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {avgRiskScore < 5 ? '↓ Low risk' : avgRiskScore < 7 ? '→ Medium risk' : '↑ High risk'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-red-600">{highRiskCount}</p>
              <p className="text-sm text-gray-500 mt-1">
                {filteredAnalyses.length > 0 ? Math.round((highRiskCount / filteredAnalyses.length) * 100) : 0}% of total
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-bold text-green-600">{complianceRate}%</p>
              <p className="text-sm text-gray-500 mt-1">
                Above 70% threshold
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Types Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Contract Types Distribution</h3>
          
          {totalContracts > 0 ? (
            <div className="space-y-4">
              {Object.entries(contractTypeDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => {
                  const percentage = Math.round((count / totalContracts) * 100);
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          type === 'employment' ? 'bg-blue-500' :
                          type === 'vendor' ? 'bg-green-500' :
                          type === 'lease' ? 'bg-orange-500' :
                          type === 'service' ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-900 capitalize">{type}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              type === 'employment' ? 'bg-blue-500' :
                              type === 'vendor' ? 'bg-green-500' :
                              type === 'lease' ? 'bg-orange-500' :
                              type === 'service' ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {count} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          ) : (
            <div className="text-center py-8">
              <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No data available for selected period</p>
            </div>
          )}
        </div>
        
        {/* Risk Trends */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Trends (Last 7 Days)</h3>
          
          {riskTrendData.some(d => d.count > 0) ? (
            <div className="space-y-4">
              {riskTrendData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-16">{data.date}</span>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            data.risk >= 7 ? 'bg-red-500' :
                            data.risk >= 4 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${(data.risk / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">
                        {data.risk}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {data.count} {data.count === 1 ? 'analysis' : 'analyses'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No analysis data for the last 7 days</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm text-gray-600">High Risk (7-10)</span>
              </div>
              <span className="text-sm font-medium">{highRiskCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-sm text-gray-600">Medium Risk (4-6)</span>
              </div>
              <span className="text-sm font-medium">{mediumRiskCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">Low Risk (0-3)</span>
              </div>
              <span className="text-sm font-medium">{lowRiskCount}</span>
            </div>
          </div>
        </div>

        {/* Analysis Volume */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Volume</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Daily Average</span>
              <span className="text-sm font-medium">
                {Math.round((filteredAnalyses.length / parseInt(dateRange)) * 10) / 10}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Peak Day</span>
              <span className="text-sm font-medium">
                {riskTrendData.reduce((max, day) => day.count > max.count ? day : max, { count: 0, date: 'N/A' }).date}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Words Analyzed</span>
              <span className="text-sm font-medium">
                {filteredAnalyses.reduce((sum, a) => sum + (a.contractInfo?.wordCount || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Most Common Type</span>
              <span className="text-sm font-medium capitalize">
                {Object.entries(contractTypeDistribution).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Compliance</span>
              <span className="text-sm font-medium">{complianceRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Time Period</span>
              <span className="text-sm font-medium">Last {dateRange} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;