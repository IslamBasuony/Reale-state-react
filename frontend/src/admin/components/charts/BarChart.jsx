import { useState } from "react";

const DEFAULT_COLOR = "#36b095";

export default function BarChart({ data = [], title, color, horizontal = false }) {
  const [hovered, setHovered] = useState(null);

  const max = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return (
      <div className="admin-chart-card">
        {title && <h3 className="admin-chart-title">{title}</h3>}
        <div className="admin-chart-empty">
          <i className="fa-solid fa-chart-bar" />
          <p>لا توجد بيانات</p>
        </div>
      </div>
    );
  }

  if (horizontal) {
    const barH = 28;
    const gap = 10;
    const labelW = 100;
    const svgW = 400;
    const svgH = data.length * (barH + gap);
    const barAreaW = svgW - labelW - 50;

    return (
      <div className="admin-chart-card">
        {title && <h3 className="admin-chart-title">{title}</h3>}
        <div className="admin-bar-wrap">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="admin-bar-svg" preserveAspectRatio="xMinYMin meet">
            {data.map((d, i) => {
              const y = i * (barH + gap);
              const barW = (d.value / max) * barAreaW;
              const fill = color || DEFAULT_COLOR;
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "default" }}
                >
                  <text x={labelW - 8} y={y + barH / 2 + 5} textAnchor="end" className="admin-bar-label">
                    {d.label}
                  </text>
                  <rect
                    x={labelW}
                    y={y}
                    width={Math.max(barW, 2)}
                    height={barH}
                    rx={4}
                    fill={fill}
                    opacity={hovered === null || hovered === i ? 1 : 0.6}
                    style={{ transition: "opacity 0.2s, width 0.4s" }}
                  />
                  <text x={labelW + barW + 8} y={y + barH / 2 + 5} className="admin-bar-value">
                    {d.value.toLocaleString("ar-EG")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  const svgW = Math.max(data.length * 56, 200);
  const svgH = 220;
  const chartTop = 20;
  const chartBottom = svgH - 40;
  const chartH = chartBottom - chartTop;
  const barW = Math.min(40, (svgW - 40) / data.length - 8);

  return (
    <div className="admin-chart-card">
      {title && <h3 className="admin-chart-title">{title}</h3>}
      <div className="admin-bar-wrap">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="admin-bar-svg">
          {data.map((d, i) => {
            const x = 20 + i * ((svgW - 40) / data.length) + ((svgW - 40) / data.length - barW) / 2;
            const barH = (d.value / max) * chartH;
            const y = chartBottom - barH;
            const fill = color || DEFAULT_COLOR;
            return (
              <g
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "default" }}
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(barH, 2)}
                  rx={4}
                  fill={fill}
                  opacity={hovered === null || hovered === i ? 1 : 0.6}
                  style={{ transition: "opacity 0.2s, height 0.4s, y 0.4s" }}
                />
                <text x={x + barW / 2} y={chartBottom + 16} textAnchor="middle" className="admin-bar-label">
                  {d.label}
                </text>
                {d.value > 0 && (
                  <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="admin-bar-value">
                    {d.value.toLocaleString("ar-EG")}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
