import React, { useState, useRef, useEffect, useCallback } from 'react';
import SEO from '../SEO/SEO';
import './ResizeImage.css';

/* ---- helpers ---- */
const fmtSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/* DPI for unit conversions (standard screen/print) */
const DPI = 96;
const CM_PER_INCH = 2.54;

/* Convert pixels ↔ other units */
const pxFromUnit = (val, unit) => {
  if (unit === 'pixel') return Math.round(val);
  if (unit === 'percentage') return val; // handled separately
  if (unit === 'inch') return Math.round(val * DPI);
  if (unit === 'cm') return Math.round((val / CM_PER_INCH) * DPI);
  return Math.round(val);
};

const unitFromPx = (px, unit) => {
  if (unit === 'pixel') return Math.round(px);
  if (unit === 'percentage') return 100; // default
  if (unit === 'inch') return parseFloat((px / DPI).toFixed(2));
  if (unit === 'cm') return parseFloat(((px / DPI) * CM_PER_INCH).toFixed(2));
  return px;
};

/* Resize using canvas */
const resizeImage = (file, targetW, targetH) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);
      /* Preserve original format */
      const mime = file.type || 'image/png';
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Resize failed'));
        },
        mime,
        1
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });

/* Load natural dimensions of an image file */
const loadDimensions = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ w: 0, h: 0 });
    };
    img.src = url;
  });

const RESIZE_MODES = [
  { value: 'pixel', label: 'By Pixels' },
  { value: 'percentage', label: 'By Percentage' },
  { value: 'cm', label: 'By Centimeters' },
  { value: 'inch', label: 'By Inches' },
];

/* ============================================= */
/*             IMAGE RESIZER PAGE                */
/* ============================================= */
const ResizeImage = () => {
  const [images, setImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [downloadMode, setDownloadMode] = useState('zip');
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  /* Resize settings */
  const [resizeMode, setResizeMode] = useState('pixel');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lockAspect, setLockAspect] = useState(true);
  const [dontEnlarge, setDontEnlarge] = useState(true);

  /* Aspect ratio from first image */
  const [aspectRatio, setAspectRatio] = useState(1);
  /* Original dimensions of the first image (reference) */
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);

  const fileInputRef = useRef(null);
  const addFileInputRef = useRef(null);

  /* --- warn before reload --- */
  useEffect(() => {
    const handler = (e) => {
      if (images.length > 0) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [images.length]);

  /* --- add files --- */
  const addFiles = useCallback(async (files) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!validFiles.length) return;
    const newImages = await Promise.all(
      validFiles.map(async (file) => {
        const dims = await loadDimensions(file);
        return {
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          origW: dims.w,
          origH: dims.h,
          resizedBlob: null,
          resizedSize: null,
        };
      })
    );
    setImages((prev) => {
      const merged = [...prev, ...newImages];
      /* Set defaults from the first image if this is the initial upload */
      if (prev.length === 0 && newImages.length > 0) {
        const first = newImages[0];
        setOrigW(first.origW);
        setOrigH(first.origH);
        setAspectRatio(first.origW / first.origH);
        setWidth(unitFromPx(first.origW, resizeMode));
        setHeight(unitFromPx(first.origH, resizeMode));
      }
      return merged;
    });
  }, [resizeMode]);

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

  /* --- handle dimension changes with aspect lock --- */
  const handleWidthChange = (val) => {
    const v = val === '' ? '' : Number(val);
    setWidth(v);
    if (lockAspect && v !== '' && aspectRatio) {
      if (resizeMode === 'percentage') {
        setHeight(v);
      } else {
        const wPx = pxFromUnit(v, resizeMode);
        const hPx = Math.round(wPx / aspectRatio);
        setHeight(unitFromPx(hPx, resizeMode));
      }
    }
    /* Clear previous resized blobs */
    setImages((prev) => prev.map((img) => ({ ...img, resizedBlob: null, resizedSize: null })));
  };

  const handleHeightChange = (val) => {
    const v = val === '' ? '' : Number(val);
    setHeight(v);
    if (lockAspect && v !== '' && aspectRatio) {
      if (resizeMode === 'percentage') {
        setWidth(v);
      } else {
        const hPx = pxFromUnit(v, resizeMode);
        const wPx = Math.round(hPx * aspectRatio);
        setWidth(unitFromPx(wPx, resizeMode));
      }
    }
    setImages((prev) => prev.map((img) => ({ ...img, resizedBlob: null, resizedSize: null })));
  };

  /* --- when resize mode changes, recalculate width/height --- */
  const handleModeChange = (mode) => {
    /* Convert current values back to px, then to new unit */
    let curWPx = origW;
    let curHPx = origH;
    if (width !== '' && height !== '') {
      if (resizeMode === 'percentage') {
        curWPx = Math.round(origW * width / 100);
        curHPx = Math.round(origH * height / 100);
      } else {
        curWPx = pxFromUnit(width, resizeMode);
        curHPx = pxFromUnit(height, resizeMode);
      }
    }
    setResizeMode(mode);
    if (mode === 'percentage') {
      setWidth(origW > 0 ? Math.round((curWPx / origW) * 100) : 100);
      setHeight(origH > 0 ? Math.round((curHPx / origH) * 100) : 100);
    } else {
      setWidth(unitFromPx(curWPx, mode));
      setHeight(unitFromPx(curHPx, mode));
    }
    setImages((prev) => prev.map((img) => ({ ...img, resizedBlob: null, resizedSize: null })));
  };

  /* --- compute final pixel dimensions for an image --- */
  const getFinalDims = (img) => {
    let targetW, targetH;
    if (resizeMode === 'percentage') {
      targetW = Math.round(img.origW * (width || 100) / 100);
      targetH = Math.round(img.origH * (height || 100) / 100);
    } else {
      targetW = pxFromUnit(width || unitFromPx(img.origW, resizeMode), resizeMode);
      targetH = pxFromUnit(height || unitFromPx(img.origH, resizeMode), resizeMode);
    }
    if (dontEnlarge) {
      targetW = Math.min(targetW, img.origW);
      targetH = Math.min(targetH, img.origH);
    }
    return { w: Math.max(1, targetW), h: Math.max(1, targetH) };
  };

  /* --- resize all images --- */
  const resizeAll = async () => {
    setResizing(true);
    try {
      const results = await Promise.all(
        images.map(async (img) => {
          if (img.resizedBlob) return null;
          const dims = getFinalDims(img);
          const blob = await resizeImage(img.file, dims.w, dims.h);
          return { id: img.id, blob, size: blob.size };
        })
      );
      setImages((prev) =>
        prev.map((img) => {
          const r = results.find((x) => x && x.id === img.id);
          if (!r) return img;
          return { ...img, resizedBlob: r.blob, resizedSize: r.size };
        })
      );
    } catch (err) {
      console.error('Resize error:', err);
    }
    setResizing(false);
  };

  /* --- remove image --- */
  const removeImage = (id) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      const remaining = prev.filter((i) => i.id !== id);
      /* If first image was removed, update dimensions from new first image */
      if (remaining.length > 0 && prev[0]?.id === id) {
        const newFirst = remaining[0];
        setOrigW(newFirst.origW);
        setOrigH(newFirst.origH);
        setAspectRatio(newFirst.origW / newFirst.origH);
        setWidth(unitFromPx(newFirst.origW, resizeMode));
        setHeight(unitFromPx(newFirst.origH, resizeMode));
      }
      return remaining;
    });
  };

  /* --- download single --- */
  const downloadSingle = (img) => {
    if (!img.resizedBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(img.resizedBlob);
    const baseName = img.file.name.replace(/\.[^.]+$/, '');
    const ext = img.file.name.match(/\.[^.]+$/)?.[0] || '.png';
    a.download = `${baseName}-resized${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* --- download separate --- */
  const downloadSeparate = () => {
    const ready = images.filter((i) => i.resizedBlob);
    ready.forEach((img) => downloadSingle(img));
  };

  /* --- download zip --- */
  const downloadZip = async () => {
    const ready = images.filter((i) => i.resizedBlob);
    if (!ready.length) return;
    if (!window.JSZip) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      document.head.appendChild(s);
      await new Promise((r) => (s.onload = r));
    }
    const zip = new window.JSZip();
    ready.forEach((img) => {
      const baseName = img.file.name.replace(/\.[^.]+$/, '');
      const ext = img.file.name.match(/\.[^.]+$/)?.[0] || '.png';
      zip.file(`${baseName}-resized${ext}`, img.resizedBlob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'resized-images.zip';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* --- download all (respects mode) --- */
  const downloadAll = () => {
    const ready = images.filter((i) => i.resizedBlob);
    if (!ready.length) return;
    if (ready.length === 1) { downloadSingle(ready[0]); return; }
    if (downloadMode === 'zip') downloadZip();
    else downloadSeparate();
  };

  /* --- start over --- */
  const handleStartOver = () => {
    const confirmed = window.confirm('Are you sure you want to remove all images and start over?');
    if (!confirmed) return;
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    setImages([]);
    setWidth('');
    setHeight('');
  };

  /* --- drag & drop --- */
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  /* --- computed --- */
  const totalOriginal = images.reduce((s, i) => s + i.file.size, 0);
  const allResized = images.length > 0 && images.every((i) => i.resizedBlob);

  /* Unit suffix for inputs */
  const unitSuffix = resizeMode === 'pixel' ? 'px' : resizeMode === 'percentage' ? '%' : resizeMode === 'cm' ? 'cm' : 'in';
  const inputStep = resizeMode === 'pixel' || resizeMode === 'percentage' ? 1 : 0.1;

  /* =========================== UPLOAD VIEW =========================== */
  if (!images.length) {
    return (
      <>
        <SEO
          title="Resize Image Online — Resize JPG, PNG, SVG, GIF Free | favIMG"
          description="Resize images online for free by pixel or percentage. Resize JPG, PNG, SVG and GIF images while preserving quality. No signup required."
          keywords="resize image, image resizer, resize jpg, resize png, change image dimensions, resize photo online free"
        />
        <section className="rsz-upload">
          <div className="rsz-upload__inner">
            <h1 className="rsz-upload__title">Resize Image</h1>
            <p className="rsz-upload__desc">
              Define your dimensions by pixel, percentage, centimeters or inches and resize your JPG, PNG, SVG and GIF images instantly. Batch resize multiple files at once.
            </p>

            <div
              className={`rsz-dropzone ${dragOver ? 'rsz-dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="rsz-dropzone__cloud">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <h3>Drop your images here</h3>
              <p>or <span className="rsz-dropzone__browse" onClick={() => fileInputRef.current?.click()}>browse files</span> to resize</p>
              <p className="rsz-dropzone__hint">
                <i className="fa-regular fa-keyboard"></i> You can also paste images with <kbd>Ctrl</kbd> + <kbd>V</kbd>
              </p>
              <button className="rsz-dropzone__btn" onClick={() => fileInputRef.current?.click()}>
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
  return (
    <>
      <SEO
        title="Resizing Images — favIMG Image Resizer"
        description="Resize images online for free by pixel or percentage. No signup required."
        keywords="resize image, image resizer, resize jpg, resize png"
      />

      <section className="rsz-workspace">
        {/* Mobile settings toggle */}
        <button
          className="rsz-settings-toggle"
          onClick={() => setMobileToolsOpen((prev) => !prev)}
          aria-label="Toggle tools panel"
        >
          <i className={mobileToolsOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-gear'}></i>
        </button>

        {mobileToolsOpen && (
          <div className="rsz-overlay" onClick={() => setMobileToolsOpen(false)} />
        )}

        {/* ---------- LEFT PANEL (Preview) ---------- */}
        <div className="rsz-left">
          <div className="rsz-cards">
            {images.map((img) => (
              <div className="rsz-card" key={img.id}>
                <button className="rsz-card__remove" title="Remove" onClick={() => removeImage(img.id)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="rsz-card__preview">
                  <img src={img.preview} alt={img.file.name} />
                </div>

                <div className="rsz-card__body">
                  <span className="rsz-card__name" title={img.file.name}>
                    <i className="fa-regular fa-image"></i> {img.file.name}
                  </span>
                  <div className="rsz-card__meta">
                    <span className="rsz-card__dims">
                      <i className="fa-solid fa-ruler-combined"></i> {img.origW} × {img.origH}
                    </span>
                    {img.resizedBlob && (
                      <>
                        <i className="fa-solid fa-arrow-right rsz-card__arrow"></i>
                        <span className="rsz-card__dims rsz-card__dims--new">
                          {getFinalDims(img).w} × {getFinalDims(img).h}
                        </span>
                      </>
                    )}
                    <span className="rsz-card__size">
                      <i className="fa-solid fa-weight-hanging"></i> {fmtSize(img.file.size)}
                    </span>
                  </div>

                  {img.resizedBlob && (
                    <button className="rsz-card__dl" onClick={() => downloadSingle(img)}>
                      <i className="fa-solid fa-download"></i> Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- RIGHT PANEL (Tools) ---------- */}
        <div className={`rsz-right ${mobileToolsOpen ? 'rsz-right--open' : ''}`}>
          <div className="rsz-right__sticky">
            <div className="rsz-right__header">
              <h3><i className="fa-solid fa-up-right-and-down-left-from-center"></i> Resize Settings</h3>
              <button className="rsz-right__close" onClick={() => setMobileToolsOpen(false)} aria-label="Close panel">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Summary stats */}
            <div className="rsz-right__stats">
              <div className="rsz-stat">
                <span className="rsz-stat__label">Images</span>
                <span className="rsz-stat__value">{images.length}</span>
              </div>
              <div className="rsz-stat">
                <span className="rsz-stat__label">Total Size</span>
                <span className="rsz-stat__value">{fmtSize(totalOriginal)}</span>
              </div>
            </div>

            {/* Resize mode dropdown */}
            <div className="rsz-right__section">
              <label className="rsz-right__label">Resize by:</label>
              <select
                className="rsz-select"
                value={resizeMode}
                onChange={(e) => handleModeChange(e.target.value)}
              >
                {RESIZE_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Width & Height inputs */}
            <div className="rsz-right__section">
              <div className="rsz-dims">
                <div className="rsz-dim">
                  <label className="rsz-dim__label">Width</label>
                  <div className="rsz-dim__input-wrap">
                    <div className="rsz-dim__arrows">
                      <button type="button" className="rsz-dim__arrow" onClick={() => handleWidthChange(parseFloat((Number(width || 0) + inputStep).toFixed(2)))} tabIndex={-1}>
                        <i className="fa-solid fa-chevron-up"></i>
                      </button>
                      <button type="button" className="rsz-dim__arrow" onClick={() => handleWidthChange(Math.max(inputStep, parseFloat((Number(width || 0) - inputStep).toFixed(2))))} tabIndex={-1}>
                        <i className="fa-solid fa-chevron-down"></i>
                      </button>
                    </div>
                    <input
                      type="number"
                      className="rsz-dim__input"
                      value={width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      min={resizeMode === 'percentage' ? 1 : 1}
                      step={resizeMode === 'pixel' ? 1 : resizeMode === 'percentage' ? 1 : 0.01}
                    />
                    <span className="rsz-dim__unit">{unitSuffix}</span>
                  </div>
                </div>
                <div className="rsz-dim__link">
                  <button
                    className={`rsz-dim__lock ${lockAspect ? 'active' : ''}`}
                    onClick={() => setLockAspect((p) => !p)}
                    title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                  >
                    <i className={lockAspect ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'}></i>
                  </button>
                </div>
                <div className="rsz-dim">
                  <label className="rsz-dim__label">Height</label>
                  <div className="rsz-dim__input-wrap">
                    <div className="rsz-dim__arrows">
                      <button type="button" className="rsz-dim__arrow" onClick={() => handleHeightChange(parseFloat((Number(height || 0) + inputStep).toFixed(2)))} tabIndex={-1}>
                        <i className="fa-solid fa-chevron-up"></i>
                      </button>
                      <button type="button" className="rsz-dim__arrow" onClick={() => handleHeightChange(Math.max(inputStep, parseFloat((Number(height || 0) - inputStep).toFixed(2))))} tabIndex={-1}>
                        <i className="fa-solid fa-chevron-down"></i>
                      </button>
                    </div>
                    <input
                      type="number"
                      className="rsz-dim__input"
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      min={resizeMode === 'percentage' ? 1 : 1}
                      step={resizeMode === 'pixel' ? 1 : resizeMode === 'percentage' ? 1 : 0.01}
                    />
                    <span className="rsz-dim__unit">{unitSuffix}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced options */}
            <div className="rsz-right__section">
              <label className="rsz-right__label">Advanced</label>
              <div className="rsz-toggle-list">
                <label className="rsz-toggle-item">
                  <input
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => setLockAspect(e.target.checked)}
                  />
                  <span className="rsz-toggle-item__check">
                    <i className="fa-solid fa-check"></i>
                  </span>
                  <span>Lock aspect ratio</span>
                </label>
                <label className="rsz-toggle-item">
                  <input
                    type="checkbox"
                    checked={dontEnlarge}
                    onChange={(e) => setDontEnlarge(e.target.checked)}
                  />
                  <span className="rsz-toggle-item__check">
                    <i className="fa-solid fa-check"></i>
                  </span>
                  <span>Don't enlarge if original is smaller</span>
                </label>
              </div>
            </div>

            {/* Add more images */}
            <button className="rsz-right__add" onClick={() => addFileInputRef.current?.click()}>
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

            {/* Download mode selector */}
            {images.length > 1 && (
              <div className="rsz-right__dl-mode">
                <label>Download as:</label>
                <div className="rsz-dl-toggle">
                  <button
                    className={`rsz-dl-toggle__btn ${downloadMode === 'zip' ? 'active' : ''}`}
                    onClick={() => setDownloadMode('zip')}
                  >
                    <i className="fa-solid fa-file-zipper"></i> ZIP
                  </button>
                  <button
                    className={`rsz-dl-toggle__btn ${downloadMode === 'separate' ? 'active' : ''}`}
                    onClick={() => setDownloadMode('separate')}
                  >
                    <i className="fa-regular fa-copy"></i> Separate
                  </button>
                </div>
              </div>
            )}

            <button className="rsz-right__reset" onClick={handleStartOver}>
              <i className="fa-solid fa-arrow-rotate-left"></i> Start Over
            </button>

            {/* Sticky download button */}
            <div className="rsz-right__actions">
              <button
                className="rsz-right__download"
                onClick={allResized ? downloadAll : resizeAll}
                disabled={resizing || width === '' || height === ''}
              >
                {resizing ? (
                  <>
                    <span className="rsz-download-spinner"></span>
                    Resizing…
                  </>
                ) : allResized ? (
                  <>
                    <i className="fa-solid fa-download"></i> Download {images.length > 1 ? 'All' : ''}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-bolt"></i> Resize & Download
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

export default ResizeImage;
