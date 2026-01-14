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
    '2026-01-17',
    // Weitere Daten hier einfügen
  ],
  
  // Ausnahmen: An diesen Wochentagen ist frei
  weekdayOffDays: [
    '2025-12-22',
    '2025-12-23',
    '2025-12-24',
    '2025-12-25',
    '2025-12-26',
    // Weitere Daten hier einfügen
  ]
};

// ═══════════════════════════════════════════════════════════════════
// 🎨 DESIGN-KONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DESIGN = {
  colors: {
    background: '#1a1a1a',
    pastDays: '#ffffff',
    today: '#ec4899',
    futureDays: '#404040',
    progressBar: '#ec4899',
    progressBarBg: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#6b7280',
  },
  dots: {
    size: 14,
    spacing: 42,
  },
  progressBar: {
    height: 4,
    marginTop: 60,
  },
  text: {
    fontSize: 32,
    marginTop: 60,
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
  return day === 0 || day === 6; // Sonntag oder Samstag
}

function isWorkDay(date, config) {
  const dateStr = formatDate(date);
  
  // Ist es ein Wochenende?
  if (isWeekend(date)) {
    // Arbeitet man an diesem Wochenende?
    return config.weekendWorkDays.includes(dateStr);
  } else {
    // Ist an diesem Wochentag frei?
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
      return i; // Heute ist ein Drehtag
    }
    
    if (shootDay > today) {
      return i - 1; // Heute liegt zwischen Drehtagen
    }
  }
  
  // Projekt ist abgeschlossen
  return shootingDays.length - 1;
}

// ═══════════════════════════════════════════════════════════════════
// 🌀 SPIRAL-KOORDINATEN BERECHNEN
// ═══════════════════════════════════════════════════════════════════

function generateSpiralCoordinates(totalDots, dotSpacing) {
  const coords = [];
  let x = 0;
  let y = 0;
  let dx = dotSpacing;
  let dy = 0;
  let segmentLength = 1;
  let segmentPassed = 0;
  let direction = 0; // 0=rechts, 1=runter, 2=links, 3=hoch
  
  for (let i = 0; i < totalDots; i++) {
    coords.push({ x, y });
    
    x += dx;
    y += dy;
    segmentPassed++;
    
    if (segmentPassed === segmentLength) {
      segmentPassed = 0;
      direction = (direction + 1) % 4;
      
      if (direction === 0) {
        dx = dotSpacing;
        dy = 0;
      } else if (direction === 1) {
        dx = 0;
        dy = dotSpacing;
      } else if (direction === 2) {
        dx = -dotSpacing;
        dy = 0;
        segmentLength++;
      } else {
        dx = 0;
        dy = -dotSpacing;
        segmentLength++;
      }
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
  const completedDays = currentDayIndex + 1;
  const percentage = Math.round((completedDays / projectConfig.totalDays) * 100);
  
  console.log(`   Start: ${formatDate(shootingDays[0])}`);
  console.log(`   Ende: ${formatDate(shootingDays[shootingDays.length - 1])}`);
  console.log(`   Fortschritt: ${completedDays}/${projectConfig.totalDays} (${percentage}%)`);
  
  // Canvas erstellen
  const canvas = createCanvas(1170, 2532);
  const ctx = canvas.getContext('2d');
  
  // Hintergrund
  ctx.fillStyle = design.colors.background;
  ctx.fillRect(0, 0, 1170, 2532);
  
  // Spiral-Koordinaten generieren
  const coords = generateSpiralCoordinates(projectConfig.totalDays, design.dots.spacing);
  
  // Bounding Box berechnen
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  coords.forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  
  const spiralWidth = maxX - minX;
  const spiralHeight = maxY - minY;
  
  // Zentrierung
  const offsetX = (1170 - spiralWidth) / 2 - minX;
  const offsetY = (2532 - spiralHeight) / 2 - minY - 200;
  
  // Punkte zeichnen
  coords.forEach(({ x, y }, i) => {
    const centerX = x + offsetX;
    const centerY = y + offsetY;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, design.dots.size / 2, 0, Math.PI * 2);
    
    if (i < completedDays - 1) {
      ctx.fillStyle = design.colors.pastDays;
    } else if (i === completedDays - 1) {
      ctx.fillStyle = design.colors.today;
    } else {
      ctx.fillStyle = design.colors.futureDays;
    }
    
    ctx.fill();
  });
  
  // Fortschrittsbalken
  const barY = offsetY + spiralHeight / 2 + spiralHeight / 2 + design.progressBar.marginTop;
  const barWidth = 600;
  const barX = (1170 - barWidth) / 2;
  
  // Hintergrund
  ctx.fillStyle = design.colors.progressBarBg;
  ctx.fillRect(barX, barY, barWidth, design.progressBar.height);
  
  // Fortschritt
  ctx.fillStyle = design.colors.progressBar;
  ctx.fillRect(barX, barY, (barWidth * percentage) / 100, design.progressBar.height);
  
  // Text
  const textY = barY + design.text.marginTop;
  ctx.fillStyle = design.colors.text;
  ctx.font = `${design.text.fontSize}px Arial`;
  ctx.textAlign = 'center';
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