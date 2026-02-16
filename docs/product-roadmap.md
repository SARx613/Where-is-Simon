# Product Roadmap

## Goal

Turn facial search into a complete event-photo ecosystem for guests and photographers.

## MVP (0-2 months)

### 1) QR Selfie Onboarding
- Guest scans QR at event entry and takes a selfie.
- System pre-links guest fingerprint for faster matching.
- KPI: selfie onboarding rate, first-match time.

### 2) Privacy Mode (hide/report)
- Guest can flag a photo for review or request hiding.
- Photographer dashboard gets moderation queue.
- KPI: moderation SLA, % resolved requests.

### 3) "You’ve been spotted" Notifications
- Trigger notification when new photos matching guest embedding are ingested.
- Start with in-app notifications, then email/push.
- KPI: notification CTR, return sessions.

## Growth (2-6 months)

### 4) Digital Guestbook (text + voice)
- Message attached to event or matched photo.
- Optional moderation mode for owners/photographers.

### 5) Album Selection Workflow
- Likes/favorites produce an exportable shortlist for album production.
- KPI: selection completion rate.

### 6) Photographer Insights Dashboard
- Most viewed/downloaded photos, event engagement, conversion funnel.
- KPI: upsell conversion and retention.

## Premium (6+ months)

### 7) Print Upsell Integration
- 1-click print ordering via partner API.
- Revenue share tracking.

### 8) Long-term Archive Plan
- Paid high-res storage retention (10-20 years).
- Lifecycle storage policy + download controls.

### 9) Contracts + Payment Hub
- E-signature contracts and staged payments.
- KPI: end-to-end booking conversion.

## Technical Enablers

- Stable DB schema + strict RLS (done in current refactor)
- API validation and authorization hardening (done in current refactor)
- Service layer + hooks architecture (done in current refactor baseline)
- Event/webhook pipeline for notifications (next milestone)
