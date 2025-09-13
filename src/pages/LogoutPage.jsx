import { clearToken } from '../util/auth';

export function logoutAction() {
  clearToken();
  return { success: true };
}
