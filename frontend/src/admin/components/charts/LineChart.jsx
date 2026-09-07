import { useState } from "react";

const DEFAULT_COLOR = "#36b095";

export default function LineChart({ data = [], title, color, fillColor }) {
  const [hovered, setHovered] = useState(null);

  if (data.length === 0) {
    return (
      <div className="admin-chart-card">
        {title && <h3 className="admin-chart-title">{title}</h3>}
        <div className="admin-chart-empty">
          <i className="fa-solid fa-chart-line" />
          <p>لا توجد بيانات</p>
        </div>
      </div>
    );
  }

  const strokeColor = color || DEFAULT_COLOR;
  const fill = fillColor || strokeColor;
  const max = Math.max(...data.map((d) => d.value), 1);
  const svgW = Math.max(data.length * 64, 260);
  const svgH = 200;
  const padX = 30;
  const padTop = 24;
  const padBottom = 44;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padTop - padBottom;

  const points = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padTop + chartH - (d.value / max) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((max / yTicks) * i));

  return (
    <div className="admin-chart-card">
      {title && <h3 className="admin-chart-title">{title}</h3>}
      <div className="admin-line-wrap">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="admin-line-svg">
          {yTickValues.map((val, i) => {
            const y = padTop + chartH - (val / max) * chartH;
            return (
              <g key={i}>
                <line x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#e6e9e9" strokeWidth={1} />
                <text x={padX - 8} y={y + 4} textAnchor="end" className="admin-line-y-tick">
                  {val}
                </text>
              </g>
            );
          })}
          <path d={areaPath} fill={fill} opacity={0.1} />
          <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2.5} strokeLinejoin="round" />
          {points.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle cx={p.x} cy={p.y} r={hovered === i ? 6 : 4} fill="#fff" stroke={strokeColor} strokeWidth={2} style={{ transition: "r 0.15s" }} />
              <text x={p.x} y={padTop + chartH + 18} textAnchor="middle" className="admin-line-x-label">
                {p.label}
              </text>
              {hovered === i && (
                <g>
                  <rect x={p.x - 28} y={p.y - 30} width={56} height={22} rx={4} fill="#1a1f2e" />
                  <text x={p.x} y={p.y - 15} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700}>
                    {p.value}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
