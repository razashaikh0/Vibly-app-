# Fix login, build profile editing, real-time room hub and game artwork

## 1. Login fixed first (blocker)

Nothing else matters until people can get in.

- Turn email/password sign-in ON in the backend (currently off, which is why every email sign-up/sign-in fails).
- Turn Google sign-in ON as a provider so the Google button stops erroring.
- Keep phone OTP as-is, with the existing resend cooldown.
- After enabling, sign in with a real test account and confirm: sign up, sign in, Google, sign out, and that the header/profile shows the signed-in user.

## 2. Profile editing (name + photo)

Right now there is no way to change your display name or photo.

- New "Edit profile" screen reachable from My Home: change display name, username, bio.
- Profile photo upload with a private-to-public image store, cropped to a square, instantly visible on seats, chat, gift wall and rankings.
- Username uniqueness check with a clear "already taken" message.

## 3. One room panel: Gift Wall + Ranking + CP timeline

Replace the three separate dialogs with a single sliding panel inside the room, three tabs, no jumping to profile pages.

```text
[ Gift Wall ] [ Members ] [ CP / Bonds ]
-------------------------------------
live gift feed  | charm & active rank | who guards whom, since when
```

- Tapping a member inside the panel opens an in-panel mini profile (avatar, level, charm, CP) with actions: Send gift, Follow, Invite to seat, Report.

## 4. Send charm/EXP gift from a member's profile

- "Send gift" button on the in-panel mini profile and on the seat long-press menu.
- Opens the gift tray pre-targeted at that member; sending deducts coins, adds charm to receiver and EXP to sender, and appears on the gift wall for everyone within a second.

## 5. Chat messages feed points in real time

- Every room message awards activity points to the sender on the server (already wired) and now pushes an instant ranking update to all members, so the Members tab re-sorts live.
- Join and leave events also update the member list and seat frames live.

## 6. Security warnings

Nine internal helper actions are currently callable by any signed-in user. Each one gets locked down so it can only act for the caller, inside a room they are actually in:

- Room join/leave/activity helpers: restricted to the caller's own user and their current room.
- Gift, red packet and VIP helpers: already verify the caller, but execute rights get narrowed so they can't be called out of context.
- Re-run the security check afterwards and confirm zero warnings.

## 7. Games: real artwork instead of emoji

- Generate an illustrated cover image for each of the 14 games (spy, painting, werewolf, ludo, bingo, etc.) and use them as card backgrounds — emojis removed.
- Add an Indian-culture game/room category with Wedding, Nikkah, Mehndi, Sangeet and Haldi themed rooms: matching room backgrounds, entry effects and gift sets.
- Games remain shells that open a room; playable logic comes in a later round, per game you pick.

## 8. End-to-end test

Using a real signed-in account I will walk the full loop and report what I saw: enter room, take a seat, chat, send a gift, watch the gift wall / frame / ranking update, then exit and confirm the member list drops the user.

## Technical notes

- Enable Supabase email auth + Google provider (`enable_email_auth`, `configure_social_auth`).
- New storage bucket `avatars` (public read, owner write) and profile update server function.
- `RoomHubPanel` component replacing the separate GiftWall / Ranking / Feed dialogs; keeps the existing debounced realtime subscriptions and adds `room_presence` + `room_activity` channels.
- Security fix: `REVOKE EXECUTE ... FROM authenticated` on internal helpers (`award_room_activity`, `log_fx`, `fx_rate_ok`, `is_room_host`, `update_updated_at_column`, `handle_new_user`, `vip_level_for`) keeping only the user-facing RPCs (`join_room`, `leave_room`, `send_gift`, `send_red_packet`, `record_vip_entry`, `add_guard_points`, `claim_task`, `create_room`) callable.
- Game covers via image generation into `src/assets/games/`.
