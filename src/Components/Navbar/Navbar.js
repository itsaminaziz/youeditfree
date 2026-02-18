import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <i className="fa-solid fa-image navbar__logo-icon"></i>
          <span className="navbar__logo-text">fav<strong>IMG</strong></span>
        </Link>

        {/* Hamburger */}
        <button
          className={`navbar__hamburger ${mobileOpen ? 'active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Links */}
        <ul className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <i className="fa-solid fa-house"></i> Home
            </Link>
          </li>
          <li>
            <Link to="/image-converter" className={location.pathname === '/image-converter' ? 'active' : ''}>
              <i className="fa-solid fa-right-left"></i> Image Converter
            </Link>
          </li>
          <li>
            <Link to="/image-compressor" className={location.pathname === '/image-compressor' ? 'active' : ''}>
              <i className="fa-solid fa-compress"></i> Image Compressor
            </Link>
          </li>
          <li className="navbar__dropdown" ref={dropdownRef}>
            <button
              className={`navbar__dropdown-toggle ${dropdownOpen ? 'open' : ''}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <i className="fa-solid fa-ellipsis"></i> Other Tools
              <i className={`fa-solid fa-chevron-down navbar__chevron ${dropdownOpen ? 'rotate' : ''}`}></i>
            </button>
            <ul className={`navbar__dropdown-menu ${dropdownOpen ? 'navbar__dropdown-menu--open' : ''}`}>
              <li>
                <Link to="/resize-image">
                  <i className="fa-solid fa-up-right-and-down-left-from-center"></i> Resize Image
                </Link>
              </li>
              <li>
                <Link to="/crop-image">
                  <i className="fa-solid fa-crop-simple"></i> Crop Image
                </Link>
              </li>
              <li>
                <Link to="/photo-editor">
                  <i className="fa-solid fa-pen-to-square"></i> Photo Editor
                </Link>
              </li>
              <li>
                <Link to="/remove-background">
                  <i className="fa-solid fa-eraser"></i> Remove Background
                </Link>
              </li>
              <li>
                <Link to="/watermark-image">
                  <i className="fa-solid fa-stamp"></i> Watermark Image
                </Link>
              </li>
              <li>
                <Link to="/meme-generator">
                  <i className="fa-solid fa-face-laugh-squint"></i> Meme Generator
                </Link>
              </li>
              <li>
                <Link to="/upscale-image">
                  <i className="fa-solid fa-magnifying-glass-plus"></i> Upscale Image
                </Link>
              </li>
              <li>
                <Link to="/qr-code-generator">
                  <i className="fa-solid fa-qrcode"></i> QR Code Generator
                </Link>
              </li>
              <li>
                <Link to="/qr-code-scanner">
                  <i className="fa-solid fa-expand"></i> QR Code Scanner
                </Link>
              </li>
              <li>
                <Link to="/about">
                  <i className="fa-solid fa-circle-info"></i> About Us
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
