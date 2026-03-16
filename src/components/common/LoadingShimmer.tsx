import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

interface LoadingShimmerProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
}

export default function LoadingShimmer({
    width = '100%',
    height = 20,
    borderRadius = BorderRadius.sm,
    style,
}: LoadingShimmerProps) {
    const minOpacity = 0.3;
    const maxOpacity = 0.7;
    const animation = useRef(new Animated.Value(minOpacity)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animation, {
                    toValue: maxOpacity,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(animation, {
                    toValue: minOpacity,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [animation]);

    return (
        <Animated.View
            style={[
                styles.shimmer,
                { width, height, borderRadius, opacity: animation },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    shimmer: {
        backgroundColor: Colors.surfaceLight,
        overflow: 'hidden',
    },
});
