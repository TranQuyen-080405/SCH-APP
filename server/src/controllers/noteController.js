import * as noteService from "../services/noteService.js";

export async function list(req, res) {
  res.json({ notes: noteService.list(req.session.userId) });
}

export async function create(req, res) {
  res.status(201).json({ note: noteService.create(req.session.userId, req.body) });
}

export async function update(req, res) {
  res.json({ note: noteService.update(req.session.userId, req.params.id, req.body) });
}

export async function remove(req, res) {
  noteService.remove(req.session.userId, req.params.id);
  res.status(204).end();
}
