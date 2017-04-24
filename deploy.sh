#! /bin/bash
#
# SARA - Sentinel Australia Regional Access
# 
# Deployment script
#
# Author : Jérôme Gasperi (https://github.com/jjrom)
# Date   : 2017.02.19
#
#
CONFIG=config
FORCE=NO
WWW_USER=nginx:nginx
PWD=`pwd`
SRC_DIR=`pwd`
function showUsage {
    echo ""
    echo "   SARA - Sentinel Australia Regional Access deployment"
    echo ""
    echo "   Usage $0 [options]"
    echo ""
    echo "      -t | --target : one of 'server' or 'client'"
    echo "      -C | --config : local config file containing parameters to build config.php file"
    echo "      -F | --force : force suppression of endpoint directory (i.e. ${SARA_SERVER_TARGET_DIR}/${SARA_SERVER_VERSION_ENDPOINT} and ${SARA_CLIENT_TARGET_DIR})"
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
    echo "   ** Missing mandatory target ** ";
    echo ""
    exit 0
fi

# Source config file
. ${CONFIG}

# Set endpoints
SARA_SERVER_ENDPOINT=${SARA_SERVER_TARGET_DIR}${SARA_SERVER_VERSION_ENDPOINT}

# Server installation
if [ "${TARGET}" == "server" ]
then

  if [ "${FORCE}" == "YES" ]
  then
    echo " ==> Suppress ${SARA_SERVER_ENDPOINT}"
    rm -Rf ${SARA_SERVER_ENDPOINT}
  fi

  mkdir -p ${SARA_SERVER_TARGET_DIR}

  echo " ==> Deploy resto in ${SARA_SERVER_ENDPOINT}"
  ${SRC_DIR}/resto/_install/deploy.sh -s ${SRC_DIR}/resto -t ${SARA_SERVER_ENDPOINT}

  echo " ==> Copy models under ${SARA_SERVER_ENDPOINT}/include/resto/Models"
  cp -R ${SRC_DIR}/sara.server/Models/*.php ${SARA_SERVER_ENDPOINT}/include/resto/Models/

  echo " ==> Use ${CONFIG} file to generate ${SARA_SERVER_ENDPOINT}/include/config.php";
  ${SRC_DIR}/sara.server/generate_config.sh -C ${CONFIG} > ${SARA_SERVER_ENDPOINT}/include/config.php

  echo " ==> Set ${SRC_DIR} rights to ${WWW_USER}"
  chown -R ${WWW_USER} ${SARA_SERVER_ENDPOINT}

  echo " ==> Install S1 collection"
  curl -X POST -H "Content-Type: application/json" -d @${SRC_DIR}/sara.server/collections/S1.json ${SERVER_PROTOCOL}://${RESTO_ADMIN_USER}:${RESTO_ADMIN_PASSWORD}@${SARA_SERVER_URL}${SARA_VERSION_ENDPOINT}/collections
  echo ""

  echo " ==> Install S2 collection"
  curl -X POST -H "Content-Type: application/json" -d @${SRC_DIR}/sara.server/collections/S2.json ${SERVER_PROTOCOL}://${RESTO_ADMIN_USER}:${RESTO_ADMIN_PASSWORD}@${SARA_SERVER_URL}${SARA_VERSION_ENDPOINT}/collections
  echo ""

  echo " ==> Install S3 collection"
  curl -X POST -H "Content-Type: application/json" -d @${SRC_DIR}/sara.server/collections/S3.json ${SERVER_PROTOCOL}://${RESTO_ADMIN_USER}:${RESTO_ADMIN_PASSWORD}@${SARA_SERVER_URL}${SARA_VERSION_ENDPOINT}/collections
  echo ""
  
  echo " Done !"
  exit 0

fi

if [ "${TARGET}" == "client" ]
then

  echo " ==> TODO Geomatys install under ${SARA_CLIENT_TARGET_DIR}"

  # Install nodeJs in Centos
     yum install -y gcc-c++ make
     curl -sL https://rpm.nodesource.com/setup_6.x | sudo -E bash -
     yum install nodejs

     # Install grunt
    npm install -g grunt-cli

    # Install the npm packages
     npm install --prefix ./rocket2/

    # Run grunt
    grunt --base rocket2/ --gruntfile rocket2/Gruntfile.js build

    cp -a /rocket2/dist/. ${SARA_CLIENT_TARGET_DIR}

  exit 0

fi
