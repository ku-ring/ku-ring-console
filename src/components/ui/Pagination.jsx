import styles from './Pagination.module.css';

export default function Pagination({
  currentPage = 0,
  totalPages = 1,
  onPrev,
  onNext,
  disablePrev = false,
  disableNext = false,
}) {
  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageBtn}
        onClick={onPrev}
        disabled={disablePrev}
      >
        이전
      </button>
      <span className={styles.pageInfo}>
        페이지 {currentPage + 1} / {totalPages}
      </span>
      <button
        className={styles.pageBtn}
        onClick={onNext}
        disabled={disableNext}
      >
        다음
      </button>
    </div>
  );
}


