const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor < 26 || (nodeMajor === 26 && nodeMinor < 13)) {
  console.error(
    `Cần Node.js >=26.13.0 để chạy server. Hiện tại: ${process.version}.\n` +
      "Chạy: nvm install 26.13.0; nvm use 26.13.0; npm start",
  );
  process.exit(1);
}

// shortcut: Vercel container nhận traffic ở PORT, mặc định 80. Ghim 3000 thì router không tới process.
const port = process.env.PORT || (process.env.VERCEL || process.env.VERCEL_ENV ? 80 : 3000);

let app;
try {
  ({ default: app } = await import("./app.js"));
} catch (err) {
  console.error(err);
  const express = (await import("express")).default;
  app = express();
  app.use((req, res) => {
    res.status(500).json({ error: "Lỗi máy chủ" });
  });
}

if (process.env.SESSION_SECRET) {
  try {
    const { getDb } = await import("./db/connection.js");
    const { seedDemo } = await import("./db/seedDemo.js");
    await seedDemo(getDb());
  } catch (err) {
    console.error(err);
  }
}

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`http://localhost:${port}`);
});
server.on("error", (err) => {
  console.error(err);
});
