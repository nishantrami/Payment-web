/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1D4ED8", // Blue
        success: "#10B981", // Green
        danger: "#EF4444",  // Red
        neutral: "#6B7280", // Gray
      }
    },
  },
  plugins: [],
}
