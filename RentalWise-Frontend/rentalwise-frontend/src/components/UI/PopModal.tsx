import { useEffect, useState } from 'react';

type PopModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
};

export default function PopModal({ isOpen, onClose, children, title, className }: PopModalProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
      const timeout = setTimeout(() => setShouldRender(false), 300); // Match the transition duration
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center transition-opacity duration-300 ${
        animateIn ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {animateIn && (
        <div
          className={`bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto p-6 relative transform transition-transform duration-300 ${
            animateIn ? 'scale-100' : 'scale-95'
          } ${className}`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-red-600 text-2xl font-bold focus:outline-none"
            aria-label="Close"
          >
            &times;
          </button>

          {title && (
            <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
              {title}
            </h1>
          )}

          {children}
        </div>
      )}
    </div>
  );
}
