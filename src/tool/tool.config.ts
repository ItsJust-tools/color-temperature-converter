import type { ExportFormat, FeatureFlags, ToolTheme } from '@itsjust/core';

export const toolConfig = {
  id: 'color-temperature-converter',
  name: 'Color Temperature Converter',
  category: 'Design',
  description:
    'Convert between color temperature in Kelvin and sRGB/HEX color values for photography and display work.',
  version: '1.0.0',
  exportFormats: ['json', 'png', 'jpeg', 'webp', 'pdf'] as ExportFormat[],
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  } as FeatureFlags,
  theme: {
    accent: '#f59e0b',
    accentHover: '#d97706',
    accentSubtle: 'rgba(245, 158, 11, 0.12)',
    brand: 'Color Temperature Converter',
    icon: '🎨',
  } as ToolTheme,
};

export default toolConfig;
