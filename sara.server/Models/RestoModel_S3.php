<?php

/**
 * resto Sentinel-2 single tile model .
 * 
 * Input metadata is an XML file provided by Geoscience Australia modified by python script
 * to add IDENTIFIER and PATH elements
 *
 *  cat /g/data3/fj7/Copernicus/Sentinel-3/OLCI/OL_1_EFR___/2016/2016-10/2016-10-18/S3A_OL_1_EFR____20161018T192542_20161018T192842_20161104T093300_0180_010_056_3239_SVL_O_NR_002.xml
 *  
 *         <?xml version='1.0'?>
 *         <AUSCOPHUB_SAFE_FILEDESCRIPTION>
 *             <SATELLITE name='S3A' />
 *             <CENTROID longitude='-147.526994259' latitude='-17.1798484094' />
 *             <ESA_TILEOUTLINE_FOOTPRINT_WKT>
 *                 POLYGON (([...]))
 *             </ESA_TILEOUTLINE_FOOTPRINT_WKT>
 *             <ACQUISITION_TIME start_datetime_utc='2016-10-18 19:25:42.115909' stop_datetime_utc='2016-10-18 19:28:42.115909' />
 *             <ESA_PROCESSING processingtime_utc='2016-11-04 09:33:00' baselinecollection='002'/>
 *             <ORBIT_NUMBERS relative='56' frame='3239' absolute='3494' cycle='10' />
 *             <ZIPFILE size_bytes='647555424' md5_local='F60B0C063980B9393F8A766F11745716' />
 *             <!-- Last elements added by python script -->
 *             <IDENTIFIER>S3A_OL_1_EFR____20161018T192542_20161018T192842_20161104T093300_0180_010_056_3239_SVL_O_NR_002</IDENTIFIER>
 *             <PATH>/OLCI/OL_1_EFR___/2016/2016-10/2016-10-18</PATH>
 *         </AUSCOPHUB_SAFE_FILEDESCRIPTION>
 * 
 */
class RestoModel_S3 extends RestoModel {

    public $extendedProperties = array(
        'absoluteOrbitNumber' => array(
            'name' => 'absoluteorbitnumber',
            'type' => 'NUMERIC'
        ),
        'frame' => array(
            'name' => 'frame',
            'type' => 'NUMERIC'
        ), 
        'cycle' => array(
            'name' => 'cycle',
            'type' => 'NUMERIC'
        ),
        'processingTime' => array(
            'name' => 'processingtime',
            'type' => 'TIMESTAMP'
        ),
        'baselineCollection' => array(
            'name' => 'baselinecollection',
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
        $productType = $explodedPath[2];
        $time = $dom->getElementsByTagName('ACQUISITION_TIME')->item(0);
        $orbits = $dom->getElementsByTagName('ORBIT_NUMBERS')->item(0);
        $processingInfo = $dom->getElementsByTagName('ESA_PROCESSING')->item(0);
        $zipFile = $dom->getElementsByTagName('ZIPFILE')->item(0);
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
                'orbitNumber' => trim($orbits->getAttribute('relative')),
                'absoluteOrbitNumber' => trim($orbits->getAttribute('absolute')),
                'frame' => trim($orbits->getAttribute('frame')),
                'cycle' => trim($orbits->getAttribute('cycle')),
                'resource' => $path,
                'resourceSize' => trim($zipFile->getAttribute('size_bytes')),
                'resourceChecksum' => 'md5:' . trim($zipFile->getAttribute('md5_local')),
                'productType' => $productType,
                'processingLevel' => 'LEVEL-1',
                'instrument'=> $instrument,
                'processingTime' => RestoUtil::formatTimestamp(trim($processingInfo->getAttribute('processingtime_utc'))),
                'baselineCollection' => trim($processingInfo->getAttribute('baselinecollection'))
            )
        );

        return $feature;

    }

}