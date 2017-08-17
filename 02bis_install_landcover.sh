#! /bin/bash
#
# SARA - Sentinel Australia Regional Access
# 
# itag landcover installation script
#
# Author : Jérôme Gasperi (https://github.com/jjrom)
# Date   : 2017.07.28
#
#
CONFIG=config
PWD=`pwd`

function showUsage {
    echo ""
    echo "   SARA - Sentinel Australia Regional Access itag landcover installation"
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

LANDCOVER_DATA=${ITAG_DIR}/data
LANDCOVER_SQL="2016.11.09-itag_landcover_curated.sql"

if [ -d "${LANDCOVER_DATA}" ];
then
  echo "${LANDCOVER_DATA} exits - skipping creation"
else
  echo "Create ${LANDCOVER_DATA} directory"
  mkdir -p ${LANDCOVER_DATA}
fi


cd ${LANDCOVER_DATA}
if [ -f "${LANDCOVER_SQL}" ];
then
  echo "";
  echo "====> Using local landcover data";
  echo "";
else
  echo "";
  echo "====> Retrieve landcover data from internet";
  echo "";
  wget -O ${LANDCOVER_SQL}.tgz "https://www.dropbox.com/s/ceoxg0lagag3fum/${LANDCOVER_SQL}.tgz?dl=0"
  tar -xvzf ${LANDCOVER_SQL}.tgz
fi

psql -d itag -U ${DB_SUPERUSER} << EOF
DELETE FROM datasources.landcover;
EOF

psql -d itag -U ${DB_SUPERUSER} -f ${LANDCOVER_SQL}

psql -d itag -U ${DB_SUPERUSER} << EOF
ALTER TABLE landcover SET SCHEMA datasources;
GRANT SELECT on datasources.landcover to itag;
GRANT SELECT,UPDATE ON datasources.landcover_ogc_fid_seq TO itag;
EOF

cd ${PWD}

echo "====> End of itag landcover installation";

