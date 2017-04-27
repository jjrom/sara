# SARA - docker installation

Mimic SARA installation on CentOS platform through docker for test/validation purpose

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

	# Configure nginx
	cat <<EOF > /etc/nginx/default.d/sara.conf
	  location ~ \.php\$ {
	      include /etc/nginx/fastcgi_params;
	      fastcgi_param   SCRIPT_FILENAME  \$document_root\$fastcgi_script_name;
	      fastcgi_split_path_info ^(.+\.php)(/.+)\$;
	      fastcgi_pass  127.0.0.1:9000;
	      fastcgi_index index.php;
	  }
	  location /sara.server/1.0/ {
	    if (!-e \$request_filename) {
	      rewrite ^/sara.server/1.0/(.*)\$ /sara.server/1.0/index.php?RESToURL=\$1 last; break;
	    }
	  }
	  # Quicklooks and zip files
	  location /data/ {
	    alias /g/data3/fj7/Copernicus/;
	  }
	  location ~ /\.ht {
	    deny all;
	  }
	  # Protect config files
	  location ~* ^config.\.php\$ {
	    return 404;
	  }
	EOF

	# Start postgres service
	service postgresql-9.5 start

	# Start php-fpm service
	service php-fpm start

	# Start nginx service
	service nginx start

	export SARA_HOME=/sara
	cd $SARA_HOME

    # Install itag - [WARNING] this is quite long !
    ./02_install_itag.sh config  

    # Install resto
    ./03_install_resto.sh config 
    

