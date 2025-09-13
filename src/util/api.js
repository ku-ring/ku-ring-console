// API 통신 유틸리티
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API 요청 헬퍼
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('admin_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      //'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      // 401 Unauthorized인 경우 로그인 페이지로 리다이렉트
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_token_expiry');
        window.location.href = '/login';
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 204 No Content 대응
    if (response.status === 204) {
      return { code: 204 };
    }

    const data = await response.json();
    
    // API 응답에 code 필드가 있는 경우 확인
    if (data.code && data.code !== 200) {
      throw new Error(data.message || 'API 요청이 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('API 요청 실패:', error);
    throw error;
  }
};

// 관리자 로그인
export const loginAdmin = async (loginId, password) => {
  return apiRequest('/api/v2/admin/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, password }),
  });
};

// 피드백 목록 조회
export const getFeedbacks = async (page = 0, size = 10) => {
  return apiRequest(`/api/v2/admin/feedbacks?page=${page}&size=${size}`);
};

// 신고 목록 조회
export const getReports = async (page = 0, size = 10) => {
  return apiRequest(`/api/v2/admin/reports?page=${page}&size=${size}`);
};

// 카테고리 목록 조회
export const getCategories = async () => {
  return apiRequest('/api/v2/notices/categories');
};

// 테스트 알림 전송
export const sendTestNotice = async (category, subject, articleId) => {
  return apiRequest('/api/v2/admin/notices/dev', {
    method: 'POST',
    body: JSON.stringify({ category, subject, articleId }),
  });
};

// 실제 알림 전송
export const sendProdNotice = async (title, body, url, adminPassword) => {
  return apiRequest('/api/v2/admin/notices/prod', {
    method: 'POST',
    body: JSON.stringify({ title, body, url, adminPassword }),
  });
};

// 예약 알림 목록 조회 (Admin-Query: /api/v2/admin/alerts?page=&size=)
export const getScheduledAlerts = async (page = 0, size = 10) => {
  return apiRequest(`/api/v2/admin/alerts?page=${page}&size=${size}`);
};

// 예약 알림 생성 (Admin-Command: /api/v2/admin/alerts)
export const createScheduledAlert = async (title, content, wakeTime) => {
  // 서버가 로컬 'yyyy-MM-dd HH:mm:ss' 포맷을 기대하는 경우를 대비해 변환
  const formattedWakeTime = (() => {
    // 입력은 보통 'YYYY-MM-DDTHH:mm' 혹은 'YYYY-MM-DDTHH:mm:ss'
    if (!wakeTime) return wakeTime;
    let normalized = wakeTime.trim();
    // 'T'를 공백으로 치환
    normalized = normalized.replace('T', ' ');
    // 초가 없으면 ':00' 추가
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
      normalized = `${normalized}:00`;
    }
    // 밀리초나 타임존(Z 등) 제거
    normalized = normalized.replace(/\.\d{3}.*/, '');
    normalized = normalized.replace(/Z$/, '');
    return normalized;
  })();

  return apiRequest('/api/v2/admin/alerts', {
    method: 'POST',
    body: JSON.stringify({
      title,
      content,
      alertTime: formattedWakeTime,
    }),
  });
};

// 예약 알림 취소 (삭제)
export const cancelScheduledAlert = async (id) => {
  return apiRequest(`/api/v2/admin/alerts/${id}`, {
    method: 'DELETE',
  });
};

// Prometheus 메트릭 조회
export const getPrometheusMetrics = async () => {
  try {
    // 프록시를 통해 요청
    const url = '/actuator/prometheus';
    
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return parsePrometheusMetrics(text);
  } catch (error) {
    console.error('Prometheus 메트릭 조회 실패:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Prometheus 메트릭 파싱 함수 (라벨 보존 + 숫자 배열 병행 제공)
const parsePrometheusMetrics = (text) => {
  const lines = text.split('\n');
  const metrics = {};
  const seriesByName = {};

  lines.forEach(line => {
    if (line.startsWith('#') || line.trim() === '') return;

    // 예: metric_name{label1="a",label2="b",} 123.4
    // 또는: metric_name 123.4
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{[^}]*\})?\s+(.+)$/);
    if (!match) return;

    const name = match[1];
    const labelsRaw = match[2] || '';
    const valueStr = match[3];
    const numericValue = parseFloat(valueStr);
    if (isNaN(numericValue)) return;

    // 숫자 배열 유지 (기존 호환)
    if (!metrics[name]) metrics[name] = [];
    metrics[name].push(numericValue);

    // 라벨 파싱하여 series 보존
    let labels = {};
    if (labelsRaw) {
      const inside = labelsRaw.slice(1, -1).trim(); // remove { }
      if (inside.length > 0) {
        inside.split(',').forEach(pair => {
          const p = pair.trim();
          if (!p) return;
          const eqIdx = p.indexOf('=');
          if (eqIdx > 0) {
            const k = p.slice(0, eqIdx).trim();
            // 값은 "..." 형태
            const vRaw = p.slice(eqIdx + 1).trim();
            const v = vRaw.replace(/^"|"$/g, '');
            if (k) labels[k] = v;
          }
        });
      }
    }

    if (!seriesByName[name]) seriesByName[name] = [];
    seriesByName[name].push({ labels, value: numericValue });
  });

  // 라벨 시리즈를 메트릭 객체의 숨은 필드로 제공
  Object.defineProperty(metrics, '_series', {
    value: seriesByName,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return metrics;
};
