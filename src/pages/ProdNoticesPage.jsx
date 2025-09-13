import { useState } from 'react';
import classes from './ProdNoticesPage.module.css';

export default function ProdNoticesPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    url: '',
    adminPassword: ''
  });


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
    if (!formData.title || !formData.body || !formData.adminPassword) {
      setMessage('제목, 내용, 관리자 비밀번호는 필수입니다.');
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
      return;
    }

    // Alert로 확인
    const confirmed = window.confirm('정말로 전체 사용자에게 알림을 전송하시겠습니까?');
    if (!confirmed) {
      return;
    }

    // API 호출
    sendNotification(formData);
  };

  const sendNotification = async (data) => {
    try {
      setLoading(true);
      
      // 실제 API 호출 (JWT 토큰이 필요할 수 있음)
      const response = await fetch('/api/v2/admin/notices/prod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // JWT 토큰
        },
        body: JSON.stringify({
          arg0: {
            title: data.title,
            body: data.body,
            url: data.url || '',
            adminPassword: data.adminPassword
          },
          arg1: {
            principal: {},
            authorities: []
          }
        })
      });

      if (response.ok) {
        setMessage('알림이 성공적으로 전송되었습니다.');
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
        
        // 폼 초기화
        setFormData({
          title: '',
          body: '',
          url: '',
          adminPassword: ''
        });
      } else {
        throw new Error('알림 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setMessage('알림 전송 중 오류가 발생했습니다.');
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
        <h1 className={classes.title}>실제 알림</h1>
        <p className={classes.subtitle}>실제 사용자에게 전송되는 알림을 생성하고 관리하세요</p>
      </div>

      <div className={classes.formContainer}>
        <form onSubmit={handleSubmit} className={classes.form}>
            <div className={classes.formGroup}>
              <label className={classes.label}>제목 *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={classes.input}
                placeholder="알림 제목을 입력하세요"
                required
              />
            </div>
            <div className={classes.formGroup}>
              <label className={classes.label}>내용 *</label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                className={classes.textarea}
                rows="4"
                placeholder="알림 내용을 입력하세요"
                required
              />
            </div>
            <div className={classes.formGroup}>
              <label className={classes.label}>URL (선택사항)</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className={classes.input}
                placeholder="https://example.com"
              />
              <small className={classes.helpText}>
                클릭 시 이동할 링크를 입력하세요
              </small>
            </div>
            <div className={classes.formGroup}>
              <label className={classes.label}>관리자 비밀번호 *</label>
              <input
                type="password"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleInputChange}
                className={classes.input}
                placeholder="관리자 비밀번호를 입력하세요"
                required
              />
              <small className={classes.helpText}>
                실제 알림 전송을 위한 관리자 인증이 필요합니다
              </small>
            </div>
            <div className={classes.formActions}>
              <button 
                type="submit" 
                className={classes.submitBtn}
                disabled={loading}
              >
                {loading ? '전송 중...' : '알림 발송'}
              </button>
            </div>
        </form>
      </div>
      
    </div>
  );
}
