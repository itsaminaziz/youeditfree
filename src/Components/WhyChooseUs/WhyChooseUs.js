import React from 'react';
import './WhyChooseUs.css';

const reasons = [
  {
    icon: 'fa-solid fa-bolt',
    title: 'Lightning Fast',
    desc: 'All processing happens directly in your browser. No file uploads to external servers — results appear in milliseconds.',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    icon: 'fa-solid fa-lock',
    title: '100% Private & Secure',
    desc: 'Your files never leave your device. We don\'t store, share, or access your images. Complete privacy guaranteed.',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    icon: 'fa-solid fa-infinity',
    title: 'No Limits, No Signup',
    desc: 'Use every tool as many times as you want — completely free. No account required, no watermarks, no hidden fees.',
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    icon: 'fa-solid fa-paintbrush',
    title: 'Professional Quality',
    desc: 'Our algorithms deliver studio-grade results. Compress without visible quality loss, convert with perfect fidelity.',
    color: '#ec4899',
    bg: '#fdf2f8',
  },
  {
    icon: 'fa-solid fa-layer-group',
    title: 'Batch Processing',
    desc: 'Handle multiple files at once. Convert, compress, or resize entire folders of images in a single operation.',
    color: '#0ea5e9',
    bg: '#e0f2fe',
  },
  {
    icon: 'fa-solid fa-mobile-screen-button',
    title: 'Works Everywhere',
    desc: 'Fully responsive design works on desktop, tablet, and mobile. No downloads or installations needed.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
];

const WhyChooseUs = () => {
  return (
    <section className="why-choose">
      <div className="why-choose__container">
        <div className="why-choose__header">
          <span className="why-choose__label">
            <i className="fa-solid fa-star"></i> Why Choose Us
          </span>
          <h2>The Smarter Way to Edit Images</h2>
          <p>
            Trusted by thousands of creators, designers, and developers worldwide.
            Here's why favIMG is the go-to destination for image editing.
          </p>
        </div>

        <div className="why-choose__grid">
          {reasons.map((r, i) => (
            <div className="why-choose__card" key={i}>
              <div className="why-choose__icon" style={{ background: r.bg, color: r.color }}>
                <i className={r.icon}></i>
              </div>
              <h3>{r.title}</h3>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="why-choose__stats">
          <div className="why-choose__stat">
            <strong>5M+</strong>
            <span>Images Processed</span>
          </div>
          <div className="why-choose__stat">
            <strong>120+</strong>
            <span>Countries Served</span>
          </div>
          <div className="why-choose__stat">
            <strong>99.9%</strong>
            <span>Uptime</span>
          </div>
          <div className="why-choose__stat">
            <strong>10+</strong>
            <span>Free Tools</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
