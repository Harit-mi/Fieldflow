const { createServerClient } = require('@supabase/ssr');
try {
  createServerClient(undefined, undefined, { cookies: {} });
  console.log("Did not throw");
} catch (e) {
  console.log("Threw:", e.message);
}
