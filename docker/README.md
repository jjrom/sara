# SARA - docker installation

Complete build of SARA application through docker installation for test purpose

## Building docker file
	
Building the docker file should be done once. It supposes that you have [docker](https://www.docker.com/docker.io) installed on your system 

	export SARA_SRC=/Users/jrom/Devel/sara
	cd ${SARA_SRC}/docker
	docker build -t sara --force-rm .

## Install and test SARA

### Install SARA within docker image

First launch sara image

	export SARA_SRC=/Users/jrom/Devel/sara
	export PGSQL_DIR=/Users/jrom/tmp/SARA
	docker run -v ${SARA_SRC}:/sara -v ${PGSQL_DIR}:/var/lib/pgsql --rm -ti sara /bin/bash

Within the docker image, launch the following

	# Initialize database
	service postgresql-9.5 initdb

	# Local connection to db without password
	cat <<EOF > /var/lib/pgsql/9.5/data/pg_hba.conf
	local   all             all                                     trust
	host    all             all             127.0.0.1/32            trust
	host    all             all             ::1/128                 trust
	EOF

	# Start postgres service
	service postgresql-9.5 start

	# Start php-fpm service
	service php-fpm start

	# Start nginx service
	service nginx start

	export SARA_HOME=/sara
	cd $SARA_HOME

	# Install iTag database (First time only)
	./install.sh -t itag

	# Install resto database (first time only)
	./install.sh -t resto
		

