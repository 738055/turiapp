import React from 'react';
import Button from './Button';
import Link from 'next/link';

interface ContentBlockProps {
  title: string;
  description: string;
  imageSrc: string;
  reversed?: boolean;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ title, description, imageSrc, reversed = false }) => {
  const flexDirection = reversed ? 'lg:flex-row-reverse' : 'lg:flex-row';

  return (
    <section className="py-16 bg-white">
      <div className={`container mx-auto px-4 flex flex-col ${flexDirection} items-center gap-12`}>
        <div className="lg:w-1/2">
          <img src={imageSrc} alt={title} className="rounded-2xl shadow-xl w-full h-auto object-cover" />
        </div>
        <div className="lg:w-1/2 text-center lg:text-left">
          <h2 className="text-4xl font-serif font-bold text-primary mb-4">{title}</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">{description}</p>
          <Link href="/sobre"><Button>Saiba Mais</Button></Link>
        </div>
      </div>
    </section>
  );
};

export default ContentBlock;