# In Continous Integration, deploys the product to the server
rsync vexbot.tgz ec2-user@dev.bren.app:~/vexbot

ssh ec2-user@dev.bren.app tar -xvf ~/vexbot.tgz