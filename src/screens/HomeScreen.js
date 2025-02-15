import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import EmojiSelector from 'react-native-emoji-selector';
import ImageViewer from 'react-native-image-zoom-viewer';
import { registerUser, loginUser } from '../auth';
import api from '../api';

export default function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comment, setComment] = useState('');
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
    loadCurrentUser();
    setShowUserModal(true); // Mostrar modal de autenticação ao carregar
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setTempUserName(user.name);
      } else {
        // Se não houver dados do usuário, usar dados padrão
        const defaultUser = {
          id: '1',
          name: 'Usuário',
          avatar: `https://ui-avatars.com/api/?name=Usuario&background=random&size=200`,
        };
        await AsyncStorage.setItem('userData', JSON.stringify(defaultUser));
        setCurrentUser(defaultUser);
        setTempUserName(defaultUser.name);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const updateUserData = async () => {
    if (!tempUserName.trim()) {
      Alert.alert('Erro', 'O nome do usuário não pode estar vazio');
      return;
    }

    try {
      const updatedUser = {
        ...currentUser,
        name: tempUserName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(tempUserName)}&background=random&size=200`,
      };

      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setShowUserModal(false);

      // Atualizar o nome do usuário em todos os posts existentes
      const updatedPosts = posts.map(post => {
        if (post.user.id === currentUser.id) {
          return {
            ...post,
            user: updatedUser,
          };
        }
        return post;
      });

      setPosts(updatedPosts);
      await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));

      Alert.alert('Sucesso', 'Dados do usuário atualizados com sucesso!');
    } catch (error) {
      console.error('Error updating user data:', error);
      Alert.alert('Erro', 'Não foi possível atualizar os dados do usuário');
    }
  };

  const handleNewPost = () => {
    if (!currentUser) {
      alert('Erro ao carregar dados do usuário');
      return;
    }

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancelar', 'Tirar Foto', 'Escolher da Galeria'],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        try {
          let result;
          if (buttonIndex === 1) {
            // Verificar permissão da câmera
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              alert('Precisamos de permissão para acessar sua câmera');
              return;
            }
            // Abrir câmera
            result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
            });
          } else if (buttonIndex === 2) {
            // Abrir galeria
            result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
            });
          }

          if (result && !result.canceled) {
            const newPost = {
              id: Date.now().toString(),
              image: result.assets[0].uri,
              likes: 0,
              comments: [],
              reactions: {},
              user: {
                id: currentUser.id,
                name: currentUser.name,
                avatar: currentUser.avatar,
              },
              timestamp: new Date().toISOString(),
            };

            const updatedPosts = [newPost, ...posts];
            setPosts(updatedPosts);
            await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));
          }
        } catch (error) {
          console.error('Error creating post:', error);
        }
      }
    );
  };

  const handleLike = async (postId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, likes: post.likes + 1 };
      }
      return post;
    });
    setPosts(updatedPosts);
    await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));
  };

  const handleReaction = async (postId, emoji) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const reactions = { ...post.reactions };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...post, reactions };
      }
      return post;
    });
    setPosts(updatedPosts);
    await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));
    setShowEmojiPicker(false);
  };

  const handleComment = async (postId) => {
    if (!comment.trim()) return;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: Date.now().toString(),
          text: comment,
          user: {
            id: currentUser.id,
            name: currentUser.name,
          },
          timestamp: new Date().toISOString(),
        };
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    });
    setPosts(updatedPosts);
    await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));
    setComment('');
  };

  const loadPosts = async () => {
    try {
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      Alert.alert('Erro', 'Não foi possível carregar os posts');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      const data = await registerUser(name, email, password);
      Alert.alert('Sucesso', data.message);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleLogin = async () => {
    try {
      const data = await loginUser(email, password);
      Alert.alert('Sucesso', data.message);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <TouchableOpacity 
        style={styles.postHeader}
        onPress={() => navigation.navigate('Profile', { userId: item.user.id })}
      >
        <Image 
          source={{ 
            uri: item.user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.user.name)
          }} 
          style={styles.avatar} 
        />
        <Text style={styles.username}>{item.user.name}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => {
        setSelectedPost(item);
        setImageViewerVisible(true);
      }}>
        <Image source={{ uri: item.image }} style={styles.postImage} />
      </TouchableOpacity>

      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.actionButton}>
          <FontAwesome name="heart-o" size={24} color="#333" />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          setSelectedPost(item);
          setShowEmojiPicker(true);
        }} style={styles.actionButton}>
          <FontAwesome name="smile-o" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSelectedPost(item)} style={styles.actionButton}>
          <FontAwesome name="comment-o" size={24} color="#333" />
          <Text style={styles.actionText}>{item.comments.length}</Text>
        </TouchableOpacity>
      </View>

      {Object.entries(item.reactions).map(([emoji, count]) => (
        <Text key={emoji} style={styles.reaction}>
          {emoji} {count}
        </Text>
      ))}

      {selectedPost?.id === item.id && (
        <View style={styles.commentSection}>
          <FlatList
            data={item.comments}
            keyExtractor={(comment) => comment.id}
            renderItem={({ item: comment }) => (
              <View style={styles.commentContainer}>
                <Text style={styles.commentUser}>{comment.user.name}</Text>
                <Text>{comment.text}</Text>
              </View>
            )}
          />
          <View style={styles.commentInput}>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Adicione um comentário..."
              style={styles.input}
            />
            <TouchableOpacity onPress={() => handleComment(item.id)}>
              <FontAwesome name="send" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#2196f3" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar usuários..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={styles.feedContainer}
      />

      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.emojiPickerContainer}>
            <EmojiSelector
              onEmojiSelected={(emoji) => {
                if (selectedPost) {
                  handleReaction(selectedPost.id, emoji);
                }
              }}
              showSearchBar={false}
              columns={8}
            />
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowEmojiPicker(false)}
          >
            <Text>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
      >
        {selectedPost && (
          <ImageViewer
            imageUrls={[{ url: selectedPost.image }]}
            enableSwipeDown
            onSwipeDown={() => setImageViewerVisible(false)}
          />
        )}
      </Modal>

      {/* Modal para editar dados do usuário */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.userModalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            
            <Image
              source={{ uri: currentUser?.avatar }}
              style={styles.userModalAvatar}
            />

            <TextInput
              style={styles.userNameInput}
              placeholder="Seu nome"
              value={tempUserName}
              onChangeText={setTempUserName}
              autoCapitalize="words"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setTempUserName(currentUser?.name || '');
                  setShowUserModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={updateUserData}
              >
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.authModalContent}>
            <Text style={styles.modalTitle}>Autenticação</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleRegister}
              >
                <Text style={styles.modalButtonText}>Registrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleLogin}
              >
                <Text style={styles.modalButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => {}}
        >
          <FontAwesome name="home" size={24} color="#2196f3" />
          <Text style={[styles.tabText, styles.activeTabText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <FontAwesome name="trophy" size={24} color="#666" />
          <Text style={styles.tabText}>Ranking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newPostTab}
          onPress={handleNewPost}
        >
          <View style={styles.newPostButton}>
            <FontAwesome name="plus" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('AddScore')}
        >
          <FontAwesome name="star" size={24} color="#666" />
          <Text style={styles.tabText}>Score</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setShowUserModal(true)}
        >
          <FontAwesome name="user" size={24} color="#666" />
          <Text style={styles.tabText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
  reaction: {
    fontSize: 16,
    marginRight: 5,
  },
  commentSection: {
    marginTop: 10,
  },
  commentContainer: {
    marginVertical: 5,
  },
  commentUser: {
    fontWeight: 'bold',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  emojiPickerContainer: {
    backgroundColor: '#fff',
    height: 300,
  },
  closeButton: {
    backgroundColor: '#fff',
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  feedContainer: {
    flex: 1,
    marginBottom: 60, // Espaço para a barra de navegação
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 5,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
  },
  newPostTab: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  newPostButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabText: {
    color: '#2196f3',
  },
  userModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  userModalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  userNameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  saveButton: {
    backgroundColor: '#4caf50',
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
});
