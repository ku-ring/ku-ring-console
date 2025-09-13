import { useLoaderData, useNavigate } from 'react-router-dom';
import classes from './ReportsPage.module.css';
import Pagination from '../components/ui/Pagination.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import {getFeedbacks} from "../util/api.js";

// 응답 객체에서 합리적인 배열 필드를 찾아 반환 (data/content/items/rows/list/results, 중첩 허용)
function extractArrayFromResponse(obj) {
  if (Array.isArray(obj)) return obj;
  if (!obj || typeof obj !== 'object') return [];
  const queue = [obj];
  const candidateKeys = ['data', 'content', 'items', 'rows', 'list', 'results'];
  const visited = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object') continue;
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const key of candidateKeys) {
      const val = cur[key];
      if (Array.isArray(val)) return val;
      if (val && typeof val === 'object') queue.push(val);
    }
  }
  return [];
}

// 중첩 객체에서 페이지 수(totalPages) 같은 수치를 찾기
function extractNumberByKeys(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  const queue = [obj];
  const visited = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object') continue;
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const k of keys) {
      const v = cur[k];
      if (typeof v === 'number' && !Number.isNaN(v)) return v;
    }
    for (const v of Object.values(cur)) {
      if (v && typeof v === 'object') queue.push(v);
    }
  }
  return undefined;
}

export async function feedbacksLoader({ request }) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page')) || 0;
  const size = 10;

  try {
    const response = await getFeedbacks(page, size);
    // Swagger: BaseResponseAdminFeedbackListResponse -> data.feedbacks[], data.totalPages, data.hasNext, data.totalElements
    const data = response?.data || {};
    const list = Array.isArray(data.feedbacks) ? data.feedbacks : [];
    const computedTotalPages = typeof data.totalPages === 'number' ? data.totalPages : 1;
    const totalElements = typeof data.totalElements === 'number' ? data.totalElements : 0;
    return {
      code: response?.code ?? 200,
      message: response?.message,
      currentPage: page,
      hasMore: typeof data.hasNext === 'boolean' ? data.hasNext : (page < computedTotalPages - 1),
      totalPages: computedTotalPages,
      totalElements: totalElements,
      items: list
    };
  } catch (error) {
    console.error('피드백 로딩 실패:', error);
    return {
      code: 500,
      message: '피드백을 불러오는데 실패했습니다.',
      data: [],
      currentPage: 0,
      hasMore: false,
      totalPages: 1,
      totalElements: 0
    };
  }
}

export default function FeedbacksPage() {
  const loaderData = useLoaderData();
  const navigate = useNavigate();
  
  // Loader에서 받은 데이터 사용 - 로더가 제공한 items 우선 사용
  const feedbacks = Array.isArray(loaderData?.items)
    ? loaderData.items
    : extractArrayFromResponse(loaderData);
  const currentPage = loaderData?.currentPage || 0;
  const hasMore = loaderData?.hasMore || false;
  const totalPages = loaderData?.totalPages || 1;
  const totalElements = loaderData?.totalElements || 0;
  const error = (typeof loaderData?.code === 'number' && loaderData.code !== 200) ? loaderData?.message : null;
  const loading = false; // Loader가 데이터를 미리 로드하므로 로딩 상태 불필요


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePageChange = (newPage) => {
    // URL 파라미터를 업데이트하고 Loader가 다시 실행되도록 함
    navigate(`/dashboard/feedbacks?page=${newPage}`);
  };

  if (loading) {
    return (
      <div className={classes.center64}>
        <div className={classes.centerTextLg}>피드백을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.center64}>
        <div style={{ color: '#dc2626' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1 className={classes.title}>피드백 확인</h1>
        <p className={classes.subtitle}>사용자 피드백을 확인하고 관리할 수 있습니다</p>
      </div>

      <div className={classes.content}>
        <div className={classes.stats}>
          <StatCard number={totalElements} label="전체 수" />
        </div>

        <div className={classes.tableContainer}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th>사용자 ID</th>
                <th>내용</th>
                <th>작성일</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: '#6b7280' }}>피드백이 없습니다.</td>
                </tr>
              ) : (
                feedbacks.map((feedback, idx) => (
                  <tr key={idx}>
                    <td>{feedback.userId}</td>
                    <td>{feedback.contents}</td>
                    <td>{formatDate(feedback.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => handlePageChange(currentPage - 1)}
          onNext={() => handlePageChange(currentPage + 1)}
          disablePrev={currentPage === 0}
          disableNext={!hasMore || (typeof totalPages === 'number' && currentPage >= totalPages - 1)}
        />
      </div>
    </div>
  );
}
