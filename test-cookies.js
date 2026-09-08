const { cookies } = require('next/headers');
async function run() {
  try {
    await cookies();
  } catch (e) {
    console.log("Error:", e);
    console.log("Keys:", Object.keys(e));
    console.log("Digest:", e.digest);
  }
}
run();
