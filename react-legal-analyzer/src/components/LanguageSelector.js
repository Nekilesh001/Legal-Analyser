import React from 'react';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-gray-600" />
      <select className="text-sm border border-gray-300 rounded px-2 py-1">
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
        <option value="ta">தமிழ்</option>
      </select>
    </div>
  );
};

export default LanguageSelector;