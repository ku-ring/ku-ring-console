import { useState, useEffect } from 'react';
import classes from './ReportsPage.module.css';
import { getReports } from '../util/api';
import Pagination from '../components/ui/Pagination.jsx';
import StatCard from '../components/ui/StatCard.jsx';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getReports(currentPage, 10);

        const data = response?.data || {};
        const rows = Array.isArray(data.reports) ? data.reports : [];
        setReports(rows);

        const computedTotalPages = typeof data.totalPages === 'number' ? data.totalPages : 1;
        setTotalPages(computedTotalPages);
        setTotalElements(typeof data.totalElements === 'number' ? data.totalElements : rows.length);
      } catch (err) {
        console.error('신고 목록 조회 실패:', err);
        setError(err.message || '신고 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [currentPage]);


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
        <div className={classes.error}>
          <h2>오류가 발생했습니다</h2>
          <p>{error}</p>
          <button 
            className={classes.retryBtn}
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1 className={classes.title}>신고 확인</h1>
        <p className={classes.subtitle}>사용자 신고 내역을 확인하고 처리하세요</p>
      </div>

      <div className={classes.content}>
        <div className={classes.stats}>
          <StatCard number={totalElements} label="전체 수" />
        </div>

        <div className={classes.tableContainer}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th>신고자 ID</th>
                <th>신고된 댓글 ID</th>
                <th>신고 사유</th>
                <th>신고일시</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.reporterId ?? report.reporter ?? '-'}</td>
                  <td>{report.targetId ?? '-'}</td>
                  <td>{report.content ?? report.reason ?? '-'}</td>
                  <td>{report.createdAt || report.createdTime || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          onNext={() => setCurrentPage(prev => (totalPages ? Math.min(totalPages - 1, prev + 1) : prev + 1))}
          disablePrev={currentPage <= 0}
          disableNext={totalPages !== undefined && currentPage >= totalPages - 1}
        />
      </div>
    </div>
  );
}
