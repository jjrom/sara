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
#CONFIG=config
WWW_USER=nginx:nginx
PWD=`pwd`
SRC_DIR=`pwd`
function showUsage {
    echo ""
    echo "   SARA - Sentinel Australia Regional Access Web client deployment"
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

echo " ==> Installing client under ${SARA_CLIENT_TARGET_DIR}"

# Install the npm packages
npm install --prefix ./sara.client/

# Generate the client configuration from config file
echo "============================================================================"
json -I -f sara.client/src/config.json -e 'this.restoServerUrl="'${SERVER_PROTOCOL}'://'${SARA_SERVER_URL}${SARA_SERVER_SUB}${SARA_SERVER_VERSION_ENDPOINT}'/"'
json -I -f sara.client/src/config.json -e 'this.contactEmail="'${CONTACT_EMAIL}'"'

# Run grunt
grunt --base sara.client/ --gruntfile sara.client/Gruntfile.js build

cp -a sara.client/dist/. ${SARA_CLIENT_TARGET_DIR}

echo " ==> Set ${SARA_CLIENT_TARGET_DIR} rights to ${WWW_USER}"
chown -R ${WWW_USER} ${SARA_CLIENT_TARGET_DIR}

echo " Done !"



