const BASE_URL = process.env.REACT_APP_API_URL || "https://face-detector-5.onrender.com";

// ===== ERROR HANDLER =====
const handleError = (response) => {
  if (!response.ok) {
    throw new Error(response.data?.error || `HTTP Error: ${response.status}`);
  }
  return response;
};

// ===== FIND MATCHES API =====
// Send selfie image and get matching photos
export const findMatches = async (input) => {
  try {
    const formData = new FormData();

    // Handle different input types
    if (input instanceof FormData) {
      return sendRequest(input);
    }

    // File or Blob
    if (input instanceof File || input instanceof Blob) {
      formData.append("selfie", input);
      return sendRequest(formData);
    }

    throw new Error("Invalid input: File or Blob required");
  } catch (err) {
    console.error("Error in findMatches:", err.message);
    throw err;
  }
};

// ===== SEND EMAIL API =====
// Send selected photos to email
export const sendEmail = async (email, images) => {
  try {
    if (!email || !images || images.length === 0) {
      throw new Error("Email and images are required");
    }

    const response = await fetch(`${BASE_URL}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, images }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send email");
    }

    return data;
  } catch (err) {
    console.error("Error in sendEmail:", err.message);
    throw err;
  }
};

// ===== HEALTH CHECK API =====
// Check if API is available
export const checkHealth = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    return data.status === "success";
  } catch (err) {
    console.error("API health check failed:", err.message);
    return false;
  }
};

// ===== INTERNAL HELPERS =====
const sendRequest = async (formData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/find-matches`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to find matches");
    }

    return data;
  } catch (err) {
    console.error("Error in sendRequest:", err.message);
    throw err;
  }
};