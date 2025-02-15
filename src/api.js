import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', // URL base do backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
