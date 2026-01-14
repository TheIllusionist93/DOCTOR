const { createCanvas } = require('canvas');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════
// 📋 PROJEKT-KONFIGURATION - HIER EINFACH ANPASSEN
// ═══════════════════════════════════════════════════════════════════

const PROJECT_CONFIG = {
  totalDays: 75,
  startDate: '2025-11-17',  // Format: YYYY-MM-DD
  projectName: 'DOCTOR',
  
  // Ausnahmen: An diesen Wochenendtagen wird gearbeitet
  weekendWorkDays: [
    '2026-05-17',
    // Weitere Daten hier einfügen
  ],
  
  // Ausnahmen: An diesen Wochentagen ist frei
  weekdayOffDays: [
    '2025-12-22',
    '2025-12-23',
    '2025-12-24',
    '2025-12-25',
    '2025-12-26',
    '2025-12-27',
    '2025-12-28',
    '2025-12-29',
    '2025-12-30',
    '2025-12-31',
    '2026-01-01',
    '2026-01-02',
    '2026-01-03',
    '2026-01-04',
    '2026-01-05',
    '2026-01-06',
    '2026-01-19',
    // Weitere Daten hier einfügen
  ]
};

// ═══════════════════════════════════════════════════════════════════
// 🎨 DESIGN-KONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DESIGN = {
  colors: {
    background: '#E8461B',      // Leuchtendes Orange
    backgroundText: '#D63D15',  // Etwas dunkler für DOCTOR im Hintergrund
    pastDays: '#ffffff',
    today: '#C8D41E',           // Grün-Gelb
    futureDays: '#B8320F',      // Dunkleres Orange
    progressBar: '#C8D41E',     // Grün-Gelb
    progressBarBg: '#B8320F',   // Dunkleres Orange
    text: '#ffffff',
    textSecondary: '#ffffff',
  },
  dots: {
    size: 24,
    spacing: 60,
    verticalOffset: 100,  // ANPASSEN: Positive Zahl = nach unten, negative = nach oben
  },
  grid: {
    cols: 9,
    rows: 9,
  },
  progressBar: {
    height: 6,
    marginTop: 80,
  },
  text: {
    fontSize: 40,
    marginTop: 70,
  }
};

// ═══════════════════════════════════════════════════════════════════
// 📅 DATUMS-HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════════════════

function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isWorkDay(date, config) {
  const dateStr = formatDate(date);
  
  if (isWeekend(date)) {
    return config.weekendWorkDays.includes(dateStr);
  } else {
    return !config.weekdayOffDays.includes(dateStr);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🗓️ DREHTAGE BERECHNEN
// ═══════════════════════════════════════════════════════════════════

function calculateShootingDays(config) {
  const startDate = parseDate(config.startDate);
  const shootingDays = [];
  let currentDate = new Date(startDate);
  
  while (shootingDays.length < config.totalDays) {
    if (isWorkDay(currentDate, config)) {
      shootingDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return shootingDays;
}

function getCurrentDayIndex(shootingDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < shootingDays.length; i++) {
    const shootDay = new Date(shootingDays[i]);
    shootDay.setHours(0, 0, 0, 0);
    
    if (shootDay.getTime() === today.getTime()) {
      return i; // Heute ist ein Arbeitstag
    }
    
    if (shootDay > today) {
      return i - 1; // Heute ist kein Arbeitstag
    }
  }
  
  return shootingDays.length - 1;
}

function isTodayAWorkDay(shootingDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return shootingDays.some(shootDay => {
    const day = new Date(shootDay);
    day.setHours(0, 0, 0, 0);
    return day.getTime() === today.getTime();
  });
}

// ═══════════════════════════════════════════════════════════════════
// 🌀 RECHTECK-SPIRAL-KOORDINATEN (AUSSEN NACH INNEN)
// ═══════════════════════════════════════════════════════════════════

function generateRectangleSpiralCoordinates(totalDots, cols, rows, dotSpacing) {
  const coords = [];
  
  // Grid-Positionen erstellen
  const grid = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid.push({
        x: col * dotSpacing,
        y: row * dotSpacing,
        col: col,
        row: row
      });
    }
  }
  
  // Spirale von außen nach innen
  let left = 0, right = cols - 1;
  let top = 0, bottom = rows - 1;
  
  while (coords.length < totalDots && left <= right && top <= bottom) {
    // Oben von links nach rechts
    for (let col = left; col <= right && coords.length < totalDots; col++) {
      const pos = grid.find(p => p.row === top && p.col === col);
      if (pos) coords.push({ x: pos.x, y: pos.y });
    }
    top++;
    
    // Rechts von oben nach unten
    for (let row = top; row <= bottom && coords.length < totalDots; row++) {
      const pos = grid.find(p => p.row === row && p.col === right);
      if (pos) coords.push({ x: pos.x, y: pos.y });
    }
    right--;
    
    // Unten von rechts nach links
    if (top <= bottom) {
      for (let col = right; col >= left && coords.length < totalDots; col--) {
        const pos = grid.find(p => p.row === bottom && p.col === col);
        if (pos) coords.push({ x: pos.x, y: pos.y });
      }
      bottom--;
    }
    
    // Links von unten nach oben
    if (left <= right) {
      for (let row = bottom; row >= top && coords.length < totalDots; row--) {
        const pos = grid.find(p => p.row === row && p.col === left);
        if (pos) coords.push({ x: pos.x, y: pos.y });
      }
      left++;
    }
  }
  
  return coords;
}

// ═══════════════════════════════════════════════════════════════════
// 🎨 WALLPAPER GENERIEREN
// ═══════════════════════════════════════════════════════════════════

function generateWallpaper(projectConfig, design) {
  console.log(`📅 Berechne Drehtage...`);
  const shootingDays = calculateShootingDays(projectConfig);
  const currentDayIndex = getCurrentDayIndex(shootingDays);
  const todayIsWorkDay = isTodayAWorkDay(shootingDays);
  const completedDays = currentDayIndex + 1;
  const percentage = Math.round((completedDays / projectConfig.totalDays) * 100);
  
  console.log(`   Start: ${formatDate(shootingDays[0])}`);
  console.log(`   Ende: ${formatDate(shootingDays[shootingDays.length - 1])}`);
  console.log(`   Fortschritt: ${completedDays}/${projectConfig.totalDays} (${percentage}%)`);
  console.log(`   Heute ist ${todayIsWorkDay ? 'ein' : 'kein'} Arbeitstag`);
  
  // Canvas erstellen
  const canvas = createCanvas(1170, 2532);
  const ctx = canvas.getContext('2d');
  
  // Hintergrund
  ctx.fillStyle = design.colors.background;
  ctx.fillRect(0, 0, 1170, 2532);
  
  // DOCTOR im Hintergrund - RIESIGE BUCHSTABEN, MEHRERE ZEILEN
  ctx.save();
  ctx.fillStyle = design.colors.backgroundText;
  ctx.font = 'bold 650px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.globalAlpha = 0.30; // Besser sichtbar
  
  // DOCTOR über mehrere Zeilen verteilt, leicht versetzt
  const startY = 350;
  const lineHeight = 550;
  
  ctx.fillText('DOCTOR', 50, startY);
  ctx.fillText('TOR DOC', 100, startY + lineHeight);
  ctx.fillText('CTOR D', 20, startY + lineHeight * 2);
  
  ctx.restore();
  
  // Rechteck-Spiral-Koordinaten generieren
  const coords = generateRectangleSpiralCoordinates(
    projectConfig.totalDays,
    design.grid.cols,
    design.grid.rows,
    design.dots.spacing
  );
  
  // Bounding Box berechnen
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  coords.forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  
  const gridWidth = maxX - minX;
  const gridHeight = maxY - minY;
  
  // Zentrierung mit verticalOffset
  const offsetX = (1170 - gridWidth) / 2 - minX;
  const offsetY = (2532 - gridHeight) / 2 - minY + design.dots.verticalOffset;
  
  // Punkte zeichnen
  coords.forEach(({ x, y }, i) => {
    const centerX = x + offsetX;
    const centerY = y + offsetY;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, design.dots.size / 2, 0, Math.PI * 2);
    
    if (i < completedDays - 1) {
      // Vergangene Tage
      ctx.fillStyle = design.colors.pastDays;
    } else if (i === completedDays - 1 && todayIsWorkDay) {
      // Heute - nur wenn es ein Arbeitstag ist
      ctx.fillStyle = design.colors.today;
    } else if (i === completedDays - 1 && !todayIsWorkDay) {
      // Heute ist kein Arbeitstag - als vergangen markieren
      ctx.fillStyle = design.colors.pastDays;
    } else {
      // Zukünftige Tage
      ctx.fillStyle = design.colors.futureDays;
    }
    
    ctx.fill();
  });
  
  // Fortschrittsbalken
  const barY = offsetY + gridHeight + design.progressBar.marginTop;
  const barWidth = 700;
  const barX = (1170 - barWidth) / 2;
  
  // Hintergrund
  ctx.fillStyle = design.colors.progressBarBg;
  ctx.fillRect(barX, barY, barWidth, design.progressBar.height);
  
  // Fortschritt
  ctx.fillStyle = design.colors.progressBar;
  ctx.fillRect(barX, barY, (barWidth * percentage) / 100, design.progressBar.height);
  
  // Text - GRÖSSER und BESSER SICHTBAR
  const textY = barY + design.text.marginTop;
  ctx.fillStyle = design.colors.text;
  ctx.font = `bold ${design.text.fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Leichter Schatten für bessere Lesbarkeit
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  
  ctx.fillText(
    `${projectConfig.projectName} ${completedDays}/${projectConfig.totalDays}`,
    585,
    textY
  );
  
  // Als PNG speichern
  const buffer = canvas.toBuffer('image/png');
  const filename = 'shooting-days-wallpaper.png';
  fs.writeFileSync(filename, buffer);
  
  console.log(`\n✅ Wallpaper erstellt: ${filename}`);
  console.log(`   ${percentage}% abgeschlossen`);
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 AUSFÜHREN
// ═══════════════════════════════════════════════════════════════════

generateWallpaper(PROJECT_CONFIG, DESIGN);
