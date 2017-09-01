# SARA - Sentinel Australia Regional Access

## Description

The Sentinel Australia Regional Access (SARA) is the data access portal for Australian Copernicus Regional Data Hub. It provides free access to data from all Sentinel satellites for the South-East Asia and South Pacific region.
This repository contains the codebase for SARA, including customized installations of resto, itag and rocket.


## Installation

Follow instructions below to install SARA on a CentOS 6 VM.

We suppose that the sources will be stored under $SARA_SRC

    mkdir -v /root/sara/src
    export SARA_SRC=/root/sara/src/sara

### Initialize sources repository

**These command should be executed to initialize the SARA sources (i.e. for an installation from scratch)**
**These command needs access to the https://github.com/jjrom/sara.git directory**

    # Clone repository to "sara" directory
    git clone https://github.com/jjrom/sara.git $SARA_SRC

    # Avoid to ask for password everytime you update the local repository
    cd $SARA_SRC
    git remote set-url origin git+ssh://git@github.com/jjrom/sara.git

    # Update resto
    git submodule init
    git submodule update

### Prepare configuration file

The most important file is ${SARA_SRC}/config - it contains all the configuration parameters as a key/value pair form.


### Platform initialization

**[IMPORTANT] These commands are run only once**

    # Install CentOS packages and configure postgres/nginx services
    ./01_install_packages.sh -C config

    # Install itag - [WARNING] this can take quite a long time!
    ./02_install_itag.sh -C config  

    # Install itag landcover - [WARNING] this can take quite a long time!
    ./02bis_install_landcover.sh -C config  

    # Install resto
    ./03_install_resto.sh -C config 

### Server and client deployment

**[IMPORTANT] These commands should be run each time a new version is delivered or the configuration changes**

    # Deploy server
    ./04_deploy_server.sh -C config  

    # Deploy client
    ./05_deploy_client.sh -C config 

## Ingest Sentinels products

**[IMPORTANT] These commands should be run only once to initialize database with existing Sentinels products**

    # Ingest Sentinel-1 products
    ./06_ingest_S1.py config  

    # Ingest Sentinel-2 products
    ./07_ingest_S2.py config  

    # Ingest Sentinel-3 products
    ./08_ingest_S3.py config  

## FAQ

### How to delete a collection ?

Only empty collection can be deleted to avoid accidental deletion.
[Note] Deletion can be done "on the fly" i.e. no need to stop server - modification are propagated immediately

    # Delete Sentinel-1 collection - must be empty !
    curl -X DELETE http://admin:admin@localhost/sara.server/1.0/collections/S1

    # Delete Sentinel-2 collection - must be empty !
    curl -X DELETE http://admin:admin@localhost/sara.server/1.0/collections/S2

    # Delete Sentinel-3 collection - must be empty !
    curl -X DELETE http://admin:admin@localhost/sara.server/1.0/collections/S3

### How to update collection description

This command is useful if you change the propertiesMapping in JSON collection descriptor file.
[Note] Update can be done "on the fly" i.e. no need to stop server - modification are propagated immediately

    # Update Sentinel-1 collection
    curl -X PUT -H "Content-Type: application/json" -d @/path/to/new/S1.json http://admin:admin@localhost/sara.server/1.0/collections/S1

    # Update Sentinel-2 collection
    curl -X PUT -H "Content-Type: application/json" -d @/path/to/new/S1.json http://admin:admin@localhost/sara.server/1.0/collections/S2

    # Update Sentinel-3 collection
    curl -X PUT -H "Content-Type: application/json" -d @/path/to/new/S1.json http://admin:admin@localhost/sara.server/1.0/collections/S3
 