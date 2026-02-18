import React from 'react';
import { Link } from 'react-router-dom';
import './HeroCards.css';

const tools = [
  {
    title: 'Compress IMAGE',
    desc: 'Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality.',
    icon: 'fa-solid fa-compress',
    color: '#10b981',
    bg: '#ecfdf5',
    link: '/image-compressor',
  },
  {
    title: 'Resize IMAGE',
    desc: 'Define your dimensions, by percent or pixel, and resize your JPG, PNG, SVG and GIF images.',
    icon: 'fa-solid fa-up-right-and-down-left-from-center',
    color: '#6366f1',
    bg: '#eef2ff',
    link: '/resize-image',
  },
  {
    title: 'Crop IMAGE',
    desc: 'Crop JPG, PNG, or GIFs with ease; choose pixels to define your rectangle or use our visual editor.',
    icon: 'fa-solid fa-crop-simple',
    color: '#0ea5e9',
    bg: '#e0f2fe',
    link: '/crop-image',
  },
  {
    title: 'Convert to JPG',
    desc: 'Turn PNG, GIF, TIF, PSD, SVG, WEBP, HEIC, or RAW format images to JPG in bulk with ease.',
    icon: 'fa-solid fa-right-left',
    color: '#f59e0b',
    bg: '#fffbeb',
    link: '/image-converter',
  },
  {
    title: 'Convert from JPG',
    desc: 'Turn JPG images to PNG and GIF. Choose several JPGs to create an animated GIF in seconds!',
    icon: 'fa-solid fa-file-export',
    color: '#eab308',
    bg: '#fefce8',
    link: '/image-converter',
  },
  {
    title: 'QR Code Generator',
    desc: 'Generate custom QR codes for URLs, text, WiFi, contacts, email & maps. Customize styles, colors, and logos.',
    icon: 'fa-solid fa-qrcode',
    color: '#ec4899',
    bg: '#fdf2f8',
    link: '/qr-code-generator',
  },
  {
    title: 'QR Code Scanner',
    desc: 'Scan QR codes instantly using your camera or by uploading an image. Detect URLs, text, WiFi, contacts & more.',
    icon: 'fa-solid fa-expand',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    link: '/qr-code-scanner',
    badge: 'New!',
  },
  {
    title: 'Upscale Image',
    desc: 'Enlarge your images with high resolution. Easily increase the size of your images while maintaining visual quality.',
    icon: 'fa-solid fa-magnifying-glass-plus',
    color: '#22c55e',
    bg: '#f0fdf4',
    link: '/upscale-image',
    badge: 'New!',
  },
  {
    title: 'Remove Background',
    desc: 'Quickly remove image backgrounds with high accuracy. Instantly detect objects and cut out backgrounds.',
    icon: 'fa-solid fa-eraser',
    color: '#14b8a6',
    bg: '#f0fdfa',
    link: '/remove-background',
    badge: 'New!',
  },
  {
    title: 'Watermark IMAGE',
    desc: 'Stamp an image or text over your images in seconds. Choose the typography, transparency and position.',
    icon: 'fa-solid fa-stamp',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    link: '/watermark-image',
  },
  {
    title: 'Meme Generator',
    desc: 'Create your memes online with ease. Caption meme images or upload your pictures to create custom memes.',
    icon: 'fa-solid fa-face-laugh-squint',
    color: '#d946ef',
    bg: '#fdf4ff',
    link: '/meme-generator',
  },
];

const HeroCards = () => {
  return (
    <section className="hero-bg">
      <div className="hero-cards">
      <div className="hero-cards__header">
        <h1>Every Image Tool You Need</h1>
        <p>
          Free online tools to convert, compress, resize, crop, edit and transform your images.
          All processing happens in your browser — fast, private &amp; secure.
        </p>
      </div>

      <div className="hero-cards__grid">
        {tools.map((tool, i) => (
          <Link to={tool.link} key={i} className="hero-card">
            {tool.badge && <span className="hero-card__badge">{tool.badge}</span>}
            <div className="hero-card__icon" style={{ background: tool.bg, color: tool.color }}>
              <i className={tool.icon}></i>
            </div>
            <h3 className="hero-card__title">{tool.title}</h3>
            <p className="hero-card__desc">{tool.desc}</p>
          </Link>
        ))}
      </div>
      </div>
    </section>
  );
};

export default HeroCards;
