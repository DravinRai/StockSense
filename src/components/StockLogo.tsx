import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { getStockLogo, getFallbackInitials } from '../utils/getStockLogo'

interface Props {
  symbol: string
  name: string
  size?: number
}

const StockLogo = ({ symbol, name, size = 40 }: Props) => {
  const [error, setError] = useState(false)
  const logoUrl = getStockLogo(symbol)
  const initials = getFallbackInitials(name)

  if (error) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
      </View>
    )
  }

  return (
    <Image
      source={{ uri: logoUrl }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={200}
      onError={() => setError(true)}
    />
  )
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#555',
    fontWeight: '700',
  },
})

export default StockLogo
