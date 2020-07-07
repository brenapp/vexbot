# In Continous Integration, deploys the product to the server
rsync -e "ssh -o StrictHostKeyChecking=no" vexbot.tgz ec2-user@dev.bren.app:~/vexbot

ssh ec2-user@dev.bren.app tar -xvf ~/vexbot.tgz