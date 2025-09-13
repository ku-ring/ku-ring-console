import { useState, useEffect } from 'react';
import { useActionData, Form, useNavigation } from 'react-router-dom';
import classes from './LoginPage.module.css';
import kuringLogo from "../assets/kuringLogo.png";
import Button from "../components/ui/Button.jsx";

export default function LoginPage() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const [errorMessage, setErrorMessage] = useState('');

  const isSubmitting = navigation.state === 'submitting';

  useEffect(() => {
    if (actionData && !actionData.success) {
      setErrorMessage(actionData.message || '로그인에 실패했습니다.');
    }
  }, [actionData]);

  return (
    <div className={classes.root}>
      <div className={classes.wrapper}>
        <img src={kuringLogo} alt="Kuring Logo" className={classes.logo} />
        <div>
          <h2 className={classes.headerTitle}>Kuring Console</h2>
        </div>
        <Form className={classes.form} method="post">
          {errorMessage && (
            <div className={classes.errorBox}>{errorMessage}</div>
          )}
          
          <div className={classes.fieldGroup}>
            <div>
              <label htmlFor="loginId" className={classes.srOnly}>
                ID
              </label>
              <input
                id="loginId"
                name="loginId"
                type="text"
                required
                className={`${classes.input} ${classes.inputTop}`}
                placeholder="ID"
              />
            </div>
            <div>
              <label htmlFor="password" className={classes.srOnly}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`${classes.input} ${classes.inputBottom}`}
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? '로그인 중...' : '로그인'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
