import React from 'react';
import SEO from '../SEO/SEO';
import './Pages.css';

const About = () => {
  return (
    <>
      <SEO
        title="About favIMG — Our Mission & Story"
        description="Learn about favIMG, the free online image toolkit trusted by millions. Our mission is to make professional image editing accessible to everyone."
        keywords="about favimg, image tools company, free image editor, about us"
      />

      <section className="page-section">
        <div className="page-container">
          <div className="page-header">
            <span className="page-label">
              <i className="fa-solid fa-circle-info"></i> About ttUs
            </span>
            <h1>Built for Creators, by Creators</h1>
            <p>We believe powerful image tools should be free, fast, and accessible to everyone.</p>
          </div>

          <div className="about-grid">
            <div className="about-card about-card--full">
              <div className="about-card__icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                <i className="fa-solid fa-rocket"></i>
              </div>
              <h2>Our Mission</h2>
              <p>
                favIMG was created with a simple goal: to provide the most intuitive, fastest, and most
                private image editing experience on the web. We process everything directly in your
                browser — your files never leave your device. No accounts, no limits, no compromises.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card__icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h3>Privacy First</h3>
              <p>
                We never upload, store, or process your images on remote servers. Everything stays on your device.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card__icon" style={{ background: '#fff7ed', color: '#f59e0b' }}>
                <i className="fa-solid fa-code"></i>
              </div>
              <h3>Modern Technology</h3>
              <p>
                Built with cutting-edge web technologies including WebAssembly, Canvas API, and modern React for peak performance.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card__icon" style={{ background: '#fdf2f8', color: '#ec4899' }}>
                <i className="fa-solid fa-heart"></i>
              </div>
              <h3>Community Driven</h3>
              <p>
                Every feature we build is inspired by real user feedback. Your suggestions shape our roadmap.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card__icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                <i className="fa-solid fa-globe"></i>
              </div>
              <h3>Global Reach</h3>
              <p>
                Used by creators in over 120 countries. Available in multiple languages with lightning-fast CDN delivery.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
