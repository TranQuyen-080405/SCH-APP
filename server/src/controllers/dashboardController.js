import * as taskService from "../services/taskService.js";

export async function show(req, res) {
  const dashboard = taskService.dashboard(req.session.userId, req.query);
  res.json({ dashboard });
}
