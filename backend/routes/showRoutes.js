import express from "express";
import { addComment, addShow, createCustomMovie, getEditableMovie, getNowPlayingMovies, getShow, getShows, updateMovie, voteMovie } from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

showRouter.get('/now-playing', protectAdmin, getNowPlayingMovies)
showRouter.post('/custom', protectAdmin, createCustomMovie)
showRouter.get('/editable/:movieId', protectAdmin, getEditableMovie)
showRouter.put('/editable/:movieId', protectAdmin, updateMovie)
showRouter.post('/add', protectAdmin, addShow)
showRouter.get("/all", getShows)
showRouter.post("/:movieId/vote", voteMovie)
showRouter.post("/:movieId/comment", addComment)
showRouter.get("/:movieId", getShow)

export default showRouter;
