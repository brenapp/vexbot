# Reset to origin branch
git reset --hard

echo "Downloading changes..."

# Update from GitHub
git pull;

# Download any new dependencies
npm i;

echo "Compiling..."
# Compile
tsc;

echo "Restarting..."
# Restart bot
pm2 restart vexbot;