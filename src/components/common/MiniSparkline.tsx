// MiniSparkline — Tiny inline chart using react-native-svg
import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors } from '../../constants/theme';

interface MiniSparklineProps {
    data: number[];
    width?: number;
    height?: number;
    isPositive?: boolean;
    strokeWidth?: number;
}

export default function MiniSparkline({
    data,
    width = 50,
    height = 30,
    isPositive = true,
    strokeWidth = 1.5,
}: MiniSparklineProps) {
    if (!data || data.length < 2) {
        return <View style={{ width, height }} />;
    }

    const color = isPositive ? Colors.gain : Colors.loss;

    // Normalize data to fit within the SVG viewBox
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data
        .map((value, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((value - min) / range) * chartHeight;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <View style={{ width, height, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                <Polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
}
