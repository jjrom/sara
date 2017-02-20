# SARA - Sentinel Australia Regional Access

## Description

## Installation

We suppose that the sources will be stored under $SARA_SRC

	export SARA_SRC=/root/sara

### Initialize sources repository

**These command should be launch to initialize the SARA sources (i.e. for an install from scratch)**

	# Clone repository to "sara" directory
    git clone https://github.com/jjrom/sara.git $SARA_SRC

    # Avoid to ask for password everytime you update the local repository
    cd $SARA_SRC
    git remote set-url origin git+ssh://git@github.com/jjrom/sara.git

    # Update resto
    git submodule init
    git submodule update



