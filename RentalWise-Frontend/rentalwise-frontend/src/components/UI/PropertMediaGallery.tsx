import { useState } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

interface PropertyMedia {
  mediaType: 'image' | 'video';
  url: string;
}

export default function PropertyMediaGallery({ media }: { media: PropertyMedia[] }) {
  const images = media.filter((m) => m.mediaType === 'image');
  const videos = media.filter((m) => m.mediaType === 'video');
  const [activeIndex, setActiveIndex] = useState(0);
  

  const next = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative w-full rounded overflow-hidden shadow">
        <img
          src={images[activeIndex]?.url}
          alt={`media-${activeIndex}`}
          className="w-full h-[500px] object-cover rounded"
        />
        {/* Left Arrow */}
        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
          >
            <MdChevronLeft className="text-2xl" />
          </button>
        )}

        {/* Right Arrow */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
          >
            <MdChevronRight className="text-2xl" />
          </button>
        )}
      </div>

      {/* Thumbnail Image Selector */}
      <div className="flex gap-2 overflow-x-auto">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img.url}
            onClick={() => setActiveIndex(idx)}
            alt={`thumb-${idx}`}
            className={`h-20 w-24 object-cover cursor-pointer rounded border-2 ${
              idx === activeIndex ? 'border-blue-500' : 'border-transparent'
            }`}
          />
        ))}
      </div>

      {/* Optional: Show Videos Below */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {videos.map((video, i) => (
            <video key={i} controls className="w-full h-auto rounded shadow-sm">
              <source src={video.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ))}
        </div>
      )}
    </div>
  );
}
