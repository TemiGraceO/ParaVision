import React, { useEffect, useState } from 'react';
import './image-gallery.css';

const ImageGalleryModal = ({ onClose }) => {
  const [images, setImages] = useState([]);
  const [activeTab, setActiveTab] = useState('Blood');

  // Fetch initial images & subscribe to live updates
  useEffect(() => {
    const fetchImages = async () => {
      const imgs = await window.electronAPI.getImages();
      setImages(imgs);
    };

    fetchImages();

    // Live update when a new image is saved
    window.electronAPI.onImageSaved((newImage) => {
      setImages(prev => [...prev, newImage]);
    });
  }, []);

  // Filter images by active tab
  const filteredImages = images.filter(img => img.type === activeTab);

  return (
    <div className="gallery-overlay">
      <div className="gallery-container">

        <header className="gallery-header">
          <h3>Captured Images</h3>
          <button onClick={onClose}>×</button>
        </header>

        <div className="gallery-tabs">
          <button
            className={activeTab === 'Blood' ? 'active' : ''}
            onClick={() => setActiveTab('Blood')}
          >
            Blood
          </button>
          <button
            className={activeTab === 'Stool' ? 'active' : ''}
            onClick={() => setActiveTab('Stool')}
          >
            Stool
          </button>
        </div>

        <div className="image-grid">
          {filteredImages.length === 0 && <p className="empty">No images found</p>}

          {filteredImages.map((img, i) => (
            <img
              key={i}
              src={`file://${img.path}`}
              alt="Captured"
              className="gallery-image"
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default ImageGalleryModal;
