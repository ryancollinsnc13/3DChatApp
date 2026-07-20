# 3DChatAPP Product Brief

You are building a new React web app based on a chat-first spatial social app.

## Core Idea

Build a mobile-first chat app where each user has a personal home, each conversation can appear as a house or room, and the neighborhood is a spatial inbox/feed for chats, friends, presence, unread activity, and social updates.

## Important Product Direction

This is not a generic MMO. The 3D/spatial layer exists to make chat feel memorable, personal, and navigable. Chat, friends, homes, profiles, unread state, and presence are the core product.

Replace the previous Unity client direction with a React web app.

## Target Stack

- React
- TypeScript
- Vite
- Tailwind or CSS modules
- Zustand or React Context for client state
- React Router if routing is needed
- Optional: Three.js / React Three Fiber for the spatial neighborhood or room scenes
- Node API or Next.js API routes for backend, depending on project preference
- Postgres/Supabase can be planned, but the MVP can start with mock/in-memory data

## Primary Screens

1. Auth / dev mock login
2. Avatar setup
3. Home
4. Neighborhood
5. Chat
6. Friend / neighbor picker
7. House/profile visit panel

## Core Tabs

Only use:

Home | Chat

## Home Should Show

- The active player's house/profile room
- Privacy controls: public, friends-only, private
- Status, bio, exterior preset, interior preset
- Neighborhood map/feed with friend houses
- Unread badges on houses
- Presence indicators
- Add Neighbor flow

## Chat Should Show

- Conversation list
- DM/group chat threads
- Message sending
- Unread counts
- Last message previews
- Fast switching between conversations

## Spatial Concept

The neighborhood is a visual inbox. Houses represent friends, DMs, group chats, or activity threads. Clicking/tapping a house opens the relevant chat/profile/room context.

## MVP Rule

Build the useful chat app first. Add richer 3D only where it improves navigation, identity, or presence.

## Do Not Add

- Quests
- Inventory
- Combat
- Generic MMO city simulation
- Global persistent world
- RPG progression
- Complex realtime multiplayer unless it directly supports chat/presence

## Design Style

Cozy, readable, mobile-first, social, playful but practical. The app should feel like a spatial messaging app, not a game launcher.

---

# React Spatial Chat App Design Doc

## Product Summary

This app is a mobile-first spatial chat experience. Users communicate through familiar chat mechanics, but the interface presents people, groups, and conversations as homes, houses, rooms, and neighborhoods.

The main product is chat. The spatial layer is a navigation and identity layer.

## Product Principles

- Chat is the core daily action.
- A user's home is their profile and personal chat room.
- A house can represent a friend, DM, group chat, or activity thread.
- A neighborhood is a spatial inbox/feed.
- Spatial UI should make conversations easier to recognize and return to.
- Avoid building a full MMO unless social/chat behavior demands it.

## MVP Scope

The MVP should include:

- React web app
- Mock login or simple auth
- Player profile
- Avatar setup
- Home view
- Chat view
- Neighborhood view
- Friend request flow
- House privacy
- Conversation list
- Message thread
- Message sending
- Unread counts
- Visit friend house/profile
- Presence status as simple online/away/offline

## Core Navigation

Use two primary tabs:

Home | Chat

## Home

The Home tab contains the user's personal house and neighborhood.

Home features:

- Player identity card
- House name
- Status message
- Bio
- Exterior preset
- Interior preset
- Privacy setting
- Neighborhood map/feed
- Friend houses
- Unread badges
- Add Neighbor button
- Incoming friend request badge

The neighborhood should feel like a spatial inbox. It can start as a CSS/React layout and later become a Three.js scene.

## Chat

The Chat tab contains the functional messaging experience.

Chat features:

- Conversation list
- DM and group conversations
- Last message preview
- Unread count
- Thread view
- Send message input
- Message timestamps
- Refresh/reload behavior

Chat must remain fast and obvious even if the spatial layer becomes richer later.

## Data Models

```ts
type Player = {
  playerId: string;
  username: string;
  displayName: string;
  avatarPresetId: string;
  level?: number;
  presence: "online" | "away" | "offline";
};

type House = {
  houseId: string;
  ownerPlayerId: string;
  name: string;
  exteriorPreset: string;
  interiorPreset: string;
  privacy: "public" | "friends_only" | "private";
  status: string;
  bio: string;
  updatedAt: string;
};

type Conversation = {
  conversationId: string;
  conversationType: "dm" | "group";
  title: string;
  participantIds: string[];
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
};

type Message = {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

type Neighborhood = {
  neighborhoodId: string;
  ownerPlayerId: string;
  theme: string;
  homeSlot: HouseSlot;
  houseSlots: HouseSlot[];
};

type HouseSlot = {
  slotIndex: number;
  ownerPlayerId: string;
  displayName: string;
  relationship: "self" | "friend";
  presence: "online" | "away" | "offline";
  exteriorPreset: string;
  unreadCount: number;
  lastActivity?: string;
};
```

## Suggested React Structure

```txt
src/
  app/
    App.tsx
    router.tsx
  components/
    auth/
    avatar/
    chat/
    home/
    neighborhood/
    houses/
    friends/
    layout/
  state/
    useSessionStore.ts
    useChatStore.ts
    useNeighborhoodStore.ts
  api/
    client.ts
    auth.ts
    chat.ts
    houses.ts
    friends.ts
  types/
    models.ts
  styles/
```

## API Shape

The MVP API should support:

- `POST /auth/login`
- `POST /session/bootstrap`
- `GET /conversations`
- `GET /messages`
- `POST /messages/send`
- `GET /houses/:playerId`
- `POST /houses/:playerId/visit`
- `POST /houses/:playerId/privacy`
- `GET /neighborhood`
- `GET /users`
- `POST /friends/request`
- `GET /friends/requests`
- `POST /friends/accept`
- `POST /friends/reject`
- `GET /avatars/:playerId`
- `POST /avatars/:playerId`

## Visual Direction

The UI should feel:

- Cozy
- Social
- Mobile-first
- Slightly game-like
- Clear and readable
- More like a spatial messaging app than an MMO

Avoid heavy fantasy RPG UI unless it supports chat identity. Houses, avatars, and neighborhoods can be charming, but the interface should stay practical.

## Future Features

After the MVP:

- Realtime chat
- Realtime house presence
- House interiors
- Rich avatar editor
- Media messages
- Push notifications
- Production auth
- Postgres persistence
- Moderation/blocking
- Custom house decoration
- React Three Fiber neighborhood scene

## Non-Goals

Do not build these in the MVP:

- Combat
- Quests
- Inventory
- Leveling systems
- Persistent global world
- MMO shard architecture
- Party matchmaking
- Complex physics or movement systems

The goal is a spatial chat app, not a web MMO.
