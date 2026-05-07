const toJson = async (res) => {
  const url = res?.url || "unknown-url";
  const contentType = String(res.headers?.get("content-type") || "").toLowerCase();

  let data = {};
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    // Some servers return HTML/text on errors (e.g. 404). Capture a short snippet.
    const text = await res.text().catch(() => "");
    data = text ? { message: text.slice(0, 180) } : {};
  }

  if (!res.ok) {
    const msg = data.error || data.message || `Request failed (${res.status})`;
    throw new Error(`${msg} [${res.status}] ${url}`);
  }
  return data;
};

const contentBaseFromAuthBase = (authBase) => {
  // Auth server usually runs on :4000 while admin/content server is :4001.
  if (!authBase) return "http://localhost:4001";
  const normalized = String(authBase)
    .replace(/\.4000(?=\/|$)/, ":4000")
    .replace(/\.4001(?=\/|$)/, ":4001");
  return normalized.replace(/:4000(?=\/|$)/, ":4001");
};

export const mobileContentApi = (authBaseUrl) => {
  const base = contentBaseFromAuthBase(authBaseUrl).replace(/\/$/, "");

  return {
    base,
    getModules: async (userId) => {
      const res = await fetch(`${base}/api/mobile/modules?userId=${encodeURIComponent(userId)}`);
      return toJson(res);
    },
    getCourses: async (userId) => {
      const res = await fetch(`${base}/api/mobile/courses?userId=${encodeURIComponent(userId)}`);
      return toJson(res);
    },
    registerCourse: async (courseId, userId) => {
      const res = await fetch(`${base}/api/mobile/courses/${encodeURIComponent(courseId)}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      return toJson(res);
    },
    saveProgress: async (moduleId, payload) => {
      const res = await fetch(`${base}/api/mobile/progress/${encodeURIComponent(moduleId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return toJson(res);
    },
    getCertificates: async (userId) => {
      const res = await fetch(`${base}/api/mobile/certificates/${encodeURIComponent(userId)}`);
      return toJson(res);
    },
    requestCertificate: async (userId, courseId) => {
      const res = await fetch(`${base}/api/mobile/certificates/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId }),
      });
      return toJson(res);
    },
    getNotifications: async (userId) => {
      const res = await fetch(`${base}/api/mobile/notifications/${encodeURIComponent(userId)}`);
      return toJson(res);
    },
    markNotificationRead: async (id, userId, read = true) => {
      const res = await fetch(`${base}/api/mobile/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, read }),
      });
      return toJson(res);
    },
    markAllNotificationsRead: async (userId) => {
      const res = await fetch(`${base}/api/mobile/notifications/read-all/${encodeURIComponent(userId)}`, {
        method: "PATCH",
      });
      return toJson(res);
    },
    getSchedule: async (userId) => {
      const res = await fetch(`${base}/api/mobile/schedule/${encodeURIComponent(userId)}`);
      return toJson(res);
    },
    createSchedule: async (payload) => {
      const res = await fetch(`${base}/api/mobile/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return toJson(res);
    },
    updateSchedule: async (id, payload) => {
      const res = await fetch(`${base}/api/mobile/schedule/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return toJson(res);
    },
    deleteSchedule: async (id, userId) => {
      const res = await fetch(`${base}/api/mobile/schedule/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      return toJson(res);
    },
    getProfile: async (userId) => {
      const res = await fetch(`${base}/api/mobile/profile/${encodeURIComponent(userId)}`);
      return toJson(res);
    },
    updateProfile: async (userId, payload) => {
      const res = await fetch(`${base}/api/mobile/profile/${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return toJson(res);
    },
    getModuleResources: async (courseId, moduleId, userId) => {
      const res = await fetch(
        `${base}/api/mobile/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/resources?userId=${encodeURIComponent(userId)}`
      );
      return toJson(res);
    },
    uploadModuleResource: async (courseId, moduleId, userId, file) => {
      const formData = new FormData();
      formData.append("userId", String(userId));

      let attached = false;
      if (file && typeof file === "object") {
        // Expo web can provide a real File object under asset.file.
        if (file.file instanceof File) {
          formData.append("file", file.file, file.name || file.file.name || "upload");
          attached = true;
        } else if (typeof File !== "undefined" && file instanceof File) {
          formData.append("file", file, file.name || "upload");
          attached = true;
        } else if (typeof file.uri === "string" && file.uri.length > 0) {
          // Native expects { uri, name, type } payloads.
          formData.append("file", {
            uri: file.uri,
            name: file.name || "upload",
            type: file.mimeType || file.type || "application/octet-stream",
          });
          attached = true;
        }
      }

      if (!attached) {
        throw new Error("Selected file is invalid. Please choose the file again.");
      }

      const res = await fetch(
        `${base}/api/mobile/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/resources`,
        { method: "POST", body: formData }
      );
      return toJson(res);
    },
    getModuleResourceDownloadUrl: (courseId, moduleId, resourceId, userId) =>
      `${base}/api/mobile/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/resources/${encodeURIComponent(resourceId)}/download?userId=${encodeURIComponent(userId)}`,
  };
};

