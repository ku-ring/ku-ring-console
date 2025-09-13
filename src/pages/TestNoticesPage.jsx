import { useState, useEffect } from 'react';
import classes from './TestNoticesPage.module.css';

export default function TestNoticesPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    articleId: ''
  });

  // 카테고리 목록 가져오기
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/v2/notices/categories');
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 200) {
          setCategories(result.data || []);
        } else {
          console.error('카테고리 목록 조회 실패:', result.message);
        }
      } else {
        throw new Error('카테고리 목록 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('카테고리 목록 조회 중 오류:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 컴포넌트 마운트 시 카테고리 목록 로드
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.category || !formData.subject || !formData.articleId) {
      setMessage('카테고리, 제목, 게시글 ID는 필수입니다.');
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
      return;
    }

    // Alert로 확인
    const confirmed = window.confirm('테스트 알림을 전송하시겠습니까?');
    if (!confirmed) {
      return;
    }

    // API 호출
    sendTestNotification(formData);
  };

  const sendTestNotification = async (data) => {
    try {
      setLoading(true);
      
      // 실제 API 호출 (JWT 토큰이 필요할 수 있음)
      const response = await fetch('/api/v2/admin/notices/dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // JWT 토큰
        },
        body: JSON.stringify({
          category: data.category,
          subject: data.subject,
          articleId: data.articleId
        })
      });

      if (response.ok) {
        setMessage('테스트 알림이 성공적으로 전송되었습니다.');
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
        
        // 폼 초기화
        setFormData({
          category: '',
          subject: '',
          articleId: ''
        });
      } else {
        throw new Error('테스트 알림 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setMessage('테스트 알림 전송 중 오류가 발생했습니다.');
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    } finally {
      setLoading(false);
    }
  };


  

  return (
    <div className={classes.container}>
      <div className={`${classes.banner} ${showBanner ? classes.bannerShow : ''}`}>
        {message}
      </div>
      <div className={classes.header}>
        <h1 className={classes.title}>테스트 알림</h1>
        <p className={classes.subtitle}>테스트 용도로 전송되는 알림을 생성하고 관리하세요</p>
      </div>

      <div className={classes.formContainer}>
        <form onSubmit={handleSubmit} className={classes.form}>
            <div className={classes.formGroup}>
              <label className={classes.label}>카테고리 *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={classes.input}
                required
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading ? '카테고리 로딩 중...' : '카테고리를 선택하세요'}
                </option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.korName || category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={classes.formGroup}>
              <label className={classes.label}>제목 *</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={classes.input}
                placeholder="알림 제목을 입력하세요"
                required
              />
            </div>
            <div className={classes.formGroup}>
              <label className={classes.label}>게시글 ID *</label>
              <input
                type="text"
                name="articleId"
                value={formData.articleId}
                onChange={handleInputChange}
                className={classes.input}
                placeholder="게시글 ID를 입력하세요"
                required
              />
              <small className={classes.helpText}>
                테스트할 공지사항의 고유 ID를 입력하세요
              </small>
            </div>
            <div className={classes.formActions}>
              <button 
                type="submit" 
                className={classes.submitBtn}
                disabled={loading}
              >
                {loading ? '전송 중...' : '테스트 알림 발송'}
              </button>
            </div>
        </form>
      </div>
      
    </div>
  );
}
