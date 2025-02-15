const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Validação de email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validação dos campos
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Todos os campos são obrigatórios',
        missingFields: {
          name: !name,
          email: !email,
          password: !password
        }
      });
    }

    // Validação do email
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    // Validação da senha
    if (password.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
    }
    
    // Verifica se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está em uso' });
    }

    // Cria o novo usuário
    const user = new User({
      name,
      email,
      password,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`
    });

    await user.save();

    // Gera o token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retorna os dados do usuário (sem a senha)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      score: user.score,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação dos campos
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email e senha são obrigatórios',
        missingFields: {
          email: !email,
          password: !password
        }
      });
    }

    // Busca o usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Verifica a senha
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retorna os dados do usuário (sem a senha)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      score: user.score,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

module.exports = router;
