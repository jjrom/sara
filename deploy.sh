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
WWW_USER=www-data:www-data
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
    echo "      -F | --force : force suppression of endpoint directory (i.e. ${SARA_TARGET_DIR}/${SARA_VERSION_ENDPOINT})"
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
SARA_ENDPOINT=${SARA_TARGET_DIR}${SARA_VERSION_ENDPOINT}

# Server installation
if [ "${TARGET}" == "server" ]
then

  if [ "${FORCE}" == "YES" ]
  then
    echo " ==> Suppress ${SARA_ENDPOINT}"
    rm -Rf ${SARA_ENDPOINT}
  fi

  mkdir -p ${SARA_TARGET_DIR}

  echo " ==> Deploy resto in ${SARA_ENDPOINT}"
  ${SRC_DIR}/resto/_install/deploy.sh -s ${SRC_DIR}/resto -t ${SARA_ENDPOINT}

  echo " ==> Use ${CONFIG} file to generate ${SARA_ENDPOINT}/include/config.php";
  ${SRC_DIR}/sara.server/generate_config.sh -C ${CONFIG} > ${SARA_ENDPOINT}/include/config.php

  echo " ==> Set ${SRC_DIR} rights to ${WWW_USER}"
  chown -R ${WWW_USER} ${SARA_ENDPOINT}

  echo " Done !"
  exit 0

fi

if [ "${TARGET}" == "client" ]
then

  echo " ==> TODO Geomatys"

  exit 0

fi
