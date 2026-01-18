import { useState } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

type ImageSliderProps = {
  images: string[];
  heightClass?: string; // e.g., 'h-48' for card, 'h-40' for list
};

export default function ImageSlider({ images, heightClass = 'h-48' }: ImageSliderProps) {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % images.length);
  const prev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);

  if (images.length === 0) return (
    <div className={`bg-gray-200 ${heightClass} w-full flex items-center justify-center`}>
      <span className="text-gray-500">No Image</span>
    </div>
  );

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden`}>
      <img
        src={images[current]}
        alt={`Property image ${current + 1}`}
        className={`w-full h-full object-cover rounded-t-lg transition duration-500`}
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation(); {/*onClick={(e) => e.stopPropagation()} prevents the navigation of parent*/}
              prev();
            }}
            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 rounded-full hover:bg-opacity-70"
          >
            <MdChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 rounded-full hover:bg-opacity-70"
          >
            <MdChevronRight size={24} />
          </button>
        </>
      )}
    </div>
  );
}
