export const getLocalLogo = (symbol: string): any => {
  const clean = symbol.replace('.NS', '').replace('.BO', '').toUpperCase().trim()
  switch (clean) {
    case 'SUNPHARMA': return require('../../assets/logos/SUNPHARMA.svg')
    case 'RELIANCE': return require('../../assets/logos/RELIANCE.svg')
    case 'HDFCBANK': return require('../../assets/logos/HDFCBANK.svg')
    case 'ICICIBANK': return require('../../assets/logos/ICICIBANK.svg')
    case 'SBIN': return require('../../assets/logos/SBIN.svg')
    case 'TCS': return require('../../assets/logos/TCS.svg')
    case 'INFY': return require('../../assets/logos/INFY.svg')
    case 'WIPRO': return require('../../assets/logos/WIPRO.svg')
    case 'BHARTIARTL': return require('../../assets/logos/BHARTIARTL.svg')
    case 'TATAMOTORS': return require('../../assets/logos/TATAMOTORS.svg')
    case 'TATASTEEL': return require('../../assets/logos/TATASTEEL.svg')
    case 'IRFC': return require('../../assets/logos/IRFC.svg')
    case 'IOCL': return require('../../assets/logos/IOCL.svg')
    case 'YESBANK': return require('../../assets/logos/YESBANK.svg')
    case 'SPICEJET': return require('../../assets/logos/SPICEJET.svg')
    case 'IDEA': return require('../../assets/logos/IDEA.svg')
    case 'ZOMATO': return require('../../assets/logos/ZOMATO.svg')
    case 'PAYTM': return require('../../assets/logos/PAYTM.svg')
    case 'DRREDDY': return require('../../assets/logos/DRREDDY.svg')
    case 'ITC': return require('../../assets/logos/ITC.svg')
    case 'PNB': return require('../../assets/logos/PNB.svg')
    case 'SAIL': return require('../../assets/logos/SAIL.svg')
    case 'NHPC': return require('../../assets/logos/NHPC.svg')
    case 'DELHIVERY': return require('../../assets/logos/DELHIVERY.svg')
    case 'NTPC': return require('../../assets/logos/NTPC.svg')
    case 'AXISBANK': return require('../../assets/logos/AXISBANK.svg')
    case 'KOTAKBANK': return require('../../assets/logos/KOTAKBANK.svg')
    case 'BAJFINANCE': return require('../../assets/logos/BAJFINANCE.svg')
    case 'HCLTECH': return require('../../assets/logos/HCLTECH.svg')
    case 'TECHM': return require('../../assets/logos/TECHM.svg')
    case 'MARUTI': return require('../../assets/logos/MARUTI.svg')
    case 'CANBK': return require('../../assets/logos/CANBK.svg')
    case 'IDFCFIRSTB': return require('../../assets/logos/IDFCFIRSTB.svg')
    case 'IDBI': return require('../../assets/logos/IDBI.svg')
    case 'JKBANK': return require('../../assets/logos/JKBANK.svg')
    case 'CENTRALBK': return require('../../assets/logos/CENTRALBK.svg')
    case 'RVNL': return require('../../assets/logos/RVNL.svg')
    case 'NBCC': return require('../../assets/logos/NBCC.svg')
    case 'SJVN': return require('../../assets/logos/SJVN.svg')
    case 'OLAELEC': return require('../../assets/logos/OLAELEC.svg')
    case 'EMCUREPHARMA': return require('../../assets/logos/EMCUREPHARMA.svg')
    case 'NTPCGREEN': return require('../../assets/logos/NTPCGREEN.svg')
    case 'ADANIPORTS': return require('../../assets/logos/ADANIPORTS.svg')
    case 'AVANCE': return require('../../assets/logos/AVANCE.svg')
    case 'BRIGHTCOM': return require('../../assets/logos/BRIGHTCOM.svg')
    case 'EMPOWERIND': return require('../../assets/logos/EMPOWERIND.svg')
    case 'GLOTTIS': return require('../../assets/logos/GLOTTIS.svg')
    case 'HWAY': return require('../../assets/logos/HWAY.svg')
    case 'PSB': return require('../../assets/logos/PSB.svg')
    case 'SOUTHBANK': return require('../../assets/logos/SOUTHBANK.svg')
    case 'URBNCOMP': return require('../../assets/logos/URBNCOMP.svg')
    default: return null
  }
}

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
