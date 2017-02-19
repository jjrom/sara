# GAUSS - Geoscience AUStralia Sentinel hub

## Description

## Installation

We suppose that the sources will be stored under $GAUSS_SRC

	export GAUSS_SRC=/root/gauss

### Initialize sources repository

**These command should be launch to initialize the GAUSS sources (i.e. for an install from scratch)**

	# Clone repository to "gauss" directory
    git clone https://github.com/jjrom/gauss.git $GAUSS_SRC

    # Avoid to ask for password everytime you update the local repository
    cd $GAUSS_SRC
    git remote set-url origin git+ssh://git@github.com/jjrom/gauss.git

    # Update resto
    git submodule init
    git submodule update



