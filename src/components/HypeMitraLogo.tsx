import React from 'react';

interface HypeMitraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const HypeMitraLogo: React.FC<HypeMitraLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const heightClass = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-16' : 'h-10';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* High-res rendered image asset from user logo */}
      <img
        src="/src/assets/images/hypemitra_logo_1792392184449.jpg"
        alt="hypeMitra"
        referrerPolicy="no-referrer"
        className={`${heightClass} w-auto object-contain rounded-md mix-blend-multiply`}
      />

      {showSubtitle && (
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest pl-1 border-l border-neutral-200">
          Work & Profit Portal
        </span>
      )}
    </div>
  );
};

export const HypeMitraIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <img
      src="/src/assets/images/hypemitra_logo_1792392184449.jpg"
      alt="hypeMitra"
      referrerPolicy="no-referrer"
      className={`${className} object-contain rounded-lg shadow-2xs`}
    />
  );
};
