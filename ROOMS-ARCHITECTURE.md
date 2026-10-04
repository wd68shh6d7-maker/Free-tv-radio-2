# Lounge Rooms — durable architecture and test target

This document is the durable project record for the Lounge Rooms feature so the requirements do not depend on any one chat session.

## Goal

Build a private, in-lounge digital living room for up to **8 people total**. The room stays inside the existing lounge URL and should work on phones, tablets, Chromebooks, Windows PCs, and Macs.

## Non-negotiable behavior

- One shareable room link can be forwarded to other people. The link identifies the same private room.
- Maximum **8 people total** in every room. No separate mobile/desktop cap.
- Whoever creates the room is the host/controller.
- Host controls the shared lounge content.
- When the host changes lounge TV/radio/program/resource, guests follow.
- The shared lounge player/content is the center of the room, with participant camera tiles around it.
- Each participant independently chooses camera ON/OFF.
- Each participant independently chooses microphone ON/OFF.
- Camera and microphone are never forced on just because someone joins.
- If camera and mic are both off, the person remains in the room and can watch/chat.
- Room chat remains available.
- On phones/tablets, rear-camera switching should eventually let a participant point the phone at the TV without physically repositioning the phone.
- Microphone should carry normal ambient room sound when enabled.
- Guests should not need separate Zoom accounts or another service's user profile.
- The user should not have to leave the lounge to use Rooms.
- Production must not be changed until the test build is verified.

## Media architecture

Use a provider-neutral media layer so Zoom is optional rather than the foundation.

Preferred shape:

1. **Rooms UI** — the living-room layout and controls.
2. **Rooms state** — Supabase Realtime for host navigation/player state.
3. **Media provider adapter** — Zoom Video SDK, LiveKit, or another SFU provider.
4. **Shared lounge player** — the actual lounge player remains the source of truth for synchronized lounge-native content.
5. **Fallback sharing** — screen share or rear-camera video for content that cannot be synchronized as a native lounge player.

The media provider must be replaceable without redesigning the lounge UI.

## Provider rule

Do not introduce a provider that can silently create an unexpected bill.

Zoom currently advertises 20 free Video SDK credits, but its service is metered by participant meeting-session minutes. LiveKit Cloud's free Build plan currently has hard caps rather than overage billing; the current documentation lists 5,000 WebRTC participant minutes, 100 connected participants, and 50 GB downstream transfer. These figures must be rechecked before launch.

If a provider requires payment information or can generate charges beyond an explicit free allowance, do not enable it in production without Robert's explicit approval.

## Test gates

### Gate 1 — code/build
- JavaScript syntax clean.
- Vercel preview deploy succeeds.
- Existing lounge tabs remain intact.
- Production untouched.

### Gate 2 — browser/UI
- Rooms tab loads.
- Create room UI works.
- Join room UI works.
- Forwarded `?room=ROOMCODE` link preserves the same room.
- 8-person limit is visible.
- Living-room center and camera tile layout render.

### Gate 3 — two-device media
Use two real devices:
- Device A creates room.
- Device B joins using the forwarded room link.
- Verify both remain inside lounge.
- Verify audio and camera can be independently enabled/disabled.
- Verify each participant can see the other when camera is enabled.
- Verify chat.
- Verify host content synchronization.

### Gate 4 — content sync
Test:
- TV program A -> TV program B.
- TV -> radio.
- TV -> Blue Letter Bible/resource.
- TV/app/resource navigation where supported.
- Return to lounge-native content.
- Verify guests follow without manually navigating.

### Gate 5 — 8-person stress test
Use eight participants/devices or a controlled test harness.
- Room refuses participant 9.
- Existing participants remain connected.
- Camera-off/mic-off participants do not consume unnecessary video rendering.
- No production regression.

### Gate 6 — production
Only after Gates 1–5 pass:
- merge the tested branch to main.
- deploy production.
- verify production URL.
- keep previous production deployment available for rollback.

## Important honesty rule

Do not call Rooms "finished" because a Vercel build is green. It is finished only after real-device media testing and shared-content testing pass.

## Current working direction

The current experimental branch is `rooms-zoom-test`. Production remains separate.

Zoom is currently only one possible media provider. If Zoom credentials/pricing or real-device behavior become a blocker, replace the provider adapter rather than rebuilding the Rooms experience from scratch.
