import { getUserApiBaseUrl } from "./apiConfig";

const FALLBACK_COURSE_ID = "training-modules";

const toJson = async (res) => {
  const url = res?.url || "unknown-url";
  const contentType = String(res.headers?.get("content-type") || "").toLowerCase();

  let data = {};
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => "");
    data = text ? { message: text.slice(0, 180) } : {};
  }

  if (!res.ok) {
    const msg = data.error || data.message || `Request failed (${res.status})`;
    throw new Error(`${msg} [${res.status}] ${url}`);
  }
  return data;
};

const contentBaseFromAuthBase = (authBase) => getUserApiBaseUrl(authBase);

const adminBaseFromAuthBase = (authBase) => {
  // Admin-created courses are owned by the admin API on :4002.
  if (!authBase) return "http://localhost:4002";
  const normalized = String(authBase)
    .replace(/\.4000(?=\/|$)/, ":4000")
    .replace(/\.4001(?=\/|$)/, ":4001")
    .replace(/\.4002(?=\/|$)/, ":4002");
  return normalized
    .replace(/:4000(?=\/|$)/, ":4002")
    .replace(/:4001(?=\/|$)/, ":4002");
};

const withUserId = (url, userId) => {
  if (!userId) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}userId=${encodeURIComponent(userId)}`;
};

/** Merge fetch headers and always attach Bearer auth when a token is present. */
const mergeAuthHeaders = (token, headers) => {
  const merged = new Headers();
  if (headers instanceof Headers) {
    headers.forEach((value, key) => merged.set(key, value));
  } else if (headers && typeof headers === "object") {
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) merged.set(key, String(value));
    }
  }
  if (token) merged.set("Authorization", `Bearer ${token}`);
  return merged;
};

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const asText = (value, fallback = "") => {
  const resolved = firstValue(value, fallback);
  return resolved === undefined || resolved === null ? "" : String(resolved);
};

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null);
  if (value === undefined || value === null || value === "") return [];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const toBool = (value) =>
  value === true || value === 1 || String(value).toLowerCase() === "true";

const normalizeEnrollmentStatus = (status) => {
  const value = String(status || "none").toLowerCase();
  if (value === "rejected") return "declined";
  return ["none", "pending", "approved", "declined"].includes(value) ? value : "none";
};

const normalizeQuiz = (module = {}) => {
  if (Array.isArray(module.quiz)) {
    return module.quiz.map((question, index) => ({
      question: asText(question.question, `Question ${index + 1}`),
      options: toArray(firstValue(question.options, question.choices)),
      answerIndex: Number(firstValue(question.answerIndex, question.correctIndex, question.correct_index, question.answer, 0)) || 0,
    }));
  }

  const questions = [];
  const quiz = module.quiz && typeof module.quiz === "object" ? module.quiz : null;
  if (quiz?.question) {
    questions.push({
      question: asText(quiz.question, "Assessment question"),
      options: toArray(firstValue(quiz.options, quiz.choices)),
      answerIndex: Number(firstValue(quiz.answerIndex, quiz.correctIndex, quiz.correct_index, quiz.answer, 0)) || 0,
    });
  }

  for (const item of toArray(module.items)) {
    const itemType = asText(firstValue(item.itemType, item.item_type, item.type)).toLowerCase();
    if (itemType !== "quiz") continue;
    const itemQuiz = item.quiz && typeof item.quiz === "object" ? item.quiz : {};
    questions.push({
      question: asText(firstValue(itemQuiz.question, item.question, item.title), "Assessment question"),
      options: toArray(firstValue(itemQuiz.options, itemQuiz.choices, item.options, item.choices)),
      answerIndex: Number(firstValue(itemQuiz.answer, itemQuiz.correctAnswer, itemQuiz.correct_answer, item.answer, 0)) || 0,
    });
  }

  return questions.filter((question) => question.options.length > 0);
};

const normalizeContentBlocks = (module = {}) => {
  if (Array.isArray(module.contentBlocks)) return module.contentBlocks;

  const itemBlocks = toArray(module.items)
    .filter((item) => asText(firstValue(item.itemType, item.item_type, item.type)).toLowerCase() !== "quiz")
    .map((item, index) => {
      const type = asText(firstValue(item.itemType, item.item_type, item.type), "text").toLowerCase();
      const mediaUrl = asText(firstValue(item.media_url, item.mediaUrl, item.file_url, item.fileUrl, item.url, item.href));
      return {
        id: firstValue(item.itemId, item.item_id, item.id, index + 1),
        type: ["image", "video", "file"].includes(type) ? type : "text",
        title: asText(item.title, `Learning item ${index + 1}`),
        content: asText(firstValue(item.content, item.description)),
        media_url: mediaUrl,
        caption: asText(firstValue(item.caption, item.description)),
      };
    });

  if (itemBlocks.length) return itemBlocks;

  return toArray(module.lessons).map((lesson, index) => {
    if (typeof lesson === "string") {
      return { id: index + 1, type: "text", title: lesson, content: lesson };
    }
    return {
      id: firstValue(lesson.lesson_id, lesson.id, index + 1),
      type: lesson.media_url ? "image" : "text",
      title: asText(firstValue(lesson.title, lesson.content), `Lesson ${index + 1}`),
      content: asText(lesson.content),
      media_url: asText(lesson.media_url),
    };
  });
};

const normalizeModule = (row = {}, index = 0) => {
  const id = firstValue(row.id, row.module_id, index + 1);
  const courseId = asText(firstValue(row.course_id, row.courseId), FALLBACK_COURSE_ID);
  const progress = Number(firstValue(row.progress, row.progress_percent, row.progressPercent, 0)) || 0;

  return {
    ...row,
    id,
    module_id: firstValue(row.module_id, id),
    course_id: courseId,
    courseId,
    title: asText(row.title, `Module ${index + 1}`),
    subtitle: asText(firstValue(row.subtitle, row.description), "Module description will appear here."),
    category: asText(row.category, "Training"),
    park: asText(row.park, "All Parks"),
    level: asText(row.level, "Beginner"),
    duration: asText(row.duration, "Self-paced"),
    format: asText(row.format, "Online"),
    image: asText(firstValue(row.image, row.image_url), ""),
    accent: asText(firstValue(row.accent, row.accent_color), "#ff7a1a"),
    badge: asText(firstValue(row.badge, row.badge_name), "Training Badge"),
    objectives: toArray(row.objectives),
    contentBlocks: normalizeContentBlocks(row),
    quiz: normalizeQuiz(row),
    completedLessons: toArray(firstValue(row.completedLessons, row.completed_lessons)).map((item) => Number(item)),
    progress,
    savedQuizScore: Number(firstValue(row.savedQuizScore, row.quizScore, row.quiz_score, 0)) || 0,
    savedQuizPassed: toBool(firstValue(row.savedQuizPassed, row.quizPassed, row.quiz_passed, false)),
  };
};

const normalizeCourse = (row = {}) => ({
  ...row,
  course_id: asText(firstValue(row.course_id, row.courseId, row.id), FALLBACK_COURSE_ID),
  course_name: asText(firstValue(row.course_name, row.courseName, row.title), "Training Modules"),
  description: asText(row.description),
  start_date: asText(firstValue(row.start_date, row.startDate)),
  end_date: asText(firstValue(row.end_date, row.endDate)),
  total_contact_hours: Number(firstValue(row.total_contact_hours, row.totalContactHours, 0)) || 0,
  module_count: Number(firstValue(row.module_count, row.moduleCount, 0)) || 0,
  resource_count: Number(firstValue(row.resource_count, row.resourceCount, 0)) || 0,
  enrollment_status: normalizeEnrollmentStatus(firstValue(row.enrollment_status, row.enrollmentStatus, row.status, "none")),
  remarks: asText(firstValue(row.remarks, row.decision_note, row.decisionNote)),
});

const normalizeNotification = (row = {}) => ({
  ...row,
  id: firstValue(row.id, row.notification_id),
  notification_id: firstValue(row.notification_id, row.id),
  title: asText(row.title, "Notification"),
  body: asText(firstValue(row.body, row.message)),
  message: asText(firstValue(row.message, row.body)),
  type: asText(row.type, "training"),
  read: toBool(firstValue(row.read, row.is_read, false)),
  is_read: toBool(firstValue(row.is_read, row.read, false)),
  createdAt: asText(firstValue(row.createdAt, row.created_at)),
});

const normalizeSchedule = (row = {}) => ({
  ...row,
  id: firstValue(row.id, row.schedule_id),
  schedule_id: firstValue(row.schedule_id, row.id),
  user_id: firstValue(row.user_id, row.userId),
  module_id: firstValue(row.module_id, row.moduleId),
  date: asText(firstValue(row.date, row.schedule_date)),
  title: asText(row.title, "Training schedule item"),
  location: asText(row.location, "Self-paced"),
  type: asText(row.type, "Reminder"),
  status: asText(row.status, "Scheduled"),
});

const normalizeProfile = (row = {}) => {
  const userId = firstValue(row.user_id, row.userId, row.guide_id, row.guideId, row.id);
  const guideNumber = userId ? String(userId).padStart(4, "0") : "";
  return {
    ...row,
    user_id: userId,
    guide_id: firstValue(row.guide_id, userId),
    fullName: asText(firstValue(row.fullName, row.display_name, row.real_name, row.name), "SFC Park Guide"),
    email: asText(row.email, "guide@sfc.demo"),
    assignedPark: asText(firstValue(row.assignedPark, row.organization, row.assigned_park), "All Parks"),
    parkGuideId: asText(firstValue(row.parkGuideId, row.guide_code), guideNumber ? `GUIDE-SFC-${guideNumber}` : ""),
    phoneNumber: asText(firstValue(row.phoneNumber, row.phone)),
    birthday: asText(firstValue(row.birthday, row.birth_date, row.date_of_birth)),
    address: asText(row.address),
    imageUri: asText(firstValue(row.imageUri, row.avatar_url, row.avatar)),
    status: asText(row.status, "active"),
  };
};

const normalizeResource = (row = {}) => {
  const id = firstValue(row.resource_id, row.file_id, row.id);
  const url = asText(firstValue(row.url, row.file_url, row.download_url));
  return {
    ...row,
    id,
    resource_id: firstValue(row.resource_id, id),
    file_id: firstValue(row.file_id, id),
    course_id: asText(firstValue(row.course_id, row.courseId, row.course)),
    module_id: firstValue(row.module_id, row.moduleId),
    original_name: asText(firstValue(row.original_name, row.name, row.file_name, row.title), "Course resource"),
    file_name: asText(firstValue(row.file_name, row.name, row.original_name, row.title), "Course resource"),
    size_bytes: Number(firstValue(row.size_bytes, row.sizeBytes, 0)) || 0,
    mime_type: asText(firstValue(row.mime_type, row.mimeType), "application/octet-stream"),
    created_at: firstValue(row.created_at, row.uploaded_at, row.uploadedAt, row.uploaded),
    uploaded_at: firstValue(row.uploaded_at, row.uploadedAt, row.created_at),
    url,
  };
};

const statusFromCertificate = (certificate) => {
  const status = String(certificate?.status || "").toLowerCase();
  if (["issued", "approved"].includes(status)) return "approved";
  if (status === "pending") return "pending";
  return "none";
};

export const persistableCanvasItemId = (value) => {
  const candidate = value && typeof value === "object"
    ? firstValue(value.item_id, value.itemId, value.id)
    : value;
  const number = Number(candidate);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const mergeCanvasProgressIntoModules = (modules, canvasPayload) => {
  const summaries = canvasPayload?.summary?.modules;
  if (!Array.isArray(summaries) || summaries.length === 0) return modules;

  return modules.map((module) => {
    const summary = summaries.find(
      (row) => String(firstValue(row.module_id, row.moduleId)) === String(module.id)
    );
    if (!summary) return module;

    const progress = Number(firstValue(summary.progress_percent, summary.progressPercent, 0)) || 0;
    const totalItems = Number(firstValue(summary.total_items, summary.totalItems, 0)) || 0;
    const completedItems = Number(firstValue(summary.completed_items, summary.completedItems, 0)) || 0;

    return {
      ...module,
      progress,
      progress_percent: progress,
      canvasTotalItems: totalItems,
      canvasCompletedItems: completedItems,
      canvasComplete: totalItems > 0 && completedItems >= totalItems,
    };
  });
};

const buildCertificateSummaries = ({ courses, modules, certifications, canvasPayload }) =>
  courses.map((course) => {
    const courseModules = modules.filter((module) => String(module.course_id) === String(course.course_id));
    const canvasModules = (canvasPayload?.summary?.modules || []).filter(
      (row) => String(firstValue(row.course_id, row.courseId)) === String(course.course_id)
    );

    let doneModules = 0;
    let allModulesDone = false;
    let courseProgressPercent = 0;

    if (canvasModules.length > 0) {
      const totalItems = canvasModules.reduce(
        (sum, row) => sum + Number(firstValue(row.total_items, row.totalItems, 0)),
        0
      );
      const completedItems = canvasModules.reduce(
        (sum, row) => sum + Number(firstValue(row.completed_items, row.completedItems, 0)),
        0
      );
      doneModules = canvasModules.filter((row) => {
        const total = Number(firstValue(row.total_items, row.totalItems, 0));
        const completed = Number(firstValue(row.completed_items, row.completedItems, 0));
        return total > 0 && completed >= total;
      }).length;
      allModulesDone = totalItems > 0 && completedItems >= totalItems;
      courseProgressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    } else {
      doneModules = courseModules.filter((module) => Number(module.progress) >= 100).length;
      allModulesDone = courseModules.length > 0 && doneModules === courseModules.length;
      courseProgressPercent = courseModules.length
        ? Math.round(
            courseModules.reduce((sum, module) => sum + Number(module.progress || 0), 0) / courseModules.length
          )
        : 0;
    }

    const courseCerts = certifications.filter((certificate) => {
      const certCourseId = asText(firstValue(certificate.course_id, certificate.courseId));
      return certCourseId && String(certCourseId) === String(course.course_id);
    });
    const matchingCert =
      courseCerts.find((certificate) => !firstValue(certificate.module_id, certificate.moduleId)) ||
      courseCerts[0] ||
      certifications.find((certificate) => {
        const certModuleId = firstValue(certificate.module_id, certificate.moduleId);
        const moduleMatch = certModuleId && courseModules.some((module) => String(module.id) === String(certModuleId));
        const title = `${certificate.title || ""} ${certificate.course_id || ""}`.toLowerCase();
        return moduleMatch || title.includes(String(course.course_id).toLowerCase()) || title.includes(String(course.course_name).toLowerCase());
      });

    return {
      courseId: course.course_id,
      course_id: course.course_id,
      courseName: course.course_name,
      course_name: course.course_name,
      totalModules: courseModules.length,
      total_modules: courseModules.length,
      doneModules,
      done_modules: doneModules,
      courseProgressPercent,
      course_progress_percent: courseProgressPercent,
      allModulesDone,
      all_modules_done: allModulesDone,
      requestStatus: matchingCert ? statusFromCertificate(matchingCert) : "none",
      request_status: matchingCert ? statusFromCertificate(matchingCert) : "none",
      certId: firstValue(matchingCert?.cert_id, matchingCert?.id, null),
      cert_id: firstValue(matchingCert?.cert_id, matchingCert?.id, null),
      certificateCode: asText(firstValue(matchingCert?.certificate_code, matchingCert?.certificateCode)),
      certificate_code: asText(firstValue(matchingCert?.certificate_code, matchingCert?.certificateCode)),
      issueDate: firstValue(matchingCert?.issue_date, matchingCert?.issueDate, null),
      issue_date: firstValue(matchingCert?.issue_date, matchingCert?.issueDate, null),
    };
  });

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("This platform cannot convert the selected file for upload."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read selected file."));
    reader.readAsDataURL(blob);
  });

const fileToDataUrl = async (file) => {
  if (file?.dataUrl) return file.dataUrl;
  if (typeof Blob !== "undefined" && file?.file instanceof Blob) return blobToDataUrl(file.file);
  if (typeof Blob !== "undefined" && file instanceof Blob) return blobToDataUrl(file);
  if (file?.uri) {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    return blobToDataUrl(blob);
  }
  throw new Error("Selected file is invalid. Please choose the file again.");
};

export const mobileContentApi = (authBaseUrl, tokenSource) => {
  const base = contentBaseFromAuthBase(authBaseUrl).replace(/\/$/, "");
  const adminBase = adminBaseFromAuthBase(authBaseUrl).replace(/\/$/, "");

  // tokenSource may be a string (static token) or a function () => string.
  // Resolved lazily so callers can rotate the token without re-constructing the API client.
  const resolveToken = () => {
    if (typeof tokenSource === "function") {
      try { return tokenSource() || ""; } catch { return ""; }
    }
    return tokenSource || "";
  };

  const authedFetch = (url, init = {}) => {
    const token = resolveToken();
    if (!token) {
      return Promise.reject(
        new Error("Login token is missing. Please log out and sign in again. [401]")
      );
    }
    return fetch(url, {
      ...init,
      headers: mergeAuthHeaders(token, init.headers),
    });
  };

  const mergeCourseRecord = (existing = {}, incoming = {}) => {
    const existingStatus = normalizeEnrollmentStatus(firstValue(existing.enrollment_status, existing.enrollmentStatus, existing.status));
    const incomingStatus = normalizeEnrollmentStatus(firstValue(incoming.enrollment_status, incoming.enrollmentStatus, incoming.status));
    return {
      ...existing,
      ...incoming,
      enrollment_status: incomingStatus !== "none" ? incomingStatus : existingStatus,
      remarks: asText(firstValue(incoming.remarks, incoming.decision_note, existing.remarks, existing.decision_note)),
    };
  };

  const mergeCourseLists = (adminCourses = [], userCourses = []) => {
    const byId = new Map();
    for (const course of adminCourses) {
      byId.set(String(course.course_id), course);
    }
    for (const course of userCourses) {
      const key = String(course.course_id);
      byId.set(key, mergeCourseRecord(byId.get(key), course));
    }
    return [...byId.values()];
  };

  const loadCoursesCatalog = async (userId) => {
    let userData = {};
    let adminData = {};
    let userCourses = [];
    let adminCourses = [];
    let primaryError = null;
    let adminError = null;

    try {
      const res = await authedFetch(withUserId(`${base}/api/courses`, userId));
      userData = await toJson(res);
      userCourses = Array.isArray(userData.courses) ? userData.courses.map(normalizeCourse) : [];
    } catch (error) {
      primaryError = error;
    }

    // NOTE: The admin courses API on :4002 requires role `admin`, which mobile (guide-only)
    // cannot satisfy. The user API on :4001 already returns the full course catalog from the
    // same database, so we deliberately skip the admin call to avoid 403 console noise.
    // (Browsers log 4xx network responses to the console regardless of JS-level try/catch.)
    void adminBase;

    const courses = mergeCourseLists(adminCourses, userCourses);
    if (courses.length || !primaryError) {
      return {
        data: {
          ...adminData,
          ...userData,
          courseSource: adminCourses.length ? "admin-api" : "user-api",
        },
        courses,
      };
    }

    throw primaryError || adminError;
  };

  return {
    base,
    adminBase,
    getModules: async (userId) => {
      const [moduleRes, canvasRes] = await Promise.all([
        authedFetch(withUserId(`${base}/api/training-modules`, userId)).then(toJson),
        authedFetch(withUserId(`${base}/api/canvas-progress`, userId)).then(toJson).catch(() => null),
      ]);
      const modules = Array.isArray(moduleRes.modules) ? moduleRes.modules.map(normalizeModule) : [];
      return {
        ...moduleRes,
        canvasProgress: canvasRes,
        modules: mergeCanvasProgressIntoModules(modules, canvasRes),
      };
    },
    getCanvasProgress: async (userId) => {
      const res = await authedFetch(withUserId(`${base}/api/canvas-progress`, userId));
      return toJson(res);
    },
    saveCanvasItemProgress: async ({ userId, courseId, moduleId, itemId, itemType, status = "completed" }) => {
      const res = await authedFetch(withUserId(`${base}/api/canvas-progress/item`, userId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          user_id: userId,
          courseId,
          course_id: courseId,
          moduleId,
          module_id: moduleId,
          itemId,
          item_id: itemId,
          itemType,
          item_type: itemType,
          status,
        }),
      });
      return toJson(res);
    },
    syncModuleCanvasProgress: async ({
      userId,
      moduleId,
      courseId,
      completedLessons = [],
      completedItemIds = [],
      quizScore = 0,
      quizPassed = false,
      progressPercent = 0,
      markAllItems = false,
    }) => {
      const res = await authedFetch(withUserId(`${base}/api/canvas-progress/sync-module`, userId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          user_id: userId,
          moduleId,
          module_id: moduleId,
          courseId,
          course_id: courseId,
          completedLessons,
          completed_lessons: completedLessons,
          completedItemIds,
          completed_item_ids: completedItemIds,
          quizScore,
          quiz_score: quizScore,
          quizPassed,
          quiz_passed: quizPassed,
          progressPercent,
          progress_percent: progressPercent,
          markAllItems,
          mark_all_items: markAllItems,
        }),
      });
      return toJson(res);
    },
    saveCanvasQuizAttempt: async ({
      userId,
      courseId,
      moduleId,
      itemId,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      scorePercent,
    }) => {
      const res = await authedFetch(withUserId(`${base}/api/canvas-progress/quiz`, userId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          user_id: userId,
          courseId,
          course_id: courseId,
          moduleId,
          module_id: moduleId,
          itemId,
          item_id: itemId,
          selectedAnswer,
          selected_answer: selectedAnswer,
          correctAnswer,
          correct_answer: correctAnswer,
          isCorrect,
          is_correct: isCorrect,
          scorePercent,
          score_percent: scorePercent,
        }),
      });
      return toJson(res);
    },
    getCourses: async (userId) => {
      const { data, courses: loadedCourses } = await loadCoursesCatalog(userId);
      let courses = loadedCourses;

      if (courses.length === 0) {
        const moduleData = await authedFetch(withUserId(`${base}/api/training-modules`, userId)).then(toJson);
        const modules = Array.isArray(moduleData.modules) ? moduleData.modules.map(normalizeModule) : [];
        if (modules.length) {
          courses = [{
            course_id: FALLBACK_COURSE_ID,
            course_name: "Training Modules",
            description: "Database-backed training modules",
            module_count: modules.length,
            enrollment_status: "approved",
          }];
        }
      }

      return { ...data, courses };
    },
    registerCourse: async (courseId, userId) => {
      const res = await authedFetch(withUserId(`${base}/api/enrollments/requests`, userId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, user_id: userId, courseId, course_id: courseId }),
      });
      return toJson(res);
    },
    saveProgress: async (moduleId, payload) => {
      const userId = firstValue(payload?.userId, payload?.user_id);
      const res = await authedFetch(withUserId(`${base}/api/progress/${encodeURIComponent(moduleId)}`, userId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          user_id: userId,
          module_id: moduleId,
          course_id: firstValue(payload?.courseId, payload?.course_id),
          courseId: firstValue(payload?.courseId, payload?.course_id),
          progress_percent: firstValue(payload?.progressPercent, payload?.progress_percent, 0),
          completed_lessons: firstValue(payload?.completedLessons, payload?.completed_lessons, []),
          completed_item_ids: firstValue(payload?.completedItemIds, payload?.completed_item_ids, []),
          completedItemIds: firstValue(payload?.completedItemIds, payload?.completed_item_ids, []),
          quiz_score: firstValue(payload?.quizScore, payload?.quiz_score, 0),
          quiz_passed: firstValue(payload?.quizPassed, payload?.quiz_passed, false),
        }),
      });
      return toJson(res);
    },
    getCertificates: async (userId) => {
      const [certRes, courseCatalog, moduleRes, canvasRes] = await Promise.all([
        authedFetch(withUserId(`${base}/api/certifications`, userId)).then(toJson),
        loadCoursesCatalog(userId),
        authedFetch(withUserId(`${base}/api/training-modules`, userId)).then(toJson),
        authedFetch(withUserId(`${base}/api/canvas-progress`, userId)).then(toJson).catch(() => null),
      ]);
      const modules = mergeCanvasProgressIntoModules(
        Array.isArray(moduleRes.modules) ? moduleRes.modules.map(normalizeModule) : [],
        canvasRes
      );
      const courses = Array.isArray(courseCatalog.courses) ? courseCatalog.courses : [];
      const certifications = Array.isArray(certRes.certifications) ? certRes.certifications : [];
      return {
        certificates: buildCertificateSummaries({
          courses,
          modules,
          certifications,
          canvasPayload: canvasRes,
        }),
      };
    },
    requestCertificate: async (userId, courseId) => {
      const res = await authedFetch(withUserId(`${base}/api/certifications/request`, userId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, user_id: userId, courseId, course_id: courseId }),
      });
      return toJson(res);
    },
    getCertificateDownloadUrl: (userId, certId, tokenOverride) => {
      const token = tokenOverride || resolveToken();
      const params = new URLSearchParams({
        userId: String(userId || ""),
        display: "mobile",
      });
      if (token) params.set("access_token", token);
      return `${base}/api/certifications/${encodeURIComponent(String(certId))}/download?${params.toString()}`;
    },
    fetchCertificateHtml: async (userId, certId) => {
      const url = withUserId(
        `${base}/api/certifications/${encodeURIComponent(String(certId))}/download?display=mobile`,
        userId
      );
      const res = await authedFetch(url);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `Certificate download failed (${res.status})`);
        }
        const text = await res.text().catch(() => "");
        throw new Error(text || `Certificate download failed (${res.status})`);
      }
      return res.text();
    },
    getNotifications: async (userId) => {
      const res = await authedFetch(withUserId(`${base}/api/notifications`, userId));
      const data = await toJson(res);
      return {
        ...data,
        notifications: Array.isArray(data.notifications) ? data.notifications.map(normalizeNotification) : [],
      };
    },
    markNotificationRead: async (id, userId, read = true) => {
      const res = await authedFetch(withUserId(`${base}/api/notifications/${encodeURIComponent(id)}/read`, userId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, user_id: userId, read, is_read: read }),
      });
      return toJson(res);
    },
    markAllNotificationsRead: async (userId) => {
      const res = await authedFetch(withUserId(`${base}/api/notifications/read-all`, userId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, user_id: userId, read: true, is_read: true }),
      });
      return toJson(res);
    },
    getSchedule: async (userId) => {
      const res = await authedFetch(withUserId(`${base}/api/schedule`, userId));
      const data = await toJson(res);
      const scheduleItems = Array.isArray(data.schedule) ? data.schedule.map(normalizeSchedule) : [];
      return { ...data, scheduleItems };
    },
    createSchedule: async (payload) => {
      const userId = firstValue(payload?.userId, payload?.user_id);
      const res = await authedFetch(withUserId(`${base}/api/schedule`, userId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, user_id: userId }),
      });
      const data = await toJson(res);
      return normalizeSchedule(firstValue(data.schedule, data));
    },
    updateSchedule: async (id, payload) => {
      const userId = firstValue(payload?.userId, payload?.user_id);
      const res = await authedFetch(withUserId(`${base}/api/schedule/${encodeURIComponent(id)}`, userId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, user_id: userId }),
      });
      const data = await toJson(res);
      return normalizeSchedule(firstValue(data.schedule, data));
    },
    deleteSchedule: async (id, userId) => {
      const res = await authedFetch(withUserId(`${base}/api/schedule/${encodeURIComponent(id)}`, userId), {
        method: "DELETE",
      });
      return toJson(res);
    },
    getProfile: async (userId) => {
      const res = await authedFetch(withUserId(`${base}/api/user-profile`, userId));
      const data = await toJson(res);
      return { ...data, profile: normalizeProfile(firstValue(data.profile, data)) };
    },
    updateProfile: async (userId, payload) => {
      const profile = {};
      if (payload?.fullName !== undefined) profile.fullName = payload.fullName;
      if (payload?.email !== undefined) profile.email = payload.email;
      if (payload?.phoneNumber !== undefined) profile.phoneNumber = payload.phoneNumber;
      if (payload?.birthday !== undefined) profile.birthday = payload.birthday;
      if (payload?.address !== undefined) profile.address = payload.address;
      if (payload?.assignedPark !== undefined) profile.assignedPark = payload.assignedPark;

      const res = await authedFetch(withUserId(`${base}/api/user-profile`, userId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, user_id: userId, profile }),
      });
      const data = await toJson(res);
      return {
        ...data,
        ok: true,
        profile: normalizeProfile(firstValue(data.profile, payload)),
      };
    },
    getModuleResources: async (courseId, moduleId, userId) => {
      const res = await authedFetch(withUserId(`${base}/api/course-files`, userId));
      const data = await toJson(res);
      const resources = Array.isArray(data.files)
        ? data.files
            .map(normalizeResource)
            .filter((resource) => {
              const hasCourse = Boolean(resource.course_id);
              const hasModule = Boolean(resource.module_id);
              const sameCourse = String(resource.course_id) === String(courseId);
              const sameModule = Number(resource.module_id) === Number(moduleId);
              return (!hasCourse || sameCourse || sameModule) && (!hasModule || sameModule);
            })
        : [];
      return { resources };
    },
    uploadModuleResource: async (courseId, moduleId, userId, file) => {
      const dataUrl = await fileToDataUrl(file);
      const res = await authedFetch(withUserId(`${base}/api/course-files`, userId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          user_id: userId,
          moduleId,
          module_id: moduleId,
          course: courseId,
          fileName: file?.name || "course-file",
          mimeType: file?.mimeType || file?.type || "application/octet-stream",
          sizeBytes: Number(file?.size || 0),
          dataUrl,
        }),
      });
      return toJson(res);
    },
    getModuleResourceDownloadUrl: (_courseId, _moduleId, resourceId) => {
      const value = String(resourceId || "");
      if (/^https?:\/\//i.test(value)) return value;
      if (value.startsWith("/")) return `${base}${value}`;
      return `${base}/uploads/course-files/${encodeURIComponent(value)}`;
    },
  };
};
