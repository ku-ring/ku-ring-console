import { jwtDecode } from 'jwt-decode';

// 토큰 관리 유틸리티
const TOKEN_KEY = 'admin_token';
const TOKEN_EXPIRY_KEY = 'admin_token_expiry';

// JWT 토큰에서 만료시간 추출
const getTokenExpiry = (token) => {
  try {
    const decoded = jwtDecode(token);
    
    // exp 필드가 있는지 확인 (Unix timestamp)
    if (decoded.exp) {
      return new Date(decoded.exp * 1000); // Unix timestamp를 JavaScript Date로 변환
    }
    
    throw new Error('No expiration time found in token');
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

// 토큰 저장
export const saveToken = (token) => {
  const expiryTime = getTokenExpiry(token);
  
  if (!expiryTime) { // JWT에서 만료시간을 추출할 수 없는 경우 기본값 사용 (30분)
    const defaultExpiryTime = new Date();
    defaultExpiryTime.setMinutes(defaultExpiryTime.getMinutes() + 30);
    localStorage.setItem(TOKEN_EXPIRY_KEY, defaultExpiryTime.toISOString());
  } else {
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toISOString());
  }

  localStorage.setItem(TOKEN_KEY, token);
};

// 토큰 가져오기
export const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiryTime) {
    return null;
  }
  
  // 토큰이 만료되었는지 확인
  const expirationTimeMs = new Date(expiryTime).getTime();
  if (Number.isFinite(expirationTimeMs) && Date.now() > expirationTimeMs) {
    clearToken();
    return null;
  }
  
  return token;
};

// 토큰 삭제
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// 남은 시간 계산 (초 단위)
export const getRemainingTime = () => {
  const storedExpirationDate = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!storedExpirationDate) return 0;

  const expirationDate = new Date(storedExpirationDate);
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  return Math.max(0, diffSeconds);
};

// JWT 토큰의 유효성 검증 (서명 검증 없이 만료시간만 확인)
export const isJWTTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    
    // exp 필드가 있는지 확인하고 만료되었는지 검사
    if (decoded.exp) {
      const currentTime = Math.floor(Date.now() / 1000); // 현재 시간을 Unix timestamp로 변환
      return decoded.exp > currentTime;
    }
    
    return false;
  } catch (error) {
    console.error('Error validating JWT token:', error);
    return false;
  }
};

// 토큰이 유효한지 확인
export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;
  
  // JWT 토큰인 경우 더 정확한 검증 수행
  return isJWTTokenValid(token);
};

// 인증 확인 로더 (React Router용)
export const checkAuthLoader = () => {
  const token = getToken();

  if (!token) {
    throw new Response('', {
      status: 302,
      headers: {
        Location: '/login'
      }
    });
  }

  return token;
};
