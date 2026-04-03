import React from 'react';

interface ConnectionStatusProps {
  mqttConnected: boolean;
  wsConnected: boolean;
  lastUpdate?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  mqttConnected,
  wsConnected,
  lastUpdate,
}) => {
  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return 'Never';

    const seconds = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="card bg-gray-50 border border-gray-200">
      <h3 className="text-sm font-semibold mb-3">System Status</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">MQTT Broker</span>
          <span className={`flex items-center gap-1 font-medium ${
            mqttConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              mqttConnected ? 'bg-green-600' : 'bg-red-600'
            } animate-pulse`} />
            {mqttConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">WebSocket</span>
          <span className={`flex items-center gap-1 font-medium ${
            wsConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              wsConnected ? 'bg-green-600' : 'bg-red-600'
            } animate-pulse`} />
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-gray-600">Last Update</span>
          <span className="font-medium text-gray-900">{getTimeSinceUpdate()}</span>
        </div>
      </div>
    </div>
  );
};
