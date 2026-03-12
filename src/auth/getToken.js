import axios from 'axios';
import { HOROSHOP_API_URL, HOROSHOP_LOGIN, HOROSHOP_PASSWORD } from '../config.js';

export async function getToken() {
    try {
        const response = await axios.post(
            HOROSHOP_API_URL,
            {
                login: HOROSHOP_LOGIN,
                password: HOROSHOP_PASSWORD
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (response.data?.status === 'OK') {
            return response.data.response.token;
        }

        throw new Error(
            `Ошибка авторизации: ${response.data?.response?.message || 'неизвестная ошибка'}`
        );
    } catch (error) {
        throw new Error(`Ошибка запроса токена: ${error.message}`);
    }
}