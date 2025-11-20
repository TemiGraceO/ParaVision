import React, { useEffect } from 'react';

const ParticlesBackground = () => {
  useEffect(() => {
    window.particlesJS.load('particles-js', '/particles.js-master/particles.json', function() {
      console.log('particles.js loaded');
    });
  }, []);

  return (
    <div
      id="particles-js"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: -1,
      }}
    />
  );
};

export default ParticlesBackground;
