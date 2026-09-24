// User-supplied search text must be escaped before going into a RegExp:
// "C++" or "(" would otherwise throw, and crafted patterns can cause ReDoS.
const escapeRegex = (str = "") => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsRegex = (str) => new RegExp(escapeRegex(str), "i");
const exactRegex = (str) => new RegExp(`^${escapeRegex(str)}$`, "i");

module.exports = { escapeRegex, containsRegex, exactRegex };
