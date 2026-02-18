import React from 'react';
import SEO from '../SEO/SEO';
import './Pages.css';

const MemeGenerator = () => (
  <>
    <SEO
      title="Meme Generator — Create Custom Memes Online Free | favIMG"
      description="Create memes online with ease. Caption popular meme templates or upload your own pictures to make custom memes. Free meme maker, no signup."
      keywords="meme generator, meme maker, create meme online, custom memes, meme creator, make memes free"
    />
    <section className="page-section">
      <div className="page-container">
        <div className="product-hero">
          <div className="product-hero__icon" style={{ background: '#fdf4ff', color: '#d946ef' }}>
            <i className="fa-solid fa-face-laugh-squint"></i>
          </div>
          <h1>Meme Generator</h1>
          <p>
            Create your memes online with ease. Caption popular templates or upload your pictures to make custom memes.
          </p>
        </div>

        <div className="upload-area">
          <div className="upload-area__icon"><i className="fa-solid fa-cloud-arrow-up"></i></div>
          <h3>Drop your images here</h3>
          <p>or <span>browse files</span> to create a meme</p>
        </div>

        <div className="features-list">
          <div className="feature-item">
            <i className="fa-solid fa-image"></i>
            <h4>Popular Templates</h4>
            <p>Choose from hundreds of popular meme templates to get started in seconds.</p>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-font"></i>
            <h4>Custom Captions</h4>
            <p>Add top and bottom text with classic meme fonts or customize with your own style.</p>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-share-nodes"></i>
            <h4>Easy Sharing</h4>
            <p>Download your memes or share directly to social media with one click.</p>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default MemeGenerator;
