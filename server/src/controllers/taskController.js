import * as taskService from "../services/taskService.js";

export async function list(req, res) {
  const tasks = taskService.list(req.session.userId, req.query);
  res.json({ tasks });
}

export async function create(req, res) {
  const task = taskService.create(req.session.userId, req.body);
  res.status(201).json({ task });
}

export async function update(req, res) {
  const task = taskService.update(req.session.userId, req.params.id, req.body);
  res.json({ task });
}

export async function remove(req, res) {
  taskService.remove(req.session.userId, req.params.id);
  res.status(204).end();
}
