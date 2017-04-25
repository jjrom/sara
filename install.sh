#! /bin/bash
#
# SARA - Sentinel Australia Regional Access
# 
# Installation script
#
# Author : Jérôme Gasperi (https://github.com/jjrom)
# Date   : 2017.02.19
#
#
CONFIG=config
FORCE=NO
WWW_USER=www-data:www-data
PWD=`pwd`
SRC_DIR=`pwd`

function showUsage {
    echo ""
    echo "   SARA - Sentinel Australia Regional Access installation"
    echo ""
    echo "   Usage $0 [options]"
    echo ""
    echo "      -t | --target : target installation - 'itag' or 'resto'"
    echo "      -C | --config : local config file containing parameters to build config.php file"
    echo "      -F | --force : force installation of database"
    echo "      -h | --help : show this help"
    echo ""
    echo ""
}

# Parsing arguments
while [[ $# > 0 ]]
do
	key="$1"

	case $key in
        -t|--target)
            TARGET="$2"
            shift # past argument
            ;;
        -C|--config)
            CONFIG="$2"
            shift # past argument
            ;;
        -F|--force)
            FORCE=YES
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

if [ "${TARGET}" == "" ]
then
    showUsage
    echo ""
    echo "   ** Missing mandatory target - should be 'itag' or 'resto' ** ";
    echo ""
    exit 0
fi

# Source config file
. ${CONFIG}


# Gauss database installation
if [ "${TARGET}" == "resto" ]
then

  echo "###########################"
  echo "# Configure nginx   "
  echo "###########################"
  echo "   ==> Create configuration file /etc/nginx/default.d/sara.conf"
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

  echo "###########################"
  echo "# Install resto database   "
  echo "###########################"

  echo "====> Install ${SARA_DB_NAME} database"
  if [ "${FORCE}" == "YES" ]
  then
    ${SRC_DIR}/resto/_install/installDB.sh -d ${SARA_DB_NAME} -S ${SARA_DB_SCHEMA_NAME} -u ${RESTO_USER} -p ${RESTO_PASSWORD} -s ${DB_SUPERUSER} -F
  else
    ${SRC_DIR}/resto/_install/installDB.sh -d ${SARA_DB_NAME} -S ${SARA_DB_SCHEMA_NAME} -u ${RESTO_USER} -p ${RESTO_PASSWORD} -s ${DB_SUPERUSER}
  fi
  if [ "${USE_BCRYPT}" == "YES" ]
  then
    echo "====> Create admin user ${RESTO_ADMIN_USER} **WITH** bcrypt hashing"
    ${SRC_DIR}/resto/_install/createAdminUser.sh -u ${RESTO_ADMIN_USER} -p ${RESTO_ADMIN_PASSWORD} -d ${SARA_DB_NAME} -S ${SARA_DB_SCHEMA_NAME} -s ${DB_SUPERUSER} -B
  else
    echo "====> Create admin user ${RESTO_ADMIN_USER} **WITHOUT** bcrypt hashing"
    ${SRC_DIR}/resto/_install/createAdminUser.sh -u ${RESTO_ADMIN_USER} -p ${RESTO_ADMIN_PASSWORD} -d ${SARA_DB_NAME} -S ${SARA_DB_SCHEMA_NAME} -s ${DB_SUPERUSER}
  fi
fi


if [ "${TARGET}" == "itag" ]
then

  # Paths are based on $SRCDIR
  ITAG_DATA=${ITAG_DIR}/data
  LANDCOVER_DATA=${ITAG_DIR}/landcover
  ITAG_HOME=${ITAG_DIR}/itag

  echo "###########################"
  echo "# Install iTag database    "
  echo "###########################"

  if [ -d "${ITAG_DIR}" ];
  then
      echo "${ITAG_DIR} exits - skipping creation"
  else
      echo "Create ${ITAG_DIR} directory"
      mkdir -p ${ITAG_DIR}  
  fi

  if [ -d "${ITAG_DATA}" ];
  then
      echo "";
      echo "====> Using local iTag data";
      echo "";
  else 
      echo "";
      echo "====> Retrieve iTag data from internet";
      echo "";
      mkdir ${ITAG_DATA}
      cd ${ITAG_DATA}

      wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_coastline.zip
      unzip ne_10m_coastline.zip

      wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_0_countries.zip
      unzip ne_10m_admin_0_countries.zip

      wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_1_states_provinces.zip
      unzip ne_10m_admin_1_states_provinces.zip

      wget http://download.geonames.org/export/dump/allCountries.zip
      wget http://download.geonames.org/export/dump/alternateNames.zip
      unzip allCountries.zip
      unzip alternateNames.zip

      wget http://www.colorado.edu/geography/foote/maps/assign/hotspots/download/hotspots.zip
      unzip hotspots.zip

      wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_glaciated_areas.zip
      unzip ne_10m_glaciated_areas.zip

      wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_rivers_lake_centerlines.zip
      unzip ne_10m_rivers_lake_centerlines.zip
      
      wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_geography_marine_polys.zip
      unzip ne_10m_geography_marine_polys.zip
  fi

  # Get iTag from github
  if [ -d "${ITAG_HOME}" ];
  then
      echo "";
      echo "====> Using local iTag sources";
      echo "";
  else
      echo "";
      echo "====> Retrieve iTag sources from internet";
      echo "";
      cd $ITAG_DIR
      git clone https://github.com/jjrom/itag.git
  fi

  # Create database
  $ITAG_HOME/_install/installDB.sh -F -p ${ITAG_PASSWORD} -s ${DB_SUPERUSER}

  # General datasources
  $ITAG_HOME/_install/installDatasources.sh -F -D ${ITAG_DATA} -s ${DB_SUPERUSER}

  # Gazetteer
  #$ITAG_HOME/_install/installGazetteerDB.sh -F -D ${ITAG_DATA} -s ${DB_SUPERUSER}

fi
