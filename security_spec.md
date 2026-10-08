# Security Specification — Bit'Q (e=')

## 1. Data Invariants
1. **User Profile Isolation & Integrity**: Every `/users/{userId}` document may only be read, created, or updated by the authenticated user whose `request.auth.uid == userId` and `incoming().google_uid == request.auth.uid`. Email must be verified (`request.auth.token.email_verified == true`).
2. **Restaurant Ownership**: A `/restaurants/{restaurantId}` document can be read by any authenticated user for discovery, but can only be created or updated by the authenticated owner where `owner_uid == request.auth.uid`.
3. **Menu Item Ownership**: A `/menu_items/{itemId}` document can be read by any authenticated user, and created/updated/deleted only by the authenticated owner where `owner_uid == request.auth.uid`.
4. **Order Access & Terminal State**: An `/orders/{orderId}` document can only be created by the customer (`customer_uid == request.auth.uid`) with initial status `ORDER_PLACED`. Once `status` reaches `DELIVERED` or `CANCELLED`, no further updates are permitted (Terminal State Locking).
5. **Support Ticket Isolation**: A `/support_tickets/{ticketId}` document can only be read or created by the user whose `user_uid == request.auth.uid`.

## 2. The "Dirty Dozen" Payloads
1. **Unverified Email Write**: Attempting to create `/users/u1` when `request.auth.token.email_verified == false`.
2. **Identity Spoofing on User Create**: User `u1` attempting to create `/users/u2` or setting `google_uid: "u2"`.
3. **Shadow Field Injection on User**: Sending `{ ..., "isAdmin": true }` to `/users/u1`.
4. **Cross-User PII Read**: User `u2` attempting `get` or `list` on `/users/u1`.
5. **Immutable Field Mutation**: User `u1` attempting to change `created_at` or `google_uid` on `/users/u1`.
6. **Unauthorized Restaurant Mutation**: User `u2` attempting to update `/restaurants/r1` owned by `u1`.
7. **Resource Poisoning on Menu Item**: Creating `/menu_items/m1` with a 5,000-character `description` or negative `price`.
8. **Order Spoofing**: User `u1` creating an order with `customer_uid: "u2"`.
9. **Order State Shortcutting on Create**: User `u1` creating an order directly in `DELIVERED` state.
10. **Terminal State Re-opening**: Updating an order whose existing `status` is `DELIVERED` back to `FOOD_PREPARING`.
11. **Unbounded Ticket Message**: Creating a `/support_tickets/t1` with a 10KB `message` string.
12. **Timestamp Spoofing**: Creating any document with a past or future client timestamp (`created_at != request.time`).
