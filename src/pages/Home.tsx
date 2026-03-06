import React from 'react';
import '../styles/landing.css';
import Header from '../components/landing/Header';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import AboutSection from '../components/landing/AboutSection';
import PricingSection from '../components/landing/PricingSection';
import CtaSection from '../components/landing/CtaSection';
import ContactSection from '../components/landing/ContactSection';
import Footer from '../components/landing/Footer';

const Home: React.FC = () => {
  return (
    <div className="landing-page-root noise-bg">
      <Header />
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <PricingSection />
      <CtaSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Home;
