import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__wave">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,40 C360,100 1080,0 1440,60 L1440,100 L0,100 Z" fill="#1e1b4b" />
        </svg>
      </div>

      <div className="footer__body">
        <div className="footer__container">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <i className="fa-solid fa-image"></i>
              <span>fav<strong>IMG</strong></span>
            </Link>
            <p className="footer__tagline">
              Free online image tools — convert, compress, resize, crop &amp; edit your images in seconds. No signup required.
            </p>
            <div className="footer__socials">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="fa-brands fa-x-twitter"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <i className="fa-brands fa-github"></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <i className="fa-brands fa-youtube"></i>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="footer__col">
            <h4>Image Tools</h4>
            <ul>
              <li><Link to="/image-converter"><i className="fa-solid fa-right-left"></i> Image Converter</Link></li>
              <li><Link to="/image-compressor"><i className="fa-solid fa-compress"></i> Image Compressor</Link></li>
              <li><Link to="/resize-image"><i className="fa-solid fa-up-right-and-down-left-from-center"></i> Resize Image</Link></li>
              <li><Link to="/crop-image"><i className="fa-solid fa-crop-simple"></i> Crop Image</Link></li>
            </ul>
          </div>

          <div className="footer__col">
            <h4>More Tools</h4>
            <ul>
              <li><Link to="/photo-editor"><i className="fa-solid fa-pen-to-square"></i> Photo Editor</Link></li>
              <li><Link to="/remove-background"><i className="fa-solid fa-eraser"></i> Remove Background</Link></li>
              <li><Link to="/watermark-image"><i className="fa-solid fa-stamp"></i> Watermark Image</Link></li>
              <li><Link to="/meme-generator"><i className="fa-solid fa-face-laugh-squint"></i> Meme Generator</Link></li>
              <li><Link to="/upscale-image"><i className="fa-solid fa-magnifying-glass-plus"></i> Upscale Image</Link></li>
            </ul>
          </div>

          <div className="footer__col">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about"><i className="fa-solid fa-circle-info"></i> About Us</Link></li>
              <li><Link to="/"><i className="fa-solid fa-house"></i> Home</Link></li>
            </ul>

            <h4 style={{ marginTop: 24 }}>Contact</h4>
            <ul>
              <li>
                <a href="mailto:hello@favimg.com"><i className="fa-solid fa-envelope"></i> hello@favimg.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} favIMG. All rights reserved.</p>
          <div className="footer__bottom-links">
            <Link to="/">Privacy Policy</Link>
            <Link to="/">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
