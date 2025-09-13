import classes from './StatCard.module.css';

export default function StatCard({ number, label }) {
  return (
    <div className={classes.statCard}>
      <div className={classes.statNumber}>{number}</div>
      <div className={classes.statLabel}>{label}</div>
    </div>
  );
}
