import React from "react";

interface Props {
  figure: string;
}

export function ExamFigure({ figure }: Props) {
  if (!figure) return null;

  switch (figure) {
    // --- 2020-2021 Question 5: Sports Pie Chart ---
    case "cg-2020-c5":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 240 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Pie Chart Center at (100, 100), Radius 70 */}
            {/* Đá bóng (50%): 0 to 180 deg */}
            <path d="M 100 100 L 100 30 A 70 70 0 0 1 100 170 Z" fill="#f59e0b" stroke="var(--surface)" strokeWidth="1.5" />
            
            {/* Cầu lông (18%): 180 to 244.8 deg -> x=36.7, y=129.8 */}
            <path d="M 100 100 L 100 170 A 70 70 0 0 1 36.7 129.8 Z" fill="#9ca3af" stroke="var(--surface)" strokeWidth="1.5" />
            
            {/* Đá cầu (12%): 244.8 to 288 deg -> x=33.4, y=78.4 */}
            <path d="M 100 100 L 36.7 129.8 A 70 70 0 0 1 33.4 78.4 Z" fill="#ef4444" stroke="var(--surface)" strokeWidth="1.5" />
            
            {/* Bơi lội (20%): 288 to 360 deg */}
            <path d="M 100 100 L 33.4 78.4 A 70 70 0 0 1 100 30 Z" fill="#3b82f6" stroke="var(--surface)" strokeWidth="1.5" />

            {/* Labels in sectors */}
            <text x="135" y="105" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">50%</text>
            <text x="75" y="145" fill="#fff" fontSize="10" textAnchor="middle">18%</text>
            <text x="55" y="105" fill="#fff" fontSize="10" textAnchor="middle">12%</text>
            <text x="75" y="60" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">BƠI LỘI</text>

            {/* Legends */}
            <g transform="translate(180, 40)" fontSize="10.5" fill="var(--ink)">
              <rect x="0" y="0" width="10" height="10" fill="#f59e0b" rx="2" />
              <text x="14" y="9">Đá bóng</text>

              <rect x="0" y="20" width="10" height="10" fill="#3b82f6" rx="2" />
              <text x="14" y="29">Bơi lội</text>

              <rect x="0" y="40" width="10" height="10" fill="#ef4444" rx="2" />
              <text x="14" y="49">Đá cầu</text>

              <rect x="0" y="60" width="10" height="10" fill="#9ca3af" rx="2" />
              <text x="14" y="69">Cầu lông</text>
            </g>
          </svg>
        </div>
      );

    // --- 2020-2021 Question 8: Triangle diagram with Q, K ---
    case "cg-2020-c8":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "260px" }}>
          <svg viewBox="0 0 200 160" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Shaded/Colored quadrilateral KQBC */}
            <polygon points="33.33,111.67 20,130 180,130 126.67,56.67" fill="oklch(0.7 0.12 220 / 0.25)" stroke="none" />

            {/* Triangle ABC: A(100, 20), B(20, 130), C(180, 130) */}
            <polygon points="100,20 20,130 180,130" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Connector line KQ */}
            <line x1="126.67" y1="56.67" x2="33.33" y2="111.67" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Vertex dots */}
            <circle cx="100" cy="20" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="20" cy="130" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="180" cy="130" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="33.33" cy="111.67" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="126.67" cy="56.67" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />

            {/* Points labels */}
            <text x="100" y="14" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">A</text>
            <text x="14" y="142" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">B</text>
            <text x="186" y="142" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">C</text>
            <text x="24" y="115" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">Q</text>
            <text x="135" y="58" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="start">K</text>
          </svg>
        </div>
      );

    // --- 2022-2023 Question 8: Trapezoid ABCD with diagonals AC, BD intersecting at O ---
    case "cg-2022-c8":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "260px" }}>
          <svg viewBox="0 0 220 150" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Trapezoid ABCD: A(70, 30), B(150, 30), C(190, 120), D(30, 120) */}
            <polygon points="70,30 150,30 190,120 30,120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Diagonals AC, BD intersecting at O(110, 60) */}
            <line x1="70" y1="30" x2="190" y2="120" stroke="var(--ink)" strokeWidth="1.5" />
            <line x1="150" y1="30" x2="30" y2="120" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Vertex dots */}
            <circle cx="70" cy="30" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="150" cy="30" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="190" cy="120" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="30" cy="120" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="110" cy="60" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />

            {/* Points labels */}
            <text x="70" y="20" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">A</text>
            <text x="150" y="20" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">B</text>
            <text x="195" y="134" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="start">C</text>
            <text x="25" y="134" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">D</text>
            <text x="110" y="74" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">O</text>
          </svg>
        </div>
      );

    // --- 2023-2024 Question 7: Fruits Bar Chart ---
    case "cg-2023-c7":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "340px" }}>
          <svg viewBox="0 0 320 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Background Grid Lines (Values: 0, 5, 10, 15) */}
            {/* Y axis starts at 160 (value 0) up to 20 (value 15). Step is 140/15 = 9.33 px per unit. */}
            {/* Y=160 (0), Y=113.3 (5), Y=66.7 (10), Y=20 (15) */}
            <line x1="40" y1="160" x2="300" y2="160" stroke="var(--border-strong)" strokeWidth="1" />
            <line x1="40" y1="113.3" x2="300" y2="113.3" stroke="var(--border-soft)" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="40" y1="66.7" x2="300" y2="66.7" stroke="var(--border-soft)" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="40" y1="20" x2="300" y2="20" stroke="var(--border-soft)" strokeWidth="0.8" strokeDasharray="3 3" />

            {/* Y Labels */}
            <text x="32" y="164" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">0</text>
            <text x="32" y="117" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">5</text>
            <text x="32" y="70" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">10</text>
            <text x="32" y="24" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">15</text>
            
            {/* Vertical Y Axis Title */}
            <text x="14" y="90" fill="var(--ink)" fontSize="10" transform="rotate(-90, 14, 90)" textAnchor="middle">Số học sinh</text>

            {/* Bars: width 30, centers at 65, 115, 165, 215, 265 */}
            {/* Cam: 4 (height 37.3, y=122.7) */}
            <rect x="50" y="122.7" width="30" height="37.3" fill="#3b82f6" rx="2" />
            <text x="65" y="117" fill="var(--ink)" fontSize="9" fontWeight="bold" textAnchor="middle">4</text>
            
            {/* Chuối: 3 (height 28, y=132) */}
            <rect x="100" y="132" width="30" height="28" fill="#3b82f6" rx="2" />
            <text x="115" y="126" fill="var(--ink)" fontSize="9" fontWeight="bold" textAnchor="middle">3</text>
            
            {/* Táo: 15 (height 140, y=20) */}
            <rect x="150" y="20" width="30" height="140" fill="#3b82f6" rx="2" />
            <text x="165" y="15" fill="var(--ink)" fontSize="9" fontWeight="bold" textAnchor="middle">15</text>
            
            {/* Nhãn: 11 (height 102.7, y=57.3) */}
            <rect x="200" y="57.3" width="30" height="102.7" fill="#3b82f6" rx="2" />
            <text x="215" y="52" fill="var(--ink)" fontSize="9" fontWeight="bold" textAnchor="middle">11</text>
            
            {/* Xoài: 10 (height 93.3, y=66.7) */}
            <rect x="250" y="66.7" width="30" height="93.3" fill="#3b82f6" rx="2" />
            <text x="265" y="61" fill="var(--ink)" fontSize="9" fontWeight="bold" textAnchor="middle">10</text>

            {/* X Labels */}
            <text x="65" y="174" fill="var(--ink)" fontSize="10" textAnchor="middle">Cam</text>
            <text x="115" y="174" fill="var(--ink)" fontSize="10" textAnchor="middle">Chuối</text>
            <text x="165" y="174" fill="var(--ink)" fontSize="10" textAnchor="middle">Táo</text>
            <text x="215" y="174" fill="var(--ink)" fontSize="10" textAnchor="middle">Nhãn</text>
            <text x="265" y="174" fill="var(--ink)" fontSize="10" textAnchor="middle">Xoài</text>
            
            {/* X Axis Title */}
            <text x="165" y="194" fill="var(--ink)" fontSize="10.5" fontWeight="bold" textAnchor="middle">Loại quả</text>
          </svg>
        </div>
      );

    // --- 2023-2024 Question 8: Square ABCD with quarter circle and semicircle ---
    case "cg-2023-c8":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "200px" }}>
          <svg viewBox="0 0 160 160" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Path for shaded region between quarter-circle (A, radius 120) and semicircle (diameter AB) */}
            <path 
              d="M 140,20 A 120,120 0 0,1 20,140 L 20,20 A 60,60 0 0,0 140,20 Z" 
              fill="oklch(0.7 0.18 220)" 
              stroke="none"
            />

            {/* Square: 20,20 to 140,140 (side length 120) */}
            <rect x="20" y="20" width="120" height="120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Semicircle diameter AB */}
            <path d="M 20 20 A 60 60 0 0 0 140 20" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Quarter circle radius AB centered at A */}
            <path d="M 140 20 A 120 120 0 0 1 20 140" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Points labels */}
            <text x="12" y="14" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="end">A</text>
            <text x="148" y="14" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="start">B</text>
            <text x="148" y="154" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="start">C</text>
            <text x="12" y="154" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="end">D</text>
          </svg>
        </div>
      );

    // --- 2024-2025 Question 5: Food Pie Chart ---
    case "cg-2024-c5":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 240 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Pie Chart Center at (100, 100), Radius 70 */}
            {/* Bún chả (25%): 0 to 90 deg */}
            <path d="M 100 100 L 100 30 A 70 70 0 0 1 170 100 Z" fill="#f59e0b" stroke="var(--surface)" strokeWidth="1.5" />
            
            {/* Bún đậu (18%): 90 to 154.8 deg -> x=129.8, y=163.3 */}
            <path d="M 100 100 L 170 100 A 70 70 0 0 1 129.8 163.3 Z" fill="#ef4444" stroke="var(--surface)" strokeWidth="1.5" />
            
            {/* Phở (43%): 154.8 to 309.6 deg -> x=46.0, y=55.4 */}
            <path d="M 100 100 L 129.8 163.3 A 70 70 0 0 1 46.0 55.4 Z" fill="#3b82f6" stroke="var(--surface)" strokeWidth="1.5" />
            
            {/* Bánh cuốn (14%): 309.6 to 360 deg */}
            <path d="M 100 100 L 46.0 55.4 A 70 70 0 0 1 100 30 Z" fill="#10b981" stroke="var(--surface)" strokeWidth="1.5" />

            {/* Labels in sectors */}
            <text x="130" y="75" fill="#fff" fontSize="10.5" fontWeight="bold" textAnchor="middle">25%</text>
            <text x="130" y="130" fill="#fff" fontSize="9.5" textAnchor="middle">18%</text>
            <text x="70" y="115" fill="#fff" fontSize="10.5" fontWeight="bold" textAnchor="middle">43%</text>
            <text x="75" y="55" fill="#fff" fontSize="9.5" textAnchor="middle">14%</text>

            {/* Legends */}
            <g transform="translate(180, 40)" fontSize="10.5" fill="var(--ink)">
              <rect x="0" y="0" width="10" height="10" fill="#3b82f6" rx="2" />
              <text x="14" y="9">Phở</text>

              <rect x="0" y="20" width="10" height="10" fill="#f59e0b" rx="2" />
              <text x="14" y="29">Bún chả</text>

              <rect x="0" y="40" width="10" height="10" fill="#ef4444" rx="2" />
              <text x="14" y="49">Bún đậu</text>

              <rect x="0" y="60" width="10" height="10" fill="#10b981" rx="2" />
              <text x="14" y="69">Bánh cuốn</text>
            </g>
          </svg>
        </div>
      );

    // --- 2024-2025 Question 7: Rectangle cross road ---
    case "cg-2024-c7":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "350px" }}>
          <svg viewBox="0 0 350 220" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Plot of land: x=40 to x=280 (width 240), y=20 to y=164 (height 144) */}
            
            {/* Base road layer (pink fuchsia) */}
            <rect x="40" y="20" width="240" height="144" fill="oklch(0.75 0.22 330)" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* 4 quadrant plots of grass (using surface color to cover the road background) */}
            {/* Top-left quadrant */}
            <rect x="40" y="20" width="88" height="52" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Top-right quadrant */}
            <rect x="192" y="20" width="88" height="52" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Bottom-right quadrant */}
            <rect x="192" y="112" width="88" height="52" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Bottom-left quadrant */}
            <rect x="40" y="112" width="88" height="52" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Dimensions lines and indicators */}
            {/* Width 30cm */}
            <line x1="40" y1="184" x2="280" y2="184" stroke="var(--ink)" strokeWidth="1.2" strokeDasharray="5 5" />
            <circle cx="40" cy="184" r="3.5" fill="#ef4444" stroke="var(--ink)" strokeWidth="0.8" />
            <circle cx="280" cy="184" r="3.5" fill="#ef4444" stroke="var(--ink)" strokeWidth="0.8" />
            <text x="160" y="206" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">30cm</text>
            
            {/* Height 18cm */}
            <line x1="305" y1="20" x2="305" y2="164" stroke="var(--ink)" strokeWidth="1.2" strokeDasharray="5 5" />
            <circle cx="305" cy="20" r="3.5" fill="#ef4444" stroke="var(--ink)" strokeWidth="0.8" />
            <circle cx="305" cy="164" r="3.5" fill="#ef4444" stroke="var(--ink)" strokeWidth="0.8" />
            <text x="316" y="92" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="start" dominantBaseline="middle">18cm</text>

            {/* Vertical road width 8cm */}
            <text x="160" y="12" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">8cm</text>
            
            {/* Horizontal road height 5cm */}
            <text x="34" y="92" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end" dominantBaseline="middle">5cm</text>
          </svg>
        </div>
      );


    // ==========================================
    // --- Thanh Xuân (TX) Figures ---
    // ==========================================

    // --- TX 2019-20 Q9: Stack of Cubes (3D Pyramid) ---
    case "tx-2019-c9": {
      const size = 18;
      const hSize = size * 0.866;
      const vSize = size * 0.5;
      
      const drawCube = (x: number, y: number, z: number) => {
        const cx = 110 + (x - y) * hSize;
        const cy = 120 + (x + y) * vSize - z * size;
        return (
          <g key={`${x}-${y}-${z}`}>
            <path d={`M ${cx} ${cy - size} L ${cx + hSize} ${cy - vSize} L ${cx} ${cy} L ${cx - hSize} ${cy - vSize} Z`} fill="var(--surface-3)" stroke="var(--ink)" strokeWidth="1" />
            <path d={`M ${cx - hSize} ${cy - vSize} L ${cx} ${cy} L ${cx} ${cy + size} L ${cx - hSize} ${cy + size - vSize} Z`} fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="1" />
            <path d={`M ${cx} ${cy} L ${cx + hSize} ${cy - vSize} L ${cx + hSize} ${cy + size - vSize} L ${cx} ${cy + size} Z`} fill="var(--border-strong)" stroke="var(--ink)" strokeWidth="1" />
          </g>
        );
      };

      const cubes: React.ReactNode[] = [];
      // Draw 6 layers from bottom (z = 0) to top (z = 5)
      for (let z = 0; z < 6; z++) {
        for (let x = 0; x < 6 - z; x++) {
          for (let y = 0; y < 6 - z - x; y++) {
            cubes.push(drawCube(x, y, z));
          }
        }
      }

      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 220 190" width="100%" style={{ display: "block", height: "auto" }}>
            {cubes}
          </svg>
        </div>
      );
    }

    // --- TX 2021-22 Q8: Flower Petals inside a 10cm Square ---
    case "tx-2021-c8":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "200px" }}>
          <svg viewBox="0 0 160 160" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Square ABCD */}
            <rect x="20" y="20" width="120" height="120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* 4 shaded orange petals pointing to corners A, B, C, D */}
            <path 
              d="M 20,20 A 60,60 0 0,0 80,80 A 60,60 0 0,0 20,20 M 140,20 A 60,60 0 0,0 80,80 A 60,60 0 0,0 140,20 M 140,140 A 60,60 0 0,0 80,80 A 60,60 0 0,0 140,140 M 20,140 A 60,60 0 0,0 80,80 A 60,60 0 0,0 20,140" 
              fill="#f97316" 
              stroke="var(--ink)" 
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            
            {/* Labels */}
            <text x="10" y="16" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle">A</text>
            <text x="150" y="16" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle">B</text>
            <text x="150" y="152" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle">C</text>
            <text x="10" y="152" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle">D</text>
          </svg>
        </div>
      );


    // --- TX 2022-23 Q3: 4 circles r=4cm in 2×2 tangent grid; shaded 4-pointed
    // concave star = square (through centers) MINUS 4 quarter-circles. Sinh
    // bởi Codex CLI gpt-5.5 (2026-06-12); sweep=0 để arcs centered tại corners
    // (= circle centers), bulge TOWARD figure center → concave star sides.
    case "tx-2022-c3":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 360 360" width="100%" style={{ display: "block", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
            {/* Shaded 4-pointed concave star, arcs centered at 4 corners (=
                circle centers), bulging toward figure center */}
            <path d="M 180 100 A 80 80 0 0 0 260 180 A 80 80 0 0 0 180 260 A 80 80 0 0 0 100 180 A 80 80 0 0 0 180 100 Z"
                  fill="oklch(0.78 0.18 130 / 0.55)" stroke="var(--ink)" strokeWidth="1.5" />

            {/* 4 full circles radius 80 (4 cm), centers at corners of inner square,
                pairwise tangent at the 4 mid-edges */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <circle cx="260" cy="100" r="80" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <circle cx="100" cy="260" r="80" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <circle cx="260" cy="260" r="80" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Inner square through 4 circle centers (side = 2r = 8 cm) */}
            <rect x="100" y="100" width="160" height="160" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
          </svg>
        </div>
      );

    // --- TX 2023-24 Q13: Rectangle with Intersecting Arcs ---
    case "tx-2023-c13":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 186 130" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Shaded orange top region */}
            <path
              d="M 30,20 L 155.6,20 A 80,80 0 0,0 92.8,50.44 A 80,80 0 0,0 30,20 Z"
              fill="oklch(0.75 0.16 45)"
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            {/* Shaded light blue bottom overlap region */}
            <path
              d="M 75.6,100 L 110,100 A 80,80 0 0,0 92.8,50.44 A 80,80 0 0,0 75.6,100 Z"
              fill="oklch(0.75 0.16 220)"
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            {/* Rectangle ABCD */}
            <rect x="30" y="20" width="125.6" height="80" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Two quarter-circle arcs of radius 80 */}
            <path d="M 30,20 A 80,80 0 0,1 110,100" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <path d="M 155.6,20 A 80,80 0 0,0 75.6,100" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Labels */}
            <text x="24" y="18" fill="var(--ink)" fontSize="14" fontWeight="bold" textAnchor="end">A</text>
            <text x="162" y="18" fill="var(--ink)" fontSize="14" fontWeight="bold" textAnchor="start">B</text>
            <text x="162" y="112" fill="var(--ink)" fontSize="14" fontWeight="bold" textAnchor="start">C</text>
            <text x="24" y="112" fill="var(--ink)" fontSize="14" fontWeight="bold" textAnchor="end">D</text>
            <text x="22" y="65" fill="var(--ink)" fontSize="12" fontWeight="bold" textAnchor="end">8cm</text>
          </svg>
        </div>
      );

    // --- TX 2024-25 Q11: 4 quarter-arcs in 6cm square, 2 lenses shaded ---
    // SVG do Codex CLI (gpt-5.5) sinh từ PDF; mỗi lens = vesica của 2 arcs
    // tâm tại 2 góc kề (vd lens AC: arcs tâm B + tâm D, radius = cạnh).
    case "tx-2024-c11":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "220px" }}>
          <svg viewBox="0 0 240 240" width="100%" style={{ display: "block", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
            {/* 2 lenses (vesica) shaded — along AC diagonal + along BD diagonal */}
            <path d="M 30 30 A 180 180 0 0 0 210 210 A 180 180 0 0 0 30 30 Z" fill="oklch(0.78 0.18 130 / 0.55)" stroke="none" />
            <path d="M 210 30 A 180 180 0 0 1 30 210 A 180 180 0 0 1 210 30 Z" fill="oklch(0.78 0.18 130 / 0.55)" stroke="none" />

            {/* Square outline */}
            <rect x="30" y="30" width="180" height="180" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* 4 quarter-arcs — each connecting two opposite corners, centered at the
                other diagonal's corners (radius = side = 180) */}
            <path d="M 30 30 A 180 180 0 0 0 210 210" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <path d="M 210 210 A 180 180 0 0 0 30 30" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <path d="M 210 30 A 180 180 0 0 1 30 210" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <path d="M 30 210 A 180 180 0 0 1 210 30" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            <text x="120" y="232" textAnchor="middle" fill="var(--ink)" fontSize="16" fontStyle="italic" fontFamily="Times,serif">6cm</text>
          </svg>
        </div>
      );

    // --- TX 2024-25 Q12: Trapezoid ABCD with Diagonals ---
    case "tx-2024-c12":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 160 130" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Trapezoid outline */}
            <polygon points="50,25 110,25 120,95 40,95" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Diagonals */}
            <line x1="50" y1="25" x2="120" y2="95" stroke="var(--ink)" strokeWidth="1.2" />
            <line x1="110" y1="25" x2="40" y2="95" stroke="var(--ink)" strokeWidth="1.2" />
            
            {/* Red points with black border */}
            <circle cx="50" cy="25" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="110" cy="25" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="120" cy="95" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="40" cy="95" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="80" cy="55" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" />

            {/* Labels */}
            <text x="44" y="21" fill="var(--ink)" fontSize="15" fontWeight="bold" textAnchor="end">A</text>
            <text x="116" y="21" fill="var(--ink)" fontSize="15" fontWeight="bold" textAnchor="start">B</text>
            <text x="124" y="105" fill="var(--ink)" fontSize="15" fontWeight="bold" textAnchor="start">C</text>
            <text x="36" y="105" fill="var(--ink)" fontSize="15" fontWeight="bold" textAnchor="end">D</text>
            <text x="80" y="74" fill="var(--ink)" fontSize="15" fontWeight="bold" textAnchor="middle">O</text>
          </svg>
        </div>
      );

    // --- TX 2026-27 Q5: 2 squares cạnh 4cm + 2 cánh hoa lá meeting top-center ---
    // SVG do Codex CLI (gpt-5.5) sinh từ PDF MATHX recollected exam.
    case "tx-2026-c5":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "260px" }}>
          <svg viewBox="0 0 300 190" width="100%" style={{ display: "block", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
            {/* 2 squares 4cm × 4cm side-by-side (sharing center vertical edge) */}
            <rect x="30" y="40" width="120" height="120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <rect x="150" y="40" width="120" height="120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Two leaves (vesica piscis), both apex at top-center (150, 40),
                fanning outward-down to outer-bottom corners */}
            <path d="M 150 40 A 120 120 0 0 1 30 160 A 120 120 0 0 1 150 40 Z"
                  fill="oklch(0.78 0.18 130 / 0.6)" stroke="var(--ink)" strokeWidth="1.5" />
            <path d="M 150 40 A 120 120 0 0 1 270 160 A 120 120 0 0 1 150 40 Z"
                  fill="oklch(0.78 0.18 130 / 0.6)" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Dimension label "4 cm" above the figure */}
            <text x="150" y="32" textAnchor="middle" fill="var(--ink)" fontSize="16" fontStyle="italic" fontFamily="Times,serif">4 cm</text>
          </svg>
        </div>
      );

    // --- TX 2025-26 B2: Adjoining Squares ABCD and MNDP ---
    case "tx-2025-b2":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "260px" }}>
          <svg viewBox="0 0 240 160" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Shaded Quadrilateral PNKB */}
            <polygon 
              points="20,140 100,60 140,20 220,20" 
              fill="oklch(0.78 0.14 340 / 0.45)" 
            />

            {/* Left square MNDP: side 80, bottom line y=140 */}
            <rect x="20" y="60" width="80" height="80" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Right square ABCD: side 120, bottom line y=140 */}
            <rect x="100" y="20" width="120" height="120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Line segments forming the geometric lines */}
            {/* Line PNK (collinear, goes from P to K) */}
            <line x1="20" y1="140" x2="140" y2="20" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Line PB */}
            <line x1="20" y1="140" x2="220" y2="20" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Line NB */}
            <line x1="100" y1="60" x2="220" y2="20" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Red points with black border */}
            <circle cx="20" cy="60" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" /> {/* M */}
            <circle cx="100" cy="60" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" /> {/* N */}
            <circle cx="20" cy="140" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" /> {/* P */}
            <circle cx="100" cy="140" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" /> {/* D */}
            <circle cx="100" cy="20" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" /> {/* A */}
            <circle cx="140" cy="20" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" /> {/* K */}
            <circle cx="220" cy="20" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" /> {/* B */}
            <circle cx="220" cy="140" r="3" fill="red" stroke="var(--ink)" strokeWidth="1" /> {/* C */}

            {/* Labels */}
            <text x="100" y="14" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">A</text>
            <text x="140" y="14" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">K</text>
            <text x="220" y="14" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">B</text>
            <text x="226" y="146" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="start">C</text>
            <text x="100" y="154" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">D</text>
            <text x="15" y="146" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">P</text>
            <text x="94" y="56" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">N</text>
            <text x="15" y="56" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">M</text>
          </svg>
        </div>
      );


    // ==========================================
    // --- Lương Thế Vinh (LTV) Figures ---
    // ==========================================

    // --- LTV 2018-19 Q10: Quadrilateral ABCD Split into 3 Strips ---
    case "ltv-2018-c10":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 220 150" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Main polygon ABCD */}
            <polygon points="50,30 170,30 190,120 20,120" fill="var(--surface-3)" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Shaded Middle strip EHFG */}
            <polygon points="90,30 130,30 133.3,120 76.7,120" fill="oklch(0.85 0.04 40 / 0.25)" stroke="var(--ink)" strokeWidth="1.2" />
            
            {/* Labels */}
            <text x="44" y="24" fill="var(--ink)" fontSize="11" fontWeight="bold">A</text>
            <text x="174" y="24" fill="var(--ink)" fontSize="11" fontWeight="bold">B</text>
            <text x="195" y="126" fill="var(--ink)" fontSize="11" fontWeight="bold">C</text>
            <text x="12" y="126" fill="var(--ink)" fontSize="11" fontWeight="bold">D</text>
            
            <text x="90" y="24" fill="var(--ink)" fontSize="10.5" textAnchor="middle">E</text>
            <text x="130" y="24" fill="var(--ink)" fontSize="10.5" textAnchor="middle">F</text>
            <text x="75" y="132" fill="var(--ink)" fontSize="10.5" textAnchor="middle">H</text>
            <text x="135" y="132" fill="var(--ink)" fontSize="10.5" textAnchor="middle">G</text>
          </svg>
        </div>
      );

    // --- LTV 2019-20 Q12: Circles Sharing a Horizontal Diameter ---
    case "ltv-2019-c12":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "220px" }}>
          <svg viewBox="0 0 200 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Large Circle */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Horizontal Diameter */}
            <line x1="20" y1="100" x2="180" y2="100" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Left Circle (r = 20) */}
            <circle cx="40" cy="100" r="20" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Middle Circle (r = 40) */}
            <circle cx="100" cy="100" r="40" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Right Circle (r = 20) */}
            <circle cx="160" cy="100" r="20" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Center dots */}
            <circle cx="40" cy="100" r="3.5" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="100" cy="100" r="3.5" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="160" cy="100" r="3.5" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
          </svg>
        </div>
      );

    // --- LTV 2020-21 Q15: Semicircles Inside Semicircle (Arbelos) ---
    case "ltv-2020-c15":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 220 130" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Large semicircle filled with shaded color */}
            <path d="M 20,110 A 80,80 0 0,1 180,110 Z" fill="oklch(0.85 0.04 40 / 0.25)" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Punch out first small semicircle */}
            <path d="M 20,110 A 48,48 0 0,1 116,110 Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.2" />
            {/* Punch out second small semicircle */}
            <path d="M 116,110 A 32,32 0 0,1 180,110 Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.2" />
            
            {/* Points Labels */}
            <text x="16" y="122" fill="var(--ink)" fontSize="11" fontWeight="bold">A</text>
            <text x="116" y="122" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">B</text>
            <text x="184" y="122" fill="var(--ink)" fontSize="11" fontWeight="bold">C</text>
            <text x="68" y="122" fill="var(--ink-muted)" fontSize="9.5" textAnchor="middle">0,6dm</text>
            <text x="148" y="122" fill="var(--ink-muted)" fontSize="9.5" textAnchor="middle">4cm</text>
          </svg>
        </div>
      );

    // --- LTV 2020-21 Q20: Triangle ABC with extension P and line PM intersecting AC at N ---
    case "ltv-2020-c20": {
      const Bx = 30, By = 130;
      const Cx = 170, Cy = 130;
      const Mx = 100, My = 130; // midpoint of BC
      const Ax = 60, Ay = 50;
      const Px = 70, Py = 23.33; // PA = 1/3 AB, collinear with B, A
      const Nx = 82, Ny = 66; // AN = 1/5 AC, collinear with P, M
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "220px" }}>
          <svg viewBox="0 0 200 160" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Triangle ABC */}
            <polygon points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Extension lines */}
            <line x1={Ax} y1={Ay} x2={Px} y2={Py} stroke="var(--ink)" strokeWidth="1.5" />
            <line x1={Px} y1={Py} x2={Mx} y2={My} stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Vertex dots */}
            <circle cx={Px} cy={Py} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Ax} cy={Ay} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Bx} cy={By} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Nx} cy={Ny} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Mx} cy={My} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Cx} cy={Cy} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />

            {/* Labels */}
            <text x={Px} y={Py - 6} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">P</text>
            <text x={Ax - 6} y={Ay + 4} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">A</text>
            <text x={Bx - 4} y={By + 14} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">B</text>
            <text x={Mx} y={My + 14} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">M</text>
            <text x={Cx + 4} y={Cy + 14} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">C</text>
            <text x={Nx + 5} y={Ny - 4} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="start">N</text>
          </svg>
        </div>
      );
    }

    // --- LTV 2021-22 Q8: 3D Cuboids Grid ---
    case "ltv-2021-c8": {
      const ox = 25, oy = 135;
      const Wx = 36, Hy = 30, Dx = 24, Dy = 14;
      const X = (c: number, d: number) => ox + c * Wx + d * Dx;
      const Y = (j: number, d: number) => oy - j * Hy - d * Dy;

      const renderBlock = (c: number, d: number) => {
        const topPoints = `${X(c, d)},${Y(1, d)} ${X(c+1, d)},${Y(1, d)} ${X(c+1, d+1)},${Y(1, d+1)} ${X(c, d+1)},${Y(1, d+1)}`;
        const frontPoints = `${X(c, d)},${Y(0, d)} ${X(c+1, d)},${Y(0, d)} ${X(c+1, d)},${Y(1, d)} ${X(c, d)},${Y(1, d)}`;
        const rightPoints = `${X(c+1, d)},${Y(0, d)} ${X(c+1, d+1)},${Y(0, d+1)} ${X(c+1, d+1)},${Y(1, d+1)} ${X(c+1, d)},${Y(1, d)}`;
        return (
          <g key={`${c}-${d}`}>
            {/* Draw faces in order: right, front, top to ensure correct overlap inside the block */}
            <polygon points={rightPoints} fill="var(--surface)" stroke="#00aeef" strokeWidth="1.5" strokeLinejoin="round" />
            <polygon points={frontPoints} fill="var(--surface)" stroke="#00aeef" strokeWidth="1.5" strokeLinejoin="round" />
            <polygon points={topPoints} fill="var(--surface)" stroke="#00aeef" strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        );
      };

      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 210 160" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Back row blocks (d = 1) */}
            {[0, 1, 2].map((c) => renderBlock(c, 1))}
            
            {/* Front row blocks (d = 0) */}
            {[0, 1, 2, 3].map((c) => renderBlock(c, 0))}

            {/* Labels */}
            {/* Height label: 3,5 dm */}
            <text x={X(0, 0) - 6} y={Y(0.5, 0) + 4} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">3,5 dm</text>
            {/* Width label: 4 dm */}
            <text x={X(0.5, 0)} y={Y(0, 0) + 16} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">4 dm</text>
            {/* Depth label: 3 dm */}
            <text x={X(0, 0.5) - 6} y={Y(1, 0.5) + 4} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">3 dm</text>
          </svg>
        </div>
      );
    }

    // --- LTV 2022-23 Q20: Triangle ABC with side AB divided by D, and extension E ---
    case "ltv-2022-c20": {
      const Bx = 30, By = 140;
      const Cx = 190, Cy = 140;
      const Ax = 90, Ay = 40;
      const Dx = 70, Dy = 73.33; // AD = 1/3 AB
      const Ex = 30, Ey = 51.11; // DE = 1/3 CD, collinear with C, D, and BE is vertical
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 210 165" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Triangle ABC */}
            <polygon points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Line BE */}
            <line x1={Bx} y1={By} x2={Ex} y2={Ey} stroke="var(--ink)" strokeWidth="1.5" />
            {/* Line EC (which passes through D) */}
            <line x1={Ex} y1={Ey} x2={Cx} y2={Cy} stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Vertex dots */}
            <circle cx={Ex} cy={Ey} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Ax} cy={Ay} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Dx} cy={Dy} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Bx} cy={By} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Cx} cy={Cy} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />

            {/* Labels */}
            <text x={Ex - 6} y={Ey + 2} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">E</text>
            <text x={Ax - 4} y={Ay - 6} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">A</text>
            <text x={Dx + 8} y={Dy + 4} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="start">D</text>
            <text x={Bx - 4} y={By + 15} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">B</text>
            <text x={Cx + 4} y={Cy + 15} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">C</text>
            
            {/* Area label */}
            <text x={38} y={92} fill="var(--ink)" fontSize="12">10 cm²</text>
          </svg>
        </div>
      );
    }

    // --- LTV 2024-25 Q14: Rhombus in Square with Semicircles ---
    case "ltv-2024-c14":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "200px" }}>
          <svg viewBox="0 0 160 160" width="100%" style={{ display: "block", height: "auto" }}>
            <defs>
              <clipPath id="ltv-q14-clip">
                <polygon points="80,20 140,80 80,140 20,80" />
              </clipPath>
            </defs>

            {/* Shaded parts inside the rhombus but outside the semicircles */}
            <path d="M 80,20 L 140,20 A 60,60 0 0,0 80,80 A 60,60 0 0,0 20,20 Z" fill="#f59e0b" clipPath="url(#ltv-q14-clip)" />
            <path d="M 80,140 L 140,140 A 60,60 0 0,1 80,80 A 60,60 0 0,1 20,140 Z" fill="#f59e0b" clipPath="url(#ltv-q14-clip)" />

            {/* Square ABCD */}
            <rect x="20" y="20" width="120" height="120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Rhombus MNPQ */}
            <polygon points="80,20 140,80 80,140 20,80" fill="none" stroke="var(--ink)" strokeWidth="1.2" />

            {/* Semicircle with center N */}
            <path d="M 140,20 A 60,60 0 0,0 140,140" fill="none" stroke="var(--ink)" strokeWidth="1.2" />

            {/* Semicircle with center Q */}
            <path d="M 20,20 A 60,60 0 0,1 20,140" fill="none" stroke="var(--ink)" strokeWidth="1.2" />

            {/* Corner labels */}
            <text x="14" y="16" fill="var(--ink)" fontSize="11" fontWeight="bold">A</text>
            <text x="146" y="16" fill="var(--ink)" fontSize="11" fontWeight="bold">B</text>
            <text x="146" y="148" fill="var(--ink)" fontSize="11" fontWeight="bold">C</text>
            <text x="14" y="148" fill="var(--ink)" fontSize="11" fontWeight="bold">D</text>

            {/* Midpoint labels */}
            <text x="80" y="14" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">M</text>
            <text x="146" y="84" fill="var(--ink)" fontSize="11" fontWeight="bold">N</text>
            <text x="80" y="150" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">P</text>
            <text x="10" y="84" fill="var(--ink)" fontSize="11" fontWeight="bold">Q</text>
          </svg>
        </div>
      );

    // --- LTV 2024-25 Q17: Grid Containing a Cat ---
    case "ltv-2024-c17":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "200px" }}>
          <svg viewBox="0 0 190 165" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Draw 4 rows x 5 columns grid of 30px squares with black lines and white background */}
            {Array.from({ length: 4 }).map((_, r) =>
              Array.from({ length: 5 }).map((_, c) => (
                <rect 
                  key={`${r}-${c}`} 
                  x={20 + c * 30} 
                  y={20 + r * 30} 
                  width="30" 
                  height="30" 
                  fill="white" 
                  stroke="black" 
                  strokeWidth="1.2" 
                />
              ))
            )}
            {/* Place a cute simple cat 🐱 inside cell (row 2, col 2) */}
            <text x="65" y="66" fill="black" fontSize="20" textAnchor="middle" dominantBaseline="middle">🐱</text>
            <text x="95" y="152" fill="black" fontSize="9.5" textAnchor="middle">Mỗi ô vuông = 1m²</text>
          </svg>
        </div>
      );

    // --- LTV 2024-25 Q20: Overlapping Squares with Shaded Triangle ---
    case "ltv-2024-c20":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "200px" }}>
          <svg viewBox="0 0 200 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Shaded triangle: from top-left (20,20) to bottom-right of right square (164, 110) to bottom-right of bottom square (110, 164) */}
            <polygon points="20,20 164,110 110,164" fill="oklch(0.4 0.05 0 / 0.45)" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Large square: 5x5 (side 90) */}
            <rect x="20" y="20" width="90" height="90" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Bottom small square: 3x3 (side 54) */}
            <rect x="56" y="110" width="54" height="54" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Right small square: 3x3 (side 54) */}
            <rect x="110" y="56" width="54" height="54" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Labels */}
            <text x="12" y="65" fill="var(--ink)" fontSize="10" textAnchor="end">5 cm</text>
            <text x="48" y="137" fill="var(--ink)" fontSize="10" textAnchor="end">3 cm</text>
            <text x="170" y="83" fill="var(--ink)" fontSize="10" textAnchor="start">3 cm</text>
          </svg>
        </div>
      );

    // --- LTV 2013-14 Q12: Four Squares in T-shape + Triangle ABC ---
    case "ltv-2013-c12": {
      const S = 28, ox = 20, oy = 20;
      const c = (n: number) => ox + n * S;
      const r = (n: number) => oy + n * S;
      // T-shape: top row 3 squares (col 0-2 row 0), one square hanging below in the middle (col 1 row 1)
      const Ax = c(0), Ay = r(0);
      const Bx = c(1), By = r(2);
      const Cx = c(3), Cy = r(1);
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "220px" }}>
          <svg viewBox={`0 0 ${ox * 2 + 3 * S} ${oy * 2 + 2 * S}`} width="100%" style={{ display: "block", height: "auto" }}>
            {/* Top row 3 squares */}
            <rect x={c(0)} y={r(0)} width={S} height={S} fill="none" stroke="var(--ink)" strokeWidth="1.3" />
            <rect x={c(1)} y={r(0)} width={S} height={S} fill="none" stroke="var(--ink)" strokeWidth="1.3" />
            <rect x={c(2)} y={r(0)} width={S} height={S} fill="none" stroke="var(--ink)" strokeWidth="1.3" />
            {/* Bottom square hanging below middle */}
            <rect x={c(1)} y={r(1)} width={S} height={S} fill="none" stroke="var(--ink)" strokeWidth="1.3" />
            {/* Triangle ABC */}
            <polygon points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Vertex dots */}
            <circle cx={Ax} cy={Ay} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Bx} cy={By} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={Cx} cy={Cy} r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="1" />
            {/* Vertex labels */}
            <text x={Ax - 6} y={Ay + 4} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">A</text>
            <text x={Bx - 4} y={By + 14} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">B</text>
            <text x={Cx + 6} y={Cy + 4} fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="start">C</text>
          </svg>
        </div>
      );
    }

    // --- LTV 2013-14 Q15: Row of 9 Cells with Numbers 3, 7, 5, ..., ? ---
    case "ltv-2013-c15": {
      const W = 30, H = 30, ox = 10, oy = 10;
      const cells: (string | null)[] = ["3", "7", "5", null, null, null, null, "?", null];
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox={`0 0 ${ox * 2 + 9 * W} ${oy * 2 + H}`} width="100%" style={{ display: "block", height: "auto" }}>
            {cells.map((label, i) => (
              <g key={i}>
                <rect x={ox + i * W} y={oy} width={W} height={H}
                  fill={label === "?" ? "oklch(0.75 0.13 200 / 0.35)" : (i < 3 ? "oklch(0.85 0.06 200 / 0.3)" : "none")}
                  stroke="var(--ink)" strokeWidth="1.3" />
                {label && (
                  <text x={ox + i * W + W / 2} y={oy + H / 2 + 1} fill="var(--ink)" fontSize="14" fontWeight="600"
                    textAnchor="middle" dominantBaseline="middle">{label}</text>
                )}
              </g>
            ))}
          </svg>
        </div>
      );
    }

    // --- LTV 2013-14 Q18: Circle with Square OABC (O at center, A & C on circle) ---
    case "ltv-2013-c18": {
      // Circle center at (90, 90), radius 70. Square OABC: O=(90,90), A=(160,90), C=(90,160), B=(160,160)
      // Quarter of square (corner B) is outside the circle.
      const Ox = 90, Oy = 90, R = 70;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 200 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Shaded area: square minus quarter-circle */}
            <path
              d={`M ${Ox},${Oy} L ${Ox + R},${Oy} L ${Ox + R},${Oy + R} L ${Ox},${Oy + R} Z M ${Ox + R},${Oy} A ${R},${R} 0 0,1 ${Ox},${Oy + R} L ${Ox},${Oy} Z`}
              fill="oklch(0.7 0.13 60 / 0.4)" fillRule="evenodd" stroke="none"
            />
            {/* Circle */}
            <circle cx={Ox} cy={Oy} r={R} fill="none" stroke="var(--ink)" strokeWidth="1.3" />
            {/* Square OABC */}
            <rect x={Ox} y={Oy} width={R} height={R} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Labels */}
            <text x={Ox - 4} y={Oy - 4} fill="var(--ink)" fontSize="12" fontWeight="bold" textAnchor="end">O</text>
            <text x={Ox + R + 4} y={Oy - 2} fill="var(--ink)" fontSize="12" fontWeight="bold">A</text>
            <text x={Ox + R + 4} y={Oy + R + 10} fill="var(--ink)" fontSize="12" fontWeight="bold">B</text>
            <text x={Ox - 4} y={Oy + R + 10} fill="var(--ink)" fontSize="12" fontWeight="bold" textAnchor="end">C</text>
          </svg>
        </div>
      );
    }

    // --- LTV 2018-19 Q13: 4 Circles around a Square with Diamond Inside ---
    case "ltv-2018-c13": {
      // 4 circles of radius 30, arranged 2x2 touching each other.
      // Square inscribed connecting circle centers, with diamond shape in middle of square.
      const r = 28;
      const cx = 100, cy = 100;
      // Centers: top-left, top-right, bottom-left, bottom-right
      const c1 = { x: cx - r, y: cy - r };
      const c2 = { x: cx + r, y: cy - r };
      const c3 = { x: cx - r, y: cy + r };
      const c4 = { x: cx + r, y: cy + r };
      // Square connecting centers
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "220px" }}>
          <svg viewBox="0 0 200 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* 4 circles */}
            {[c1, c2, c3, c4].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={r} fill="none" stroke="var(--ink)" strokeWidth="1.3" />
            ))}
            {/* Square connecting centers */}
            <polygon points={`${c1.x},${c1.y} ${c2.x},${c2.y} ${c4.x},${c4.y} ${c3.x},${c3.y}`}
              fill="none" stroke="var(--ink)" strokeWidth="1.3" />
            {/* Center diamond shape (concave square - 4 quarter arcs) */}
            <path
              d={`M ${cx},${cy - r}
                  A ${r},${r} 0 0,0 ${cx + r},${cy}
                  A ${r},${r} 0 0,0 ${cx},${cy + r}
                  A ${r},${r} 0 0,0 ${cx - r},${cy}
                  A ${r},${r} 0 0,0 ${cx},${cy - r} Z`}
              fill="oklch(0.7 0.18 220 / 0.85)" stroke="var(--ink)" strokeWidth="1.3"
            />
          </svg>
        </div>
      );
    }

    // --- LTV 2019-20 Q20: 6×5 Grid of Unit Squares ---
    case "ltv-2019-c20": {
      const S = 22, ox = 10, oy = 10, cols = 6, rows = 5;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "180px" }}>
          <svg viewBox={`0 0 ${ox * 2 + cols * S} ${oy * 2 + rows * S}`} width="100%" style={{ display: "block", height: "auto" }}>
            {Array.from({ length: rows }).map((_, ri) =>
              Array.from({ length: cols }).map((_, ci) => (
                <rect key={`${ri}-${ci}`} x={ox + ci * S} y={oy + ri * S} width={S} height={S}
                  fill="none" stroke="var(--ink)" strokeWidth="1" />
              ))
            )}
          </svg>
        </div>
      );
    }

    // --- LTV 2020-21 Q11: Pursuit Diagram A--66km--B---C ---
    case "ltv-2020-c11": {
      const Ax = 40, Bx = 200, Cx = 320, y = 90;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "360px" }}>
          <svg viewBox="0 0 360 130" width="100%" style={{ display: "block", height: "auto" }}>
            <line x1={Ax} y1={y} x2={Cx} y2={y} stroke="var(--ink)" strokeWidth="1.3" />
            {[Ax, Bx, Cx].map((px, i) => (
              <circle key={i} cx={px} cy={y} r="2.6" fill="var(--ink)" />
            ))}
            <text x={Ax} y={y + 16} fill="var(--ink)" fontSize="12" textAnchor="middle" fontWeight="bold">A</text>
            <text x={Bx} y={y + 16} fill="var(--ink)" fontSize="12" textAnchor="middle" fontWeight="bold">B</text>
            <text x={Cx} y={y + 16} fill="var(--ink)" fontSize="12" textAnchor="middle" fontWeight="bold">C</text>
            <text x={(Ax + Bx) / 2} y={y - 6} fill="var(--ink)" fontSize="11" textAnchor="middle">66 km</text>
            <text x={Ax + 8} y={y - 30} fill="var(--ink)" fontSize="10.5" fontWeight="600">Xe máy</text>
            <text x={Ax + 8} y={y - 18} fill="var(--ink-muted)" fontSize="9.5">(45 km/h)</text>
            <path d={`M ${Ax} ${y - 12} l 22 0 l -4 -3 m 4 3 l -4 3`} fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            <text x={Bx + 8} y={y - 30} fill="var(--ink)" fontSize="10.5" fontWeight="600">Xe đạp</text>
            <text x={Bx + 8} y={y - 18} fill="var(--ink-muted)" fontSize="9.5">(15 km/h)</text>
            <path d={`M ${Bx} ${y - 12} l 22 0 l -4 -3 m 4 3 l -4 3`} fill="none" stroke="var(--ink)" strokeWidth="1.2" />
          </svg>
        </div>
      );
    }

    // --- LTV 2022-23 Q19: Three Circles Divided Into 4 Quadrants ---
    case "ltv-2022-c19": {
      const cy = 70, r = 38, gap = 18;
      const xs = [r + 10, r + 10 + 2 * r + gap, r + 10 + 4 * r + 2 * gap];
      const quads = [
        { tl: "19", tr: "6", bl: "1", br: "5", c: "32" },
        { tl: "30", tr: "2", bl: "9", br: "4", c: "46" },
        { tl: "22", tr: "11", bl: "20", br: "12", c: "x" },
      ];
      const width = xs[2] + r + 10;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "360px" }}>
          <svg viewBox={`0 0 ${width} ${cy + r + 10}`} width="100%" style={{ display: "block", height: "auto" }}>
            {xs.map((cx, i) => {
              const q = quads[i];
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ink)" strokeWidth="1.3" />
                  <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="var(--ink)" strokeWidth="1" />
                  <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="var(--ink)" strokeWidth="1" />
                  <text x={cx - r / 2} y={cy - r / 3} fill="var(--accent, #d97706)" fontSize="12" textAnchor="middle" dominantBaseline="middle" fontWeight="600">{q.tl}</text>
                  <text x={cx + r / 2} y={cy - r / 3} fill="var(--accent, #d97706)" fontSize="12" textAnchor="middle" dominantBaseline="middle" fontWeight="600">{q.tr}</text>
                  <text x={cx - r / 2} y={cy + r / 3} fill="var(--accent, #d97706)" fontSize="12" textAnchor="middle" dominantBaseline="middle" fontWeight="600">{q.bl}</text>
                  <text x={cx + r / 2} y={cy + r / 3} fill="var(--accent, #d97706)" fontSize="12" textAnchor="middle" dominantBaseline="middle" fontWeight="600">{q.br}</text>
                  <circle cx={cx} cy={cy} r={11} fill="var(--surface, white)" stroke="var(--ink)" strokeWidth="1" />
                  <text x={cx} y={cy + 1} fill="var(--info, #2563eb)" fontSize="12" textAnchor="middle" dominantBaseline="middle" fontWeight="700">{q.c}</text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    // --- LTV 2023-24 Q9: Shaded Polygon on Grid (Area = 9 cm²) ---
    case "ltv-2023-c9": {
      const S = 28;
      const ox = 10, oy = 10;
      const cols = 6, rows = 5;
      const c = (n: number) => ox + n * S;
      const r = (n: number) => oy + n * S; // 0 0 is top-left, y goes down
      const shade = "oklch(0.75 0.13 200 / 0.55)";
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "220px" }}>
          <svg viewBox={`0 0 ${ox * 2 + cols * S} ${oy * 2 + rows * S}`} width="100%" style={{ display: "block", height: "auto" }}>
            {/* Shaded polygon */}
            <polygon 
              points={`${c(1)},${r(0)} ${c(5)},${r(1)} ${c(2)},${r(2)} ${c(2)},${r(5)} ${c(0)},${r(3)}`}
              fill={shade} 
              stroke="none"
            />
            {/* Grid */}
            {Array.from({ length: rows }).map((_, ri) =>
              Array.from({ length: cols }).map((_, ci) => (
                <rect key={`${ri}-${ci}`} x={c(ci)} y={oy + ri * S} width={S} height={S}
                  fill="none" stroke="var(--ink)" strokeWidth="0.8" opacity="0.3" />
              ))
            )}
            {/* Outer border of grid */}
            <rect x={c(0)} y={oy} width={cols * S} height={rows * S}
              fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            {/* Polygon outline */}
            <polygon 
              points={`${c(1)},${r(0)} ${c(5)},${r(1)} ${c(2)},${r(2)} ${c(2)},${r(5)} ${c(0)},${r(3)}`}
              fill="none" 
              stroke="var(--ink)" 
              strokeWidth="2" 
            />
            {/* Red dots at the grid line intersections on the polygon vertices and grid border */}
            {(() => {
              const dots: [number, number][] = [];
              for (let x = 0; x <= cols; x++) {
                for (let y = 0; y <= rows; y++) {
                  if (
                    x === 0 || 
                    x === cols || 
                    y === 0 || 
                    y === rows || 
                    (x === 2 && y === 2) || 
                    (x === 5 && y === 1)
                  ) {
                    dots.push([x, y]);
                  }
                }
              }
              return dots.map(([cxVal, cyVal], idx) => (
                <circle key={idx} cx={c(cxVal)} cy={r(cyVal)} r="2.5" fill="red" />
              ));
            })()}
          </svg>
        </div>
      );
    }

    // --- LTV 2023-24 Q17: Square with Inscribed Circle, Shaded Corners ---
    case "ltv-2023-c17": {
      // Square ABCD axis-aligned, side = 120, center O. Inscribed circle radius = 60.
      // M = midpoint AB (top), N = midpoint AD (left), O = center.
      const x0 = 30, y0 = 20, side = 120;
      const cx = x0 + side / 2, cy = y0 + side / 2, rr = side / 2;
      const shade = "oklch(0.78 0.13 350 / 0.50)";
      // Path: outer square - inner circle (even-odd) gives 4 corner regions
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "200px" }}>
          <svg viewBox="0 0 180 170" width="100%" style={{ display: "block", height: "auto" }}>
            <path
              d={`M ${x0},${y0} H ${x0 + side} V ${y0 + side} H ${x0} Z M ${cx - rr},${cy} A ${rr},${rr} 0 1,0 ${cx + rr},${cy} A ${rr},${rr} 0 1,0 ${cx - rr},${cy} Z`}
              fill={shade} fillRule="evenodd" stroke="none" />
            {/* Square ABCD */}
            <rect x={x0} y={y0} width={side} height={side} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Inscribed circle */}
            <circle cx={cx} cy={cy} r={rr} fill="none" stroke="var(--ink)" strokeWidth="1.3" />
            {/* Diagonals AC and BD */}
            <line x1={x0} y1={y0} x2={x0 + side} y2={y0 + side} stroke="var(--ink)" strokeWidth="1" />
            <line x1={x0 + side} y1={y0} x2={x0} y2={y0 + side} stroke="var(--ink)" strokeWidth="1" />
            {/* MN, NO, OM crosshair through center */}
            <line x1={cx} y1={y0} x2={cx} y2={y0 + side} stroke="var(--ink)" strokeWidth="1" />
            <line x1={x0} y1={cy} x2={x0 + side} y2={cy} stroke="var(--ink)" strokeWidth="1" />
            {/* Labels */}
            <text x={x0 - 4} y={y0 - 4} fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="end">A</text>
            <text x={cx} y={y0 - 4} fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">M</text>
            <text x={x0 + side + 4} y={y0 - 4} fill="var(--ink)" fontSize="11" fontWeight="bold">B</text>
            <text x={x0 - 4} y={cy + 4} fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="end">N</text>
            <text x={cx + 4} y={cy - 3} fill="var(--ink)" fontSize="11" fontWeight="bold">O</text>
            <text x={x0 - 4} y={y0 + side + 10} fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="end">D</text>
            <text x={x0 + side + 4} y={y0 + side + 10} fill="var(--ink)" fontSize="11" fontWeight="bold">C</text>
          </svg>
        </div>
      );
    }

    // --- LTV 2023-24 Q20: Rectangle ABCD with Triangle CMN ---
    case "ltv-2023-c20": {
      // ABCD: A(20,20) B(200,20) C(200,120) D(20,120). M mid AB. N on AD (upper portion).
      const Ax = 20, Ay = 20, Bx = 200, By = 20, Cx = 200, Cy = 120, Dx = 20, Dy = 120;
      const Mx = (Ax + Bx) / 2, My = Ay;
      // N is ~1/3 from A toward D
      const Nx = Ax, Ny = Ay + (Dy - Ay) / 3;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 220 140" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Rectangle ABCD */}
            <rect x={Ax} y={Ay} width={Bx - Ax} height={Cy - Ay} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Triangle CMN */}
            <polygon points={`${Cx},${Cy} ${Mx},${My} ${Nx},${Ny}`}
              fill="none" stroke="var(--ink)" strokeWidth="1.3" />
            {/* Point markers */}
            <circle cx={Mx} cy={My} r="1.6" fill="var(--ink)" />
            <circle cx={Nx} cy={Ny} r="1.6" fill="var(--ink)" />
            {/* Labels */}
            <text x={Ax - 4} y={Ay - 4} fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="end">A</text>
            <text x={Mx} y={My - 4} fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">M</text>
            <text x={Bx + 4} y={By - 4} fill="var(--ink)" fontSize="11" fontWeight="bold">B</text>
            <text x={Nx - 4} y={Ny + 3} fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="end">N</text>
            <text x={Dx - 4} y={Dy + 10} fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="end">D</text>
            <text x={Cx + 4} y={Cy + 10} fill="var(--ink)" fontSize="11" fontWeight="bold">C</text>
          </svg>
        </div>
      );
    }


    // ==========================================
    // --- Nguyễn Tất Thành (NTT) Figures ---
    // ==========================================

    // --- NTT 2018-19 Q7: Rectangular box with three cubes inside ---
    case "ntt-2018-c7":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "280px" }}>
          <svg viewBox="0 0 285 170" width="100%" style={{ display: "block", height: "auto" }}>
            {/* 1. Background dashed lines of the big box */}
            {/* Bottom-left depth (dashed) */}
            <line x1="15" y1="155" x2="50" y2="130" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="4,4" />
            {/* Back-left vertical (dashed) */}
            <line x1="50" y1="20" x2="50" y2="130" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="4,4" />

            {/* 2. Three blue cubes inside the box */}
            {/* Cube 1 */}
            <polygon points="75,145 105,145 105,115 75,115" fill="oklch(0.55 0.22 240)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="75,115 105,115 117,107 87,107" fill="oklch(0.65 0.20 240)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="105,145 117,137 117,107 105,115" fill="oklch(0.45 0.20 240)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />

            {/* Cube 2 */}
            <polygon points="135,145 165,145 165,115 135,115" fill="oklch(0.55 0.22 240)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="135,115 165,115 177,107 147,107" fill="oklch(0.65 0.20 240)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="165,145 177,137 177,107 165,115" fill="oklch(0.45 0.20 240)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />

            {/* Cube 3 */}
            <polygon points="195,145 225,145 225,115 195,115" fill="oklch(0.55 0.22 240)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="195,115 225,115 237,107 207,107" fill="oklch(0.65 0.20 240)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="225,145 237,137 237,107 225,115" fill="oklch(0.45 0.20 240)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />

            {/* 3. Solid edges of the big box */}
            {/* Front face */}
            <rect x="15" y="45" width="220" height="110" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Back face top edge */}
            <line x1="50" y1="20" x2="270" y2="20" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Back face right vertical edge */}
            <line x1="270" y1="20" x2="270" y2="130" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Connecting depth lines (solid) */}
            {/* Top-left depth */}
            <line x1="15" y1="45" x2="50" y2="20" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Top-right depth */}
            <line x1="235" y1="45" x2="270" y2="20" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Bottom-right depth */}
            <line x1="235" y1="155" x2="270" y2="130" stroke="var(--ink)" strokeWidth="1.5" />

            {/* 4. Horizontal back-bottom dashed line drawn on top so it shows through the cubes */}
            <line x1="50" y1="130" x2="270" y2="130" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="4,4" />
          </svg>
        </div>
      );

    // --- NTT 2022-23 Q8: Two Squares (ABCD and AEFG) and Triangle BDF ---
    case "ntt-2022-c8":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 220 170" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Highlighted triangle BDF */}
            <polygon
              points="80,20 200,140 20,80"
              fill="oklch(0.6 0.18 260 / 0.08)"
              stroke="none"
            />

            {/* Square ABCD: A(80,140), B(200,140), C(200,20), D(80,20) */}
            <rect x="80" y="20" width="120" height="120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Square AEFG: G(20,140), A(80,140), E(80,80), F(20,80) */}
            <rect x="20" y="80" width="60" height="60" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Diagonal and other lines */}
            <line x1="80" y1="20" x2="20" y2="80" stroke="var(--ink)" strokeWidth="1.5" /> {/* DF */}
            <line x1="80" y1="20" x2="200" y2="140" stroke="var(--ink)" strokeWidth="1.5" /> {/* DB */}
            <line x1="20" y1="80" x2="200" y2="140" stroke="var(--ink)" strokeWidth="1.5" /> {/* FB */}
            
            {/* Vertices dots */}
            <circle cx="80" cy="140" r="3.5" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" /> {/* A */}
            <circle cx="200" cy="140" r="3.5" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" /> {/* B */}
            <circle cx="200" cy="20" r="3.5" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" /> {/* C */}
            <circle cx="80" cy="20" r="3.5" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" /> {/* D */}
            <circle cx="80" cy="80" r="3.5" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" /> {/* E */}
            <circle cx="20" cy="80" r="3.5" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" /> {/* F */}
            <circle cx="20" cy="140" r="3.5" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" /> {/* G */}

            {/* Labels */}
            <text x="80" y="154" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">A</text>
            <text x="206" y="154" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="start">B</text>
            <text x="200" y="14" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">C</text>
            <text x="80" y="14" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">D</text>
            <text x="86" y="93" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="start">E</text>
            <text x="14" y="74" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">F</text>
            <text x="14" y="154" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="end">G</text>
          </svg>
        </div>
      );

    // --- NTT 2023-24 Q8: Rectangle ABCD and two overlapping circles ---
    case "ntt-2023-c8":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "300px" }}>
          <svg viewBox="0 0 330 200" width="100%" style={{ display: "block", height: "auto" }}>
            <defs>
              <pattern id="ntt-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="var(--ink)" strokeWidth="1.2" />
              </pattern>
            </defs>

            {/* Region (1) - Solid light gray */}
            <path 
              d="M 100,20 L 226,20 A 80,80 0 0,0 163,50.7 A 80,80 0 0,0 100,20 Z" 
              fill="oklch(0.85 0.02 240)" 
              stroke="none"
            />

            {/* Region (2) - Hatch fill */}
            <path 
              d="M 146,100 A 80,80 0 0,1 163,50.7 A 80,80 0 0,1 180,100 L 146,100 Z" 
              fill="url(#ntt-hatch)" 
              stroke="none"
            />

            {/* Complete circles */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="226" cy="100" r="80" fill="none" stroke="var(--ink)" strokeWidth="1" />

            {/* Rectangle ABCD */}
            <rect x="100" y="20" width="126" height="80" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Vertices dots */}
            <circle cx="100" cy="20" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" />
            <circle cx="226" cy="20" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" />
            <circle cx="226" cy="100" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" />
            <circle cx="100" cy="100" r="3" fill="#f59e0b" stroke="var(--ink)" strokeWidth="0.8" />

            {/* Labels */}
            <text x="96" y="14" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle" style={{ fontStyle: "italic" }}>A</text>
            <text x="230" y="14" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle" style={{ fontStyle: "italic" }}>B</text>
            <text x="230" y="114" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle" style={{ fontStyle: "italic" }}>C</text>
            <text x="96" y="114" fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle" style={{ fontStyle: "italic" }}>D</text>
          </svg>
        </div>
      );

    // --- NTT 2023-24 Q4: Arts CLB Bar Chart ---
    case "ntt-2023-c4":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "340px" }}>
          <svg viewBox="0 0 350 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Background Grid Lines (Values: 10, 20, 30) */}
            <line x1="50" y1="120" x2="330" y2="120" stroke="var(--border-soft)" strokeWidth="0.8" />
            <line x1="50" y1="70" x2="330" y2="70" stroke="var(--border-soft)" strokeWidth="0.8" />
            <line x1="50" y1="20" x2="330" y2="20" stroke="var(--border-soft)" strokeWidth="0.8" />
            
            {/* X-axis */}
            <line x1="50" y1="170" x2="330" y2="170" stroke="var(--ink)" strokeWidth="1.2" />
            
            {/* Y-axis */}
            <line x1="50" y1="20" x2="50" y2="170" stroke="var(--ink)" strokeWidth="1.2" />

            {/* Y Labels */}
            <text x="42" y="174" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">0</text>
            <text x="42" y="124" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">10</text>
            <text x="42" y="74" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">20</text>
            <text x="42" y="24" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">30</text>
            
            {/* Vertical Y Axis Title */}
            <text x="18" y="95" fill="var(--ink)" fontSize="10.5" fontWeight="bold" transform="rotate(-90, 18, 95)" textAnchor="middle">Số học sinh</text>

            {/* Bars and Values */}
            {/* Mỹ thuật: 15 */}
            <rect x="62" y="95" width="26" height="75" fill="oklch(0.62 0.2 250)" rx="1" />
            <text x="75" y="111" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">15</text>
            
            {/* Thanh nhạc: 20 */}
            <rect x="110" y="70" width="26" height="100" fill="oklch(0.62 0.2 250)" rx="1" />
            <text x="123" y="86" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">20</text>
            
            {/* Guitar: 30 */}
            <rect x="158" y="20" width="26" height="150" fill="oklch(0.62 0.2 250)" rx="1" />
            <text x="171" y="36" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">30</text>
            
            {/* Sáo: 25 */}
            <rect x="206" y="45" width="26" height="125" fill="oklch(0.62 0.2 250)" rx="1" />
            <text x="219" y="61" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">25</text>
            
            {/* Múa: 20 */}
            <rect x="254" y="70" width="26" height="100" fill="oklch(0.62 0.2 250)" rx="1" />
            <text x="267" y="86" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">20</text>
            
            {/* Organ: 10 */}
            <rect x="302" y="120" width="26" height="50" fill="oklch(0.62 0.2 250)" rx="1" />
            <text x="315" y="136" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">10</text>

            {/* X Labels */}
            <text x="75" y="184" fill="var(--ink)" fontSize="9.5" textAnchor="middle">Mỹ thuật</text>
            <text x="123" y="184" fill="var(--ink)" fontSize="9.5" textAnchor="middle">Thanh nhạc</text>
            <text x="171" y="184" fill="var(--ink)" fontSize="9.5" textAnchor="middle">Guitar</text>
            <text x="219" y="184" fill="var(--ink)" fontSize="9.5" textAnchor="middle">Sáo</text>
            <text x="267" y="184" fill="var(--ink)" fontSize="9.5" textAnchor="middle">Múa</text>
            <text x="315" y="184" fill="var(--ink)" fontSize="9.5" textAnchor="middle">Organ</text>
          </svg>
        </div>
      );

    // --- NTT 2024-25 Q4: Balls Pie Chart (Xanh 25%, Đỏ 20%, Trắng 40%, Vàng 15%) ---
    case "ntt-2024-c4":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 240 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Pie Chart Center at (100, 100), Radius 70 */}
            {/* Xanh (25%): 0 to 90 deg */}
            <path d="M 100 100 L 100 30 A 70 70 0 0 1 170 100 Z" fill="#3b82f6" stroke="var(--surface)" strokeWidth="1.5" />
            
            {/* Đỏ (20%): 90 to 162 deg -> x=133.3, y=161.6 */}
            <path d="M 100 100 L 170 100 A 70 70 0 0 1 133.3 161.6 Z" fill="#ef4444" stroke="var(--surface)" strokeWidth="1.5" />
            
            {/* Trắng (40%): 162 to 306 deg -> x=43.4, y=58.9 */}
            <path d="M 100 100 L 133.3 161.6 A 70 70 0 0 1 43.4 58.9 Z" fill="#e5e7eb" stroke="var(--surface)" strokeWidth="1.5" />
            
            {/* Vàng (15%): 306 to 360 deg */}
            <path d="M 100 100 L 43.4 58.9 A 70 70 0 0 1 100 30 Z" fill="#f59e0b" stroke="var(--surface)" strokeWidth="1.5" />

            {/* Labels in sectors */}
            <text x="130" y="70" fill="#fff" fontSize="10.5" fontWeight="bold" textAnchor="middle">25%</text>
            <text x="130" y="130" fill="#fff" fontSize="10.5" fontWeight="bold" textAnchor="middle">20%</text>
            <text x="70" y="115" fill="#4b5563" fontSize="10.5" fontWeight="bold" textAnchor="middle">40%</text>
            <text x="75" y="55" fill="#fff" fontSize="9.5" textAnchor="middle">15%</text>

            {/* Legends */}
            <g transform="translate(180, 40)" fontSize="10" fill="var(--ink)">
              <rect x="0" y="0" width="10" height="10" fill="#3b82f6" rx="2" />
              <text x="14" y="9">Xanh</text>

              <rect x="0" y="20" width="10" height="10" fill="#ef4444" rx="2" />
              <text x="14" y="29">Đỏ</text>

              <rect x="0" y="40" width="10" height="10" fill="#e5e7eb" rx="2" stroke="#ccc" strokeWidth="0.5" />
              <text x="14" y="49">Trắng</text>

              <rect x="0" y="60" width="10" height="10" fill="#f59e0b" rx="2" />
              <text x="14" y="69">Vàng</text>
            </g>
          </svg>
        </div>
      );

    // --- NTT 2024-25 Q6: Heart shape from a 40 cm square + two circles on the upper sides ---
    case "ntt-2024-c6":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "210px" }}>
          <svg viewBox="0 0 240 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Two construction circles whose diameters are the upper-left and upper-right sides of the (rotated) square */}
            <circle cx="91.72" cy="71.72" r="40" fill="none" stroke="var(--ink)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.55" />
            <circle cx="148.28" cy="71.72" r="40" fill="none" stroke="var(--ink)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.55" />

            {/* Construction square rotated 45° (side = 40 cm → 80 px) */}
            <polygon
              points="120,43.43 176.57,100 120,156.57 63.43,100"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              opacity="0.55"
            />

            {/* Heart shape: outer halves of the two upper circles + lower V of the square */}
            <path
              d="M 120,43.43 A 40,40 0 0,0 63.43,100 L 120,156.57 L 176.57,100 A 40,40 0 0,0 120,43.43 Z"
              fill="oklch(0.78 0.14 340 / 0.4)"
              stroke="oklch(0.55 0.22 340)"
              strokeWidth="1.5"
            />

            {/* "40 cm" labels on the two lower sides of the square */}
            <text x="80" y="180" fill="var(--ink)" fontSize="11" textAnchor="middle" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>40 cm</text>
            <text x="160" y="180" fill="var(--ink)" fontSize="11" textAnchor="middle" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>40 cm</text>
          </svg>
        </div>
      );

    // --- NTT 2024-25 Q10: 12 squares grid with shaded region ---
    case "ntt-2024-c10": {
      const cells = [
        { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 3, c: 0 },
        { r: 1, c: 1 }, { r: 2, c: 1 }, { r: 3, c: 1 },
        { r: 0, c: 2 }, { r: 1, c: 2 }, { r: 2, c: 2 }, { r: 3, c: 2 },
        { r: 0, c: 3 }, { r: 1, c: 3 },
      ];
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 160 160" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Shaded region: E(20,140) → B(110,20) → F(110,50) → C(140,50) */}
            <polygon
              points="20,140 110,20 110,50 140,50"
              fill="oklch(0.6 0.18 260 / 0.65)"
              stroke="oklch(0.4 0.2 260)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* 12 small squares grid */}
            {cells.map((cell, idx) => (
              <rect
                key={idx}
                x={20 + cell.c * 30}
                y={20 + cell.r * 30}
                width="30"
                height="30"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="1.2"
              />
            ))}
          </svg>
        </div>
      );
    }

    // --- NTT 2025-26 Q1: Pie Chart of Grades ---
    case "ntt-2025-c1":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "220px" }}>
          <svg viewBox="0 0 200 200" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Khối 7: 40% (Blue-ish) */}
            <path d="M 100,100 L 100,20 A 80,80 0 0,1 147,164.7 Z" fill="oklch(0.65 0.18 240 / 0.75)" stroke="var(--ink)" strokeWidth="1" />
            {/* Khối 6: 22.5% (Orange-ish) */}
            <path d="M 100,100 L 147,164.7 A 80,80 0 0,1 43.4,156.6 Z" fill="oklch(0.7 0.2 40 / 0.75)" stroke="var(--ink)" strokeWidth="1" />
            {/* Khối 8: 12.5% (Grey-ish) */}
            <path d="M 100,100 L 43.4,156.6 A 80,80 0 0,1 20,100 Z" fill="oklch(0.65 0.02 0 / 0.5)" stroke="var(--ink)" strokeWidth="1" />
            {/* Khối 9: 25% (Yellow-ish) */}
            <path d="M 100,100 L 20,100 A 80,80 0 0,1 100,20 Z" fill="oklch(0.85 0.18 90 / 0.75)" stroke="var(--ink)" strokeWidth="1" />
            
            {/* Center right-angle indicator for Khối 9 (25% / 90 degrees) */}
            <path d="M 90,100 L 90,90 L 100,90" fill="none" stroke="var(--ink)" strokeWidth="1" />
            
            {/* Labels */}
            <text x="140" y="80" fill="var(--ink)" fontSize="10" fontWeight="bold" textAnchor="middle">Khối 7</text>
            <text x="140" y="94" fill="var(--ink)" fontSize="9">40%</text>
            
            <text x="100" y="130" fill="var(--ink)" fontSize="10" fontWeight="bold" textAnchor="middle">Khối 6</text>
            
            <text x="48" y="110" fill="var(--ink)" fontSize="9" fontWeight="bold" textAnchor="middle">Khối 8</text>
            <text x="48" y="122" fill="var(--ink)" fontSize="8">12,5%</text>
            
            <text x="65" y="65" fill="var(--ink)" fontSize="10" fontWeight="bold" textAnchor="middle">Khối 9</text>
          </svg>
        </div>
      );

    // --- NTT 2025-26 Q2: Die Roll Frequency Table ---
    case "ntt-2025-c2":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--border)", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--surface-3)" }}>
                <th style={{ padding: "6px 10px", border: "1px solid var(--border)", textAlign: "center", fontWeight: "600" }}>Số chấm</th>
                <th style={{ padding: "6px 10px", border: "1px solid var(--border)", textAlign: "center", fontWeight: "600" }}>Số lần xuất hiện</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["1 chấm", "5"],
                ["2 chấm", "4"],
                ["3 chấm", "3"],
                ["4 chấm", "3"],
                ["5 chấm", "1"],
                ["6 chấm", "4"],
              ].map(([chấm, lần], i) => (
                <tr key={i}>
                  <td style={{ padding: "6px 10px", border: "1px solid var(--border)", textAlign: "center" }}>{chấm}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid var(--border)", textAlign: "center" }}>{lần}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    // --- NTT 2025-26 Q7: Cardboard Corner Cutout to Box ---
    case "ntt-2025-c7":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "360px" }}>
          <svg viewBox="0 0 340 140" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Left Box (solid sheet) */}
            <rect x="20" y="25" width="120" height="96" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Dimensions for Left Box */}
            <line x1="20" y1="15" x2="140" y2="15" stroke="var(--ink-muted)" strokeWidth="1" />
            <polygon points="20,15 25,12 25,18" fill="var(--ink-muted)" />
            <polygon points="140,15 135,12 135,18" fill="var(--ink-muted)" />
            <text x="80" y="10" fill="var(--ink)" fontSize="10" textAnchor="middle">25cm</text>
            
            <line x1="148" y1="25" x2="148" y2="121" stroke="var(--ink-muted)" strokeWidth="1" />
            <polygon points="148,25 145,30 151,30" fill="var(--ink-muted)" />
            <polygon points="148,121 145,116 151,116" fill="var(--ink-muted)" />
            <text x="156" y="78" fill="var(--ink)" fontSize="10" dominantBaseline="middle">20cm</text>
            
            {/* Right Box (cut sheet) */}
            {/* Cut polygon: 120x96 with 24x24 cutouts at corners */}
            <polygon 
              points="204,25 276,25 276,49 300,49 300,97 276,97 276,121 204,121 204,97 180,97 180,49 204,49" 
              fill="var(--surface-3)" 
              stroke="var(--ink)" 
              strokeWidth="1.5" 
            />
            {/* Dashed squares representing the cutouts */}
            <rect x="180" y="25" width="24" height="24" fill="none" stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="276" y="25" width="24" height="24" fill="none" stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="276" y="97" width="24" height="24" fill="none" stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="180" y="97" width="24" height="24" fill="none" stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" />
            
            {/* Cutout dimension label */}
            <line x1="180" y1="17" x2="204" y2="17" stroke="var(--ink-muted)" strokeWidth="0.8" />
            <text x="192" y="12" fill="var(--ink)" fontSize="9" textAnchor="middle">5cm</text>
          </svg>
        </div>
      );

    // --- NTT 2025-26 Q8: Semicircle Decoration ---
    case "ntt-2025-c8":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "280px" }}>
          <svg viewBox="0 0 200 110" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Large Semicircle */}
            <path d="M 10,100 A 90,90 0 0,1 190,100 Z" fill="none" stroke="oklch(0.6 0.15 140)" strokeWidth="2" />
            
            {/* Two Smaller Semicircles (colored/shaded) */}
            <path d="M 10,100 A 45,45 0 0,1 100,100 Z" fill="oklch(0.75 0.15 280 / 0.5)" stroke="oklch(0.6 0.15 280)" strokeWidth="1.5" />
            <path d="M 100,100 A 45,45 0 0,1 190,100 Z" fill="oklch(0.75 0.15 280 / 0.5)" stroke="oklch(0.6 0.15 280)" strokeWidth="1.5" />
            
            {/* Base line */}
            <line x1="10" y1="100" x2="190" y2="100" stroke="var(--ink)" strokeWidth="2" />
          </svg>
        </div>
      );

    // --- NTT 2025-26 B3 (Q15): Triangle ABC Geometry ---
    case "ntt-2025-b3":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "260px" }}>
          <svg viewBox="0 0 200 170" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Triangle ABC */}
            <polygon points="100,20 20,140 180,140" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Lines AE and CD */}
            {/* D is 2/3 down AB: (46.7, 100) */}
            {/* E is 2/3 across BC: (126.7, 140) */}
            <line x1="100" y1="20" x2="126.7" y2="140" stroke="var(--ink)" strokeWidth="1.5" />
            <line x1="180" y1="140" x2="46.7" y2="100" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Points (A, B, C, D, E, F) */}
            <circle cx="100" cy="20" r="3" fill="red" />
            <circle cx="20" cy="140" r="3" fill="red" />
            <circle cx="180" cy="140" r="3" fill="red" />
            <circle cx="46.7" cy="100" r="3" fill="red" />
            <circle cx="126.7" cy="140" r="3" fill="red" />
            <circle cx="118.8" cy="108.5" r="3" fill="red" /> {/* Intersection F */}
            
            {/* Labels */}
            <text x="100" y="14" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">A</text>
            <text x="12" y="144" fill="var(--ink)" fontSize="11" fontWeight="bold">B</text>
            <text x="184" y="144" fill="var(--ink)" fontSize="11" fontWeight="bold">C</text>
            <text x="36" y="102" fill="var(--ink)" fontSize="11" fontWeight="bold">D</text>
            <text x="126.7" y="152" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">E</text>
            <text x="123" y="102" fill="var(--ink)" fontSize="11" fontWeight="bold">F</text>
          </svg>
        </div>
      );

    // --- Cầu Giấy (CG) 2026-27 Q7: Taxi bay circle orbit ---
    case "cg-2026-c7":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "200px" }}>
          <svg viewBox="0 0 200 180" width="100%" style={{ display: "block", height: "auto" }}>
            {/* The circle orbit */}
            <circle cx="100" cy="100" r="60" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Radii OA and OB */}
            <line x1="100" y1="100" x2="160" y2="100" stroke="var(--ink)" strokeWidth="1.5" />
            <line x1="100" y1="100" x2="100" y2="40" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Right-angle indicator at center */}
            <path d="M 100,90 L 110,90 L 110,100" fill="none" stroke="var(--ink)" strokeWidth="1" />
            
            {/* Dots at center and points A, B */}
            <circle cx="100" cy="100" r="2.5" fill="var(--ink)" />
            <circle cx="160" cy="100" r="2.5" fill="var(--ink)" />
            <circle cx="100" cy="40" r="2.5" fill="var(--ink)" />
            
            {/* Text labels */}
            <text x="170" y="104" fill="var(--ink)" fontSize="12" fontWeight="bold">A</text>
            <text x="100" y="28" fill="var(--ink)" fontSize="12" fontWeight="bold" textAnchor="middle">B</text>
            <text x="130" y="93" fill="var(--ink)" fontSize="10.5" textAnchor="middle">10 km</text>
          </svg>
        </div>
      );

    // --- Cầu Giấy (CG) 2026-27 Q8: Trapezoid BDKH in ABCD ---
    case "cg-2026-c8":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "300px" }}>
          <svg viewBox="0 0 500 300" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Shaded triangle BHD */}
            <polygon points="260,80 280,160 100,240" fill="oklch(0.85 0.04 40 / 0.3)" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Quadrilateral ABCD */}
            <polygon points="160,80 260,80 400,240 100,240" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Diagonal AC */}
            <line x1="160" y1="80" x2="400" y2="240" stroke="var(--ink)" strokeWidth="1.2" />
            
            {/* Diagonal BD */}
            <line x1="260" y1="80" x2="100" y2="240" stroke="var(--ink)" strokeWidth="1.2" />
            
            {/* Line HK */}
            <line x1="280" y1="160" x2="200" y2="240" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="3 3" />
            
            {/* Points (A, B, C, D, H, K) */}
            <circle cx="160" cy="80" r="2.5" fill="var(--ink)" />
            <circle cx="260" cy="80" r="2.5" fill="var(--ink)" />
            <circle cx="400" cy="240" r="2.5" fill="var(--ink)" />
            <circle cx="100" cy="240" r="2.5" fill="var(--ink)" />
            <circle cx="280" cy="160" r="2.5" fill="var(--ink)" />
            <circle cx="200" cy="240" r="2.5" fill="var(--ink)" />
            
            {/* Labels */}
            <text x="160" y="70" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">A</text>
            <text x="260" y="70" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">B</text>
            <text x="410" y="245" fill="var(--ink)" fontSize="13" fontWeight="bold">C</text>
            <text x="85" y="245" fill="var(--ink)" fontSize="13" fontWeight="bold">D</text>
            <text x="295" y="165" fill="var(--ink)" fontSize="13" fontWeight="bold">H</text>
            <text x="200" y="258" fill="var(--ink)" fontSize="13" fontWeight="bold" textAnchor="middle">K</text>
          </svg>
        </div>
      );

    // --- Nguyễn Tất Thành (NTT) 2026-27 Q1: Book Donation Bar Chart ---
    case "ntt-2026-c1":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "340px" }}>
          <svg viewBox="0 0 320 220" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Grid Lines (Values: 0, 50, 100, 150, 200) */}
            <line x1="40" y1="160" x2="300" y2="160" stroke="var(--border-strong)" strokeWidth="1" />
            <line x1="40" y1="125" x2="300" y2="125" stroke="var(--border-soft)" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="40" y1="90" x2="300" y2="90" stroke="var(--border-soft)" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="40" y1="55" x2="300" y2="55" stroke="var(--border-soft)" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="40" y1="20" x2="300" y2="20" stroke="var(--border-soft)" strokeWidth="0.8" strokeDasharray="3 3" />

            {/* Y Labels */}
            <text x="32" y="164" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">0</text>
            <text x="32" y="129" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">50</text>
            <text x="32" y="94" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">100</text>
            <text x="32" y="59" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">150</text>
            <text x="32" y="24" fill="var(--ink-muted)" fontSize="9.5" textAnchor="end">200</text>

            <text x="14" y="90" fill="var(--ink)" fontSize="10" transform="rotate(-90, 14, 90)" textAnchor="middle">Số sách</text>

            {/* Bars: 6A1 (125), 6A2 (168), 6A3 (75, but no label), 6A4 (132) */}
            {/* 6A1: 125 -> y = 160 - 125 * 0.7 = 72.5 */}
            <rect x="55" y="72.5" width="28" height="87.5" fill="#3b82f6" rx="2" />
            <text x="69" y="66" fill="var(--ink)" fontSize="10" fontWeight="bold" textAnchor="middle">125</text>

            {/* 6A2: 168 -> y = 160 - 168 * 0.7 = 42.4 */}
            <rect x="115" y="42.4" width="28" height="117.6" fill="#3b82f6" rx="2" />
            <text x="129" y="36" fill="var(--ink)" fontSize="10" fontWeight="bold" textAnchor="middle">168</text>

            {/* 6A3: 75 -> y = 160 - 75 * 0.7 = 107.5. No value text label! */}
            <rect x="175" y="107.5" width="28" height="52.5" fill="#3b82f6" rx="2" />

            {/* 6A4: 132 -> y = 160 - 132 * 0.7 = 67.6 */}
            <rect x="235" y="67.6" width="28" height="92.4" fill="#3b82f6" rx="2" />
            <text x="249" y="62" fill="var(--ink)" fontSize="10" fontWeight="bold" textAnchor="middle">132</text>

            {/* X Labels */}
            <text x="69" y="176" fill="var(--ink)" fontSize="10" textAnchor="middle">6A1</text>
            <text x="129" y="176" fill="var(--ink)" fontSize="10" textAnchor="middle">6A2</text>
            <text x="179" y="176" fill="var(--ink)" fontSize="10" textAnchor="middle">6A3</text>
            <text x="249" y="176" fill="var(--ink)" fontSize="10" textAnchor="middle">6A4</text>
          </svg>
        </div>
      );

    // --- NTT 2026-27 Q6: Grid of Squares with Heart ---
    // User-specified grid (6 rows × 4 cols), 1=square, 0=empty, T=heart:
    // Row 1: 1 1 0 0  → col1, col2
    // Row 2: 1 1 1 0  → col1, col2, col3
    // Row 3: T 1 1 1  → col1(♥), col2, col3, col4
    // Row 4: 1 1 0 0  → col1, col2
    // Row 5: 1 1 1 1  → col1, col2, col3, col4
    // Row 6: 0 1 0 1  → col2, col4
    case "ntt-2026-c6": {
      const S = 34; // square size
      const ox = 10; // x margin
      const oy = 10; // y margin
      const c = (n: number) => ox + (n - 1) * S; // col x position (1-indexed)
      const r = (n: number) => oy + (n - 1) * S; // row y position (1-indexed)
      const sq = (col: number, row: number) => (
        <rect key={`${col}-${row}`} x={c(col)} y={r(row)} width={S} height={S} fill="none" stroke="var(--ink)" strokeWidth="1.3" />
      );
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "180px" }}>
          <svg viewBox={`0 0 ${ox + 4 * S + ox} ${oy + 6 * S + oy}`} width="100%" style={{ display: "block", height: "auto" }}>
            {/* Row 1: col1, col2 */}
            {sq(1,1)}{sq(2,1)}
            {/* Row 2: col1, col2, col3 */}
            {sq(1,2)}{sq(2,2)}{sq(3,2)}
            {/* Row 3: col1(♥), col2, col3, col4 */}
            {sq(1,3)}
            <text x={c(1)+S/2} y={r(3)+S/2+1} fill="var(--ink)" fontSize={S*0.58} textAnchor="middle" dominantBaseline="middle">♥</text>
            {sq(2,3)}{sq(3,3)}{sq(4,3)}
            {/* Row 4: col1, col2 */}
            {sq(1,4)}{sq(2,4)}
            {/* Row 5: col1, col2, col3, col4 */}
            {sq(1,5)}{sq(2,5)}{sq(3,5)}{sq(4,5)}
            {/* Row 6: col2, col4 */}
            {sq(2,6)}{sq(4,6)}
          </svg>
        </div>
      );
    }
 
     // --- NTT 2026-27 Q8: Garden ABCD with Curved Sgraffito Path ---
     // From PDF: A(top-left), B(top-right), C(bottom-right), D(bottom-left)
     // M on AB with AM=AB/4; N on DC directly below M
     // Two parallel quarter-circle arcs: arc from A sweeping right-down, and arc from M sweeping right-down
     // Green shaded region (60m²) is between the two arcs
     // Arc center at D(25,155) with r=130: arc from A(25,20) → P1(155,155)
     // Arc center at N(78,155) with r=130: arc from M(78,20) → P2(208,155)
     case "ntt-2026-c8":
       return (
         <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "280px" }}>
           <svg viewBox="0 0 265 175" width="100%" style={{ display: "block", height: "auto" }}>
             {/* Rectangle ABCD */}
             <rect x="25" y="20" width="210" height="135" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
             <defs>
               <clipPath id="ntt-c8-clip">
                 <rect x="25" y="20" width="210" height="135" />
               </clipPath>
             </defs>
             {/* Green shaded region between the two arcs */}
             <path
               d="M 25,20 A 130,130 0 0,1 155,155 L 208,155 A 130,130 0 0,0 78,20 Z"
               fill="oklch(0.55 0.18 140 / 0.35)"
               stroke="none"
               clipPath="url(#ntt-c8-clip)"
             />
             {/* Arc 1: from A(25,20) → P1(155,155), sweeping clockwise (right then down) */}
             <path d="M 25,20 A 130,130 0 0,1 155,155" fill="none" stroke="var(--ink)" strokeWidth="1.5" clipPath="url(#ntt-c8-clip)" />
             {/* Arc 2: from M(78,20) → P2(208,155), parallel to arc 1 */}
             <path d="M 78,20 A 130,130 0 0,1 208,155" fill="none" stroke="var(--ink)" strokeWidth="1.5" clipPath="url(#ntt-c8-clip)" />
             {/* MN vertical line (dashed) */}
             <line x1="78" y1="20" x2="78" y2="155" stroke="var(--ink)" strokeWidth="1" strokeDasharray="4 3" />
             {/* Corner labels */}
             <text x="18" y="17" fill="var(--ink)" fontSize="12" fontWeight="bold">A</text>
             <text x="237" y="17" fill="var(--ink)" fontSize="12" fontWeight="bold">B</text>
             <text x="237" y="168" fill="var(--ink)" fontSize="12" fontWeight="bold">C</text>
             <text x="18" y="168" fill="var(--ink)" fontSize="12" fontWeight="bold">D</text>
             <text x="78" y="14" fill="var(--ink)" fontSize="12" fontWeight="bold" textAnchor="middle">M</text>
             <text x="78" y="170" fill="var(--ink)" fontSize="12" fontWeight="bold" textAnchor="middle">N</text>
             {/* 60m² label in shaded area */}
             <text x="135" y="95" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">60 m²</text>
           </svg>
         </div>
       );

    // --- NTT 2026-27 Q12: Cube cạnh 9 dm khoét hộp 5×4×3 dm dọc cạnh trên ---
    // SVG sinh bởi Codex CLI (gpt-5.5) từ PDF, làm sạch line trùng và format.
    case "ntt-2026-c12":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 360 280" width="100%" style={{ display: "block", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
            <g fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Big cube — visible edges */}
              <path d="M 58 78 L 220 78 L 302 31 L 140 31 Z" />
              <path d="M 58 78 L 58 240 L 220 240 L 220 78" />
              <path d="M 220 78 L 302 31 L 302 193 L 220 240" />
              {/* Big cube — hidden edges */}
              <path d="M 58 240 L 140 193 L 302 193" strokeDasharray="6 4" />
              <path d="M 140 31 L 140 193" strokeDasharray="6 4" />

              {/* Cavity opens to front + top (corner cut along front-top edge) */}
              {/* Cavity — top opening (visible) */}
              <path d="M 94 78 L 184 78" />
              <path d="M 94 78 L 130.4 57.1" />
              <path d="M 184 78 L 220.4 57.1" />
              <path d="M 130.4 57.1 L 220.4 57.1" />
              {/* Cavity — front-vertical walls (visible) */}
              <path d="M 94 78 L 94 132" />
              <path d="M 184 78 L 184 132" />
              {/* Cavity — back-vertical walls (visible through opening) */}
              <path d="M 130.4 57.1 L 130.4 111.1" />
              <path d="M 220.4 57.1 L 220.4 111.1" />
              {/* Cavity — bottom edges (hidden inside solid) */}
              <path d="M 94 132 L 184 132 L 220.4 111.1" strokeDasharray="6 4" />
              <path d="M 94 132 L 130.4 111.1 L 220.4 111.1" strokeDasharray="6 4" />

              {/* Dimension lines (5 dm, 4 dm, 3 dm) */}
              <line x1="130.4" y1="48" x2="220.4" y2="48" strokeWidth="1" />
              <line x1="132" y1="43" x2="132" y2="53" strokeWidth="1" />
              <line x1="218.8" y1="43" x2="218.8" y2="53" strokeWidth="1" />

              <line x1="188" y1="72" x2="224.4" y2="51.1" strokeWidth="1" />
              <line x1="184.7" y1="67.9" x2="191.3" y2="76.1" strokeWidth="1" />
              <line x1="221.1" y1="47" x2="227.7" y2="55.2" strokeWidth="1" />

              <line x1="230.4" y1="57.1" x2="230.4" y2="111.1" strokeWidth="1" />
              <line x1="225.4" y1="58.6" x2="235.4" y2="58.6" strokeWidth="1" />
              <line x1="225.4" y1="109.6" x2="235.4" y2="109.6" strokeWidth="1" />
            </g>

            {/* Dimension labels */}
            <g fill="var(--ink)" fontSize="16" fontStyle="italic" fontFamily="Times,serif">
              <text x="166" y="43">5 dm</text>
              <text x="194" y="62">4 dm</text>
              <text x="237" y="88">3 dm</text>
            </g>
          </svg>
        </div>
      );

    // --- NTT 2026-27 Q15: Triangle ABC Geometry with Midpoint I ---
    case "ntt-2026-c15":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "260px" }}>
          <svg viewBox="0 0 200 170" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Triangle ABC */}
            <polygon points="100,20 20,140 180,140" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* M at 1/4 of BC: (60, 140) */}
            {/* N at 3/4 of BC: (140, 140) */}
            {/* I is (100, 80) */}
            
            {/* Lines from vertices to I */}
            <line x1="100" y1="20" x2="100" y2="80" stroke="var(--ink)" strokeWidth="1.2" />
            <line x1="20" y1="140" x2="100" y2="80" stroke="var(--ink)" strokeWidth="1" />
            <line x1="180" y1="140" x2="100" y2="80" stroke="var(--ink)" strokeWidth="1" />
            
            {/* Lines from M, N to I */}
            <line x1="60" y1="140" x2="100" y2="80" stroke="var(--ink)" strokeWidth="1.2" />
            <line x1="140" y1="140" x2="100" y2="80" stroke="var(--ink)" strokeWidth="1.2" />
            
            {/* Points (A, B, C, I, M, N) */}
            <circle cx="100" cy="20" r="2.5" fill="var(--ink)" />
            <circle cx="20" cy="140" r="2.5" fill="var(--ink)" />
            <circle cx="180" cy="140" r="2.5" fill="var(--ink)" />
            <circle cx="100" cy="80" r="2.5" fill="var(--ink)" />
            <circle cx="60" cy="140" r="2.5" fill="var(--ink)" />
            <circle cx="140" cy="140" r="2.5" fill="var(--ink)" />
            
            {/* Labels */}
            <text x="100" y="14" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">A</text>
            <text x="12" y="144" fill="var(--ink)" fontSize="11" fontWeight="bold">B</text>
            <text x="184" y="144" fill="var(--ink)" fontSize="11" fontWeight="bold">C</text>
            <text x="105" y="78" fill="var(--ink)" fontSize="11.5" fontWeight="bold">I</text>
            <text x="60" y="152" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">M</text>
            <text x="140" y="152" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">N</text>
          </svg>
        </div>
      );

    // --- LTV 2025-26 Q5: Triangle Number Pattern ---
    case "ltv-2025-c5": {
      const drawTriangle = (cx: number, cy: number, topVal: string, leftVal: string, rightVal: string, centerVal: string) => {
        return (
          <g key={cx}>
            {/* Outer Triangle */}
            <polygon points={`${cx},${cy - 45} ${cx - 50},${cy + 40} ${cx + 50},${cy + 40}`} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Inner Inverted Triangle connecting midpoints */}
            <polygon points={`${cx - 25},${cy - 2.5} ${cx + 25},${cy - 2.5} ${cx},${cy + 40}`} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            
            {/* Text Values */}
            {/* Top small triangle */}
            <text x={cx} y={cy - 16} fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{topVal}</text>
            
            {/* Center inverted small triangle */}
            <text x={cx} y={cy + 12} fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{centerVal}</text>
            
            {/* Bottom-left small triangle */}
            <text x={cx - 25} y={cy + 26} fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{leftVal}</text>
            
            {/* Bottom-right small triangle */}
            <text x={cx + 25} y={cy + 26} fill="var(--ink)" fontSize="13.5" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{rightVal}</text>
          </g>
        );
      };

      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "340px" }}>
          <svg viewBox="0 0 340 120" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Triangle 1: center=15, top=2, left=6, right=4 */}
            {drawTriangle(60, 55, "2", "6", "4", "15")}
            
            {/* Triangle 2: center=18, top=3, left=5, right=7 */}
            {drawTriangle(170, 55, "3", "5", "7", "18")}
            
            {/* Triangle 3: center=?, top=6, left=8, right=10 */}
            {drawTriangle(280, 55, "6", "8", "10", "?")}
          </svg>
        </div>
      );
    }

    // --- LTV 2025-26 Q12: Ant Tracks (Semicircles) ---
    case "ltv-2025-c12":
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "300px" }}>
          <svg viewBox="0 0 300 150" width="100%" style={{ display: "block", height: "auto" }}>
            <defs>
              <marker id="ltv-arrow-head" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--ink)" />
              </marker>
            </defs>

            {/* Base line AB */}
            <line x1="30" y1="120" x2="270" y2="120" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Curve I (AB) */}
            <path d="M 30,120 A 120,120 0 0,1 270,120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Curve II-1 (AE) */}
            <path d="M 30,120 A 60,60 0 0,1 150,120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Curve II-2 (EF) */}
            <path d="M 150,120 A 40,40 0 0,1 230,120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Curve II-3 (FB) */}
            <path d="M 230,120 A 20,20 0 0,1 270,120" fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Arrow for Curve I */}
            <path d="M 32,92 A 126,126 0 0,1 46,62" fill="none" stroke="var(--ink)" strokeWidth="1" markerEnd="url(#ltv-arrow-head)" />

            {/* Arrow for Curve II-1 */}
            <path d="M 32,98 A 66,66 0 0,1 43,78" fill="none" stroke="var(--ink)" strokeWidth="1" markerEnd="url(#ltv-arrow-head)" />

            {/* Arrow for Curve II-2 */}
            <path d="M 152,101.5 A 46,46 0 0,1 161,87.5" fill="none" stroke="var(--ink)" strokeWidth="1" markerEnd="url(#ltv-arrow-head)" />

            {/* Arrow for Curve II-3 */}
            <path d="M 232,105.3 A 26,26 0 0,1 239.5,98" fill="none" stroke="var(--ink)" strokeWidth="1" markerEnd="url(#ltv-arrow-head)" />

            {/* Points Labels */}
            <text x="30" y="135" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">A</text>
            <text x="150" y="135" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">E</text>
            <text x="230" y="135" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">F</text>
            <text x="270" y="135" fill="var(--ink)" fontSize="11" fontWeight="bold" textAnchor="middle">B</text>

            {/* Curve Labels */}
            <text x="52" y="62" fill="var(--ink)" fontSize="11.5" fontWeight="bold">I</text>
            <text x="65" y="93" fill="var(--ink)" fontSize="11.5" fontWeight="bold">II</text>
          </svg>
        </div>
      );

    // --- NTL 2025-26 C8: Pie chart (Bóng đá 40%, Cầu lông 35%, Bóng rổ 25%) ---
    case "ntl-2025-c8": {
      // Center (110, 100), radius 75. Clockwise from top:
      //   Cầu lông 35% (0° → 126°), Bóng rổ 25% (126° → 216°), Bóng đá 40% (216° → 360°).
      // Endpoint angles (sin/cos at clockwise-from-top):
      //   126°: (170.7, 144.1)
      //   216°: ( 65.9, 160.7)
      // Centroids (r=36):
      //   Cầu lông @ 63°: (142, 84)
      //   Bóng rổ  @ 171°: (116, 136)
      //   Bóng đá  @ 288°: (76, 89)
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "260px" }}>
          <svg viewBox="0 0 220 210" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Cầu lông 35% — gray */}
            <path d="M 110 100 L 110 25 A 75 75 0 0 1 170.7 144.1 Z"
              fill="#9ca3af" stroke="var(--surface)" strokeWidth="1.5" />
            {/* Bóng rổ 25% — blue */}
            <path d="M 110 100 L 170.7 144.1 A 75 75 0 0 1 65.9 160.7 Z"
              fill="#3b82f6" stroke="var(--surface)" strokeWidth="1.5" />
            {/* Bóng đá 40% — orange/yellow */}
            <path d="M 110 100 L 65.9 160.7 A 75 75 0 0 1 110 25 Z"
              fill="#f59e0b" stroke="var(--surface)" strokeWidth="1.5" />
            {/* Labels inside each slice */}
            <text x="142" y="82" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">Cầu lông</text>
            <text x="142" y="95" fill="#fff" fontSize="11" textAnchor="middle">35%</text>
            <text x="116" y="133" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">Bóng rổ</text>
            <text x="116" y="146" fill="#fff" fontSize="11" textAnchor="middle">25%</text>
            <text x="76" y="87" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">Bóng đá</text>
            <text x="76" y="100" fill="#fff" fontSize="11" textAnchor="middle">40%</text>
          </svg>
        </div>
      );
    }

    // --- NTL 2025-26 C9: 4×4 grid hình vuông ABCD with labels A, E, B, H, G, D, C ---
    // Tentative interpretation: ABCD 4cm × 4cm, E=(2,4), H=(0,2), G=(2,2).
    case "ntl-2025-c9": {
      // SVG: scale 35, offset (30, 170 - 35y). viewBox 220 × 220.
      const cell = 35, ox = 30, oy = 30;  // top-left of grid = A
      const px = (mx: number) => ox + mx * cell;
      const py = (my: number) => oy + (4 - my) * cell;
      // Vertex coords (math y-up):
      // A(0,4) → top-left, B(4,4) → top-right, C(4,0) → bottom-right, D(0,0) → bottom-left
      // E(2,4) on AB, H(0,2) on AD, G(2,2) center
      const lines = [];
      for (let i = 0; i <= 4; i++) {
        // Vertical lines
        lines.push(<line key={`v${i}`} x1={ox + i * cell} y1={oy} x2={ox + i * cell} y2={oy + 4 * cell}
          stroke="var(--ink)" strokeWidth={i === 0 || i === 4 ? 1.6 : 1.0} />);
        // Horizontal lines
        lines.push(<line key={`h${i}`} x1={ox} y1={oy + i * cell} x2={ox + 4 * cell} y2={oy + i * cell}
          stroke="var(--ink)" strokeWidth={i === 0 || i === 4 ? 1.6 : 1.0} />);
      }
      // Lattice dots at all 25 intersections
      const dots = [];
      for (let i = 0; i <= 4; i++) {
        for (let j = 0; j <= 4; j++) {
          dots.push(<circle key={`d${i}-${j}`} cx={ox + i * cell} cy={oy + j * cell}
            r="2.5" fill="var(--ink)" />);
        }
      }
      // "1 cm" arc above A-to-first-dot segment (showing unit length)
      const arcY = oy - 12;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "250px" }}>
          <svg viewBox="0 0 220 220" width="100%" style={{ display: "block", height: "auto" }}>
            {lines}
            {dots}
            {/* 1 cm bracket arc above top edge between A and (1,4) */}
            <path d={`M ${px(0)},${arcY + 6} L ${px(0)},${arcY} L ${px(1)},${arcY} L ${px(1)},${arcY + 6}`}
              fill="none" stroke="var(--ink)" strokeWidth="1" />
            <text x={(px(0) + px(1)) / 2} y={arcY - 3} fill="var(--ink)" fontSize="11"
              textAnchor="middle">1 cm</text>
            {/* Labels */}
            <text x={px(0) - 8} y={py(4) - 4} fill="var(--ink)" fontSize="16" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
            <text x={px(2)} y={py(4) - 6} fill="var(--ink)" fontSize="16" textAnchor="middle"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>E</text>
            <text x={px(4) + 8} y={py(4) - 4} fill="var(--ink)" fontSize="16" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x={px(0) - 8} y={py(2) + 4} fill="var(--ink)" fontSize="16" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>H</text>
            <text x={px(2) + 6} y={py(2) - 6} fill="var(--ink)" fontSize="16" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>G</text>
            <text x={px(0) - 8} y={py(0) + 14} fill="var(--ink)" fontSize="16" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>D</text>
            <text x={px(4) + 8} y={py(0) + 14} fill="var(--ink)" fontSize="16" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
          </svg>
        </div>
      );
    }

    // --- NTL 2025-26 B2: Triangle ABC with N (mid AC), E on BN with BE=2/3·BN, AE→M on BC, H = foot of perp A→BC ---
    // Math: B(0,0) C(4,0) A(1,6). N(2.5,3), E(5/3,2), M(2,0), H(1,0).
    case "ntl-2025-b2": {
      // SVG transform: scale 32, x → 20+32x, y → 220-32y. viewBox 200 × 240.
      const Bx = 20,    By = 220;
      const Cx = 148,   Cy = 220;
      const Ax = 52,    Ay = 28;
      const Hx = 52,    Hy = 220;
      const Mx = 84,    My = 220;
      const Nx = 100,   Ny = 124;
      const Ex = 73.3,  Ey = 156;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox="0 0 200 240" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Triangle ABC */}
            <polygon points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`}
              fill="none" stroke="var(--ink)" strokeWidth="1.6" />
            {/* Cevian BN (from B to mid of AC) */}
            <line x1={Bx} y1={By} x2={Nx} y2={Ny} stroke="var(--ink)" strokeWidth="1.4" />
            {/* Cevian AM (passes through E) */}
            <line x1={Ax} y1={Ay} x2={Mx} y2={My} stroke="var(--ink)" strokeWidth="1.4" />
            {/* Height AH (perpendicular to BC) */}
            <line x1={Ax} y1={Ay} x2={Hx} y2={Hy} stroke="var(--ink)" strokeWidth="1.4" strokeDasharray="4 3" />
            {/* Right-angle marker at H */}
            <path d={`M ${Hx + 8},${Hy} L ${Hx + 8},${Hy - 8} L ${Hx},${Hy - 8}`}
              fill="none" stroke="var(--ink)" strokeWidth="1.1" />
            {/* Vertex / interior dots */}
            {[[Ax,Ay],[Bx,By],[Cx,Cy],[Nx,Ny],[Ex,Ey],[Hx,Hy],[Mx,My]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r="3.5" fill="orange" stroke="orange" />
            ))}
            {/* Labels */}
            <text x={Ax} y={Ay - 8} fill="var(--ink)" fontSize="15" textAnchor="middle"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
            <text x={Bx - 8} y={By + 6} fill="var(--ink)" fontSize="15" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x={Cx + 8} y={Cy + 6} fill="var(--ink)" fontSize="15" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
            <text x={Nx + 8} y={Ny + 4} fill="var(--ink)" fontSize="15" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>N</text>
            <text x={Ex + 9} y={Ey + 4} fill="var(--ink)" fontSize="15" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>E</text>
            <text x={Hx - 4} y={Hy + 16} fill="var(--ink)" fontSize="15" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>H</text>
            <text x={Mx + 4} y={My + 16} fill="var(--ink)" fontSize="15" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>M</text>
          </svg>
        </div>
      );
    }

    // --- NTL 2022-23 Q11: Ant path graph M → N (6 paths) ---
    // Vertices: M(top), A(mid-L), B(mid-R), P(bot-L), C(bot-M), N(bot-R).
    // Directed edges: M→A, M→B, B→A, A→C, A→P, B→C, B→N, P→C, C→N.
    case "ntl-2022-c11": {
      const Mx = 190, My = 30;
      const Ax = 115, Ay = 130;
      const Bx = 265, By = 130;
      const Px = 30,  Py = 220;
      const Cx = 190, Cy = 220;
      const Nx = 350, Ny = 220;
      // Helper: place arrow head a bit before the endpoint so it sits on the line
      const ARROW = "url(#ntl-arrow)";
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "360px" }}>
          <svg viewBox="0 0 380 240" width="100%" style={{ display: "block", height: "auto" }}>
            <defs>
              <marker id="ntl-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)" />
              </marker>
            </defs>
            {/* Directed edges */}
            <line x1={Mx} y1={My} x2={Ax} y2={Ay} stroke="var(--ink)" strokeWidth="1.4" markerEnd={ARROW} />
            <line x1={Mx} y1={My} x2={Bx} y2={By} stroke="var(--ink)" strokeWidth="1.4" markerEnd={ARROW} />
            <line x1={Bx} y1={By} x2={Ax} y2={Ay} stroke="var(--ink)" strokeWidth="1.4" markerEnd={ARROW} />
            <line x1={Ax} y1={Ay} x2={Cx} y2={Cy} stroke="var(--ink)" strokeWidth="1.4" markerEnd={ARROW} />
            <line x1={Ax} y1={Ay} x2={Px} y2={Py} stroke="var(--ink)" strokeWidth="1.4" markerEnd={ARROW} />
            <line x1={Bx} y1={By} x2={Cx} y2={Cy} stroke="var(--ink)" strokeWidth="1.4" markerEnd={ARROW} />
            <line x1={Bx} y1={By} x2={Nx} y2={Ny} stroke="var(--ink)" strokeWidth="1.4" markerEnd={ARROW} />
            <line x1={Px} y1={Py} x2={Cx} y2={Cy} stroke="var(--ink)" strokeWidth="1.4" markerEnd={ARROW} />
            <line x1={Cx} y1={Cy} x2={Nx} y2={Ny} stroke="var(--ink)" strokeWidth="1.4" markerEnd={ARROW} />
            {/* Vertices (white-filled to occlude lines, then label on top) */}
            {[[Mx,My],[Ax,Ay],[Bx,By],[Px,Py],[Cx,Cy],[Nx,Ny]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r="4" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.2" />
            ))}
            {/* Labels (italic Times) */}
            <text x={Mx} y={My - 10} fill="var(--ink)" fontSize="16" textAnchor="middle"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>M</text>
            <text x={Ax - 8} y={Ay - 4} fill="var(--ink)" fontSize="16" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
            <text x={Bx + 8} y={By - 4} fill="var(--ink)" fontSize="16" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x={Px - 6} y={Py + 4} fill="var(--ink)" fontSize="16" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>P</text>
            <text x={Cx} y={Cy + 18} fill="var(--ink)" fontSize="16" textAnchor="middle"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
            <text x={Nx + 6} y={Ny + 4} fill="var(--ink)" fontSize="16" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>N</text>
          </svg>
        </div>
      );
    }

    // --- NTL 2022-23 B2: Rectangle ABCD with M (mid BC), N (on DM), P (on DC) ---
    // S_ABCD = 60, BM = MC. N on DM with DN:NM = 1:2. P on DC with line BP through N.
    // Math: A(0,5) B(12,5) C(12,0) D(0,0), M(12,2.5), N(4, 5/6), P(12/5, 0)
    case "ntl-2022-b2": {
      const Ax = 20,  Ay = 20;
      const Bx = 320, By = 20;
      const Cx = 320, Cy = 145;
      const Dx = 20,  Dy = 145;
      const Mx = 320, My = 82.5;
      const Nx = 120, Ny = 124.17;
      const Px = 80,  Py = 145;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "360px" }}>
          <svg viewBox="0 0 360 185" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Rectangle ABCD */}
            <polygon points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Dx},${Dy}`}
              fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Diagonal BD (dashed) */}
            <line x1={Bx} y1={By} x2={Dx} y2={Dy}
              stroke="var(--ink)" strokeWidth="1.2" strokeDasharray="5 4" />
            {/* DM (solid) */}
            <line x1={Dx} y1={Dy} x2={Mx} y2={My} stroke="var(--ink)" strokeWidth="1.5" />
            {/* BP (solid — passes through N) */}
            <line x1={Bx} y1={By} x2={Px} y2={Py} stroke="var(--ink)" strokeWidth="1.5" />
            {/* Vertex / interior dots */}
            {[[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy],[Mx,My],[Nx,Ny],[Px,Py]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r="3.5" fill="orange" stroke="orange" />
            ))}
            {/* Labels */}
            <text x={Ax - 5} y={Ay - 4} fill="var(--ink)" fontSize="15" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
            <text x={Bx + 5} y={By - 4} fill="var(--ink)" fontSize="15" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x={Cx + 5} y={Cy + 14} fill="var(--ink)" fontSize="15" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
            <text x={Dx - 5} y={Dy + 14} fill="var(--ink)" fontSize="15" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>D</text>
            <text x={Mx + 8} y={My + 4} fill="var(--ink)" fontSize="15" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>M</text>
            <text x={Nx + 6} y={Ny - 4} fill="var(--ink)" fontSize="15" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>N</text>
            <text x={Px} y={Py + 14} fill="var(--ink)" fontSize="15" textAnchor="middle"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>P</text>
          </svg>
        </div>
      );
    }

    // --- NTL 2023-24 Q7: Outer rect 12m × 8m, inner shaded rect 8m × 4m (2m margin all around) ---
    case "ntl-2023-c7": {
      // viewBox 360 × 250. Scale 25 px/m. Outer 12×8 → 300×200. Inner 8×4 → 200×100.
      const OUTx = 40, OUTy = 30, OUTw = 300, OUTh = 200;
      const INx = OUTx + 50, INy = OUTy + 50, INw = 200, INh = 100;
      const midX = OUTx + OUTw / 2;
      const midY = OUTy + OUTh / 2;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "380px" }}>
          <svg viewBox="0 0 380 250" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Outer rectangle (frame, no fill) */}
            <rect x={OUTx} y={OUTy} width={OUTw} height={OUTh} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Inner shaded rectangle (green tô đậm) */}
            <rect x={INx} y={INy} width={INw} height={INh} fill="oklch(0.7 0.14 145 / 0.55)" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Dimension arrows + labels: 12m top */}
            <text x={midX} y={OUTy - 8} fill="var(--ink)" fontSize="13" textAnchor="middle" fontWeight="600">12m</text>
            {/* 8m right outside */}
            <text x={OUTx + OUTw + 10} y={midY + 4} fill="var(--ink)" fontSize="13" textAnchor="start" fontWeight="600">8m</text>
            {/* 2m gap labels at top / bottom / left / right of inner */}
            <text x={midX} y={INy - 4} fill="var(--ink)" fontSize="11" textAnchor="middle">2m</text>
            <text x={midX} y={INy + INh + 14} fill="var(--ink)" fontSize="11" textAnchor="middle">2m</text>
            <text x={INx - 6} y={midY + 4} fill="var(--ink)" fontSize="11" textAnchor="end">2m</text>
            <text x={INx + INw + 6} y={midY + 4} fill="var(--ink)" fontSize="11" textAnchor="start">2m</text>
            {/* Tiny perpendicular arrows showing the 2m gaps */}
            <g stroke="var(--ink)" strokeWidth="1" fill="none">
              {/* top gap: vertical arrow */}
              <line x1={midX} y1={OUTy + 4} x2={midX} y2={INy - 4} markerEnd="url(#ntl-arrowsm)" markerStart="url(#ntl-arrowsm)" />
              {/* bottom gap */}
              <line x1={midX} y1={INy + INh + 4} x2={midX} y2={OUTy + OUTh - 4} markerEnd="url(#ntl-arrowsm)" markerStart="url(#ntl-arrowsm)" />
              {/* left gap */}
              <line x1={OUTx + 4} y1={midY} x2={INx - 4} y2={midY} markerEnd="url(#ntl-arrowsm)" markerStart="url(#ntl-arrowsm)" />
              {/* right gap */}
              <line x1={INx + INw + 4} y1={midY} x2={OUTx + OUTw - 4} y2={midY} markerEnd="url(#ntl-arrowsm)" markerStart="url(#ntl-arrowsm)" />
            </g>
            <defs>
              <marker id="ntl-arrowsm" viewBox="0 0 8 8" refX="6" refY="4"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--ink)" />
              </marker>
            </defs>
          </svg>
        </div>
      );
    }

    // --- NTL 2023-24 Q10: 4×4 grid of pink squares (counting all squares = 30) ---
    case "ntl-2023-c10": {
      const cell = 36;
      const ox = 10, oy = 10;
      const lines = [];
      for (let i = 0; i <= 4; i++) {
        // vertical
        lines.push(<line key={`v${i}`} x1={ox + i * cell} y1={oy} x2={ox + i * cell} y2={oy + 4 * cell}
          stroke="var(--ink)" strokeWidth="1.4" />);
        // horizontal
        lines.push(<line key={`h${i}`} x1={ox} y1={oy + i * cell} x2={ox + 4 * cell} y2={oy + i * cell}
          stroke="var(--ink)" strokeWidth="1.4" />);
      }
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "180px" }}>
          <svg viewBox="0 0 164 164" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Filled background */}
            <rect x={ox} y={oy} width={4 * cell} height={4 * cell} fill="oklch(0.85 0.08 0 / 0.55)" />
            {lines}
          </svg>
        </div>
      );
    }

    // --- NTL 2023-24 B2: Triangle ABC with M on AC (AM=2MC), I = midpoint BM, AI ∩ BC at K ---
    // Math: A(4, 6), B(0, 0), C(10, 0). M(8, 2). I(4, 1). K(4, 0). AI is vertical (x=4).
    case "ntl-2023-b2": {
      // SVG transform: (x, y) → (20 + 28x, 200 - 28y), viewBox 320 × 220.
      const Bx = 20,  By = 200;
      const Cx = 300, Cy = 200;
      const Ax = 132, Ay = 32;
      const Mx = 244, My = 144;
      const Ix = 132, Iy = 172;
      const Kx = 132, Ky = 200;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 320 220" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Triangle ABC */}
            <polygon points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`}
              fill="none" stroke="var(--ink)" strokeWidth="1.6" />
            {/* Cevian BM */}
            <line x1={Bx} y1={By} x2={Mx} y2={My} stroke="var(--ink)" strokeWidth="1.4" />
            {/* Cevian AK */}
            <line x1={Ax} y1={Ay} x2={Kx} y2={Ky} stroke="var(--ink)" strokeWidth="1.4" />
            {/* Tick mark on AC near M (shows M is on AC; small perpendicular) */}
            <line x1={Mx + 6} y1={My - 8} x2={Mx + 14} y2={My - 4}
              stroke="var(--ink)" strokeWidth="1.2" />
            {/* Vertex / interior dots */}
            {[[Ax,Ay],[Bx,By],[Cx,Cy],[Mx,My],[Ix,Iy],[Kx,Ky]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r="4" fill="orange" stroke="orange" />
            ))}
            {/* Labels */}
            <text x={Ax} y={Ay - 8} fill="var(--ink)" fontSize="16" textAnchor="middle"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
            <text x={Bx - 8} y={By + 6} fill="var(--ink)" fontSize="16" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x={Cx + 8} y={Cy + 6} fill="var(--ink)" fontSize="16" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
            <text x={Mx + 12} y={My + 4} fill="var(--ink)" fontSize="16" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>M</text>
            <text x={Ix - 10} y={Iy + 2} fill="var(--ink)" fontSize="16" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>I</text>
            <text x={Kx} y={Ky + 18} fill="var(--ink)" fontSize="16" textAnchor="middle"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>K</text>
          </svg>
        </div>
      );
    }

    // --- NN 2022-23 Q5: Hình vuông ABCD (6cm) + hai hình vuông nhỏ (3cm), phần tô đậm ---
    // Math frame (y-up), scale 30 px/cm, offset (30, 300). 9×9 construction:
    //   Main ABCD: A(3,6) B(9,6) C(9,0) D(3,0)
    //   Top small square: [3,6] × [6,9]   (shares corner A with main + edge along main's top)
    //   Left small square: [0,3] × [3,6]  (shares corner A with main + edge along main's left)
    //   Shaded triangle EHC: E(6,9) — top-right of top-small, H(0,3) — bottom-left of left-small, C(9,0).
    case "nn-2022-c5": {
      // SVG coords for square corners
      const Ax = 120, Ay = 120;  // A(3, 6)
      const Bx = 300, By = 120;  // B(9, 6)
      const Cx = 300, Cy = 300;  // C(9, 0)
      const Dx = 120, Dy = 300;  // D(3, 0)
      const TopTL = { x: 120, y: 30 };   // (3, 9)
      const TopTR = { x: 210, y: 30 };   // (6, 9) = E
      const TopBR = { x: 210, y: 120 };  // (6, 6)
      const LeftTL = { x: 30, y: 120 };  // (0, 6)
      const LeftBL = { x: 30, y: 210 };  // (0, 3) = H
      const LeftBR = { x: 120, y: 210 }; // (3, 3)
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 330 330" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Shaded triangle EHC (yellow translucent), drawn BEFORE outlines so they overlay */}
            <polygon
              points={`${TopTR.x},${TopTR.y} ${LeftBL.x},${LeftBL.y} ${Cx},${Cy}`}
              fill="oklch(0.85 0.15 85 / 0.6)"
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            {/* Main square ABCD */}
            <polygon points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Dx},${Dy}`}
              fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Top small square */}
            <polygon points={`${TopTL.x},${TopTL.y} ${TopTR.x},${TopTR.y} ${TopBR.x},${TopBR.y} ${Ax},${Ay}`}
              fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Left small square */}
            <polygon points={`${LeftTL.x},${LeftTL.y} ${Ax},${Ay} ${LeftBR.x},${LeftBR.y} ${LeftBL.x},${LeftBL.y}`}
              fill="none" stroke="var(--ink)" strokeWidth="1.5" />

            {/* Vertex labels A, B, C, D (italic Times, var(--ink)) */}
            <text x={Ax + 5} y={Ay + 16} fill="var(--ink)" fontSize="16" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
            <text x={Bx - 5} y={By + 16} fill="var(--ink)" fontSize="16" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x={Cx + 6} y={Cy - 4} fill="var(--ink)" fontSize="16" textAnchor="start"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
            <text x={Dx - 6} y={Dy - 4} fill="var(--ink)" fontSize="16" textAnchor="end"
              style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>D</text>

            {/* Dimension labels */}
            <text x={(TopTL.x + TopTR.x) / 2} y={TopTL.y - 8} fill="var(--ink)" fontSize="12"
              textAnchor="middle">3cm</text>
            <text x={LeftTL.x - 6} y={(LeftTL.y + LeftBL.y) / 2 + 4} fill="var(--ink)" fontSize="12"
              textAnchor="end">3cm</text>
            <text x={(Dx + Cx) / 2} y={Cy + 18} fill="var(--ink)" fontSize="12"
              textAnchor="middle">6cm</text>
          </svg>
        </div>
      );
    }

    // --- NN 2019-20 Q4: Triangle ABC with cevians AD, BE intersecting at F ---
    // BD = 1/2 DC (BC chia 3 phần); AE = 1/4 AC. Tỉ số S_BDF : S_AEF = 2 : 1.
    case "nn-2019-c4": {
      // Math coords (y-up): B(0,0), C(360,0), A(130,270), D(120,0), E(187.5, 202.5), F(125, 135).
      // SVG transform: (x, y) → (x + 20, 290 - y), viewBox 400×320.
      const Bx = 20,    By = 290;
      const Cx = 380,   Cy = 290;
      const Ax = 150,   Ay = 20;
      const Dx = 140,   Dy = 290;
      const Ex = 207.5, Ey = 87.5;
      const Fx = 145,   Fy = 155;
      // Tick markers showing equal segments
      const TickBC = { x: 260, y: 290 };          // midpoint of DC (DC chia làm 2 phần đều)
      const TickAC1 = { x: 267.5, y: 155 };       // 1/2 AC
      const TickAC2 = { x: 322.5, y: 222.5 };     // 3/4 AC
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 400 320" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Triangle ABC */}
            <polygon points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`} fill="none" stroke="var(--ink)" strokeWidth="1.8" />
            {/* Cevian AD */}
            <line x1={Ax} y1={Ay} x2={Dx} y2={Dy} stroke="var(--ink)" strokeWidth="1.5" />
            {/* Cevian BE */}
            <line x1={Bx} y1={By} x2={Ex} y2={Ey} stroke="var(--ink)" strokeWidth="1.5" />
            {/* Tick markers (equal-segment indicators) */}
            <circle cx={TickBC.x} cy={TickBC.y} r="3" fill="orange" stroke="orange" />
            <circle cx={TickAC1.x} cy={TickAC1.y} r="3" fill="orange" stroke="orange" />
            <circle cx={TickAC2.x} cy={TickAC2.y} r="3" fill="orange" stroke="orange" />
            {/* Vertex / intersection dots */}
            <circle cx={Ax} cy={Ay} r="4.5" fill="orange" stroke="orange" />
            <circle cx={Bx} cy={By} r="4.5" fill="orange" stroke="orange" />
            <circle cx={Cx} cy={Cy} r="4.5" fill="orange" stroke="orange" />
            <circle cx={Dx} cy={Dy} r="4.5" fill="orange" stroke="orange" />
            <circle cx={Ex} cy={Ey} r="4.5" fill="orange" stroke="orange" />
            <circle cx={Fx} cy={Fy} r="4.5" fill="orange" stroke="orange" />
            {/* Labels (italic Times, var(--ink)) */}
            <text x={Ax} y={Ay - 8} fill="var(--ink)" fontSize="18" textAnchor="middle" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
            <text x={Bx - 8} y={By + 6} fill="var(--ink)" fontSize="18" textAnchor="end" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x={Cx + 8} y={Cy + 6} fill="var(--ink)" fontSize="18" textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
            <text x={Dx} y={Dy + 18} fill="var(--ink)" fontSize="18" textAnchor="middle" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>D</text>
            <text x={Ex + 10} y={Ey + 4} fill="var(--ink)" fontSize="18" textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>E</text>
            <text x={Fx - 10} y={Fy + 2} fill="var(--ink)" fontSize="18" textAnchor="end" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>F</text>
          </svg>
        </div>
      );
    }

    // ─── NSHN 2026-27 ──────────────────────────────────────────────────────
    // Bài 8: lưới 3×4, ô N tại (hàng 1, cột 2) và ô S tại (hàng 2, cột 4)
    case "nshn-2026-c8": {
      const cell = 44;
      const W = cell * 4;
      const H = cell * 3;
      const pad = 16;
      const cells: { r: number; c: number; label: string }[] = [
        { r: 0, c: 1, label: "N" },
        { r: 1, c: 3, label: "S" },
      ];
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "240px" }}>
          <svg viewBox={`0 0 ${W + pad * 2} ${H + pad * 2}`} width="100%" style={{ display: "block", height: "auto" }}>
            <g transform={`translate(${pad}, ${pad})`}>
              {/* Cells outline */}
              <rect x={0} y={0} width={W} height={H} fill="none" stroke="var(--ink)" strokeWidth="1.6" />
              {/* Vertical grid lines */}
              {[1, 2, 3].map((i) => (
                <line key={`v${i}`} x1={i * cell} y1={0} x2={i * cell} y2={H} stroke="var(--ink)" strokeWidth="1.2" />
              ))}
              {/* Horizontal grid lines */}
              {[1, 2].map((i) => (
                <line key={`h${i}`} x1={0} y1={i * cell} x2={W} y2={i * cell} stroke="var(--ink)" strokeWidth="1.2" />
              ))}
              {/* Labels N and S */}
              {cells.map(({ r, c, label }) => (
                <text
                  key={label}
                  x={c * cell + cell / 2}
                  y={r * cell + cell / 2 + 6}
                  fill="var(--ink)"
                  fontSize="20"
                  textAnchor="middle"
                  style={{ fontFamily: "Times, serif" }}
                >
                  {label}
                </text>
              ))}
            </g>
          </svg>
        </div>
      );
    }

    // Bài 9: hình vuông ABCD (trái) + hình vuông DEGF (xoay 45°) ghép tại D
    case "nshn-2026-c9": {
      // Math coords (SVG y-down): cạnh hình vuông = 60px
      const s = 60;
      // ABCD square (trái): A(0,0) D(s,0) B(0,s) C(s,s)
      const A = { x: 0, y: 0 };
      const D = { x: s, y: 0 };
      const B = { x: 0, y: s };
      const C = { x: s, y: s };
      // E: trên đường thẳng BC kéo dài, CE = BC = s. E = C + (s, 0) = (2s, s)
      const E = { x: 2 * s, y: s };
      // DE vector = E - D = (s, s). G = E + perp(DE) where perp is (s, -s) rotates DE 90° CW in SVG
      // (rotate (x,y) by -90°: (y, -x) → for (s, s) → (s, -s))
      const G = { x: E.x + s, y: E.y - s }; // (3s, 0)
      const F = { x: D.x + s, y: D.y - s }; // (2s, -s)
      const pad = 30;
      const minX = Math.min(A.x, F.x) - pad;
      const minY = Math.min(F.y, A.y) - pad;
      const maxX = G.x + pad;
      const maxY = C.y + pad;
      const w = maxX - minX;
      const h = maxY - minY;
      const off = (p: { x: number; y: number }) => ({ x: p.x - minX, y: p.y - minY });
      const a = off(A), b = off(B), c = off(C), d = off(D), e = off(E), f = off(F), g = off(G);
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "360px" }}>
          <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block", height: "auto" }}>
            {/* Hình vuông ABCD (trái) */}
            <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill="none" stroke="var(--ink)" strokeWidth="1.6" />
            {/* Hình vuông DEGF (phải, xoay 45°): D-E-G-F */}
            <polygon points={`${d.x},${d.y} ${e.x},${e.y} ${g.x},${g.y} ${f.x},${f.y}`} fill="none" stroke="var(--ink)" strokeWidth="1.6" />
            {/* Đường chéo của hình vuông DEGF (D-G và E-F) */}
            <line x1={d.x} y1={d.y} x2={g.x} y2={g.y} stroke="var(--ink)" strokeWidth="1.2" />
            <line x1={e.x} y1={e.y} x2={f.x} y2={f.y} stroke="var(--ink)" strokeWidth="1.2" />
            {/* BC kéo dài tới E và đoạn nối F-C theo đề bài */}
            <line x1={c.x} y1={c.y} x2={e.x} y2={e.y} stroke="var(--ink)" strokeWidth="1.2" />
            <line x1={f.x} y1={f.y} x2={c.x} y2={c.y} stroke="var(--ink)" strokeWidth="1.2" />
            {/* Vertices */}
            {[a, b, c, d, e, f, g].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.2} fill="orange" stroke="orange" />
            ))}
            {/* Labels */}
            <text x={a.x - 6} y={a.y - 4} fill="var(--ink)" fontSize="16" textAnchor="end" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
            <text x={d.x} y={d.y - 6} fill="var(--ink)" fontSize="16" textAnchor="middle" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>D</text>
            <text x={b.x - 6} y={b.y + 14} fill="var(--ink)" fontSize="16" textAnchor="end" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x={c.x - 4} y={c.y + 14} fill="var(--ink)" fontSize="16" textAnchor="end" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
            <text x={e.x + 4} y={e.y + 14} fill="var(--ink)" fontSize="16" textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>E</text>
            <text x={f.x} y={f.y - 6} fill="var(--ink)" fontSize="16" textAnchor="middle" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>F</text>
            <text x={g.x + 6} y={g.y + 4} fill="var(--ink)" fontSize="16" textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>G</text>
          </svg>
        </div>
      );
    }

    // Tự luận Bài 2: hình thang ABCD (AB đáy nhỏ, CD đáy lớn), chéo AC ∩ BD = O
    case "nshn-2026-b2": {
      // Real proportions: AB=30, CD=50, h=60 — scale 5
      const A = { x: 100, y: 30 };
      const B = { x: 250, y: 30 };
      const D = { x: 50, y: 330 };
      const C = { x: 300, y: 330 };
      // O = intersection of AC and BD
      // AC: t=3/8 from A → O = (100 + (300-100)*3/8, 30 + (330-30)*3/8) = (175, 142.5)
      const O = { x: 175, y: 142.5 };
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 350 380" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Trapezoid ABCD */}
            <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`} fill="none" stroke="var(--ink)" strokeWidth="1.6" />
            {/* Diagonals AC and BD */}
            <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} stroke="var(--ink)" strokeWidth="1.2" />
            <line x1={B.x} y1={B.y} x2={D.x} y2={D.y} stroke="var(--ink)" strokeWidth="1.2" />
            {/* Vertices */}
            {[A, B, C, D, O].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="orange" stroke="orange" />
            ))}
            {/* Labels */}
            <text x={A.x - 8} y={A.y - 4} fill="var(--ink)" fontSize="18" textAnchor="end" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
            <text x={B.x + 8} y={B.y - 4} fill="var(--ink)" fontSize="18" textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x={D.x - 8} y={D.y + 18} fill="var(--ink)" fontSize="18" textAnchor="end" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>D</text>
            <text x={C.x + 8} y={C.y + 18} fill="var(--ink)" fontSize="18" textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
            <text x={O.x + 8} y={O.y + 6} fill="var(--ink)" fontSize="18" textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>O</text>
          </svg>
        </div>
      );
    }

    // ─── NSHN 2025-26 ──────────────────────────────────────────────────────
    case "nshn-2025-c2": {
      // Phần tô đậm = vành khăn giữa hai đường tròn đồng tâm.
      // Đường tròn lớn d=10cm (r=5), bé d=7cm (r=3,5). Scale ×10 → R=50, r=35.
      // Annulus dùng path fillRule="evenodd" để lỗ ở giữa trong suốt (an toàn dark mode).
      return (
        <div className="q-figure-wrapper" style={{ margin: "12px 0", maxWidth: "160px" }}>
          <svg viewBox="0 0 120 120" width="100%" style={{ display: "block", height: "auto" }}>
            <path
              d="M 10,60 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0 Z M 25,60 a 35,35 0 1,0 70,0 a 35,35 0 1,0 -70,0 Z"
              fillRule="evenodd"
              fill="orange"
              stroke="var(--ink)"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      );
    }

    case "nshn-2025-c6": {
      // Tam giác ABC; M trung điểm AB, N trung điểm AC; nối M–C và N–B cắt nhau tại O.
      const A = { x: 150, y: 30 };
      const B = { x: 40, y: 250 };
      const C = { x: 320, y: 250 };
      const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }; // (95,140)
      const N = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 }; // (235,140)
      // Giao điểm MC ∩ NB: do đối xứng tham số t = s = 1/3 → O = (170, 176.7)
      const O = { x: 170, y: 176.7 };
      return (
        <div className="q-figure-wrapper" style={{ margin: "12px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 360 290" width="100%" style={{ display: "block", height: "auto" }}>
            <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="none" stroke="var(--ink)" strokeWidth="1.6" />
            <line x1={M.x} y1={M.y} x2={C.x} y2={C.y} stroke="var(--ink)" strokeWidth="1.2" />
            <line x1={N.x} y1={N.y} x2={B.x} y2={B.y} stroke="var(--ink)" strokeWidth="1.2" />
            {[A, B, C, M, N, O].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="orange" stroke="orange" />
            ))}
            <text x={A.x} y={A.y - 8} fill="var(--ink)" fontSize="18" textAnchor="middle" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>A</text>
            <text x={B.x - 8} y={B.y + 16} fill="var(--ink)" fontSize="18" textAnchor="end" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x={C.x + 8} y={C.y + 16} fill="var(--ink)" fontSize="18" textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
            <text x={M.x - 12} y={M.y - 2} fill="var(--ink)" fontSize="18" textAnchor="end" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>M</text>
            <text x={N.x + 12} y={N.y - 2} fill="var(--ink)" fontSize="18" textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>N</text>
            <text x={O.x + 6} y={O.y + 18} fill="var(--ink)" fontSize="18" textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>O</text>
          </svg>
        </div>
      );
    }

    case "nshn-2025-b3": {
      // Tam giác đều cạnh 4 đơn vị, chia thành 16 tam giác con (hàng 1,3,5,7).
      // Vẽ toàn bộ 10 tam giác con HƯỚNG LÊN → phủ hết mọi cạnh của lưới.
      const unit = 60;
      const rowH = 52; // ≈ unit·√3/2
      const cx = 150;
      const topY = 20;
      const pt = (i: number, j: number) => ({
        x: cx + (j - i / 2) * unit,
        y: topY + i * rowH,
      });
      const upTriangles: React.ReactElement[] = [];
      for (let i = 0; i < 4; i++) {
        for (let k = 0; k <= i; k++) {
          const top = pt(i, k);
          const bl = pt(i + 1, k);
          const br = pt(i + 1, k + 1);
          upTriangles.push(
            <polygon
              key={`${i}-${k}`}
              points={`${top.x},${top.y} ${bl.x},${bl.y} ${br.x},${br.y}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.4"
            />
          );
        }
      }
      // Nhãn "1 cm" dưới cạnh đơn vị dưới-trái: từ (30,228) đến (90,228).
      const aL = pt(4, 0); // (30,228)
      const aR = pt(4, 1); // (90,228)
      const ay = aL.y + 22;
      return (
        <div className="q-figure-wrapper" style={{ margin: "12px 0", maxWidth: "300px" }}>
          <svg viewBox="0 0 300 280" width="100%" style={{ display: "block", height: "auto" }}>
            {upTriangles}
            <line x1={aL.x} y1={ay} x2={aR.x} y2={ay} stroke="var(--ink)" strokeWidth="1" />
            <line x1={aL.x} y1={ay - 4} x2={aL.x} y2={ay + 4} stroke="var(--ink)" strokeWidth="1" />
            <line x1={aR.x} y1={ay - 4} x2={aR.x} y2={ay + 4} stroke="var(--ink)" strokeWidth="1" />
            <text x={(aL.x + aR.x) / 2} y={ay + 18} fill="var(--ink)" fontSize="14" textAnchor="middle" style={{ fontFamily: "Times, serif" }}>1 cm</text>
          </svg>
        </div>
      );
    }

    case "nshn-2020-c7": {
      // Hình vuông cam cạnh 21cm + 2 nửa đường tròn đường kính bằng cạnh (21cm).
      // B là tâm nửa đường tròn trên (bụng lên), C là tâm nửa đường tròn dưới
      // (bụng xuống). Hai nửa ghép lại thành một hình tròn bán kính 10,5cm.
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: "200px" }}>
          <svg viewBox="0 0 200 230" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Nửa đường tròn trên (tâm B) */}
            <path d="M 50,60 A 50,50 0 0 1 150,60" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Nửa đường tròn dưới (tâm C) */}
            <path d="M 50,160 A 50,50 0 0 0 150,160" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Hình vuông màu cam */}
            <rect x="50" y="60" width="100" height="100" fill="orange" stroke="var(--ink)" strokeWidth="1.5" />
            {/* Tâm B và C */}
            <circle cx="100" cy="60" r="3" fill="var(--ink)" />
            <circle cx="100" cy="160" r="3" fill="var(--ink)" />
            <text x="100" y="78" textAnchor="middle" fill="var(--ink)" fontSize="13" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>B</text>
            <text x="100" y="150" textAnchor="middle" fill="var(--ink)" fontSize="13" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>C</text>
            {/* Nhãn cạnh 21cm */}
            <text x="156" y="114" fill="var(--ink)" fontSize="11" style={{ fontFamily: "Times, serif" }}>21cm</text>
          </svg>
        </div>
      );
    }

    case "nshn-2021-c5": {
      // 8×8 chessboard. Convention from the PDF: bottom-left square (col 1, row 1)
      // is WHITE; squares alternate. Knight "M" sits at column 2 from left, row 2
      // from bottom — which is also a white square (same diagonal parity).
      const N = 8;
      const cell = 40;
      const W = N * cell;
      // Position in 1-indexed (col from left, row from bottom):
      const mColFromLeft = 2;
      const mRowFromBottom = 2;
      // Convert to (r, c) where r is 0-indexed from top:
      const mC = mColFromLeft - 1;
      const mR = N - mRowFromBottom;
      const squares: React.ReactElement[] = [];
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          // Bottom-left = (r=N-1, c=0). Want it WHITE. So dark when (r+c) odd
          // makes (N-1, 0) parity = (N-1) odd? For N=8: r=7, c=0 → sum 7 → odd → dark.
          // We want bottom-left WHITE, so flip: dark when (r + c) is EVEN.
          const isDark = (r + c) % 2 === 0;
          squares.push(
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill={isDark ? "var(--ink)" : "white"}
              stroke="var(--ink)"
              strokeWidth={0.5}
            />
          );
        }
      }
      // M centred inside square (mR, mC).
      const mx = (mC + 0.5) * cell;
      const my = (mR + 0.5) * cell + 9;
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 380 }}>
          <svg viewBox={`-2 -2 ${W + 4} ${W + 4}`} width="100%" style={{ display: "block", height: "auto" }}>
            {squares}
            <text
              x={mx}
              y={my}
              fill="var(--ink)"
              fontSize={26}
              textAnchor="middle"
              style={{ fontStyle: "italic", fontFamily: "Times, serif", fontWeight: "bold" }}
            >
              M
            </text>
          </svg>
        </div>
      );
    }

    case "nshn-2021-c9": {
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 360 }}>
          <img
            src="/figures/nshn-2021-c9.png"
            alt="Hình lập phương ghép — Bài 9 NSHN 2021"
            style={{ maxWidth: "100%", width: "100%", height: "auto", display: "block" }}
          />
        </div>
      );
    }

    case "nshn-2021-c10": {
      // 3 honeycomb shapes: hình thứ 1 (1 lục giác), hình thứ 2 (7), hình thứ 3 (19).
      // Pointy-top hexagons in honeycomb tiling.
      const R = 14; // radius
      const w = Math.sqrt(3) * R; // horizontal spacing
      const h = 1.5 * R; // vertical spacing
      // Honeycomb hexagon (pointy-top). Points relative to centre (cx, cy).
      const hexPoints = (cx: number, cy: number) =>
        [0, 1, 2, 3, 4, 5]
          .map((i) => {
            const a = (Math.PI / 3) * i - Math.PI / 2;
            return `${(cx + R * Math.cos(a)).toFixed(2)},${(cy + R * Math.sin(a)).toFixed(2)}`;
          })
          .join(" ");

      // Centres of a hexagonal pattern of "rings" (rings = 0..n-1).
      // rings=1 → 1 hex; rings=2 → 7; rings=3 → 19.
      const ringCenters = (rings: number): Array<[number, number]> => {
        const out: Array<[number, number]> = [[0, 0]];
        for (let k = 1; k < rings; k++) {
          let q = k, r = 0;
          const dirs: Array<[number, number]> = [[-1, 1], [-1, 0], [0, -1], [1, -1], [1, 0], [0, 1]];
          for (let d = 0; d < 6; d++) {
            for (let step = 0; step < k; step++) {
              out.push([q, r]);
              q += dirs[d][0];
              r += dirs[d][1];
            }
          }
        }
        return out;
      };
      const drawCluster = (rings: number, ox: number) => {
        const centers = ringCenters(rings);
        return centers.map(([q, r], i) => {
          const cx = ox + w * (q + r / 2);
          const cy = h * r;
          return (
            <polygon
              key={`r${rings}-${i}`}
              points={hexPoints(cx, cy)}
              fill="#FFD83C"
              stroke="var(--ink)"
              strokeWidth={1.2}
            />
          );
        });
      };

      const oxA = 80;
      const oxB = 200;
      const oxC = 360;
      const W2 = 480;
      const H2 = 200;
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 540 }}>
          <svg viewBox={`0 -${H2 / 2} ${W2} ${H2}`} width="100%" style={{ display: "block", height: "auto" }}>
            {drawCluster(1, oxA)}
            {drawCluster(2, oxB)}
            {drawCluster(3, oxC)}
            <text x={oxA} y={H2 / 2 - 10} fill="var(--ink)" fontSize={13} textAnchor="middle">Hình 1</text>
            <text x={oxB} y={H2 / 2 - 10} fill="var(--ink)" fontSize={13} textAnchor="middle">Hình 2</text>
            <text x={oxC} y={H2 / 2 - 10} fill="var(--ink)" fontSize={13} textAnchor="middle">Hình 3</text>
          </svg>
        </div>
      );
    }

    case "nshn-2022-c7": {
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 320 }}>
          <img
            src="/figures/nshn-2022-c7.png"
            alt="Tam giác đều 36 ô — Bài 7 NSHN 2022"
            style={{ maxWidth: "100%", width: "100%", height: "auto", display: "block" }}
          />
        </div>
      );
    }

    case "nshn-2022-c9": {
      // Right triangle ABC, right angle at A; AB=6, AC=8, BC=10.
      // B at bottom-left, C at bottom-right, A above (same side as all 3 semicircles).
      // Math coords (y-up): B=(0,0), C=(10,0), A=(3.6, 4.8). Verify: AB=√(3.6²+4.8²)=6 ✓.
      // All 3 semicircles bulge UP (positive math y, smaller SVG y) — same side as A.
      const Bx = 0, By = 0;
      const Cx = 10, Cy = 0;
      const Ax = 3.6, Ay = 4.8;
      const scale = 30; // px per math unit
      const ox = 30;   // SVG x-offset
      const oy = 210;  // SVG y-offset for math y=0
      const sx = (x: number) => ox + x * scale;
      const sy = (y: number) => oy - y * scale;
      // Polygon approximation of a semicircle. start/end in math coords (y-up);
      // upPos = +1 picks the bulge direction with positive component along upward (math y+).
      // For our figure all semicircles bulge "upward" relative to BC line (math y+).
      const semiPoints = (sX: number, sY: number, eX: number, eY: number, n = 48): string => {
        const mx = (sX + eX) / 2;
        const my = (sY + eY) / 2;
        const dx = eX - sX;
        const dy = eY - sY;
        const len = Math.hypot(dx, dy);
        const r = len / 2;
        // Unit chord direction
        const ux = dx / len;
        const uy = dy / len;
        // Two candidate perpendiculars in math: (-uy, ux) and (uy, -ux).
        // Pick the one with positive y-component (so bulge goes "up" in math).
        const p1y = ux;
        const ny = p1y >= 0 ? 1 : -1;
        const px = -uy * ny;
        const py = ux * ny;
        // Parametric semicircle: start at sX,sY (t=π), through top at mid + r*perp (t=π/2), end at eX,eY (t=0).
        const out: string[] = [];
        for (let i = 0; i <= n; i++) {
          const t = Math.PI * (1 - i / n); // π → 0
          const mxC = mx + r * Math.cos(t) * ux + r * Math.sin(t) * px;
          const myC = my + r * Math.cos(t) * uy + r * Math.sin(t) * py;
          // Actually: starting at sX,sY when t=π (cos=-1, sin=0): mid - r*ux + 0 = sX. ✓
          // At t=0 (cos=1, sin=0): mid + r*ux + 0 = eX. ✓
          // At t=π/2: mid + r*perp (bulge direction). ✓
          out.push(`${sx(mxC).toFixed(2)},${sy(myC).toFixed(2)}`);
        }
        return out.join(" ");
      };
      const triPoints = `${sx(Bx)},${sy(By)} ${sx(Cx)},${sy(Cy)} ${sx(Ax)},${sy(Ay)}`;
      const lune = "#FFB732"; // yellow-orange lune fill
      const arcStroke = "var(--ink)";
      // Midpoints for "1" / "2" labels on sides AB and AC (slightly offset toward interior).
      const ab_mx = (Ax + Bx) / 2;
      const ab_my = (Ay + By) / 2;
      const ac_mx = (Ax + Cx) / 2;
      const ac_my = (Ay + Cy) / 2;
      // Offsets pushing labels toward the triangle interior (slightly toward centroid).
      const cx0 = (Ax + Bx + Cx) / 3;
      const cy0 = (Ay + By + Cy) / 3;
      const ab_lx = ab_mx + 0.55 * (cx0 - ab_mx);
      const ab_ly = ab_my + 0.55 * (cy0 - ab_my);
      const ac_lx = ac_mx + 0.55 * (cx0 - ac_mx);
      const ac_ly = ac_my + 0.55 * (cy0 - ac_my);
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 420 }}>
          <svg viewBox="0 0 380 250" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Step 1: fill AB and AC semicircles in yellow (these are wholly above BC and
                form the union with the triangle that hosts the lunes). */}
            <polygon
              points={semiPoints(Bx, By, Ax, Ay)}
              fill={lune}
              stroke="none"
            />
            <polygon
              points={semiPoints(Ax, Ay, Cx, Cy)}
              fill={lune}
              stroke="none"
            />
            {/* Step 2: white-fill the BC semicircle to "subtract" its area, leaving only
                the lune regions yellow (parts of AB / AC semicircles outside BC semicircle). */}
            <polygon
              points={semiPoints(Bx, By, Cx, Cy)}
              fill="white"
              stroke="none"
            />
            {/* Step 3: also white-fill the triangle so its interior is white (lunes only). */}
            <polygon points={triPoints} fill="white" stroke="none" />
            {/* Step 4: draw the 3 semicircle arc OUTLINES (as polylines — only the curved part,
                not the diameter) on top, so the boundary is visible. */}
            <polyline points={semiPoints(Bx, By, Ax, Ay)} fill="none" stroke={arcStroke} strokeWidth={1.5} />
            <polyline points={semiPoints(Ax, Ay, Cx, Cy)} fill="none" stroke={arcStroke} strokeWidth={1.5} />
            <polyline points={semiPoints(Bx, By, Cx, Cy)} fill="none" stroke={arcStroke} strokeWidth={1.5} />
            {/* Step 5: draw the triangle sides on top. */}
            <polygon points={triPoints} fill="none" stroke="var(--ink)" strokeWidth={1.8} />
            {/* Step 6: side labels "1" (on AB) and "2" (on AC), as in the PDF. */}
            <text x={sx(ab_lx)} y={sy(ab_ly) + 5} fill="var(--ink)" fontSize={14} textAnchor="middle" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>1</text>
            <text x={sx(ac_lx)} y={sy(ac_ly) + 5} fill="var(--ink)" fontSize={14} textAnchor="middle" style={{ fontStyle: "italic", fontFamily: "Times, serif" }}>2</text>
            {/* Step 7: vertex dots and vertex labels. */}
            <circle cx={sx(Ax)} cy={sy(Ay)} r={4} fill="orange" stroke="orange" />
            <circle cx={sx(Bx)} cy={sy(By)} r={4} fill="orange" stroke="orange" />
            <circle cx={sx(Cx)} cy={sy(Cy)} r={4} fill="orange" stroke="orange" />
            <text x={sx(Ax)} y={sy(Ay) - 10} fill="var(--ink)" fontSize={16} textAnchor="middle" style={{ fontStyle: "italic", fontFamily: "Times, serif", fontWeight: "bold" }}>A</text>
            <text x={sx(Bx) - 10} y={sy(By) + 18} fill="var(--ink)" fontSize={16} textAnchor="end" style={{ fontStyle: "italic", fontFamily: "Times, serif", fontWeight: "bold" }}>B</text>
            <text x={sx(Cx) + 10} y={sy(Cy) + 18} fill="var(--ink)" fontSize={16} textAnchor="start" style={{ fontStyle: "italic", fontFamily: "Times, serif", fontWeight: "bold" }}>C</text>
          </svg>
        </div>
      );
    }

    // NSHM 2026 Câu 6 — khu đất hình chữ L theo nguồn PDF:
    //   Khối dưới (đáy): 10 cm × 10 cm (vuông, có đáy 10 cm).
    //   Khối trên       : 7 cm × 8 cm (rộng 10-3, cao 8), nằm trên khối dưới
    //                     và căn lề PHẢI → bậc 3 cm ở phía trái lộ ra mặt
    //                     trên của khối dưới.
    //   Bounding box    : 10 cm × 18 cm → chu vi L-shape = 2(10+18) = 56 cm.
    //   Đường nét đứt   : ranh giới giữa khối trên và phần lộ của khối dưới
    //                     (đỉnh khối dưới, ẩn dưới khối trên ở 7 cm bên phải).
    case "nshm-2026-c6": {
      // Scale: 1 cm = 20 px. Bounding box 10 × 18 cm = 200 × 360 px.
      const pad = 36;
      const W = 200;
      const H = 360;
      const lowerH = 200; // 10 cm
      const upperH = 160; // 8 cm
      const stepW = 60;   // 3 cm (visible top of lower, on the LEFT)
      const upperW = W - stepW; // 7 cm (right-aligned)
      // L-shape outline (clockwise from upper-LEFT corner of UPPER rect):
      //   (stepW, 0) → (W, 0)          top of upper        : 7 cm
      //   (W, 0)     → (W, H)          right side (full)   : 10 + 8 = 18 cm
      //   (W, H)     → (0, H)          bottom              : 10 cm
      //   (0, H)     → (0, upperH)     left of lower       : 10 cm
      //   (0, upperH)→ (stepW, upperH) step (top of lower) : 3 cm
      //   (stepW, upperH) → (stepW, 0) left of upper       : 8 cm
      const points = [
        [stepW, 0],
        [W, 0],
        [W, H],
        [0, H],
        [0, upperH],
        [stepW, upperH],
      ]
        .map(([x, y]) => `${x + pad},${y + pad}`)
        .join(" ");
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 260 }}>
          <svg
            viewBox={`0 0 ${W + 2 * pad} ${H + 2 * pad + 14}`}
            width="100%"
            style={{ display: "block", height: "auto" }}
          >
            {/* L-shape outline */}
            <polygon points={points} fill="none" stroke="var(--ink)" strokeWidth={1.6} />
            {/* Dashed boundary line between upper rect and the hidden top of
                lower rect (covered by upper). Shows the "interior" step like
                the PDF does. */}
            <line
              x1={pad + stepW}
              y1={pad + upperH}
              x2={pad + W}
              y2={pad + upperH}
              stroke="var(--ink)"
              strokeWidth={1}
              strokeDasharray="6 4"
              opacity={0.85}
            />
            {/* Label: 10 cm (bottom width) — with simple curly-bracket */}
            <path
              d={`M ${pad + 4} ${pad + H + 14}
                  Q ${pad + W / 2} ${pad + H + 28} ${pad + W - 4} ${pad + H + 14}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={0.9}
            />
            <text
              x={pad + W / 2}
              y={pad + H + 38}
              fill="var(--ink)"
              fontSize={15}
              textAnchor="middle"
              style={{ fontFamily: "Times, serif" }}
            >
              10 cm
            </text>
            {/* Label: 8 cm (right side of UPPER rect only) — bracket on right */}
            <path
              d={`M ${pad + W + 8} ${pad + 2}
                  Q ${pad + W + 20} ${pad + upperH / 2} ${pad + W + 8} ${pad + upperH - 2}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={0.9}
            />
            <text
              x={pad + W + 26}
              y={pad + upperH / 2 + 5}
              fill="var(--ink)"
              fontSize={15}
              textAnchor="start"
              style={{ fontFamily: "Times, serif" }}
            >
              8 cm
            </text>
            {/* Label: 3 cm (step on the left) — bracket above the step */}
            <path
              d={`M ${pad + 1} ${pad + upperH - 6}
                  Q ${pad + stepW / 2} ${pad + upperH - 18} ${pad + stepW - 1} ${pad + upperH - 6}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={0.9}
            />
            <text
              x={pad + stepW / 2}
              y={pad + upperH - 24}
              fill="var(--ink)"
              fontSize={14}
              textAnchor="middle"
              style={{ fontFamily: "Times, serif" }}
            >
              3 cm
            </text>
          </svg>
        </div>
      );
    }

    // NSHM 2026 Câu 9 — dãy "Hình 1..4" với quy luật ô xám:
    //   Một ô (r, c) trong lưới N×N được tô XÁM nếu nằm trên một trong hai
    //   đường chéo: r == c (chéo chính) hoặc r == N-1-c (chéo phụ).
    //   Vùng trắng = các ô còn lại, hợp thành phần "phần màu trắng" mà
    //   bài toán yêu cầu tính chu vi cho Hình 16 (17×17).
    //   Sizes: Hình 1 → 2×2 (cả 4 ô xám), Hình 2 → 3×3, Hình 3 → 4×4,
    //          Hình 4 → 5×5 (X-pattern).
    case "nshm-2026-c9": {
      const sizes = [2, 3, 4, 5];
      const cell = 16;
      const gap = 28;
      const labelH = 22;
      const padX = 10;
      const padTop = 10;
      const W =
        sizes.reduce((acc, n) => acc + n * cell, 0) +
        gap * (sizes.length - 1) +
        padX * 2;
      const maxH = Math.max(...sizes) * cell;
      const H = padTop + maxH + labelH + 6;

      let xCursor = padX;
      const grids: React.ReactElement[] = [];
      sizes.forEach((n, idx) => {
        const gridW = n * cell;
        const y0 = padTop + (maxH - gridW); // align all grids at bottom
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const onDiag = r === c || r === n - 1 - c;
            grids.push(
              <rect
                key={`g${idx}-${r}-${c}`}
                x={xCursor + c * cell}
                y={y0 + r * cell}
                width={cell}
                height={cell}
                fill={onDiag ? "#bdbdbd" : "white"}
                stroke="var(--ink)"
                strokeWidth={0.9}
              />
            );
          }
        }
        grids.push(
          <text
            key={`l${idx}`}
            x={xCursor + gridW / 2}
            y={padTop + maxH + labelH - 4}
            fill="var(--ink)"
            fontSize={12}
            textAnchor="middle"
            style={{ fontFamily: "Times, serif", fontStyle: "italic" }}
          >
            {`Hình ${idx + 1}`}
          </text>
        );
        xCursor += gridW + gap;
      });

      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 460 }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", height: "auto" }}>
            {grids}
          </svg>
        </div>
      );
    }

    // NSHM 2026 Bài 2 — hình vuông ABCD, E ∈ AB, F ∈ DC, chia thành 4 phần
    // S1 (△ADE), S2 (△DEF), S3 (△EFB), S4 (△FBC).
    case "nshm-2026-b2": {
      // Square 10 dm × 10 dm. Use 280×280 with margin.
      const pad = 30;
      const S = 280;
      const A = { x: pad, y: pad };
      const B = { x: pad + S, y: pad };
      const C = { x: pad + S, y: pad + S };
      const D = { x: pad, y: pad + S };
      // E on AB — placed so the diagram looks balanced (closer to A).
      const E = { x: pad + S * 0.38, y: pad };
      // F on DC — DF = 6.6, DC = 10 → F at 66% along DC (from D toward C).
      const F = { x: pad + S * 0.66, y: pad + S };
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 340 }}>
          <svg
            viewBox={`0 0 ${S + 2 * pad} ${S + 2 * pad}`}
            width="100%"
            style={{ display: "block", height: "auto" }}
          >
            {/* Square ABCD */}
            <polygon
              points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={1.6}
            />
            {/* Internal segments: DE, EF, FB */}
            <line x1={D.x} y1={D.y} x2={E.x} y2={E.y} stroke="var(--ink)" strokeWidth={1.4} />
            <line x1={E.x} y1={E.y} x2={F.x} y2={F.y} stroke="var(--ink)" strokeWidth={1.4} />
            <line x1={F.x} y1={F.y} x2={B.x} y2={B.y} stroke="var(--ink)" strokeWidth={1.4} />
            {/* Region labels — placed at centroids of the 4 triangles */}
            <text
              x={(A.x + D.x + E.x) / 3}
              y={(A.y + D.y + E.y) / 3 + 6}
              fill="var(--ink)"
              fontSize={16}
              textAnchor="middle"
              style={labelStyle}
            >
              S<tspan baselineShift="sub" fontSize={11}>1</tspan>
            </text>
            <text
              x={(D.x + E.x + F.x) / 3}
              y={(D.y + E.y + F.y) / 3 + 6}
              fill="var(--ink)"
              fontSize={16}
              textAnchor="middle"
              style={labelStyle}
            >
              S<tspan baselineShift="sub" fontSize={11}>2</tspan>
            </text>
            <text
              x={(E.x + F.x + B.x) / 3}
              y={(E.y + F.y + B.y) / 3 + 6}
              fill="var(--ink)"
              fontSize={16}
              textAnchor="middle"
              style={labelStyle}
            >
              S<tspan baselineShift="sub" fontSize={11}>3</tspan>
            </text>
            <text
              x={(F.x + B.x + C.x) / 3}
              y={(F.y + B.y + C.y) / 3 + 6}
              fill="var(--ink)"
              fontSize={16}
              textAnchor="middle"
              style={labelStyle}
            >
              S<tspan baselineShift="sub" fontSize={11}>4</tspan>
            </text>
            {/* Vertex dots */}
            {[A, B, C, D, E, F].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="orange" stroke="orange" />
            ))}
            {/* Vertex labels */}
            <text x={A.x - 6} y={A.y - 6} fill="var(--ink)" fontSize={16} textAnchor="end" style={labelStyle}>A</text>
            <text x={E.x} y={E.y - 6} fill="var(--ink)" fontSize={16} textAnchor="middle" style={labelStyle}>E</text>
            <text x={B.x + 6} y={B.y - 6} fill="var(--ink)" fontSize={16} textAnchor="start" style={labelStyle}>B</text>
            <text x={D.x - 6} y={D.y + 16} fill="var(--ink)" fontSize={16} textAnchor="end" style={labelStyle}>D</text>
            <text x={F.x} y={F.y + 18} fill="var(--ink)" fontSize={16} textAnchor="middle" style={labelStyle}>F</text>
            <text x={C.x + 6} y={C.y + 16} fill="var(--ink)" fontSize={16} textAnchor="start" style={labelStyle}>C</text>
          </svg>
        </div>
      );
    }

    case "nshm-2024-c10": {
      // Complex shaded-circle composition (large circle + 4 inner circles, green
      // petal/lens regions). Faithfully reproduced from the source scan via PNG.
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 240 }}>
          <img
            src="/figures/nshm-2024-c10.png"
            alt="Hình tròn lớn và các hình tròn nhỏ với phần tô đậm — Câu 10 NSHM 2024"
            style={{ maxWidth: "100%", width: "100%", height: "auto", display: "block" }}
          />
        </div>
      );
    }

    case "nshm-2024-c12": {
      // Trapezoid ABCD: AB (top) = đáy bé 12, DC (bottom) = đáy lớn 15, height = 6.
      // Diagonal AC drawn; M on AC with AM = 1/3·AC; segment DM drawn (→ triangle MCD).
      // SVG coords (y-down). Scale chosen so the figure sits in a 340×230 box.
      const A = { x: 65, y: 67 };
      const B = { x: 281, y: 67 };
      const C = { x: 305, y: 175 };
      const D = { x: 35, y: 175 };
      // M = A + 1/3·(C - A)
      const M = { x: A.x + (C.x - A.x) / 3, y: A.y + (C.y - A.y) / 3 };
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 340 }}>
          <svg viewBox="0 0 340 230" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Trapezoid ABCD */}
            <polygon
              points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={1.6}
            />
            {/* Diagonal AC */}
            <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} stroke="var(--ink)" strokeWidth={1.4} />
            {/* Segment DM */}
            <line x1={D.x} y1={D.y} x2={M.x} y2={M.y} stroke="var(--ink)" strokeWidth={1.4} />
            {/* Vertex + M dots */}
            {[A, B, C, D, M].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="orange" stroke="orange" />
            ))}
            {/* Labels */}
            <text x={A.x - 8} y={A.y - 6} fill="var(--ink)" fontSize={16} textAnchor="end" style={labelStyle}>A</text>
            <text x={B.x + 8} y={B.y - 6} fill="var(--ink)" fontSize={16} textAnchor="start" style={labelStyle}>B</text>
            <text x={C.x + 8} y={C.y + 16} fill="var(--ink)" fontSize={16} textAnchor="start" style={labelStyle}>C</text>
            <text x={D.x - 8} y={D.y + 16} fill="var(--ink)" fontSize={16} textAnchor="end" style={labelStyle}>D</text>
            <text x={M.x + 8} y={M.y - 4} fill="var(--ink)" fontSize={16} textAnchor="start" style={labelStyle}>M</text>
          </svg>
        </div>
      );
    }

    // --- AMS 2023-24 Câu 5: lưới gấp hộp lập phương (R Q M / N P) ---
    case "ams-2023-c5": {
      const cell = 54;
      const cells = [
        { x: 5, y: 5, t: "R" },
        { x: 5 + cell, y: 5, t: "Q" },
        { x: 5 + 2 * cell, y: 5, t: "M" },
        { x: 5 + 2 * cell, y: 5 + cell, t: "N" },
        { x: 5 + 3 * cell, y: 5 + cell, t: "P" },
      ];
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "300px" }}>
          <svg viewBox={`0 0 ${5 * 2 + 4 * cell} ${5 * 2 + 2 * cell}`} width="100%" style={{ display: "block", height: "auto" }}>
            {cells.map((c, i) => (
              <g key={i}>
                <rect x={c.x} y={c.y} width={cell} height={cell} fill="none" stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="4 3" />
                <text x={c.x + cell / 2} y={c.y + cell / 2 + 8} fill="orange" fontSize={26} fontWeight="bold" textAnchor="middle">{c.t}</text>
              </g>
            ))}
          </svg>
        </div>
      );
    }

    // --- AMS 2023-24 Câu 6: tờ giấy 20x15, cắt 4 góc vuông cạnh 5 ---
    case "ams-2023-c6": {
      const ox = 35, oy = 35, W = 200, H = 150, s = 50;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 300 210" width="100%" style={{ display: "block", height: "auto" }}>
            <rect x={ox} y={oy} width={W} height={H} fill="none" stroke="var(--ink)" strokeWidth={1.6} />
            {/* 4 góc bị cắt (nét đứt) */}
            {[
              { x: ox, y: oy },
              { x: ox + W - s, y: oy },
              { x: ox, y: oy + H - s },
              { x: ox + W - s, y: oy + H - s },
            ].map((c, i) => (
              <rect key={i} x={c.x} y={c.y} width={s} height={s} fill="none" stroke="var(--ink)" strokeWidth={1.2} strokeDasharray="4 3" />
            ))}
            <text x={ox + W / 2} y={oy - 12} fill="var(--ink)" fontSize={14} textAnchor="middle">20 cm</text>
            <text x={ox + W + 12} y={oy + s / 2 + 4} fill="var(--ink)" fontSize={14} textAnchor="start">5 cm</text>
            <text x={ox + W + 12} y={oy + H / 2 + 4} fill="var(--ink)" fontSize={14} textAnchor="start">15 cm</text>
          </svg>
        </div>
      );
    }

    // --- AMS 2023-24 Bài 1: hai hình vuông (6 và 4), phần tô đậm là tam giác GEH ---
    case "ams-2023-b1": {
      const s = 28, ox = 22, oy = 22;
      const P = (x: number, y: number) => ({ x: ox + x * s, y: oy + y * s });
      const A = P(0, 0), D = P(6, 0), C = P(6, 6), B = P(0, 6);
      const E = P(6, 2), F = P(10, 2), G = P(10, 6), H = P(6, 3.6);
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "360px" }}>
          <svg viewBox="0 0 340 210" width="100%" style={{ display: "block", height: "auto" }}>
            {/* hình vuông lớn */}
            <polygon points={`${A.x},${A.y} ${D.x},${D.y} ${C.x},${C.y} ${B.x},${B.y}`} fill="none" stroke="var(--ink)" strokeWidth={1.4} />
            {/* hình vuông nhỏ */}
            <polygon points={`${E.x},${E.y} ${F.x},${F.y} ${G.x},${G.y} ${C.x},${C.y}`} fill="none" stroke="var(--ink)" strokeWidth={1.4} />
            {/* tam giác tô đậm GEH */}
            <polygon points={`${G.x},${G.y} ${E.x},${E.y} ${H.x},${H.y}`} fill="orange" stroke="orange" strokeWidth={1} />
            {/* các đường nối */}
            <line x1={A.x} y1={A.y} x2={G.x} y2={G.y} stroke="var(--ink)" strokeWidth={1.2} />
            <line x1={A.x} y1={A.y} x2={E.x} y2={E.y} stroke="var(--ink)" strokeWidth={1.2} />
            <line x1={E.x} y1={E.y} x2={G.x} y2={G.y} stroke="var(--ink)" strokeWidth={1.2} />
            {[
              { p: A, t: "A", dx: -8, dy: -4, a: "end" },
              { p: D, t: "D", dx: 0, dy: -8, a: "middle" },
              { p: B, t: "B", dx: -8, dy: 16, a: "end" },
              { p: C, t: "C", dx: -4, dy: 18, a: "end" },
              { p: E, t: "E", dx: 8, dy: -4, a: "start" },
              { p: F, t: "F", dx: 8, dy: -4, a: "start" },
              { p: G, t: "G", dx: 8, dy: 14, a: "start" },
              { p: H, t: "H", dx: -8, dy: 4, a: "end" },
            ].map((l, i) => (
              <text key={i} x={l.p.x + l.dx} y={l.p.y + l.dy} fill="var(--ink)" fontSize={15} textAnchor={l.a as "start" | "middle" | "end"} style={labelStyle}>{l.t}</text>
            ))}
          </svg>
        </div>
      );
    }

    // --- AMS 2022-23 Câu 10: 4 mảnh ghép từ ô vuông cạnh 1cm ---
    case "ams-2022-c10": {
      const c = 22;
      const pieces = [
        { base: [15, 18], cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], label: "(1)", lx: 15 + 1.5 * c },
        { base: [120, 18], cells: [[0, 0], [1, 0], [2, 0], [1, 1]], label: "(2)", lx: 120 + 1.5 * c },
        { base: [232, 40], cells: [[0, 0], [1, 0], [2, 0]], label: "(3)", lx: 232 + 1.5 * c },
        { base: [318, 7], cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]], label: "(4)", lx: 318 + c },
      ];
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "400px" }}>
          <svg viewBox="0 0 390 140" width="100%" style={{ display: "block", height: "auto" }}>
            {pieces.map((pc, pi) => (
              <g key={pi}>
                {pc.cells.map(([col, row], ci) => (
                  <rect key={ci} x={pc.base[0] + col * c} y={pc.base[1] + row * c} width={c} height={c} fill="none" stroke="var(--ink)" strokeWidth={1.3} />
                ))}
                <text x={pc.lx} y={125} fill="var(--ink)" fontSize={13} textAnchor="middle">{pc.label}</text>
              </g>
            ))}
          </svg>
        </div>
      );
    }

    // --- AMS 2022-23 Câu 11: hình chữ nhật ABCD, tam giác PMQ ---
    case "ams-2022-c11": {
      const A = { x: 18, y: 18 }, B = { x: 210, y: 18 }, C = { x: 210, y: 162 }, D = { x: 18, y: 162 };
      const M = { x: 210, y: 90 }, P = { x: 88, y: 18 }, Q = { x: 140, y: 162 };
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "300px" }}>
          <svg viewBox="0 0 235 185" width="100%" style={{ display: "block", height: "auto" }}>
            <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`} fill="none" stroke="var(--ink)" strokeWidth={1.4} />
            <polygon points={`${P.x},${P.y} ${M.x},${M.y} ${Q.x},${Q.y}`} fill="orange" fillOpacity={0.18} stroke="var(--ink)" strokeWidth={1.3} />
            {[
              { p: A, t: "A", dx: -8, dy: -4, a: "end" },
              { p: B, t: "B", dx: 8, dy: -4, a: "start" },
              { p: C, t: "C", dx: 8, dy: 14, a: "start" },
              { p: D, t: "D", dx: -8, dy: 14, a: "end" },
              { p: M, t: "M", dx: 9, dy: 4, a: "start" },
              { p: P, t: "P", dx: 0, dy: -8, a: "middle" },
              { p: Q, t: "Q", dx: 0, dy: 16, a: "middle" },
            ].map((l, i) => (
              <text key={i} x={l.p.x + l.dx} y={l.p.y + l.dy} fill="var(--ink)" fontSize={15} textAnchor={l.a as "start" | "middle" | "end"} style={labelStyle}>{l.t}</text>
            ))}
          </svg>
        </div>
      );
    }

    // --- AMS 2022-23 Bài 3: hình thang ABCD, M trên AC, N trên DC (MN // BD) ---
    case "ams-2022-b3": {
      const A = { x: 50, y: 22 }, B = { x: 190, y: 22 }, C = { x: 235, y: 142 }, D = { x: 15, y: 142 };
      const M = { x: 166.7, y: 100 }, N = { x: 110, y: 142 };
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      const lines: [typeof A, typeof A][] = [
        [A, C], [B, D], [M, N], [B, N], [B, M], [D, M],
      ];
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 255 168" width="100%" style={{ display: "block", height: "auto" }}>
            <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
            {lines.map(([p, q], i) => (
              <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--ink)" strokeWidth={1.1} />
            ))}
            {[M, N].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.2} fill="orange" stroke="orange" />
            ))}
            {[
              { p: A, t: "A", dx: -6, dy: -5, a: "end" },
              { p: B, t: "B", dx: 6, dy: -5, a: "start" },
              { p: C, t: "C", dx: 8, dy: 6, a: "start" },
              { p: D, t: "D", dx: -8, dy: 6, a: "end" },
              { p: M, t: "M", dx: 9, dy: 0, a: "start" },
              { p: N, t: "N", dx: 0, dy: 16, a: "middle" },
            ].map((l, i) => (
              <text key={i} x={l.p.x + l.dx} y={l.p.y + l.dy} fill="var(--ink)" fontSize={15} textAnchor={l.a as "start" | "middle" | "end"} style={labelStyle}>{l.t}</text>
            ))}
          </svg>
        </div>
      );
    }

    // --- AMS 2020-21 Bài 2: hình chữ nhật ABCD, M trên DC, AM cắt BD tại I ---
    case "ams-2020-b2": {
      const A = { x: 20, y: 20 }, B = { x: 240, y: 20 }, C = { x: 240, y: 150 }, D = { x: 20, y: 150 };
      const M = { x: 150, y: 150 }, I = { x: 101.7, y: 101.7 };
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      return (
        <div className="q-figure-wrapper" style={{ margin: "16px 0", maxWidth: "320px" }}>
          <svg viewBox="0 0 270 175" width="100%" style={{ display: "block", height: "auto" }}>
            <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
            <line x1={A.x} y1={A.y} x2={M.x} y2={M.y} stroke="var(--ink)" strokeWidth={1.2} />
            <line x1={B.x} y1={B.y} x2={D.x} y2={D.y} stroke="var(--ink)" strokeWidth={1.2} />
            {[M, I].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.2} fill="orange" stroke="orange" />
            ))}
            {[
              { p: A, t: "A", dx: -8, dy: -4, a: "end" },
              { p: B, t: "B", dx: 8, dy: -4, a: "start" },
              { p: C, t: "C", dx: 8, dy: 14, a: "start" },
              { p: D, t: "D", dx: -8, dy: 14, a: "end" },
              { p: M, t: "M", dx: 0, dy: 16, a: "middle" },
              { p: I, t: "I", dx: 8, dy: -2, a: "start" },
            ].map((l, i) => (
              <text key={i} x={l.p.x + l.dx} y={l.p.y + l.dy} fill="var(--ink)" fontSize={15} textAnchor={l.a as "start" | "middle" | "end"} style={labelStyle}>{l.t}</text>
            ))}
          </svg>
        </div>
      );
    }

    case "arc-2022-c39": {
      // Two rectangles sharing the bottom line. Tall rectangle 3×6 (left),
      // short rectangle 6×3 (right). Green triangle A-E-D where
      // A = top-left of tall rect, E = top-left corner of short rect, D = bottom-right.
      // Math coords (cm), B=(0,0): A(0,6) B(0,0) C(3,0) D(9,0) E(3,3); scale 30px/cm.
      const s = 30;
      const ox = 45;
      const oy = 25; // svg y of math y=6 (top)
      const mx = (x: number) => ox + x * s;
      const my = (y: number) => oy + (6 - y) * s;
      const A = { x: mx(0), y: my(6) };
      const B = { x: mx(0), y: my(0) };
      const C = { x: mx(3), y: my(0) };
      const D = { x: mx(9), y: my(0) };
      const E = { x: mx(3), y: my(3) };
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 360 }}>
          <svg viewBox="0 0 360 240" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Green triangle A-E-D (the shaded region) */}
            <polygon
              points={`${A.x},${A.y} ${E.x},${E.y} ${D.x},${D.y}`}
              fill="oklch(0.78 0.19 130)"
              stroke="var(--ink)"
              strokeWidth={1.2}
            />
            {/* Tall rectangle (3 × 6): A top-left, B bottom-left, C bottom-right */}
            <rect x={A.x} y={A.y} width={3 * s} height={6 * s} fill="none" stroke="var(--ink)" strokeWidth={1.6} />
            {/* Short rectangle (6 × 3): E top-left, C bottom-left, D bottom-right */}
            <rect x={E.x} y={E.y} width={6 * s} height={3 * s} fill="none" stroke="var(--ink)" strokeWidth={1.6} />
            {/* Dimension labels */}
            <text x={A.x - 10} y={(A.y + B.y) / 2 + 5} fill="var(--ink)" fontSize={14} textAnchor="end" style={labelStyle}>6cm</text>
            <text x={(B.x + C.x) / 2} y={B.y + 18} fill="var(--ink)" fontSize={14} textAnchor="middle" style={labelStyle}>3cm</text>
            <text x={(C.x + D.x) / 2} y={D.y + 18} fill="var(--ink)" fontSize={14} textAnchor="middle" style={labelStyle}>6cm</text>
            <text x={D.x + 8} y={(D.y + my(3)) / 2 + 5} fill="var(--ink)" fontSize={14} textAnchor="start" style={labelStyle}>3cm</text>
          </svg>
        </div>
      );
    }

    case "arc-2022-c40": {
      // Quadrilateral ABCD on base AD with feet H, K of the heights from B, C.
      // Math coords (cm): A(0,0) H(3,0) K(7,0) D(12,0), B(3,5) C(7,4); scale 20px/cm.
      const s = 20;
      const ox = 30;
      const oy = 20; // svg y of math y=5 (top)
      const mx = (x: number) => ox + x * s;
      const my = (y: number) => oy + (5 - y) * s;
      const A = { x: mx(0), y: my(0) };
      const H = { x: mx(3), y: my(0) };
      const K = { x: mx(7), y: my(0) };
      const D = { x: mx(12), y: my(0) };
      const B = { x: mx(3), y: my(5) };
      const C = { x: mx(7), y: my(4) };
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      const rightAngle = (foot: { x: number; y: number }) =>
        `M ${foot.x} ${foot.y - 7} L ${foot.x + 7} ${foot.y - 7} L ${foot.x + 7} ${foot.y}`;
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 320 }}>
          <svg viewBox="0 0 310 150" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Quadrilateral ABCD */}
            <polygon
              points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={1.6}
            />
            {/* Heights BH, CK (dashed) */}
            <line x1={B.x} y1={B.y} x2={H.x} y2={H.y} stroke="var(--ink)" strokeWidth={1.2} strokeDasharray="4 3" />
            <line x1={C.x} y1={C.y} x2={K.x} y2={K.y} stroke="var(--ink)" strokeWidth={1.2} strokeDasharray="4 3" />
            {/* Right-angle marks at H and K */}
            <path d={rightAngle(H)} fill="none" stroke="var(--ink)" strokeWidth={1} />
            <path d={rightAngle(K)} fill="none" stroke="var(--ink)" strokeWidth={1} />
            {/* Vertex dots */}
            {[A, B, C, D].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.2} fill="orange" stroke="orange" />
            ))}
            {/* Vertex + foot labels */}
            <text x={A.x - 6} y={A.y + 16} fill="var(--ink)" fontSize={15} textAnchor="end" style={labelStyle}>A</text>
            <text x={B.x} y={B.y - 7} fill="var(--ink)" fontSize={15} textAnchor="middle" style={labelStyle}>B</text>
            <text x={C.x + 4} y={C.y - 7} fill="var(--ink)" fontSize={15} textAnchor="start" style={labelStyle}>C</text>
            <text x={D.x + 6} y={D.y + 16} fill="var(--ink)" fontSize={15} textAnchor="start" style={labelStyle}>D</text>
            <text x={H.x} y={H.y + 16} fill="var(--ink)" fontSize={13} textAnchor="middle" style={labelStyle}>H</text>
            <text x={K.x} y={K.y + 16} fill="var(--ink)" fontSize={13} textAnchor="middle" style={labelStyle}>K</text>
            {/* Dimension labels */}
            <text x={B.x + 5} y={(B.y + H.y) / 2} fill="var(--ink)" fontSize={13} textAnchor="start" style={labelStyle}>5cm</text>
            <text x={C.x + 5} y={(C.y + K.y) / 2} fill="var(--ink)" fontSize={13} textAnchor="start" style={labelStyle}>4cm</text>
            <text x={(A.x + H.x) / 2} y={A.y + 30} fill="var(--ink)" fontSize={13} textAnchor="middle" style={labelStyle}>3cm</text>
            <text x={(H.x + K.x) / 2} y={A.y + 30} fill="var(--ink)" fontSize={13} textAnchor="middle" style={labelStyle}>4cm</text>
            <text x={(K.x + D.x) / 2} y={A.y + 30} fill="var(--ink)" fontSize={13} textAnchor="middle" style={labelStyle}>5cm</text>
          </svg>
        </div>
      );
    }

    case "arc-2021-c8": {
      // Row of 15 squares; cell 1 = "20", cell 15 = "11", shaded cell at
      // position 11 (value 8). Pattern repeats 20, 8, 11.
      const n = 15;
      const cell = 30;
      const ox = 6;
      const oy = 8;
      const shaded = 11; // 1-based position of the tô-đậm cell
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 480 }}>
          <svg viewBox={`0 0 ${ox * 2 + n * cell} ${oy * 2 + cell}`} width="100%" style={{ display: "block", height: "auto" }}>
            {Array.from({ length: n }, (_, i) => {
              const x = ox + i * cell;
              const isShaded = i + 1 === shaded;
              return (
                <rect
                  key={i}
                  x={x}
                  y={oy}
                  width={cell}
                  height={cell}
                  fill={isShaded ? "oklch(0.78 0.19 130)" : "none"}
                  stroke="var(--ink)"
                  strokeWidth={1.3}
                />
              );
            })}
            <text x={ox + cell / 2} y={oy + cell / 2 + 5} fill="var(--ink)" fontSize={15} textAnchor="middle" style={labelStyle}>20</text>
            <text x={ox + (n - 0.5) * cell} y={oy + cell / 2 + 5} fill="var(--ink)" fontSize={15} textAnchor="middle" style={labelStyle}>11</text>
          </svg>
        </div>
      );
    }

    case "arc-2021-c9": {
      // Triangle ABC; D midpoint of AC; E on BD with BE:ED = 3:2.
      // Shaded triangle ADE. Math coords (y-up): B(0,0) C(10,0) A(3,8),
      // D = midpoint AC = (6.5,4); E = B + 3/5(D-B) = (3.9,2.4).
      const s = 22;
      const ox = 18;
      const oy = 18; // svg y of math y=8 (top)
      const mx = (x: number) => ox + x * s;
      const my = (y: number) => oy + (8 - y) * s;
      const A = { x: mx(3), y: my(8) };
      const B = { x: mx(0), y: my(0) };
      const C = { x: mx(10), y: my(0) };
      const D = { x: mx(6.5), y: my(4) };
      const E = { x: mx(3.9), y: my(2.4) };
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      // tick marks for AD = DC: midpoints of AD and DC with a short cross stroke
      const tick = (p: { x: number; y: number }, q: { x: number; y: number }) => {
        const midx = (p.x + q.x) / 2;
        const midy = (p.y + q.y) / 2;
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const len = Math.hypot(dx, dy);
        const nx = (-dy / len) * 5;
        const ny = (dx / len) * 5;
        return `M ${midx - nx} ${midy - ny} L ${midx + nx} ${midy + ny}`;
      };
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 280 }}>
          <svg viewBox="0 0 260 220" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Shaded triangle ADE */}
            <polygon points={`${A.x},${A.y} ${D.x},${D.y} ${E.x},${E.y}`} fill="oklch(0.78 0.19 130)" stroke="none" />
            {/* Triangle ABC */}
            <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="none" stroke="var(--ink)" strokeWidth={1.6} />
            {/* Cevian B-D and side A-E */}
            <line x1={B.x} y1={B.y} x2={D.x} y2={D.y} stroke="var(--ink)" strokeWidth={1.3} />
            <line x1={A.x} y1={A.y} x2={E.x} y2={E.y} stroke="var(--ink)" strokeWidth={1.3} />
            {/* Equal-segment ticks AD = DC */}
            <path d={tick(A, D)} stroke="var(--ink)" strokeWidth={1.2} />
            <path d={tick(D, C)} stroke="var(--ink)" strokeWidth={1.2} />
            {/* Vertex dots */}
            {[A, B, C, D, E].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.2} fill="orange" stroke="orange" />
            ))}
            {/* Labels */}
            <text x={A.x} y={A.y - 8} fill="var(--ink)" fontSize={15} textAnchor="middle" style={labelStyle}>A</text>
            <text x={B.x - 8} y={B.y + 6} fill="var(--ink)" fontSize={15} textAnchor="end" style={labelStyle}>B</text>
            <text x={C.x + 8} y={C.y + 6} fill="var(--ink)" fontSize={15} textAnchor="start" style={labelStyle}>C</text>
            <text x={D.x + 9} y={D.y + 4} fill="var(--ink)" fontSize={15} textAnchor="start" style={labelStyle}>D</text>
            <text x={E.x - 9} y={E.y + 2} fill="var(--ink)" fontSize={15} textAnchor="end" style={labelStyle}>E</text>
          </svg>
        </div>
      );
    }

    case "arc-2021-c12": {
      // Upright rectangle ABCD + tilted rectangle CEFG sharing vertex C.
      // E on AB with AE:EB = 3:2; B lies on FG. Math coords (y-up):
      // A(0,6) B(8,6) C(8,0) D(0,0) E(4.8,6) F(7.29,7.33) G(10.49,1.33).
      const s = 22;
      const ox = 22;
      const oy = 14; // headroom above F
      const mx = (x: number) => ox + x * s;
      const my = (y: number) => oy + (7.33 - y) * s;
      const A = { x: mx(0), y: my(6) };
      const B = { x: mx(8), y: my(6) };
      const C = { x: mx(8), y: my(0) };
      const D = { x: mx(0), y: my(0) };
      const E = { x: mx(4.8), y: my(6) };
      const F = { x: mx(7.29), y: my(7.33) };
      const G = { x: mx(10.49), y: my(1.33) };
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 300 }}>
          <svg viewBox="0 0 290 215" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Tilted rectangle CEFG (shaded) */}
            <polygon points={`${C.x},${C.y} ${E.x},${E.y} ${F.x},${F.y} ${G.x},${G.y}`} fill="oklch(0.82 0.09 250)" stroke="var(--ink)" strokeWidth={1.5} />
            {/* Upright rectangle ABCD */}
            <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`} fill="none" stroke="var(--ink)" strokeWidth={1.6} />
            {/* Vertex dots */}
            {[A, B, C, D, E, F, G].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3} fill="orange" stroke="orange" />
            ))}
            {/* Labels */}
            <text x={A.x - 7} y={A.y - 5} fill="var(--ink)" fontSize={14} textAnchor="end" style={labelStyle}>A</text>
            <text x={B.x + 2} y={B.y - 6} fill="var(--ink)" fontSize={14} textAnchor="start" style={labelStyle}>B</text>
            <text x={C.x + 4} y={C.y + 14} fill="var(--ink)" fontSize={14} textAnchor="start" style={labelStyle}>C</text>
            <text x={D.x - 7} y={D.y + 14} fill="var(--ink)" fontSize={14} textAnchor="end" style={labelStyle}>D</text>
            <text x={E.x - 4} y={E.y - 6} fill="var(--ink)" fontSize={14} textAnchor="end" style={labelStyle}>E</text>
            <text x={F.x} y={F.y - 6} fill="var(--ink)" fontSize={14} textAnchor="middle" style={labelStyle}>F</text>
            <text x={G.x + 6} y={G.y + 4} fill="var(--ink)" fontSize={14} textAnchor="start" style={labelStyle}>G</text>
          </svg>
        </div>
      );
    }

    case "nksp-2026-c5": {
      // Four cube-net (dice) options A–D with pip patterns. Faithfully reproduced
      // from the source scan via PNG — the four nets ARE the MCQ options.
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 420 }}>
          <img
            src="/figures/nksp-2026-c5.png"
            alt="Bốn hình khai triển xúc xắc A, B, C, D — Câu 5 NKSP 2026"
            style={{ maxWidth: "100%", width: "100%", height: "auto", display: "block" }}
          />
        </div>
      );
    }

    case "nksp-2026-c9": {
      // Sequence of 4 circles containing cats + elephants (visual pattern). PNG crop.
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 520 }}>
          <img
            src="/figures/nksp-2026-c9.png"
            alt="Dãy 4 hình chứa mèo và voi theo quy luật — Câu 9 NKSP 2026"
            style={{ maxWidth: "100%", width: "100%", height: "auto", display: "block" }}
          />
        </div>
      );
    }

    case "nksp-2026-b4": {
      // Three equal circles (centers A, B, C) with a shaded trefoil region.
      // Reproduced from the source scan via PNG (shading geometry is intricate).
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 300 }}>
          <img
            src="/figures/nksp-2026-b4.png"
            alt="Ba hình tròn bằng nhau tâm A, B, C với phần tô đậm — Bài 4 NKSP 2026"
            style={{ maxWidth: "100%", width: "100%", height: "auto", display: "block" }}
          />
        </div>
      );
    }

    case "nksp-2026-b6": {
      // Triangle ABC (A apex, B bottom-left, C bottom-right). E on AB, F on AC,
      // D on BC; segment EF (horizontal) and cevian AD meet at G. The 5 "hàng":
      // A-E-B, A-F-C, A-G-D, E-G-F, B-D-C.
      const A = { x: 150, y: 40 };
      const B = { x: 60, y: 240 };
      const C = { x: 400, y: 240 };
      const D = { x: 200, y: 240 };
      const E = { x: 101, y: 150 };
      const F = { x: 288, y: 150 };
      const G = { x: 178, y: 150 };
      const labelStyle = { fontStyle: "italic", fontFamily: "Times, serif" } as const;
      return (
        <div className="q-figure-wrapper" style={{ maxWidth: 320 }}>
          <svg viewBox="0 0 460 290" width="100%" style={{ display: "block", height: "auto" }}>
            {/* Triangle ABC */}
            <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="none" stroke="var(--ink)" strokeWidth={1.6} />
            {/* Midline-style segment EF */}
            <line x1={E.x} y1={E.y} x2={F.x} y2={F.y} stroke="var(--ink)" strokeWidth={1.5} />
            {/* Cevian AD */}
            <line x1={A.x} y1={A.y} x2={D.x} y2={D.y} stroke="var(--ink)" strokeWidth={1.5} />
            {/* Vertex / point dots */}
            {[A, B, C, D, E, F, G].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill="orange" stroke="orange" />
            ))}
            {/* Labels */}
            <text x={A.x} y={A.y - 8} fill="var(--ink)" fontSize={16} textAnchor="middle" style={labelStyle}>A</text>
            <text x={B.x - 8} y={B.y + 16} fill="var(--ink)" fontSize={16} textAnchor="end" style={labelStyle}>B</text>
            <text x={C.x + 8} y={C.y + 16} fill="var(--ink)" fontSize={16} textAnchor="start" style={labelStyle}>C</text>
            <text x={D.x} y={D.y + 18} fill="var(--ink)" fontSize={16} textAnchor="middle" style={labelStyle}>D</text>
            <text x={E.x - 8} y={E.y + 4} fill="var(--ink)" fontSize={16} textAnchor="end" style={labelStyle}>E</text>
            <text x={F.x + 8} y={F.y + 4} fill="var(--ink)" fontSize={16} textAnchor="start" style={labelStyle}>F</text>
            <text x={G.x - 4} y={G.y + 18} fill="var(--ink)" fontSize={16} textAnchor="end" style={labelStyle}>G</text>
          </svg>
        </div>
      );
    }

    default:
      return null;
  }
}

