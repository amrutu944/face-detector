import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { sendEmail } from "../services/api";
import "../App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        console.log("🤖 Loading face detection models from:", MODEL_URL);
        
        console.log("⏳ Loading tinyFaceDetector...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log("✅ tinyFaceDetector loaded");
        
        console.log("⏳ Loading faceLandmark68Net...");
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log("✅ faceLandmark68Net loaded");
        
        console.log("⏳ Loading faceRecognitionNet...");
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("✅ faceRecognitionNet loaded");
        
        console.log("🎉 All models loaded successfully!");
        setModelsLoaded(true);
      } catch (err) {
        console.error("❌ Model loading error:", err);
        alert(`Error loading models: ${err.message}\n\nMake sure the model files are in public/models/`);
      }
    };
    loadModels();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      console.log("📹 Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("✅ Camera started successfully");
      }
    } catch (err) {
      console.error("❌ Camera error:", err);
      alert(`Camera error: ${err.message}\n\nPlease check:\n• Camera permissions\n• Your browser supports getUserMedia\n• Another app isn't using the camera`);
    }
  };

  // Get face descriptor
  const getDescriptor = async (input) => {
    try {
      const detection = await faceapi
        .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detection) {
        console.warn("⚠️ Face detection returned null");
        return null;
      }

      console.log("✅ Face detected with descriptor");
      return detection.descriptor;
    } catch (err) {
      console.error("❌ Detection error:", err);
      return null;
    }
  };

  // Match faces with uploaded photos
  const matchFaces = async (selfieDescriptor) => {
  if (!selfieDescriptor) {
    console.error("❌ No descriptor provided");
    return [];
  }

  const files = ["image1.jpg", "image2.jpg", "image3.jpg"];
  const results = [];

  console.log("🔍 Matching faces against", files.length, "images");

  for (let file of files) {
    try {
      const imageUrl = `${API_URL}/uploads/${file}`;
      const img = await faceapi.fetchImage(imageUrl);
      const descriptor = await getDescriptor(img);

      if (!descriptor) {
        console.warn(`⚠️ No face in ${file}`);
        continue;
      }

      const distance = faceapi.euclideanDistance(
        selfieDescriptor,
        descriptor
      );

      const similarity = (1 - distance) * 100;

      console.log(`${file} → ${similarity.toFixed(1)}%`);

      // ✅ PUSH EVERYTHING (NO FILTER)
      results.push({
        url: imageUrl,
        distance,
        similarity,
      });

    } catch (err) {
      console.error(`❌ Error processing ${file}`);
    }
  }

  // 🔥 SORT BEST FIRST
  results.sort((a, b) => a.distance - b.distance);

  console.log("✨ Returning", results.length, "images");

  // 🔥 RETURN TOP 3 ALWAYS
  return results.slice(0, 3);
};
  // Capture photo and match
  const capturePhoto = async () => {
    if (!modelsLoaded) {
      alert("⏳ Models are still loading. Please wait a moment...");
      return;
    }

    const video = videoRef.current;
    if (!video || video.readyState !== 4) {
      alert("📹 Camera is not ready. Please wait and try again.");
      return;
    }

    setLoading(true);

    try {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      ctx.drawImage(video, 0, 0);
      console.log("📸 Canvas captured:", canvas.width, "x", canvas.height);

      const descriptor = await getDescriptor(canvas);
      if (!descriptor) {
        alert("❌ No face detected. Please ensure your face is clearly visible in the camera and try again.");
        setLoading(false);
        return;
      }

      console.log("✅ Face detected! Starting face matching...");
      const matches = await matchFaces(descriptor);

      if (matches.length === 0) {
        alert("⚠️ No matching photos found.\n\nMake sure these files exist in backend/uploads/:\n• image1.jpg\n• image2.jpg\n• image3.jpg\n\nThey must contain visible faces similar to your selfie.");
      } else {
        alert(`✅ Found ${matches.length} matching photo(s)!`);
      }

      setImages(matches);
      setSelected([]);
    } catch (err) {
      console.error("❌ Error during capture:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Select images for email
  const toggleSelect = (url) => {
    setSelected((prev) =>
      prev.includes(url) ? prev.filter((i) => i !== url) : [...prev, url]
    );
  };

  // Send email with selected photos
  const handleSendEmail = async () => {
    if (!email || selected.length === 0) {
      alert("Enter email and select images");
      return;
    }

    try {
      const res = await sendEmail(email, selected);
      alert(res.message || "Email sent successfully!");
      setEmail("");
      setSelected([]);
    } catch {
      alert("Email failed to send");
    }
  };

  return (
    <div className="container">
      <h2 className="title">✨ Face Recognition Photo Finder</h2>

      <div className="glass upload-box">
        <button onClick={startCamera} className="btn-primary">
          🎥 Start Camera
        </button>

        <div className="video-container">
          <video ref={videoRef} autoPlay playsInline width="320" height="240" />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        <button onClick={capturePhoto} className="btn-primary">
          📸 Capture & Match
        </button>

        {loading && (
          <div className="loading-state">
            <div className="loader"></div>
            <p>🔍 Matching faces...</p>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="results-section">
          <h3 className="section-title">Matching Photos</h3>
          <div className="grid">
            {images.map((item, i) => (
              <div
                key={i}
                className={`card ${
                  selected.includes(item.url) ? "selected" : ""
                }`}
                onClick={() => toggleSelect(item.url)}
              >
                <img src={item.url} alt="match" className="card-image" />
                <div className="card-content">
                  <p className="similarity-score">
                    Match: {((1 - item.distance) * 100).toFixed(1)}%
                  </p>
                  {selected.includes(item.url) && (
                    <div className="tick">✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Email Section */}
          <div className="email-box glass">
            <h3 className="section-title">Send Photos to Email</h3>
            <div className="email-input-group">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
              />
              <button onClick={handleSendEmail} className="btn-primary">
                📧 Send Selected
              </button>
            </div>
            <p className="email-info">
              {selected.length} photo(s) selected
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
