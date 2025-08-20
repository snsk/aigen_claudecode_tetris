import React from 'react';
import './Background.css';

export const Background: React.FC = () => {
  return (
    <div className="background">
      {/* Sky gradient */}
      <div className="sky"></div>
      
      {/* Animated clouds */}
      <div className="clouds">
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="cloud cloud-3"></div>
        <div className="cloud cloud-4"></div>
      </div>
      
      {/* Mountains */}
      <div className="mountains">
        <div className="mountain mountain-1"></div>
        <div className="mountain mountain-2"></div>
        <div className="mountain mountain-3"></div>
      </div>
      
      {/* Trees */}
      <div className="forest">
        <div className="tree tree-1"></div>
        <div className="tree tree-2"></div>
        <div className="tree tree-3"></div>
        <div className="tree tree-4"></div>
        <div className="tree tree-5"></div>
      </div>
      
      {/* River */}
      <div className="river">
        <div className="water"></div>
        <div className="ripple ripple-1"></div>
        <div className="ripple ripple-2"></div>
        <div className="ripple ripple-3"></div>
      </div>
      
      {/* Floating particles for ambience */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
    </div>
  );
};