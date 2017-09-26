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
restourl = config['SERVER_PROTOCOL'] + '://' + config['SARA_SERVER_URL'] + config['SARA_SERVER_SUB'] + config['SARA_SERVER_VERSION_ENDPOINT'] + '/collections/S3'
username = config['RESTO_ADMIN_USER']
password = config['RESTO_ADMIN_PASSWORD']

# Select XML metadata files to post
#  Input metadata is an XML file provided by Geoscience Australia
#
#   cat /g/data3/fj7/Copernicus/Sentinel-3/OLCI/OL_1_EFR___/2016/2016-10/2016-10-18/S3A_OL_1_EFR____20161018T192542_20161018T192842_20161104T093300_0180_010_056_3239_SVL_O_NR_002.xml
#  
#        <?xml version='1.0'?>
#        <AUSCOPHUB_SAFE_FILEDESCRIPTION>
#           <SATELLITE name='S3A' />
#           <CENTROID longitude='-147.526994259' latitude='-17.1798484094' />
#           <ESA_TILEOUTLINE_FOOTPRINT_WKT>
#              POLYGON (([...]))
#           </ESA_TILEOUTLINE_FOOTPRINT_WKT>
#           <ACQUISITION_TIME start_datetime_utc='2016-10-18 19:25:42.115909' stop_datetime_utc='2016-10-18 19:28:42.115909' />
#           <ESA_PROCESSING processingtime_utc='2016-11-04 09:33:00' baselinecollection='002'/>
#           <POLARISATION values='VH,VV' />
#           <SWATH values='IW' />
#           <ORBIT_NUMBERS relative='56' frame='3239' absolute='3494' cycle='10' />
#           <PASS direction='Descending' />
#           <ZIPFILE size_bytes='647555424' md5_local='F60B0C063980B9393F8A766F11745716' />
#        </AUSCOPHUB_SAFE_FILEDESCRIPTION>
#  
#
for instrument in ['OLCI', 'SLSTR', 'SRAL']:
    for productType in ['OL_1_EFR___', 'OL_1_ERR___', 'OL_2_LFR___', 'OL_2_LRR___', 'OL_2_WFR___', 'OL_2_WRR___',
                        'SL_1_RBT___', 'SL_2_LST___', 'SL_2_WST__', 
                        'SR_1_SRA___', 'SR_1_SRA_A_', 'SR_1_SRA_BS', 'SR_2_LAN___', 'SR_2_WAT___']:
        for year in ['2014', '2015', '2016', '2017']:
            for month in ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']:

                files = glob.glob(config['DATA_ROOT_PATH'] + 'Sentinel-3/' + instrument + '/' + productType + '/' + year + '/' + year + '-' + month + '/*/*.xml')
                
                for metadataFile in files:
                    with open(metadataFile) as mf:                                                       
                        response = requests.post(restourl, data=mf.read(), auth=(username, password))    
                    print metadataFile, response.text                                                    
