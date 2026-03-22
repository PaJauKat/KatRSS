import { registerCommand, handlerLogin, runCommand, handlerRegister, handlerReset, handlerUsers, handlerAgg, handlerAddFeed, handlerListFeeds, handlerFollowing, handlerFollow, middlewareLoggedIn, handlerUnfollow, handlerPosts, handleBrowse } from "./config";
import { CommandsRegistry } from "./config";
import { User } from "./lib/db/queries/users";
    
console.log("Hello, world!");

async function main() {
    let reg: CommandsRegistry = {};
    registerCommand(reg, "login", handlerLogin);
    registerCommand(reg, "register", handlerRegister);
    registerCommand(reg, "reset", handlerReset);
    registerCommand(reg, "users", handlerUsers);
    registerCommand(reg, "agg", handlerAgg);
    registerCommand(reg, "addfeed", middlewareLoggedIn(handlerAddFeed));
    registerCommand(reg, "feeds", handlerListFeeds);
    registerCommand(reg, "follow", handlerFollow)
    registerCommand(reg, "following", handlerFollowing);
    registerCommand(reg, "unfollow", middlewareLoggedIn(handlerUnfollow))
    registerCommand(reg, "posts", handlerPosts);
    registerCommand(reg, "browser", handleBrowse)
    let args = process.argv.slice(2);
    if (args.length === 0){
        throw new Error("No me diste argumentos");
    }

    await runCommand(reg, args[0], ...args.slice(1));
    process.exit(0);
}

main()

