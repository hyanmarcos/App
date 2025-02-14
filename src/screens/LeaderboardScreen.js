import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const scoresStr = await AsyncStorage.getItem('scores');
      const scores = scoresStr ? JSON.parse(scoresStr) : [];
      
      // Get all profile images
      const userImages = {};
      const users = [...new Set(scores.map(score => score.username))];
      
      for (const username of users) {
        const imageKey = `profileImage_${username}`;
        const profileImage = await AsyncStorage.getItem(imageKey);
        userImages[username] = profileImage;
      }
      
      // Calculate total points for each user
      const userScores = scores.reduce((acc, score) => {
        if (!acc[score.username]) {
          acc[score.username] = 0;
        }
        acc[score.username] += score.points;
        return acc;
      }, {});

      // Convert to array and sort
      const sortedLeaderboard = Object.entries(userScores)
        .map(([username, points]) => ({ 
          username, 
          points,
          profileImage: userImages[username]
        }))
        .sort((a, b) => b.points - a.points);

      setLeaderboard(sortedLeaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.rankItem}>
      <Text style={styles.rank}>#{index + 1}</Text>
      {item.profileImage ? (
        <Image 
          source={{ uri: item.profileImage }} 
          style={styles.profileImage} 
        />
      ) : (
        <View style={styles.profileImagePlaceholder}>
          <Text style={styles.profileImagePlaceholderText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.username}>{item.username}</Text>
      <Text style={styles.points}>{item.points} pts</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ranking</Text>
      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={(item) => item.username}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#ff4081',
  },
  rankItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 15,
    width: 40,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff4081',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  profileImagePlaceholderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    flex: 1,
    fontSize: 16,
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4081',
  },
});
