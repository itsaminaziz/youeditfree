import React, { useState, useRef, useEffect, useCallback } from 'react';
import SEO from '../SEO/SEO';
import './RemoveBackground.css';

/* ---- helpers ---- */
const fmtSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
const getExt = (name) => (name.match(/\.([^.]+)$/)?.[1] || 'img').toUpperCase();

/* Load natural dimensions */
const loadDimensions = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ w: 0, h: 0 }); };
    img.src = url;
  });

/* =========================================================
   CLIENT-SIDE BACKGROUND REMOVAL ENGINE
   Uses Canvas pixel analysis with advanced edge detection.
   Steps:
     1. Convert to ImageData
     2. Build foreground probability map using saliency + edge detection
     3. Apply GrabCut-like iterative refinement with color clustering
     4. Alpha-matte the result for smooth edges
   ========================================================= */

/* K-Means color clustering (simplified, k clusters: foreground & background) */
const kMeansClusters = (pixels, w, h, k, maxIter) => {
  const n = w * h;
  const data = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    data[i * 3] = pixels[i * 4];
    data[i * 3 + 1] = pixels[i * 4 + 1];
    data[i * 3 + 2] = pixels[i * 4 + 2];
  }
  // Initialize centroids from corners and center
  const centroids = [];
  const seeds = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1];
  for (let s = 0; s < Math.min(k, seeds.length); s++) {
    const idx = seeds[s];
    centroids.push([data[idx * 3], data[idx * 3 + 1], data[idx * 3 + 2]]);
  }
  while (centroids.length < k) {
    const ci = Math.floor(n / 2);
    centroids.push([data[ci * 3], data[ci * 3 + 1], data[ci * 3 + 2]]);
  }

  const labels = new Uint8Array(n);
  for (let iter = 0; iter < maxIter; iter++) {
    for (let i = 0; i < n; i++) {
      let minD = Infinity, best = 0;
      const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
      for (let c = 0; c < k; c++) {
        const dr = r - centroids[c][0], dg = g - centroids[c][1], db = b - centroids[c][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < minD) { minD = d; best = c; }
      }
      labels[i] = best;
    }
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) {
      const c = labels[i];
      sums[c][0] += data[i * 3];
      sums[c][1] += data[i * 3 + 1];
      sums[c][2] += data[i * 3 + 2];
      sums[c][3]++;
    }
    for (let c = 0; c < k; c++) {
      if (sums[c][3] > 0) {
        centroids[c][0] = sums[c][0] / sums[c][3];
        centroids[c][1] = sums[c][1] / sums[c][3];
        centroids[c][2] = sums[c][2] / sums[c][3];
      }
    }
  }
  return { labels, centroids };
};

/* Sobel edge detection magnitude */
const sobelEdges = (gray, w, h) => {
  const edges = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx =
        -gray[(y - 1) * w + x - 1] + gray[(y - 1) * w + x + 1]
        - 2 * gray[y * w + x - 1] + 2 * gray[y * w + x + 1]
        - gray[(y + 1) * w + x - 1] + gray[(y + 1) * w + x + 1];
      const gy =
        -gray[(y - 1) * w + x - 1] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + x + 1]
        + gray[(y + 1) * w + x - 1] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + x + 1];
      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return edges;
};

/* Gaussian blur for alpha matte smoothing */
const gaussianBlur = (data, w, h, radius) => {
  const out = new Float32Array(data.length);
  const kernel = [];
  const sigma = radius / 2;
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(v);
    sum += v;
  }
  kernel.forEach((_, i, a) => (a[i] /= sum));

  const temp = new Float32Array(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0;
      for (let ki = -radius; ki <= radius; ki++) {
        const xx = Math.min(w - 1, Math.max(0, x + ki));
        val += data[y * w + xx] * kernel[ki + radius];
      }
      temp[y * w + x] = val;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0;
      for (let ki = -radius; ki <= radius; ki++) {
        const yy = Math.min(h - 1, Math.max(0, y + ki));
        val += temp[yy * w + x] * kernel[ki + radius];
      }
      out[y * w + x] = val;
    }
  }
  return out;
};

/* Main removal function — returns a canvas with transparent background */
const removeBg = (imgElement) => {
  return new Promise((resolve) => {
    const MAX_DIM = 512;
    const natW = imgElement.naturalWidth;
    const natH = imgElement.naturalHeight;
    const scaleFactor = Math.min(1, MAX_DIM / Math.max(natW, natH));
    const w = Math.round(natW * scaleFactor);
    const h = Math.round(natH * scaleFactor);

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.drawImage(imgElement, 0, 0, w, h);
    const imageData = tmpCtx.getImageData(0, 0, w, h);
    const pixels = imageData.data;
    const n = w * h;

    // 1. Grayscale
    const gray = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      gray[i] = (pixels[i * 4] * 0.299 + pixels[i * 4 + 1] * 0.587 + pixels[i * 4 + 2] * 0.114) / 255;
    }

    // 2. Edge detection
    const edges = sobelEdges(gray, w, h);
    let maxEdge = 0;
    for (let i = 0; i < n; i++) if (edges[i] > maxEdge) maxEdge = edges[i];
    if (maxEdge > 0) for (let i = 0; i < n; i++) edges[i] /= maxEdge;

    // 3. Border color sampling
    const borderWidth = Math.max(3, Math.round(Math.min(w, h) * 0.04));
    const borderPixels = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x < borderWidth || x >= w - borderWidth || y < borderWidth || y >= h - borderWidth) {
          const idx = y * w + x;
          borderPixels.push([pixels[idx * 4], pixels[idx * 4 + 1], pixels[idx * 4 + 2]]);
        }
      }
    }

    let bgR = 0, bgG = 0, bgB = 0;
    borderPixels.forEach(([r, g, b]) => { bgR += r; bgG += g; bgB += b; });
    bgR /= borderPixels.length;
    bgG /= borderPixels.length;
    bgB /= borderPixels.length;

    let bgVarR = 0, bgVarG = 0, bgVarB = 0;
    borderPixels.forEach(([r, g, b]) => {
      bgVarR += (r - bgR) * (r - bgR);
      bgVarG += (g - bgG) * (g - bgG);
      bgVarB += (b - bgB) * (b - bgB);
    });
    bgVarR = Math.sqrt(bgVarR / borderPixels.length);
    bgVarG = Math.sqrt(bgVarG / borderPixels.length);
    bgVarB = Math.sqrt(bgVarB / borderPixels.length);
    const bgStd = (bgVarR + bgVarG + bgVarB) / 3;

    // 4. K-Means clustering
    const { labels, centroids } = kMeansClusters(pixels, w, h, 5, 12);

    const clusterBgScore = centroids.map(([r, g, b]) => {
      const dr = r - bgR, dg = g - bgG, db = b - bgB;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    });

    const bgThreshold = Math.max(35, Math.min(80, bgStd * 2.5 + 25));

    // 5. Foreground probability map
    const fgProb = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const y = Math.floor(i / w);
      const x = i % w;

      const r = pixels[i * 4], g = pixels[i * 4 + 1], b = pixels[i * 4 + 2];
      const colorDist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      const colorScore = Math.min(1, colorDist / (bgThreshold * 2));

      const clusterScore = clusterBgScore[labels[i]] > bgThreshold ? 1 : clusterBgScore[labels[i]] / bgThreshold;

      const cx = (x / w - 0.5) * 2;
      const cy = (y / h - 0.5) * 2;
      const spatialDist = Math.sqrt(cx * cx + cy * cy);
      const spatialScore = 1 - Math.min(1, spatialDist / 1.3);

      const edgeScore = edges[i];

      fgProb[i] = colorScore * 0.45 + clusterScore * 0.25 + spatialScore * 0.20 + edgeScore * 0.10;
    }

    // 6. Flood-fill from borders to mark definite background
    const visited = new Uint8Array(n);
    const queue = [];
    const BG_PROB_THRESH = 0.35;

    for (let x = 0; x < w; x++) {
      if (fgProb[x] < BG_PROB_THRESH) queue.push(x);
      const bottom = (h - 1) * w + x;
      if (fgProb[bottom] < BG_PROB_THRESH) queue.push(bottom);
    }
    for (let y = 0; y < h; y++) {
      const left = y * w;
      if (fgProb[left] < BG_PROB_THRESH) queue.push(left);
      const right = y * w + w - 1;
      if (fgProb[right] < BG_PROB_THRESH) queue.push(right);
    }

    while (queue.length > 0) {
      const idx = queue.shift();
      if (visited[idx]) continue;
      visited[idx] = 1;
      fgProb[idx] = Math.min(fgProb[idx], 0.1);

      const fy = Math.floor(idx / w);
      const fx = idx % w;
      const neighbors = [
        fx > 0 ? idx - 1 : -1,
        fx < w - 1 ? idx + 1 : -1,
        fy > 0 ? idx - w : -1,
        fy < h - 1 ? idx + w : -1,
      ];
      for (const ni of neighbors) {
        if (ni >= 0 && !visited[ni]) {
          const dr = pixels[idx * 4] - pixels[ni * 4];
          const dg = pixels[idx * 4 + 1] - pixels[ni * 4 + 1];
          const db = pixels[idx * 4 + 2] - pixels[ni * 4 + 2];
          const diff = Math.sqrt(dr * dr + dg * dg + db * db);
          if (diff < bgThreshold * 0.8 && fgProb[ni] < 0.5) {
            queue.push(ni);
          }
        }
      }
    }

    // 7. Threshold to binary mask then smooth edges
    const alphaMask = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      alphaMask[i] = fgProb[i] > 0.4 ? 1 : fgProb[i] > 0.2 ? (fgProb[i] - 0.2) / 0.2 : 0;
    }

    // Morphological close (dilate then erode)
    const morphKernel = 2;
    const dilated = new Float32Array(n);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let maxVal = 0;
        for (let ky = -morphKernel; ky <= morphKernel; ky++) {
          for (let kx = -morphKernel; kx <= morphKernel; kx++) {
            const ny = y + ky, nx = x + kx;
            if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
              maxVal = Math.max(maxVal, alphaMask[ny * w + nx]);
            }
          }
        }
        dilated[y * w + x] = maxVal;
      }
    }
    const closed = new Float32Array(n);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let minVal = 1;
        for (let ky = -morphKernel; ky <= morphKernel; ky++) {
          for (let kx = -morphKernel; kx <= morphKernel; kx++) {
            const ny = y + ky, nx = x + kx;
            if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
              minVal = Math.min(minVal, dilated[ny * w + nx]);
            }
          }
        }
        closed[y * w + x] = minVal;
      }
    }

    // Gaussian blur for soft edges
    const smoothed = gaussianBlur(closed, w, h, 2);

    // 8. Upscale mask to original size and apply
    const outCanvas = document.createElement('canvas');
    outCanvas.width = natW;
    outCanvas.height = natH;
    const outCtx = outCanvas.getContext('2d');
    outCtx.drawImage(imgElement, 0, 0, natW, natH);
    const outData = outCtx.getImageData(0, 0, natW, natH);
    const outPixels = outData.data;

    for (let oy = 0; oy < natH; oy++) {
      for (let ox = 0; ox < natW; ox++) {
        const srcX = ox * scaleFactor;
        const srcY = oy * scaleFactor;
        const x0 = Math.floor(srcX), y0 = Math.floor(srcY);
        const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
        const fx = srcX - x0, fy = srcY - y0;
        const alpha =
          smoothed[y0 * w + x0] * (1 - fx) * (1 - fy) +
          smoothed[y0 * w + x1] * fx * (1 - fy) +
          smoothed[y1 * w + x0] * (1 - fx) * fy +
          smoothed[y1 * w + x1] * fx * fy;

        const idx = (oy * natW + ox) * 4;
        outPixels[idx + 3] = Math.round(alpha * 255);
      }
    }

    outCtx.putImageData(outData, 0, 0);
    resolve(outCanvas);
  });
};

/* ============================================= */
/*       REMOVE BACKGROUND IMAGE PAGE            */
/* ============================================= */
const RemoveBackground = () => {
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [downloadMode, setDownloadMode] = useState('zip');
  const [downloading, setDownloading] = useState(false);
  const [viewMode, setViewMode] = useState('result'); // 'original' | 'result'
  const [compareMode, setCompareMode] = useState(false);
  const [comparePos, setComparePos] = useState(50); // slider position 0-100

  /* Refs */
  const fileInputRef = useRef(null);
  const addFileInputRef = useRef(null);
  const compareRef = useRef(null);
  const compareDragging = useRef(false);

  const selected = images.find((i) => i.id === selectedId) || null;
  const totalSize = images.reduce((s, i) => s + i.file.size, 0);
  const doneCount = images.filter((i) => i.status === 'done').length;
  const processingCount = images.filter((i) => i.status === 'processing').length;

  /* --- beforeunload --- */
  useEffect(() => {
    const h = (e) => {
      if (images.length) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [images.length]);

  /* --- popstate (back button) guard --- */
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

  /* --- hide footer when workspace is active --- */
  useEffect(() => {
    if (images.length > 0) {
      document.body.classList.add('rbg-workspace-active');
    } else {
      document.body.classList.remove('rbg-workspace-active');
    }
    return () => document.body.classList.remove('rbg-workspace-active');
  }, [images.length]);

  /* --- compare slider drag handlers --- */
  const onComparePointerDown = useCallback((e) => {
    compareDragging.current = true;
    e.target.setPointerCapture?.(e.pointerId);
  }, []);

  const onComparePointerMove = useCallback((e) => {
    if (!compareDragging.current || !compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setComparePos(pct);
  }, []);

  const onComparePointerUp = useCallback(() => {
    compareDragging.current = false;
  }, []);

  /* --- process a single image --- */
  const processImage = useCallback(async (imgObj) => {
    setImages((prev) => prev.map((i) => i.id === imgObj.id ? { ...i, status: 'processing' } : i));

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const url = imgObj.preview;
      await new Promise((r, rej) => { img.onload = r; img.onerror = rej; img.src = url; });

      const resultCanvas = await removeBg(img);
      const resultBlob = await new Promise((r) => resultCanvas.toBlob(r, 'image/png'));
      const resultUrl = URL.createObjectURL(resultBlob);

      setImages((prev) => prev.map((i) =>
        i.id === imgObj.id
          ? { ...i, status: 'done', resultUrl, resultBlob }
          : i
      ));
    } catch (err) {
      console.error('BG removal error:', err);
      setImages((prev) => prev.map((i) =>
        i.id === imgObj.id ? { ...i, status: 'error' } : i
      ));
    }
  }, []);

  /* --- add files and auto-process --- */
  const addFiles = useCallback(async (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!valid.length) return;
    const newImgs = await Promise.all(
      valid.map(async (file) => {
        const dims = await loadDimensions(file);
        return {
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          origW: dims.w,
          origH: dims.h,
          status: 'pending',
          resultUrl: null,
          resultBlob: null,
        };
      })
    );

    setImages((prev) => {
      const merged = [...prev, ...newImgs];
      if (prev.length === 0 && newImgs.length > 0) setSelectedId(newImgs[0].id);
      return merged;
    });

    // Process each image sequentially to avoid UI freeze
    for (const imgObj of newImgs) {
      await processImage(imgObj);
    }
  }, [processImage]);

  /* --- Ctrl+V paste --- */
  useEffect(() => {
    const handler = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) files.push(item.getAsFile());
      }
      if (files.length) { e.preventDefault(); addFiles(files); }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [addFiles]);

  /* --- select image --- */
  const selectImage = (id) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setViewMode('result');
    setCompareMode(false);
    setComparePos(50);
  };

  /* --- remove image --- */
  const removeImage = (id) => {
    const img = images.find((i) => i.id === id);
    if (img) {
      URL.revokeObjectURL(img.preview);
      if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
    }
    const remaining = images.filter((i) => i.id !== id);
    setImages(remaining);
    if (id === selectedId && remaining.length > 0) {
      setSelectedId(remaining[0].id);
    }
    if (remaining.length === 0) { setSelectedId(null); }
  };

  /* --- retry processing --- */
  const retryImage = async (imgObj) => {
    await processImage(imgObj);
  };

  /* --- download single --- */
  const downloadSingle = async (imgObj) => {
    if (!imgObj?.resultBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(imgObj.resultBlob);
    const baseName = imgObj.file.name.replace(/\.[^.]+$/, '');
    a.download = `${baseName}-nobg.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* --- download all --- */
  const downloadAll = async () => {
    const doneImages = images.filter((i) => i.status === 'done' && i.resultBlob);
    if (!doneImages.length) return;
    setDownloading(true);

    try {
      if (doneImages.length === 1) {
        await downloadSingle(doneImages[0]);
      } else if (downloadMode === 'zip') {
        if (!window.JSZip) {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          document.head.appendChild(s);
          await new Promise((r) => { s.onload = r; });
        }
        const zip = new window.JSZip();
        doneImages.forEach(({ file, resultBlob }) => {
          const baseName = file.name.replace(/\.[^.]+$/, '');
          zip.file(`${baseName}-nobg.png`, resultBlob);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'background-removed.zip';
        a.click();
        URL.revokeObjectURL(a.href);
      } else {
        for (const imgObj of doneImages) {
          await downloadSingle(imgObj);
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    } catch (err) {
      console.error('Download error:', err);
    }

    setDownloading(false);
  };

  /* --- start over --- */
  const handleStartOver = () => {
    if (!window.confirm('Are you sure you want to remove all images and start over?')) return;
    images.forEach((i) => {
      URL.revokeObjectURL(i.preview);
      if (i.resultUrl) URL.revokeObjectURL(i.resultUrl);
    });
    setImages([]);
    setSelectedId(null);
  };

  /* --- drag & drop --- */
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  /* --- get display image URL --- */
  const getDisplayUrl = (imgObj) => {
    if (!imgObj) return '';
    if (viewMode === 'original') return imgObj.preview;
    if (imgObj.status === 'done' && imgObj.resultUrl) return imgObj.resultUrl;
    return imgObj.preview;
  };

  /* =========================== UPLOAD VIEW =========================== */
  if (!images.length) {
    return (
      <>
        <SEO
          title="Remove Background from Image Online Free | favIMG"
          description="Quickly remove image backgrounds with high accuracy. Free online background remover — runs entirely in your browser."
          keywords="remove background, background remover, remove bg, cut out background, transparent background"
        />
        <section className="rbg-upload">
          <div className="rbg-upload__inner">
            <h1 className="rbg-upload__title">Remove Background</h1>
            <p className="rbg-upload__desc">
              Instantly remove backgrounds from your images with advanced edge detection. 100% free, runs entirely in your browser — no uploads, no servers.
            </p>

            <div
              className={`rbg-dropzone ${dragOver ? 'rbg-dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="rbg-dropzone__cloud">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <h3>Drop your images here</h3>
              <p>or <span className="rbg-dropzone__browse" onClick={() => fileInputRef.current?.click()}>browse files</span> to remove background</p>
              <p className="rbg-dropzone__hint">
                <i className="fa-regular fa-keyboard"></i> You can also paste images with <kbd>Ctrl</kbd> + <kbd>V</kbd>
              </p>
              <button className="rbg-dropzone__btn" onClick={() => fileInputRef.current?.click()}>
                <i className="fa-solid fa-folder-open"></i> Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>
          </div>
        </section>
      </>
    );
  }

  /* =========================== WORKSPACE VIEW =========================== */
  const isMulti = images.length > 1;

  return (
    <>
      <SEO
        title="Removing Backgrounds — favIMG Background Remover"
        description="Remove image backgrounds online for free. No signup required."
        keywords="remove background, background remover, remove bg, transparent background"
      />

      <section className="rbg-workspace">
        {/* Mobile settings toggle */}
        <button
          className="rbg-settings-toggle"
          onClick={() => setMobileToolsOpen((p) => !p)}
          aria-label="Toggle tools panel"
        >
          <i className={mobileToolsOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-gear'}></i>
        </button>

        {mobileToolsOpen && <div className="rbg-overlay" onClick={() => setMobileToolsOpen(false)} />}

        {/* ---------- PREVIEW PANEL (multi-image) ---------- */}
        {isMulti && (
          <div className="rbg-preview">
            <div className="rbg-preview__stat">
              <span className="rbg-preview__stat-value">{images.length} Images</span>
              <span className="rbg-preview__stat-label">{fmtSize(totalSize)}</span>
            </div>
            <div className="rbg-preview__list">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`rbg-preview__item ${img.id === selectedId ? 'rbg-preview__item--active' : ''}`}
                  onClick={() => selectImage(img.id)}
                >
                  <button
                    className="rbg-preview__remove"
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    title="Remove"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                  <img src={img.status === 'done' && img.resultUrl ? img.resultUrl : img.preview} alt="" draggable={false} />
                  {img.status === 'processing' && <div className="rbg-preview__badge rbg-preview__badge--processing">Processing…</div>}
                  {img.status === 'done' && <div className="rbg-preview__badge rbg-preview__badge--done">Done</div>}
                  {img.status === 'error' && <div className="rbg-preview__badge rbg-preview__badge--error">Error</div>}
                  <div className="rbg-preview__meta">
                    <span className="rbg-preview__size">{fmtSize(img.file.size)}</span>
                    <span className="rbg-preview__type">{getExt(img.file.name)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- LEFT PANEL (image display) ---------- */}
        <div className="rbg-left">
          <div className="rbg-canvas-scroll">
          {selected && (
            <div className="rbg-canvas-wrap">
              {/* Normal view (hidden during compare) */}
              {!compareMode && (
              <div className={`rbg-canvas ${(selected.status === 'done' && viewMode === 'result') ? 'rbg-canvas--transparent' : ''}`}>
                <img
                  src={getDisplayUrl(selected)}
                  alt=""
                  draggable={false}
                />
                {/* Processing overlay */}
                {selected.status === 'processing' && (
                  <div className="rbg-processing-overlay">
                    <div className="rbg-processing-spinner" />
                    <span>Removing background…</span>
                  </div>
                )}
              </div>
              )}

              {/* Compare slider mode */}
              {selected.status === 'done' && compareMode && (
                <div
                  className="rbg-compare-wrap"
                  ref={compareRef}
                  onPointerMove={onComparePointerMove}
                  onPointerUp={onComparePointerUp}
                  onPointerLeave={onComparePointerUp}
                >
                  {/* Original (full background layer) */}
                  <img src={selected.preview} alt="" draggable={false} />
                  {/* Result (clipped layer) */}
                  <div className="rbg-compare__result" style={{ clipPath: `inset(0 0 0 ${comparePos}%)` }}>
                    <img src={selected.resultUrl} alt="" draggable={false} />
                  </div>
                  {/* Divider line + handle */}
                  <div className="rbg-compare__line" style={{ left: `${comparePos}%` }}>
                    <div
                      className="rbg-compare__handle"
                      onPointerDown={onComparePointerDown}
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                      <i className="fa-solid fa-chevron-right"></i>
                    </div>
                  </div>
                  <span className="rbg-compare__label rbg-compare__label--original">Original</span>
                  <span className="rbg-compare__label rbg-compare__label--result">Result</span>
                </div>
              )}

              {/* Toggle original/result view */}
              {selected.status === 'done' && (
                <div className="rbg-toggle-view">
                  <button
                    className={`rbg-toggle-view__btn ${viewMode === 'result' && !compareMode ? 'active' : ''}`}
                    onClick={() => { setViewMode('result'); setCompareMode(false); }}
                  >
                    <i className="fa-solid fa-eraser"></i> Result
                  </button>
                  <button
                    className={`rbg-toggle-view__btn ${viewMode === 'original' && !compareMode ? 'active' : ''}`}
                    onClick={() => { setViewMode('original'); setCompareMode(false); }}
                  >
                    <i className="fa-solid fa-image"></i> Original
                  </button>
                  <button
                    className={`rbg-toggle-view__btn rbg-toggle-view__btn--compare ${compareMode ? 'active' : ''}`}
                    onClick={() => { setCompareMode((p) => !p); setComparePos(50); }}
                    title="Compare slider"
                  >
                    <i className="fa-solid fa-left-right"></i>
                  </button>
                </div>
              )}

              {/* Error retry */}
              {selected.status === 'error' && (
                <button className="rbg-left__download" onClick={() => retryImage(selected)}>
                  <i className="fa-solid fa-rotate-right"></i> Retry
                </button>
              )}

              {/* Action buttons below image */}
              <div className="rbg-left__actions">
                <button
                  className="rbg-left__download"
                  onClick={() => downloadSingle(selected)}
                  disabled={selected.status !== 'done'}
                >
                  <i className="fa-solid fa-download"></i> Download
                </button>
                {isMulti && (
                  <button className="rbg-left__next" onClick={() => {
                    const idx = images.findIndex((i) => i.id === selectedId);
                    const nextIdx = (idx + 1) % images.length;
                    selectImage(images[nextIdx].id);
                  }}>
                    <i className="fa-solid fa-forward"></i> Next Image
                  </button>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* ---------- RIGHT PANEL (tools / info) ---------- */}
        <div className={`rbg-right ${mobileToolsOpen ? 'rbg-right--open' : ''}`}>
          <div className="rbg-right__sticky">
            <div className="rbg-right__header">
              <h3><i className="fa-solid fa-eraser"></i> Background Remover</h3>
              <button className="rbg-right__close" onClick={() => setMobileToolsOpen(false)} aria-label="Close panel">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Stats */}
            <div className="rbg-right__stats">
              <div className="rbg-stat">
                <span className="rbg-stat__label">Images</span>
                <span className="rbg-stat__value">{images.length}</span>
              </div>
              <div className="rbg-stat">
                <span className="rbg-stat__label">Size</span>
                <span className="rbg-stat__value">{fmtSize(totalSize)}</span>
              </div>
            </div>

            {/* Progress */}
            {images.length > 0 && (
              <div className="rbg-right__progress">
                <span className="rbg-right__progress-label">Processing Progress</span>
                <div className="rbg-progress-bar">
                  <div
                    className="rbg-progress-bar__fill"
                    style={{ width: `${images.length > 0 ? (doneCount / images.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="rbg-right__progress-status">
                  {processingCount > 0
                    ? `Processing ${processingCount} image${processingCount > 1 ? 's' : ''}…`
                    : doneCount === images.length
                    ? `All ${doneCount} image${doneCount > 1 ? 's' : ''} processed!`
                    : `${doneCount} / ${images.length} done`
                  }
                </span>
              </div>
            )}

            {/* Selected image info */}
            {selected && (
              <div className="rbg-right__info">
                <div className="rbg-info-row">
                  <span className="rbg-info-row__label">File Name</span>
                  <span className="rbg-info-row__value" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.file.name}
                  </span>
                </div>
                <div className="rbg-info-row">
                  <span className="rbg-info-row__label">Dimensions</span>
                  <span className="rbg-info-row__value">{selected.origW} × {selected.origH}</span>
                </div>
                <div className="rbg-info-row">
                  <span className="rbg-info-row__label">Size</span>
                  <span className="rbg-info-row__value">{fmtSize(selected.file.size)}</span>
                </div>
                <div className="rbg-info-row">
                  <span className="rbg-info-row__label">Type</span>
                  <span className="rbg-info-row__value">{getExt(selected.file.name)}</span>
                </div>
                <div className="rbg-info-row">
                  <span className="rbg-info-row__label">Status</span>
                  <span className="rbg-info-row__value" style={{
                    color: selected.status === 'done' ? '#10b981' : selected.status === 'processing' ? '#f59e0b' : selected.status === 'error' ? '#ef4444' : '#94a3b8'
                  }}>
                    {selected.status === 'done' ? '✓ Done' : selected.status === 'processing' ? '⏳ Processing' : selected.status === 'error' ? '✗ Error' : '⏸ Pending'}
                  </span>
                </div>
              </div>
            )}

            {/* Add More Images */}
            <button className="rbg-right__add" onClick={() => addFileInputRef.current?.click()}>
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

            {/* Download mode */}
            {images.length > 1 && (
              <div className="rbg-right__dl-mode">
                <label>Download as:</label>
                <div className="rbg-dl-toggle">
                  <button
                    className={`rbg-dl-toggle__btn ${downloadMode === 'zip' ? 'active' : ''}`}
                    onClick={() => setDownloadMode('zip')}
                  >
                    <i className="fa-solid fa-file-zipper"></i> ZIP
                  </button>
                  <button
                    className={`rbg-dl-toggle__btn ${downloadMode === 'separate' ? 'active' : ''}`}
                    onClick={() => setDownloadMode('separate')}
                  >
                    <i className="fa-regular fa-copy"></i> Separate
                  </button>
                </div>
              </div>
            )}

            {/* Start Over */}
            <button className="rbg-right__reset" onClick={handleStartOver}>
              <i className="fa-solid fa-arrow-rotate-left"></i> Start Over
            </button>

            {/* Sticky download */}
            <div className="rbg-right__actions">
              <button
                className="rbg-right__download"
                onClick={downloadAll}
                disabled={downloading || doneCount === 0}
              >
                {downloading ? (
                  <>
                    <span className="rbg-download-spinner"></span>
                    Downloading…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-download"></i> Download{images.length > 1 ? ' All' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default RemoveBackground;
