#! /bin/bash
#
# SARA - Sentinel Australia Regional Access
# 
# itag installation script
#
# Author : Jérôme Gasperi (https://github.com/jjrom)
# Date   : 2017.02.19
#
#
CONFIG=config
PWD=`pwd`
SRC_DIR=`pwd`

function showUsage {
    echo ""
    echo "   SARA - Sentinel Australia Regional Access itag installation"
    echo ""
    echo "   Usage $0 [options]"
    echo ""
    echo "      -C | --config : local config file containing parameters to build config.php file"
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

# Paths are based on $SRCDIR
ITAG_DATA=${ITAG_DIR}/data
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

  cd ${PWD}

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
  cd ${PWD}
fi

# Create database
$ITAG_HOME/_install/installDB.sh -F -p ${ITAG_PASSWORD} -s ${DB_SUPERUSER}

# General datasources
$ITAG_HOME/_install/installDatasources.sh -F -D ${ITAG_DATA} -s ${DB_SUPERUSER}

# Gazetteer
$ITAG_HOME/_install/installGazetteerDB.sh -F -D ${ITAG_DATA} -s ${DB_SUPERUSER}

echo "====> End of itag installation";

