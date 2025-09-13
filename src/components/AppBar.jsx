import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRemainingTime, clearToken } from '../util/auth';
import kuringLogo from '../assets/kuringLogo.png';
import classes from './AppBar.module.css';

export default function AppBar() {
  const navigate = useNavigate();
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const time = getRemainingTime();
      setRemainingTime(time);
      
      if (time <= 0) {
        clearToken();
        navigate('/login');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className={classes.header}>
      <div className={classes.container}>
        <div className={classes.bar}>
          <div className={classes.brand} onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <img src={kuringLogo} alt="Kuring Logo" width='40' height='40' className={classes.logo} />
            <h1 className={classes.title}>Kuring Console</h1>
          </div>
          
          <div className={classes.right}>
            <div className={classes.timer}>
              <span className={classes.timerLabel}>남은 시간:</span>
              <span className={classes.timerValue}>{formatTime(remainingTime)}</span>
            </div>
            
            <button onClick={handleLogout} className={classes.logoutButton}>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
