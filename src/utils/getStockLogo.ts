export const getStockLogo = (symbol: string): string => {
  const clean = symbol.replace('.NS', '').replace('.BO', '').toUpperCase().trim()
  
  const logoMap: Record<string, string> = {
    RELIANCE: 'https://logo.clearbit.com/ril.com',
    TCS: 'https://logo.clearbit.com/tcs.com',
    HDFCBANK: 'https://logo.clearbit.com/hdfcbank.com',
    ICICIBANK: 'https://logo.clearbit.com/icicibank.com',
    INFY: 'https://logo.clearbit.com/infosys.com',
    SBIN: 'https://logo.clearbit.com/sbi.co.in',
    AXISBANK: 'https://logo.clearbit.com/axisbank.com',
    KOTAKBANK: 'https://logo.clearbit.com/kotak.com',
    BAJFINANCE: 'https://logo.clearbit.com/bajajfinserv.in',
    BHARTIARTL: 'https://logo.clearbit.com/airtel.in',
    WIPRO: 'https://logo.clearbit.com/wipro.com',
    TATAMOTORS: 'https://logo.clearbit.com/tatamotors.com',
    TATASTEEL: 'https://logo.clearbit.com/tatasteel.com',
    SUNPHARMA: 'https://logo.clearbit.com/sunpharma.com',
    DRREDDY: 'https://logo.clearbit.com/drreddys.com',
    NTPC: 'https://logo.clearbit.com/ntpc.co.in',
    POWERGRID: 'https://logo.clearbit.com/powergridindia.com',
    TECHM: 'https://logo.clearbit.com/techmahindra.com',
    HCLTECH: 'https://logo.clearbit.com/hcltech.com',
    MARUTI: 'https://logo.clearbit.com/marutisuzuki.com',
    ULTRACEMCO: 'https://logo.clearbit.com/ultratechcement.com',
    ADANIPORTS: 'https://logo.clearbit.com/adaniports.com',
    ADANIENT: 'https://logo.clearbit.com/adani.com',
    ITC: 'https://logo.clearbit.com/itcportal.com',
    HINDUNILVR: 'https://logo.clearbit.com/hul.co.in',
    NESTLEIND: 'https://logo.clearbit.com/nestle.in',
    BRITANNIA: 'https://logo.clearbit.com/britannia.co.in',
    DIVISLAB: 'https://logo.clearbit.com/divislab.com',
    CIPLA: 'https://logo.clearbit.com/cipla.com',
    IRFC: 'https://logo.clearbit.com/irfc.co.in',
    PNB: 'https://logo.clearbit.com/pnbindia.in',
    YESBANK: 'https://logo.clearbit.com/yesbank.in',
    IDFCFIRSTB: 'https://logo.clearbit.com/idfcfirstbank.com',
    IDBI: 'https://logo.clearbit.com/idbibank.in',
    CENTRALBK: 'https://logo.clearbit.com/centralbankofindia.co.in',
    IOCL: 'https://logo.clearbit.com/iocl.com',
    BPCL: 'https://logo.clearbit.com/bharatpetroleum.com',
    ONGC: 'https://logo.clearbit.com/ongcindia.com',
    SAIL: 'https://logo.clearbit.com/sail.co.in',
    NHPC: 'https://logo.clearbit.com/nhpcindia.com',
    SJVN: 'https://logo.clearbit.com/sjvn.nic.in',
    NBCC: 'https://logo.clearbit.com/nbccindia.com',
    RVNL: 'https://logo.clearbit.com/rvnl.org',
    DELHIVERY: 'https://logo.clearbit.com/delhivery.com',
    ZOMATO: 'https://logo.clearbit.com/zomato.com',
    PAYTM: 'https://logo.clearbit.com/paytm.com',
    NYKAA: 'https://logo.clearbit.com/nykaa.com',
    POLICYBZR: 'https://logo.clearbit.com/policybazaar.com',
    EMCUREPHARMA: 'https://logo.clearbit.com/emcure.co.in',
    IDEA: 'https://logo.clearbit.com/myvi.in',
    SPICEJET: 'https://logo.clearbit.com/spicejet.com',
    INDIGO: 'https://logo.clearbit.com/goindigo.in',
    OLAELEC: 'https://logo.clearbit.com/olaelectric.com',
    CANARA: 'https://logo.clearbit.com/canarabank.com',
    CANBK: 'https://logo.clearbit.com/canarabank.com',
    SOUTHBANK: 'https://logo.clearbit.com/southindianbank.com',
    JKBANK: 'https://logo.clearbit.com/jkbank.com',
    PSB: 'https://logo.clearbit.com/psb.org.in',
  }

  if (logoMap[clean]) return logoMap[clean]
  
  // Fallback to NSE logo CDN
  return `https://assets.nseindia.com//s3fs-public/inline-images/${clean.toLowerCase()}_logo.jpg`
}

export const getFallbackInitials = (name: string): string => {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
