import React, { useState, useEffect } from 'react';
import {
  Search,
  Book,
  Scale,
  FileText,
  Plus,
  Filter,
  BookOpen,
  Gavel,
  Library,
  Tag
} from 'lucide-react';

import {
  searchLaws,
  searchRegulations,
  searchPrecedents,
  searchGlossary,
  getAllCategories,
  addLaw,
  addRegulation,
  addPrecedent
} from '../services/knowledgeBaseService';

const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState('laws');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadCategories();
    performSearch();
  }, [activeTab, searchQuery, selectedCategory]);

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      let searchResults = [];
      
      switch (activeTab) {
        case 'laws':
          searchResults = await searchLaws(searchQuery, selectedCategory);
          break;
        case 'regulations':
          searchResults = await searchRegulations(searchQuery, selectedCategory);
          break;
        case 'precedents':
          searchResults = await searchPrecedents(searchQuery, selectedCategory);
          break;
        case 'glossary':
          searchResults = await searchGlossary(searchQuery);
          break;
        default:
          searchResults = [];
      }
      
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'laws', label: 'Laws', icon: Scale, count: results.length },
    { id: 'regulations', label: 'Regulations', icon: FileText, count: results.length },
    { id: 'precedents', label: 'Precedents', icon: Gavel, count: results.length },
    { id: 'glossary', label: 'Glossary', icon: BookOpen, count: results.length }
  ];

  const renderLawCard = (law) => (
    <div key={law.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{law.title}</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          {law.category}
        </span>
      </div>
      
      {law.section && (
        <p className="text-sm text-gray-600 mb-2">
          <strong>Section:</strong> {law.section}
        </p>
      )}
      
      <p className="text-gray-700 mb-4 line-clamp-3">{law.content}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {law.tags?.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {law.jurisdiction}
        </span>
      </div>
    </div>
  );

  const renderRegulationCard = (regulation) => (
    <div key={regulation.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{regulation.title}</h3>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          {regulation.category}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">
        <strong>Authority:</strong> {regulation.authority}
      </p>
      
      <p className="text-gray-700 mb-4 line-clamp-3">{regulation.content}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {regulation.tags?.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          Effective: {new Date(regulation.effectiveDate).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  const renderPrecedentCard = (precedent) => (
    <div key={precedent.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{precedent.caseName}</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
          {precedent.category}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">
        <strong>Court:</strong> {precedent.court} ({precedent.year})
      </p>
      
      <p className="text-gray-700 mb-4 line-clamp-3">{precedent.summary}</p>
      
      {precedent.relevantLaws && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Relevant Laws:</p>
          <div className="flex flex-wrap gap-1">
            {precedent.relevantLaws.map((law, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                {law}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-1">
        {precedent.tags?.map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  const renderGlossaryCard = (term) => (
    <div key={term.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{term.term}</h3>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
          {term.category}
        </span>
      </div>
      
      <p className="text-gray-700 mb-4">{term.definition}</p>
      
      {term.relatedTerms && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Related Terms:</p>
          <div className="flex flex-wrap gap-1">
            {term.relatedTerms.map((relatedTerm, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                {relatedTerm}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const AddForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      category: '',
      content: '',
      tags: '',
      section: '',
      jurisdiction: 'India'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const data = {
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        switch (activeTab) {
          case 'laws':
            await addLaw(data);
            break;
          case 'regulations':
            await addRegulation({
              ...data,
              authority: data.jurisdiction,
              effectiveDate: new Date().toISOString()
            });
            break;
          case 'precedents':
            await addPrecedent({
              caseName: data.title,
              court: data.jurisdiction,
              year: new Date().getFullYear(),
              category: data.category,
              summary: data.content,
              tags: data.tags,
              relevantLaws: []
            });
            break;
        }

        setShowAddForm(false);
        setFormData({
          title: '',
          category: '',
          content: '',
          tags: '',
          section: '',
          jurisdiction: 'India'
        });
        performSearch();
        alert('Entry added successfully!');
      } catch (error) {
        console.error('Error adding entry:', error);
        alert('Error adding entry');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Add New {activeTab.slice(0, -1)}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title/Name
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {activeTab === 'laws' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content/Description
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="contract, employment, termination"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Add Entry
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Library className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Legal Knowledge Base</h1>
        </div>
        <p className="text-lg text-gray-600">
          Comprehensive database of laws, regulations, and legal precedents
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Entry</span>
            </button>
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
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'laws' && results.map(renderLawCard)}
              {activeTab === 'regulations' && results.map(renderRegulationCard)}
              {activeTab === 'precedents' && results.map(renderPrecedentCard)}
              {activeTab === 'glossary' && results.map(renderGlossaryCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Book className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No entries found</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Entry
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddForm && <AddForm />}
    </div>
  );
};

export default KnowledgeBase;