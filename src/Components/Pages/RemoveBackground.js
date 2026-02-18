import React from 'react';
import SEO from '../SEO/SEO';
import './Pages.css';

const RemoveBackground = () => (
  <>
    <SEO
      title="Remove Background from Image Online Free | favIMG"
      description="Quickly remove image backgrounds with high accuracy. Instantly detect objects and cut out backgrounds with ease. Free online background remover."
      keywords="remove background, background remover, remove bg, cut out background, transparent background, remove image background free"
    />
    <section className="page-section">
      <div className="page-container">
        <div className="product-hero">
          <div className="product-hero__icon" style={{ background: '#f0fdfa', color: '#14b8a6' }}>
            <i className="fa-solid fa-eraser"></i>
          </div>
          <h1>Remove Background</h1>
          <p>
            Quickly remove image backgrounds with high accuracy. Instantly detect objects and cut out backgrounds with ease.
          </p>
        </div>

        <div className="upload-area">
          <div className="upload-area__icon"><i className="fa-solid fa-cloud-arrow-up"></i></div>
          <h3>Drop your images here</h3>
          <p>or <span>browse files</span> to remove background</p>
        </div>

        <div className="features-list">
          <div className="feature-item">
            <i className="fa-solid fa-brain"></i>
            <h4>AI-Powered</h4>
            <p>Smart algorithms detect subjects automatically for clean, precise background removal.</p>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-eye"></i>
            <h4>High Accuracy</h4>
            <p>Handles complex edges like hair, fur, and transparency with professional-grade results.</p>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-download"></i>
            <h4>PNG Export</h4>
            <p>Download your cutout as a transparent PNG ready for use in any design project.</p>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default RemoveBackground;
