const { createServerClient } = require('@supabase/ssr');
async function run() {
  const supabase = createServerClient('https://dummy.supabase.co', 'dummy-key', {
    cookies: {
      getAll() { return [] },
      setAll() {}
    }
  });
  try {
    const res = await supabase.auth.getUser();
    console.log("Result:", res);
  } catch (e) {
    console.log("Threw:", e);
  }
}
run();
