import {redirect} from "react-router-dom";
import { loginAdmin } from '../util/api.js';
import {saveToken} from "../util/auth.js";

export async function authAction({request}) {
    try {
        const data = await request.formData();
        const authData = {
            loginId: data.get('loginId'),
            password: data.get('password')
        };

        const resData = await loginAdmin(authData.loginId, authData.password);
        const token = resData.data.accessToken;

        saveToken(token);

        return redirect('/');
    } catch (error) {
        console.error('로그인 요청 중 오류 발생:', error);
        
        // API 에러 응답 처리
        if (error.message.includes('422') || error.message.includes('401')) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: '인증에 실패했습니다.' 
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ 
            success: false, 
            message: `네트워크 오류가 발생했습니다: ${error.message}` 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
