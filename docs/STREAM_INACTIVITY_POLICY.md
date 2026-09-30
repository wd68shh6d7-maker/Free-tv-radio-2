# Stream Inactivity & Resource Protection

## Purpose

This is a future resource-management feature for Free TV & Radio. It is intended to reduce unnecessary long-running stream connections and help protect free hosting, bandwidth, and other infrastructure resources.

This is a planning record only. It does not change the current player behavior.

## Proposed viewer experience

For a viewer who has left the same stream running for a long period without meaningful interaction:

1. Allow up to approximately four hours of continuous inactivity before the first check.
2. Display a clear, simple prompt such as **"Still watching?"**
3. Give the viewer a generous response period to continue.
4. If there is still no response, provide a final reminder approximately 30 minutes later.
5. If the viewer remains inactive after the final grace period, pause or close the stream connection.
6. Any meaningful viewer interaction—such as changing channels or using player controls—resets the inactivity timer.

The exact timing should be configurable and tested before launch.

## Radio

Radio should have a separate policy because listeners commonly leave radio playing for long periods. Any radio inactivity limit should be longer and should be introduced only if resource usage makes it necessary.

## Design principles

- Never interrupt a normal viewing session unnecessarily.
- Never use the inactivity prompt as advertising space.
- Keep the prompt accessible and easy to dismiss.
- Do not interfere with channel-selection logic or the persistent player.
- The browser, guide, Favorites, and other site interactions should not accidentally terminate an active viewing session.
- Prefer pausing/closing our own player connection rather than implying control over a third-party provider's servers.
- Treat this as resource protection, not surveillance of viewers.

## Infrastructure goal

The purpose is to help the project remain sustainable on free or low-cost infrastructure. Before enabling the feature, monitor actual bandwidth, connection duration, hosting limits, and provider terms. If the site is operating comfortably without it, there is no need to introduce the interruption.

## Status

**Planned / not currently enabled.**

Any future implementation should be tested on a non-production deployment first and verified before being added to the working production build.
