![liquid (3)](https://user-images.githubusercontent.com/8839926/188060669-8d4fa711-d978-443c-a558-9e5aa2b11443.png)

Liquid is a discord bot template desigened to get you going on the fun parts of bot development fast! It was created after I had noticed myself creating the same basic code structure over and over again. It includes built in support for:

- Slash Commands
- Command Permissions System
- Hot Module Reloading
- Secrets Management
- Standardized Logging
- Good TypeScript configuration
- Bot Structure

## Getting Started

To get started, clone this repository with your project name:

```
git clone https://github.com/MayorMonty/liquid -o BotName
```

```
cd BotName
```

Create the secrets JSON object from the `secret.templates` folder. This folder is hidden and gitignore and can be used to store tokens and secrets. The benefit of this approach is the strong typescript support out of the box due to JSON imports.

```
cp -r secret.templates secret
```

You will need to fill the `discord.json` with `token`, and `clientID` Go to the applications page on Discord Developments to obtain this information. Additionally you should specify a `developmentGuild` to deploy slash commands to upon hot reloading during development.

Once all of the secrets have been added, install, and run dev!

```
npm install
```

```
npm run dev
```
