const LOCAL_LOGOS: Record<string, any> = {
  SUNPHARMA: require('../../assets/logos/SUNPHARMA.svg'),
  RELIANCE: require('../../assets/logos/RELIANCE.svg'),
  HDFCBANK: require('../../assets/logos/HDFCBANK.svg'),
  ICICIBANK: require('../../assets/logos/ICICIBANK.svg'),
  SBIN: require('../../assets/logos/SBIN.svg'),
  TCS: require('../../assets/logos/TCS.svg'),
  INFY: require('../../assets/logos/INFY.svg'),
  WIPRO: require('../../assets/logos/WIPRO.svg'),
  BHARTIARTL: require('../../assets/logos/BHARTIARTL.svg'),
  TATAMOTORS: require('../../assets/logos/TATAMOTORS.svg'),
  TATASTEEL: require('../../assets/logos/TATASTEEL.svg'),
  IRFC: require('../../assets/logos/IRFC.svg'),
  IOCL: require('../../assets/logos/IOCL.svg'),
  YESBANK: require('../../assets/logos/YESBANK.svg'),
  SPICEJET: require('../../assets/logos/SPICEJET.svg'),
  IDEA: require('../../assets/logos/IDEA.svg'),
  ZOMATO: require('../../assets/logos/ZOMATO.svg'),
  PAYTM: require('../../assets/logos/PAYTM.svg'),
  DRREDDY: require('../../assets/logos/DRREDDY.svg'),
  ITC: require('../../assets/logos/ITC.svg'),
  PNB: require('../../assets/logos/PNB.svg'),
  SAIL: require('../../assets/logos/SAIL.svg'),
  NHPC: require('../../assets/logos/NHPC.svg'),
  DELHIVERY: require('../../assets/logos/DELHIVERY.svg'),
  NTPC: require('../../assets/logos/NTPC.svg'),
  AXISBANK: require('../../assets/logos/AXISBANK.svg'),
  KOTAKBANK: require('../../assets/logos/KOTAKBANK.svg'),
  BAJFINANCE: require('../../assets/logos/BAJFINANCE.svg'),
  HCLTECH: require('../../assets/logos/HCLTECH.svg'),
  TECHM: require('../../assets/logos/TECHM.svg'),
  MARUTI: require('../../assets/logos/MARUTI.svg'),
  CANBK: require('../../assets/logos/CANBK.svg'),
  IDFCFIRSTB: require('../../assets/logos/IDFCFIRSTB.svg'),
  IDBI: require('../../assets/logos/IDBI.svg'),
  JKBANK: require('../../assets/logos/JKBANK.svg'),
  CENTRALBK: require('../../assets/logos/CENTRALBK.svg'),
  RVNL: require('../../assets/logos/RVNL.svg'),
  NBCC: require('../../assets/logos/NBCC.svg'),
  SJVN: require('../../assets/logos/SJVN.svg'),
  OLAELEC: require('../../assets/logos/OLAELEC.svg'),
  EMCUREPHARMA: require('../../assets/logos/EMCUREPHARMA.svg'),
  NTPCGREEN: require('../../assets/logos/NTPCGREEN.svg'),
}

export const getLocalLogo = (symbol: string) => {
  const clean = symbol.replace('.NS', '').replace('.BO', '').toUpperCase().trim()
  return LOCAL_LOGOS[clean] ?? null
}

export const getFallbackInitials = (name: string): string => {
  if (!name) return '??'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
