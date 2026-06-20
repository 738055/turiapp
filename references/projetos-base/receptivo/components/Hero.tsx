import React from 'react';
import Button from './Button';
import Link from 'next/link';

interface HeroProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  videoUrl?: string;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, imageUrl, videoUrl }) => {
  return (
    <div className="relative h-[80vh] w-full flex items-center justify-center text-white text-center overflow-hidden">
      <div className="absolute inset-0 bg-black/50 z-10"></div>
      {videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Hero background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
      <div className="relative z-20 p-4 animate-fade-in-up max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 drop-shadow-lg">{title}</h1>
        <p className="text-lg md:text-xl mx-auto drop-shadow-md">{subtitle}</p>
        <div className="mt-8">
          <Link href="/experiencias">
            <Button size="lg" variant="secondary">Ver Experiências</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;