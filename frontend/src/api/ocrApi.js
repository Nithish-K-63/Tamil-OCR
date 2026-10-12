// Configuration & Environment-driven API Endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || localStorage.getItem("tamilocr_api_url") || "http://localhost:8000";

export const getApiConfig = () => {
  return {
    baseUrl: import.meta.env.VITE_API_URL || localStorage.getItem("tamilocr_api_url") || "http://localhost:8000",
    apiKey: localStorage.getItem("tamilocr_api_key") || "",
    demoMode: localStorage.getItem("tamilocr_demo_mode") === "true", // Default to false (Real Backend Mode)
    modelName: localStorage.getItem("tamilocr_model") || "TamilCNN-T3.7-Indic",
    confidenceThreshold: parseFloat(localStorage.getItem("tamilocr_confidence") || "80")
  };
};

export const saveApiConfig = (config) => {
  if (config.baseUrl) localStorage.setItem("tamilocr_api_url", config.baseUrl);
  if (config.apiKey !== undefined) localStorage.setItem("tamilocr_api_key", config.apiKey);
  if (config.demoMode !== undefined) localStorage.setItem("tamilocr_demo_mode", config.demoMode ? "true" : "false");
  if (config.modelName) localStorage.setItem("tamilocr_model", config.modelName);
  if (config.confidenceThreshold) localStorage.setItem("tamilocr_confidence", config.confidenceThreshold.toString());
};

/**
 * Health check: verify backend status & loaded model availability.
 */
export const checkBackendHealth = async () => {
  const config = getApiConfig();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const headers = {
      "Accept": "application/json",
      ...(config.apiKey ? { "X-API-Key": config.apiKey } : {})
    };

    let response;
    try {
      response = await fetch(`${config.baseUrl}/api/health`, {
        method: "GET",
        signal: controller.signal,
        headers
      });
    } catch (fetchErr) {
      if (config.baseUrl && config.baseUrl !== "") {
        response = await fetch("/api/health", {
          method: "GET",
          signal: controller.signal,
          headers
        });
      } else {
        throw fetchErr;
      }
    }
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { 
        status: "online", 
        message: "Connected to Python OCR Backend (TamilCNN)", 
        details: data 
      };
    } else {
      return { 
        status: "error", 
        message: `Backend error: ${response.status} ${response.statusText}` 
      };
    }
  } catch (err) {
    return { 
      status: "offline", 
      message: `Backend unreachable at ${config.baseUrl}. Check server status.` 
    };
  }
};

/**
 * Get active model architecture & validation metrics.
 */
export const fetchModelInfo = async () => {
  const config = getApiConfig();
  try {
    let res;
    try {
      res = await fetch(`${config.baseUrl}/api/model-info`);
    } catch (e) {
      if (config.baseUrl && config.baseUrl !== "") {
        res = await fetch("/api/model-info");
      } else {
        throw e;
      }
    }
    if (res && res.ok) return await res.json();
  } catch (e) {
    console.warn("fetchModelInfo error:", e);
  }
  return null;
};

/**
 * Main OCR Recognition Endpoint.
 * Submits genuine manuscript image to Python backend for inference.
 */
export const processDocumentOCR = async (file, metadata = {}) => {
  const config = getApiConfig();

  // If connected to live backend
  try {
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
    formData.append("metadata", JSON.stringify(metadata));

    const requestHeaders = {
      ...(config.apiKey ? { "X-API-Key": config.apiKey } : {})
    };

    let response;
    try {
      response = await fetch(`${config.baseUrl}/api/ocr`, {
        method: "POST",
        headers: requestHeaders,
        body: formData
      });
    } catch (fetchErr) {
      if (config.baseUrl && config.baseUrl !== "" && (fetchErr.name === "TypeError" || fetchErr.message?.includes("fetch"))) {
        response = await fetch("/api/ocr", {
          method: "POST",
          headers: requestHeaders,
          body: formData
        });
      } else {
        throw fetchErr;
      }
    }

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server returned ${response.status}`);
    }
  } catch (error) {
    console.error("OCR Request failed:", error);
    throw error;
  }
};

/**
 * Retrieve digitized archive history from SQLite.
 */
export const fetchHistory = async (limit = 50, offset = 0, search = "") => {
  const config = getApiConfig();
  try {
    const url = new URL(`${config.baseUrl}/api/history`);
    url.searchParams.set("limit", limit);
    url.searchParams.set("offset", offset);
    if (search) url.searchParams.set("search", search);

    let res;
    try {
      res = await fetch(url.toString());
    } catch (err) {
      if (config.baseUrl && config.baseUrl !== "") {
        const fallbackUrl = new URL(`/api/history`, window.location.origin);
        fallbackUrl.searchParams.set("limit", limit);
        fallbackUrl.searchParams.set("offset", offset);
        if (search) fallbackUrl.searchParams.set("search", search);
        res = await fetch(fallbackUrl.toString());
      } else {
        throw err;
      }
    }
    if (res.ok) {
      const data = await res.json();
      return data.records || [];
    }
  } catch (err) {
    console.warn("fetchHistory failed:", err);
  }
  return [];
};

/**
 * Delete a recognized archive record from SQLite.
 */
export const deleteHistoryRecord = async (recordId) => {
  const config = getApiConfig();
  try {
    let res;
    try {
      res = await fetch(`${config.baseUrl}/api/history/${recordId}`, {
        method: "DELETE"
      });
    } catch (err) {
      if (config.baseUrl && config.baseUrl !== "") {
        res = await fetch(`/api/history/${recordId}`, {
          method: "DELETE"
        });
      } else {
        throw err;
      }
    }
    return res.ok;
  } catch (err) {
    console.error("deleteHistoryRecord failed:", err);
    return false;
  }
};

/**
 * Fetch live dashboard statistics from SQLite backend.
 */
export const fetchDashboardStats = async () => {
  const config = getApiConfig();
  try {
    let res;
    try {
      res = await fetch(`${config.baseUrl}/api/dashboard/stats`);
    } catch (err) {
      if (config.baseUrl && config.baseUrl !== "") {
        res = await fetch("/api/dashboard/stats");
      } else {
        throw err;
      }
    }
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchDashboardStats failed:", err);
  }
  return null;
};
