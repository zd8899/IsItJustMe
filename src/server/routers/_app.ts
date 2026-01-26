import { router } from "../trpc";
import { postRouter } from "./post";
import { commentRouter } from "./comment";
import { voteRouter } from "./vote";
import { categoryRouter } from "./category";
import { userRouter } from "./user";

export const appRouter = router({
  post: postRouter,
  comment: commentRouter,
  vote: voteRouter,
  category: categoryRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
