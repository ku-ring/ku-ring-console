import { useState, useEffect } from 'react';
import { getCategories, sendTestNotice, sendProdNotice } from '../util/api.js';
import classes from './NoticesPage.module.css';

export default function NoticesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('test');
  
  // 테스트 알림 상태
  const [testForm, setTestForm] = useState({
    category: '',
    subject: '',
    articleId: '1'
  });
  
  // 실제 알림 상태
  const [customForm, setCustomForm] = useState({
    title: '',
    body: '',
    url: '',
    adminPassword: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCategories();
      
      if (response.code === 200) {
        setCategories(response.data || []);
      } else {
        setError(response.message || '카테고리를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('카테고리를 불러오는데 실패했습니다.');
      console.error('카테고리 로딩 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('테스트 알림을 전송하시겠습니까?')) {
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await sendTestNotice(
        testForm.category,
        testForm.subject,
        testForm.articleId
      );
      
      if (response.code === 200) {
        setSubmitMessage('테스트 알림이 성공적으로 전송되었습니다.');
        setTestForm({ category: '', subject: '', articleId: '1' });
      } else {
        setSubmitMessage(response.message || '테스트 알림 전송에 실패했습니다.');
      }
    } catch (err) {
      setSubmitMessage('테스트 알림 전송 중 오류가 발생했습니다.');
      console.error('테스트 알림 전송 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('실제 알림을 전송하시겠습니까?')) {
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await sendProdNotice(
        customForm.title,
        customForm.body,
        customForm.url,
        customForm.adminPassword
      );
      
      if (response.code === 200) {
        setSubmitMessage('실제 알림이 성공적으로 전송되었습니다.');
        setCustomForm({ title: '', body: '', url: '', adminPassword: '' });
      } else {
        setSubmitMessage(response.message || '실제 알림 전송에 실패했습니다.');
      }
    } catch (err) {
      setSubmitMessage('실제 알림 전송 중 오류가 발생했습니다.');
      console.error('실제 알림 전송 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={classes.center64}>
        <div className={classes.centerTextLg}>카테고리를 불러오는 중...</div>
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
    <div className={classes.root}>
      <div className={classes.sectionHeader}>
        <h1 className={classes.sectionTitle}>전체 알림 발송</h1>
        <p className={classes.sectionDesc}>테스트 알림과 실제 알림을 발송할 수 있습니다.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className={classes.tabs}>
        <div className={classes.tabBarWrapper}>
          <nav className={classes.tabBar}>
            <button
              onClick={() => setActiveTab('test')}
              className={`${classes.tabButton} ${activeTab === 'test' ? classes.tabButtonActive : ''}`}
            >
              테스트 알림
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`${classes.tabButton} ${activeTab === 'custom' ? classes.tabButtonActive : ''}`}
            >
              실제 알림
            </button>
          </nav>
        </div>
      </div>

      {/* 메시지 표시 */}
      {submitMessage && (
        <div className={`${classes.alert} ${submitMessage.includes('성공') ? classes.alertSuccess : classes.alertError}`}>
          {submitMessage}
        </div>
      )}

      {/* 테스트 알림 폼 */}
      {activeTab === 'test' && (
        <div className={classes.card}>
          <div className={classes.cardHeader}>
            <h2 className={classes.cardTitle}>테스트 알림 전송</h2>
            <p className={classes.cardDesc}>개발 환경에서 테스트 알림을 전송합니다.</p>
          </div>
          
          <form onSubmit={handleTestSubmit} className={classes.form}>
            <div className={classes.formGroup}>
              <label htmlFor="category" className={classes.label}>
                카테고리
              </label>
              <select
                id="category"
                value={testForm.category}
                onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                required
                className={classes.select}
              >
                <option value="">카테고리를 선택하세요</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.korName} ({category.name})
                  </option>
                ))}
              </select>
            </div>

            <div className={classes.formGroup}>
              <label htmlFor="subject" className={classes.label}>
                제목
              </label>
              <input
                type="text"
                id="subject"
                value={testForm.subject}
                onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                required
                className={classes.input}
                placeholder="공지 제목을 입력하세요"
              />
            </div>

            <div className={classes.formGroup}>
              <label htmlFor="articleId" className={classes.label}>
                아티클 ID
              </label>
              <input
                type="text"
                id="articleId"
                value={testForm.articleId}
                onChange={(e) => setTestForm({ ...testForm, articleId: e.target.value })}
                required
                className={classes.input}
                placeholder="아티클 ID를 입력하세요"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={classes.submitButtonPrimary}
            >
              {isSubmitting ? '전송 중...' : '테스트 알림 전송'}
            </button>
          </form>
        </div>
      )}

      {/* 실제 알림 폼 */}
      {activeTab === 'custom' && (
        <div className={classes.card}>
          <div className={classes.cardHeader}>
            <h2 className={classes.cardTitle}>실제 알림 전송</h2>
            <p className={classes.cardDesc}>실제 사용자에게 실제 알림을 전송합니다.</p>
          </div>
          
          <form onSubmit={handleCustomSubmit} className={classes.form}>
            <div className={classes.formGroup}>
              <label htmlFor="title" className={classes.label}>
                제목
              </label>
              <input
                type="text"
                id="title"
                value={customForm.title}
                onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                required
                className={classes.input}
                placeholder="알림 제목을 입력하세요"
              />
            </div>

            <div className={classes.formGroup}>
              <label htmlFor="body" className={classes.label}>
                내용
              </label>
              <textarea
                id="body"
                rows={4}
                value={customForm.body}
                onChange={(e) => setCustomForm({ ...customForm, body: e.target.value })}
                required
                className={classes.textarea}
                placeholder="알림 내용을 입력하세요"
              />
            </div>

            <div className={classes.formGroup}>
              <label htmlFor="url" className={classes.label}>
                URL (선택사항)
              </label>
              <input
                type="url"
                id="url"
                value={customForm.url}
                onChange={(e) => setCustomForm({ ...customForm, url: e.target.value })}
                className={classes.input}
                placeholder="https://example.com"
              />
            </div>

            <div className={classes.formGroup}>
              <label htmlFor="adminPassword" className={classes.label}>
                관리자 비밀번호
              </label>
              <input
                type="password"
                id="adminPassword"
                value={customForm.adminPassword}
                onChange={(e) => setCustomForm({ ...customForm, adminPassword: e.target.value })}
                required
                className={classes.input}
                placeholder="관리자 비밀번호를 입력하세요"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={classes.submitButtonDanger}
            >
              {isSubmitting ? '전송 중...' : '실제 알림 전송'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
