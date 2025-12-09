import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Star
} from 'lucide-react';

import { useAnalysis } from '../contexts/AnalysisContext';

const ContractTemplates = () => {
  const { templates, saveTemplate, loadTemplates } = useAnalysis();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Built-in templates
  const builtInTemplates = [
    {
      id: 'employment-basic',
      name: 'Employment Contract - Basic',
      type: 'employment',
      description: 'Standard employment agreement with essential clauses',
      content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into on [DATE] between [COMPANY NAME], a company incorporated under the laws of India ("Company") and [EMPLOYEE NAME] ("Employee").

1. POSITION AND DUTIES
The Employee shall serve as [POSITION] and shall perform duties as assigned by the Company.

2. COMPENSATION
The Employee shall receive a monthly salary of INR [AMOUNT] payable on the last working day of each month.

3. WORKING HOURS
The Employee shall work [HOURS] hours per week, Monday through Friday.

4. TERMINATION
Either party may terminate this agreement with [NOTICE PERIOD] days written notice.

5. CONFIDENTIALITY
The Employee agrees to maintain confidentiality of all proprietary information.

6. GOVERNING LAW
This Agreement shall be governed by the laws of India.

IN WITNESS WHEREOF, the parties have executed this Agreement.

_________________                    _________________
Company Representative               Employee
Date: ___________                    Date: ___________`,
      tags: ['employment', 'basic', 'indian-law'],
      isBuiltIn: true,
      rating: 4.5,
      downloads: 1250
    },
    {
      id: 'vendor-agreement',
      name: 'Vendor Service Agreement',
      type: 'vendor',
      description: 'Comprehensive vendor agreement for service providers',
      content: `VENDOR SERVICE AGREEMENT

This Vendor Service Agreement ("Agreement") is made on [DATE] between [CLIENT NAME] ("Client") and [VENDOR NAME] ("Vendor").

1. SERVICES
Vendor agrees to provide [DESCRIPTION OF SERVICES] as detailed in Exhibit A.

2. PAYMENT TERMS
Client shall pay Vendor INR [AMOUNT] within [PAYMENT TERMS] days of invoice receipt.

3. PERFORMANCE STANDARDS
Vendor shall maintain service levels as specified in the Service Level Agreement.

4. INTELLECTUAL PROPERTY
All work product shall remain the property of the Client.

5. LIABILITY
Vendor's liability shall be limited to the amount paid under this Agreement.

6. TERMINATION
Either party may terminate with [NOTICE PERIOD] days written notice.

7. DISPUTE RESOLUTION
Disputes shall be resolved through arbitration in [CITY], India.

_________________                    _________________
Client Signature                     Vendor Signature
Date: ___________                    Date: ___________`,
      tags: ['vendor', 'service', 'agreement'],
      isBuiltIn: true,
      rating: 4.3,
      downloads: 890
    },
    {
      id: 'lease-residential',
      name: 'Residential Lease Agreement',
      type: 'lease',
      description: 'Standard residential property lease agreement',
      content: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement is made on [DATE] between [LANDLORD NAME] ("Landlord") and [TENANT NAME] ("Tenant").

1. PROPERTY
Landlord leases to Tenant the property located at [PROPERTY ADDRESS].

2. TERM
The lease term is [DURATION] beginning [START DATE] and ending [END DATE].

3. RENT
Monthly rent is INR [AMOUNT] due on the [DAY] of each month.

4. SECURITY DEPOSIT
Tenant shall pay a security deposit of INR [AMOUNT].

5. MAINTENANCE
Tenant is responsible for routine maintenance and repairs under INR [AMOUNT].

6. TERMINATION
Either party may terminate with [NOTICE PERIOD] months written notice.

7. GOVERNING LAW
This Agreement is governed by the laws of India and local rent control acts.

_________________                    _________________
Landlord Signature                   Tenant Signature
Date: ___________                    Date: ___________`,
      tags: ['lease', 'residential', 'property'],
      isBuiltIn: true,
      rating: 4.7,
      downloads: 2100
    }
  ];

  const allTemplates = [...builtInTemplates, ...templates];

  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || template.type === selectedType;
    return matchesSearch && matchesType;
  });

  const templateTypes = ['employment', 'vendor', 'lease', 'service', 'general'];

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleDownload = (template) => {
    const blob = new Blob([template.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyTemplate = (template) => {
    navigator.clipboard.writeText(template.content);
    alert('Template copied to clipboard!');
  };

  const AddTemplateForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      type: 'general',
      description: '',
      content: '',
      tags: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const templateData = {
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        };
        
        await saveTemplate(templateData);
        setShowAddForm(false);
        setFormData({ name: '', type: 'general', description: '', content: '', tags: '' });
        alert('Template saved successfully!');
      } catch (error) {
        console.error('Error saving template:', error);
        alert('Error saving template');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Add New Template</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {templateTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your contract template content here..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="employment, contract, legal"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Save Template
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const PreviewModal = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleCopyTemplate(selectedTemplate)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>
              <button
                onClick={() => handleDownload(selectedTemplate)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {selectedTemplate.content}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <FileText className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Contract Templates</h1>
        </div>
        <p className="text-lg text-gray-600">
          Ready-to-use legal contract templates for various business needs
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
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
              {templateTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-8 w-8 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
              </div>
              
              {template.isBuiltIn && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-gray-500">{template.rating}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {template.type}
              </span>
              
              {template.isBuiltIn && (
                <span className="text-xs text-gray-500">
                  {template.downloads} downloads
                </span>
              )}
            </div>
            
            {template.tags && (
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{template.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={() => handlePreview(template)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => handleDownload(template)}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleCopyTemplate(template)}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No templates found</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Template
          </button>
        </div>
      )}

      {showAddForm && <AddTemplateForm />}
      {showPreview && <PreviewModal />}
    </div>
  );
};

export default ContractTemplates;