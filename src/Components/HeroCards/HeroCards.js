import React from 'react';
import { Link } from 'react-router-dom';
import './HeroCards.css';

const tools = [
  {
    title: 'Compress IMAGE',
    desc: 'Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality.',
    image: `${process.env.PUBLIC_URL}/Images/image-compressor.webp`,
    link: '/image-compressor',
  },
  {
    title: 'Resize IMAGE',
    desc: 'Define your dimensions, by percent or pixel, and resize your JPG, PNG, SVG and GIF images.',
    image: `${process.env.PUBLIC_URL}/Images/image-resizer.webp`,
    link: '/resize-image',
  },
  {
    title: 'Crop IMAGE',
    desc: 'Crop JPG, PNG, or GIFs with ease; choose pixels to define your rectangle or use our visual editor.',
    image: `${process.env.PUBLIC_URL}/Images/image-croper.webp`,
    link: '/crop-image',
  },
  {
    title: 'Convert to JPG',
    desc: 'Turn PNG, GIF, TIF, PSD, SVG, WEBP, HEIC, or RAW format images to JPG in bulk with ease.',
    image: `${process.env.PUBLIC_URL}/Images/convert-to-jpg.webp`,
    link: '/image-converter',
  },
  {
    title: 'Convert from JPG',
    desc: 'Turn JPG images to PNG and GIF. Choose several JPGs to create an animated GIF in seconds!',
    image: `${process.env.PUBLIC_URL}/Images/convert-from-jpg.webp`,
    link: '/image-converter',
  },
  {
    title: 'QR Code Generator',
    desc: 'Generate custom QR codes for URLs, text, WiFi, contacts, email & maps. Customize styles, colors, and logos.',
    image: `${process.env.PUBLIC_URL}/Images/qr-code-generator.webp`,
    link: '/qr-code-generator',
  },
  {
    title: 'QR Code Scanner',
    desc: 'Scan QR codes instantly using your camera or by uploading an image. Detect URLs, text, WiFi, contacts & more.',
    image: `${process.env.PUBLIC_URL}/Images/qr-code-scanner.webp`,
    link: '/qr-code-scanner',
    badge: 'New!',
  },
  {
    title: 'Blur Face',
    desc: 'Automatically detect and blur faces in your images for privacy. Adjust blur intensity, shape, or add emoji overlays.',
    image: `${process.env.PUBLIC_URL}/Images/blur-face.webp`,
    link: '/face-blur',
    badge: 'New!',
  },
  {
    title: 'Remove Background',
    desc: 'Quickly remove image backgrounds with high accuracy. Instantly detect objects and cut out backgrounds.',
    image: `${process.env.PUBLIC_URL}/Images/background-remover.webp`,
    link: '/remove-background',
    badge: 'New!',
  },
  {
    title: 'Watermark IMAGE',
    desc: 'Stamp an image or text over your images in seconds. Choose the typography, transparency and position.',
    image: `${process.env.PUBLIC_URL}/Images/watermark-image.webp`,
    link: '/watermark-image',
  },
];

const HeroCards = () => {
  return (
    <section className="hero-bg" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/Images/hero.webp)` }}>
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
            <div className="hero-card__icon">
              <img src={tool.image} alt={tool.title} className="hero-card__img" />
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
