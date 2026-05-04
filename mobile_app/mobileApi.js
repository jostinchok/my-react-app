const toJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
};

const contentBaseFromAuthBase = (authBase) => {
  // Auth server usually runs on :4000 while admin/content server is :4001.
  if (!authBase) return "http://localhost:4001";
  return authBase.replace(/:4000(?=\/|$)/, ":4001");
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
    getNotifications: async (userId) => {
      const res = await fetch(`${base}/api/mobile/notifications/${encodeURIComponent(userId)}`);
      return toJson(res);
    },
    markNotificationRead: async (id, read = true) => {
      const res = await fetch(`${base}/api/mobile/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
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
    deleteSchedule: async (id) => {
      const res = await fetch(`${base}/api/mobile/schedule/${encodeURIComponent(id)}`, {
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
  };
};

