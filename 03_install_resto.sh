#! /bin/bash
#
# SARA - Sentinel Australia Regional Access
# 
# resto installation script
#
# Author : Jérôme Gasperi (https://github.com/jjrom)
# Date   : 2017.02.19
#
#
CONFIG=config
FORCE=NO
WWW_USER=www-data:www-data
SRC_DIR=`pwd`

function showUsage {
    echo ""
    echo "   SARA - Sentinel Australia Regional Access resto installation"
    echo ""
    echo "   Usage $0 [options]"
    echo ""
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

# Source config file
. ${CONFIG}

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

echo "====> Update database for Sentinel-3"
psql -U ${DB_SUPERUSER} -d ${SARA_DB_NAME} << EOF
INSERT INTO ${SARA_DB_SCHEMA_NAME}.keywords (name, value, lang, type) VALUES ('s3', 'S3A|S3B','**', 'platform');
INSERT INTO ${SARA_DB_SCHEMA_NAME}.keywords (name, value, lang, type) VALUES ('s3A', 'S3A','**', 'platform');
INSERT INTO ${SARA_DB_SCHEMA_NAME}.keywords (name, value, lang, type) VALUES ('s3B', 'S3B','**', 'platform');
INSERT INTO ${SARA_DB_SCHEMA_NAME}.keywords (name, value, lang, type) VALUES ('sentinel3', 'S3A|S3B','**', 'platform');
INSERT INTO ${SARA_DB_SCHEMA_NAME}.keywords (name, value, lang, type) VALUES ('sentinel-3', 'S3A|S3B','**', 'platform');
EOF
if [ "${USE_BCRYPT}" == "YES" ]
then
  echo "====> Create admin user ${RESTO_ADMIN_USER} **WITH** bcrypt hashing"
  ${SRC_DIR}/resto/_install/createAdminUser.sh -u ${RESTO_ADMIN_USER} -p ${RESTO_ADMIN_PASSWORD} -d ${SARA_DB_NAME} -S ${SARA_DB_SCHEMA_NAME} -s ${DB_SUPERUSER} -B
else
  echo "====> Create admin user ${RESTO_ADMIN_USER} **WITHOUT** bcrypt hashing"
  ${SRC_DIR}/resto/_install/createAdminUser.sh -u ${RESTO_ADMIN_USER} -p ${RESTO_ADMIN_PASSWORD} -d ${SARA_DB_NAME} -S ${SARA_DB_SCHEMA_NAME} -s ${DB_SUPERUSER}
fi

