const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadImage, deleteImage } = require('../config/cloudinary');

// Criar post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    let imageData;

    if (req.file) {
      // Se recebeu um arquivo
      const base64Image = req.file.buffer.toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
      imageData = await uploadImage(dataURI);
    } else if (req.body.imageUrl) {
      // Se recebeu uma URL de imagem
      imageData = await uploadImage(req.body.imageUrl);
    } else {
      return res.status(400).json({ message: 'É necessário enviar uma imagem ou URL de imagem' });
    }

    // Cria o post
    const post = new Post({
      user: req.user._id,
      imageUrl: imageData.url,
      cloudinaryId: imageData.publicId,
      caption: req.body.caption
    });

    await post.save();
    
    // Popula os dados do usuário no post
    await post.populate('user', 'name avatar');
    
    res.status(201).json({
      message: 'Post criado com sucesso',
      post
    });
  } catch (error) {
    console.error('Erro ao criar post:', error);
    res.status(500).json({ message: 'Erro ao criar post' });
  }
});

// Buscar todos os posts
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .populate('reactions.user', 'name avatar');
    
    res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ message: 'Erro ao buscar posts' });
  }
});

// Deletar post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado ou sem permissão' });
    }

    // Deleta a imagem do Cloudinary
    if (post.cloudinaryId) {
      await deleteImage(post.cloudinaryId);
    }

    await post.deleteOne();
    res.json({ message: 'Post deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    res.status(500).json({ message: 'Erro ao deletar post' });
  }
});

// Curtir/Descurtir post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    
    if (likeIndex === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json({
      message: likeIndex === -1 ? 'Post curtido' : 'Curtida removida',
      likes: post.likes.length
    });
  } catch (error) {
    console.error('Erro ao atualizar curtida:', error);
    res.status(500).json({ message: 'Erro ao atualizar curtida' });
  }
});

// Adicionar comentário
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'O comentário não pode estar vazio' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }

    post.comments.push({
      user: req.user._id,
      text: text.trim()
    });

    await post.save();
    await post.populate('comments.user', 'name avatar');
    
    res.json({
      message: 'Comentário adicionado com sucesso',
      comments: post.comments
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ message: 'Erro ao adicionar comentário' });
  }
});

// Adicionar reação
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: 'É necessário enviar um emoji' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }

    // Remove reação existente do mesmo usuário
    post.reactions = post.reactions.filter(
      reaction => reaction.user.toString() !== req.user._id.toString()
    );

    // Adiciona nova reação
    post.reactions.push({
      user: req.user._id,
      emoji
    });

    await post.save();
    await post.populate('reactions.user', 'name avatar');
    
    res.json({
      message: 'Reação adicionada com sucesso',
      reactions: post.reactions
    });
  } catch (error) {
    console.error('Erro ao adicionar reação:', error);
    res.status(500).json({ message: 'Erro ao adicionar reação' });
  }
});

module.exports = router;
