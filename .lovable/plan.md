## Phase 1: Database Schema + Auth
- Create tables: profiles, sessions, metrics, genome_snapshots, events, classes, class_students, exports
- Set up RLS policies with role-based access (Student/Teacher/Admin)
- Wire up Auth (email/password + role selection) to existing Auth page
- Add Supabase client integration

## Phase 2: Live Mode — MediaPipe Eye Tracking
- Add @mediapipe/tasks-vision for FaceMesh/Iris
- Build EyeTracker component: getUserMedia → extract gaze/blink/fixation metrics locally
- Consent modal with privacy controls
- "Privacy Status" indicator + tracking quality gauge
- EMA smoothing for metrics
- Graceful fallback to Demo Mode if camera denied

## Phase 3: Real-Time Streaming + Persistence
- Edge function for session management (start/end/metrics ingest)
- Store sessions, metrics batches, genome snapshots in DB
- WebSocket-style real-time via Supabase Realtime channels
- Polling fallback (1.5s)
- Session history tab loading from DB
- Teacher class management (create class, invite students, assign)

## Phase 4: PDF Export + ML Engine Abstraction
- Edge function for server-side PDF generation (genome wheel SVG, charts, insights)
- Trait Engine abstraction: Demo/Rule-Based/ML modes with model loader interface
- Admin UI for model version switching
- "No model loaded" fallback banner

## Phase 5: Polish + Privacy Controls
- System status indicator (WS connected / fallback / offline)
- Skeleton loaders, empty states, error toasts
- Student data export (JSON) + delete account
- Admin data retention controls
- Final acceptance testing across all flows
