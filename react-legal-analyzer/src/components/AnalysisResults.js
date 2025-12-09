import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  Share2,
  Scale,
  BookOpen,
  TrendingUp,
  Shield,
  Eye,
  ExternalLink
} from 'lucide-react';

import { useAnalysis } from '../contexts/AnalysisContext';

const AnalysisResults = () => {
  const { id } = useParams();
  const { getAnalysisById, exportAnalysis } = useAnalysis();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  const loadAnalysis = async () => {
    try {
      const result = await getAnalysisById(id);
      setAnalysis(result);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    if (analysis) {
      exportAnalysis(analysis, format);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 7) return 'text-red-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-green-600';
  };

  const getRiskLabel = (score) => {
    if (score >= 7) return 'High Risk';
    if (score >= 4) return 'Medium Risk';
    return 'Low Risk';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Not Found</h2>
        <p className="text-gray-600 mb-4">The requested analysis could not be found.</p>
        <Link to="/history" className="text-blue-600 hover:text-blue-700">
          View Analysis History →
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'risks', label: 'Risk Assessment', icon: AlertTriangle },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'knowledge', label: 'Legal References', icon: BookOpen }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Scale className="h-10 w-10 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {analysis.fileMetadata?.fileName || `Analysis ${analysis.id.slice(-8)}`}
              </h1>
              <p className="text-gray-600">
                {analysis.contractInfo?.type} • {new Date(analysis.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExport('json')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Risk Score Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getRiskColor(analysis.analysis.overallRiskScore)}`}>
                {analysis.analysis.overallRiskScore}/10
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {getRiskLabel(analysis.analysis.overallRiskScore)}
              </p>
            </div>
            
            <div className="h-16 w-px bg-gray-200" />
            
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.analysis.complianceCheck?.overallScore || 0}%
                </div>
                <p className="text-sm text-gray-600">Compliance</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analysis.analysis.riskAssessment?.length || 0}
                </div>
                <p className="text-sm text-gray-600">Issues Found</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.contractInfo?.wordCount || 0}
                </div>
                <p className="text-sm text-gray-600">Words</p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Overall Assessment</p>
            <p className="text-lg font-medium text-gray-900">
              {analysis.analysis.summary?.recommendation || 'Analysis completed'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contract Type:</span>
                      <span className="font-medium">{analysis.contractInfo?.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Language:</span>
                      <span className="font-medium">{analysis.contractInfo?.language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Word Count:</span>
                      <span className="font-medium">{analysis.contractInfo?.wordCount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">File Size:</span>
                      <span className="font-medium">
                        {analysis.fileMetadata?.fileSize ? 
                          `${(analysis.fileMetadata.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">
                      {analysis.analysis.summary?.overallAssessment || 'Analysis completed successfully'}
                    </p>
                  </div>
                  
                  {analysis.analysis.summary?.keyFindings && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Key Findings:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {analysis.analysis.summary.keyFindings.map((finding, index) => (
                          <li key={index}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Risk Assessment Tab */}
          {activeTab === 'risks' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Risk Assessment Details</h3>
              
              {analysis.analysis.riskAssessment && analysis.analysis.riskAssessment.length > 0 ? (
                <div className="space-y-4">
                  {analysis.analysis.riskAssessment.map((risk, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(risk.severity)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{risk.category}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                              risk.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {risk.severity} risk
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{risk.description}</p>
                          <p className="text-sm text-blue-600">{risk.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <p className="text-gray-600">No significant risks identified</p>
                </div>
              )}
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Compliance Analysis</h3>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-bold text-green-600">
                    {analysis.analysis.complianceCheck?.overallScore || 0}%
                  </span>
                </div>
              </div>
              
              {analysis.analysis.complianceCheck?.issues && analysis.analysis.complianceCheck.issues.length > 0 ? (
                <div className="space-y-4">
                  {analysis.analysis.complianceCheck.issues.map((issue, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-900">{issue.description}</h4>
                          <p className="text-sm text-red-700 mt-1">{issue.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <p className="text-gray-600">No compliance issues found</p>
                </div>
              )}
              
              {analysis.analysis.complianceCheck?.recommendations && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recommendations:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {analysis.analysis.complianceCheck.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Legal References Tab */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Legal References</h3>
              
              {analysis.analysis.knowledgeBaseReferences ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Relevant Laws */}
                  {analysis.analysis.knowledgeBaseReferences.relevantLaws && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Scale className="h-5 w-5 mr-2 text-blue-600" />
                        Relevant Laws
                      </h4>
                      <div className="space-y-3">
                        {analysis.analysis.knowledgeBaseReferences.relevantLaws.map((law, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900">{law.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{law.section}</p>
                            <p className="text-sm text-gray-700 mt-2">{law.content}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {law.tags?.map((tag, tagIndex) => (
                                <span key={tagIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Relevant Regulations */}
                  {analysis.analysis.knowledgeBaseReferences.relevantRegulations && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-600" />
                        Relevant Regulations
                      </h4>
                      <div className="space-y-3">
                        {analysis.analysis.knowledgeBaseReferences.relevantRegulations.map((reg, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900">{reg.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{reg.authority}</p>
                            <p className="text-sm text-gray-700 mt-2">{reg.content}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {reg.tags?.map((tag, tagIndex) => (
                                <span key={tagIndex} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No legal references available for this analysis</p>
                  <Link
                    to="/knowledge"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Browse Knowledge Base
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;