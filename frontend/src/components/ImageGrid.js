import React from "react";
import "../App.css";

const ImageGrid = ({ images, selected, toggleSelect }) => {
  return (
    <div className="grid">
      {images.map((img, index) => (
        <div
          key={index}
          className={`card ${selected.includes(img) ? "selected" : ""}`}
          onClick={() => toggleSelect(img)}
        >
          <img src={img} alt="matching photo" className="card-image" />
          <div className="card-content">
            <p className="text-center">Click to select</p>
            {selected.includes(img) && (
              <div className="tick">✓</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;