const { createBrowserClient } = require('@supabase/ssr');
try {
  const client = createBrowserClient('dummy', 'dummy-key');
  console.log("Client created successfully");
} catch (e) {
  console.log("Error creating client:", e.message);
}
