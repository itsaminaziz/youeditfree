import React from 'react';
import SEO from '../SEO/SEO';
import HeroCards from '../HeroCards/HeroCards';
import WhyChooseUs from '../WhyChooseUs/WhyChooseUs';

const Home = () => {
  return (
    <>
      <SEO
        title="favIMG — Free Online Image Converter, Compressor & Editor"
        description="Convert, compress, resize, crop and edit images online for free. Fast, private and secure — all processing happens in your browser."
        keywords="image converter, image compressor, resize image, crop image, photo editor, online image tools, free image tools"
      />
      <HeroCards />
      <WhyChooseUs />
    </>
  );
};

export default Home;
