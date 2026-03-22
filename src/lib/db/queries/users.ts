import { db } from "..";
import { users } from "../schema";
import { eq } from "drizzle-orm";

export type User = typeof users.$inferSelect;

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}

export async function obtainUser(name:string): Promise<User> {
    const [result] = await db.select().from(users).where(eq(users.name, name))
    return result;
}

export async function borrarUsuarios() {
    await db.delete(users);
}

export async function getUsers() {
    let usuarios = await db.select().from(users);
    return usuarios;
}