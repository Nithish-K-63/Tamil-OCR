// Configuration & Environment-driven API Endpoint
const getStoredConfig = (key, fallback = "") => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

export const getApiConfig = () => {
  return {
    // Default to relative URL "" so requests go to "/api/..." through Vite dev proxy
    // If VITE_API_URL or localStorage explicitly provides a URL, use it
    baseUrl: import.meta.env.VITE_API_URL || getStoredConfig("tamilocr_api_url", ""),
    apiKey: getStoredConfig("tamilocr_api_key", ""),
    demoMode: getStoredConfig("tamilocr_demo_mode", "false") === "true",
    modelName: getStoredConfig("tamilocr_model", "tesseract_primary"),
    confidenceThreshold: parseFloat(getStoredConfig("tamilocr_confidence", "80")) || 80
  };
};

export const saveApiConfig = (config) => {
  try {
    if (config.baseUrl !== undefined) localStorage.setItem("tamilocr_api_url", config.baseUrl);
    if (config.apiKey !== undefined) localStorage.setItem("tamilocr_api_key", config.apiKey);
    if (config.demoMode !== undefined) localStorage.setItem("tamilocr_demo_mode", config.demoMode ? "true" : "false");
    if (config.modelName) localStorage.setItem("tamilocr_model", config.modelName);
    if (config.confidenceThreshold) localStorage.setItem("tamilocr_confidence", config.confidenceThreshold.toString());
  } catch (e) {
    console.warn("Could not save API config to localStorage:", e);
  }
};

/**
 * Builds safe URL for an API endpoint path.
 * Supports both relative paths ("/api/...") and absolute baseURLs ("http://localhost:8000/api/...").
 */
const resolveUrl = (endpoint, baseUrl) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (!baseUrl || baseUrl.trim() === "") {
    return cleanEndpoint;
  }
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return `${cleanBase}${cleanEndpoint}`;
};

/**
 * Safe fetch with AbortController timeout and fallback to relative proxy path.
 */
const fetchWithTimeout = async (endpoint, options = {}, timeoutMs = 5000) => {
  const config = getApiConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    "Accept": "application/json",
    ...(options.headers || {}),
    ...(config.apiKey ? { "X-API-Key": config.apiKey } : {})
  };

  const primaryUrl = resolveUrl(endpoint, config.baseUrl);

  try {
    const res = await fetch(primaryUrl, {
      ...options,
      signal: controller.signal,
      headers
    });
    clearTimeout(timeoutId);
    return res;
  } catch (primaryErr) {
    clearTimeout(timeoutId);

    // If a custom baseUrl was used and failed with a network error, try relative proxy as fallback
    if (config.baseUrl && config.baseUrl !== "" && primaryErr.name !== "AbortError") {
      try {
        const fallbackController = new AbortController();
        const fallbackTimer = setTimeout(() => fallbackController.abort(), Math.min(timeoutMs, 4000));
        const fallbackUrl = resolveUrl(endpoint, "");
        const fallbackRes = await fetch(fallbackUrl, {
          ...options,
          signal: fallbackController.signal,
          headers
        });
        clearTimeout(fallbackTimer);
        return fallbackRes;
      } catch {
        // Fall through to throw primary error
      }
    }
    throw primaryErr;
  }
};

/**
 * Health check: verify backend status & loaded model availability.
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetchWithTimeout("/api/health", { method: "GET" }, 3500);

    if (response.ok) {
      const data = await response.json();
      return { 
        status: "online", 
        message: data.service || "Connected to Python OCR Backend (TamilCNN)", 
        details: data 
      };
    } else {
      return { 
        status: "error", 
        message: `Backend error: ${response.status} ${response.statusText}` 
      };
    }
  } catch (err) {
    const isTimeout = err.name === "AbortError";
    return { 
      status: "offline", 
      message: isTimeout 
        ? "Backend health check timed out. Verify FastAPI server on port 8000."
        : "Backend unreachable. Verify server is running on port 8000."
    };
  }
};

/**
 * Get active model architecture & validation metrics.
 */
export const fetchModelInfo = async () => {
  try {
    const res = await fetchWithTimeout("/api/model-info", { method: "GET" }, 4000);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("fetchModelInfo request issue:", e.message);
  }
  return null;
};

/**
 * Get comparative benchmarks between T3.7 TamilCNN and Bodhan Indic-OCR.
 */
export const fetchModelComparison = async () => {
  try {
    const res = await fetchWithTimeout("/api/model-comparison", { method: "GET" }, 4000);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("fetchModelComparison request issue:", e.message);
  }
  return null;
};

/**
 * Main OCR Recognition Endpoint.
 * Submits genuine manuscript image to Python backend for inference.
 */
export const processDocumentOCR = async (file, metadata = {}) => {
  const config = getApiConfig();

  const formData = new FormData();
  formData.append("file", file);
  if (metadata.title || metadata.tamilTitle) {
    formData.append("title", metadata.title || metadata.tamilTitle);
  }
  if (metadata.department) {
    formData.append("department", metadata.department);
  }
  if (metadata.year || metadata.docYear) {
    formData.append("year", metadata.year || metadata.docYear);
  }
  if (metadata.district) {
    formData.append("district", metadata.district);
  }
  const selectedModel = metadata.model || config.modelName || "TamilCNN-T3.7-Indic";
  formData.append("model", selectedModel);
  formData.append("metadata", JSON.stringify({ ...metadata, model: selectedModel }));

  try {
    // Neural model inference timeout: 45 seconds
    const response = await fetchWithTimeout(
      "/api/ocr", 
      {
        method: "POST",
        body: formData
      },
      45000
    );

    if (response.ok) {
      return await response.json();
    } else {
      const errData = await response.json().catch(() => ({}));
      const detail = errData.detail || errData.message;
      if (response.status === 401) {
        throw new Error(detail || "Authentication required to access OCR service.");
      }
      if (response.status === 413) {
        throw new Error("Uploaded image exceeds size limit of 15 MB.");
      }
      if (response.status === 400) {
        throw new Error(detail || "Invalid image file format or metadata.");
      }
      throw new Error(detail || `Server returned error (${response.status})`);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("OCR inference request timed out. The model took too long to respond.");
    }
    console.error("OCR Request failed:", error);
    throw error;
  }
};

/**
 * Retrieve digitized archive history from backend.
 */
export const fetchHistory = async (limit = 50, offset = 0, search = "") => {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset)
    });
    if (search) params.set("search", search);

    const res = await fetchWithTimeout(`/api/history?${params.toString()}`, { method: "GET" }, 5000);
    if (res.ok) {
      const data = await res.json();
      return data.records || [];
    }
  } catch (err) {
    console.warn("fetchHistory request issue:", err.message);
  }
  return [];
};

/**
 * Delete a recognized archive record from backend.
 */
export const deleteHistoryRecord = async (recordId) => {
  try {
    const res = await fetchWithTimeout(`/api/history/${encodeURIComponent(recordId)}`, {
      method: "DELETE"
    }, 5000);
    return res.ok;
  } catch (err) {
    console.error("deleteHistoryRecord failed:", err);
    return false;
  }
};

/**
 * Fetch live dashboard statistics from backend with optional timeline range.
 */
export const fetchDashboardStats = async (range = "6 months") => {
  try {
    const cleanRange = range.replace(" ", "_");
    const res = await fetchWithTimeout(`/api/dashboard/stats?range=${encodeURIComponent(cleanRange)}`, { method: "GET" }, 5000);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchDashboardStats request issue:", err.message);
  }
  return null;
};
