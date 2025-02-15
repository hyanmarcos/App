import api from './api';

export const registerUser = async (name, email, password) => {
  try {
    const response = await api.post('/auth/register', { name, email, password });
    console.log('Registro bem-sucedido:', response.data); // Log para depuração
    return response.data;
  } catch (error) {
    console.error('Erro no registro:', error.response.data); // Log para depuração
    throw error.response.data;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
