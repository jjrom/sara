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
        $path = trim($dom->getElementsByTagName('PATH')->item(0)->nodeValue);
        $explodedPath = explode('/', $path);
        $instrument = $explodedPath[1];
        $processingLevel = $explodedPath[2];
        $productType = 'S2' . $instrument . substr($processingLevel, 1);
        $time = $dom->getElementsByTagName('ACQUISITION_TIME')->item(0);
        $zipFile = $dom->getElementsByTagName('ZIPFILE')->item(0);
        $processingInfo = $dom->getElementsByTagName('ESA_PROCESSING')->item(0);
        $polygon = RestoGeometryUtil::wktPolygonToArray(trim($dom->getElementsByTagName('ESA_TILEOUTLINE_FOOTPRINT_WKT')->item(0)->nodeValue));
        
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
                'productIdentifier' => trim($dom->getElementsByTagName('IDENTIFIER')->item(0)->nodeValue),
                'startDate' => RestoUtil::formatTimestamp(trim($time->getAttribute('start_datetime_utc'))),
                'completionDate' => RestoUtil::formatTimestamp(trim($time->getAttribute('stop_datetime_utc'))),
                'platform' =>  trim($dom->getElementsByTagName('SATELLITE')->item(0)->getAttribute('name')),
                'orbitNumber' => trim($dom->getElementsByTagName('ORBIT_NUMBERS')->item(0)->getAttribute('relative')),
                'resource' => $path,
                'resourceSize' => trim($zipFile->getAttribute('size_bytes')),
                'resourceChecksum' => 'md5=' . trim($zipFile->getAttribute('md5_local')),
                'productType' => $productType,
                'processingLevel' => $processingLevel,
                'instrument'=> $instrument,
                'cloudCover' => trim($dom->getElementsByTagName('ESA_CLOUD_COVER')->item(0)->getAttribute('percentage')),
                'softwareVersion' => trim($processingInfo->getAttribute('software_version')),
                'processingTime' => RestoUtil::formatTimestamp(trim($processingInfo->getAttribute('processingtime_utc')))
            )
        );

        return $feature;

    }

}