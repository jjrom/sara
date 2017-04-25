#!/bin/bash
function showUsage {
    echo ""
    echo "   resto config.php generator for SARA - Sentinel Australia Regional Access"
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

. ${CONFIG}
cat << EOF
<?php
return array(
    'general' => array(
        'title' => 'sara',
        'rootEndpoint' => '${SARA_SERVER_SUB}${SARA_SERVER_VERSION_ENDPOINT}',
        'languages' => array('en'),
        'osDescription' => array(
            'en' => array(
                'ShortName' => 'SARA',
                'LongName' => 'Sentinel Australia Regional Access search service',
                'Description' => 'Geoscience Australia Sentinel hub endpoint to Sentinel-1, Sentinel-2 and Sentinel-3 data',
                'Tags' => 'geoscience australia, sentinel',
                'Developer' => 'Geoscience Australia',
                'Contact' => '${CONTACT_EMAIL}',
                'Query' => 'australia 2017',
                'Attribution' => 'Geoscience Australia. Copyright 2017, All Rights Reserved'
            )
        ),
        'debug' => false,
        'timezone' => 'Europe/Paris',
        'protocol' => 'https',
        'storeQuery' => true,
        'sharedLinkDuration' => 86400,
        'tokenDuration' => 604800,
        'passphrase' => '${PASSPHRASE}',
        'tokenEncryptions' => array('HS256','HS512','HS384','RS256'),
        'resetPasswordUrl' => '${CLIENT_ENDPOINT_RESET_PASSWORD}',
        'htmlSearchUrl' => '${CLIENT_ENDPOINT_HTML_SEARCH_URL}',
        'uploadDirectory' => '${UPLOAD_DIRECTORY}',
        'streamMethod' => 'nginx',
        'userAutoValidation' => true,
        'corsWhiteList' => array(
            'null',
            'localhost',
            'localhost:8100'
        )
    ),
    'database' => array(
        'driver' => 'PostgreSQL',
        'dbname' => '${SARA_DB_NAME}',
        'port' => 5432,
        'resultsPerPage' => 20,
      	'sortKeys' => array('startdate'),
      	'hashing' => 'sha1',
        'user' => '${RESTO_USER}',
        'password' => '${RESTO_PASSWORD}'
    ),
    'mail' => array(
        'senderName' => '${CONTACT_NAME}',
        'senderEmail' => '${CONTACT_EMAIL}',
	      'smtp' => array(
            'activate' => true,
            'host' => '${SMTP_HOST}',
            'port' => ${SMTP_PORT},
            'secure' => '${SMTP_SECURE_PROTOCOL}', // one of 'ssl' or 'tls'
            'debug' => 0,
            'auth' => array(
                'user' => '${SMTP_USER}',
                'password' => '${SMTP_PASSWORD}'
            )
        ),
        'accountActivation' => array(
            'en' => array(
                'subject' => '[{a:1}] Activation code',
                'message' => 'Hi,<br>You have registered an account to {a:1} application<br><br>To validate this account, <a href="{a:2}">click this link</a> <br><br>Regards<br><br>{a:1} team"'
            )
        ),
        'resetPassword' => array(
            'en' => array(
                'subject' => '[{a:1}] Reset password',
                'message' => 'Hi,<br><br>You ask to reset your password for the {a:1} application<br><br>To reset your password, <a href="{a:2}">click this link</a> <br><br>Regards<br><br>{a:1} team'
            )
        )
    ),
    'modules' => array(
        'QueryAnalyzer' => array(
            'activate' => true,
            'route' => 'api/query/analyze',
            'options' => array(
                'minimalQuantity' => 25
            )
        ),
        'Gazetteer' => array(
            'activate' => true,
            'route' => 'api/gazetteer/search',
            'options' => array(
                'database' => array(
                    'dbname' => 'itag',
                    //'host' => 'localhost',
                    'user' => '${ITAG_USER}',
                    'password' => '${ITAG_PASSWORD}'
                )
            )
        ),
        'Tag' => array(
            'activate' => true,
            'route' => 'api/tag',
            'options' => array(
                'iTag' => array(
                    'database' => array(
                        'dbname' => 'itag',
                        //'host' => 'localhost',
                        'user' => '${ITAG_USER}',
                        'password' => '${ITAG_PASSWORD}'
                    ),
                    'taggers' => array(
                        'Political' => array()
                    )
                )
            )
        )
    )
);
EOF
