const demoCourseResourceFiles = {
  'sfc-field-response-checklist.txt': {
    mimeType: 'text/plain',
    content: `SFC Field Response Quick Checklist

1. Open the incident record and confirm the alert source.
2. Check timestamp, park location, confidence score, and evidence clarity.
3. Compare AI camera evidence with IoT proximity signals when both exist.
4. Record whether the evidence is clear, partial, or inconclusive.
5. Add field notes with observed facts only.
6. Park Rangers should recommend an outcome for Admin review.
7. Admin remains responsible for the official incident status.
8. Keep the handover audit-ready with evidence, note, and recommendation.
`,
  },
  'sfc-incident-evidence-handover.txt': {
    mimeType: 'text/plain',
    content: `SFC Incident Evidence Handover Template

Incident ID:
Park / Zone:
Detected behavior:
Evidence source:
Evidence quality:
Field observation:
Ranger recommendation:
Admin decision:
Follow-up action:

Use neutral wording. Separate what the system detected from what staff confirmed in the field.
`,
  },
  'sfc-wildlife-briefing-card.txt': {
    mimeType: 'text/plain',
    content: `Wildlife Interaction Briefing Card

Visitors should observe wildlife from a safe distance.
Do not feed, touch, chase, corner, or disturb animals.
Keep food sealed and follow guide instructions near trails and shelters.
Report unsafe behavior early so staff can intervene before escalation.
`,
  },
  'sfc-wildlife-escalation-guide.txt': {
    mimeType: 'text/plain',
    content: `Wildlife Escalation Quick Guide

Escalate when evidence shows feeding, touching, chasing, injury risk, repeat refusal, or unclear behavior that needs Admin review.
Capture location, time, involved trail or facility, evidence source, field note, and recommended next step.
`,
  },
  'sfc-guide-onboarding-checklist.txt': {
    mimeType: 'text/plain',
    content: `Park Guide Onboarding Checklist

1. Sign in through the SFC portal.
2. Open assigned training courses.
3. Review the course overview and module list.
4. Complete required learning items and quizzes.
5. Save useful resources from the Files area.
6. Check completion status before requesting certificate review.
`,
  },
  'sfc-visitor-briefing-template.txt': {
    mimeType: 'text/plain',
    content: `Visitor Briefing Template

Welcome and route overview:
Safety reminders:
No-touch conservation rules:
Wildlife distance reminder:
Weather or trail condition note:
Emergency contact path:

Close by asking visitors to follow guide instructions and report concerns immediately.
`,
  },
}

export const getDemoCourseResource = (storedName) =>
  demoCourseResourceFiles[String(storedName || '').trim()] || null
