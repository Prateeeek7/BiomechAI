const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "12px",
        secondary: "8px",
        container: "16px",
        button: "10px",
      },
      boxShadow: {
        DEFAULT: "0 1px 4px rgba(0, 0, 0, 0.1)",
        hover: "0 4px 12px rgba(0, 0, 0, 0.15)",
        dark: "0 4px 12px rgba(0, 0, 0, 0.3)",
        card: "0 2px 8px rgba(0, 0, 0, 0.1)",
        'card-dark': "0 2px 8px rgba(0, 0, 0, 0.2)",
      },
      colors: {
        primary: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          light: "#60A5FA",
          dark: "#1E40AF",
        },
        secondary: {
          DEFAULT: "#6B7280",
          hover: "#4B5563",
          light: "#9CA3AF",
          dark: "#374151",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          light: "#A78BFA",
          dark: "#6D28D9",
        },
        success: {
          DEFAULT: "#10B981",
          hover: "#059669",
          light: "#34D399",
          dark: "#047857",
        },
        warning: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          light: "#FBBF24",
          dark: "#B45309",
        },
        error: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          light: "#F87171",
          dark: "#B91C1C",
        },
        electric: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#1E40AF",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-gentle': 'pulseGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover", "active", "dark"],
      backgroundColor: ["hover", "active", "dark"],
      textColor: ["hover", "active", "dark"],
      borderColor: ["hover", "active", "dark"],
      opacity: ["hover", "active", "dark"],
      scale: ["hover", "active"],
      transform: ["hover", "active"],
    },
  },
  plugins: [],
};