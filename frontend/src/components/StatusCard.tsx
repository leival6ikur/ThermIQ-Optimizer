import React from 'react';
import { MiniTempGraph } from './MiniTempGraph';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  graphData?: Array<{ timestamp: string; value: number | null }>;
  graphColor?: string;
}

const colorClasses = {
  primary: 'text-primary border-primary/20 bg-primary/5',
  success: 'text-green-600 border-green-200 bg-green-50',
  warning: 'text-amber-600 border-amber-200 bg-amber-50',
  danger: 'text-red-600 border-red-200 bg-red-50',
  neutral: 'text-gray-600 border-gray-200 bg-gray-50',
};

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'neutral',
  graphData,
  graphColor,
}) => {
  return (
    <div className={`card border-2 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            {icon && <span className="text-2xl">{icon}</span>}
            <p className="text-3xl font-bold">{value}</p>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
        {trend && trendValue && (
          <div className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' :
            trend === 'down' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            <span className="text-lg">
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
            <span className="ml-1">{trendValue}</span>
          </div>
        )}
      </div>
      {graphData && graphData.length > 0 && (
        <MiniTempGraph data={graphData} color={graphColor} />
      )}
    </div>
  );
};
