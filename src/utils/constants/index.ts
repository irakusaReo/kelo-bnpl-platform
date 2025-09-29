// Application constants

export const APP_CONFIG = {
  name: "Kelo",
  version: "1.0.0",
  description: "Modern BNPL platform for Kenya",
  author: "Kelo Team",
  contact: {
    email: "support@kelo.finance",
    phone: "+254 700 000 000",
    website: "https://kelo.finance",
  },
  social: {
    twitter: "https://twitter.com/kelofinance",
    linkedin: "https://linkedin.com/company/kelo",
    facebook: "https://facebook.com/kelofinance",
  },
} as const;

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

export const AUTH_CONFIG = {
  tokenKey: "auth_token",
  refreshTokenKey: "refresh_token",
  userKey: "user_data",
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  refreshTokenThreshold: 5 * 60 * 1000, // 5 minutes
} as const;

export const LOAN_CONFIG = {
  minAmount: 1000,
  maxAmount: 500000,
  minDuration: 1,
  maxDuration: 24,
  minInterestRate: 0.05, // 5%
  maxInterestRate: 0.25, // 25%
  lateFeeRate: 0.05, // 5% of payment amount
  processingFee: 0.02, // 2% of loan amount
} as const;

export const PAYMENT_CONFIG = {
  methods: ["mpesa", "bank_transfer", "crypto", "wallet"] as const,
  mpesa: {
    shortcode: "123456",
    passkey: "your_passkey",
    callbackUrl: "/api/payments/mpesa/callback",
  },
  crypto: {
    supportedNetworks: ["ethereum", "polygon", "binance", "solana"] as const,
    confirmations: {
      ethereum: 12,
      polygon: 30,
      binance: 15,
      solana: 32,
    },
  },
} as const;

export const USER_CONFIG = {
  roles: ["customer", "merchant", "admin"] as const,
  statuses: ["active", "inactive", "suspended", "pending"] as const,
  verificationLevels: ["basic", "enhanced", "premium"] as const,
  creditScore: {
    min: 300,
    max: 850,
    grades: {
      A: { min: 800, label: "Excellent" },
      B: { min: 740, label: "Very Good" },
      C: { min: 670, label: "Good" },
      D: { min: 580, label: "Fair" },
      E: { min: 300, label: "Poor" },
    },
  },
} as const;

export const MERCHANT_CONFIG = {
  businessTypes: ["retail", "ecommerce", "service", "restaurant", "other"] as const,
  integrationPlatforms: ["shopify", "woocommerce", "magento", "custom", "api"] as const,
  verificationStatuses: ["pending", "verified", "rejected"] as const,
  defaultSettings: {
    currency: "KES",
    maxLoanAmount: 100000,
    minLoanAmount: 1000,
    interestRate: 0.15,
    maxDuration: 12,
    minDuration: 1,
    autoApproval: false,
    requireVerification: true,
  },
} as const;

export const BLOCKCHAIN_CONFIG = {
  networks: {
    ethereum: {
      chainId: 1,
      name: "Ethereum",
      symbol: "ETH",
      rpcUrl: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
      blockExplorer: "https://etherscan.io",
      isTestnet: false,
      confirmationsRequired: 12,
    },
    polygon: {
      chainId: 137,
      name: "Polygon",
      symbol: "MATIC",
      rpcUrl: "https://polygon-rpc.com",
      blockExplorer: "https://polygonscan.com",
      isTestnet: false,
      confirmationsRequired: 30,
    },
    binance: {
      chainId: 56,
      name: "Binance Smart Chain",
      symbol: "BNB",
      rpcUrl: "https://bsc-dataseed.binance.org",
      blockExplorer: "https://bscscan.com",
      isTestnet: false,
      confirmationsRequired: 15,
    },
    solana: {
      chainId: 101,
      name: "Solana",
      symbol: "SOL",
      rpcUrl: "https://api.mainnet-beta.solana.com",
      blockExplorer: "https://solscan.io",
      isTestnet: false,
      confirmationsRequired: 32,
    },
    hedera: {
      chainId: 295,
      name: "Hedera",
      symbol: "HBAR",
      rpcUrl: "https://mainnet-public.mirrornode.hedera.com",
      blockExplorer: "https://hashscan.io",
      isTestnet: false,
      confirmationsRequired: 3,
    },
  },
  defaultNetwork: "ethereum",
  gasPriceOracle: "https://api.etherscan.io/api?module=gastracker&action=gasoracle",
} as const;

export const UI_CONFIG = {
  theme: {
    primary: "#3B82F6",
    secondary: "#6366F1",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      linear: "linear",
      ease: "ease",
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",
    },
  },
} as const;

export const NOTIFICATION_CONFIG = {
  types: ["loan_approved", "loan_rejected", "payment_due", "payment_overdue", "system", "marketing"] as const,
  channels: {
    email: true,
    sms: true,
    push: true,
    inApp: true,
  },
  defaults: {
    email: true,
    sms: false,
    push: true,
    inApp: true,
  },
} as const;

export const VALIDATION_CONFIG = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  phone: {
    pattern: /^\+254\d{9}$/,
    message: "Please enter a valid Kenyan phone number",
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false,
    message: "Password must be at least 8 characters with uppercase, lowercase, and number",
  },
  idNumber: {
    pattern: /^\d{8}$/,
    message: "Please enter a valid 8-digit ID number",
  },
} as const;

export const STORAGE_KEYS = {
  auth: {
    token: "auth_token",
    refreshToken: "refresh_token",
    user: "user_data",
    preferences: "user_preferences",
  },
  cache: {
    loans: "cached_loans",
    payments: "cached_payments",
    merchants: "cached_merchants",
  },
  ui: {
    theme: "theme_preference",
    language: "language_preference",
    sidebar: "sidebar_state",
  },
} as const;

export const ERROR_MESSAGES = {
  network: "Network error. Please check your connection and try again.",
  server: "Server error. Please try again later.",
  unauthorized: "Unauthorized. Please log in again.",
  forbidden: "Access denied. You don't have permission to perform this action.",
  notFound: "Resource not found.",
  validation: "Please check your input and try again.",
  unknown: "An unexpected error occurred. Please try again.",
} as const;

export const SUCCESS_MESSAGES = {
  login: "Login successful!",
  logout: "Logged out successfully!",
  register: "Registration successful!",
  profileUpdate: "Profile updated successfully!",
  passwordChange: "Password changed successfully!",
  loanApplication: "Loan application submitted successfully!",
  payment: "Payment processed successfully!",
  documentUpload: "Document uploaded successfully!",
} as const;