import React from 'react';
import SEO from '../SEO/SEO';
import './Pages.css';

const PhotoEditor = () => (
  <>
    <SEO
      title="Photo Editor Online — Edit Images Free with Text, Effects & Frames | favIMG"
      description="Edit photos online for free — add text, effects, frames, stickers and more. Simple yet powerful image editing tools right in your browser."
      keywords="photo editor, online photo editor, edit photo online free, add text to image, image effects, photo frames"
    />
    <section className="page-section">
      <div className="page-container">
        <div className="product-hero">
          <div className="product-hero__icon" style={{ background: '#fdf2f8', color: '#ec4899' }}>
            <i className="fa-solid fa-pen-to-square"></i>
          </div>
          <h1>Photo Editor</h1>
          <p>
            Spice up your pictures with text, effects, frames and stickers. Simple editing tools for all your image needs.
          </p>
        </div>

        <div className="upload-area">
          <div className="upload-area__icon"><i className="fa-solid fa-cloud-arrow-up"></i></div>
          <h3>Drop your images here</h3>
          <p>or <span>browse files</span> to edit</p>
        </div>

        <div className="features-list">
          <div className="feature-item">
            <i className="fa-solid fa-font"></i>
            <h4>Text & Typography</h4>
            <p>Add custom text with various fonts, colors, shadows and positioning options.</p>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <h4>Filters & Effects</h4>
            <p>Apply professional filters, adjust brightness, contrast, saturation and more.</p>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-border-all"></i>
            <h4>Frames & Stickers</h4>
            <p>Choose from beautiful frames and fun stickers to enhance your images.</p>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default PhotoEditor;
