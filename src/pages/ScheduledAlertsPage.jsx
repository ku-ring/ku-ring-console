import { useEffect, useState } from 'react';
import { getScheduledAlerts, createScheduledAlert, cancelScheduledAlert } from '../util/api.js';
import Pagination from '../components/ui/Pagination.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import classes from './ScheduledAlertsPage.module.css';

// 남은 시간을 계산하는 함수
const calculateTimeRemaining = (wakeTime) => {
  if (!wakeTime) return null;
  
  const now = new Date();
  const targetTime = new Date(wakeTime);
  const diff = targetTime - now;
  
  if (diff <= 0) return null; // 이미 지난 시간
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
};

export default function ScheduledAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [form, setForm] = useState({
    title: '',
    content: '',
    wakeTime: ''
  });

  const loadAlerts = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getScheduledAlerts(page, 10);
      if (res.code === 200) {
        // Swagger: BaseResponseAdminAlertListResponse -> data.alerts[], data.totalPages
        const data = res?.data || {};
        const list = Array.isArray(data.alerts) ? data.alerts : [];
        setAlerts(list);

        const computedTotalPages = typeof data.totalPages === 'number' ? data.totalPages : 1;
        setTotalPages(computedTotalPages);
      } else {
        setError(res.message || '예약 알림을 불러오지 못했습니다.');
        setMessage(res.message || '예약 알림을 불러오지 못했습니다.');
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
      }
    } catch (e) {
      setError('예약 알림을 불러오는 중 오류가 발생했습니다.');
      console.error(e);
      setMessage('예약 알림을 불러오는 중 오류가 발생했습니다.');
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts(currentPage);
  }, [currentPage]);

  // 1초마다 현재 시간 업데이트 (타이머용)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 예약 시간이 지난 알림들을 자동으로 상태 업데이트
  useEffect(() => {
    const now = new Date();
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(alert => {
        if (alert.status === 'PENDING' && alert.wakeTime) {
          const wakeTime = new Date(alert.wakeTime);
          if (wakeTime <= now) {
            return { ...alert, status: 'COMPLETED' };
          }
        }
        return alert;
      });

      // 상태가 변경된 알림이 있는지 확인
      const hasChanges = updatedAlerts.some((alert, index) => 
        alert.status !== prevAlerts[index]?.status
      );

      return hasChanges ? updatedAlerts : prevAlerts;
    });
  }, [currentTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content || !form.wakeTime) {
      setMessage('모든 필드를 입력해주세요.');
      return;
    }
    if (!window.confirm('예약 알림을 생성하시겠습니까?')) return;
    try {
      setIsSubmitting(true);
      setMessage('');
      const res = await createScheduledAlert(form.title, form.content, form.wakeTime);
      if (res.code === 200) {
        setMessage('예약 알림이 생성되었습니다.');
        setForm({ title: '', content: '', wakeTime: '' });
        setShowForm(false);
        await loadAlerts(currentPage);
      } else {
        setMessage(res.message || '예약 알림 생성 실패');
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
      }
    } catch (e) {
      setMessage('예약 알림 생성 중 오류가 발생했습니다.');
      console.error(e);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={classes.container}>
        <div className={classes.loading}>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.container}>
        <div className={classes.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={`${classes.banner} ${showBanner ? classes.bannerShow : ''}`}>
        {message}
      </div>
      <div className={classes.header}>
        <h1 className={classes.title}>예약 알림</h1>
        <p className={classes.subtitle}>발송 시간을 지정하여 알림을 예약합니다</p>
        <button
          className={classes.createBtn}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? '취소' : '새 알림 작성'}
        </button>
      </div>

      {message && !showBanner && (
        <div className={`${classes.alert} ${message.includes('생성') ? classes.alertSuccess : classes.alertError}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className={classes.formContainer}>
          <form onSubmit={handleSubmit} className={classes.form}>
            <div className={classes.formGroup}>
              <label className={classes.label}>제목</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={classes.input}
                required
              />
            </div>
            <div className={classes.formGroup}>
              <label className={classes.label}>내용</label>
              <textarea
                rows="4"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className={classes.textarea}
                required
              />
            </div>
            <div className={classes.formGroup}>
              <label className={classes.label}>발송 시간</label>
              <input
                type="datetime-local"
                value={form.wakeTime}
                onChange={(e) => setForm({ ...form, wakeTime: e.target.value })}
                className={classes.input}
                required
              />
              <small className={classes.helpText}>비워두면 즉시 발송됩니다</small>
            </div>
            <div className={classes.formActions}>
              <button type="submit" className={classes.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? '생성 중...' : '예약 알림 생성'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={classes.content}>
        <div className={classes.stats}>
          <StatCard number={alerts.length} label="전체 알림" />
          <StatCard number={alerts.filter(a => a.status === 'PENDING').length} label="예약 대기" />
          <StatCard number={alerts.filter(a => a.status === 'COMPLETED').length} label="발송 완료" />
        </div>
        <div className={classes.noticesList}>
          {alerts.map((a) => (
            <div key={a.id} className={classes.noticeCard}>
              <div className={classes.noticeRow}>
                <h3 className={classes.noticeTitle}>{a.title}</h3>
                <p className={classes.noticeContent}>{a.content}</p>
                <div className={classes.noticeMeta}>
                  {(() => {
                    const statusKey = a.status === 'PENDING' ? 'scheduled' : a.status === 'COMPLETED' ? 'sent' : a.status === 'CANCELED' ? 'cancelled' : '';
                    const label = a.status === 'PENDING' ? '예약됨' : a.status === 'COMPLETED' ? '발송완료' : a.status === 'CANCELED' ? '취소됨' : a.status;
                    return (
                      <span className={`${classes.status} ${statusKey ? classes[statusKey] : ''}`}>
                        {label}
                      </span>
                    );
                  })()}
                  <div className={classes.dateInfo}>
                    <span className={classes.dateLabel}>예약일</span>
                    <span className={classes.dateValue}>
                      {a.wakeTime ? a.wakeTime.replace('T', ' ').replace('Z', '') : '-'}
                    </span>
                  </div>
                </div>
              </div>
              <div className={classes.noticeFooter}>
                <div className={classes.noticeActions}>
                  {a.status === 'PENDING' && (
                    <>
                      {(() => {
                        const timeRemaining = calculateTimeRemaining(a.wakeTime);
                        return timeRemaining ? (
                          <div className={classes.timeRemaining}>
                            <span className={classes.timeLabel}>발송까지</span>
                            <span className={classes.timeValue}>
                              {timeRemaining.days > 0 && `${timeRemaining.days}일 `}
                              {String(timeRemaining.hours).padStart(2, '0')}:
                              {String(timeRemaining.minutes).padStart(2, '0')}:
                              {String(timeRemaining.seconds).padStart(2, '0')}
                            </span>
                          </div>
                        ) : null;
                      })()}
                      <button
                        className={classes.cancelBtn}
                        onClick={async () => {
                          if (!window.confirm('이 예약 알림을 취소하시겠습니까?')) return;
                          try {
                            const res = await cancelScheduledAlert(a.id);
                            if (res.code === 204 || res.code === 200) {
                              await loadAlerts(currentPage);
                            } else {
                              setMessage('예약 알림 취소 중 오류가 발생했습니다.');
                              setShowBanner(true);
                              setTimeout(() => setShowBanner(false), 3000);
                            }
                          } catch (err) {
                            console.error(err);
                            setMessage('예약 알림 취소 중 오류가 발생했습니다.');
                            setShowBanner(true);
                            setTimeout(() => setShowBanner(false), 3000);
                          }
                        }}
                      >
                        <span className={classes.cancelLabel}>예약취소</span>
                        <span className={classes.cancelText}></span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className={classes.empty}>예약된 알림이 없습니다.</div>
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          onNext={() => setCurrentPage(prev => (totalPages ? Math.min(totalPages - 1, prev + 1) : prev + 1))}
          disablePrev={currentPage <= 0}
          disableNext={typeof totalPages === 'number' && currentPage >= totalPages - 1}
        />
      </div>
    </div>
  );
}


