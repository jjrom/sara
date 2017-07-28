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

if [ -d "${ITAG_DIR}" ];
then
  echo "${ITAG_DIR} exits - skipping creation"
else
  echo "Create ${ITAG_DIR} directory"
  mkdir -p ${ITAG_DIR}  
fi

cd ${ITAG_DIR}
wget -O 2016.11.09-itag_landcover_curated.sql.tgz "https://www.dropbox.com/s/ceoxg0lagag3fum/2016.11.09-itag_landcover_curated.sql.tgz?dl=0"
tar -xvzf 2016.11.09-itag_landcover_curated.sql.tgz

psql -d itag -U ${DB_SUPERUSER} << EOF
DELETE FROM datasources.landcover;
EOF

psql -d itag -U ${DB_SUPERUSER} -f 2016.11.09-itag_landcover_curated.sql

psql -d itag -U ${DB_SUPERUSER} << EOF
ALTER TABLE landcover SET SCHEMA datasources;
GRANT SELECT on datasources.landcover to itag;
GRANT SELECT,UPDATE ON datasources.landcover_ogc_fid_seq TO itag;
EOF

cd ${PWD}

echo "====> End of itag landcover installation";

