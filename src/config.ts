import fs from 'fs';
import os from 'os';
import path from 'path';
import { borrarUsuarios, createUser, getUsers, obtainUser, User } from './lib/db/queries/users';
import { fetchFeed } from './parsero';
import { agregarFeed2db, Feed, obtainFeedByUrl, obtainFeeds, scrapeFeeds } from './lib/db/queries/feeds';
import { users } from './lib/db/schema';
import { borrarFollow, createFeedFollow, getFeedFollowsForUser } from './lib/db/queries/feedFollows';
import { getPostsForUser } from './lib/db/queries/posts';

//export const configFile = path.join(os.homedir(), ".gatorconfig.json");

export type Config = {
    dbUrl: string,
    currentUserName: string
}

type UserCommandHandler = (
    cmdName: string,
    user: User,
    ...args: string[]
) => Promise<void>;


export const middlewareLoggedIn = (handler: UserCommandHandler): CommandHandler => {
    return async (cmdName: string, ...args: string[]) => {
        let config = readConfig();
        let currentUser: User = await obtainUser(config.currentUserName);
        if(!currentUser){
            throw new Error("No se encontro el current user")
        }

        return await handler(cmdName, currentUser, ...args);
    }
}


export function setUser(username:string) {
    const configFile = path.join(os.homedir(), ".gatorconfig.json");
    let currentConfig: Config = readConfig();
    let updatedConfig: Config = {
        ...currentConfig,
        currentUserName: username
    };

    let rawData = JSON.stringify(updatedConfig, null, 2);

    fs.writeFileSync(configFile, rawData, "utf-8")
    console.log(`Usuario actualizado a: ${username}`);
}

export function readConfig(): Config {
    const configFile = path.join(os.homedir(), ".gatorconfig.json");
    let rawData = fs.readFileSync(configFile, "utf-8");
    
    let obj = JSON.parse(rawData)
    return obj;
}

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export async function handleBrowse(userId: string, ...args: string[]) {
  // Parseamos el límite o usamos 2 por defecto
  const limit = args[0] ? parseInt(args[0], 10) : 2;

  if (isNaN(limit)) {
    console.error("❌ El límite debe ser un número.");
    return;
  }

  const userPosts = await getPostsForUser(userId, limit);

  console.log(`\n--- Mostrando los últimos ${userPosts.length} posts ---`);
  userPosts.forEach(p => {
    console.log(`\n📌 ${p.title}`);
    console.log(`🔗 ${p.url}`);
    console.log(`📅 ${p.published_at?.toLocaleString() ?? "Sin fecha"}`);
  });
}

export async function handlerPosts(cmdName: string, ...args: string[]) {
    
}

export async function handlerUnfollow(cmdName: string, currentUser:User, ...args: string[]) {
    if(args.length === 0){
        throw new Error("Nose q link dar unfollow pendejol");
    }
    let feedUrl = args[0];
    let feed = await obtainFeedByUrl(feedUrl);
    if(!feed){
        throw new Error(`No se encontro el feed=${feedUrl}`)
    }

    await borrarFollow(currentUser, feed);
    console.log(`Se borro el follow User=${users.name} -> feed:${feed.name}`)
}

export async function handlerFollowing(cmdName: string, ...args: string[]) {
    let config = readConfig();
    let currentUser: User = await obtainUser(config.currentUserName);
    let userFeeds = await getFeedFollowsForUser(currentUser);
    console.log(`${currentUser.name} follows: ${userFeeds.length} feeds`)
    for (const feed of userFeeds) {
        console.log(` - ${feed.feedName}`);
    }
}

export async function handlerFollow(cmdName: string, ...args: string[]) {
    if(args.length === 0){
        throw new Error("Perro no me diste el link pa seguir");
    }
    let url = args[0];
    let config = readConfig();
    let currentUser: User = await obtainUser(config.currentUserName);
    let feed: Feed = await obtainFeedByUrl(url);
    let followInfo = await createFeedFollow(currentUser, feed);
    console.log(`(User:${followInfo.userName}) followed (feedName=${followInfo.feedName})`);

}

export async function handlerListFeeds(cmdName: string, ...args: string[]) {
    let feeds: Feed[] = await obtainFeeds();
    let users: User[] = await getUsers();

    for (const f of feeds) {
        let publicador: User | undefined = users.find((x: User)=>{
            return x.id === f.user_id;
        })

        console.log("---------------");
        console.log(`FeedName: ${f.name}`);
        console.log(`Feed URL: ${f.url}`);
        console.log(`Feed from user: ${publicador?.name}`);
    }

}

export async function handlerAddFeed(cmdName: string, currentUser: User, ...args: string[]) {
    const [feedName, feedUrl] = args; 

    if (!feedName) throw new Error("Falta el nombre del feed (feedName)");
    if (!feedUrl) throw new Error("Falta la URL del feed (feedUrl)");

    const feed = await agregarFeed2db(currentUser.id, feedName, feedUrl);
    await createFeedFollow(currentUser, feed);
    console.log(`User:${currentUser.name} added ${feed.name}`)

    printFeed(feed, currentUser);
}

export function printFeed(feed: Feed, user: User) {
    console.log("--- Detalle del Feed ---");
    console.log(`ID:        ${feed.id}`);
    console.log(`Nombre:    ${feed.name ?? "Sin nombre"}`);
    console.log(`URL:       ${feed.url}`);
    console.log(`Usuario:   ${user.name} (ID: ${user.id})`);
    console.log(`Creado el: ${feed.createdAt.toLocaleDateString()}`);
    console.log("------------------------");
}

export async function handlerAgg(cmdName: string, ...args: string[]) {
    if(args.length === 0){
        throw new Error("Falto el tiempo")
    }
    let timeStr = args[0];
    const timeBetweenRequests = parseDuration(timeStr);

    console.log(`Collecting feeds every ${timeStr}`);

    const handleError = (err: any) => console.error("Error en scrapeFeeds:", err);

    // Ejecutamos una vez inmediatamente
    scrapeFeeds().catch(handleError);

    // Iniciamos el intervalo
    const interval = setInterval(() => {
        scrapeFeeds().catch(handleError);
    }, timeBetweenRequests);

    // Manejo de SIGINT (Ctrl+C) para un cierre limpio
    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("\nShutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });

    console.log("Aggregator stopped.");
    process.exit(0);
}

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error("Formato de duración inválido. Usa: 10s, 1m, 1h, etc.");
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  const units: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
  };

  return value * units[unit];
}

export async function handlerUsers(cmdName: string, ...args: string[]) {

    let usuarios = await getUsers();
    let currentUser = readConfig();

    usuarios.forEach(u=>{
        if(u.name === currentUser.currentUserName){
            console.log(` - ${u.name} (current)`)
        }else{
            console.log(` - ${u.name}`)
        }
    })
}

export async function handlerReset(cmdName:string, ...args:string[]) {
    await borrarUsuarios();
    console.log("Se borraron todos los usuarios")
}

export async function handlerLogin(cmdName:string, ...args:string[]) {
    if (args.length === 0) {
        throw new Error("Te falto el username wn");
    }

    let user = await obtainUser(args[0])
    if (!user){
        throw new Error("No esta este usuario en la DB");
    }
    setUser(args[0]);
    console.log(`Iniciaste con ${args[0]}`);
}

export async function handlerRegister(cmdName:string, ...args: string[]) {
    if(args.length === 0){
        throw new Error("No me diste un name")
    }

    let usuario = await obtainUser(args[0]);
    console.log(`Usuario= ${usuario}`)
    if(usuario){
        throw new Error("Ya existe este usuario")
    }
    let data = await createUser(args[0]);
    console.log(`Usuario data= ${data}`);
    console.log(`Usuario ${args[0]} creado`);
    setUser(args[0]);

}

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry[cmdName] = handler;
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]){
    const handler = registry[cmdName];
    
    // 2. Validamos que el comando exista antes de ejecutarlo
    if (!handler) {
        console.error(`El comando "${cmdName}" no existe, fíjate bien.`);
        return;
    }

     await handler(cmdName, ...args);
}