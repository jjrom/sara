<?php

/**
 * resto Sentinel-2 single tile model .
 * 
 * Input metadata is an XML file provided by Geoscience Australia modified by python script
 * to add IDENTIFIER and PATH elements
 *
 *  cat /g/data3/fj7/Copernicus/Sentinel-2/MSI/L1C/2015/2015-07/25S125E-30S130E/S2A_OPER_PRD_MSIL1C_PDMC_20160811T045047_R131_V20150712T013106_20150712T013241.xml
 *  
 *         <?xml version='1.0'?>
 *         <AUSCOPHUB_SAFE_FILEDESCRIPTION>
 *         <SATELLITE name='S2A' />
 *        <CENTROID longitude='129.918064547' latitude='-25.4116351642' />
 *         <ESA_CLOUD_COVER percentage='0' />
 *         <ESA_TILEOUTLINE_FOOTPRINT_WKT>
 *           POLYGON (([...]))
 *         </ESA_TILEOUTLINE_FOOTPRINT_WKT>
 *         <ACQUISITION_TIME start_datetime_utc='2015-07-12 01:31:06.027000' stop_datetime_utc='2015-07-12 01:32:41.266000' />
 *         <ESA_PROCESSING software_version='02.04' processingtime_utc='2016-08-11 04:50:47.000455'/>
 *         <ORBIT_NUMBERS relative='131' />
 *         <ZIPFILE size_bytes='4401842761' md5_local='0681B93E435EFCD324EE18134FE87B6F' />
 *         <!-- Last elements added by python script -->
 *         <IDENTIFIER>S2A_OPER_PRD_MSIL1C_PDMC_20160811T045047_R131_V20150712T013106_20150712T013241</IDENTIFIER>
 *         <PATH>/MSI/L1C/2015/2015-07/25S125E-30S130E</PATH>
 *       </AUSCOPHUB_SAFE_FILEDESCRIPTION>
 * 
 */
class RestoModel_S2 extends RestoModel {

    public $extendedProperties = array(
        'softwareVersion' => array(
            'name' => 'softwareversion',
            'type' => 'TEXT'
        ),
        'processingTime' => array(
            'name' => 'processingtime',
            'type' => 'TIMESTAMP'
        ),
        'path' => array(
            'name' => 'path',
            'type' => 'TEXT'
        )
    );

    /**
     * Constructor
     * 
     * @param RestoContext $context : Resto context
     * @param RestoContext $user : Resto user
     */
    public function __construct() {
        parent::__construct();
    }

    /**
     * Add feature to the {collection}.features table following the class model
     * 
     * @param array $data : array (MUST BE GeoJSON in abstract Model)
     * @param string $collectionName : collection name
     */
    public function storeFeature($data, $collectionName) {
        return parent::storeFeature($this->parse(join('',$data)), $collectionName);
    }

    /**
     * Update feature within {collection}.features table following the class model
     *
     * @param array $data : array (MUST BE GeoJSON in abstract Model)
     * @param string $featureIdentifier : the id of the feature (not obligatory)
     * @param string $featureTitle : the title of the feature (not obligatory)
     * @param RestoCollection $collection
     *
     */
    public function updateFeature($feature, $data) {
        return parent::updateFeature($feature, $this->parse(join('',$data)));
    }

    /**
     * Generate the absolute path to zip product
     *
     * @param $properties
     * @return string
     */
    public function generateResourcePath($properties) {
        $resource_path = $this->config['general']['rootPaths']['resource_path'];
        if (isset($resource_path)) {
            if (isset($properties['startDate'])) {
                $dateStr = date_format(date_create($properties['startDate']),'Ymd');
                return $resource_path . '/' . $dateStr . '/' . $properties['resource'];
            } else {
                return $resource_path . '/' . $properties['resource'];
            }
        } else {
            return $properties['resource'];
        }
    }

    /**
     * Generate the dynamic relative path to quicklook
     *
     * @param $properties
     * @return string relative path in the form of YYYYMMdd/quicklook_filename with YYYYMMdd is the formated startDate parameter
     */
   public function generateQuicklookPath($properties) {
        if (isset($properties['startDate'])) {
            $dateStr = date_format(date_create($properties['startDate']),'Ymd');
            return $dateStr . '/' . $properties['quicklook'];
        } else {
            return $properties['quicklook'];
        }
    }

    /**
     * Generate the dynamic relative path to thumbnail
     *
     * @param $properties
     * @return string relative path in the form of YYYYMMdd/thumbnail_filename with YYYYMMdd is the formated startDate parameter
     */
    public function generateThumbnailPath($properties) {
        if (isset($properties['startDate'])) {
            $dateStr = date_format(date_create($properties['startDate']),'Ymd');
            return $dateStr . '/' . $properties['thumbnail'];
        } else {
            return $properties['thumbnail'];
        }
    }
    
    /**
     * Create JSON feature from xml string
     * 
     * @param {String} $xml : $xml string
     */
    private function parse($xml) {
        
        $dom = new DOMDocument();
        $dom->loadXML(rawurldecode($xml));
        
        /*
         * Computed from path
         */
        $path = $dom->getElementsByTagName('PATH')->item(0)->nodeValue;
        $explodedPath = explode('/', $path);
        $instrument = $explodedPath[0];
        $processingLevel = $explodedPath[1];
        $productType = 'S2' . $explodedPath[1] . substr($processingLevel, 1);
        $time = $dom->getElementsByTagName('ACQUISITION_TIME')->item(0);
        $zipFile = $dom->getElementsByTagName('ZIPFILE')->item(0);
        $processingInfo = $dom->getElementsByTagName('ESA_PROCESSING')->item(0);
        $polygon = RestoGeometryUtil::wktPolygonToArray($dom->getElementsByTagName('ESA_TILEOUTLINE_FOOTPRINT_WKT')->item(0)->nodeValue);
        
        /*
         * Initialize feature
         */
        $feature = array(
            'type' => 'Feature',
            'geometry' => array(
                'type' => 'Polygon',
                'coordinates' => array($polygon),
            ),
            'properties' => array(
                'productIdentifier' => $dom->getElementsByTagName('IDENTIFIER')->item(0)->nodeValue,
                'startDate' => RestoUtil::formatTimestamp($time->getAttribute('start_datetime_utc')),
                'completionDate' => RestoUtil::formatTimestamp($time->getAttribute('stop_datetime_utc')),
                'platform' =>  $dom->getElementsByTagName('SATELLITE')->item(0)->getAttribute('name'),
                'relativeOrbitNumber' => $dom->getElementsByTagName('ORBIT_NUMBERS')->item(0)->nodeValue,
                'resourceSize' => $zipFile->getAttribute('size_bytes'),
                'resourceChecksum' => 'md5:' . $zipFile->getAttribute('md5_local'),
                'productType' => $productType,
                'processingLevel' => $processingLevel,
                'instrument'=> $instrument,
                'cloudCover' => $dom->getElementsByTagName('ESA_CLOUD_COVER')->item(0)->getAttribute('percentage'),
                'path' => $path,
                'softwareVersion' => $processingInfo->getAttribute('software_version'),
                'processingTime' => RestoUtil::formatTimestamp($processingInfo->getAttribute('processingtime_utc'))
            )
        );

        return $feature;

    }

}