if (!process.env.SESSION_SECRET) {
  console.error("Thiếu SESSION_SECRET");
  process.exit(1);
}

const { default: app } = await import("./app.js");
const { getDb } = await import("./db/connection.js");
const { seedDemo } = await import("./db/seedDemo.js");

await seedDemo(getDb());

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`http://localhost:${port}`);
});
