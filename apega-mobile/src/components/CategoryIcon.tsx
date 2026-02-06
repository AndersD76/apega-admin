import React from 'react';
import Svg, { Path, Circle, G, Rect, Ellipse } from 'react-native-svg';

interface CategoryIconProps {
  category: 'feminino' | 'masculino' | 'infantil' | 'acessorios' | 'calcados' | 'joias';
  size?: number;
  color?: string;
}

export function CategoryIcon({ category, size = 28, color = '#C75C3A' }: CategoryIconProps) {
  const icons = {
    // Vestido feminino elegante
    feminino: (
      <G>
        <Path
          d="M12 6C12 4 13.5 2 16 2C18.5 2 20 4 20 6"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M10 8L12 6H20L22 8L20 12L22 28H10L12 12L10 8Z"
          fill={color}
          opacity={0.2}
        />
        <Path
          d="M10 8L12 6H20L22 8L20 12L22 28H10L12 12L10 8Z"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
        <Path d="M14 12H18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </G>
    ),

    // Camisa masculina
    masculino: (
      <G>
        <Path
          d="M10 4L12 2H20L22 4V8L20 10V28H12V10L10 8V4Z"
          fill={color}
          opacity={0.2}
        />
        <Path
          d="M10 4L12 2H20L22 4V8L20 10V28H12V10L10 8V4Z"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
        <Path d="M16 2V8" stroke={color} strokeWidth="1.5" />
        <Circle cx="16" cy="12" r="1.5" fill={color} />
        <Circle cx="16" cy="18" r="1.5" fill={color} />
        <Circle cx="16" cy="24" r="1.5" fill={color} />
      </G>
    ),

    // Ursinho infantil
    infantil: (
      <G>
        <Circle cx="16" cy="18" r="10" fill={color} opacity={0.2} />
        <Circle cx="16" cy="18" r="10" stroke={color} strokeWidth="2" fill="none" />
        <Circle cx="10" cy="10" r="4" fill={color} opacity={0.3} />
        <Circle cx="22" cy="10" r="4" fill={color} opacity={0.3} />
        <Circle cx="10" cy="10" r="4" stroke={color} strokeWidth="2" fill="none" />
        <Circle cx="22" cy="10" r="4" stroke={color} strokeWidth="2" fill="none" />
        <Circle cx="13" cy="16" r="2" fill={color} />
        <Circle cx="19" cy="16" r="2" fill={color} />
        <Ellipse cx="16" cy="21" rx="2" ry="1.5" fill={color} />
        <Path d="M14 24C14 24 16 26 18 24" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </G>
    ),

    // Bolsa estilizada
    acessorios: (
      <G>
        <Path
          d="M8 12H24V26C24 27 23 28 22 28H10C9 28 8 27 8 26V12Z"
          fill={color}
          opacity={0.2}
        />
        <Path
          d="M8 12H24V26C24 27 23 28 22 28H10C9 28 8 27 8 26V12Z"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M12 12V8C12 5 13.5 4 16 4C18.5 4 20 5 20 8V12"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="16" cy="18" r="2" fill={color} />
        <Path d="M16 20V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </G>
    ),

    // Sapato de salto
    calcados: (
      <G>
        <Path
          d="M4 22L8 14C8 14 12 12 16 14L28 18V22L24 24H8L4 22Z"
          fill={color}
          opacity={0.2}
        />
        <Path
          d="M4 22L8 14C8 14 12 12 16 14L28 18V22L24 24H8L4 22Z"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
        <Path d="M24 24V28" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </G>
    ),

    // Diamante/anel
    joias: (
      <G>
        <Path
          d="M8 12L12 6H20L24 12L16 26L8 12Z"
          fill={color}
          opacity={0.2}
        />
        <Path
          d="M8 12L12 6H20L24 12L16 26L8 12Z"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
        <Path d="M8 12H24" stroke={color} strokeWidth="2" />
        <Path d="M12 6L14 12L16 6" stroke={color} strokeWidth="1.5" />
        <Path d="M20 6L18 12L16 6" stroke={color} strokeWidth="1.5" />
        <Path d="M14 12L16 26L18 12" stroke={color} strokeWidth="1.5" />
      </G>
    ),
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {icons[category]}
    </Svg>
  );
}

export default CategoryIcon;
