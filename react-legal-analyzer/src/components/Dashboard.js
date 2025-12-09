import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  BarChart3,
  Scale,
  Shield,
  Brain
} from 'lucide-react';

import { useAnalysis } from '../contexts/AnalysisContext';

const Dashboard = () => {
  const { analysesHistory, getAnalyticsData } = useAnalysis();
  const analytics = getAnalyticsData();

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, to, color }) => (
    <Link to={to}>
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer hover:scale-105">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600 text-sm mt-1">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );

  const recentAnalyses = analysesHistory.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Scale className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Legal Contract Analyzer</h1>
        </div>
        <p className="text-lg text-gray-600">Your contract analysis overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Analyses"
          value={analytics.totalAnalyses}
          icon={FileText}
          color="bg-blue-500"
          trend="+12% this month"
        />
        <StatCard
          title="Average Risk Score"
          value={analytics.averageRiskScore}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="High Risk Contracts"
          value={analysesHistory.filter(a => a.analysis?.overallRiskScore >= 7).length}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <StatCard
          title="Active Templates"
          value="12"
          icon={Clock}
          color="bg-purple-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Analyze New Contract"
            description="Upload and analyze a new contract document"
            icon={Plus}
            to="/analyzer"
            color="bg-blue-600"
          />
          <QuickActionCard
            title="View Templates"
            description="Browse contract templates and examples"
            icon={Eye}
            to="/templates"
            color="bg-green-600"
          />
          <QuickActionCard
            title="Generate Report"
            description="Create comprehensive analysis reports"
            icon={BarChart3}
            to="/reports"
            color="bg-purple-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          
          {recentAnalyses.length > 0 ? (
            <div className="space-y-4">
              {recentAnalyses.map((analysis, index) => (
                <div key={analysis.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {analysis.fileMetadata?.fileName || `Analysis ${analysis.id.slice(-8)}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {analysis.contractInfo?.type} • Risk: {analysis.analysis?.overallRiskScore}/10
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(analysis.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
              <Link
                to="/history"
                className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-4"
              >
                View all analyses →
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No analyses yet</p>
              <Link
                to="/analyzer"
                className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start your first analysis
              </Link>
            </div>
          )}
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Platform Features
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">AI-Powered Analysis</p>
                <p className="text-sm text-gray-600">Advanced contract risk assessment</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Legal Compliance</p>
                <p className="text-sm text-gray-600">Indian legal framework validation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Multi-format Support</p>
                <p className="text-sm text-gray-600">PDF, DOCX, TXT with OCR</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Detailed Reports</p>
                <p className="text-sm text-gray-600">Comprehensive analysis insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;