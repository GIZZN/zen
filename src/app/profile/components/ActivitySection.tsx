'use client';

import React from 'react';
import { ActivityItem } from '../types/profileTypes';
import '../profile.css';

interface ActivitySectionProps {
  activities: ActivityItem[];
}

export default function ActivitySection({ activities }: ActivitySectionProps) {
  return (
    <div className="profile-activity">
      <h2>Недавняя активность</h2>
      
      <div className="activity-list">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="activity-info">
                <p className="activity-text">{activity.text}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="activity-empty">
            <p>Пока нет активности</p>
          </div>
        )}
      </div>
    </div>
  );
}
