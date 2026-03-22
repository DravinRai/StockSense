import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius } from '../constants/theme';

interface AIInsightsTriggerProps {
  onPress: () => void;
  loading: boolean;
}

const AIInsightsTrigger: React.FC<AIInsightsTriggerProps> = ({ onPress, loading }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        {loading ? (
          <ActivityIndicator size="small" color="#111" />
        ) : (
          <>
            <Text style={styles.sparkleIcon}>✦</Text>
            <Text style={styles.triggerText}>Get AI Insights</Text>
          </>
        )}
      </View>
      {!loading && (
        <Text style={styles.poweredText}>Powered by Claude</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    height: 48,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginTop: 16,
    marginBottom: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  sparkleIcon: {
    fontSize: 14,
    color: '#111',
  },
  triggerText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 14,
  },
  poweredText: {
    color: '#BBBBBB',
    fontSize: 11,
  },
});

export default AIInsightsTrigger;
