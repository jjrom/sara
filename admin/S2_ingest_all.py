#!/usr/bin/env python

import os
import requests
import glob
import xml.etree.ElementTree as ET

# resto S2 collection url
restourl = 'http://localhost/sara.server/1.0/collections/S2'
username = 'admin'
password = 'admin'
metadataPaths = '/g/data3/fj7/Copernicus/Sentinel-2/MSI/L1C/*/*/*/*.xml'

# Log
log = '/tmp/S2_ingest_all.log'
loghand = open(log,'w')

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
files = glob.glob(metadataPaths)
print >> loghand, "# of files", len(files)

nfail=0
for metadataFile in files:

    # Read metadata XML
    tree = ET.parse(metadataFile)
    root = tree.getroot()

    # Add identifier from metadata file name
    IDENTIFIER = os.path.basename(metadataFile)[:-4]
    ET.SubElement(root, 'IDENTIFIER').text = IDENTIFIER

    # Add zip path from metadata path
    PATH = os.path.dirname(metadataFile).split('Sentinel-2')[1]
    ET.SubElement(root, 'PATH').text = PATH

    # Post updated metadata file to resto
    response=requests.post(restourl, data=ET.tostring(root), auth=(username, password))
    if '200' in response.text:
        print >>loghand, zipfilename
        print >>loghand, response
        nfail+=1
    else:
        print response.text

    #xml.append(ET.fromstring('<IDENTIFIER>12345</IDENTIFIER>'))
    #print xml
    #del mf
    # Load zip file
    #zf = zipfile.ZipFile(zipfilename, 'r')
    #filenames = [zi.filename for zi in zf.infolist()]
    #safeDirName = [fn for fn in filenames if fn.endswith('.SAFE/')][0]
    #bn = safeDirName.replace('.SAFE/', '')
    ## Find meta file
    ## The meta filename is, rather ridiculously, named something slightly different
    ## inside the SAFE directory, so we have to construct that name.
    #metafilename = bn.replace('PRD', 'MTD').replace('MSIL1C', 'SAFL1C') + ".xml"
    #fullmetafilename = safeDirName + metafilename
    #if fullmetafilename not in filenames:
    #    # We have a new format package, in which the meta filename is constant.
    #    fullmetafilename = safeDirName + 'MTD_MSIL1C.xml'
    #mf = zf.open(fullmetafilename)
    #xmlStr = mf.read()
    #del mf

    ## Post request
    #response=requests.post(restourl, data=xmlStr, auth=(username, password))
    #if '200' in response.text:
    #    print >>loghand, zipfilename
    #    print >>loghand, response
    #    nfail+=1

print >>loghand, "# of failed post:", nfail
loghand.close()
