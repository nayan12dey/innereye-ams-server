const { betterAuth } = require("better-auth");

const auth = betterAuth({
    // ... অন্যান্য কনফিগারেশন
    trustedOrigins: ["http://localhost:3000"], // CORS-এর জন্য আবশ্যক
    emailAndPassword: {
        enabled: true,
    },
});

module.exports = { auth };