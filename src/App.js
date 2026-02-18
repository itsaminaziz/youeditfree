import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import Home from './Components/Pages/Home';
import About from './Components/Pages/About';
import ImageConverter from './Components/Pages/ImageConverter';
import ImageCompressor from './Components/Pages/ImageCompressor';
import ResizeImage from './Components/Pages/ResizeImage';
import CropImage from './Components/Pages/CropImage';
import PhotoEditor from './Components/Pages/PhotoEditor';
import RemoveBackground from './Components/Pages/RemoveBackground';
import WatermarkImage from './Components/Pages/WatermarkImage';
import MemeGenerator from './Components/Pages/MemeGenerator';
import UpscaleImage from './Components/Pages/UpscaleImage';
import QRCodeGenerator from './Components/Pages/QRCodeGenerator';
import QRCodeScanner from './Components/Pages/QRCodeScanner';
import ScrollToTop from './Components/ScrollToTop';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/image-converter" element={<ImageConverter />} />
              <Route path="/convert/:conversionType" element={<ImageConverter />} />
              <Route path="/image-compressor" element={<ImageCompressor />} />
              <Route path="/resize-image" element={<ResizeImage />} />
              <Route path="/crop-image" element={<CropImage />} />
              <Route path="/photo-editor" element={<PhotoEditor />} />
              <Route path="/remove-background" element={<RemoveBackground />} />
              <Route path="/watermark-image" element={<WatermarkImage />} />
              <Route path="/meme-generator" element={<MemeGenerator />} />
              <Route path="/upscale-image" element={<UpscaleImage />} />
              <Route path="/qr-code-generator" element={<QRCodeGenerator />} />
              <Route path="/qr-code-scanner" element={<QRCodeScanner />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;