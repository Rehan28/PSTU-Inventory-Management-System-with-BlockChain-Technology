// server.cjs - CommonJS entry point for cPanel / Phusion Passenger
// Passenger uses require() to boot Node apps, which crashes on ES Modules (type: module).
// This wrapper bridges Passenger's require() to our ES Module server.js via dynamic import().

const path = require("path");

// Ensure .env is loaded from this exact directory regardless of Passenger's working directory
try {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
} catch {
  // If dotenv isn't available or fails, environment variables from cPanel GUI are used
}

(async () => {
  try {
    await import("./server.js");
  } catch (error) {
    console.error("[Passenger startup error via server.cjs]:", error);
    process.exit(1);
  }
})();
