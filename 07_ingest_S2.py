#!/usr/bin/env python

import sys
import os
import requests
import glob
import xml.etree.ElementTree as ET

# First argument is mandatory - config file
if len(sys.argv) != 2:
    print "Usage: " + sys.argv[0] + " <path to config file>"
    sys.exit()

config = {}
with open(sys.argv[1]) as configFile:
    for line in configFile:
        name, var = line.partition("=")[::2]
        config[name.strip()] = var.rstrip()

# resto S2 collection url
restourl = config['SERVER_PROTOCOL'] + '://' + config['SARA_SERVER_URL'] + config['SARA_SERVER_SUB'] + config['SARA_SERVER_VERSION_ENDPOINT'] + '/collections/S2'
username = config['RESTO_ADMIN_USER']
password = config['RESTO_ADMIN_PASSWORD']

# Select XML metadata files to post
#  Input metadata is an XML file provided by Geoscience Australia
#
#   cat /g/data3/fj7/Copernicus/Sentinel-2/MSI/L1C/2015/2015-07/25S125E-30S130E/S2A_OPER_PRD_MSIL1C_PDMC_20160811T045047_R131_V20150712T013106_20150712T013241.xml
#  
#        <?xml version='1.0'?>
#        <AUSCOPHUB_SAFE_FILEDESCRIPTION>
#           <SATELLITE name='S2A' />
#           <CENTROID longitude='129.918064547' latitude='-25.4116351642' />
#           <ESA_CLOUD_COVER percentage='0' />
#           <ESA_TILEOUTLINE_FOOTPRINT_WKT>
#              POLYGON (([...]))
#           </ESA_TILEOUTLINE_FOOTPRINT_WKT>
#           <ACQUISITION_TIME start_datetime_utc='2015-07-12 01:31:06.027000' stop_datetime_utc='2015-07-12 01:32:41.266000' />
#           <ESA_PROCESSING software_version='02.04' processingtime_utc='2016-08-11 04:50:47.000455'/>
#           <ORBIT_NUMBERS relative='131' />
#           <ZIPFILE size_bytes='4401842761' md5_local='0681B93E435EFCD324EE18134FE87B6F' />
#        </AUSCOPHUB_SAFE_FILEDESCRIPTION>
#  
# 
for year in ['2015', '2016', '2017']:
    for month in ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']:

        files = glob.glob(config['DATA_ROOT_PATH'] + 'Sentinel-2/MSI/L1C/' + year + '/' + year + '-' + month + '/*/*.xml')
        
        for metadataFile in files:
            with open(metadataFile) as mf:                                                       
                response = requests.post(restourl, data=mf.read(), auth=(username, password))    
            print metadataFile, response.text                                                    
            
