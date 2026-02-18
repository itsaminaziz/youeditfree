import React from 'react';
import SEO from '../SEO/SEO';
import './Pages.css';

const UpscaleImage = () => (
  <>
    <SEO
      title="Upscale Image — Enlarge Images with AI Enhancement Free | favIMG"
      description="Enlarge your images with high resolution using AI. Easily increase the size of JPG and PNG images while maintaining visual quality. Free online upscaler."
      keywords="upscale image, image upscaler, enlarge image, increase image resolution, AI image enhancer, upscale photo free"
    />
    <section className="page-section">
      <div className="page-container">
        <div className="product-hero">
          <div className="product-hero__icon" style={{ background: '#f0fdf4', color: '#22c55e' }}>
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </div>
          <h1>Upscale Image</h1>
          <p>
            Enlarge your images with high resolution. Easily increase the size of your images while maintaining visual quality.
          </p>
        </div>

        <div className="upload-area">
          <div className="upload-area__icon"><i className="fa-solid fa-cloud-arrow-up"></i></div>
          <h3>Drop your images here</h3>
          <p>or <span>browse files</span> to upscale</p>
        </div>

        <div className="features-list">
          <div className="feature-item">
            <i className="fa-solid fa-brain"></i>
            <h4>AI Enhancement</h4>
            <p>Smart AI algorithms enhance details and textures as your image is enlarged.</p>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-expand"></i>
            <h4>Up to 4x Upscale</h4>
            <p>Increase image resolution by 2x, 3x or 4x while preserving sharpness and clarity.</p>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-image"></i>
            <h4>Multiple Formats</h4>
            <p>Works with JPG, PNG and WEBP images. Export in your preferred format.</p>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default UpscaleImage;
