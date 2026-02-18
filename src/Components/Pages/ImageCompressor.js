import React, { useState, useRef, useEffect, useCallback } from 'react';
import SEO from '../SEO/SEO';
import './ImageCompressor.css';

/* ---- helpers ---- */
const fmtSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const compressImage = (file, qualityRatio) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      /* Always export as JPEG for real compression; PNG toBlob ignores quality */
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        },
        'image/jpeg',
        qualityRatio
      );
    };
    img.src = url;
  });

/* ============================================= */
/*            IMAGE COMPRESSOR PAGE              */
/* ============================================= */
const ImageCompressor = () => {
  /*
   * "compression" = how much smaller the file should become.
   *  30 means "reduce by 30%" → canvas quality = 0.70
   */
  const [images, setImages] = useState([]);
  const [globalCompression, setGlobalCompression] = useState(30);
  const [downloadMode, setDownloadMode] = useState('zip');
  const [dragOver, setDragOver] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const fileInputRef = useRef(null);
  const addFileInputRef = useRef(null);

  /* --- warn before reload when images exist --- */
  useEffect(() => {
    const handler = (e) => {
      if (images.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [images.length]);

  /* --- add files --- */
  const addFiles = useCallback(
    (files) => {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (!validFiles.length) return;
      const newImages = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        compression: globalCompression,
        compressedBlob: null,
        compressedSize: null,
      }));
      setImages((prev) => [...prev, ...newImages]);
    },
    [globalCompression]
  );

  /* --- Ctrl+V paste --- */
  useEffect(() => {
    const handler = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          files.push(item.getAsFile());
        }
      }
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [addFiles]);

  /* --- compression engine ---
   * Only processes images where compressedBlob === null.
   * Dependency string only includes unprocessed items so
   * completed compressions don't re-trigger the effect.
   */
  const unprocessedKey = images
    .filter((i) => !i.compressedBlob)
    .map((i) => `${i.id}:${i.compression}`)
    .join(',');

  useEffect(() => {
    const pending = images.filter((img) => img.compressedBlob === null);
    if (!pending.length) return;

    let cancelled = false;

    Promise.all(
      pending.map(async (img) => {
        const qualityRatio = (100 - img.compression) / 100;
        const blob = await compressImage(img.file, qualityRatio);
        return { id: img.id, blob, blobSize: blob.size, origSize: img.file.size, origFile: img.file };
      })
    ).then((results) => {
      if (cancelled) return;
      setImages((prev) =>
        prev.map((img) => {
          const r = results.find((x) => x.id === img.id);
          if (!r) return img;
          /* NEVER allow compressed > original */
          const isBigger = r.blobSize >= r.origSize;
          return {
            ...img,
            compressedBlob: isBigger ? r.origFile.slice(0, r.origFile.size, r.origFile.type) : r.blob,
            compressedSize: isBigger ? r.origSize : r.blobSize,
          };
        })
      );
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unprocessedKey]);

  /* --- global compression change --- */
  const handleGlobalCompression = (val) => {
    const c = Number(val);
    setGlobalCompression(c);
    setImages((prev) =>
      prev.map((img) => ({ ...img, compression: c, compressedBlob: null, compressedSize: null }))
    );
  };

  /* --- individual compression --- */
  const handleCompression = (id, val) => {
    const c = Number(val);
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, compression: c, compressedBlob: null, compressedSize: null } : img
      )
    );
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
    if (!img.compressedBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(img.compressedBlob);
    const ext = img.file.name.replace(/\.[^.]+$/, '');
    a.download = `compressed-${ext}.jpg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* --- download all --- */
  const downloadAll = async () => {
    const ready = images.filter((i) => i.compressedBlob);
    if (!ready.length) return;

    if (downloadMode === 'separate') {
      if (ready.length >= 10) {
        const useZip = window.confirm(
          `Downloading ${ready.length} files separately may be blocked by your browser.\n\nWould you like to download as a single ZIP file instead?`
        );
        if (useZip) {
          await downloadAsZip(ready);
          return;
        }
      }
      /* Sequential downloads with delay to avoid browser blocking */
      for (let i = 0; i < ready.length; i++) {
        downloadSingle(ready[i]);
        if (i < ready.length - 1) await new Promise((r) => setTimeout(r, 400));
      }
      return;
    }

    await downloadAsZip(ready);
  };

  const downloadAsZip = async (ready) => {
    if (!window.JSZip) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      document.head.appendChild(s);
      await new Promise((r) => (s.onload = r));
    }
    const zip = new window.JSZip();
    ready.forEach((img) => {
      const ext = img.file.name.replace(/\.[^.]+$/, '');
      zip.file(`compressed-${ext}.jpg`, img.compressedBlob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'compressed-images.zip';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* --- start over with confirmation --- */
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
  const totalCompressed = images.reduce((s, i) => s + (i.compressedSize ?? i.file.size), 0);
  const allCompressed = images.length > 0 && images.every((i) => i.compressedBlob);
  const savedPercent =
    totalOriginal > 0 ? Math.max(0, Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)) : 0;

  /* =========================== UPLOAD VIEW =========================== */
  if (!images.length) {
    return (
      <>
        <SEO
          title="Image Compressor — Compress JPG, PNG, SVG, GIF Online Free | favIMG"
          description="Compress JPG, PNG, SVG and GIF images online for free. Reduce file size by up to 80% while maintaining visual quality. No signup required."
          keywords="image compressor, compress jpg, compress png, reduce image size, image optimization, compress photos online free"
        />

        <section className="comp-upload">
          <div className="comp-upload__inner">
            <h1 className="comp-upload__title">Image Compressor</h1>
            <p className="comp-upload__desc">
              Compress JPG, PNG &amp; GIF images up to 80% smaller. Fast, private — runs entirely in your browser.
            </p>

            <div
              className={`comp-dropzone ${dragOver ? 'comp-dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="comp-dropzone__cloud">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <h3>Drop your images here</h3>
              <p>or <span className="comp-dropzone__browse" onClick={() => fileInputRef.current?.click()}>browse files</span> to compress</p>
              <p className="comp-dropzone__hint">
                <i className="fa-regular fa-keyboard"></i> You can also paste images with <kbd>Ctrl</kbd> + <kbd>V</kbd>
              </p>
              <button className="comp-dropzone__btn" onClick={() => fileInputRef.current?.click()}>
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
        title="Compressing Images — favIMG Image Compressor"
        description="Adjust compression level and download your optimized images. Real-time preview and size estimation."
        keywords="compress images, image compression slider, bulk compress images, image optimization tool"
      />

      <section className="comp-workspace">
        {/* ---------- MOBILE SETTINGS TOGGLE ---------- */}
        <button
          className="comp-settings-toggle"
          onClick={() => setMobileToolsOpen((prev) => !prev)}
          aria-label="Toggle tools panel"
        >
          <i className={mobileToolsOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-gear'}></i>
        </button>

        {/* Mobile overlay */}
        {mobileToolsOpen && (
          <div className="comp-overlay" onClick={() => setMobileToolsOpen(false)} />
        )}

        {/* ---------- LEFT PANEL ---------- */}
        <div className="comp-left">
          {/* Global slider */}
          <div className="comp-global-bar">
            <div className="comp-global-bar__label">
              <span><i className="fa-solid fa-sliders"></i> Compression for all images</span>
              <strong>{globalCompression}%</strong>
            </div>
            <input
              type="range"
              min="1"
              max="99"
              value={globalCompression}
              onChange={(e) => handleGlobalCompression(e.target.value)}
              className="comp-slider comp-slider--global"
            />
          </div>

          {/* Image cards */}
          <div className="comp-cards">
            {images.map((img) => {
              const actualSaved = img.compressedSize !== null
                ? Math.max(0, Math.round(((img.file.size - img.compressedSize) / img.file.size) * 100))
                : null;

              return (
                <div className="comp-card" key={img.id}>
                  <button className="comp-card__remove" title="Remove" onClick={() => removeImage(img.id)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>

                  <div className="comp-card__preview">
                    <img src={img.preview} alt={img.file.name} />
                  </div>

                  <div className="comp-card__body">
                    <div className="comp-card__info">
                      <span className="comp-card__name" title={img.file.name}>
                        <i className="fa-regular fa-image"></i> {img.file.name}
                      </span>
                      <div className="comp-card__meta">
                        <span><i className="fa-solid fa-file"></i> {img.file.type.split('/')[1].toUpperCase()}</span>
                        <span><i className="fa-solid fa-weight-hanging"></i> {fmtSize(img.file.size)}</span>
                        {img.compressedSize !== null && (
                          <span className="comp-card__meta--result">
                            <i className="fa-solid fa-arrow-right"></i> {fmtSize(img.compressedSize)}
                            <em>(-{actualSaved}%)</em>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="comp-card__slider-row">
                      <label>Compression: <strong>{img.compression}%</strong></label>
                      <input
                        type="range"
                        min="1"
                        max="99"
                        value={img.compression}
                        onChange={(e) => handleCompression(img.id, e.target.value)}
                        className="comp-slider"
                      />
                    </div>

                    <button className="comp-card__dl" onClick={() => downloadSingle(img)} disabled={!img.compressedBlob}>
                      <i className="fa-solid fa-download"></i> Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------- RIGHT PANEL ---------- */}
        <div className={`comp-right ${mobileToolsOpen ? 'comp-right--open' : ''}`}>
          <div className="comp-right__sticky">
            <div className="comp-right__header">
              <h3><i className="fa-solid fa-images"></i> Summary</h3>
            </div>

            <div className="comp-right__stats">
              <div className="comp-stat">
                <span className="comp-stat__label">Images</span>
                <span className="comp-stat__value">{images.length}</span>
              </div>
              <div className="comp-stat">
                <span className="comp-stat__label">Original Size</span>
                <span className="comp-stat__value">{fmtSize(totalOriginal)}</span>
              </div>
              <div className="comp-stat">
                <span className="comp-stat__label">Compressed</span>
                {allCompressed ? (
                  <span className="comp-stat__value comp-stat__value--green">{fmtSize(totalCompressed)}</span>
                ) : (
                  <span className="comp-stat__value"><span className="comp-stat-pulse"></span></span>
                )}
              </div>
              <div className="comp-stat">
                <span className="comp-stat__label">Saved</span>
                {allCompressed ? (
                  <span className="comp-stat__value comp-stat__value--green">{savedPercent}%</span>
                ) : (
                  <span className="comp-stat__value"><span className="comp-stat-pulse"></span></span>
                )}
              </div>
            </div>

            <button className="comp-right__add" onClick={() => addFileInputRef.current?.click()}>
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
            <div className="comp-right__mode">
              <label>Download as:</label>
              <div className="comp-right__mode-btns">
                <button className={downloadMode === 'zip' ? 'active' : ''} onClick={() => setDownloadMode('zip')}>
                  <i className="fa-solid fa-file-zipper"></i> ZIP
                </button>
                <button className={downloadMode === 'separate' ? 'active' : ''} onClick={() => setDownloadMode('separate')}>
                  <i className="fa-regular fa-copy"></i> Separate
                </button>
              </div>
            </div>

            <button className="comp-right__download" onClick={downloadAll} disabled={!allCompressed}>
              {!allCompressed ? (
                <>
                  <span className="comp-download-spinner"></span>
                  Compressing…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-bolt"></i> Compress &amp; Download
                </>
              )}
            </button>

            <button className="comp-right__reset" onClick={handleStartOver}>
              <i className="fa-solid fa-arrow-rotate-left"></i> Start Over
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default ImageCompressor;