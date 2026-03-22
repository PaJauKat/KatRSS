import { and, eq } from "drizzle-orm";
import { db } from "..";
import { feed_follows, feeds, users } from "../schema";
import { Feed } from "./feeds";
import { User } from "./users";

export async function borrarFollow(user:User, feed: Feed) {
    await db
    .delete(feed_follows)
    .where(and(
        eq(feed_follows.user_id, user.id), 
        eq(feed_follows.feed_id, feed.id)))
}

export async function createFeedFollow(user: User, feed: Feed) {
    const [newFeedFollow] = await db.insert(feed_follows).values({
        user_id: user.id,
        feed_id: feed.id
    }).returning();

    const result = await db.select({
        // Todos los campos de feed_follows
        id: feed_follows.id,
        createdAt: feed_follows.createdAt,
        updatedAt: feed_follows.updatedAt,
        user_id: feed_follows.user_id,
        feed_id: feed_follows.feed_id,
        // Nombres vinculados
        userName: users.name,
        feedName: feeds.name,
    }).from(feed_follows)
    .innerJoin(users, eq(feed_follows.user_id, users.id))
    .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
    .where(eq(feed_follows.id, newFeedFollow.id));

    return result[0];
}

export async function getFeedFollowsForUser(user: User) {
    let result = await db.select({
        feedName: feeds.name,
        userName: users.name
    }).from(feed_follows)
    .innerJoin(users, eq(feed_follows.user_id, users.id))
    .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
    .where(eq(feed_follows.user_id, user.id));

    return result;
}