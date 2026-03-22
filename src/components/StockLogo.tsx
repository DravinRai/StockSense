import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getLocalLogo, getFallbackInitials } from '../utils/getStockLogo'

const COLORS = ['#E8F5E9','#E3F2FD','#FFF3E0','#FCE4EC','#F3E5F5','#E0F7FA']
const TEXT_COLORS = ['#2E7D32','#1565C0','#E65100','#880E4F','#4A148C','#006064']

const getColorIndex = (symbol: string) => {
  let sum = 0
  for (let i = 0; i < symbol.length; i++) sum += symbol.charCodeAt(i)
  return sum % COLORS.length
}

interface Props {
  symbol: string
  name: string
  size?: number
}

const StockLogo = ({ symbol, name, size = 40 }: Props) => {
  const LogoComponent = getLocalLogo(symbol)
  const initials = getFallbackInitials(name)
  const colorIdx = getColorIndex(symbol)

  const FallbackView = () => (
    <View style={[styles.fallback, {
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: COLORS[colorIdx],
    }]}>
      <Text style={[styles.initials, { fontSize: size * 0.33, color: TEXT_COLORS[colorIdx] }]}>
        {initials}
      </Text>
    </View>
  )

  if (!LogoComponent) return <FallbackView />

  // LogoComponent is a React component from react-native-svg-transformer
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#F8F8F8' }}>
      <LogoComponent
        width={size}
        height={size}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEEEEE' },
  initials: { fontWeight: '700' },
})

export default StockLogo
