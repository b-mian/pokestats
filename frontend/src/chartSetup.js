// Register Chart.js v4 components once, app-wide. Import this before any
// react-chartjs-2 chart renders (done in index.js).
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

Chart.defaults.font.family =
  "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
