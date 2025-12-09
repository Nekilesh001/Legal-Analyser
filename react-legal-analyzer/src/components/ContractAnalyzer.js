import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle,
  Settings,
  Play,
  Eye,
  Scale
} from 'lucide-react';

import { useAnalysis } from '../contexts/AnalysisContext';
import { extractTextFromFile } from '../services/documentService';
import { analyzeContract } from '../services/legalAnalysisService';

const ContractAnalyzer = () => {
  const navigate = useNavigate();
  const { setLoading, saveAnalysis, setCurrentAnalysis } = useAnalysis();
  
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [analysisSettings, setAnalysisSettings] = useState({
    contractType: 'auto',
    analysisDepth: 'comprehensive',
    language: 'auto'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    setLoading(true);
    
    try {
      const extractionResult = await extractTextFromFile(file);
      setExtractedText(extractionResult.text);
      alert('Text extracted successfully!');
    } catch (error) {
      console.error('Text extraction failed:', error);
      alert('Error extracting text: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false,
    disabled: isAnalyzing
  });

  const startAnalysis = async () => {
    if (!extractedText.trim()) {
      alert('No text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setLoading(true);

    try {
      const analysisResult = await analyzeContract(extractedText, analysisSettings);
      
      analysisResult.fileMetadata = {
        fileName: uploadedFile?.name,
        fileSize: uploadedFile?.size,
        fileType: uploadedFile?.type,
        uploadedAt: new Date().toISOString()
      };

      const savedAnalysis = await saveAnalysis(analysisResult);
      setCurrentAnalysis(savedAnalysis);

      alert('Analysis completed successfully!');
      navigate(`/results/${savedAnalysis.id}`);

    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Scale className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Contract Analyzer</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload and analyze your legal contracts with AI-powered insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Contract Document
              </h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>

            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : uploadedFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              
              {uploadedFile ? (
                <div className="space-y-4">
                  <FileText className="mx-auto h-12 w-12 text-green-600" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {uploadedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">File uploaded successfully</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  {isDragActive ? (
                    <p className="text-lg text-blue-600">Drop the file here...</p>
                  ) : (
                    <div>
                      <p className="text-lg text-gray-600 mb-2">
                        Drag & drop your contract here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports: PDF, DOCX, TXT
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Extracted Text Preview */}
            {extractedText && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Extracted Text Preview
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Eye className="h-4 w-4" />
                    <span>{extractedText.split(' ').length} words</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {extractedText.substring(0, 500)}
                    {extractedText.length > 500 && '...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Analysis Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contract Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract Type
                  </label>
                  <select
                    value={analysisSettings.contractType}
                    onChange={(e) => setAnalysisSettings(prev => ({ 
                      ...prev, 
                      contractType: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="employment">Employment Contract</option>
                    <option value="vendor">Vendor Agreement</option>
                    <option value="lease">Lease Agreement</option>
                    <option value="service">Service Agreement</option>
                    <option value="general">General Contract</option>
                  </select>
                </div>

                {/* Analysis Depth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Analysis Depth
                  </label>
                  <select
                    value={analysisSettings.analysisDepth}
                    onChange={(e) => setAnalysisSettings(prev => ({ 
                      ...prev, 
                      analysisDepth: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">Basic Analysis</option>
                    <option value="comprehensive">Comprehensive Analysis</option>
                    <option value="detailed">Detailed Legal Review</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Panel */}
        <div className="space-y-6">
          {/* Document Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Document Info
            </h3>
            
            {uploadedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">File Size:</span>
                  <span className="text-sm font-medium">
                    {formatFileSize(uploadedFile.size)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium">
                    {uploadedFile.type.split('/')[1]?.toUpperCase()}
                  </span>
                </div>
                {extractedText && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Words:</span>
                      <span className="text-sm font-medium">
                        {extractedText.split(' ').length.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Characters:</span>
                      <span className="text-sm font-medium">
                        {extractedText.length.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Upload a document to see details
              </p>
            )}
          </div>

          {/* Start Analysis Button */}
          <button
            onClick={startAnalysis}
            disabled={!extractedText || isAnalyzing}
            className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
              !extractedText || isAnalyzing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Start Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractAnalyzer;