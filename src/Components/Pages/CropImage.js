import React, { useState, useRef, useEffect, useCallback } from 'react';
import SEO from '../SEO/SEO';
import './CropImage.css';

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

/* Crop using canvas */
const cropImageCanvas = (file, box) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = box.w;
      canvas.height = box.h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      let mime = file.type || 'image/png';
      if (mime === 'image/svg+xml') mime = 'image/png';
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          blob ? resolve(blob) : reject(new Error('Crop failed'));
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

const TEMPLATES = [
  { key: 'landscape', label: 'Landscape', ratio: 16 / 9, display: '16:9' },
  { key: 'portrait', label: 'Portrait', ratio: 9 / 16, display: '9:16' },
  { key: 'square', label: 'Square', ratio: 1, display: '1:1' },
  { key: 'freeform', label: 'Freeform', ratio: null, display: null },
];

/* ============================================= */
/*             IMAGE CROPPER PAGE                */
/* ============================================= */
const CropImage = () => {
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [downloadMode, setDownloadMode] = useState('zip');
  const [cropping, setCropping] = useState(false);
  const [croppedIds, setCroppedIds] = useState(new Set()); /* track which images user has actually cropped */
  const [notAllCroppedMsg, setNotAllCroppedMsg] = useState(null); /* { cropped, total } or null */

  /* Active crop box for the selected image */
  const [activeCrop, setActiveCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [template, setTemplate] = useState('freeform');

  /* Image natural dims & display scale */
  const [imgNatW, setImgNatW] = useState(0);
  const [imgNatH, setImgNatH] = useState(0);
  const [scale, setScale] = useState(1);

  /* Refs */
  const cropBoxesRef = useRef({}); /* { [id]: {x,y,w,h} } */
  const fileInputRef = useRef(null);
  const addFileInputRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const selected = images.find((i) => i.id === selectedId) || null;
  const totalSize = images.reduce((s, i) => s + i.file.size, 0);

  /* --- beforeunload --- */
  useEffect(() => {
    const h = (e) => {
      if (images.length) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [images.length]);

  /* --- add files --- */
  const addFiles = useCallback(async (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!valid.length) return;
    const newImgs = await Promise.all(
      valid.map(async (file) => {
        const dims = await loadDimensions(file);
        const id = crypto.randomUUID();
        /* Default crop: 15% margin from all borders */
        const mx = Math.round(dims.w * 0.15);
        const my = Math.round(dims.h * 0.15);
        cropBoxesRef.current[id] = { x: mx, y: my, w: dims.w - mx * 2, h: dims.h - my * 2 };
        return { id, file, preview: URL.createObjectURL(file), origW: dims.w, origH: dims.h };
      })
    );
    setImages((prev) => {
      const merged = [...prev, ...newImgs];
      if (prev.length === 0 && newImgs.length > 0) {
        setSelectedId(newImgs[0].id);
        const first = newImgs[0];
        const mx = Math.round(first.origW * 0.15);
        const my = Math.round(first.origH * 0.15);
        setActiveCrop({ x: mx, y: my, w: first.origW - mx * 2, h: first.origH - my * 2 });
      }
      return merged;
    });
  }, []);

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
    if (selectedId) cropBoxesRef.current[selectedId] = { ...activeCrop };
    setSelectedId(id);
    const box = cropBoxesRef.current[id];
    if (box) setActiveCrop({ ...box });
  };

  /* --- image load --- */
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setImgNatW(img.naturalWidth);
    setImgNatH(img.naturalHeight);
    if (img.clientWidth && img.naturalWidth) {
      setScale(img.clientWidth / img.naturalWidth);
    }
  }, []);

  /* --- ResizeObserver for scale --- */
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const observer = new ResizeObserver(() => {
      if (img.clientWidth && img.naturalWidth) {
        setScale(img.clientWidth / img.naturalWidth);
      }
    });
    observer.observe(img);
    return () => observer.disconnect();
  }, [selected]);

  /* --- clamp helper --- */
  const clampBox = useCallback(
    (box) => {
      let { x, y, w, h } = box;
      w = Math.max(1, Math.min(Math.round(w), imgNatW));
      h = Math.max(1, Math.min(Math.round(h), imgNatH));
      x = Math.max(0, Math.min(Math.round(x), imgNatW - w));
      y = Math.max(0, Math.min(Math.round(y), imgNatH - h));
      return { x, y, w, h };
    },
    [imgNatW, imgNatH]
  );

  /* --- input handlers --- */
  const handleCropW = (val) => {
    let w = Math.max(1, Math.min(Number(val) || 1, imgNatW));
    let { x, y, h } = activeCrop;
    const tmpl = TEMPLATES.find((t) => t.key === template);
    if (tmpl?.ratio) h = Math.round(w / tmpl.ratio);
    setActiveCrop(clampBox({ x, y, w, h }));
    markCropped();
  };

  const handleCropH = (val) => {
    let h = Math.max(1, Math.min(Number(val) || 1, imgNatH));
    let { x, y, w } = activeCrop;
    const tmpl = TEMPLATES.find((t) => t.key === template);
    if (tmpl?.ratio) w = Math.round(h * tmpl.ratio);
    setActiveCrop(clampBox({ x, y, w, h }));
    markCropped();
  };

  const centerX = Math.round(activeCrop.x + activeCrop.w / 2);
  const centerY = Math.round(activeCrop.y + activeCrop.h / 2);

  const handlePosX = (val) => {
    const cx = Number(val) || 0;
    setActiveCrop(clampBox({ ...activeCrop, x: cx - activeCrop.w / 2 }));
    markCropped();
  };

  const handlePosY = (val) => {
    const cy = Number(val) || 0;
    setActiveCrop(clampBox({ ...activeCrop, y: cy - activeCrop.h / 2 }));
    markCropped();
  };

  /* --- template change --- */
  const handleTemplateChange = (key) => {
    setTemplate(key);
    const tmpl = TEMPLATES.find((t) => t.key === key);
    if (!tmpl?.ratio) {
      /* Freeform: auto-close on mobile */
      if (window.innerWidth <= 900) setMobileToolsOpen(false);
      return;
    }
    const ratio = tmpl.ratio;
    /* Fit inside image with 15% margin */
    const maxW = imgNatW * 0.7;
    const maxH = imgNatH * 0.7;
    let w, h;
    if (maxW / maxH > ratio) {
      h = maxH;
      w = Math.round(h * ratio);
    } else {
      w = maxW;
      h = Math.round(w / ratio);
    }
    const x = Math.round((imgNatW - w) / 2);
    const y = Math.round((imgNatH - h) / 2);
    setActiveCrop(clampBox({ x, y, w, h }));
    markCropped();
    /* Auto-close tools panel on mobile */
    if (window.innerWidth <= 900) setMobileToolsOpen(false);
  };

  /* --- drag crop box (move) --- */
  const startDrag = (e) => {
    if (e.target.closest('.crp-handle')) return;
    e.preventDefault();
    const startX = e.clientX ?? e.touches?.[0]?.clientX;
    const startY = e.clientY ?? e.touches?.[0]?.clientY;
    const startBox = { ...activeCrop };
    let moved = false;

    const onMove = (ev) => {
      ev.preventDefault();
      moved = true;
      const cx = ev.clientX ?? ev.touches?.[0]?.clientX;
      const cy = ev.clientY ?? ev.touches?.[0]?.clientY;
      const dx = (cx - startX) / scale;
      const dy = (cy - startY) / scale;
      setActiveCrop(clampBox({ x: startBox.x + dx, y: startBox.y + dy, w: startBox.w, h: startBox.h }));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      if (moved) markCropped();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  };

  /* --- resize handles --- */
  const startResize = (e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX ?? e.touches?.[0]?.clientX;
    const startY = e.clientY ?? e.touches?.[0]?.clientY;
    const startBox = { ...activeCrop };
    const tmpl = TEMPLATES.find((t) => t.key === template);
    const ratio = tmpl?.ratio || null;
    let moved = false;

    const onMove = (ev) => {
      ev.preventDefault();
      moved = true;
      const cx = ev.clientX ?? ev.touches?.[0]?.clientX;
      const cy = ev.clientY ?? ev.touches?.[0]?.clientY;
      const dx = (cx - startX) / scale;
      const dy = (cy - startY) / scale;
      let { x, y, w, h } = startBox;

      if (handle.includes('e')) w += dx;
      if (handle.includes('w')) { w -= dx; x += dx; }
      if (handle.includes('s')) h += dy;
      if (handle.includes('n')) { h -= dy; y += dy; }

      /* Enforce aspect ratio */
      if (ratio) {
        if (handle === 'n' || handle === 's') {
          w = h * ratio;
        } else if (handle === 'e' || handle === 'w') {
          h = w / ratio;
        } else {
          /* Corner handles — base on dominant axis */
          if (Math.abs(dx) >= Math.abs(dy)) {
            h = w / ratio;
          } else {
            w = h * ratio;
          }
        }
      }

      w = Math.max(10, w);
      h = Math.max(10, h);
      setActiveCrop(clampBox({ x, y, w, h }));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      if (moved) markCropped();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  };

  /* --- remove image --- */
  const removeImage = (id) => {
    const img = images.find((i) => i.id === id);
    if (img) URL.revokeObjectURL(img.preview);
    delete cropBoxesRef.current[id];
    const remaining = images.filter((i) => i.id !== id);
    setImages(remaining);
    if (id === selectedId && remaining.length > 0) {
      const newSel = remaining[0];
      setSelectedId(newSel.id);
      const box = cropBoxesRef.current[newSel.id];
      if (box) setActiveCrop({ ...box });
    }
  };

  /* --- save current crop box (does NOT mark as cropped) --- */
  const saveCropBox = () => {
    if (selectedId) {
      cropBoxesRef.current[selectedId] = { ...activeCrop };
    }
  };

  /* --- mark image as user-cropped --- */
  const markCropped = () => {
    if (selectedId) {
      setCroppedIds((prev) => new Set(prev).add(selectedId));
    }
  };

  /* --- save & go to next image --- */
  const saveAndNext = () => {
    saveCropBox();
    const idx = images.findIndex((i) => i.id === selectedId);
    const nextIdx = (idx + 1) % images.length;
    selectImage(images[nextIdx].id);
  };

  /* --- crop & download single --- */
  const cropAndDownloadSingle = async (img) => {
    if (!img) return;
    saveCropBox();
    const box = cropBoxesRef.current[img.id];
    if (!box) return;
    try {
      const blob = await cropImageCanvas(img.file, box);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const baseName = img.file.name.replace(/\.[^.]+$/, '');
      const ext = img.file.name.match(/\.[^.]+$/)?.[0] || '.png';
      a.download = `${baseName}-cropped${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Crop error:', err);
    }
  };

  /* --- download helper (processes a list of images) --- */
  const performDownload = async (toCrop) => {
    setCropping(true);
    try {
      const results = await Promise.all(
        toCrop.map(async (img) => {
          const box = cropBoxesRef.current[img.id];
          const blob = await cropImageCanvas(img.file, box);
          return { img, blob };
        })
      );

      if (results.length === 1) {
        const { img, blob } = results[0];
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const baseName = img.file.name.replace(/\.[^.]+$/, '');
        const ext = img.file.name.match(/\.[^.]+$/)?.[0] || '.png';
        a.download = `${baseName}-cropped${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      } else if (downloadMode === 'zip') {
        if (!window.JSZip) {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          document.head.appendChild(s);
          await new Promise((r) => (s.onload = r));
        }
        const zip = new window.JSZip();
        results.forEach(({ img, blob }) => {
          const baseName = img.file.name.replace(/\.[^.]+$/, '');
          const ext = img.file.name.match(/\.[^.]+$/)?.[0] || '.png';
          zip.file(`${baseName}-cropped${ext}`, blob);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'cropped-images.zip';
        a.click();
        URL.revokeObjectURL(a.href);
      } else {
        for (const { img, blob } of results) {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          const baseName = img.file.name.replace(/\.[^.]+$/, '');
          const ext = img.file.name.match(/\.[^.]+$/)?.[0] || '.png';
          a.download = `${baseName}-cropped${ext}`;
          a.click();
          URL.revokeObjectURL(a.href);
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    } catch (err) {
      console.error('Crop error:', err);
    }
    setCropping(false);
  };

  /* --- crop & download all --- */
  const cropAndDownloadAll = async () => {
    saveCropBox();
    const croppedList = images.filter((img) => croppedIds.has(img.id));
    const allCropped = croppedList.length === images.length;
    if (!allCropped && images.length > 1) {
      setNotAllCroppedMsg({ cropped: croppedList.length, total: images.length });
      return;
    }
    await performDownload(croppedList);
  };

  /* --- download only cropped (from modal) --- */
  const downloadCroppedOnly = async () => {
    setNotAllCroppedMsg(null);
    const croppedList = images.filter((img) => croppedIds.has(img.id));
    if (!croppedList.length) return;
    await performDownload(croppedList);
  };

  /* --- start over --- */
  const handleStartOver = () => {
    if (!window.confirm('Are you sure you want to remove all images and start over?')) return;
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    cropBoxesRef.current = {};
    setImages([]);
    setSelectedId(null);
    setActiveCrop({ x: 0, y: 0, w: 0, h: 0 });
    setTemplate('freeform');
    setCroppedIds(new Set());
  };

  /* --- drag & drop --- */
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  /* =========================== UPLOAD VIEW =========================== */
  if (!images.length) {
    return (
      <>
        <SEO
          title="Crop Image Online — Crop JPG, PNG, GIF Free | favIMG"
          description="Crop JPG, PNG and GIF images online with ease. Choose pixels to define your crop area or use our visual editor. Free, fast and private."
          keywords="crop image, image cropper, crop jpg, crop png, crop photo online free, image crop tool"
        />
        <section className="crp-upload">
          <div className="crp-upload__inner">
            <h1 className="crp-upload__title">Crop Image</h1>
            <p className="crp-upload__desc">
              Crop JPG, PNG, GIF &amp; more with our visual editor. Choose from preset ratios or free-form crop. Runs entirely in your browser.
            </p>

            <div
              className={`crp-dropzone ${dragOver ? 'crp-dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="crp-dropzone__cloud">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <h3>Drop your images here</h3>
              <p>or <span className="crp-dropzone__browse" onClick={() => fileInputRef.current?.click()}>browse files</span> to crop</p>
              <p className="crp-dropzone__hint">
                <i className="fa-regular fa-keyboard"></i> You can also paste images with <kbd>Ctrl</kbd> + <kbd>V</kbd>
              </p>
              <button className="crp-dropzone__btn" onClick={() => fileInputRef.current?.click()}>
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
        title="Cropping Images — favIMG Image Cropper"
        description="Crop images online for free. Visual crop editor with preset ratios. No signup required."
        keywords="crop image, image cropper, crop jpg, crop png"
      />

      <section className="crp-workspace">
        {/* Mobile settings toggle */}
        <button
          className="crp-settings-toggle"
          onClick={() => setMobileToolsOpen((p) => !p)}
          aria-label="Toggle tools panel"
        >
          <i className={mobileToolsOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-gear'}></i>
        </button>

        {mobileToolsOpen && <div className="crp-overlay" onClick={() => setMobileToolsOpen(false)} />}

        {/* ---------- PREVIEW PANEL (multi-image) ---------- */}
        {isMulti && (
          <div className="crp-preview">
            <div className="crp-preview__stat">
              <span className="crp-preview__stat-value">{images.length} Images</span>
              <span className="crp-preview__stat-label">{fmtSize(totalSize)}</span>
            </div>
            <div className="crp-preview__list">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`crp-preview__item ${img.id === selectedId ? 'crp-preview__item--active' : ''}`}
                  onClick={() => selectImage(img.id)}
                >
                  <button
                    className="crp-preview__remove"
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    title="Remove"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                  <img src={img.preview} alt="" draggable={false} />
                  <div className="crp-preview__meta">
                    <span className="crp-preview__size">{fmtSize(img.file.size)}</span>
                    <span className="crp-preview__type">{getExt(img.file.name)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- LEFT PANEL (crop canvas) ---------- */}
        <div className="crp-left">
          {selected && (
            <div className="crp-canvas-wrap">
              <div className="crp-canvas" ref={canvasRef}>
                <img
                  ref={imgRef}
                  src={selected.preview}
                  alt=""
                  onLoad={handleImageLoad}
                  draggable={false}
                />
                {/* Crop overlay */}
                <div
                  className="crp-selection"
                  style={{
                    left: activeCrop.x * scale,
                    top: activeCrop.y * scale,
                    width: activeCrop.w * scale,
                    height: activeCrop.h * scale,
                  }}
                  onMouseDown={startDrag}
                  onTouchStart={startDrag}
                >
                  {/* Rule-of-thirds grid */}
                  <div className="crp-grid">
                    <div className="crp-grid__row" style={{ top: '33.33%' }} />
                    <div className="crp-grid__row" style={{ top: '66.66%' }} />
                    <div className="crp-grid__col" style={{ left: '33.33%' }} />
                    <div className="crp-grid__col" style={{ left: '66.66%' }} />
                  </div>
                  {/* Corner handles */}
                  <div className="crp-handle crp-handle--nw" onMouseDown={(e) => startResize(e, 'nw')} onTouchStart={(e) => startResize(e, 'nw')} />
                  <div className="crp-handle crp-handle--ne" onMouseDown={(e) => startResize(e, 'ne')} onTouchStart={(e) => startResize(e, 'ne')} />
                  <div className="crp-handle crp-handle--sw" onMouseDown={(e) => startResize(e, 'sw')} onTouchStart={(e) => startResize(e, 'sw')} />
                  <div className="crp-handle crp-handle--se" onMouseDown={(e) => startResize(e, 'se')} onTouchStart={(e) => startResize(e, 'se')} />
                  {/* Edge handles */}
                  <div className="crp-handle crp-handle--n" onMouseDown={(e) => startResize(e, 'n')} onTouchStart={(e) => startResize(e, 'n')} />
                  <div className="crp-handle crp-handle--s" onMouseDown={(e) => startResize(e, 's')} onTouchStart={(e) => startResize(e, 's')} />
                  <div className="crp-handle crp-handle--e" onMouseDown={(e) => startResize(e, 'e')} onTouchStart={(e) => startResize(e, 'e')} />
                  <div className="crp-handle crp-handle--w" onMouseDown={(e) => startResize(e, 'w')} onTouchStart={(e) => startResize(e, 'w')} />
                </div>
              </div>

              {/* Action buttons below image */}
              <div className="crp-left__actions">
                <button className="crp-left__download" onClick={() => cropAndDownloadSingle(selected)}>
                  <i className="fa-solid fa-download"></i> Download
                </button>
                {isMulti && (
                  <button className="crp-left__next" onClick={saveAndNext}>
                    <i className="fa-solid fa-forward"></i> Save & Next
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---------- RIGHT PANEL (tools) ---------- */}
        <div className={`crp-right ${mobileToolsOpen ? 'crp-right--open' : ''}`}>
          <div className="crp-right__sticky">
            <div className="crp-right__header">
              <h3><i className="fa-solid fa-crop-simple"></i> Crop Settings</h3>
              <button className="crp-right__close" onClick={() => setMobileToolsOpen(false)} aria-label="Close panel">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Selected image stats */}
            <div className="crp-right__stats">
              <div className="crp-stat">
                <span className="crp-stat__label">Size</span>
                <span className="crp-stat__value">{fmtSize(selected?.file.size || 0)}</span>
              </div>
              <div className="crp-stat">
                <span className="crp-stat__label">Type</span>
                <span className="crp-stat__value">{selected ? getExt(selected.file.name) : '—'}</span>
              </div>
            </div>

            {/* Crop dimensions */}
            <div className="crp-right__section">
              <div className="crp-input-row">
                <label className="crp-input-row__label">Width (px)</label>
                <div className="crp-input-wrap">
                  <input
                    type="number"
                    className="crp-input"
                    value={activeCrop.w}
                    onChange={(e) => handleCropW(e.target.value)}
                    min={1}
                    max={imgNatW}
                  />
                  <div className="crp-input__arrows">
                    <button type="button" tabIndex={-1} onClick={() => handleCropW(activeCrop.w + 1)}>
                      <i className="fa-solid fa-chevron-up"></i>
                    </button>
                    <button type="button" tabIndex={-1} onClick={() => handleCropW(Math.max(1, activeCrop.w - 1))}>
                      <i className="fa-solid fa-chevron-down"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="crp-input-row">
                <label className="crp-input-row__label">Height (px)</label>
                <div className="crp-input-wrap">
                  <input
                    type="number"
                    className="crp-input"
                    value={activeCrop.h}
                    onChange={(e) => handleCropH(e.target.value)}
                    min={1}
                    max={imgNatH}
                  />
                  <div className="crp-input__arrows">
                    <button type="button" tabIndex={-1} onClick={() => handleCropH(activeCrop.h + 1)}>
                      <i className="fa-solid fa-chevron-up"></i>
                    </button>
                    <button type="button" tabIndex={-1} onClick={() => handleCropH(Math.max(1, activeCrop.h - 1))}>
                      <i className="fa-solid fa-chevron-down"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="crp-input-row">
                <label className="crp-input-row__label">Position X (px)</label>
                <div className="crp-input-wrap">
                  <input
                    type="number"
                    className="crp-input"
                    value={centerX}
                    onChange={(e) => handlePosX(e.target.value)}
                    min={0}
                    max={imgNatW}
                  />
                  <div className="crp-input__arrows">
                    <button type="button" tabIndex={-1} onClick={() => handlePosX(centerX + 1)}>
                      <i className="fa-solid fa-chevron-up"></i>
                    </button>
                    <button type="button" tabIndex={-1} onClick={() => handlePosX(Math.max(0, centerX - 1))}>
                      <i className="fa-solid fa-chevron-down"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="crp-input-row">
                <label className="crp-input-row__label">Position Y (px)</label>
                <div className="crp-input-wrap">
                  <input
                    type="number"
                    className="crp-input"
                    value={centerY}
                    onChange={(e) => handlePosY(e.target.value)}
                    min={0}
                    max={imgNatH}
                  />
                  <div className="crp-input__arrows">
                    <button type="button" tabIndex={-1} onClick={() => handlePosY(centerY + 1)}>
                      <i className="fa-solid fa-chevron-up"></i>
                    </button>
                    <button type="button" tabIndex={-1} onClick={() => handlePosY(Math.max(0, centerY - 1))}>
                      <i className="fa-solid fa-chevron-down"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Crop templates */}
            <div className="crp-right__section">
              <label className="crp-right__label">Crop Template</label>
              <div className="crp-templates">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    className={`crp-template crp-template--${t.key} ${template === t.key ? 'crp-template--active' : ''}`}
                    onClick={() => handleTemplateChange(t.key)}
                  >
                    <div className="crp-template__icon">
                      {t.display && <span>{t.display}</span>}
                    </div>
                    <span className="crp-template__label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add More Images */}
            <button className="crp-right__add" onClick={() => addFileInputRef.current?.click()}>
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
              <div className="crp-right__dl-mode">
                <label>Download as:</label>
                <div className="crp-dl-toggle">
                  <button
                    className={`crp-dl-toggle__btn ${downloadMode === 'zip' ? 'active' : ''}`}
                    onClick={() => setDownloadMode('zip')}
                  >
                    <i className="fa-solid fa-file-zipper"></i> ZIP
                  </button>
                  <button
                    className={`crp-dl-toggle__btn ${downloadMode === 'separate' ? 'active' : ''}`}
                    onClick={() => setDownloadMode('separate')}
                  >
                    <i className="fa-regular fa-copy"></i> Separate
                  </button>
                </div>
              </div>
            )}

            {/* Start Over */}
            <button className="crp-right__reset" onClick={handleStartOver}>
              <i className="fa-solid fa-arrow-rotate-left"></i> Start Over
            </button>

            {/* Sticky download */}
            <div className="crp-right__actions">
              <button
                className="crp-right__download"
                onClick={cropAndDownloadAll}
                disabled={cropping}
              >
                {cropping ? (
                  <>
                    <span className="crp-download-spinner"></span>
                    Cropping…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-crop-simple"></i> Crop & Download{images.length > 1 ? ' All' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Not-all-cropped info modal */}
      {notAllCroppedMsg && (
        <div className="crp-modal-overlay" onClick={() => setNotAllCroppedMsg(null)}>
          <div className="crp-modal" onClick={(e) => e.stopPropagation()}>
            <p className="crp-modal__text">
              You have cropped {notAllCroppedMsg.cropped} out of {notAllCroppedMsg.total} images.
            </p>
            <div className="crp-modal__actions">
              <button className="crp-modal__download" onClick={downloadCroppedOnly}>
                Download {notAllCroppedMsg.cropped}
              </button>
              <button className="crp-modal__cancel" onClick={() => setNotAllCroppedMsg(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CropImage;