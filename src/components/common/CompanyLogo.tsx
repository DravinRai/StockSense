// CompanyLogo — High-res logo with waterfall fallback → colored initial circle
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, FontWeight } from '../../constants/theme';
import { cleanTicker } from '../../utils/formatters';

// ─── Color palette for fallback circles ───────────────
const LOGO_COLORS = [
    '#5B5EA6', '#E57373', '#4DB6AC', '#FF8A65', '#7986CB',
    '#4FC3F7', '#AED581', '#FFD54F', '#BA68C8', '#F06292',
    '#00897B', '#5C6BC0', '#26A69A', '#EF5350', '#AB47BC',
];

function getLogoColor(symbol: string): string {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

// ─── Mapping of stock tickers to Clearbit-compatible domains ───
const TICKER_TO_DOMAIN: Record<string, string> = {
    RELIANCE: 'relianceindustries.com',
    TCS: 'tcs.com',
    HDFCBANK: 'hdfcbank.com',
    INFY: 'infosys.com',
    SBIN: 'sbi.co.in',
    IRFC: 'irfc.nic.in',
    SUNPHARMA: 'sunpharma.com',
    TATAMOTORS: 'tatamotors.com',
    WIPRO: 'wipro.com',
    ADANIENT: 'adani.com',
    ICICIBANK: 'icicibank.com',
    KOTAKBANK: 'kotak.com',
    AXISBANK: 'axisbank.com',
    BAJFINANCE: 'bajajfinserv.in',
    NTPC: 'ntpc.co.in',
    ONGC: 'ongcindia.com',
    POWERGRID: 'powergrid.in',
    COALINDIA: 'coalindia.in',
    TITAN: 'titancompany.in',
    NESTLEIND: 'nestle.in',
    BHARTIARTL: 'airtel.in',
    ITC: 'itcportal.com',
    TATASTEEL: 'tatasteel.com',
    MARUTI: 'marutisuzuki.com',
    DRREDDY: 'drreddys.com',
    HINDUNILVR: 'hul.co.in',
    LT: 'larsentoubro.com',
    HUL: 'hul.co.in',
    ASIANPAINT: 'asianpaints.com',
    ULTRACEMCO: 'ultratechcement.com',
    SJVN: 'sjvn.nic.in',
    ADANIPORTS: 'adaniports.com',
    JSWSTEEL: 'jsw.in',
    TECHM: 'techmahindra.com',
    HCLTECH: 'hcltech.com',
    BAJAJ_AUTO: 'bajajauto.com',
    DIVISLAB: 'divislabs.com',
    INDUSINDBK: 'indusind.com',
    GRASIM: 'grasim.com',
    CIPLA: 'cipla.com',
    EICHERMOT: 'eicher.in',
    HEROMOTOCO: 'heromotocorp.com',
    APOLLOHOSP: 'apollohospitals.com',
    TATACONSUM: 'tataconsumer.com',
    BPCL: 'bharatpetroleum.in',
    BRITANNIA: 'britannia.co.in',
    HINDALCO: 'hindalco.com',
    SBILIFE: 'sbilife.co.in',
    HDFCLIFE: 'hdfclife.com',
    M_M: 'mahindra.com',
};

interface CompanyLogoProps {
    symbol: string;
    size?: number;
}

export default function CompanyLogo({ symbol, size = 40 }: CompanyLogoProps) {
    const ticker = cleanTicker(symbol);
    const logoColor = getLogoColor(ticker);
    const domain = TICKER_TO_DOMAIN[ticker];
    const fontSize = size * 0.42;
    // Render at 2x for retina quality
    const imgSize = Math.max(80, size * 2);

    // Waterfall: smallcase → clearbit → google favicon → fallback initial
    const urls: string[] = [
        `https://assets.smallcase.com/images/smallplaces/200/${ticker}.png`,
    ];
    if (domain) {
        urls.push(`https://logo.clearbit.com/${domain}`);
        urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    }

    const [imgIndex, setImgIndex] = useState(0);

    if (imgIndex < urls.length) {
        return (
            <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
                <Image
                    source={{ uri: urls[imgIndex], cache: 'force-cache' }}
                    style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
                    onError={() => setImgIndex(prev => prev + 1)}
                    resizeMode="contain"
                />
            </View>
        );
    }

    // Fallback: colored circle with initial
    return (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: logoColor }]}>
            <Text style={[styles.initial, { fontSize }]}>{ticker.charAt(0)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: Colors.surfaceLight,
    },
    image: {},
    fallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initial: {
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
});
