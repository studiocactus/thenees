import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const serviceClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

export async function requireAdmin(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return null;
  const admin = serviceClient();
  const { data } = await admin.from("admin_users").select("role,active").eq("user_id", user.id).eq("active", true).maybeSingle();
  return data ? { user, role: data.role as string } : null;
}
