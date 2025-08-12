import React from 'react';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
}

interface AlertsPanelProps {
  alerts?: Alert[];
  onAcknowledge?: (alertId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onAcknowledge }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="alerts-panel empty">
        <div className="no-alerts">
          <span className="icon">🎉</span>
          <p>No active alerts</p>
        </div>
      </div>
    );
  }

  const getAlertIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'error': '🚨',
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    return icons[type] || '📢';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  return (
    <div className="alerts-panel">
      <h3>
        Alerts 
        {unacknowledgedAlerts.length > 0 && (
          <span className="alert-count">{unacknowledgedAlerts.length}</span>
        )}
      </h3>
      
      {unacknowledgedAlerts.length > 0 && (
        <div className="alerts-section unacknowledged">
          <h4>Active Alerts</h4>
          {unacknowledgedAlerts.map(alert => (
            <div key={alert.id} className={`alert-item type-${alert.type}`}>
              <div className="alert-header">
                <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                <span className="alert-title">{alert.title}</span>
                <span className="alert-time">{formatTime(alert.timestamp)}</span>
              </div>
              
              <div className="alert-content">
                <p className="alert-message">{alert.message}</p>
                <div className="alert-footer">
                  <span className="alert-source">Source: {alert.source}</span>
                  {onAcknowledge && (
                    <button 
                      className="acknowledge-btn"
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {acknowledgedAlerts.length > 0 && (
        <div className="alerts-section acknowledged">
          <h4>Recent Alerts</h4>
          {acknowledgedAlerts.slice(0, 5).map(alert => (
            <div key={alert.id} className={`alert-item type-${alert.type} acknowledged`}>
              <div className="alert-header">
                <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                <span className="alert-title">{alert.title}</span>
                <span className="alert-time">{formatTime(alert.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};