import React, {useState, useEffect} from 'react';
import {subscribe, getSnapshot} from '../util/metricsPoller';
import MetricCard from './ui/MetricCard';
import styles from './ServerStatusDashboard.module.css';

export default function ServerStatusDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 초기 스냅샷 반영
    const snap = getSnapshot();
    if (snap) {
      setMetrics(snap.metrics);
      setLoading(snap.loading ?? false);
      setError(snap.error ? (snap.error.message || String(snap.error)) : null);
    }

    // 싱글톤 폴링 구독
    const unsubscribe = subscribe(({metrics: m, loading: l, error: e}) => {
      setMetrics(m);
      setLoading(l ?? false);
      setError(e ? (e.message || String(e)) : null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getSystemStatus = () => {
    if (!metrics) return 'unknown';
    const cpuUsage = metrics['system_cpu_usage']?.[0] || 0;
    const mem = getMetricValue('jvm_memory_usage_after_gc_percent', l => l.area === 'heap' && l.pool === 'long-lived');
    const memoryUsage = typeof mem === 'number' ? mem : 0;
    if (cpuUsage > 0.8 || memoryUsage > 0.8) return 'error';
    if (cpuUsage > 0.6 || memoryUsage > 0.6) return 'warning';
    return 'success';
  };

  const getCpuStatus = () => {
    if (!metrics) return 'normal';
    const cpuUsage = metrics['system_cpu_usage']?.[0] || 0;
    if (cpuUsage > 0.8) return 'error';
    if (cpuUsage > 0.6) return 'warning';
    return 'success';
  };

  const getMemoryStatus = () => {
    if (!metrics) return 'normal';
    const mem = getMetricValue('jvm_memory_usage_after_gc_percent', l => l.area === 'heap' && l.pool === 'long-lived');
    const memoryUsage = typeof mem === 'number' ? mem : 0;
    if (memoryUsage > 0.8) return 'error';
    if (memoryUsage > 0.6) return 'warning';
    return 'success';
  };

  const formatUptime = (seconds) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${days}일 ${hh}시 ${mm}분`;
  };

  // 특정 라벨 조건을 만족하는 메트릭 단일 값 조회 유틸
  const getMetricValue = (name, predicate) => {
    const series = metrics?._series?.[name];
    if (Array.isArray(series)) {
      const found = series.find(s => {
        try {
          return predicate ? predicate(s.labels || {}) : true;
        } catch {
          return false;
        }
      });
      if (found && typeof found.value === 'number') return found.value;
    }
    // fallback: 기존 배열 첫 값
    const fallbackArr = metrics?.[name];
    if (Array.isArray(fallbackArr) && typeof fallbackArr[0] === 'number') return fallbackArr[0];
    return undefined;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>서버 상태를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h3>서버 상태를 불러올 수 없습니다</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={styles.error}>
        <h3>메트릭 데이터를 찾을 수 없습니다</h3>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>서버 상태 대시보드</h1>
        <div className={`${styles.statusIndicator} ${styles[getSystemStatus()]}`}>
          {getSystemStatus() === 'success' && '🟢 정상'}
          {getSystemStatus() === 'warning' && '🟡 주의'}
          {getSystemStatus() === 'error' && '🔴 위험'}
        </div>
      </div>

      <div className={styles.metricsGrid}>
        {/* 시스템 정보 */}
        <MetricCard
          title="시스템 상태"
          value={getSystemStatus() === 'success' ? '정상' : getSystemStatus() === 'warning' ? '주의' : '위험'}
          status={getSystemStatus()}
          icon="🖥️"
          description="전체 시스템 상태"
        />

        {/* CPU 사용률 */}
        <MetricCard
          title="CPU 사용률"
          value={metrics['system_cpu_usage']?.[0] == null
            ? 'Loading...'
            : ((metrics['system_cpu_usage'][0] * 100).toFixed(1))}
          unit="%"
          status={getCpuStatus()}
          icon="⚡"
          description="시스템 CPU 사용률"
        />

        {/* 메모리 사용률 */}
        <MetricCard
          title="메모리 사용률"
          value={(getMetricValue('jvm_memory_usage_after_gc_percent', l => l.area === 'heap' && l.pool === 'long-lived')) == null
            ? 'Loading...'
            : ((getMetricValue('jvm_memory_usage_after_gc_percent', l => l.area === 'heap' && l.pool === 'long-lived') * 100).toFixed(1))}
          unit="%"
          status={getMemoryStatus()}
          icon="💾"
          description="JVM 메모리 사용률 (GC 후)"
        />

        {/* 활성 세션 */}
        <MetricCard
          title="활성 세션"
          value={metrics['tomcat_sessions_active_current_sessions']?.[0] || 0}
          unit={`/ ${metrics['tomcat_sessions_active_max_sessions']?.[0] || 55}`}
          status="normal"
          icon="👥"
          description="현재 활성 사용자 세션"
        />

        {/* 총 요청 수 */}
        <MetricCard
          title="총 요청 수"
          value={metrics['http_server_requests_seconds_count']?.[0] || 0}
          status="normal"
          icon="📊"
          description="누적 HTTP 요청 수"
        />

        {/* 평균 응답 시간 */}
        <MetricCard
          title="평균 응답 시간"
          value={metrics['http_server_requests_seconds_sum']?.[0] ?
            (metrics['http_server_requests_seconds_sum'][0] / metrics['http_server_requests_seconds_count'][0] * 1000).toFixed(0) : 0}
          unit="ms"
          status="normal"
          icon="⏱️"
          description="평균 HTTP 응답 시간"
        />

        {/* 데이터베이스 연결 */}
        <MetricCard
          title="DB 연결 풀"
          value={metrics['hikaricp_connections_idle']?.[0] || 0}
          unit={`/ ${metrics['hikaricp_connections_max']?.[0] || 8}`}
          status="normal"
          icon="🗄️"
          description="사용 가능한 DB 연결 수"
        />

        {/* JVM 스레드 */}
        <MetricCard
          title="JVM 스레드"
          value={metrics['jvm_threads_live_threads']?.[0] || 0}
          unit={`/ ${metrics['jvm_threads_peak_threads']?.[0] || 0}`}
          status="normal"
          icon="🧵"
          description="현재 활성 스레드 수"
        />

        {/* 업타임 */}
        <MetricCard
          title="서버 업타임"
          value={formatUptime(metrics['process_uptime_seconds']?.[0] || 0)}
          unit=""
          status="normal"
          icon="⏰"
          description="서버 가동 시간"
        />
      </div>

      <div className={styles.footer}>
        <p>마지막 업데이트: {new Date().toLocaleString('ko-KR')}</p>
        <p>데이터 소스: Prometheus 메트릭</p>
      </div>
    </div>
  );
};
