const padIdentityNumber = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0000";
  return String(Math.trunc(number)).padStart(4, "0");
};

export const parkRangerProfile = {
  name: "Ranger Daniel Ling",
  roleLabel: "Park Ranger",
  rangerId: "RGR-SFC-014",
  staffId: "SFC-RANGER-014",
  badgeId: "SFC-BDG-1842",
  station: "Bako National Park Field Station",
  patrolZone: "Plant Zone 01 / Coastal Trail",
  shift: "Morning response shift",
  radioCallsign: "Bako Ranger 14",
  supervisor: "Admin Review Desk",
  permissionScope: "Recommendation and field note only",
};

export const demoParkUserProfile = {
  name: "Aina Rahman",
  roleLabel: "Park Guide",
  guideId: "GUIDE-SFC-0024",
  trainingId: "TRN-SFC-0024",
  email: "aina.rahman@sfc.demo",
  assignedPark: "Bako National Park",
  courseTrack: "Bako Park Guide",
  certificationStatus: "In training",
};

export const buildGuideIdentity = (guide = {}) => {
  const identityNumber = padIdentityNumber(guide.id ?? guide.user_id ?? guide.guide_id);
  return {
    name: guide.name || "Unnamed guide",
    roleLabel: guide.roleLabel || "Park Guide",
    guideId: guide.guideId || `GUIDE-SFC-${identityNumber}`,
    trainingId: guide.trainingId || guide.studentId || `TRN-SFC-${identityNumber}`,
    email: guide.email || "No email recorded",
    phone: guide.phone || "No phone recorded",
    assignedPark: guide.module && guide.module !== "None" ? guide.module : "Unassigned",
    status: guide.eligibility || "Approved",
  };
};
