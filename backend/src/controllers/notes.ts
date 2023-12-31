import createHttpError from "http-errors";
import NoteModel from "../models/note";
import { RequestHandler } from "express";
import mongoose from "mongoose";
import { assertIsDefined } from "../utils/asserIsDefined";

export const getNotes: RequestHandler = async (req, res, next) => {
  const authenticatedUserID = req.session.userId;
  try {
    assertIsDefined(authenticatedUserID);
    const notes = await NoteModel.find({ userId: authenticatedUserID }).exec();
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

export const getNote: RequestHandler = async (req, res, next) => {
  const noteId = req.params.noteId;
  const authenticatedUserID = req.session.userId;

  try {
    assertIsDefined(authenticatedUserID);
    if (!mongoose.isValidObjectId(noteId)) {
      throw createHttpError(400, "Invalid note id");
    }

    const note = await NoteModel.findById(noteId).exec();

    if (!note) {
      throw createHttpError(404, "Note not found");
    }

    if (!note.userId.equals(authenticatedUserID)) {
      throw createHttpError(401, "You cannot access this note");
    }
    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
};

interface CreateNoteBody {
  title?: string;
  text?: string;
}

export const createNote: RequestHandler<
  unknown,
  unknown,
  CreateNoteBody,
  unknown
> = async (req, res, next) => {
  const title = req.body.title;
  const text = req.body.text;
  const authenticatedUserID = req.session.userId;

  try {
    assertIsDefined(authenticatedUserID);
    if (!title) {
      throw createHttpError(400, "Note must have a title");
    }

    const newNote = await NoteModel.create({
      userId: authenticatedUserID,
      title: title,
      text: text,
    });

    res.status(201).json(newNote);
  } catch (err) {
    next(err);
  }
};

interface UpdateNoteParams {
  noteId: string;
}

interface UpdateNoteBody {
  title?: string;
  text?: string;
}

export const updateNote: RequestHandler<
  UpdateNoteParams,
  unknown,
  UpdateNoteBody,
  unknown
> = async (req, res, next) => {
  const noteId = req.params.noteId;
  const newTitle = req.body.title;
  const newText = req.body.text;
  const authenticatedUserID = req.session.userId;

  try {
    assertIsDefined(authenticatedUserID);

    if (!mongoose.isValidObjectId(noteId)) {
      throw createHttpError(400, "Invalid note id");
    }
    if (!newTitle) {
      throw createHttpError(400, "Note must have a title");
    }

    const note = await NoteModel.findById(noteId).exec();

    if (!note) {
      throw createHttpError(404, "Note not found");
    }

    if (!note.userId.equals(authenticatedUserID)) {
      throw createHttpError(401, "You cannot access this note");
    }

    note.title = newTitle;
    note.text = newText;

    const updatedNote = await note.save();

    res.status(200).json(updatedNote);
  } catch (err) {
    next(err);
  }
};

export const deleteNote: RequestHandler = async (req, res, next) => {
  const noteId = req.params.noteId;
  const authenticatedUserID = req.session.userId;

  try {
    assertIsDefined(authenticatedUserID);

    if (!mongoose.isValidObjectId(noteId)) {
      throw createHttpError(400, "Invalid note id");
    }

    const note = await NoteModel.findById(noteId).exec();

    if (!note) {
      throw createHttpError(404, "Note not found");
    }

    await note.deleteOne();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
