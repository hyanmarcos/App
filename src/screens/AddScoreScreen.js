import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCORE_TYPES = [
  { type: 'Bonita', points: 1 },
  { type: 'Feia', points: 5 },
  { type: 'Horrível', points: 10 },
  { type: 'Repetida', points: 0.5 },
  { type: 'Mulher Inédita', points: 2 },
  { type: 'Mulher de Amigo', points: 5 },
  { type: 'Mulher de Inimigo', points: 10 },
  { type: 'Mãe do Amigo', points: 20 },
  { type: 'Tia do Amigo', points: 15 },
  { type: 'Priminha gostosa', points: 10 },
  { type: 'Mulher deficiente', points: 20 },
  { type: 'Tia da barraca', points: 8 },
  { type: 'Anã', points: 30 },
  { type: 'Crackuda', points: 100 },
  { type: 'Travesti', points: 200 },
  { type: 'Trans', points: 50 },
  { type: 'Gay', points: 250 }, // 
  { type: 'Gorda', points: 0.5 }, //Create a function to calculate the score per kg
  { type: 'Ex namorada ou ficante', points: -300 },
];

export default function AddScoreScreen({ navigation }) {
  const addScore = async (type, points) => {
    try {
      const username = await AsyncStorage.getItem('username');
      const scoresStr = await AsyncStorage.getItem('scores');
      const scores = scoresStr ? JSON.parse(scoresStr) : [];
      
      const newScore = {
        username,
        type,
        points,
        date: new Date().toISOString(),
      };
      
      scores.push(newScore);
      await AsyncStorage.setItem('scores', JSON.stringify(scores));
      Alert.alert('Sucesso', 'Pontuação registrada!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a pontuação');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Selecione o tipo:</Text>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {SCORE_TYPES.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={styles.scoreButton}
            onPress={() => addScore(item.type, item.points)}
          >
            <Text style={styles.scoreButtonText}>{item.type}</Text>
            <Text style={styles.pointsText}>{item.points} pontos</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scoreButton: {
    backgroundColor: '#ff4081',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsText: {
    color: 'white',
    fontSize: 16,
  },
});
