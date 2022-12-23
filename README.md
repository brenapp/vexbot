# vexbot

vexbot is a custom discord bot designed for communities that participate in the VEX Robotics
Competition.

## Getting Started

To get started, clone this repository with your project name:

```
git clone https://github.com/MayorMonty/vexbot
```

```
cd vexbot
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
