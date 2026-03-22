export const getStockLogo = (symbol: string): string[] => {
  const clean = symbol
    .replace('.NS', '')
    .replace('.BO', '')
    .toUpperCase()
    .trim()
  
  return [
    `https://storage.googleapis.com/iex/api/logos/${clean}.png`,
    `https://img.logo.dev/ticker/${clean}?token=pk_J7JoNEiuTzKGMjkMu7KQLA`,
    `https://assets.parqet.com/logos/symbol/${clean}?format=jpg`,
    `https://eodhd.com/img/logos/IN/${clean}.png`,
  ]
}

export const getFallbackInitials = (name: string): string => {
  if (!name) return '??'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
