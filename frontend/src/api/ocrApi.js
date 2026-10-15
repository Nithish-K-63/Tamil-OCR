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
 * Safe fetch with AbortController timeout and automatic fallback between relative proxy and direct backend.
 */
const fetchWithTimeout = async (endpoint, options = {}, timeoutMs = 5000) => {
  const config = getApiConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    "Accept": "application/json",
    ...(options.headers || {})
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

    // Automatic bidirectional fallback: if relative proxy fails, try direct backend; if direct fails, try relative proxy
    if (primaryErr.name !== "AbortError") {
      try {
        const fallbackBase = (!config.baseUrl || config.baseUrl.trim() === "") ? "http://127.0.0.1:8000" : "";
        const fallbackUrl = resolveUrl(endpoint, fallbackBase);
        if (fallbackUrl !== primaryUrl) {
          const fallbackController = new AbortController();
          const fallbackTimer = setTimeout(() => fallbackController.abort(), timeoutMs);
          const fallbackRes = await fetch(fallbackUrl, {
            ...options,
            signal: fallbackController.signal,
            headers
          });
          clearTimeout(fallbackTimer);
          return fallbackRes;
        }
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
  if (metadata.record_id || metadata.recordId) {
    formData.append("record_id", metadata.record_id || metadata.recordId);
  }
  const selectedModel = metadata.model || config.modelName || "tesseract_primary";
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
 * Upload Document Only (Saves image to disk and metadata to MongoDB Atlas with status 'Pending OCR').
 * DOES NOT execute OCR or call Bodhan / Tesseract models during upload.
 */
export const uploadDocumentOnly = async (file, metadata = {}) => {
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
  if (metadata.category) {
    formData.append("category", metadata.category);
  }
  if (metadata.model) {
    formData.append("model", metadata.model);
  }
  formData.append("metadata", JSON.stringify(metadata));

  try {
    const response = await fetchWithTimeout(
      "/api/documents/upload",
      {
        method: "POST",
        body: formData
      },
      15000
    );

    if (response.ok) {
      return await response.json();
    } else {
      const errData = await response.json().catch(() => ({}));
      const detail = errData.detail || errData.message;
      if (response.status === 413) {
        throw new Error("Uploaded image exceeds size limit of 15 MB.");
      }
      if (response.status === 400) {
        throw new Error(detail || "Invalid image file format or metadata.");
      }
      throw new Error(detail || `Upload failed (${response.status})`);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Document upload request timed out.");
    }
    console.error("uploadDocumentOnly failed:", error);
    throw error;
  }
};

/**
 * Trigger OCR on a saved document in 'Pending OCR' status.
 */
export const processSavedDocumentOCR = async (recordId, modelName = "tesseract_primary") => {
  const formData = new FormData();
  formData.append("model", modelName);

  try {
    const res = await fetchWithTimeout(
      `/api/documents/${encodeURIComponent(recordId)}/process-ocr`,
      {
        method: "POST",
        body: formData
      },
      45000
    );

    if (res.ok) {
      return await res.json();
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "OCR processing failed for document.");
    }
  } catch (err) {
    console.error("processSavedDocumentOCR failed:", err);
    throw err;
  }
};

/**
 * Retrieve digitized archive history from backend with optional search and status filtering.
 */
export const fetchHistory = async (limit = 50, offset = 0, search = "", status = "") => {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset)
    });
    if (search) params.set("search", search);
    if (status && status !== "All statuses" && status !== "all") {
      params.set("status", status);
    }

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
 * Retrieve a single digitized archive record by ID.
 */
export const fetchRecordById = async (recordId) => {
  try {
    const res = await fetchWithTimeout(`/api/history/${encodeURIComponent(recordId)}`, { method: "GET" }, 5000);
    if (res.ok) {
      const data = await res.json();
      return data.record || null;
    }
  } catch (err) {
    console.warn("fetchRecordById request issue:", err.message);
  }
  return null;
};

/**
 * Update recognized Tamil text or metadata in database.
 */
export const updateRecord = async (recordId, updates = {}) => {
  try {
    const res = await fetchWithTimeout(
      `/api/history/${encodeURIComponent(recordId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      },
      8000
    );
    if (res.ok) {
      const data = await res.json();
      return data.record || null;
    }
  } catch (err) {
    console.error("updateRecord request failed:", err);
  }
  return null;
};

/**
 * Retrieve persistent processing audit history from backend (Atlas processing_history collection).
 */
export const fetchProcessingHistory = async (limit = 50, offset = 0) => {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset)
    });
    const res = await fetchWithTimeout(`/api/processing-history?${params.toString()}`, { method: "GET" }, 5000);
    if (res.ok) {
      const data = await res.json();
      return data.events || [];
    }
  } catch (err) {
    console.warn("fetchProcessingHistory request issue:", err.message);
  }
  return [];
};

/**
 * Delete a recognized archive record from backend (MongoDB Atlas and storage).
 */
export const deleteHistoryRecord = async (recordId) => {
  try {
    const res = await fetchWithTimeout(`/api/history/${encodeURIComponent(recordId)}`, {
      method: "DELETE"
    }, 8000);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, message: data.message || `Record '${recordId}' deleted successfully.` };
    }
    throw new Error(data.detail || data.message || `Failed to delete record '${recordId}'.`);
  } catch (err) {
    console.error("deleteHistoryRecord failed:", err);
    throw err;
  }
};

/**
 * Delete an audit history entry from MongoDB Atlas processing_history collection.
 */
export const deleteProcessingHistoryItem = async (eventId, deleteDocument = false) => {
  try {
    const url = `/api/processing-history/${encodeURIComponent(eventId)}?delete_document=${deleteDocument}`;
    const res = await fetchWithTimeout(url, { method: "DELETE" }, 8000);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, message: data.message || `History entry deleted successfully.` };
    }
    throw new Error(data.detail || data.message || `Failed to delete history entry.`);
  } catch (err) {
    console.error("deleteProcessingHistoryItem failed:", err);
    throw err;
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

/**
 * Triggers empirical retraining and dynamic testing of T3.7 TamilCNN and Indic-OCR on the dataset.
 */
export const trainAndEvaluateModels = async (trainSamples = 780, testSamples = 312, epochs = 1) => {
  try {
    const res = await fetchWithTimeout(
      "/api/train-and-evaluate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          train_samples: trainSamples,
          test_samples: testSamples,
          epochs: epochs
        })
      },
      300000 // 5 minutes timeout for CPU training
    );
    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Model training and evaluation failed");
    }
  } catch (err) {
    console.error("trainAndEvaluateModels failed:", err);
    throw err;
  }
};

/**
 * Resolves uploaded image storage reference to an accessible URL.
 */
export const resolveImageUrl = (imagePath, fallbackFilename = "") => {
  if (!imagePath && !fallbackFilename) return null;
  const config = getApiConfig();
  const rawPath = imagePath || fallbackFilename;
  if (
    rawPath.startsWith("http://") || 
    rawPath.startsWith("https://") || 
    rawPath.startsWith("blob:") || 
    rawPath.startsWith("data:")
  ) {
    return rawPath;
  }
  const cleanName = rawPath.replace(/^.*[\\\/]/, "");
  const uploadPath = `/api/uploads/${encodeURIComponent(cleanName)}`;
  return resolveUrl(uploadPath, config.baseUrl);
};

/**
 * AI Assistant Chat: send a user prompt and conversation history.
 */
export const sendChatMessage = async (message, history = [], language = "en") => {
  try {
    const res = await fetchWithTimeout(
      "/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history,
          language
        })
      },
      30000 // 30s timeout for live LLMs
    );

    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Assistant error: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("sendChatMessage error:", err);
    throw err;
  }
};

/**
 * AI Assistant Status: fetch active provider, model name, and capabilities.
 */
export const fetchChatStatus = async () => {
  try {
    const res = await fetchWithTimeout("/api/chat/status", { method: "GET" }, 5000);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchChatStatus issue:", err);
  }
  return {
    status: "ready",
    active_provider: "TamilOCR Knowledge Engine",
    active_model: "TamilOCR Knowledge Engine v2.4 (Domain AI)"
  };
};

/**
 * AI Assistant Suggestions: fetch quick prompt chips for current language.
 */
export const fetchChatSuggestions = async (language = "en") => {
  try {
    const res = await fetchWithTimeout(`/api/chat/suggestions?language=${encodeURIComponent(language)}`, { method: "GET" }, 5000);
    if (res.ok) {
      const data = await res.json();
      return data.suggestions || [];
    }
  } catch (err) {
    console.warn("fetchChatSuggestions issue:", err);
  }
  return [];
};

/**
 * Submit a handwritten or scanned Tamil document image directly to the AI Chatbot OCR endpoint.
 * Runs real OCR inference on the backend (Tesseract or TamilCNN) and returns genuine recognized text.
 * Never produces fake OCR results.
 */
export const uploadChatDocumentOCR = async (file, options = {}) => {
  const config = getApiConfig();
  const formData = new FormData();
  formData.append("file", file);

  const selectedModel = options.model || config.modelName || "tesseract_primary";
  formData.append("model", selectedModel);

  if (options.language) {
    formData.append("language", options.language);
  }
  if (options.prompt) {
    formData.append("prompt", options.prompt);
  }

  try {
    const res = await fetchWithTimeout(
      "/api/chat/ocr",
      {
        method: "POST",
        body: formData,
      },
      60000 // 60s timeout for image upload and inference
    );

    if (res.ok) {
      return await res.json();
    } else {
      const errData = await res.json().catch(() => ({}));
      const detail = errData.detail || errData.message;
      if (res.status === 413) {
        throw new Error("Uploaded image exceeds size limit of 15 MB.");
      }
      if (res.status === 400) {
        throw new Error(detail || "Invalid or unreadable image file. Please upload a clear document image.");
      }
      throw new Error(detail || `OCR processing failed (Status: ${res.status})`);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("OCR request timed out. Please try again with a clearer or smaller image.");
    }
    console.error("uploadChatDocumentOCR error:", err);
    throw err;
  }
};
