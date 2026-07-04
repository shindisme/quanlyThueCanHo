# Chatbot response fix

## Cause

`POST /chat` returns `{ success: true, data: { reply } }`, while `GuestChatbox`
reads `res.data.reply`, so it always displays its fallback.

## Design

Keep the shared backend response envelope. Update the frontend response type and
read `res.data.data.reply`. Keep the existing fallback for an empty reply.

## Verification

Add one regression check for the response extraction, then run the frontend
type-check/build.
