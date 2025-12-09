import React, { useState } from 'react';
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  Upload,
  BarChart3,
  Settings,
  Shield,
  Zap,
  Users,
  Phone,
  ExternalLink
} from 'lucide-react';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState('getting-started');

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: Book },
    { id: 'analysis', label: 'Contract Analysis', icon: FileText },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: Settings },
    { id: 'legal', label: 'Legal & Compliance', icon: Shield }
  ];

  const faqs = {
    'getting-started': [
      {
        question: 'How do I upload a contract for analysis?',
        answer: 'Click on the "Analyzer" tab in the sidebar, then drag and drop your contract file or click to browse. We support PDF, DOCX, and TXT formats.'
      },
      {
        question: 'What contract types are supported?',
        answer: 'We support Employment Contracts, Vendor Agreements, Lease Agreements, Service Contracts, and General Contracts. The system can auto-detect the contract type or you can specify it manually.'
      },
      {
        question: 'How long does analysis take?',
        answer: 'Most contract analyses complete within 2-5 minutes, depending on the document size and complexity. You\'ll see a progress indicator during the analysis.'
      }
    ],
    'analysis': [
      {
        question: 'How is the risk score calculated?',
        answer: 'The risk score (0-10) is calculated based on multiple factors including clause analysis, compliance checks, legal precedents, and potential red flags identified in the contract.'
      },
      {
        question: 'What does the compliance check include?',
        answer: 'Our compliance check verifies adherence to Indian legal frameworks, identifies missing essential clauses, and flags potential legal issues based on our knowledge base of laws and regulations.'
      },
      {
        question: 'Can I customize analysis settings?',
        answer: 'Yes, you can select contract type, analysis depth (basic, comprehensive, detailed), and language preferences before starting the analysis.'
      }
    ],
    'features': [
      {
        question: 'How do I access the Knowledge Base?',
        answer: 'Click on "Knowledge Base" in the sidebar to browse laws, regulations, precedents, and legal glossary. You can search and filter by category.'
      },
      {
        question: 'Can I export analysis results?',
        answer: 'Yes, you can export analysis results in JSON or CSV format from the analysis results page or the history section.'
      },
      {
        question: 'How do contract templates work?',
        answer: 'Browse pre-built contract templates in the Templates section. You can preview, download, or copy templates for various contract types.'
      }
    ],
    'troubleshooting': [
      {
        question: 'My file upload is failing. What should I do?',
        answer: 'Ensure your file is under 10MB and in a supported format (PDF, DOCX, TXT). Check your internet connection and try again. Clear your browser cache if the issue persists.'
      },
      {
        question: 'The analysis seems stuck. How can I fix this?',
        answer: 'Refresh the page and try again. If the issue continues, the document might be too complex or corrupted. Try with a different document or contact support.'
      },
      {
        question: 'I can\'t see my analysis history. Where is it?',
        answer: 'Your analysis history is stored locally in your browser. If you\'ve cleared browser data or switched devices, the history may not be available. Consider exporting important analyses.'
      }
    ],
    'legal': [
      {
        question: 'Is the analysis legally binding?',
        answer: 'No, our analysis is for informational purposes only. Always consult with qualified legal professionals for binding legal advice and contract review.'
      },
      {
        question: 'How accurate is the legal analysis?',
        answer: 'Our AI provides comprehensive analysis based on Indian legal frameworks and best practices. However, it should supplement, not replace, professional legal review.'
      },
      {
        question: 'Is my contract data secure?',
        answer: 'Yes, all contract data is processed locally in your browser and stored in local browser storage. We do not transmit or store your contract content on our servers.'
      }
    ]
  };

  const guides = [
    {
      title: 'Quick Start Guide',
      description: 'Get up and running with contract analysis in 5 minutes',
      steps: [
        'Navigate to the Analyzer section',
        'Upload your contract document',
        'Configure analysis settings',
        'Review the analysis results',
        'Export or save your analysis'
      ],
      icon: Upload
    },
    {
      title: 'Understanding Risk Scores',
      description: 'Learn how to interpret risk assessments and compliance scores',
      steps: [
        'Risk scores range from 0 (low) to 10 (high)',
        'Compliance scores show adherence to legal standards',
        'Review detailed findings for specific issues',
        'Check legal references for context',
        'Consider professional legal review for high-risk contracts'
      ],
      icon: BarChart3
    },
    {
      title: 'Using the Knowledge Base',
      description: 'Explore laws, regulations, and legal precedents',
      steps: [
        'Browse by category (Laws, Regulations, Precedents)',
        'Use search to find specific legal information',
        'Filter by jurisdiction and legal area',
        'Add custom entries to expand the knowledge base',
        'Reference legal sources in your analysis'
      ],
      icon: Book
    }
  ];

  const filteredFaqs = searchQuery
    ? Object.entries(faqs).reduce((acc, [category, items]) => {
        const filtered = items.filter(
          item =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {})
    : { [activeCategory]: faqs[activeCategory] };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <HelpCircle className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions and learn how to make the most of the Legal Contract Analyzer
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Quick Start Guides */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Quick Start Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide, index) => {
            const Icon = guide.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <Icon className="h-8 w-8 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{guide.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{guide.description}</p>
                <ol className="space-y-2">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-sm text-gray-700 flex items-start">
                      <span className="inline-block w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        {stepIndex + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories */}
        {!searchQuery && (
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQ Content */}
        <div className={searchQuery ? 'lg:col-span-4' : 'lg:col-span-3'}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {searchQuery ? 'Search Results' : 'Frequently Asked Questions'}
            </h3>
            
            {Object.entries(filteredFaqs).map(([category, items]) => (
              <div key={category} className="space-y-4">
                {searchQuery && (
                  <h4 className="text-md font-medium text-gray-800 capitalize mb-3">
                    {categories.find(c => c.id === category)?.label}
                  </h4>
                )}
                
                {items.map((faq, index) => {
                  const faqIndex = `${category}-${index}`;
                  const isExpanded = expandedFaq === faqIndex;
                  
                  return (
                    <div key={faqIndex} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleFaq(faqIndex)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <p className="text-gray-700">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            
            {Object.keys(filteredFaqs).length === 0 && (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No results found for "{searchQuery}"</p>
                <p className="text-sm text-gray-400 mt-2">Try different keywords or browse categories</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold">Still Need Help?</h2>
          <p className="text-blue-100 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you with any questions or issues.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <MessageCircle className="h-8 w-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-blue-100 mb-4">Get instant help from our support team</p>
              <button className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                Start Chat
              </button>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <Mail className="h-8 w-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-blue-100 mb-4">Send us a detailed message</p>
              <button className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                Send Email
              </button>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <Phone className="h-8 w-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Phone Support</h3>
              <p className="text-sm text-blue-100 mb-4">Speak directly with our team</p>
              <button className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                Call Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="#"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Book className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">User Manual</p>
              <p className="text-sm text-gray-600">Comprehensive guide to all features</p>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </a>
          
          <a
            href="#"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Community Forum</p>
              <p className="text-sm text-gray-600">Connect with other users</p>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Help;