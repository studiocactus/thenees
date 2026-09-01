-- Make the public view obey the permissions and RLS policies of its caller.
-- Service-role bot functions keep their access, while authenticated users only
-- see birthday rows allowed by the underlying game_players policies.

alter view public.community_birthdays_today set (security_invoker = true);

