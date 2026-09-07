import { useState } from "react";

const DEFAULT_COLORS = [
  "#36b095", "#2196f3", "#ff9800", "#e91e63",
  "#9c27b0", "#00bcd4", "#795548", "#607d8b",
  "#f44336", "#4caf50",
];

export default function DonutChart({ data = [], title, colors }) {
  const [hovered, setHovered] = useState(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="admin-chart-card">
        {title && <h3 className="admin-chart-title">{title}</h3>}
        <div className="admin-chart-empty">
          <i className="fa-solid fa-chart-pie" />
          <p>لا توجد بيانات</p>
        </div>
      </div>
    );
  }

  const palette = colors || DEFAULT_COLORS;
  const cx = 100, cy = 100, outerR = 85, innerR = 55;
  let cumAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const midAngle = startAngle + angle / 2;
    const largeArc = angle > Math.PI ? 1 : 0;

    const x1o = cx + outerR * Math.cos(startAngle);
    const y1o = cy + outerR * Math.sin(startAngle);
    const x2o = cx + outerR * Math.cos(endAngle);
    const y2o = cy + outerR * Math.sin(endAngle);
    const x1i = cx + innerR * Math.cos(endAngle);
    const y1i = cy + innerR * Math.sin(endAngle);
    const x2i = cx + innerR * Math.cos(startAngle);
    const y2i = cy + innerR * Math.sin(startAngle);

    const path = [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
      "Z",
    ].join(" ");

    const pct = ((d.value / total) * 100).toFixed(1);

    return { path, color: palette[i % palette.length], label: d.label, value: d.value, pct, midAngle };
  });

  return (
    <div className="admin-chart-card">
      {title && <h3 className="admin-chart-title">{title}</h3>}
      <div className="admin-donut-wrap">
        <svg viewBox="0 0 200 200" className="admin-donut-svg">
          {slices.map((s, i) => (
            <path
              key={i}
              d={s.path}
              fill={s.color}
              opacity={hovered === null || hovered === i ? 1 : 0.5}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ transition: "opacity 0.2s" }}
            />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" className="admin-donut-total-label">
            الإجمالي
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" className="admin-donut-total-value">
            {total.toLocaleString("ar-EG")}
          </text>
        </svg>
        <div className="admin-donut-legend">
          {slices.map((s, i) => (
            <div
              key={i}
              className={`admin-donut-legend-item ${hovered === i ? "admin-donut-legend-item--active" : ""}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="admin-donut-legend-dot" style={{ background: s.color }} />
              <span className="admin-donut-legend-label">{s.label}</span>
              <span className="admin-donut-legend-value">{s.value}</span>
              <span className="admin-donut-legend-pct">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
