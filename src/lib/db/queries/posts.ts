import { db } from "..";
import { feed_follows, posts } from "../schema";
import { eq,desc } from "drizzle-orm";

export type Post = typeof posts.$inferSelect;

export async function createPost(data: typeof posts.$inferInsert) {
    return await db.insert(posts)
        .values(data)
        .onConflictDoNothing({ target: posts.url })
        .returning();
}

export async function getPostsForUser(userId: string, limit: number = 2) {
    return db.select({
        id: posts.id,
        title: posts.title,
        url: posts.url,
        published_at: posts.published_at
    })
    .from(posts)
    .innerJoin(feed_follows, eq(posts.feed_id, feed_follows.feed_id))
    .where(eq(feed_follows.user_id, userId))
    .orderBy(desc(posts.published_at))
    .limit(limit);
}