import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { getStockLogo, getFallbackInitials } from '../utils/getStockLogo'

interface Props {
  symbol: string
  name: string
  size?: number
}

const getSymbolColor = (symbol: string) => {
  const colors = [
    '#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', 
    '#8B5CF6', '#14B8A6', '#F43F5E', '#06B6D4'
  ]
  let hash = 0
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const StockLogo = ({ symbol, name, size = 40 }: Props) => {
  const urls = getStockLogo(symbol)
  const [urlIndex, setUrlIndex] = useState(0)
  const [allFailed, setAllFailed] = useState(false)
  const initials = getFallbackInitials(name)
  const bgColor = getSymbolColor(symbol)

  const handleError = () => {
    console.log(`Logo failed for ${symbol} at URL: ${urls[urlIndex]}`)
    if (urlIndex < urls.length - 1) {
      setUrlIndex(prev => prev + 1)
    } else {
      console.log(`All logo URLs failed for ${symbol} — showing initials`)
      setAllFailed(true)
    }
  }

  if (allFailed) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
      </View>
    )
  }

  return (
    <Image
      key={`${symbol}-${urlIndex}`}
      source={{ uri: urls[urlIndex] }}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#F8F9FA' }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={200}
      onError={handleError}
    />
  )
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFF',
    fontWeight: '700',
  },
})

export default StockLogo
