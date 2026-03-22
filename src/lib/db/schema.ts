import { pgTable, timestamp, uuid, text, integer, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  name: text("name").notNull().unique(),
});

export const feeds = pgTable("feeds", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  name: text("name"),
  url: text("url").unique().notNull(),
  user_id: uuid("user_id").references(() => users.id, {onDelete: "cascade"}).notNull(),
  last_fetched_at:  timestamp("last_fetched_at")
})

export const feed_follows = pgTable("feed_follows",{
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  user_id: uuid("user_id").notNull().references(() => users.id, {onDelete: "cascade"}),
  feed_id: uuid("feed_id").notNull().references(() => feeds.id, {onDelete: "cascade"}),
},
  (t)=>[unique().on(t.user_id, t.feed_id)]
);

export const posts = pgTable("posts",{
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  title: text("title"),
  url: text("url").unique(),
  description: text("description"),
  published_at: timestamp("published_at"),
  feed_id: uuid("feed_id").notNull().references(()=>feeds.id, {onDelete: "cascade"})
})