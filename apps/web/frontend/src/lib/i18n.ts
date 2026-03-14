export type Language = 'zh' | 'en'

export interface Translations {
  [key: string]: string | Translations
}

const translations: Record<Language, Translations> = {
  zh: {
    nav: {
      home: '首页',
      settings: '设置',
    },
    common: {
      loading: '加载中...',
      noResults: '没有找到匹配的模型',
    },
    home: {
      title: '硬件检测',
      description: '自动检测您的系统硬件配置',
    },
    hardware: {
      cpu: 'CPU',
      cores: '核心',
      memory: '内存',
      available: '可用',
      gpu: 'GPU',
      noGpu: '未检测到 GPU',
      cpuInference: '将使用 CPU 推理',
      unifiedMemory: '统一内存架构',
    },
    filters: {
      title: '筛选条件',
      search: '搜索',
      searchPlaceholder: '搜索模型...',
      provider: '提供商',
      fitLevel: '适配等级',
      useCase: '用途',
    },
    table: {
      title: '模型适配结果',
      modelName: '模型名称',
      provider: '提供商',
      parameters: '参数',
      fitLevel: '适配等级',
      runMode: '运行模式',
      overallScore: '综合评分',
      quality: '质量',
      speed: '速度',
      context: '上下文',
    },
    settings: {
      title: '设置',
      description: '自定义您的应用偏好',
      appearance: '外观',
      appearanceDescription: '调整应用的主题和显示设置',
      theme: '主题',
      light: '浅色',
      dark: '深色',
      system: '跟随系统',
      language: '语言',
    },
  },
  en: {
    nav: {
      home: 'Home',
      settings: 'Settings',
    },
    common: {
      loading: 'Loading...',
      noResults: 'No matching models found',
    },
    home: {
      title: 'Hardware Detection',
      description: 'Automatically detect your system hardware configuration',
    },
    hardware: {
      cpu: 'CPU',
      cores: 'Cores',
      memory: 'Memory',
      available: 'Available',
      gpu: 'GPU',
      noGpu: 'No GPU detected',
      cpuInference: 'Will use CPU inference',
      unifiedMemory: 'Unified memory architecture',
    },
    filters: {
      title: 'Filters',
      search: 'Search',
      searchPlaceholder: 'Search models...',
      provider: 'Provider',
      fitLevel: 'Fit Level',
      useCase: 'Use Case',
    },
    table: {
      title: 'Model Fit Results',
      modelName: 'Model Name',
      provider: 'Provider',
      parameters: 'Parameters',
      fitLevel: 'Fit Level',
      runMode: 'Run Mode',
      overallScore: 'Overall Score',
      quality: 'Quality',
      speed: 'Speed',
      context: 'Context',
    },
    settings: {
      title: 'Settings',
      description: 'Customize your application preferences',
      appearance: 'Appearance',
      appearanceDescription: 'Adjust theme and display settings',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      language: 'Language',
    },
  },
}

export function t(language: Language, key: string): string {
  const keys = key.split('.')
  let value: Translations | string = translations[language]
  
  for (const k of keys) {
    if (typeof value === 'object' && value !== null && k in value) {
      value = value[k]
    } else {
      return key
    }
  }
  
  return typeof value === 'string' ? value : key
}
