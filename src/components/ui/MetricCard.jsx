import React from 'react';
import styles from './MetricCard.module.css';

export default function MetricCard({ title, value, unit = '', status = 'normal', icon, description }) {

  const getStatusClass = () => {
    switch (status) {
      case 'warning':
        return styles.warning;
      case 'error':
        return styles.error;
      case 'success':
        return styles.success;
      default:
        return styles.normal;
    }
  };

  return (
    <div className={`${styles.metricCard} ${getStatusClass()}`}>
      <div className={styles.header}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.value}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
};
