import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  color?: string;
}

export function Sparkline({ data, width, height, color = Colors.primary }: SparklineProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, [data]);

  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Generate SVG path string
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 10) - 5; // padding
    return `${x},${y}`;
  });

  const pathString = `M ${points.join(' L ')}`;
  
  // To create a fill area below the line
  const fillPathString = `${pathString} L ${width},${height} L 0,${height} Z`;

  // Path length approx for stroke-dasharray (simple heuristic)
  const pathLength = width * 3;

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: pathLength * (1 - progress.value),
    };
  });

  const fillAnimatedProps = useAnimatedProps(() => {
    return {
      opacity: progress.value,
    };
  });

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        
        {/* Fill area */}
        <AnimatedPath
          d={fillPathString}
          fill="url(#gradient)"
          animatedProps={fillAnimatedProps}
        />
        
        {/* Line */}
        <AnimatedPath
          d={pathString}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}
