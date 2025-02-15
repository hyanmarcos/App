import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser, loginUser } from '../auth';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleRegister = async () => {
    console.log('Tentando registrar:', { name, email, password }); // Log para depuração
    try {
      const data = await registerUser(name, email, password);
      Alert.alert('Sucesso', data.message);
      setIsLogin(true); // Muda para a tela de login após registro
    } catch (error) {
      console.error('Erro no registro:', error); // Log para depuração
      Alert.alert('Erro', error.message);
    }
  };

  const handleLogin = async () => {
    if (username.trim()) {
      try {
        await AsyncStorage.setItem('username', username);
        navigation.replace('Home');
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível fazer login');
      }
    } else {
      try {
        const data = await loginUser(email, password);
        await AsyncStorage.setItem('token', data.token); // Armazenar token
        Alert.alert('Sucesso', data.message);
      } catch (error) {
        Alert.alert('Erro', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      {isLogin ? (
        <View>
          <Text style={styles.title}>Carnaval Score</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            value={username}
            onChangeText={setUsername}
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.title}>{isLogin ? 'Login' : 'Registrar'}</Text>
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
          <Button title={isLogin ? 'Login' : 'Registrar'} onPress={isLogin ? handleLogin : handleRegister} />
        </View>
      )}
      <Button title={isLogin ? 'Criar conta' : 'Já tenho uma conta'} onPress={() => setIsLogin(!isLogin)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#ff4081',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#ff4081',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
