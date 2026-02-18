import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../SEO/SEO';
import './ImageConverter.css';

/* ---- helpers ---- */
const fmtSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/* All supported output formats */
const OUTPUT_FORMATS = [
  { value: 'image/jpeg', label: 'JPG', ext: '.jpg' },
  { value: 'image/png', label: 'PNG', ext: '.png' },
  { value: 'image/webp', label: 'WEBP', ext: '.webp' },
  { value: 'image/svg+xml', label: 'SVG', ext: '.svg' },
  { value: 'image/gif', label: 'GIF', ext: '.gif' },
  { value: 'image/bmp', label: 'BMP', ext: '.bmp' },
  { value: 'image/x-icon', label: 'ICO', ext: '.ico' },
  { value: 'image/tiff', label: 'TIFF', ext: '.tiff' },
];

/* Map route slugs → {from, to} with SEO metadata */
const CONVERSION_ROUTES = {
  'png-to-jpg':  { from: 'PNG', to: 'image/jpeg',  title: 'PNG to JPG Converter', desc: 'Convert PNG images to JPG format online for free. Reduce file size while maintaining quality.' },
  'jpg-to-png':  { from: 'JPG', to: 'image/png',   title: 'JPG to PNG Converter', desc: 'Convert JPG images to PNG format online. Get transparent backgrounds and lossless quality.' },
  'png-to-webp': { from: 'PNG', to: 'image/webp',  title: 'PNG to WEBP Converter', desc: 'Convert PNG to WEBP for smaller file sizes and faster web loading. Free online converter.' },
  'jpg-to-webp': { from: 'JPG', to: 'image/webp',  title: 'JPG to WEBP Converter', desc: 'Convert JPG images to WEBP format for optimized web performance. Free online tool.' },
  'webp-to-jpg': { from: 'WEBP', to: 'image/jpeg', title: 'WEBP to JPG Converter', desc: 'Convert WEBP images to JPG format for universal compatibility. Free online converter.' },
  'webp-to-png': { from: 'WEBP', to: 'image/png',  title: 'WEBP to PNG Converter', desc: 'Convert WEBP images to PNG format with lossless quality. Free online tool.' },
  'gif-to-jpg':  { from: 'GIF', to: 'image/jpeg',  title: 'GIF to JPG Converter', desc: 'Convert GIF images to JPG format. Extract frames and convert with ease.' },
  'gif-to-png':  { from: 'GIF', to: 'image/png',   title: 'GIF to PNG Converter', desc: 'Convert GIF images to PNG format with transparency support. Free online converter.' },
  'bmp-to-jpg':  { from: 'BMP', to: 'image/jpeg',  title: 'BMP to JPG Converter', desc: 'Convert BMP images to JPG format to reduce file size. Free online converter.' },
  'bmp-to-png':  { from: 'BMP', to: 'image/png',   title: 'BMP to PNG Converter', desc: 'Convert BMP images to PNG format with lossless compression. Free online tool.' },
  'svg-to-png':  { from: 'SVG', to: 'image/png',   title: 'SVG to PNG Converter', desc: 'Convert SVG vector images to PNG raster format. Free online converter.' },
  'svg-to-jpg':  { from: 'SVG', to: 'image/jpeg',  title: 'SVG to JPG Converter', desc: 'Convert SVG vector images to JPG format. Free online converter.' },
  'tiff-to-jpg': { from: 'TIFF', to: 'image/jpeg', title: 'TIFF to JPG Converter', desc: 'Convert TIFF images to JPG format for smaller files. Free online converter.' },
  'tiff-to-png': { from: 'TIFF', to: 'image/png',  title: 'TIFF to PNG Converter', desc: 'Convert TIFF images to PNG format. Free online lossless converter.' },
  'jpg-to-gif':  { from: 'JPG', to: 'image/gif',   title: 'JPG to GIF Converter', desc: 'Convert JPG images to GIF format. Free online image converter.' },
  'png-to-gif':  { from: 'PNG', to: 'image/gif',   title: 'PNG to GIF Converter', desc: 'Convert PNG images to GIF format. Free online image converter.' },
  'jpg-to-bmp':  { from: 'JPG', to: 'image/bmp',   title: 'JPG to BMP Converter', desc: 'Convert JPG images to BMP bitmap format. Free online converter.' },
  'png-to-bmp':  { from: 'PNG', to: 'image/bmp',   title: 'PNG to BMP Converter', desc: 'Convert PNG images to BMP bitmap format. Free online converter.' },
  'webp-to-gif': { from: 'WEBP', to: 'image/gif',  title: 'WEBP to GIF Converter', desc: 'Convert WEBP images to GIF format. Free online image converter.' },
  'jpg-to-ico':  { from: 'JPG', to: 'image/x-icon', title: 'JPG to ICO Converter', desc: 'Convert JPG images to ICO favicon format. Free online converter.' },
  'png-to-ico':  { from: 'PNG', to: 'image/x-icon', title: 'PNG to ICO Converter', desc: 'Convert PNG images to ICO favicon format. Free online converter.' },
  'jpg-to-svg':  { from: 'JPG', to: 'image/svg+xml', title: 'JPG to SVG Converter', desc: 'Convert JPG images to SVG format. Wrap raster images in scalable SVG. Free online converter.' },
  'png-to-svg':  { from: 'PNG', to: 'image/svg+xml', title: 'PNG to SVG Converter', desc: 'Convert PNG images to SVG format. Create scalable vector graphics from PNG files. Free online converter.' },
  'webp-to-svg': { from: 'WEBP', to: 'image/svg+xml', title: 'WEBP to SVG Converter', desc: 'Convert WEBP images to SVG format. Free online image converter.' },
  'gif-to-svg':  { from: 'GIF', to: 'image/svg+xml', title: 'GIF to SVG Converter', desc: 'Convert GIF images to SVG format. Free online image converter.' },
  'bmp-to-svg':  { from: 'BMP', to: 'image/svg+xml', title: 'BMP to SVG Converter', desc: 'Convert BMP images to SVG format. Free online image converter.' },
  'tiff-to-svg': { from: 'TIFF', to: 'image/svg+xml', title: 'TIFF to SVG Converter', desc: 'Convert TIFF images to SVG vector format. Free online converter.' },
};

/* Convert a raster image to SVG by embedding it as base64 inside an <image> element */
const convertToSvg = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      /* Draw to canvas first to get a clean PNG data URI */
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUri = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">\n  <image href="${dataUri}" width="${img.width}" height="${img.height}" />\n</svg>`;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      resolve(blob);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });

/* Convert an image file to a target MIME type using canvas */
const convertImage = (file, targetMime) => {
  /* SVG output needs special handling */
  if (targetMime === 'image/svg+xml') return convertToSvg(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      /* White background for formats without transparency (JPEG, BMP, ICO) */
      if (['image/jpeg', 'image/bmp', 'image/x-icon'].includes(targetMime)) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Conversion failed'));
        },
        targetMime,
        1
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
};

/* Detect source format label from file */
const getSourceFormat = (file) => {
  const type = file.type.toLowerCase();
  if (type.includes('jpeg') || type.includes('jpg')) return 'JPG';
  if (type.includes('png')) return 'PNG';
  if (type.includes('webp')) return 'WEBP';
  if (type.includes('gif')) return 'GIF';
  if (type.includes('bmp')) return 'BMP';
  if (type.includes('svg')) return 'SVG';
  if (type.includes('tiff')) return 'TIFF';
  if (type.includes('ico') || type.includes('icon')) return 'ICO';
  const ext = file.name.split('.').pop().toUpperCase();
  return ext || 'UNKNOWN';
};

/* ============================================= */
/*            IMAGE CONVERTER PAGE               */
/* ============================================= */
const ImageConverter = () => {
  const { conversionType } = useParams();
  const routeInfo = conversionType ? CONVERSION_ROUTES[conversionType] : null;

  const [images, setImages] = useState([]);
  const [outputFormat, setOutputFormat] = useState(routeInfo?.to || 'image/jpeg');
  const [dragOver, setDragOver] = useState(false);
  const [converting, setConverting] = useState(false);
  const [downloadMode, setDownloadMode] = useState('zip');
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const fileInputRef = useRef(null);
  const addFileInputRef = useRef(null);

  /* Update output format when route changes */
  useEffect(() => {
    if (routeInfo?.to) setOutputFormat(routeInfo.to);
  }, [routeInfo?.to]);

  /* --- warn before reload --- */
  useEffect(() => {
    const handler = (e) => {
      if (images.length > 0) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [images.length]);

  /* --- add files --- */
  const addFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!validFiles.length) return;
    const newImages = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      sourceFormat: getSourceFormat(file),
      convertedBlob: null,
      convertedSize: null,
    }));
    setImages((prev) => [...prev, ...newImages]);
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

  /* --- convert all images --- */
  const convertAll = async () => {
    setConverting(true);
    try {
      const results = await Promise.all(
        images.map(async (img) => {
          if (img.convertedBlob) return null;
          const blob = await convertImage(img.file, outputFormat);
          return { id: img.id, blob, size: blob.size };
        })
      );
      setImages((prev) =>
        prev.map((img) => {
          const r = results.find((x) => x && x.id === img.id);
          if (!r) return img;
          return { ...img, convertedBlob: r.blob, convertedSize: r.size };
        })
      );
    } catch (err) {
      console.error('Conversion error:', err);
    }
    setConverting(false);
  };

  /* Reset conversions when format or quality changes */
  const handleFormatChange = (val) => {
    setOutputFormat(val);
    setImages((prev) => prev.map((img) => ({ ...img, convertedBlob: null, convertedSize: null })));
  };

  /* --- remove image --- */
  const removeImage = (id) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  /* --- download single --- */
  const downloadSingle = (img) => {
    if (!img.convertedBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(img.convertedBlob);
    const baseName = img.file.name.replace(/\.[^.]+$/, '');
    const ext = OUTPUT_FORMATS.find((f) => f.value === outputFormat)?.ext || '.jpg';
    a.download = `${baseName}${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* --- download all as separate files --- */
  const downloadSeparate = () => {
    const ready = images.filter((i) => i.convertedBlob);
    if (!ready.length) return;
    const ext = OUTPUT_FORMATS.find((f) => f.value === outputFormat)?.ext || '.jpg';
    ready.forEach((img) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(img.convertedBlob);
      const baseName = img.file.name.replace(/\.[^.]+$/, '');
      a.download = `${baseName}${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };

  /* --- download all as zip --- */
  const downloadZip = async () => {
    const ready = images.filter((i) => i.convertedBlob);
    if (!ready.length) return;

    if (!window.JSZip) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      document.head.appendChild(s);
      await new Promise((r) => (s.onload = r));
    }
    const zip = new window.JSZip();
    const ext = OUTPUT_FORMATS.find((f) => f.value === outputFormat)?.ext || '.jpg';
    ready.forEach((img) => {
      const baseName = img.file.name.replace(/\.[^.]+$/, '');
      zip.file(`${baseName}${ext}`, img.convertedBlob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'converted-images.zip';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* --- download all (respects mode) --- */
  const downloadAll = () => {
    const ready = images.filter((i) => i.convertedBlob);
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
  };

  /* --- drag & drop --- */
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  /* --- computed --- */
  const totalOriginal = images.reduce((s, i) => s + i.file.size, 0);
  const allConverted = images.length > 0 && images.every((i) => i.convertedBlob);
  const currentFormatLabel = OUTPUT_FORMATS.find((f) => f.value === outputFormat)?.label || 'JPG';
  /* Collect unique detected source formats */
  const detectedFormats = [...new Set(images.map((i) => i.sourceFormat))];

  /* --- SEO data --- */
  const seoTitle = routeInfo
    ? `${routeInfo.title} — Free Online | favIMG`
    : 'Image Converter — Convert PNG, JPG, WEBP, GIF, SVG Online Free | favIMG';
  const seoDesc = routeInfo
    ? routeInfo.desc
    : 'Convert images between JPG, PNG, WEBP, GIF, SVG, TIFF, BMP and more. Free online image format converter — fast, private, no signup required.';
  const seoKeywords = routeInfo
    ? `${routeInfo.title.toLowerCase()}, convert ${routeInfo.from.toLowerCase()} to ${currentFormatLabel.toLowerCase()}, free image converter`
    : 'image converter, convert png to jpg, jpg to png, webp converter, image format converter, free image converter online';

  /* =========================== UPLOAD VIEW =========================== */
  if (!images.length) {
    return (
      <>
        <SEO title={seoTitle} description={seoDesc} keywords={seoKeywords} />
        <section className="conv-upload">
          <div className="conv-upload__inner">
            <h1 className="conv-upload__title">
              {routeInfo ? routeInfo.title : 'Image Converter'}
            </h1>
            <p className="conv-upload__desc">
              {routeInfo
                ? routeInfo.desc
                : 'Convert images between JPG, PNG, WEBP, GIF, SVG, TIFF, BMP and more. Batch convert multiple files at once — fast, private, runs entirely in your browser.'}
            </p>

            <div
              className={`conv-dropzone ${dragOver ? 'conv-dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="conv-dropzone__cloud">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <h3>Drop your images here</h3>
              <p>or <span className="conv-dropzone__browse" onClick={() => fileInputRef.current?.click()}>browse files</span> to convert</p>
              <p className="conv-dropzone__hint">
                <i className="fa-regular fa-keyboard"></i> You can also paste images with <kbd>Ctrl</kbd> + <kbd>V</kbd>
              </p>
              <button className="conv-dropzone__btn" onClick={() => fileInputRef.current?.click()}>
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

            {/* Quick conversion links for SEO */}
            <div className="conv-quick-links">
              <h3>Popular Conversions</h3>
              <div className="conv-quick-links__grid">
                {Object.entries(CONVERSION_ROUTES).slice(0, 12).map(([slug, info]) => (
                  <Link key={slug} to={`/convert/${slug}`} className="conv-quick-link">
                    <i className="fa-solid fa-right-left"></i> {info.title.replace(' Converter', '')}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* =========================== WORKSPACE VIEW =========================== */
  return (
    <>
      <SEO title={`Converting to ${currentFormatLabel} — favIMG Image Converter`} description={seoDesc} keywords={seoKeywords} />

      <section className="conv-workspace">
        {/* Mobile settings toggle */}
        <button
          className="conv-settings-toggle"
          onClick={() => setMobileToolsOpen((prev) => !prev)}
          aria-label="Toggle tools panel"
        >
          <i className={mobileToolsOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-gear'}></i>
        </button>

        {mobileToolsOpen && (
          <div className="conv-overlay" onClick={() => setMobileToolsOpen(false)} />
        )}

        {/* ---------- LEFT PANEL (Preview) ---------- */}
        <div className="conv-left">
          <div className="conv-cards">
            {images.map((img) => (
              <div className="conv-card" key={img.id}>
                <button className="conv-card__remove" title="Remove" onClick={() => removeImage(img.id)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="conv-card__preview">
                  <img src={img.preview} alt={img.file.name} />
                </div>

                <div className="conv-card__body">
                  <div className="conv-card__info">
                    <span className="conv-card__name" title={img.file.name}>
                      <i className="fa-regular fa-image"></i> {img.file.name}
                    </span>
                    <div className="conv-card__meta">
                      <span className="conv-card__badge-from">{img.sourceFormat}</span>
                      <i className="fa-solid fa-arrow-right conv-card__arrow"></i>
                      <span className="conv-card__badge-to">{currentFormatLabel}</span>
                      <span className="conv-card__size"><i className="fa-solid fa-weight-hanging"></i> {fmtSize(img.file.size)}</span>
                    </div>
                  </div>

                  {img.convertedBlob && (
                    <button className="conv-card__dl" onClick={() => downloadSingle(img)}>
                      <i className="fa-solid fa-download"></i> Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- RIGHT PANEL (Tools) ---------- */}
        <div
          className={`conv-right ${mobileToolsOpen ? 'conv-right--open' : ''}`}
        >
          <div className="conv-right__sticky">
            <div className="conv-right__header">
              <h3><i className="fa-solid fa-right-left"></i> Convert Settings</h3>
            </div>

            {/* Summary stats */}
            <div className="conv-right__stats">
              <div className="conv-stat">
                <span className="conv-stat__label">Images</span>
                <span className="conv-stat__value">{images.length}</span>
              </div>
              <div className="conv-stat">
                <span className="conv-stat__label">Total Size</span>
                <span className="conv-stat__value">{fmtSize(totalOriginal)}</span>
              </div>
              <div className="conv-stat">
                <span className="conv-stat__label">Detected</span>
                <span className="conv-stat__value">{detectedFormats.join(', ')}</span>
              </div>
            </div>

            {/* Output format selector */}
            <div className="conv-right__format">
              <label>Convert to:</label>
              <div className="conv-format-grid">
                {OUTPUT_FORMATS.map((fmt) => (
                  <button
                    key={fmt.value}
                    className={`conv-format-btn ${outputFormat === fmt.value ? 'active' : ''}`}
                    onClick={() => handleFormatChange(fmt.value)}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add more images */}
            <button className="conv-right__add" onClick={() => addFileInputRef.current?.click()}>
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
              <div className="conv-right__dl-mode">
                <label>Download as:</label>
                <div className="conv-dl-toggle">
                  <button
                    className={`conv-dl-toggle__btn ${downloadMode === 'zip' ? 'active' : ''}`}
                    onClick={() => setDownloadMode('zip')}
                  >
                    <i className="fa-solid fa-file-zipper"></i> ZIP
                  </button>
                  <button
                    className={`conv-dl-toggle__btn ${downloadMode === 'separate' ? 'active' : ''}`}
                    onClick={() => setDownloadMode('separate')}
                  >
                    <i className="fa-regular fa-copy"></i> Separate
                  </button>
                </div>
              </div>
            )}

            {/* Convert & Download button */}
            <button
              className="conv-right__download"
              onClick={allConverted ? downloadAll : convertAll}
              disabled={converting}
            >
              {converting ? (
                <>
                  <span className="conv-download-spinner"></span>
                  Converting…
                </>
              ) : allConverted ? (
                <>
                  <i className="fa-solid fa-download"></i> Download {images.length > 1 ? 'All' : ''}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-bolt"></i> Convert to {currentFormatLabel}
                </>
              )}
            </button>

            <button className="conv-right__reset" onClick={handleStartOver}>
              <i className="fa-solid fa-arrow-rotate-left"></i> Start Over
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default ImageConverter;
