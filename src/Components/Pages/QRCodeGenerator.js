import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../SEO/SEO';
import './QRCodeGenerator.css';

/* ================================================================
   CONSTANTS
   ================================================================ */

const INPUT_TABS = [
  { id: 'url', label: 'Link / URL', icon: 'fa-solid fa-link' },
  { id: 'text', label: 'Text', icon: 'fa-solid fa-font' },
  { id: 'wifi', label: 'WiFi', icon: 'fa-solid fa-wifi' },
  { id: 'contact', label: 'Contact', icon: 'fa-solid fa-address-book' },
  { id: 'email', label: 'Gmail', icon: 'fa-solid fa-envelope' },
  { id: 'maps', label: 'Google Maps', icon: 'fa-solid fa-location-dot' },
];

const TOOL_TABS = [
  { id: 'style', label: 'Style & Shape', icon: 'fa-solid fa-shapes' },
  { id: 'color', label: 'Color', icon: 'fa-solid fa-palette' },
  { id: 'frames', label: 'Frames', icon: 'fa-solid fa-border-all' },
  { id: 'logo', label: 'Logo', icon: 'fa-solid fa-icons' },
  { id: 'templates', label: 'Templates', icon: 'fa-solid fa-swatchbook' },
  { id: 'format', label: 'File Format', icon: 'fa-solid fa-file-export' },
];

const DOT_SHAPES = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'heart', label: 'Heart' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'cross', label: 'Cross' },
  { id: 'octagon', label: 'Octagon' },
  { id: 'leaf', label: 'Leaf' },
  { id: 'thin-diamond', label: 'Thin Diamond' },
  { id: 'small-square', label: 'Small Square' },
  { id: 'tiny-dot', label: 'Tiny Dot' },
  { id: 'vertical-bar', label: 'Vertical Bar' },
  { id: 'horizontal-bar', label: 'Horizontal Bar' },
  { id: 'classy-rounded', label: 'Classy Rounded' },
  { id: 'rotated-square', label: 'Rotated Square' },
];

const CORNER_OUTER = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'circle', label: 'Circle' },
  { id: 'diamond-outer', label: 'Diamond' },
  { id: 'hexagon-outer', label: 'Hexagon' },
  { id: 'octagon-outer', label: 'Octagon' },
  { id: 'leaf-outer', label: 'Leaf' },
  { id: 'classy-outer', label: 'Classy' },
  { id: 'inset-outer', label: 'Inset' },
  { id: 'petal-outer', label: 'Petal' },
];

const CORNER_INNER = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dot', label: 'Circle' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'hexagon-inner', label: 'Hexagon' },
  { id: 'octagon-inner', label: 'Octagon' },
  { id: 'cross-inner', label: 'Cross' },
  { id: 'leaf-inner', label: 'Leaf' },
  { id: 'classy-inner', label: 'Classy' },
  { id: 'shield-inner', label: 'Shield' },
];

const GRADIENT_SUGGESTIONS = [
  { label: 'Ocean Blue', c1: '#0052D4', c2: '#65C7F7' },
  { label: 'Sunset', c1: '#f12711', c2: '#f5af19' },
  { label: 'Purple Haze', c1: '#7B1FA2', c2: '#E040FB' },
  { label: 'Emerald', c1: '#11998e', c2: '#38ef7d' },
  { label: 'Dark Elegance', c1: '#232526', c2: '#414345' },
];

const QR_TEMPLATES = [
  { id: 't1', name: 'Classic', dotShape: 'square', cornerOuter: 'square', cornerInner: 'square', fgColor: '#000000', bgColor: '#ffffff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'none' },
  { id: 't2', name: 'Rounded Soft', dotShape: 'rounded', cornerOuter: 'rounded', cornerInner: 'rounded', fgColor: '#1e1b4b', bgColor: '#f8fafc', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'rounded' },
  { id: 't3', name: 'Dot Matrix', dotShape: 'dots', cornerOuter: 'circle', cornerInner: 'dot', fgColor: '#4f46e5', bgColor: '#ffffff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'none' },
  { id: 't4', name: 'Diamond Cut', dotShape: 'diamond', cornerOuter: 'diamond-outer', cornerInner: 'diamond', fgColor: '#b8860b', bgColor: '#fff9e6', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'gold' },
  { id: 't5', name: 'Ocean Breeze', dotShape: 'rounded', cornerOuter: 'rounded', cornerInner: 'rounded', fgColor: '#0ea5e9', bgColor: '#f0f9ff', gradientOn: true, gradColor1: '#0052D4', gradColor2: '#65C7F7', frame: 'gradient-cool' },
  { id: 't6', name: 'Sunset Glow', dotShape: 'dots', cornerOuter: 'circle', cornerInner: 'dot', fgColor: '#f97316', bgColor: '#fffbeb', gradientOn: true, gradColor1: '#f12711', gradColor2: '#f5af19', frame: 'gradient-warm' },
  { id: 't7', name: 'Neon Night', dotShape: 'dots', cornerOuter: 'circle', cornerInner: 'dot', fgColor: '#3b82f6', bgColor: '#0f172a', gradientOn: true, gradColor1: '#3b82f6', gradColor2: '#06b6d4', frame: 'neon-blue' },
  { id: 't8', name: 'Cyber Pink', dotShape: 'rounded', cornerOuter: 'rounded', cornerInner: 'rounded', fgColor: '#ec4899', bgColor: '#1a0a14', gradientOn: true, gradColor1: '#ec4899', gradColor2: '#d946ef', frame: 'neon-pink' },
  { id: 't9', name: 'Emerald Leaf', dotShape: 'leaf', cornerOuter: 'leaf-outer', cornerInner: 'leaf-inner', fgColor: '#059669', bgColor: '#ecfdf5', gradientOn: true, gradColor1: '#11998e', gradColor2: '#38ef7d', frame: 'rounded' },
  { id: 't10', name: 'Golden Glow', dotShape: 'diamond', cornerOuter: 'diamond-outer', cornerInner: 'diamond', fgColor: '#f59e0b', bgColor: '#fffbeb', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'elegant' },
  { id: 't11', name: 'Purple Haze', dotShape: 'rounded', cornerOuter: 'rounded', cornerInner: 'rounded', fgColor: '#7c3aed', bgColor: '#faf5ff', gradientOn: true, gradColor1: '#7B1FA2', gradColor2: '#E040FB', frame: 'none' },
  { id: 't12', name: 'Minimal Dark', dotShape: 'square', cornerOuter: 'square', cornerInner: 'square', fgColor: '#ffffff', bgColor: '#1e1b4b', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'simple' },
  { id: 't13', name: 'Heart Love', dotShape: 'heart', cornerOuter: 'rounded', cornerInner: 'rounded', fgColor: '#e11d48', bgColor: '#fff1f2', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'rounded' },
  { id: 't14', name: 'Corporate Blue', dotShape: 'square', cornerOuter: 'rounded', cornerInner: 'rounded', fgColor: '#1d4ed8', bgColor: '#ffffff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'modern' },
  { id: 't15', name: 'Hexagon Tech', dotShape: 'hexagon', cornerOuter: 'hexagon-outer', cornerInner: 'hexagon-inner', fgColor: '#475569', bgColor: '#f8fafc', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'brackets' },
  { id: 't16', name: 'Bold Red', dotShape: 'square', cornerOuter: 'square', cornerInner: 'square', fgColor: '#dc2626', bgColor: '#ffffff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'bold' },
  { id: 't17', name: 'Elegant Gold', dotShape: 'classy-rounded', cornerOuter: 'classy-outer', cornerInner: 'classy-inner', fgColor: '#92400e', bgColor: '#fffbeb', gradientOn: true, gradColor1: '#b8860b', gradColor2: '#d4a017', frame: 'gold' },
  { id: 't18', name: 'Stamp It', dotShape: 'square', cornerOuter: 'square', cornerInner: 'square', fgColor: '#000000', bgColor: '#ffffff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'stamp' },
  { id: 't19', name: 'Scan Me', dotShape: 'rounded', cornerOuter: 'rounded', cornerInner: 'dot', fgColor: '#4f46e5', bgColor: '#ffffff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'scan-me' },
  { id: 't20', name: 'Cross Stitch', dotShape: 'cross', cornerOuter: 'square', cornerInner: 'cross-inner', fgColor: '#be185d', bgColor: '#fdf2f8', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'none' },
  { id: 't21', name: 'Triangle Art', dotShape: 'triangle', cornerOuter: 'diamond-outer', cornerInner: 'diamond', fgColor: '#0891b2', bgColor: '#ecfeff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'corners' },
  { id: 't22', name: 'Octagon Shield', dotShape: 'octagon', cornerOuter: 'octagon-outer', cornerInner: 'octagon-inner', fgColor: '#374151', bgColor: '#f3f4f6', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'double' },
  { id: 't23', name: 'Polaroid', dotShape: 'square', cornerOuter: 'square', cornerInner: 'square', fgColor: '#000000', bgColor: '#ffffff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'polaroid' },
  { id: 't24', name: 'Tiny Dots', dotShape: 'tiny-dot', cornerOuter: 'circle', cornerInner: 'dot', fgColor: '#6366f1', bgColor: '#ffffff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'none' },
  { id: 't25', name: 'Barcode', dotShape: 'vertical-bar', cornerOuter: 'square', cornerInner: 'square', fgColor: '#000000', bgColor: '#ffffff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'simple' },

  { id: 't27', name: 'Forest Green', dotShape: 'leaf', cornerOuter: 'leaf-outer', cornerInner: 'leaf-inner', fgColor: '#166534', bgColor: '#f0fdf4', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'rounded' },
  { id: 't28', name: 'Small Pixels', dotShape: 'small-square', cornerOuter: 'square', cornerInner: 'square', fgColor: '#0f172a', bgColor: '#f8fafc', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'dashed' },
  { id: 't29', name: 'Ring Core', dotShape: 'dots', cornerOuter: 'circle', cornerInner: 'dot', fgColor: '#7c3aed', bgColor: '#faf5ff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'none' },
  { id: 't30', name: 'Shield Badge', dotShape: 'rounded', cornerOuter: 'rounded', cornerInner: 'shield-inner', fgColor: '#0369a1', bgColor: '#f0f9ff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'modern' },
  { id: 't31', name: 'Petal Blossom', dotShape: 'dots', cornerOuter: 'petal-outer', cornerInner: 'dot', fgColor: '#db2777', bgColor: '#fdf2f8', gradientOn: true, gradColor1: '#ec4899', gradColor2: '#f472b6', frame: 'rounded' },
  { id: 't32', name: 'Rotated Grid', dotShape: 'rotated-square', cornerOuter: 'diamond-outer', cornerInner: 'diamond', fgColor: '#ea580c', bgColor: '#fff7ed', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'none' },
  { id: 't33', name: 'Double Frame', dotShape: 'rounded', cornerOuter: 'rounded', cornerInner: 'rounded', fgColor: '#1e40af', bgColor: '#eff6ff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'double' },
  { id: 't34', name: 'Thin Diamond', dotShape: 'thin-diamond', cornerOuter: 'diamond-outer', cornerInner: 'diamond', fgColor: '#b45309', bgColor: '#fffbeb', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'elegant' },
  { id: 't35', name: 'Shadow Box', dotShape: 'square', cornerOuter: 'rounded', cornerInner: 'rounded', fgColor: '#334155', bgColor: '#ffffff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'shadow' },
  { id: 't36', name: 'Horizontal Lines', dotShape: 'horizontal-bar', cornerOuter: 'square', cornerInner: 'square', fgColor: '#475569', bgColor: '#f8fafc', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'simple' },
  { id: 't37', name: 'Inset Frame', dotShape: 'rounded', cornerOuter: 'inset-outer', cornerInner: 'rounded', fgColor: '#4338ca', bgColor: '#eef2ff', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'none' },
  { id: 't38', name: 'Dotted Border', dotShape: 'dots', cornerOuter: 'circle', cornerInner: 'dot', fgColor: '#0d9488', bgColor: '#f0fdfa', gradientOn: false, gradColor1: '#000', gradColor2: '#000', frame: 'dashed' },
];

const FRAMES = [
  { id: 'none', label: 'None' },
  { id: 'simple', label: 'Simple' },
  { id: 'bold', label: 'Bold' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'double', label: 'Double' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'stamp', label: 'Stamp' },
  { id: 'scan-me', label: 'Scan Me' },
  { id: 'scan-here', label: 'Scan Here' },
  { id: 'brackets', label: 'Brackets' },
  { id: 'corners', label: 'Corners' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'modern', label: 'Modern' },
  { id: 'neon-blue', label: 'Neon Blue' },
  { id: 'neon-pink', label: 'Neon Pink' },
  { id: 'gold', label: 'Gold' },
  { id: 'gradient-warm', label: 'Warm' },
  { id: 'gradient-cool', label: 'Cool' },
];

const LOGOS = [
  { id: 'none', label: 'None', unicode: null, family: null, color: null, bg: null },
  { id: 'whatsapp', label: 'WhatsApp', unicode: '\uf232', family: 'brands', color: '#25D366', bg: '#fff' },
  { id: 'instagram', label: 'Instagram', unicode: '\uf16d', family: 'brands', color: '#E4405F', bg: '#fff' },
  { id: 'facebook', label: 'Facebook', unicode: '\uf09a', family: 'brands', color: '#1877F2', bg: '#fff' },
  { id: 'youtube', label: 'YouTube', unicode: '\uf167', family: 'brands', color: '#FF0000', bg: '#fff' },
  { id: 'x-twitter', label: 'X', unicode: '\uf099', family: 'brands', color: '#000', bg: '#fff' },
  { id: 'tiktok', label: 'TikTok', unicode: '\ue07b', family: 'brands', color: '#000', bg: '#fff' },
  { id: 'spotify', label: 'Spotify', unicode: '\uf1bc', family: 'brands', color: '#1DB954', bg: '#fff' },
  { id: 'linkedin', label: 'LinkedIn', unicode: '\uf0e1', family: 'brands', color: '#0A66C2', bg: '#fff' },
  { id: 'snapchat', label: 'Snapchat', unicode: '\uf2ab', family: 'brands', color: '#FFFC00', bg: '#333' },
  { id: 'pinterest', label: 'Pinterest', unicode: '\uf0d2', family: 'brands', color: '#E60023', bg: '#fff' },
  { id: 'reddit', label: 'Reddit', unicode: '\uf281', family: 'brands', color: '#FF4500', bg: '#fff' },
  { id: 'discord', label: 'Discord', unicode: '\uf392', family: 'brands', color: '#5865F2', bg: '#fff' },
  { id: 'telegram', label: 'Telegram', unicode: '\uf2c6', family: 'brands', color: '#26A5E4', bg: '#fff' },
  { id: 'apple', label: 'Apple', unicode: '\uf179', family: 'brands', color: '#000', bg: '#fff' },
  { id: 'google', label: 'Google', unicode: '\uf1a0', family: 'brands', color: '#4285F4', bg: '#fff' },
  { id: 'amazon', label: 'Amazon', unicode: '\uf270', family: 'brands', color: '#FF9900', bg: '#fff' },
  { id: 'github', label: 'GitHub', unicode: '\uf09b', family: 'brands', color: '#181717', bg: '#fff' },
  { id: 'slack', label: 'Slack', unicode: '\uf198', family: 'brands', color: '#4A154B', bg: '#fff' },
  { id: 'paypal', label: 'PayPal', unicode: '\uf1ed', family: 'brands', color: '#003087', bg: '#fff' },
  { id: 'twitch', label: 'Twitch', unicode: '\uf1e8', family: 'brands', color: '#9146FF', bg: '#fff' },
  { id: 'google-drive', label: 'Drive', unicode: '\uf3aa', family: 'brands', color: '#4285F4', bg: '#fff' },
  { id: 'google-play', label: 'Play Store', unicode: '\uf3ab', family: 'brands', color: '#34A853', bg: '#fff' },
  { id: 'envelope', label: 'Gmail', unicode: '\uf0e0', family: 'solid', color: '#EA4335', bg: '#fff' },
  { id: 'map-marked', label: 'Maps', unicode: '\uf5a0', family: 'solid', color: '#34A853', bg: '#fff' },
  { id: 'shopify', label: 'Shopify', unicode: '\ue057', family: 'brands', color: '#96BF48', bg: '#fff' },
  { id: 'wordpress', label: 'WordPress', unicode: '\uf19a', family: 'brands', color: '#21759B', bg: '#fff' },
  { id: 'medium', label: 'Medium', unicode: '\uf23a', family: 'brands', color: '#000', bg: '#fff' },
  { id: 'scan', label: 'Scan Me', unicode: '\uf029', family: 'solid', color: '#4f46e5', bg: '#fff' },
  { id: 'wifi-logo', label: 'WiFi', unicode: '\uf1eb', family: 'solid', color: '#4f46e5', bg: '#fff' },
  { id: 'globe', label: 'Globe', unicode: '\uf0ac', family: 'solid', color: '#4f46e5', bg: '#fff' },
];

/* Color similarity helper — returns 0..1 (1 = identical) */
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const colorSimilarity = (c1, c2) => {
  try {
    const [r1, g1, b1] = hexToRgb(c1);
    const [r2, g2, b2] = hexToRgb(c2);
    const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    return 1 - dist / 441.67; // max dist = sqrt(255^2*3)
  } catch { return 0; }
};

const FILE_FORMATS = [
  { id: 'png', label: 'PNG', desc: 'Lossless, transparent support', mime: 'image/png', ext: '.png' },
  { id: 'jpg', label: 'JPG', desc: 'Compressed, smaller file', mime: 'image/jpeg', ext: '.jpg' },
  { id: 'webp', label: 'WEBP', desc: 'Modern format, best quality/size', mime: 'image/webp', ext: '.webp' },
  { id: 'svg', label: 'SVG', desc: 'Scalable vector graphic', mime: 'image/svg+xml', ext: '.svg' },
  { id: 'pdf', label: 'PDF', desc: 'Print-ready document', mime: 'application/pdf', ext: '.pdf' },
];

/* ================================================================
   HELPERS — QR rendering
   ================================================================ */

/* Load qrcode-generator from CDN */
const loadQRLib = async () => {
  if (window.qrcode) return;
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
  document.head.appendChild(s);
  await new Promise((resolve, reject) => {
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load QR library'));
  });
};

/* Finder-pattern zone (skip in normal dot loop) */
const isFinderZone = (r, c, count) => {
  if (r <= 7 && c <= 7) return true;
  if (r <= 7 && c >= count - 8) return true;
  if (r >= count - 8 && c <= 7) return true;
  return false;
};

/* Rounded rect helper */
const rrect = (ctx, x, y, w, h, r) => {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/* Draw a single QR module in the given shape */
const drawModule = (ctx, x, y, size, shape) => {
  const p = size * 0.08;
  const s = size - p * 2;
  const cx = x + size / 2;
  const cy = y + size / 2;
  switch (shape) {
    case 'rounded':
      rrect(ctx, x + p, y + p, s, s, s * 0.3);
      ctx.fill();
      break;
    case 'dots':
      ctx.beginPath();
      ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(cx, y + p);
      ctx.lineTo(x + size - p, cy);
      ctx.lineTo(cx, y + size - p);
      ctx.lineTo(x + p, cy);
      ctx.closePath();
      ctx.fill();
      break;
    case 'star': {
      const r1 = s / 2;
      const r2 = r1 * 0.45;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (Math.PI / 180) * (i * 72 - 90);
        const a2 = (Math.PI / 180) * (i * 72 + 36 - 90);
        ctx.lineTo(cx + r1 * Math.cos(a1), cy + r1 * Math.sin(a1));
        ctx.lineTo(cx + r2 * Math.cos(a2), cy + r2 * Math.sin(a2));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'heart': {
      const hs = s * 0.52;
      ctx.beginPath();
      ctx.moveTo(cx, cy + hs * 0.6);
      ctx.bezierCurveTo(cx - hs, cy, cx - hs, cy - hs * 0.7, cx, cy - hs * 0.3);
      ctx.bezierCurveTo(cx + hs, cy - hs * 0.7, cx + hs, cy, cx, cy + hs * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'hexagon': {
      const r = s / 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (i * 60 - 90);
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(cx, y + p);
      ctx.lineTo(x + size - p, y + size - p);
      ctx.lineTo(x + p, y + size - p);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'cross': {
      const arm = s * 0.3;
      ctx.fillRect(cx - arm / 2, y + p, arm, s);
      ctx.fillRect(x + p, cy - arm / 2, s, arm);
      break;
    }
    case 'octagon': {
      const r = s / 2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 180) * (i * 45 - 90);
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'leaf': {
      const r = s / 2;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.quadraticCurveTo(cx - r, cy - r, cx, cy - r);
      ctx.quadraticCurveTo(cx + r, cy - r, cx + r, cy);
      ctx.quadraticCurveTo(cx + r, cy + r, cx, cy + r);
      ctx.quadraticCurveTo(cx - r, cy + r, cx - r, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'thin-diamond': {
      ctx.beginPath();
      ctx.moveTo(cx, y + p);
      ctx.lineTo(cx + s * 0.25, cy);
      ctx.lineTo(cx, y + size - p);
      ctx.lineTo(cx - s * 0.25, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'small-square':
      ctx.fillRect(x + p + s * 0.15, y + p + s * 0.15, s * 0.7, s * 0.7);
      break;
    case 'tiny-dot':
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'vertical-bar':
      ctx.fillRect(cx - s * 0.2, y + p, s * 0.4, s);
      break;
    case 'horizontal-bar':
      ctx.fillRect(x + p, cy - s * 0.2, s, s * 0.4);
      break;
    case 'classy-rounded':
      rrect(ctx, x + p, y + p, s, s, s * 0.5);
      ctx.fill();
      break;
    case 'rotated-square': {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      const rs = s * 0.7;
      ctx.fillRect(-rs / 2, -rs / 2, rs, rs);
      ctx.restore();
      break;
    }
    default: // square
      ctx.fillRect(x + p, y + p, s, s);
  }
};

/* Draw one finder-pattern eye */
const drawFinderEye = (ctx, px, py, cellSize, outerShape, innerShape, fg, bg) => {
  const os = cellSize * 7;
  const ocx = px + os / 2;
  const ocy = py + os / 2;

  /* Helper: draw a polygon (N-gon) */
  const drawRegularPoly = (cx, cy, r, sides, rotation = -Math.PI/2) => {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = rotation + (2 * Math.PI * i) / sides;
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
  };

  /* Outer */
  ctx.fillStyle = fg;
  switch (outerShape) {
    case 'rounded':
      rrect(ctx, px, py, os, os, os * 0.2);
      ctx.fill();
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(ocx, ocy, os / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'diamond-outer': {
      ctx.beginPath();
      ctx.moveTo(ocx, py);
      ctx.lineTo(px + os, ocy);
      ctx.lineTo(ocx, py + os);
      ctx.lineTo(px, ocy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'star-outer': {
      const r1 = os / 2, r2 = r1 * 0.55;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (Math.PI / 180) * (i * 72 - 90);
        const a2 = (Math.PI / 180) * (i * 72 + 36 - 90);
        ctx.lineTo(ocx + r1 * Math.cos(a1), ocy + r1 * Math.sin(a1));
        ctx.lineTo(ocx + r2 * Math.cos(a2), ocy + r2 * Math.sin(a2));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'hexagon-outer':
      drawRegularPoly(ocx, ocy, os / 2, 6);
      ctx.fill();
      break;
    case 'octagon-outer':
      drawRegularPoly(ocx, ocy, os / 2, 8);
      ctx.fill();
      break;
    case 'leaf-outer': {
      ctx.beginPath();
      ctx.moveTo(px, ocy);
      ctx.quadraticCurveTo(px, py, ocx, py);
      ctx.quadraticCurveTo(px + os, py, px + os, ocy);
      ctx.quadraticCurveTo(px + os, py + os, ocx, py + os);
      ctx.quadraticCurveTo(px, py + os, px, ocy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'shield-outer': {
      ctx.beginPath();
      ctx.moveTo(ocx, py);
      ctx.quadraticCurveTo(px + os, py, px + os, ocy);
      ctx.quadraticCurveTo(px + os, py + os, ocx, py + os);
      ctx.quadraticCurveTo(px, py + os, px, ocy);
      ctx.quadraticCurveTo(px, py, ocx, py);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'classy-outer':
      rrect(ctx, px, py, os, os, os * 0.5);
      ctx.fill();
      break;
    case 'dotted-outer':
      ctx.lineWidth = cellSize * 0.6;
      ctx.strokeStyle = fg;
      ctx.setLineDash([cellSize * 0.5, cellSize * 0.5]);
      ctx.strokeRect(px + cellSize * 0.3, py + cellSize * 0.3, os - cellSize * 0.6, os - cellSize * 0.6);
      ctx.setLineDash([]);
      /* fill solid over that */
      ctx.fillRect(px, py, os, os);
      break;
    case 'thick-outer':
      ctx.fillRect(px, py, os, os);
      break;
    case 'double-outer':
      ctx.strokeStyle = fg;
      ctx.lineWidth = cellSize * 0.5;
      ctx.strokeRect(px + cellSize * 0.25, py + cellSize * 0.25, os - cellSize * 0.5, os - cellSize * 0.5);
      ctx.fillRect(px, py, os, os);
      break;
    case 'inset-outer':
      rrect(ctx, px, py, os, os, os * 0.12);
      ctx.fill();
      break;
    case 'petal-outer': {
      ctx.beginPath();
      ctx.moveTo(ocx, py);
      ctx.bezierCurveTo(px + os * 0.75, py, px + os, py + os * 0.25, px + os, ocy);
      ctx.bezierCurveTo(px + os, py + os * 0.75, px + os * 0.75, py + os, ocx, py + os);
      ctx.bezierCurveTo(px + os * 0.25, py + os, px, py + os * 0.75, px, ocy);
      ctx.bezierCurveTo(px, py + os * 0.25, px + os * 0.25, py, ocx, py);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      ctx.fillRect(px, py, os, os);
  }
  /* Inner clear (5 cells) */
  const g = cellSize;
  const is = cellSize * 5;
  ctx.fillStyle = bg;
  switch (outerShape) {
    case 'rounded':
    case 'classy-outer':
      rrect(ctx, px + g, py + g, is, is, is * 0.15);
      ctx.fill();
      break;
    case 'circle':
    case 'dotted-outer':
      ctx.beginPath();
      ctx.arc(ocx, ocy, is / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'diamond-outer':
      ctx.beginPath();
      ctx.moveTo(ocx, py + g);
      ctx.lineTo(px + os - g, ocy);
      ctx.lineTo(ocx, py + os - g);
      ctx.lineTo(px + g, ocy);
      ctx.closePath();
      ctx.fill();
      break;
    case 'star-outer': {
      const r1 = is / 2, r2 = r1 * 0.55;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (Math.PI / 180) * (i * 72 - 90);
        const a2 = (Math.PI / 180) * (i * 72 + 36 - 90);
        ctx.lineTo(ocx + r1 * Math.cos(a1), ocy + r1 * Math.sin(a1));
        ctx.lineTo(ocx + r2 * Math.cos(a2), ocy + r2 * Math.sin(a2));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'hexagon-outer':
      drawRegularPoly(ocx, ocy, is / 2, 6);
      ctx.fill();
      break;
    case 'octagon-outer':
      drawRegularPoly(ocx, ocy, is / 2, 8);
      ctx.fill();
      break;
    case 'leaf-outer':
    case 'petal-outer': {
      ctx.beginPath();
      ctx.moveTo(px + g, ocy);
      ctx.quadraticCurveTo(px + g, py + g, ocx, py + g);
      ctx.quadraticCurveTo(px + os - g, py + g, px + os - g, ocy);
      ctx.quadraticCurveTo(px + os - g, py + os - g, ocx, py + os - g);
      ctx.quadraticCurveTo(px + g, py + os - g, px + g, ocy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'shield-outer': {
      ctx.beginPath();
      ctx.moveTo(ocx, py + g);
      ctx.quadraticCurveTo(px + os - g, py + g, px + os - g, ocy);
      ctx.quadraticCurveTo(px + os - g, py + os - g, ocx, py + os - g);
      ctx.quadraticCurveTo(px + g, py + os - g, px + g, ocy);
      ctx.quadraticCurveTo(px + g, py + g, ocx, py + g);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      ctx.fillRect(px + g, py + g, is, is);
  }
  /* Core (3 cells) */
  const cg = cellSize * 2;
  const cs = cellSize * 3;
  ctx.fillStyle = fg;
  switch (innerShape) {
    case 'rounded':
      rrect(ctx, px + cg, py + cg, cs, cs, cs * 0.25);
      ctx.fill();
      break;
    case 'dot':
      ctx.beginPath();
      ctx.arc(ocx, ocy, cs / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(ocx, ocy - cs / 2);
      ctx.lineTo(ocx + cs / 2, ocy);
      ctx.lineTo(ocx, ocy + cs / 2);
      ctx.lineTo(ocx - cs / 2, ocy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'star-inner': {
      const r1 = cs / 2, r2 = r1 * 0.45;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (Math.PI / 180) * (i * 72 - 90);
        const a2 = (Math.PI / 180) * (i * 72 + 36 - 90);
        ctx.lineTo(ocx + r1 * Math.cos(a1), ocy + r1 * Math.sin(a1));
        ctx.lineTo(ocx + r2 * Math.cos(a2), ocy + r2 * Math.sin(a2));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'hexagon-inner':
      drawRegularPoly(ocx, ocy, cs / 2, 6);
      ctx.fill();
      break;
    case 'octagon-inner':
      drawRegularPoly(ocx, ocy, cs / 2, 8);
      ctx.fill();
      break;
    case 'heart-inner': {
      const hs = cs * 0.52;
      ctx.beginPath();
      ctx.moveTo(ocx, ocy + hs * 0.6);
      ctx.bezierCurveTo(ocx - hs, ocy, ocx - hs, ocy - hs * 0.7, ocx, ocy - hs * 0.3);
      ctx.bezierCurveTo(ocx + hs, ocy - hs * 0.7, ocx + hs, ocy, ocx, ocy + hs * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'cross-inner': {
      const arm = cs * 0.3;
      ctx.fillRect(ocx - arm / 2, ocy - cs / 2, arm, cs);
      ctx.fillRect(ocx - cs / 2, ocy - arm / 2, cs, arm);
      break;
    }
    case 'leaf-inner': {
      ctx.beginPath();
      ctx.moveTo(ocx - cs / 2, ocy);
      ctx.quadraticCurveTo(ocx - cs / 2, ocy - cs / 2, ocx, ocy - cs / 2);
      ctx.quadraticCurveTo(ocx + cs / 2, ocy - cs / 2, ocx + cs / 2, ocy);
      ctx.quadraticCurveTo(ocx + cs / 2, ocy + cs / 2, ocx, ocy + cs / 2);
      ctx.quadraticCurveTo(ocx - cs / 2, ocy + cs / 2, ocx - cs / 2, ocy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'triangle-inner': {
      ctx.beginPath();
      ctx.moveTo(ocx, ocy - cs / 2);
      ctx.lineTo(ocx + cs / 2, ocy + cs / 2);
      ctx.lineTo(ocx - cs / 2, ocy + cs / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'thin-diamond-inner': {
      ctx.beginPath();
      ctx.moveTo(ocx, ocy - cs / 2);
      ctx.lineTo(ocx + cs * 0.25, ocy);
      ctx.lineTo(ocx, ocy + cs / 2);
      ctx.lineTo(ocx - cs * 0.25, ocy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'ring-inner':
      ctx.beginPath();
      ctx.arc(ocx, ocy, cs / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(ocx, ocy, cs * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fg;
      break;
    case 'classy-inner':
      rrect(ctx, px + cg, py + cg, cs, cs, cs * 0.5);
      ctx.fill();
      break;
    case 'shield-inner': {
      ctx.beginPath();
      ctx.moveTo(ocx, ocy - cs / 2);
      ctx.quadraticCurveTo(ocx + cs / 2, ocy - cs / 2, ocx + cs / 2, ocy);
      ctx.quadraticCurveTo(ocx + cs / 2, ocy + cs / 2, ocx, ocy + cs / 2);
      ctx.quadraticCurveTo(ocx - cs / 2, ocy + cs / 2, ocx - cs / 2, ocy);
      ctx.quadraticCurveTo(ocx - cs / 2, ocy - cs / 2, ocx, ocy - cs / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      ctx.fillRect(px + cg, py + cg, cs, cs);
  }
};

/* Draw frame decoration on canvas */
const drawFrame = (ctx, fid, w, h, margin, qrPxSize) => {
  const qx = margin;
  const qy = margin;
  const qs = qrPxSize;
  switch (fid) {
    case 'simple':
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeRect(qx - 14, qy - 14, qs + 28, qs + 28);
      break;
    case 'bold':
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 12;
      ctx.strokeRect(qx - 20, qy - 20, qs + 40, qs + 40);
      break;
    case 'rounded':
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 6;
      rrect(ctx, qx - 16, qy - 16, qs + 32, qs + 32, 24);
      ctx.stroke();
      break;
    case 'double':
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeRect(qx - 10, qy - 10, qs + 20, qs + 20);
      ctx.strokeRect(qx - 18, qy - 18, qs + 36, qs + 36);
      break;
    case 'dashed':
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 6]);
      ctx.strokeRect(qx - 14, qy - 14, qs + 28, qs + 28);
      ctx.setLineDash([]);
      break;
    case 'shadow':
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#fff';
      ctx.fillRect(qx - 12, qy - 12, qs + 24, qs + 24);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(qx - 12, qy - 12, qs + 24, qs + 24);
      break;
    case 'polaroid':
      ctx.fillStyle = '#fff';
      ctx.fillRect(qx - 20, qy - 20, qs + 40, qs + 80);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.strokeRect(qx - 20, qy - 20, qs + 40, qs + 80);
      ctx.fillStyle = '#1e1b4b';
      ctx.font = '600 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', qx + qs / 2, qy + qs + 46);
      break;
    case 'stamp': {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      const pad = 16;
      const sx = qx - pad;
      const sy = qy - pad;
      const sw = qs + pad * 2;
      const sh = qs + pad * 2;
      ctx.strokeRect(sx, sy, sw, sh);
      const seg = 10;
      for (let i = 0; i < sw; i += seg) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(sx + i + seg / 2, sy - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + i + seg / 2, sy + sh + 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < sh; i += seg) {
        ctx.beginPath();
        ctx.arc(sx - 4, sy + i + seg / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + sw + 4, sy + i + seg / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'scan-me':
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 5;
      rrect(ctx, qx - 16, qy - 16, qs + 32, qs + 56, 14);
      ctx.stroke();
      ctx.fillStyle = '#4f46e5';
      ctx.font = '700 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN ME', qx + qs / 2, qy + qs + 28);
      break;
    case 'scan-here':
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeRect(qx - 14, qy - 14, qs + 28, qs + 52);
      ctx.fillStyle = '#000';
      ctx.font = '600 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('↑ SCAN HERE ↑', qx + qs / 2, qy + qs + 28);
      break;
    case 'brackets': {
      const bLen = 40;
      const bPad = 12;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      /* TL */
      ctx.beginPath(); ctx.moveTo(qx - bPad, qy - bPad + bLen); ctx.lineTo(qx - bPad, qy - bPad); ctx.lineTo(qx - bPad + bLen, qy - bPad); ctx.stroke();
      /* TR */
      ctx.beginPath(); ctx.moveTo(qx + qs + bPad - bLen, qy - bPad); ctx.lineTo(qx + qs + bPad, qy - bPad); ctx.lineTo(qx + qs + bPad, qy - bPad + bLen); ctx.stroke();
      /* BL */
      ctx.beginPath(); ctx.moveTo(qx - bPad, qy + qs + bPad - bLen); ctx.lineTo(qx - bPad, qy + qs + bPad); ctx.lineTo(qx - bPad + bLen, qy + qs + bPad); ctx.stroke();
      /* BR */
      ctx.beginPath(); ctx.moveTo(qx + qs + bPad - bLen, qy + qs + bPad); ctx.lineTo(qx + qs + bPad, qy + qs + bPad); ctx.lineTo(qx + qs + bPad, qy + qs + bPad - bLen); ctx.stroke();
      ctx.lineCap = 'butt';
      break;
    }
    case 'corners': {
      const cLen = 50;
      const cPad = 10;
      ctx.fillStyle = '#4f46e5';
      [
        [qx - cPad, qy - cPad, cLen, 6],
        [qx - cPad, qy - cPad, 6, cLen],
        [qx + qs + cPad - cLen, qy - cPad, cLen, 6],
        [qx + qs + cPad - 6, qy - cPad, 6, cLen],
        [qx - cPad, qy + qs + cPad - 6, cLen, 6],
        [qx - cPad, qy + qs + cPad - cLen, 6, cLen],
        [qx + qs + cPad - cLen, qy + qs + cPad - 6, cLen, 6],
        [qx + qs + cPad - 6, qy + qs + cPad - cLen, 6, cLen],
      ].forEach(([fx, fy, fw, fh]) => ctx.fillRect(fx, fy, fw, fh));
      break;
    }
    case 'elegant': {
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 3;
      ctx.strokeRect(qx - 14, qy - 14, qs + 28, qs + 28);
      /* ornamental circles at corners */
      const eRad = 8;
      ctx.fillStyle = '#b8860b';
      [[qx - 14, qy - 14], [qx + qs + 14, qy - 14], [qx - 14, qy + qs + 14], [qx + qs + 14, qy + qs + 14]].forEach(([ex, ey]) => {
        ctx.beginPath(); ctx.arc(ex, ey, eRad, 0, Math.PI * 2); ctx.fill();
      });
      /* small lines outward from each corner */
      ctx.lineWidth = 2;
      [[qx - 14, qy - 14, -1, -1], [qx + qs + 14, qy - 14, 1, -1], [qx - 14, qy + qs + 14, -1, 1], [qx + qs + 14, qy + qs + 14, 1, 1]].forEach(([ex, ey, dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + dx * 16, ey + dy * 16); ctx.stroke();
      });
      break;
    }
    case 'modern':
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(qx - 6, qy + qs + 4, qs + 12, 8);
      rrect(ctx, qx - 6, qy - 6, qs + 12, qs + 20, 6);
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
    case 'neon-blue': {
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 5;
      rrect(ctx, qx - 14, qy - 14, qs + 28, qs + 28, 12);
      ctx.stroke();
      ctx.stroke(); /* double pass for glow */
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      break;
    }
    case 'neon-pink': {
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 5;
      rrect(ctx, qx - 14, qy - 14, qs + 28, qs + 28, 12);
      ctx.stroke();
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      break;
    }
    case 'gold': {
      const grad = ctx.createLinearGradient(qx, qy, qx + qs, qy + qs);
      grad.addColorStop(0, '#d4a017');
      grad.addColorStop(0.5, '#f5e6a3');
      grad.addColorStop(1, '#b8860b');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 8;
      ctx.strokeRect(qx - 18, qy - 18, qs + 36, qs + 36);
      break;
    }
    case 'gradient-warm': {
      const grad = ctx.createLinearGradient(qx, qy, qx + qs, qy + qs);
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(1, '#ef4444');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 8;
      rrect(ctx, qx - 16, qy - 16, qs + 32, qs + 32, 14);
      ctx.stroke();
      break;
    }
    case 'gradient-cool': {
      const grad = ctx.createLinearGradient(qx, qy, qx + qs, qy + qs);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#06b6d4');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 8;
      rrect(ctx, qx - 16, qy - 16, qs + 32, qs + 32, 14);
      ctx.stroke();
      break;
    }
    default:
      break;
  }
};

/* ================================================================
   COMPONENT
   ================================================================ */

const QRCodeGenerator = () => {
  /* ---- phase ---- */
  const [phase, setPhase] = useState('input'); // 'input' | 'customize'

  /* ---- input-phase state ---- */
  const [inputTab, setInputTab] = useState('url');
  const [urlValue, setUrlValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiEnc, setWifiEnc] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [mapQuery, setMapQuery] = useState('');
  const [mapLat, setMapLat] = useState('');
  const [mapLng, setMapLng] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [mapSearching, setMapSearching] = useState(false);

  /* ---- customize-phase state ---- */
  const [toolTab, setToolTab] = useState('style');
  const [qrData, setQrData] = useState(null);       // qrcode-generator object
  const [qrString, setQrString] = useState('');       // raw data string
  const [dotShape, setDotShape] = useState('square');
  const [cornerOuter, setCornerOuter] = useState('square');
  const [cornerInner, setCornerInner] = useState('square');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [gradientOn, setGradientOn] = useState(false);
  const [gradColor1, setGradColor1] = useState('#000000');
  const [gradColor2, setGradColor2] = useState('#4f46e5');
  const [gradType, setGradType] = useState('linear'); // linear | radial
  const [gradAngle, setGradAngle] = useState(135);
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [selectedLogo, setSelectedLogo] = useState(LOGOS[0]);
  const [customLogoImg, setCustomLogoImg] = useState(null); // data URL of uploaded logo
  const [fileFormat, setFileFormat] = useState('png');
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  /* ---- lock body scroll when mobile tools panel is open ---- */
  useEffect(() => {
    if (mobileToolsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileToolsOpen]);

  /* ---- refs ---- */
  const canvasRef = useRef(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const customLogoInputRef = useRef(null);

  /* ---- Leaflet for maps ---- */
  const loadLeaflet = useCallback(async () => {
    if (window.L) return;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    document.head.appendChild(s);
    await new Promise((r) => { s.onload = r; });
  }, []);

  /* Init map when Maps tab selected */
  useEffect(() => {
    if (inputTab !== 'maps' || phase !== 'input') return;
    let cancelled = false;
    const init = async () => {
      await loadLeaflet();
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      const L = window.L;
      const map = L.map(mapContainerRef.current).setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      const marker = L.marker([20, 0], { draggable: true }).addTo(map);
      markerRef.current = marker;
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setMapLat(e.latlng.lat.toFixed(6));
        setMapLng(e.latlng.lng.toFixed(6));
        setMapQuery('');
      });
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        setMapLat(p.lat.toFixed(6));
        setMapLng(p.lng.toFixed(6));
      });
    };
    init();
    return () => { cancelled = true; };
  }, [inputTab, phase, loadLeaflet]);

  /* Cleanup map when leaving maps tab */
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  /* ---- search location (Nominatim) ---- */
  const searchMapLocation = async () => {
    if (!mapQuery.trim()) return;
    setMapSearching(true);
    setMapSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapQuery)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setMapSearchResults(data);
      if (data.length > 0) {
        const { lat, lon } = data[0];
        setMapLat(parseFloat(lat).toFixed(6));
        setMapLng(parseFloat(lon).toFixed(6));
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lon], 15);
          markerRef.current.setLatLng([lat, lon]);
        }
      }
    } catch (e) {
      console.error('Search error:', e);
    }
    setMapSearching(false);
  };

  const selectSearchResult = (item) => {
    setMapLat(parseFloat(item.lat).toFixed(6));
    setMapLng(parseFloat(item.lon).toFixed(6));
    setMapQuery(item.display_name);
    setMapSearchResults([]);
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([item.lat, item.lon], 15);
      markerRef.current.setLatLng([item.lat, item.lon]);
    }
  };

  /* ---- build QR data string ---- */
  const buildQRString = useCallback(() => {
    switch (inputTab) {
      case 'url': return urlValue.trim();
      case 'text': return textValue.trim();
      case 'wifi':
        return `WIFI:T:${wifiEnc};S:${wifiSSID};P:${wifiPass};H:${wifiHidden ? 'true' : 'false'};;`;
      case 'contact': {
        if (contactName) {
          return `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL:${contactPhone}\nEND:VCARD`;
        }
        return `tel:${contactPhone}`;
      }
      case 'email': {
        let url = `mailto:${emailTo}`;
        const params = [];
        if (emailSubject) params.push(`subject=${emailSubject.replace(/ /g, '%20')}`);
        if (emailBody) params.push(`body=${emailBody.replace(/ /g, '%20').replace(/\n/g, '%0A')}`);
        if (params.length) url += '?' + params.join('&');
        return url;
      }
      case 'maps':
        if (mapLat && mapLng) return `https://maps.google.com/?q=${mapLat},${mapLng}`;
        return '';
      default: return '';
    }
  }, [inputTab, urlValue, textValue, wifiSSID, wifiPass, wifiEnc, wifiHidden, contactName, contactPhone, emailTo, emailSubject, emailBody, mapLat, mapLng]);

  /* ---- generate QR code ---- */
  const handleGenerate = async () => {
    const data = buildQRString();
    if (!data) return;
    try {
      await loadQRLib();
      const qr = window.qrcode(0, 'H');
      qr.addData(data);
      qr.make();
      setQrData(qr);
      setQrString(data);
      setPhase('customize');
      setMobileToolsOpen(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  /* ---- render QR to canvas ---- */
  const renderQR = useCallback(async () => {
    if (!qrData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const moduleCount = qrData.getModuleCount();

    /* Canvas size */
    const baseSize = 1024;
    const marginPx = Math.floor(baseSize * 0.06);
    const needsExtraBottom = ['scan-me', 'scan-here', 'polaroid'].includes(selectedFrame);
    const totalW = baseSize;
    const totalH = needsExtraBottom ? baseSize + 80 : baseSize;
    canvas.width = totalW;
    canvas.height = totalH;

    /* Background */
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalW, totalH);

    /* QR drawing area */
    const qrPxSize = baseSize - marginPx * 2;
    const cellSize = qrPxSize / moduleCount;

    /* Draw frame background-layer parts (shadow etc.) */
    if (selectedFrame === 'shadow' || selectedFrame === 'polaroid') {
      drawFrame(ctx, selectedFrame, totalW, totalH, marginPx, qrPxSize);
    }

    /* Build fill style */
    let fillStyle;
    if (gradientOn) {
      const angleRad = (gradAngle * Math.PI) / 180;
      const cx = marginPx + qrPxSize / 2;
      const cy = marginPx + qrPxSize / 2;
      const r = qrPxSize / 2;
      if (gradType === 'linear') {
        const x1 = cx - r * Math.cos(angleRad);
        const y1 = cy - r * Math.sin(angleRad);
        const x2 = cx + r * Math.cos(angleRad);
        const y2 = cy + r * Math.sin(angleRad);
        fillStyle = ctx.createLinearGradient(x1, y1, x2, y2);
      } else {
        fillStyle = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      }
      fillStyle.addColorStop(0, gradColor1);
      fillStyle.addColorStop(1, gradColor2);
    } else {
      fillStyle = fgColor;
    }

    /* Draw finder-pattern eyes */
    const finderPositions = [
      [marginPx, marginPx],
      [marginPx + (moduleCount - 7) * cellSize, marginPx],
      [marginPx, marginPx + (moduleCount - 7) * cellSize],
    ];
    finderPositions.forEach(([fx, fy]) => {
      drawFinderEye(ctx, fx, fy, cellSize, cornerOuter, cornerInner, typeof fillStyle === 'string' ? fillStyle : fgColor, bgColor);
    });

    /* Draw data modules (skip finder zones) */
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (isFinderZone(row, col, moduleCount)) continue;
        if (!qrData.isDark(row, col)) continue;
        const x = marginPx + col * cellSize;
        const y = marginPx + row * cellSize;
        ctx.fillStyle = fillStyle;
        drawModule(ctx, x, y, cellSize, dotShape);
      }
    }

    /* Draw logo */
    const logo = selectedLogo;
    if (logo && logo.id !== 'none') {
      const logoSize = qrPxSize * 0.18;
      const lcx = marginPx + qrPxSize / 2;
      const lcy = marginPx + qrPxSize / 2;
      /* White circle background */
      ctx.fillStyle = logo.bg || '#fff';
      ctx.beginPath();
      ctx.arc(lcx, lcy, logoSize * 0.72, 0, Math.PI * 2);
      ctx.fill();
      /* Draw icon using Font Awesome */
      const fontFamily = logo.family === 'brands' ? '"Font Awesome 6 Brands"' : '"Font Awesome 6 Free"';
      const fontWeight = logo.family === 'brands' ? '400' : '900';
      try {
        await document.fonts.load(`${fontWeight} ${Math.round(logoSize)}px ${fontFamily}`);
      } catch (e) { /* ignore font load errors */ }
      ctx.fillStyle = logo.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${fontWeight} ${Math.round(logoSize)}px ${fontFamily}`;
      ctx.fillText(logo.unicode, lcx, lcy);
    } else if (customLogoImg) {
      /* Custom uploaded logo */
      const img = new Image();
      img.src = customLogoImg;
      await new Promise((r) => { img.onload = r; img.onerror = r; });
      const logoSize = qrPxSize * 0.18;
      const lcx = marginPx + qrPxSize / 2;
      const lcy = marginPx + qrPxSize / 2;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(lcx, lcy, logoSize * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(lcx, lcy, logoSize * 0.6, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, lcx - logoSize * 0.6, lcy - logoSize * 0.6, logoSize * 1.2, logoSize * 1.2);
      ctx.restore();
    }

    /* Draw frame foreground (on top) */
    if (selectedFrame !== 'none' && selectedFrame !== 'shadow' && selectedFrame !== 'polaroid') {
      drawFrame(ctx, selectedFrame, totalW, totalH, marginPx, qrPxSize);
    }
    /* Re-draw polaroid/scan frames on top */
    if (selectedFrame === 'polaroid') {
      /* Already drawn in background layer */
    }
    if (selectedFrame === 'scan-me' || selectedFrame === 'scan-here') {
      drawFrame(ctx, selectedFrame, totalW, totalH, marginPx, qrPxSize);
    }
  }, [qrData, dotShape, cornerOuter, cornerInner, fgColor, bgColor, gradientOn, gradColor1, gradColor2, gradType, gradAngle, selectedFrame, selectedLogo, customLogoImg]);

  /* Re-render QR whenever options change */
  useEffect(() => {
    if (phase === 'customize') renderQR();
  }, [phase, renderQR]);

  /* ---- generate SVG string ---- */
  const generateSVG = useCallback(() => {
    if (!qrData) return '';
    const mc = qrData.getModuleCount();
    const margin = 2;
    const total = mc + margin * 2;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="1024" height="1024">`;
    svg += `<rect width="${total}" height="${total}" fill="${bgColor}"/>`;
    if (gradientOn) {
      svg += '<defs>';
      if (gradType === 'linear') {
        const a = gradAngle;
        const x1 = 50 - 50 * Math.cos((a * Math.PI) / 180);
        const y1 = 50 - 50 * Math.sin((a * Math.PI) / 180);
        const x2 = 50 + 50 * Math.cos((a * Math.PI) / 180);
        const y2 = 50 + 50 * Math.sin((a * Math.PI) / 180);
        svg += `<linearGradient id="g" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
      } else {
        svg += '<radialGradient id="g">';
      }
      svg += `<stop offset="0%" stop-color="${gradColor1}"/>`;
      svg += `<stop offset="100%" stop-color="${gradColor2}"/>`;
      svg += gradType === 'linear' ? '</linearGradient>' : '</radialGradient>';
      svg += '</defs>';
    }
    const fill = gradientOn ? 'url(#g)' : fgColor;
    for (let r = 0; r < mc; r++) {
      for (let c = 0; c < mc; c++) {
        if (!qrData.isDark(r, c)) continue;
        const x = margin + c;
        const y = margin + r;
        switch (dotShape) {
          case 'dots':
            svg += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.42" fill="${fill}"/>`;
            break;
          case 'rounded':
            svg += `<rect x="${x + 0.06}" y="${y + 0.06}" width="0.88" height="0.88" rx="0.25" fill="${fill}"/>`;
            break;
          case 'diamond':
            svg += `<polygon points="${x + 0.5},${y + 0.08} ${x + 0.92},${y + 0.5} ${x + 0.5},${y + 0.92} ${x + 0.08},${y + 0.5}" fill="${fill}"/>`;
            break;
          default:
            svg += `<rect x="${x + 0.06}" y="${y + 0.06}" width="0.88" height="0.88" fill="${fill}"/>`;
        }
      }
    }
    svg += '</svg>';
    return svg;
  }, [qrData, dotShape, bgColor, fgColor, gradientOn, gradType, gradAngle, gradColor1, gradColor2]);

  /* ---- download ---- */
  const handleDownload = useCallback(async () => {
    if (fileFormat === 'svg') {
      const svgStr = generateSVG();
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'qrcode.svg';
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    if (fileFormat === 'pdf') {
      /* Load jsPDF from CDN */
      if (!window.jspdf) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(s);
        await new Promise((r) => { s.onload = r; });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'px', format: [canvasRef.current.width, canvasRef.current.height] });
      const imgData = canvasRef.current.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 0, 0, canvasRef.current.width, canvasRef.current.height);
      doc.save('qrcode.pdf');
      return;
    }
    const canvas = canvasRef.current;
    const fmt = FILE_FORMATS.find((f) => f.id === fileFormat);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `qrcode${fmt.ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      fmt.mime,
      1
    );
  }, [fileFormat, generateSVG]);

  /* ---- custom logo upload ---- */
  const handleCustomLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomLogoImg(reader.result);
      setSelectedLogo(LOGOS[0]); // reset branded logo
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ---- back to input ---- */
  const handleBack = () => {
    setPhase('input');
    setQrData(null);
  };

  /* ---- can generate? ---- */
  const canGenerate = (() => {
    switch (inputTab) {
      case 'url': return urlValue.trim().length > 0;
      case 'text': return textValue.trim().length > 0;
      case 'wifi': return wifiSSID.trim().length > 0;
      case 'contact': return contactPhone.trim().length > 0;
      case 'email': return emailTo.trim().length > 0;
      case 'maps': return (mapLat && mapLng);
      default: return false;
    }
  })();

  /* ================================================================
     INPUT PHASE
     ================================================================ */
  if (phase === 'input') {
    return (
      <>
        <SEO
          title="QR Code Generator — Create & Customize Free | favIMG"
          description="Generate custom QR codes for URLs, text, WiFi, contacts, email and Google Maps locations. Customize colors, shapes, frames, logos and download in multiple formats."
          keywords="qr code generator, custom qr code, qr code maker, generate qr code free, qr code with logo"
        />
        <section className="qr-upload">
          <div className="qr-upload__inner">
            <h1 className="qr-upload__title">QR Code Generator</h1>
            <p className="qr-upload__desc">
              Generate, customize and download QR codes for URLs, text, WiFi, contacts, email &amp; maps. Fully free, runs in your browser.
            </p>

            {/* Generator ↔ Scanner pills */}
            <div className="qr-mode-pills">
              <span className="qr-mode-pill qr-mode-pill--active">
                <i className="fa-solid fa-qrcode"></i> Generate
              </span>
              <Link to="/qr-code-scanner" className="qr-mode-pill">
                <i className="fa-solid fa-expand"></i> Scan QR Code
              </Link>
            </div>

            {/* Sub-navigation */}
            <div className="qr-input-nav">
              {INPUT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`qr-input-nav__tab ${inputTab === tab.id ? 'active' : ''}`}
                  onClick={() => setInputTab(tab.id)}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Form area (styled similar to dropzone) */}
            <div className="qr-form-card">
              <div className="qr-form-card__icon">
                <i className="fa-solid fa-qrcode"></i>
              </div>

              {/* URL */}
              {inputTab === 'url' && (
                <div className="qr-form">
                  <label className="qr-form__label">Enter URL</label>
                  <input
                    type="url"
                    className="qr-form__input"
                    placeholder="https://example.com"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canGenerate && handleGenerate()}
                  />
                </div>
              )}

              {/* Text */}
              {inputTab === 'text' && (
                <div className="qr-form">
                  <label className="qr-form__label">Enter Text</label>
                  <textarea
                    className="qr-form__textarea"
                    placeholder="Type your text here…"
                    rows={4}
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                  />
                  <div className="qr-char-count-row">
                    <span className={`qr-char-count ${textValue.length > 400 ? 'qr-char-count--danger' : textValue.length > 200 ? 'qr-char-count--warn' : ''}`}>
                      {textValue.length} characters
                    </span>
                  </div>
                  {textValue.length > 200 && textValue.length <= 400 && (
                    <div className="qr-char-warning qr-char-warning--yellow">
                      <i className="fa-solid fa-triangle-exclamation"></i> QR code is getting complex — may be hard to scan.
                    </div>
                  )}
                  {textValue.length > 400 && (
                    <div className="qr-char-warning qr-char-warning--red">
                      <i className="fa-solid fa-circle-exclamation"></i> QR code is too complex! Most scanners will fail to read it.
                    </div>
                  )}
                </div>
              )}

              {/* WiFi */}
              {inputTab === 'wifi' && (
                <div className="qr-form">
                  <label className="qr-form__label">Network Name (SSID)</label>
                  <input className="qr-form__input" placeholder="My WiFi" value={wifiSSID} onChange={(e) => setWifiSSID(e.target.value)} />
                  <label className="qr-form__label">Password</label>
                  <input className="qr-form__input" type="password" placeholder="Password" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} />
                  <label className="qr-form__label">Encryption</label>
                  <select className="qr-form__select" value={wifiEnc} onChange={(e) => setWifiEnc(e.target.value)}>
                    <option value="WPA">WPA / WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None</option>
                  </select>
                  <label className="qr-form__checkbox">
                    <input type="checkbox" checked={wifiHidden} onChange={(e) => setWifiHidden(e.target.checked)} />
                    Hidden Network
                  </label>
                </div>
              )}

              {/* Contact */}
              {inputTab === 'contact' && (
                <div className="qr-form">
                  <label className="qr-form__label">Contact Name (optional)</label>
                  <input className="qr-form__input" placeholder="John Doe" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                  <label className="qr-form__label">Phone Number</label>
                  <input className="qr-form__input" type="tel" placeholder="+1 234 567 8900" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
              )}

              {/* Gmail */}
              {inputTab === 'email' && (
                <div className="qr-form">
                  <label className="qr-form__label">Email Address</label>
                  <input className="qr-form__input" type="email" placeholder="example@gmail.com" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
                  <label className="qr-form__label">Subject (optional)</label>
                  <input className="qr-form__input" placeholder="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                  <label className="qr-form__label">Body (optional)</label>
                  <textarea className="qr-form__textarea" rows={3} placeholder="Email body…" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
                </div>
              )}

              {/* Google Maps */}
              {inputTab === 'maps' && (
                <div className="qr-form">
                  <label className="qr-form__label">Search Location</label>
                  <div className="qr-form__search-row">
                    <input
                      className="qr-form__input"
                      placeholder="Search city, address, place…"
                      value={mapQuery}
                      onChange={(e) => setMapQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchMapLocation()}
                    />
                    <button className="qr-form__search-btn" onClick={searchMapLocation} disabled={mapSearching}>
                      <i className={mapSearching ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-magnifying-glass'}></i>
                    </button>
                  </div>
                  {mapSearchResults.length > 0 && (
                    <ul className="qr-form__search-results">
                      {mapSearchResults.map((item, idx) => (
                        <li key={idx} onClick={() => selectSearchResult(item)}>
                          <i className="fa-solid fa-location-dot"></i> {item.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="qr-form__map-container" ref={mapContainerRef}></div>
                  {mapLat && mapLng && (
                    <div className="qr-form__coords">
                      <span>Lat: <strong>{mapLat}</strong></span>
                      <span>Lng: <strong>{mapLng}</strong></span>
                    </div>
                  )}
                </div>
              )}

              <button className="qr-form-card__btn" onClick={handleGenerate} disabled={!canGenerate}>
                <i className="fa-solid fa-wand-magic-sparkles"></i> Generate &amp; Customize
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* ================================================================
     CUSTOMIZE PHASE
     ================================================================ */
  return (
    <>
      <SEO
        title="Customize QR Code — favIMG QR Code Generator"
        description="Customize your QR code's style, color, frame and logo. Download in PNG, JPG, SVG, WEBP or PDF."
        keywords="customize qr code, qr code style, qr code color, qr code logo, qr code frames"
      />

      <section className="qr-workspace">
        {/* Mobile toggle */}
        <button className="qr-settings-toggle" onClick={() => setMobileToolsOpen((p) => !p)} aria-label="Toggle tools panel">
          <i className={mobileToolsOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-gear'}></i>
        </button>
        {mobileToolsOpen && <div className="qr-overlay" onClick={() => setMobileToolsOpen(false)} />}

        {/* ---------- LEFT PANEL (tools 75%) ---------- */}
        <div className={`qr-left ${mobileToolsOpen ? 'qr-left--open' : ''}`}>
          {/* Back button + tool tabs in same flex row */}
          <div className="qr-left__header">
            <button className="qr-left__back" onClick={handleBack}>
              <i className="fa-solid fa-arrow-left"></i> Edit QR Data
            </button>

            {/* Tool sub-nav */}
            <div className="qr-tool-nav">
              {TOOL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`qr-tool-nav__tab ${toolTab === tab.id ? 'active' : ''}`}
                  onClick={() => setToolTab(tab.id)}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tool content */}
          <div className="qr-tool-content">
            {/* ---- STYLE & SHAPE ---- */}
            {toolTab === 'style' && (
              <div className="qr-tool-section">
                <h4 className="qr-tool-section__title">Dot Shape</h4>
                <div className="qr-shape-grid">
                  {DOT_SHAPES.map((s) => (
                    <button key={s.id} className={`qr-shape-btn ${dotShape === s.id ? 'active' : ''}`} onClick={() => setDotShape(s.id)}>
                      <svg viewBox="0 0 50 50" className="qr-shape-btn__svg">
                        {s.id === 'square' && <><rect x="4" y="4" width="18" height="18" fill="currentColor"/><rect x="28" y="4" width="18" height="18" fill="currentColor"/><rect x="4" y="28" width="18" height="18" fill="currentColor"/></>}
                        {s.id === 'rounded' && <><rect x="4" y="4" width="18" height="18" rx="5" fill="currentColor"/><rect x="28" y="4" width="18" height="18" rx="5" fill="currentColor"/><rect x="4" y="28" width="18" height="18" rx="5" fill="currentColor"/></>}
                        {s.id === 'dots' && <><circle cx="13" cy="13" r="9" fill="currentColor"/><circle cx="37" cy="13" r="9" fill="currentColor"/><circle cx="13" cy="37" r="9" fill="currentColor"/></>}
                        {s.id === 'diamond' && <><polygon points="13,4 22,13 13,22 4,13" fill="currentColor"/><polygon points="37,4 46,13 37,22 28,13" fill="currentColor"/><polygon points="13,28 22,37 13,46 4,37" fill="currentColor"/></>}
                        {s.id === 'heart' && <><path d="M13,20 Q13,10 8,10 Q3,10 3,15 Q3,20 13,26 Q23,20 23,15 Q23,10 18,10 Q13,10 13,20Z" fill="currentColor"/></>}
                        {s.id === 'hexagon' && <><polygon points="13,4 21,8.5 21,17.5 13,22 5,17.5 5,8.5" fill="currentColor"/><polygon points="37,4 45,8.5 45,17.5 37,22 29,17.5 29,8.5" fill="currentColor"/></>}
                        {s.id === 'triangle' && <><polygon points="13,4 22,22 4,22" fill="currentColor"/><polygon points="37,4 46,22 28,22" fill="currentColor"/></>}
                        {s.id === 'cross' && <><path d="M10,4h6v7h7v6h-7v7h-6v-7h-7v-6h7z" fill="currentColor" transform="translate(0,0)"/></>}
                        {s.id === 'octagon' && <><polygon points="13,4 19,4 23,8.5 23,17.5 19,22 7,22 3,17.5 3,8.5 7,4" fill="currentColor"/></>}
                        {s.id === 'leaf' && <><path d="M4,13 Q4,4 13,4 Q22,4 22,13 Q22,22 13,22 Q4,22 4,13Z" fill="currentColor"/></>}
                        {s.id === 'thin-diamond' && <><polygon points="13,4 17,13 13,22 9,13" fill="currentColor"/><polygon points="37,4 41,13 37,22 33,13" fill="currentColor"/></>}
                        {s.id === 'small-square' && <><rect x="7" y="7" width="12" height="12" fill="currentColor"/><rect x="31" y="7" width="12" height="12" fill="currentColor"/><rect x="7" y="31" width="12" height="12" fill="currentColor"/></>}
                        {s.id === 'tiny-dot' && <><circle cx="13" cy="13" r="5" fill="currentColor"/><circle cx="37" cy="13" r="5" fill="currentColor"/><circle cx="13" cy="37" r="5" fill="currentColor"/></>}
                        {s.id === 'vertical-bar' && <><rect x="10" y="4" width="6" height="18" fill="currentColor"/><rect x="34" y="4" width="6" height="18" fill="currentColor"/><rect x="10" y="28" width="6" height="18" fill="currentColor"/></>}
                        {s.id === 'horizontal-bar' && <><rect x="4" y="10" width="18" height="6" fill="currentColor"/><rect x="28" y="10" width="18" height="6" fill="currentColor"/><rect x="4" y="34" width="18" height="6" fill="currentColor"/></>}
                        {s.id === 'classy-rounded' && <><rect x="4" y="4" width="18" height="18" rx="9" fill="currentColor"/><rect x="28" y="4" width="18" height="18" rx="9" fill="currentColor"/><rect x="4" y="28" width="18" height="18" rx="9" fill="currentColor"/></>}
                        {s.id === 'rotated-square' && <><rect x="6" y="6" width="13" height="13" fill="currentColor" transform="rotate(45 13 13)"/><rect x="30" y="6" width="13" height="13" fill="currentColor" transform="rotate(45 37 13)"/></>}
                      </svg>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>

                <h4 className="qr-tool-section__title">Corner Eye — Outer</h4>
                <div className="qr-shape-grid qr-shape-grid--small">
                  {CORNER_OUTER.map((s) => (
                    <button key={s.id} className={`qr-shape-btn ${cornerOuter === s.id ? 'active' : ''}`} onClick={() => setCornerOuter(s.id)}>
                      <svg viewBox="0 0 40 40" className="qr-shape-btn__svg">
                        {s.id === 'square' && <rect x="4" y="4" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="5"/>}
                        {s.id === 'rounded' && <rect x="4" y="4" width="32" height="32" rx="8" fill="none" stroke="currentColor" strokeWidth="5"/>}
                        {s.id === 'circle' && <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="5"/>}
                        {s.id === 'diamond-outer' && <polygon points="20,3 37,20 20,37 3,20" fill="none" stroke="currentColor" strokeWidth="4"/>}
                        {s.id === 'hexagon-outer' && <polygon points="20,4 35,12 35,28 20,36 5,28 5,12" fill="none" stroke="currentColor" strokeWidth="4"/>}
                        {s.id === 'octagon-outer' && <polygon points="13,4 27,4 36,13 36,27 27,36 13,36 4,27 4,13" fill="none" stroke="currentColor" strokeWidth="3.5"/>}
                        {s.id === 'leaf-outer' && <path d="M4,20 Q4,4 20,4 Q36,4 36,20 Q36,36 20,36 Q4,36 4,20Z" fill="none" stroke="currentColor" strokeWidth="4"/>}
                        {s.id === 'classy-outer' && <rect x="4" y="4" width="32" height="32" rx="16" fill="none" stroke="currentColor" strokeWidth="5"/>}
                        {s.id === 'inset-outer' && <rect x="4" y="4" width="32" height="32" rx="4" fill="none" stroke="currentColor" strokeWidth="5"/>}
                        {s.id === 'petal-outer' && <path d="M20,4 C28,4 36,12 36,20 C36,28 28,36 20,36 C12,36 4,28 4,20 C4,12 12,4 20,4Z" fill="none" stroke="currentColor" strokeWidth="4"/>}
                      </svg>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>

                <h4 className="qr-tool-section__title">Corner Eye — Inner</h4>
                <div className="qr-shape-grid qr-shape-grid--small">
                  {CORNER_INNER.map((s) => (
                    <button key={s.id} className={`qr-shape-btn ${cornerInner === s.id ? 'active' : ''}`} onClick={() => setCornerInner(s.id)}>
                      <svg viewBox="0 0 40 40" className="qr-shape-btn__svg">
                        {s.id === 'square' && <rect x="10" y="10" width="20" height="20" fill="currentColor"/>}
                        {s.id === 'rounded' && <rect x="10" y="10" width="20" height="20" rx="5" fill="currentColor"/>}
                        {s.id === 'dot' && <circle cx="20" cy="20" r="10" fill="currentColor"/>}
                        {s.id === 'diamond' && <polygon points="20,8 32,20 20,32 8,20" fill="currentColor"/>}
                        {s.id === 'hexagon-inner' && <polygon points="20,9 30,14.5 30,25.5 20,31 10,25.5 10,14.5" fill="currentColor"/>}
                        {s.id === 'octagon-inner' && <polygon points="15,9 25,9 31,15 31,25 25,31 15,31 9,25 9,15" fill="currentColor"/>}
                        {s.id === 'cross-inner' && <path d="M16,10h8v6h6v8h-6v6h-8v-6h-6v-8h6z" fill="currentColor"/>}
                        {s.id === 'leaf-inner' && <path d="M10,20 Q10,10 20,10 Q30,10 30,20 Q30,30 20,30 Q10,30 10,20Z" fill="currentColor"/>}
                        {s.id === 'classy-inner' && <rect x="10" y="10" width="20" height="20" rx="10" fill="currentColor"/>}
                        {s.id === 'shield-inner' && <path d="M20,9 Q31,9 31,20 Q31,31 20,31 Q9,31 9,20 Q9,9 20,9Z" fill="currentColor"/>}
                      </svg>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---- COLOR ---- */}
            {toolTab === 'color' && (
              <div className="qr-tool-section">
                <h4 className="qr-tool-section__title">Foreground Color</h4>
                <div className="qr-color-row">
                  <input type="color" value={gradientOn ? gradColor1 : fgColor} onChange={(e) => gradientOn ? setGradColor1(e.target.value) : setFgColor(e.target.value)} className="qr-color-picker" />
                  <input type="text" value={gradientOn ? gradColor1 : fgColor} onChange={(e) => gradientOn ? setGradColor1(e.target.value) : setFgColor(e.target.value)} className="qr-color-text" />
                </div>

                <h4 className="qr-tool-section__title">Background Color</h4>
                <div className="qr-color-row">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="qr-color-picker" />
                  <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="qr-color-text" />
                </div>

                <label className="qr-toggle-row">
                  <span>Enable Gradient</span>
                  <input type="checkbox" checked={gradientOn} onChange={(e) => setGradientOn(e.target.checked)} className="qr-toggle" />
                </label>

                {gradientOn && (
                  <>
                    <h4 className="qr-tool-section__title">Gradient Type</h4>
                    <div className="qr-pill-toggle">
                      <button className={gradType === 'linear' ? 'active' : ''} onClick={() => setGradType('linear')}>Linear</button>
                      <button className={gradType === 'radial' ? 'active' : ''} onClick={() => setGradType('radial')}>Radial</button>
                    </div>

                    <h4 className="qr-tool-section__title">Gradient Color 1</h4>
                    <div className="qr-color-row">
                      <input type="color" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)} className="qr-color-picker" />
                      <input type="text" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)} className="qr-color-text" />
                    </div>

                    <h4 className="qr-tool-section__title">Gradient Color 2</h4>
                    <div className="qr-color-row">
                      <input type="color" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)} className="qr-color-picker" />
                      <input type="text" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)} className="qr-color-text" />
                    </div>

                    {gradType === 'linear' && (
                      <>
                        <h4 className="qr-tool-section__title">Angle: {gradAngle}°</h4>
                        <input type="range" min={0} max={360} value={gradAngle} onChange={(e) => setGradAngle(Number(e.target.value))} className="qr-range" />
                      </>
                    )}

                    <h4 className="qr-tool-section__title">Suggested Gradients</h4>
                    <div className="qr-gradient-suggestions">
                      {GRADIENT_SUGGESTIONS.map((g, idx) => (
                        <button
                          key={idx}
                          className="qr-gradient-swatch"
                          title={g.label}
                          style={{ background: `linear-gradient(135deg, ${g.c1}, ${g.c2})` }}
                          onClick={() => { setGradColor1(g.c1); setGradColor2(g.c2); }}
                        >
                          <span className="qr-gradient-swatch__label">{g.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ---- FRAMES ---- */}
            {toolTab === 'frames' && (
              <div className="qr-tool-section">
                <h4 className="qr-tool-section__title">Select Frame</h4>
                <div className="qr-frames-grid">
                  {FRAMES.map((f) => (
                    <button
                      key={f.id}
                      className={`qr-frame-btn ${selectedFrame === f.id ? 'active' : ''}`}
                      onClick={() => setSelectedFrame(f.id)}
                      data-frame={f.id}
                    >
                      <div className="qr-frame-btn__preview">
                        <div className="qr-frame-btn__qr-icon">
                          <i className="fa-solid fa-qrcode"></i>
                        </div>
                      </div>
                      <span className="qr-frame-btn__label">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---- LOGO ---- */}
            {toolTab === 'logo' && (
              <div className="qr-tool-section">
                <h4 className="qr-tool-section__title">Select Logo</h4>
                <div className="qr-logo-grid">
                  {LOGOS.map((logo) => (
                    <button
                      key={logo.id}
                      className={`qr-logo-btn ${selectedLogo?.id === logo.id && !customLogoImg ? 'active' : ''}`}
                      onClick={() => { setSelectedLogo(logo); setCustomLogoImg(null); }}
                    >
                      {logo.id === 'none' ? (
                        <i className="fa-solid fa-ban" style={{ fontSize: '1.4rem', color: '#9ca3af' }}></i>
                      ) : (
                        <i
                          className={`fa-${logo.family === 'brands' ? 'brands' : 'solid'} fa-${logo.id === 'scan' ? 'qrcode' : logo.id === 'wifi-logo' ? 'wifi' : logo.id === 'globe' ? 'globe' : logo.id === 'x-twitter' ? 'x-twitter' : logo.id === 'envelope' ? 'envelope' : logo.id === 'map-marked' ? 'map-location-dot' : logo.id}`}
                          style={{ fontSize: '1.5rem', color: logo.color }}
                        ></i>
                      )}
                      <span>{logo.label}</span>
                    </button>
                  ))}
                </div>
                <h4 className="qr-tool-section__title">Or Upload Custom Logo</h4>
                <button className="qr-upload-logo-btn" onClick={() => customLogoInputRef.current?.click()}>
                  <i className="fa-solid fa-cloud-arrow-up"></i> Upload Image
                </button>
                {customLogoImg && <p className="qr-custom-logo-badge"><i className="fa-solid fa-check"></i> Custom logo applied</p>}
                <input ref={customLogoInputRef} type="file" accept="image/*" hidden onChange={handleCustomLogo} />
              </div>
            )}

            {/* ---- TEMPLATES ---- */}
            {toolTab === 'templates' && (
              <div className="qr-tool-section">
                <h4 className="qr-tool-section__title">Premade Templates</h4>
                <p className="qr-tool-section__hint">Click a template to instantly apply its style combination.</p>
                <div className="qr-templates-grid">
                  {QR_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      className="qr-template-btn"
                      onClick={() => {
                        setDotShape(t.dotShape);
                        setCornerOuter(t.cornerOuter);
                        setCornerInner(t.cornerInner);
                        setFgColor(t.fgColor);
                        setBgColor(t.bgColor);
                        setGradientOn(t.gradientOn);
                        if (t.gradientOn) {
                          setGradColor1(t.gradColor1);
                          setGradColor2(t.gradColor2);
                        }
                        setSelectedFrame(t.frame);
                      }}
                    >
                      <div className="qr-template-btn__preview" style={{
                        background: t.bgColor,
                        color: t.gradientOn ? t.gradColor1 : t.fgColor,
                      }}>
                        <i className="fa-solid fa-qrcode" style={{
                          fontSize: '1.6rem',
                          background: t.gradientOn ? `linear-gradient(135deg, ${t.gradColor1}, ${t.gradColor2})` : t.fgColor,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}></i>
                      </div>
                      <span className="qr-template-btn__name">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---- FILE FORMAT ---- */}
            {toolTab === 'format' && (
              <div className="qr-tool-section">
                <h4 className="qr-tool-section__title">Download Format</h4>
                <div className="qr-format-list">
                  {FILE_FORMATS.map((fmt) => (
                    <button
                      key={fmt.id}
                      className={`qr-format-btn ${fileFormat === fmt.id ? 'active' : ''}`}
                      onClick={() => setFileFormat(fmt.id)}
                    >
                      <span className="qr-format-btn__ext">{fmt.label}</span>
                      <span className="qr-format-btn__desc">{fmt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile close */}
          <button className="qr-left__close-mobile" onClick={() => setMobileToolsOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* ---------- RIGHT PANEL (preview 25%) ---------- */}
        <div className="qr-right">
          <div className="qr-right__sticky">
            <h3 className="qr-right__title"><i className="fa-solid fa-eye"></i> Preview</h3>

            <div className="qr-right__preview-wrap">
              <canvas ref={canvasRef} className="qr-right__canvas" />
            </div>

            {(() => {
              const activeFg = gradientOn ? gradColor1 : fgColor;
              const sim = colorSimilarity(activeFg, bgColor);
              if (sim >= 1) return (
                <div className="qr-char-warning qr-char-warning--red">
                  <i className="fa-solid fa-circle-exclamation"></i> Foreground and background colors are identical — QR code will be invisible!
                </div>
              );
              if (sim >= 0.80) return (
                <div className="qr-char-warning qr-char-warning--yellow">
                  <i className="fa-solid fa-triangle-exclamation"></i> Foreground and background colors are very similar — QR code may be hard to scan.
                </div>
              );
              return null;
            })()}

            <div className="qr-right__data-label" title={qrString}>
              <i className="fa-solid fa-database"></i>
              <span>{qrString.length > 60 ? qrString.slice(0, 60) + '…' : qrString}</span>
            </div>

            <div className="qr-right__actions">
              <button className="qr-right__download" onClick={handleDownload}>
                <i className="fa-solid fa-download"></i> Download {fileFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default QRCodeGenerator;
