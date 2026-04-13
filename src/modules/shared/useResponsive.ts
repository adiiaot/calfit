import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import {
  scaleX, scaleY, moderateScale, rf, rs,
  isIOS, isAndroid, isTablet, isSmallDevice, isLargeDevice,
  SCREEN_PADDING_H, CARD_WIDTH, GRID_2_COL, GRID_3_COL,
  SAFE_TOP, SAFE_BOTTOM,
} from './ResponsiveScreens';

export function useResponsive() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => sub.remove();
  }, []);

  return {
    // Screen info
    width: dimensions.width,
    height: dimensions.height,
    isIOS,
    isAndroid,
    isTablet,
    isSmallDevice,
    isLargeDevice,

    // Safe areas
    safeTop: SAFE_TOP,
    safeBottom: SAFE_BOTTOM,

    // Scale functions
    scaleX,
    scaleY,
    moderateScale,
    rf,  // responsive font
    rs,  // responsive spacing

    // Layout presets
    paddingH: SCREEN_PADDING_H,
    cardWidth: CARD_WIDTH,
    grid2: GRID_2_COL,
    grid3: GRID_3_COL,
  };
}