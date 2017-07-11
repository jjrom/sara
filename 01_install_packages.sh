#!/bin/bash
#
# SARA - Sentinel Australia Regional Access
# 
# Installation script
#
# Author : Jérôme Gasperi (https://github.com/jjrom)
# Date   : 2017.04.26
#
#

CONFIG=config
function showUsage {
    echo ""
    echo "   SARA - Sentinel Australia Regional Access packages installation"
    echo ""
    echo "   Usage $0 [options]"
    echo ""
    echo "      -C | --config : local config file containing parameters to configure nginx service"
    echo "      -h | --help : show this help"
    echo ""
    echo ""
}

# Parsing arguments
while [[ $# > 0 ]]
do
	key="$1"

	case $key in
        -C|--config)
            CONFIG="$2"
            shift # past argument
            ;;
        -h|--help)
            showUsage
            exit 0
            shift # past argument
            ;;
            *)
        shift # past argument
        # unknown option
        ;;
	esac
done

if [ "${CONFIG}" == "" ]
then
    showUsage
    echo ""
    echo "   ** Missing mandatory config file ** ";
    echo ""
    exit 0
fi

# Source config file
. ${CONFIG}

echo "###############################################"
echo "#                  SARA                       #"
echo "#        CentOS packages installation         #"
echo "###############################################"

echo " >>> Install packages for SARA"
yum -y update; yum clean all
rpm -Uvh http://yum.postgresql.org/9.5/redhat/rhel-6-x86_64/pgdg-redhat95-9.5-2.noarch.rpm
rpm -Uvh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
rpm -Uvh http://elgis.argeo.org/repos/6/elgis-release-6-6_0.noarch.rpm
yum -y install git wget unzip nginx postfix mailx postgresql95-server postgresql95 postgresql95-contrib postgis2_95 postgis2_95-utils postgis2_95-client php php-pgsql php-xml php-fpm python-pip
yum clean all
pip install requests

echo " >>> Install nodejs for Web client generation"
yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_6.x | sudo -E bash -
yum install -y nodejs

# Install grunt
npm install -g grunt-cli

# install node json tool
npm install -g json

echo " >>> Initialize postgres database"
cat <<EOF > /etc/sysconfig/pgsql/postgresql-9.5
PGDATA=${POSTGRESQL_DATA_DIRECTORY}
EOF
service postgresql-9.5 initdb

echo " >>> Update ${POSTGRESQL_DATA_DIRECTORY}/pg_hba.conf to allow trusted local connection"
cat <<EOF > ${POSTGRESQL_DATA_DIRECTORY}/pg_hba.conf
local   all             all                                      trust
host    all             all             127.0.0.1/32             trust
host    all             all             ::1/128                  trust
EOF

echo " >>> Create configuration file /etc/nginx/default.d/sara.conf"
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
  location ${SARA_DATA_URL} {
    alias ${DATA_ROOT_PATH};
  }
  location ~ /\.ht {
    deny all;
  }
  # Protect config files
  location ~* ^config.\.php\$ {
    return 404;
  }
EOF

echo " >>> Start postgres database"
service postgresql-9.5 start

echo " >>> Start php-fpm service"
service php-fpm start

echo " >>> Start nginx service"
service nginx start

echo " >>> Update chkconfig to run nginx on reboot"
chkconfig --add nginx
chkconfig --levels 235 nginx on

echo " >>> Update chkconfig to run php-fpm on reboot"
chkconfig --add php-fpm
chkconfig --levels 235 php-fpm on

