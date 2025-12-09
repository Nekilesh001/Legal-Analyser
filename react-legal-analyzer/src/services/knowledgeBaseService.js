import Dexie from 'dexie';

// Knowledge Base Database
const knowledgeDB = new Dexie('LegalKnowledgeBase');
knowledgeDB.version(1).stores({
  laws: '++id, title, category, jurisdiction, section, content, tags, lastUpdated',
  regulations: '++id, title, authority, category, content, effectiveDate, tags',
  precedents: '++id, caseName, court, year, category, summary, relevantLaws, tags',
  templates: '++id, name, type, content, category, tags, createdAt',
  glossary: '++id, term, definition, category, relatedTerms'
});

// Initialize with sample Indian legal data
const initializeKnowledgeBase = async () => {
  try {
    const lawsCount = await knowledgeDB.laws.count();
    if (lawsCount === 0) {
      await seedInitialData();
    }
  } catch (error) {
    console.error('Error initializing knowledge base:', error);
  }
};

// Seed initial legal data
const seedInitialData = async () => {
  const sampleLaws = [
    {
      title: "Indian Contract Act, 1872",
      category: "Contract Law",
      jurisdiction: "India",
      section: "Section 10",
      content: "All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void.",
      tags: ["contract", "agreement", "consent", "consideration"],
      lastUpdated: new Date().toISOString()
    },
    {
      title: "Indian Contract Act, 1872",
      category: "Contract Law",
      jurisdiction: "India",
      section: "Section 73",
      content: "When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken the contract, compensation for any loss or damage caused to him thereby.",
      tags: ["breach", "compensation", "damages"],
      lastUpdated: new Date().toISOString()
    },
    {
      title: "Employment Contract Essentials",
      category: "Employment Law",
      jurisdiction: "India",
      section: "General",
      content: "Employment contracts must include: job description, salary details, working hours, leave policy, termination clause, confidentiality agreement, and dispute resolution mechanism.",
      tags: ["employment", "salary", "termination", "confidentiality"],
      lastUpdated: new Date().toISOString()
    }
  ];

  const sampleRegulations = [
    {
      title: "Minimum Wages Act, 1948",
      authority: "Ministry of Labour and Employment",
      category: "Employment",
      content: "Provides for fixing minimum rates of wages in certain employments and empowers appropriate governments to fix minimum wages.",
      effectiveDate: "1948-03-15",
      tags: ["minimum wage", "employment", "labour"]
    },
    {
      title: "Contract Labour (Regulation and Abolition) Act, 1970",
      authority: "Ministry of Labour and Employment", 
      category: "Employment",
      content: "Regulates employment of contract labour and provides for its abolition in certain circumstances.",
      effectiveDate: "1970-09-01",
      tags: ["contract labour", "regulation", "employment"]
    }
  ];

  const samplePrecedents = [
    {
      caseName: "Hadley v. Baxendale",
      court: "Court of Exchequer",
      year: 1854,
      category: "Contract Damages",
      summary: "Established the rule for remoteness of damages in contract law - damages must arise naturally or be reasonably foreseeable.",
      relevantLaws: ["Indian Contract Act Section 73"],
      tags: ["damages", "remoteness", "foreseeability"]
    }
  ];

  const sampleGlossary = [
    {
      term: "Consideration",
      definition: "Something of value given in exchange for a promise or performance in a contract.",
      category: "Contract Law",
      relatedTerms: ["Contract", "Agreement", "Quid pro quo"]
    },
    {
      term: "Force Majeure",
      definition: "Unforeseeable circumstances that prevent a party from fulfilling a contract.",
      category: "Contract Law", 
      relatedTerms: ["Act of God", "Impossibility", "Frustration"]
    }
  ];

  await knowledgeDB.laws.bulkAdd(sampleLaws);
  await knowledgeDB.regulations.bulkAdd(sampleRegulations);
  await knowledgeDB.precedents.bulkAdd(samplePrecedents);
  await knowledgeDB.glossary.bulkAdd(sampleGlossary);
};

// Search functions
export const searchLaws = async (query, category = null) => {
  try {
    let results = await knowledgeDB.laws.toArray();
    
    if (category) {
      results = results.filter(law => law.category.toLowerCase() === category.toLowerCase());
    }
    
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(law => 
        law.title.toLowerCase().includes(searchTerm) ||
        law.content.toLowerCase().includes(searchTerm) ||
        law.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    return results;
  } catch (error) {
    console.error('Error searching laws:', error);
    return [];
  }
};

export const searchRegulations = async (query, category = null) => {
  try {
    let results = await knowledgeDB.regulations.toArray();
    
    if (category) {
      results = results.filter(reg => reg.category.toLowerCase() === category.toLowerCase());
    }
    
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(reg => 
        reg.title.toLowerCase().includes(searchTerm) ||
        reg.content.toLowerCase().includes(searchTerm) ||
        reg.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    return results;
  } catch (error) {
    console.error('Error searching regulations:', error);
    return [];
  }
};

export const searchPrecedents = async (query, category = null) => {
  try {
    let results = await knowledgeDB.precedents.toArray();
    
    if (category) {
      results = results.filter(prec => prec.category.toLowerCase() === category.toLowerCase());
    }
    
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(prec => 
        prec.caseName.toLowerCase().includes(searchTerm) ||
        prec.summary.toLowerCase().includes(searchTerm) ||
        prec.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    return results;
  } catch (error) {
    console.error('Error searching precedents:', error);
    return [];
  }
};

export const searchGlossary = async (query) => {
  try {
    let results = await knowledgeDB.glossary.toArray();
    
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(term => 
        term.term.toLowerCase().includes(searchTerm) ||
        term.definition.toLowerCase().includes(searchTerm)
      );
    }
    
    return results;
  } catch (error) {
    console.error('Error searching glossary:', error);
    return [];
  }
};

// Enhanced legal analysis with knowledge base
export const analyzeContractWithKnowledge = async (contractText, contractType = 'general') => {
  try {
    // Get relevant laws and regulations
    const relevantLaws = await searchLaws('', contractType);
    const relevantRegulations = await searchRegulations('', contractType);
    
    // Basic contract analysis
    const riskScore = Math.random() * 10;
    const wordCount = contractText.split(/\s+/).length;
    
    // Analyze against knowledge base
    const complianceIssues = [];
    const recommendations = [];
    
    // Check for essential clauses based on contract type
    if (contractType === 'employment') {
      if (!contractText.toLowerCase().includes('termination')) {
        complianceIssues.push({
          type: 'missing_clause',
          severity: 'high',
          description: 'Missing termination clause',
          recommendation: 'Add clear termination conditions as per employment law'
        });
      }
      
      if (!contractText.toLowerCase().includes('confidentiality')) {
        complianceIssues.push({
          type: 'missing_clause',
          severity: 'medium',
          description: 'Missing confidentiality clause',
          recommendation: 'Consider adding confidentiality agreement'
        });
      }
    }
    
    // Generate recommendations based on knowledge base
    relevantLaws.forEach(law => {
      if (law.tags.includes('termination') && !contractText.toLowerCase().includes('termination')) {
        recommendations.push({
          priority: 'high',
          category: 'legal_compliance',
          title: 'Add Termination Clause',
          description: `Based on ${law.title}, ${law.section}`,
          reference: law.content,
          actions: ['Include termination conditions', 'Specify notice period']
        });
      }
    });
    
    return {
      id: `analysis_${Date.now()}`,
      timestamp: new Date().toISOString(),
      contractInfo: {
        type: contractType,
        language: 'en',
        wordCount,
        characterCount: contractText.length
      },
      analysis: {
        overallRiskScore: Math.round(riskScore * 10) / 10,
        riskAssessment: complianceIssues.map(issue => ({
          type: 'compliance_issue',
          category: issue.type,
          severity: issue.severity,
          riskLevel: issue.severity === 'high' ? 8 : issue.severity === 'medium' ? 5 : 3,
          description: issue.description,
          recommendation: issue.recommendation,
          compliance: false
        })),
        complianceCheck: {
          overallScore: Math.max(0, 100 - (complianceIssues.length * 15)),
          issues: complianceIssues,
          recommendations: recommendations.map(r => r.description)
        },
        clauseAnalysis: {
          essentialClauses: getEssentialClauses(contractType),
          missingClauses: complianceIssues.filter(i => i.type === 'missing_clause')
        },
        recommendations,
        knowledgeBaseReferences: {
          relevantLaws: relevantLaws.slice(0, 3),
          relevantRegulations: relevantRegulations.slice(0, 2)
        },
        summary: {
          overallAssessment: `Contract analyzed with ${complianceIssues.length} compliance issues found`,
          keyFindings: complianceIssues.map(i => i.description),
          recommendation: complianceIssues.length > 2 ? 'Requires significant legal review' : 'Minor issues to address'
        }
      }
    };
  } catch (error) {
    console.error('Error in knowledge-based analysis:', error);
    throw error;
  }
};

// Get essential clauses for contract type
const getEssentialClauses = (contractType) => {
  const clauseMap = {
    employment: [
      'Job Description',
      'Compensation',
      'Working Hours',
      'Termination',
      'Confidentiality',
      'Non-compete'
    ],
    vendor: [
      'Scope of Work',
      'Payment Terms',
      'Delivery Schedule',
      'Quality Standards',
      'Termination',
      'Liability'
    ],
    lease: [
      'Property Description',
      'Rent Amount',
      'Lease Duration',
      'Security Deposit',
      'Maintenance',
      'Termination'
    ],
    service: [
      'Service Description',
      'Payment Terms',
      'Performance Standards',
      'Termination',
      'Liability',
      'Dispute Resolution'
    ],
    general: [
      'Parties',
      'Consideration',
      'Terms and Conditions',
      'Termination',
      'Dispute Resolution'
    ]
  };
  
  return clauseMap[contractType] || clauseMap.general;
};

// CRUD operations for knowledge base
export const addLaw = async (lawData) => {
  try {
    const id = await knowledgeDB.laws.add({
      ...lawData,
      lastUpdated: new Date().toISOString()
    });
    return id;
  } catch (error) {
    console.error('Error adding law:', error);
    throw error;
  }
};

export const addRegulation = async (regulationData) => {
  try {
    const id = await knowledgeDB.regulations.add(regulationData);
    return id;
  } catch (error) {
    console.error('Error adding regulation:', error);
    throw error;
  }
};

export const addPrecedent = async (precedentData) => {
  try {
    const id = await knowledgeDB.precedents.add(precedentData);
    return id;
  } catch (error) {
    console.error('Error adding precedent:', error);
    throw error;
  }
};

export const getAllCategories = async () => {
  try {
    const laws = await knowledgeDB.laws.toArray();
    const regulations = await knowledgeDB.regulations.toArray();
    
    const categories = new Set();
    laws.forEach(law => categories.add(law.category));
    regulations.forEach(reg => categories.add(reg.category));
    
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
};

// Initialize knowledge base on import
initializeKnowledgeBase();

export { knowledgeDB, initializeKnowledgeBase };