# Go to the right place
cd vexbot;

# Update from GitHub
git pull;

# Download any new dependencies
yarn;

# Compile
tsc;

# Restart bot
pm2 restart vexbot;