import React from 'react';
import SEO from '../SEO/SEO';
import './Pages.css';

const WatermarkImage = () => (
  <>
    <SEO
      title="Watermark Image Online — Add Text & Logo Watermarks Free | favIMG"
      description="Stamp an image or text over your images in seconds. Choose typography, transparency and position. Free online watermark tool."
      keywords="watermark image, add watermark, image watermark tool, text watermark, logo watermark, watermark photos free"
    />
    <section className="page-section">
      <div className="page-container">
        <div className="product-hero">
          <div className="product-hero__icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
            <i className="fa-solid fa-stamp"></i>
          </div>
          <h1>Watermark Image</h1>
          <p>
            Stamp an image or text over your photos in seconds. Customize typography, transparency and position.
          </p>
        </div>

        <div className="upload-area">
          <div className="upload-area__icon"><i className="fa-solid fa-cloud-arrow-up"></i></div>
          <h3>Drop your images here</h3>
          <p>or <span>browse files</span> to watermark</p>
        </div>

        <div className="features-list">
          <div className="feature-item">
            <i className="fa-solid fa-font"></i>
            <h4>Text Watermarks</h4>
            <p>Add custom text watermarks with full control over font, size, color and opacity.</p>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-image"></i>
            <h4>Logo Watermarks</h4>
            <p>Upload your logo and position it anywhere on your images with adjustable transparency.</p>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-layer-group"></i>
            <h4>Batch Watermark</h4>
            <p>Apply the same watermark to hundreds of images at once to protect your work.</p>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default WatermarkImage;
