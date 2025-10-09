import React from 'react';

export interface QuickAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

export interface QuickActionsCardProps {
  actions: QuickAction[];
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ actions }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`w-full text-left px-4 py-3 text-sm rounded-lg transition-colors ${
              action.variant === 'danger'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};