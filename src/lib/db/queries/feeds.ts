import { eq, sql } from "drizzle-orm";
import { db } from "..";
import { feeds, users } from "../schema";
import { User } from "./users";
import { fetchFeed } from "src/parsero";
import { createPost } from "./posts";

export type Feed = typeof feeds.$inferSelect;

export async function agregarFeed2db(user_id: string, feedName: string, url: string) {
    const [result] = await db.insert(feeds).values({ user_id: user_id, name: feedName, url: url }).returning();
    return result;
}

export async function obtainFeeds(): Promise<Feed[]> {
    return await db.select().from(feeds);
}

export async function obtainFeedByUrl(url: string) {
    let result = await db
        .select()
        .from(feeds)
        .where(eq(feeds.url, url));
    return result[0];
}

export async function markFeedFetched(feedId: string) {
    return await db
        .update(feeds)
        .set({
            last_fetched_at: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(feeds.id, feedId))
        .returning();
}

// Obtiene el feed más antiguo o que nunca ha sido procesado
export async function getNextFeedToFetch() {
    const result = await db
        .select()
        .from(feeds)
        .orderBy(sql`${feeds.last_fetched_at} ASC NULLS FIRST`)
        .limit(1);

    return result[0] || null;
}

export async function scrapeFeeds() {
    // 1. Obtener el siguiente
    const feedRecord = await getNextFeedToFetch();
    if (!feedRecord) {
        console.log("No hay feeds para procesar.");
        return;
    }

    // 2. Marcar como procesado inmediatamente (para evitar duplicados en concurrencia)
    await markFeedFetched(feedRecord.id);

    try {
        // 3. Fetch del contenido (usando tu función previa)
        const feedData = await fetchFeed(feedRecord.url);

        for (const item of feedData.channel.item) {
            const pubDate = item.pubDate ? new Date(item.pubDate) : null;

            await createPost({
                title: item.title,
                url: item.link,
                description: item.description,
                feed_id: feedRecord.id
            })
        }

        // 4. Iterar e imprimir
        console.log(`--- Scrapping: ${feedRecord.name} ---`);
        feedData.channel.item.forEach((item) => {
            console.log(` - ${item.title}`);
        });
    } catch (error) {
        console.error(`Error procesando feed ${feedRecord.url}:`, error);
    }
}