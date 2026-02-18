import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../SEO/SEO';
import './QRCodeScanner.css';

/* ================================================================
   HELPERS
   ================================================================ */

/** Load jsQR from CDN once */
const loadJsQR = (() => {
  let promise = null;
  return () => {
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      if (window.jsQR) { resolve(window.jsQR); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      s.onload = () => resolve(window.jsQR);
      s.onerror = () => reject(new Error('Failed to load QR scanner library'));
      document.head.appendChild(s);
    });
    return promise;
  };
})();

/** Detect if value looks like a URL */
const isURL = (str) => {
  try {
    const u = new URL(str.startsWith('http') ? str : `https://${str}`);
    return u.hostname.includes('.');
  } catch { return false; }
};

/** Detect content type for display */
const detectType = (data) => {
  if (!data) return { type: 'text', label: 'Text' };
  const lower = data.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) return { type: 'url', label: 'URL' };
  if (lower.startsWith('wifi:')) return { type: 'wifi', label: 'WiFi Network' };
  if (lower.startsWith('begin:vcard')) return { type: 'vcard', label: 'Contact Card' };
  if (lower.startsWith('mailto:')) return { type: 'email', label: 'Email' };
  if (lower.startsWith('tel:')) return { type: 'phone', label: 'Phone Number' };
  if (lower.startsWith('sms:')) return { type: 'sms', label: 'SMS' };
  if (lower.startsWith('geo:')) return { type: 'geo', label: 'Location' };
  if (isURL(data)) return { type: 'url', label: 'URL' };
  return { type: 'text', label: 'Text' };
};

/** Parse WiFi string: WIFI:T:WPA;S:MySSID;P:MyPass;; */
const parseWifi = (data) => {
  const get = (key) => { const m = data.match(new RegExp(`${key}:([^;]*)`)); return m ? m[1] : ''; };
  return { ssid: get('S'), password: get('P'), encryption: get('T'), hidden: get('H') === 'true' };
};

/* ================================================================
   QR CODE SCANNER PAGE
   ================================================================ */
const QRCodeScanner = () => {
  /* ---------- state ---------- */
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [jsQRLoaded, setJsQRLoaded] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ---------- load jsQR on mount ---------- */
  useEffect(() => {
    loadJsQR().then(() => setJsQRLoaded(true)).catch(() => {});
  }, []);

  /* ---------- lock body scroll when camera popup is open ---------- */
  useEffect(() => {
    if (showCamera) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showCamera]);

  /* ---------- stop camera ---------- */
  const stopCamera = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
    setShowCamera(false);
  }, []);

  /* cleanup on unmount */
  useEffect(() => () => stopCamera(), [stopCamera]);

  /* ---------- handle found QR ---------- */
  const handleResult = useCallback((data) => {
    stopCamera();
    const info = detectType(data);
    setResult({ data, ...info });
    setShowPopup(true);
  }, [stopCamera]);

  /* ---------- scan frame from video ---------- */
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !window.jsQR) return;
    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    if (code && code.data) {
      handleResult(code.data);
      return;
    }
    animRef.current = requestAnimationFrame(scanFrame);
  }, [handleResult]);

  /* ---------- attach stream to video element ---------- */
  const attachStream = useCallback(async (stream) => {
    /* Wait a tick for React to mount the video element */
    await new Promise((r) => setTimeout(r, 50));
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    try {
      await video.play();
      setScanning(true);
      animRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setCameraError('Could not start video playback.');
    }
  }, [scanFrame]);

  /* ---------- start camera ---------- */
  const startCamera = useCallback(async () => {
    setCameraError('');
    setShowCamera(true);
    try {
      await loadJsQR();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      await attachStream(stream);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera permission and try again.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not access camera. Please try again.');
      }
    }
  }, [facingMode, attachStream]);

  /* ---------- switch camera ---------- */
  const switchCamera = useCallback(async () => {
    /* Stop current stream */
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      await attachStream(stream);
    } catch {
      setCameraError('Could not switch camera.');
    }
  }, [facingMode, attachStream]);

  /* ---------- scan image file ---------- */
  const scanImage = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const jsQR = await loadJsQR();
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
        URL.revokeObjectURL(url);
        if (code && code.data) {
          handleResult(code.data);
        } else {
          setResult({ data: null, type: 'error', label: 'No QR Code Found' });
          setShowPopup(true);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setResult({ data: null, type: 'error', label: 'Could not read image' });
        setShowPopup(true);
      };
      img.src = url;
    } catch {
      setResult({ data: null, type: 'error', label: 'Scanner failed to load' });
      setShowPopup(true);
    }
  }, [handleResult]);

  /* ---------- file input / drop ---------- */
  const handleFiles = useCallback((files) => {
    const file = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (file) { stopCamera(); scanImage(file); }
  }, [stopCamera, scanImage]);

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };

  /* ---------- copy to clipboard ---------- */
  const copyToClipboard = async () => {
    if (!result?.data) return;
    try {
      await navigator.clipboard.writeText(result.data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  /* ---------- share ---------- */
  const shareResult = async () => {
    if (!result?.data) return;
    if (navigator.share) {
      try { await navigator.share({ text: result.data }); } catch { /* user cancelled */ }
    } else {
      copyToClipboard();
    }
  };

  /* ---------- open URL ---------- */
  const openURL = () => {
    if (!result?.data) return;
    const url = result.data.startsWith('http') ? result.data : `https://${result.data}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /* ---------- close popup & reset ---------- */
  const closePopup = () => {
    setShowPopup(false);
    setResult(null);
    setCopied(false);
  };

  /* ---------- scan again ---------- */
  const scanAgain = () => {
    closePopup();
  };

  /* ---------- render WiFi details ---------- */
  const renderWifiDetails = (data) => {
    const wifi = parseWifi(data);
    return (
      <div className="qrscan-wifi-details">
        <div className="qrscan-wifi-row">
          <span className="qrscan-wifi-label"><i className="fa-solid fa-wifi"></i> Network</span>
          <span className="qrscan-wifi-value">{wifi.ssid || 'Unknown'}</span>
        </div>
        {wifi.password && (
          <div className="qrscan-wifi-row">
            <span className="qrscan-wifi-label"><i className="fa-solid fa-key"></i> Password</span>
            <span className="qrscan-wifi-value">{wifi.password}</span>
          </div>
        )}
        <div className="qrscan-wifi-row">
          <span className="qrscan-wifi-label"><i className="fa-solid fa-shield-halved"></i> Security</span>
          <span className="qrscan-wifi-value">{wifi.encryption || 'None'}</span>
        </div>
      </div>
    );
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <>
      <SEO
        title="QR Code Scanner — Scan QR Codes from Camera or Image | favIMG"
        description="Scan QR codes instantly using your camera or by uploading an image. Detect URLs, text, WiFi, contacts and more. Free, fast, private."
        keywords="qr code scanner, scan qr code, qr reader, qr code reader online, scan qr from image, camera qr scanner"
      />

      <section className="qrscan-page">
        <div className="qrscan-inner">
          {/* Header */}
          <div className="qrscan-header">
            <h1 className="qrscan-title">QR Code Scanner</h1>
            <p className="qrscan-desc">
              Scan QR codes instantly using your camera or upload an image. Fast, private &amp; secure — everything runs in your browser.
            </p>
            <div className="qrscan-nav-pills">
              <Link to="/qr-code-generator" className="qrscan-pill">
                <i className="fa-solid fa-qrcode"></i> Generate QR Code
              </Link>
              <span className="qrscan-pill qrscan-pill--active">
                <i className="fa-solid fa-expand"></i> Scan
              </span>
            </div>
          </div>

          {/* Scanner Boxes */}
          <div className="qrscan-boxes">
            {/* Camera Box */}
            <div className="qrscan-box qrscan-box--camera">
              <div className="qrscan-box__header">
                <i className="fa-solid fa-video"></i>
                <span>Camera Scanner</span>
              </div>

              <div className="qrscan-camera-area">
                <div className="qrscan-camera-placeholder">
                  <div className="qrscan-camera-icon">
                    <i className="fa-solid fa-camera"></i>
                  </div>
                  <p>Point your camera at a QR code</p>
                  <button className="qrscan-start-btn" onClick={startCamera} disabled={!jsQRLoaded}>
                    <i className="fa-solid fa-play"></i>
                    {jsQRLoaded ? 'Start Camera' : 'Loading…'}
                  </button>
                </div>
              </div>
              <canvas ref={canvasRef} hidden />
            </div>

            {/* Upload Box */}
            <div
              className={`qrscan-box qrscan-box--upload ${dragOver ? 'qrscan-box--drag' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="qrscan-box__header">
                <i className="fa-solid fa-image"></i>
                <span>Upload Image</span>
              </div>

              <div className="qrscan-upload-area" onClick={() => fileInputRef.current?.click()}>
                <div className="qrscan-upload-icon">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <h3>Drop QR code image here</h3>
                <p>or <span className="qrscan-browse">browse files</span> to scan</p>
                <p className="qrscan-upload-hint">Supports JPG, PNG, GIF, WEBP</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
              />
            </div>
          </div>

          {/* Features */}
          <div className="qrscan-features">
            <div className="qrscan-feature">
              <div className="qrscan-feature__icon"><i className="fa-solid fa-bolt"></i></div>
              <h4>Instant Scanning</h4>
              <p>Real-time QR code detection from camera or uploaded images</p>
            </div>
            <div className="qrscan-feature">
              <div className="qrscan-feature__icon"><i className="fa-solid fa-shield-halved"></i></div>
              <h4>100% Private</h4>
              <p>All processing happens in your browser. Nothing is uploaded</p>
            </div>
            <div className="qrscan-feature">
              <div className="qrscan-feature__icon"><i className="fa-solid fa-layer-group"></i></div>
              <h4>Multi-Format</h4>
              <p>Detect URLs, text, WiFi, contacts, email, phone &amp; more</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CAMERA POPUP ==================== */}
      {showCamera && (
        <div className="qrscan-cam-overlay">
          <div className="qrscan-cam-popup">
            <div className="qrscan-cam-popup__header">
              <span><i className="fa-solid fa-video"></i> Camera Scanner</span>
              <button className="qrscan-cam-popup__close" onClick={stopCamera}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="qrscan-cam-popup__body">
              {cameraError ? (
                <div className="qrscan-camera-placeholder qrscan-camera-placeholder--error">
                  <div className="qrscan-camera-icon qrscan-camera-icon--error">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <p className="qrscan-error-text">{cameraError}</p>
                  <button className="qrscan-start-btn" onClick={() => { setCameraError(''); startCamera(); }}>
                    <i className="fa-solid fa-rotate-right"></i> Try Again
                  </button>
                </div>
              ) : !scanning ? (
                <div className="qrscan-camera-placeholder">
                  <div className="qrscan-cam-loader"></div>
                  <p>Accessing camera…</p>
                </div>
              ) : null}

              {/* Video always mounted so ref is available */}
              <div className="qrscan-video-wrapper" style={{ display: scanning ? 'flex' : 'none' }}>
                <video ref={videoRef} className="qrscan-video" muted playsInline />
                <div className="qrscan-scan-overlay">
                  <div className="qrscan-scan-frame">
                    <span className="qrscan-corner qrscan-corner--tl"></span>
                    <span className="qrscan-corner qrscan-corner--tr"></span>
                    <span className="qrscan-corner qrscan-corner--bl"></span>
                    <span className="qrscan-corner qrscan-corner--br"></span>
                    <div className="qrscan-scan-line"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls outside body so they never get clipped */}
            {scanning && (
              <div className="qrscan-cam-popup__controls">
                <button className="qrscan-ctrl-btn" onClick={switchCamera} title="Switch Camera">
                  <i className="fa-solid fa-camera-rotate"></i>
                </button>
                <button className="qrscan-ctrl-btn qrscan-ctrl-btn--stop" onClick={stopCamera} title="Stop">
                  <i className="fa-solid fa-stop"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== RESULT POPUP ==================== */}
      {showPopup && (
        <div className="qrscan-popup-overlay" onClick={closePopup}>
          <div className="qrscan-popup" onClick={(e) => e.stopPropagation()}>
            <button className="qrscan-popup__close" onClick={closePopup}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            {result?.type === 'error' ? (
              /* Error state */
              <div className="qrscan-popup__body qrscan-popup__body--error">
                <div className="qrscan-popup__icon qrscan-popup__icon--error">
                  <i className="fa-solid fa-circle-xmark"></i>
                </div>
                <h3>{result.label}</h3>
                <p>No QR code was detected in the image. Please try another image or use the camera scanner.</p>
                <button className="qrscan-popup__action" onClick={scanAgain}>
                  <i className="fa-solid fa-rotate-right"></i> Try Again
                </button>
              </div>
            ) : (
              /* Success state */
              <div className="qrscan-popup__body">
                <div className={`qrscan-popup__icon qrscan-popup__icon--${result?.type}`}>
                  <i className={
                    result?.type === 'url' ? 'fa-solid fa-link' :
                    result?.type === 'wifi' ? 'fa-solid fa-wifi' :
                    result?.type === 'vcard' ? 'fa-solid fa-address-book' :
                    result?.type === 'email' ? 'fa-solid fa-envelope' :
                    result?.type === 'phone' ? 'fa-solid fa-phone' :
                    result?.type === 'sms' ? 'fa-solid fa-comment-sms' :
                    result?.type === 'geo' ? 'fa-solid fa-location-dot' :
                    'fa-solid fa-font'
                  }></i>
                </div>

                <span className="qrscan-popup__badge">{result?.label}</span>
                <h3>QR Code Scanned!</h3>

                {/* Content */}
                {result?.type === 'wifi' ? (
                  renderWifiDetails(result.data)
                ) : (
                  <div className="qrscan-popup__data">
                    <code>{result?.data}</code>
                  </div>
                )}

                {/* Actions */}
                <div className="qrscan-popup__actions">
                  {result?.type === 'url' && (
                    <button className="qrscan-popup__action qrscan-popup__action--primary" onClick={openURL}>
                      <i className="fa-solid fa-arrow-up-right-from-square"></i> Open Link
                    </button>
                  )}
                  <button className={`qrscan-popup__action ${copied ? 'qrscan-popup__action--copied' : ''}`} onClick={copyToClipboard}>
                    <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'}></i>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="qrscan-popup__action" onClick={shareResult}>
                    <i className="fa-solid fa-share-nodes"></i> Share
                  </button>
                  <button className="qrscan-popup__action" onClick={scanAgain}>
                    <i className="fa-solid fa-rotate-right"></i> Scan Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QRCodeScanner;
