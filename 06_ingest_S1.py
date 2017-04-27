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
restourl = config['SERVER_PROTOCOL'] + '://' + config['SARA_SERVER_URL'] + config['SARA_SERVER_SUB'] + config['SARA_SERVER_VERSION_ENDPOINT'] + '/collections/S1'
username = config['RESTO_ADMIN_USER']
password = config['RESTO_ADMIN_PASSWORD']

# Select XML metadata files to post
#  Input metadata is an XML file provided by Geoscience Australia
#
#   cat /g/data3/fj7/Copernicus/Sentinel-2/MSI/L1C/2015/2015-07/25S125E-30S130E/S2A_OPER_PRD_MSIL1C_PDMC_20160811T045047_R131_V20150712T013106_20150712T013241.xml
#  
#        <?xml version='1.0'?>
#        <AUSCOPHUB_SAFE_FILEDESCRIPTION>
#           <SATELLITE name='S1A' />
#           <CENTROID longitude='99.2799525844' latitude='-1.07725099673' />
#           <ESA_TILEOUTLINE_FOOTPRINT_WKT>
#              POLYGON (([...]))
#           </ESA_TILEOUTLINE_FOOTPRINT_WKT>
#           <ACQUISITION_TIME start_datetime_utc='2014-10-04 23:04:48.570950' stop_datetime_utc='2014-10-04 23:05:03.324225' />
#           <POLARISATION values='VH,VV' />
#           <SWATH values='IW' />
#           <ORBIT_NUMBERS relative='164' absolute='2686' />
#           <PASS direction='Descending' />
#           <ZIPFILE size_bytes='1005024846' md5_local='C372514F33A95DD0F5D38CCFC77E3E64' />
#        </AUSCOPHUB_SAFE_FILEDESCRIPTION>
#  
#
for productType in ['GRD', 'SLC']:
    for year in ['2014', '2015', '2016', '2017']:
        for month in ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']:

            files = glob.glob(config['DATA_ROOT_PATH'] + 'Sentinel-1/C-SAR/' + productType + '/' + year + '/' + year + '-' + month + '/*/*.xml')
            
            for metadataFile in files:

                # Read metadata XML
                tree = ET.parse(metadataFile)
                root = tree.getroot()

                # Add identifier from metadata file name
                IDENTIFIER = os.path.basename(metadataFile)[:-4]
                ET.SubElement(root, 'IDENTIFIER').text = IDENTIFIER

                # Add zip path from metadata path
                PATH = os.path.dirname(metadataFile).split('Sentinel-1')[1]
                ET.SubElement(root, 'PATH').text = PATH

                # Post updated metadata file to resto
                response=requests.post(restourl, data=ET.tostring(root), auth=(username, password))
            
