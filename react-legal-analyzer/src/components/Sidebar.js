import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale, Home, FileText, History, Settings, BarChart3, Library, HelpCircle } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Analyzer', href: '/analyzer', icon: FileText },
    { name: 'History', href: '/history', icon: History },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Knowledge Base', href: '/knowledge', icon: Library },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Scale className="h-8 w-8 text-blue-400" />
          <span className="text-xl font-bold">Legal Analyzer</span>
        </div>
      </div>
      
      <nav className="mt-8">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white border-r-2 border-blue-400'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;