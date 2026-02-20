import React, { useState, useRef, useEffect, useCallback } from 'react';
import SEO from '../SEO/SEO';
import './FaceBlur.css';

/* ---- helpers ---- */
const fmtSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
const getExt = (name) => (name.match(/\.([^.]+)$/)?.[1] || 'img').toUpperCase();

const loadImage = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { resolve({ img, url, w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });

const EMOJIS = ['😀', '😎', '🤡', '👽', '🐱', '🐶', '🦊', '🐸', '💀', '🎭', '⭐', '❤️'];

/* ---- stackBlur (fast Gaussian-like blur) ---- */
const stackBlur = (imgData, radius) => {
  const w = imgData.width, h = imgData.height;
  const px = imgData.data;
  if (radius < 1) return;
  const wm = w - 1, hm = h - 1, div = radius + radius + 1;
  const rSum = new Int32Array(w * h), gSum = new Int32Array(w * h), bSum = new Int32Array(w * h);
  let rowI, p, p1, p2, yi = 0; // eslint-disable-line no-unused-vars
  const mulTable = [512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
    454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
    482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
    437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
    497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
    320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
    446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
    329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
    505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
    399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
    324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
    268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
    451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
    385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
    332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
    289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];
  const shgTable = [9,11,12,13,13,14,14,15,15,15,15,16,16,16,16,17,
    17,17,17,17,17,17,18,18,18,18,18,18,18,18,18,19,
    19,19,19,19,19,19,19,19,19,19,19,19,19,20,20,20,
    20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,
    21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,
    21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,
    22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,
    22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,
    23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,
    23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,
    23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,
    23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,
    24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,
    24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,
    24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,
    24,24,24,24,24,24,24,24,24,24,24,24,24,24,24];
  const mulS = mulTable[radius] || 512;
  const shgS = shgTable[radius] || 24;
  // horizontal pass
  for (let y = 0; y < h; y++) {
    let rS = 0, gS = 0, bS = 0, rIns = 0, gIns = 0, bIns = 0, rOut = 0, gOut = 0, bOut = 0;
    for (let i = -radius; i <= radius; i++) {
      p = (yi + Math.min(wm, Math.max(0, i))) * 4;
      const f = radius + 1 - Math.abs(i);
      rS += px[p] * f; gS += px[p + 1] * f; bS += px[p + 2] * f;
      if (i > 0) { rIns += px[p]; gIns += px[p + 1]; bIns += px[p + 2]; }
      else { rOut += px[p]; gOut += px[p + 1]; bOut += px[p + 2]; }
    }
    for (let x = 0; x < w; x++) {
      rowI = yi + x;
      rSum[rowI] = (rS * mulS) >>> shgS;
      gSum[rowI] = (gS * mulS) >>> shgS;
      bSum[rowI] = (bS * mulS) >>> shgS;
      rS -= rOut; gS -= gOut; bS -= bOut;
      p1 = (yi + Math.min(x + radius + 1, wm)) * 4;
      p2 = (yi + Math.max(x - radius, 0)) * 4;
      rIns += px[p1]; gIns += px[p1 + 1]; bIns += px[p1 + 2];
      rOut -= px[p2]; gOut -= px[p2 + 1]; bOut -= px[p2 + 2];
      rOut += px[p1]; gOut += px[p1 + 1]; bOut += px[p1 + 2];
      rS += rIns; gS += gIns; bS += bIns;
      rIns -= px[p2]; gIns -= px[p2 + 1]; bIns -= px[p2 + 2];
    }
    yi += w;
  }
  // vertical pass
  for (let x = 0; x < w; x++) {
    let rS = 0, gS = 0, bS = 0, rIns = 0, gIns = 0, bIns = 0, rOut = 0, gOut = 0, bOut = 0;
    let yp = -radius * w;
    for (let i = -radius; i <= radius; i++) {
      yi = Math.max(0, yp) + x;
      const f = radius + 1 - Math.abs(i);
      rS += rSum[yi] * f; gS += gSum[yi] * f; bS += bSum[yi] * f;
      if (i > 0) { rIns += rSum[yi]; gIns += gSum[yi]; bIns += bSum[yi]; }
      else { rOut += rSum[yi]; gOut += gSum[yi]; bOut += bSum[yi]; }
      if (i < hm) yp += w;
    }
    yi = x;
    for (let y = 0; y < h; y++) {
      p = yi * 4;
      px[p] = (rS * mulS) >>> shgS;
      px[p + 1] = (gS * mulS) >>> shgS;
      px[p + 2] = (bS * mulS) >>> shgS;
      rS -= rOut; gS -= gOut; bS -= bOut;
      p1 = x + Math.min(y + radius + 1, hm) * w;
      p2 = x + Math.max(y - radius, 0) * w;
      rIns += rSum[p1]; gIns += gSum[p1]; bIns += bSum[p1];
      rOut -= rSum[p2]; gOut -= gSum[p2]; bOut -= bSum[p2];
      rOut += rSum[p1]; gOut += gSum[p1]; bOut += bSum[p1];
      rS += rIns; gS += gIns; bS += bIns;
      rIns -= rSum[p2]; gIns -= gSum[p2]; bIns -= bSum[p2];
      yi += w;
    }
  }
  // write back
  for (let i = 0; i < rSum.length; i++) {
    p = i * 4;
    px[p] = rSum[i]; px[p + 1] = gSum[i]; px[p + 2] = bSum[i];
  }
};

/* ---- Apply blur / emoji to face regions on canvas ---- */
const applyBlurToCanvas = (srcCanvas, regions, blurIntensity, blurShape, blurMode, selectedEmoji) => {
  const w = srcCanvas.width, h = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0);

  for (const r of regions) {
    const rx = Math.round(r.x * w);
    const ry = Math.round(r.y * h);
    const rw = Math.round(r.w * w);
    const rh = Math.round(r.h * h);
    if (rw < 2 || rh < 2) continue;

    if (blurMode === 'emoji' && selectedEmoji) {
      // Draw emoji over face
      const fontSize = Math.min(rw, rh) * 1.1;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedEmoji, rx + rw / 2, ry + rh / 2);
    } else {
      // Extract region, blur, put back
      const pad = 2;
      const sx = Math.max(0, rx - pad), sy = Math.max(0, ry - pad);
      const sw = Math.min(w - sx, rw + pad * 2), sh = Math.min(h - sy, rh + pad * 2);
      const regionData = ctx.getImageData(sx, sy, sw, sh);
      const radius = Math.max(1, Math.round(blurIntensity * 0.5));
      // Apply multiple passes for stronger blur
      const passes = blurIntensity > 50 ? 3 : blurIntensity > 25 ? 2 : 1;
      for (let p = 0; p < passes; p++) stackBlur(regionData, radius);

      if (blurShape === 'circle') {
        // Mask to ellipse
        const cx = sw / 2, cy = sh / 2, a = sw / 2, b = sh / 2;
        const origData = ctx.getImageData(sx, sy, sw, sh);
        for (let py = 0; py < sh; py++) {
          for (let px = 0; px < sw; px++) {
            const dx = (px - cx) / a, dy = (py - cy) / b;
            if (dx * dx + dy * dy > 1) {
              const idx = (py * sw + px) * 4;
              regionData.data[idx] = origData.data[idx];
              regionData.data[idx + 1] = origData.data[idx + 1];
              regionData.data[idx + 2] = origData.data[idx + 2];
              regionData.data[idx + 3] = origData.data[idx + 3];
            }
          }
        }
      }
      ctx.putImageData(regionData, sx, sy);
    }
  }
  return out;
};

/* ============================================= */
/*          FACE BLUR PAGE                       */
/* ============================================= */
const FaceBlur = () => {
  const [images, setImages] = useState([]);
  const [selectedImgId, setSelectedImgId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [downloadMode, setDownloadMode] = useState('zip');
  const [downloading, setDownloading] = useState(false);

  /* Blur settings */
  const [blurIntensity, setBlurIntensity] = useState(40);
  const [blurShape, setBlurShape] = useState('rectangle'); // rectangle | circle
  const [blurMode, setBlurMode] = useState('blur'); // blur | emoji
  const [selectedEmoji, setSelectedEmoji] = useState('😀');

  /* Face regions (normalised 0-1 coords per image) */
  const regionsMapRef = useRef({}); // { imgId: [{x,y,w,h,auto:bool},...] }
  const [regions, setRegions] = useState([]); // current image regions
  const [detecting, setDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState(''); // '', 'success', 'notfound', 'manual'

  /* Manual draw state */
  const [manualMode, setManualMode] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);

  /* Refs */
  const fileInputRef = useRef(null);
  const addFileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const srcCanvasRef = useRef(null); // offscreen: holds original pixels
  const imgCacheRef = useRef({}); // { imgId: HTMLImageElement }

  const selected = images.find((i) => i.id === selectedImgId) || null;
  const totalSize = images.reduce((s, i) => s + i.file.size, 0);
  const isMulti = images.length > 1;

  /* ---- Save / restore regions per image ---- */
  const saveRegions = useCallback(() => {
    if (selectedImgId) regionsMapRef.current[selectedImgId] = [...regions];
  }, [selectedImgId, regions]);

  const loadRegions = useCallback((id) => {
    return regionsMapRef.current[id] || [];
  }, []);

  /* ---- beforeunload ---- */
  useEffect(() => {
    const h = (e) => { if (images.length) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [images.length]);

  /* ---- popstate guard ---- */
  useEffect(() => {
    if (!images.length) return;
    const handler = () => {
      if (!window.confirm('You have unsaved edits. Leave this page?')) {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [images.length]);

  /* ---- hide footer when workspace active ---- */
  useEffect(() => {
    if (images.length > 0) document.body.classList.add('fb-workspace-active');
    else document.body.classList.remove('fb-workspace-active');
    return () => document.body.classList.remove('fb-workspace-active');
  }, [images.length]);

  /* ---- add files ---- */
  const addFiles = useCallback(async (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!valid.length) return;
    const newImgs = await Promise.all(
      valid.map(async (file) => {
        const result = await loadImage(file);
        if (!result) return null;
        return { id: crypto.randomUUID(), file, preview: result.url, origW: result.w, origH: result.h, imgEl: result.img };
      })
    );
    const goodImgs = newImgs.filter(Boolean);
    if (!goodImgs.length) return;
    goodImgs.forEach((im) => { imgCacheRef.current[im.id] = im.imgEl; });
    setImages((prev) => {
      const merged = [...prev, ...goodImgs];
      if (prev.length === 0 && goodImgs.length > 0) setSelectedImgId(goodImgs[0].id);
      return merged;
    });
  }, []);

  /* ---- paste ---- */
  useEffect(() => {
    const handler = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const item of items) { if (item.kind === 'file' && item.type.startsWith('image/')) files.push(item.getAsFile()); }
      if (files.length) { e.preventDefault(); addFiles(files); }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [addFiles]);

  /* ---- select image ---- */
  const selectImage = useCallback((id) => {
    if (id === selectedImgId) return;
    saveRegions();
    const loaded = loadRegions(id);
    setRegions(loaded);
    setDetectStatus(loaded.length > 0 ? 'success' : '');
    setSelectedImgId(id);
    setManualMode(false);
  }, [selectedImgId, saveRegions, loadRegions]);

  /* ---- remove image ---- */
  const removeImage = useCallback((id) => {
    const img = images.find((i) => i.id === id);
    if (img) URL.revokeObjectURL(img.preview);
    delete regionsMapRef.current[id];
    delete imgCacheRef.current[id];
    const remaining = images.filter((i) => i.id !== id);
    setImages(remaining);
    if (id === selectedImgId) {
      if (remaining.length > 0) {
        const next = remaining[0];
        setSelectedImgId(next.id);
        setRegions(loadRegions(next.id));
        setDetectStatus('');
      } else {
        setSelectedImgId(null);
        setRegions([]);
        setDetectStatus('');
      }
    }
  }, [images, selectedImgId, loadRegions]);

  /* ---- draw source to canvas ---- */
  const drawCanvas = useCallback(() => {
    if (!selected) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgEl = imgCacheRef.current[selected.id];
    if (!imgEl) return;

    const maxDisplayW = 800;
    const scale = Math.min(1, maxDisplayW / selected.origW);
    const dw = Math.round(selected.origW * scale);
    const dh = Math.round(selected.origH * scale);
    canvas.width = dw;
    canvas.height = dh;

    // Source canvas (full res for export)
    if (!srcCanvasRef.current) srcCanvasRef.current = document.createElement('canvas');
    const src = srcCanvasRef.current;
    src.width = selected.origW;
    src.height = selected.origH;
    const sctx = src.getContext('2d');
    sctx.drawImage(imgEl, 0, 0);

    // If we have regions, apply blur preview
    if (regions.length > 0) {
      const blurred = applyBlurToCanvas(src, regions, blurIntensity, blurShape, blurMode, selectedEmoji);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(blurred, 0, 0, dw, dh);
    } else {
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, dw, dh);
    }
  }, [selected, regions, blurIntensity, blurShape, blurMode, selectedEmoji]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  /* Save regions whenever they change */
  useEffect(() => { saveRegions(); }, [regions, saveRegions]);

  /* ---- Face detection ---- */
  const detectFaces = useCallback(async () => { // eslint-disable-line react-hooks/exhaustive-deps
    if (!selected) return;
    setDetecting(true);
    setDetectStatus('');

    const imgEl = imgCacheRef.current[selected.id];
    if (!imgEl) { setDetecting(false); return; }

    let detected = [];

    // Try browser FaceDetector API (Chrome/Edge)
    if ('FaceDetector' in window) {
      try {
        const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 20 });
        const faces = await detector.detect(imgEl);
        detected = faces.map((f) => ({
          x: f.boundingBox.x / imgEl.naturalWidth,
          y: f.boundingBox.y / imgEl.naturalHeight,
          w: f.boundingBox.width / imgEl.naturalWidth,
          h: f.boundingBox.height / imgEl.naturalHeight,
          auto: true,
        }));
      } catch {
        /* fallback below */
      }
    }

    // Fallback: skin-color heuristic detection
    if (detected.length === 0) {
      try {
        detected = skinColorDetect(imgEl);
      } catch {
        /* ignore */
      }
    }

    if (detected.length > 0) {
      setRegions(detected);
      setDetectStatus('success');
    } else {
      setDetectStatus('notfound');
      setManualMode(true);
    }
    setDetecting(false);
  }, [selected]);

  /* ---- Skin-color heuristic face detection fallback ---- */
  const skinColorDetect = (imgEl) => {
    const tmpCanvas = document.createElement('canvas');
    const scale = Math.min(1, 400 / Math.max(imgEl.naturalWidth, imgEl.naturalHeight));
    const w = Math.round(imgEl.naturalWidth * scale);
    const h = Math.round(imgEl.naturalHeight * scale);
    tmpCanvas.width = w; tmpCanvas.height = h;
    const ctx = tmpCanvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    // Create skin mask
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Skin color detection in RGB
      const isSkin = r > 95 && g > 40 && b > 20 &&
        r > g && r > b &&
        (r - g) > 15 &&
        Math.abs(r - g) > 15 &&
        (r - b) > 15;
      mask[i / 4] = isSkin ? 1 : 0;
    }

    // Erode + dilate to clean up
    const cleaned = erode(dilate(erode(mask, w, h, 2), w, h, 3), w, h, 1);

    // Connected components
    const labels = new Int32Array(w * h);
    let nextLabel = 1;
    const parent = [0];
    const findRoot = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const union = (a, b) => { a = findRoot(a); b = findRoot(b); if (a !== b) parent[Math.max(a, b)] = Math.min(a, b); };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (!cleaned[idx]) continue;
        const left = x > 0 ? labels[idx - 1] : 0;
        const up = y > 0 ? labels[idx - w] : 0;
        if (left && up) { labels[idx] = Math.min(left, up); if (left !== up) union(left, up); }
        else if (left) labels[idx] = left;
        else if (up) labels[idx] = up;
        else { labels[idx] = nextLabel; parent.push(nextLabel); nextLabel++; }
      }
    }

    // Second pass: resolve labels
    for (let i = 0; i < labels.length; i++) { if (labels[i]) labels[i] = findRoot(labels[i]); }

    // Bounding boxes per component
    const bboxes = {};
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const l = labels[y * w + x];
        if (!l) continue;
        if (!bboxes[l]) bboxes[l] = { minX: x, minY: y, maxX: x, maxY: y, count: 0 };
        const bb = bboxes[l];
        bb.minX = Math.min(bb.minX, x); bb.minY = Math.min(bb.minY, y);
        bb.maxX = Math.max(bb.maxX, x); bb.maxY = Math.max(bb.maxY, y);
        bb.count++;
      }
    }

    // Filter: only face-like regions (aspect ratio, size)
    const minArea = w * h * 0.005;
    const maxArea = w * h * 0.6;
    const results = [];
    for (const key of Object.keys(bboxes)) {
      const bb = bboxes[key];
      const bw = bb.maxX - bb.minX;
      const bh = bb.maxY - bb.minY;
      const area = bb.count;
      const aspect = bw / (bh || 1);
      if (area < minArea || area > maxArea) continue;
      if (aspect < 0.3 || aspect > 2.5) continue;
      // Expand bounding box by 30% for padding
      const padX = bw * 0.3, padY = bh * 0.3;
      results.push({
        x: Math.max(0, (bb.minX - padX) / w),
        y: Math.max(0, (bb.minY - padY) / h),
        w: Math.min(1, (bw + padX * 2) / w),
        h: Math.min(1, (bh + padY * 2) / h),
        auto: true,
      });
    }
    return results;
  };

  /* Morphology helpers */
  const erode = (mask, w, h, r) => {
    const out = new Uint8Array(w * h);
    for (let y = r; y < h - r; y++) {
      for (let x = r; x < w - r; x++) {
        let all = true;
        outer: for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (!mask[(y + dy) * w + (x + dx)]) { all = false; break outer; } }
        out[y * w + x] = all ? 1 : 0;
      }
    }
    return out;
  };

  const dilate = (mask, w, h, r) => {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < h && nx >= 0 && nx < w) out[ny * w + nx] = 1;
          }
        }
      }
    }
    return out;
  };

  /* ---- Manual region drawing handlers ---- */
  const handleDrawStart = (e) => {
    if (!manualMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDrawing(true);
    setDrawStart({ x, y });
    setDrawCurrent({ x, y });
  };

  const handleDrawMove = (e) => {
    if (!drawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setDrawCurrent({ x, y });
  };

  const handleDrawEnd = () => {
    if (!drawing || !drawStart || !drawCurrent) { setDrawing(false); return; }
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawCurrent.x - drawStart.x);
    const h = Math.abs(drawCurrent.y - drawStart.y);
    if (w > 0.02 && h > 0.02) {
      setRegions((prev) => [...prev, { x, y, w, h, auto: false }]);
      setDetectStatus('success');
    }
    setDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  /* ---- Remove single region ---- */
  const removeRegion = (idx) => {
    setRegions((prev) => { const n = [...prev]; n.splice(idx, 1); return n; });
  };

  /* ---- Clear all regions ---- */
  const clearRegions = () => {
    setRegions([]);
    setDetectStatus('');
    setManualMode(false);
  };

  /* ---- Export single image ---- */
  const exportImage = useCallback((imgObj) => {
    return new Promise((resolve) => {
      const imgEl = imgCacheRef.current[imgObj.id];
      if (!imgEl) { resolve(null); return; }
      const src = document.createElement('canvas');
      src.width = imgObj.origW; src.height = imgObj.origH;
      src.getContext('2d').drawImage(imgEl, 0, 0);
      const imgRegions = regionsMapRef.current[imgObj.id] || [];
      if (imgRegions.length === 0) {
        // No blur, just return original
        src.toBlob((blob) => resolve(blob), 'image/png');
        return;
      }
      const result = applyBlurToCanvas(src, imgRegions, blurIntensity, blurShape, blurMode, selectedEmoji);
      result.toBlob((blob) => resolve(blob), 'image/png');
    });
  }, [blurIntensity, blurShape, blurMode, selectedEmoji]);

  /* ---- Download ---- */
  const handleDownload = useCallback(async () => {
    if (!images.length) return;
    saveRegions();
    setDownloading(true);

    try {
      if (images.length === 1 || downloadMode === 'separate') {
        // Download each individually
        for (const img of images) {
          const blob = await exportImage(img);
          if (!blob) continue;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const name = img.file.name.replace(/\.[^.]+$/, '');
          a.download = `${name}_blurred.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        // ZIP download
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const img of images) {
          const blob = await exportImage(img);
          if (!blob) continue;
          const name = img.file.name.replace(/\.[^.]+$/, '');
          zip.file(`${name}_blurred.png`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url; a.download = 'blurred_images.zip'; a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
    setDownloading(false);
  }, [images, downloadMode, exportImage, saveRegions]);

  /* ---- Reset all ---- */
  const resetAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setSelectedImgId(null);
    setRegions([]);
    setDetectStatus('');
    setManualMode(false);
    setMobileToolsOpen(false);
    regionsMapRef.current = {};
    imgCacheRef.current = {};
  };

  /* ---- Drop handlers ---- */
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  /* ---- Draw rect helper for manual mode ---- */
  const getDrawRect = () => {
    if (!drawing || !drawStart || !drawCurrent || !canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(drawStart.x, drawCurrent.x) * rect.width;
    const y = Math.min(drawStart.y, drawCurrent.y) * rect.height;
    const w = Math.abs(drawCurrent.x - drawStart.x) * rect.width;
    const h = Math.abs(drawCurrent.y - drawStart.y) * rect.height;
    return { left: x, top: y, width: w, height: h };
  };
  const drawRect = getDrawRect();

  /* ============ UPLOAD VIEW ============ */
  if (images.length === 0) {
    return (
      <>
        <SEO
          title="Face Blur Tool — Blur Faces in Images Online | favIMG"
          description="Blur faces in your images automatically with AI face detection. Choose blur intensity, shape, or emoji overlays. 100% free, fast & private."
          keywords="blur face, face blur online, pixelate face, face anonymizer, privacy tool"
        />
        <section className="fb-upload">
          <h1 className="fb-upload__title"><i className="fa-solid fa-user-shield"></i> Face Blur</h1>
          <p className="fb-upload__subtitle">
            Automatically detect and blur faces in your images for privacy. Choose blur intensity,
            shape, or cover faces with fun emojis. 100% client-side — your images never leave your device.
          </p>

          <div
            className={`fb-dropzone ${dragOver ? 'fb-dropzone--active' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="fb-dropzone__icon"><i className="fa-solid fa-cloud-arrow-up"></i></div>
            <div className="fb-dropzone__text">
              <h3>Drag &amp; Drop images here</h3>
              <p>or <span className="fb-dropzone__browse">browse files</span></p>
              <span className="fb-dropzone__hint">
                <i className="fa-solid fa-circle-info"></i> Supports JPG, PNG, WEBP, GIF — batch processing supported
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            />
          </div>

          <p className="fb-upload__paste">or paste from clipboard <kbd>Ctrl</kbd>+<kbd>V</kbd></p>

          <button className="fb-upload__btn" onClick={() => fileInputRef.current?.click()}>
            <i className="fa-solid fa-image"></i> Select Images
          </button>

          <div className="fb-upload__features">
            <div className="fb-feature">
              <div className="fb-feature__icon"><i className="fa-solid fa-robot"></i></div>
              <div className="fb-feature__title">Auto Detection</div>
              <div className="fb-feature__desc">AI-powered face detection finds all faces instantly</div>
            </div>
            <div className="fb-feature">
              <div className="fb-feature__icon"><i className="fa-solid fa-sliders"></i></div>
              <div className="fb-feature__title">Custom Blur</div>
              <div className="fb-feature__desc">Adjust blur intensity, shape, and style</div>
            </div>
            <div className="fb-feature">
              <div className="fb-feature__icon"><i className="fa-solid fa-lock"></i></div>
              <div className="fb-feature__title">100% Private</div>
              <div className="fb-feature__desc">All processing happens locally in your browser</div>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* ============ WORKSPACE VIEW ============ */
  return (
    <>
      <SEO
        title="Face Blur Tool — Blur Faces in Images Online | favIMG"
        description="Blur faces in your images automatically. 100% free, fast & private."
        keywords="blur face, face blur online, pixelate face, face anonymizer"
      />

      <section className="fb-workspace">
        {/* Mobile toggle */}
        <button className="fb-settings-toggle" onClick={() => setMobileToolsOpen((p) => !p)} aria-label="Toggle tools panel">
          <i className={mobileToolsOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-gear'}></i>
        </button>
        {mobileToolsOpen && <div className="fb-overlay" onClick={() => setMobileToolsOpen(false)} />}

        {/* ---------- PREVIEW PANEL ---------- */}
        {isMulti && (
          <div className="fb-preview">
            <div className="fb-preview__stat">
              <span className="fb-preview__stat-value">{images.length} Images</span>
              <span className="fb-preview__stat-label">{fmtSize(totalSize)}</span>
            </div>
            <div className="fb-preview__list">
              {images.map((img) => (
                <div key={img.id} className={`fb-preview__item ${img.id === selectedImgId ? 'fb-preview__item--active' : ''}`} onClick={() => selectImage(img.id)}>
                  <button className="fb-preview__remove" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} title="Remove">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                  <img src={img.preview} alt="" draggable={false} />
                  <div className="fb-preview__meta">
                    <span className="fb-preview__size">{fmtSize(img.file.size)}</span>
                    <span className="fb-preview__type">{getExt(img.file.name)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- LEFT PANEL (canvas) ---------- */}
        <div className="fb-left">
          <div className="fb-canvas-scroll">
            {selected && (
              <div className="fb-canvas" style={{ position: 'relative' }}>
                <canvas ref={canvasRef} />

                {/* Face region indicators (visual overlay) */}
                {regions.map((r, i) => {
                  const canvas = canvasRef.current;
                  if (!canvas) return null;
                  const cw = canvas.clientWidth, ch = canvas.clientHeight;
                  return (
                    <div
                      key={i}
                      className={`fb-face-indicator ${blurShape === 'circle' ? 'fb-face-indicator--circle' : ''}`}
                      style={{
                        left: r.x * cw,
                        top: r.y * ch,
                        width: r.w * cw,
                        height: r.h * ch,
                        borderColor: r.auto ? '#3b82f6' : '#f59e0b',
                      }}
                    >
                      <span className="fb-face-indicator__label" style={{ background: r.auto ? '#3b82f6' : '#f59e0b' }}>
                        {r.auto ? `Face ${i + 1}` : `Manual ${i + 1}`}
                      </span>
                    </div>
                  );
                })}

                {/* Manual draw overlay */}
                {manualMode && (
                  <div
                    className="fb-draw-overlay"
                    onMouseDown={handleDrawStart}
                    onMouseMove={handleDrawMove}
                    onMouseUp={handleDrawEnd}
                    onMouseLeave={handleDrawEnd}
                  >
                    {drawRect && (
                      <div className="fb-draw-rect" style={{ left: drawRect.left, top: drawRect.top, width: drawRect.width, height: drawRect.height }} />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ---------- RIGHT PANEL (tools) ---------- */}
        <div className={`fb-right ${mobileToolsOpen ? 'fb-right--open' : ''}`}>
          <div className="fb-right__sticky">
            {/* Header */}
            <div className="fb-right__header">
              <h3><i className="fa-solid fa-user-shield"></i> Blur Tools</h3>
              <button className="fb-right__close" onClick={() => setMobileToolsOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Stats */}
            {selected && (
              <div className="fb-right__stats">
                <div className="fb-stat"><span className="fb-stat__label">Width</span><span className="fb-stat__value">{selected.origW}px</span></div>
                <div className="fb-stat"><span className="fb-stat__label">Height</span><span className="fb-stat__value">{selected.origH}px</span></div>
                <div className="fb-stat"><span className="fb-stat__label">Size</span><span className="fb-stat__value">{fmtSize(selected.file.size)}</span></div>
                <div className="fb-stat"><span className="fb-stat__label">Faces</span><span className="fb-stat__value">{regions.length}</span></div>
              </div>
            )}

            <div className="fb-separator" />

            {/* ---- Detection ---- */}
            <div className="fb-section">
              <span className="fb-section__label">Face Detection</span>
              <button className="fb-detect-btn" onClick={detectFaces} disabled={detecting || !selected}>
                {detecting ? <><span className="fb-spinner" /> Detecting...</> : <><i className="fa-solid fa-wand-magic-sparkles"></i> Auto-Detect Faces</>}
              </button>

              <div style={{ height: 8 }} />

              <button
                className={`fb-detect-btn fb-detect-btn--secondary`}
                onClick={() => setManualMode((p) => !p)}
                disabled={!selected}
              >
                <i className={`fa-solid ${manualMode ? 'fa-xmark' : 'fa-hand-pointer'}`}></i>
                {manualMode ? 'Exit Manual Mode' : 'Manual Select'}
              </button>
            </div>

            {/* Status */}
            {detectStatus === 'success' && (
              <div className="fb-status fb-status--success">
                <i className="fa-solid fa-circle-check"></i> {regions.length} face region{regions.length !== 1 ? 's' : ''} found
              </div>
            )}
            {detectStatus === 'notfound' && (
              <div className="fb-status fb-status--warning">
                <i className="fa-solid fa-triangle-exclamation"></i> No faces detected — use manual mode
              </div>
            )}

            {/* Manual mode hint */}
            {manualMode && (
              <div className="fb-manual-hint">
                <i className="fa-solid fa-draw-polygon"></i>
                Click and drag on the image to draw a rectangle over the area you want to blur.
              </div>
            )}

            <div className="fb-separator" />

            {/* ---- Blur Settings ---- */}
            <div className="fb-section">
              <span className="fb-section__label">Blur Type</span>
              <div className="fb-shape-options">
                <button className={`fb-shape-btn ${blurMode === 'blur' ? 'active' : ''}`} onClick={() => setBlurMode('blur')}>
                  <i className="fa-solid fa-eye-slash"></i> Blur
                </button>
                <button className={`fb-shape-btn ${blurMode === 'emoji' ? 'active' : ''}`} onClick={() => setBlurMode('emoji')}>
                  <i className="fa-solid fa-face-grin"></i> Emoji
                </button>
              </div>
            </div>

            {blurMode === 'blur' && (
              <>
                <div className="fb-section">
                  <span className="fb-section__label">Blur Intensity</span>
                  <div className="fb-slider-row">
                    <div className="fb-slider-row__top">
                      <span className="fb-slider-row__label">Strength</span>
                      <span className="fb-slider-row__value">{blurIntensity}%</span>
                    </div>
                    <input type="range" className="fb-slider" min={5} max={100} value={blurIntensity} onChange={(e) => setBlurIntensity(+e.target.value)} />
                  </div>
                </div>

                <div className="fb-section">
                  <span className="fb-section__label">Blur Shape</span>
                  <div className="fb-shape-options">
                    <button className={`fb-shape-btn ${blurShape === 'rectangle' ? 'active' : ''}`} onClick={() => setBlurShape('rectangle')}>
                      <i className="fa-regular fa-square"></i> Rectangle
                    </button>
                    <button className={`fb-shape-btn ${blurShape === 'circle' ? 'active' : ''}`} onClick={() => setBlurShape('circle')}>
                      <i className="fa-regular fa-circle"></i> Ellipse
                    </button>
                  </div>
                </div>
              </>
            )}

            {blurMode === 'emoji' && (
              <div className="fb-emoji-section">
                <span className="fb-section__label">Choose Emoji</span>
                <div className="fb-emoji-grid">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      className={`fb-emoji-btn ${selectedEmoji === em ? 'active' : ''}`}
                      onClick={() => setSelectedEmoji(em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="fb-separator" />

            {/* ---- Regions list ---- */}
            {regions.length > 0 && (
              <div className="fb-section">
                <span className="fb-section__label">Blur Regions ({regions.length})</span>
                <div className="fb-region-list">
                  {regions.map((r, i) => (
                    <div key={i} className="fb-region-item">
                      <i className={`fb-region-item__icon fa-solid ${r.auto ? 'fa-robot' : 'fa-hand-pointer'}`}></i>
                      <span className="fb-region-item__label">{r.auto ? `Face ${i + 1}` : `Manual Region ${i + 1}`}</span>
                      <button className="fb-region-item__remove" onClick={() => removeRegion(i)} title="Remove region">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ height: 4 }} />
                <button className="fb-detect-btn fb-detect-btn--secondary" onClick={clearRegions} style={{ fontSize: '0.8rem', padding: '8px 12px' }}>
                  <i className="fa-solid fa-trash-can"></i> Clear All Regions
                </button>
              </div>
            )}

            <div className="fb-separator" />

            {/* Add more */}
            <button className="fb-right__add" onClick={() => addFileInputRef.current?.click()}>
              <i className="fa-solid fa-plus"></i> Add More Images
            </button>
            <input
              ref={addFileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            />

            {/* Reset */}
            <button className="fb-right__reset" onClick={resetAll}>
              <i className="fa-solid fa-rotate-left"></i> Start Over
            </button>

            {/* ---- Download ---- */}
            <div className="fb-right__actions">
              {isMulti && (
                <div className="fb-dl-toggle">
                  <button className={`fb-dl-toggle__btn ${downloadMode === 'zip' ? 'active' : ''}`} onClick={() => setDownloadMode('zip')}>
                    <i className="fa-solid fa-file-zipper"></i> ZIP
                  </button>
                  <button className={`fb-dl-toggle__btn ${downloadMode === 'separate' ? 'active' : ''}`} onClick={() => setDownloadMode('separate')}>
                    <i className="fa-solid fa-download"></i> Separate
                  </button>
                </div>
              )}
              <button className="fb-right__download" onClick={handleDownload} disabled={downloading || regions.length === 0}>
                {downloading ? (
                  <><span className="fb-download-spinner" /> Processing...</>
                ) : (
                  <><i className="fa-solid fa-download"></i> {images.length === 1 ? 'Download Blurred Image' : `Download ${images.length} Images`}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FaceBlur;
