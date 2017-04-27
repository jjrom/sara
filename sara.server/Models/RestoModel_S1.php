<?php

/**
 * resto Sentinel-2 single tile model .
 * 
 * Input metadata is an XML file provided by Geoscience Australia modified by python script
 * to add IDENTIFIER and PATH elements
 *
 *  cat /g/data3/fj7/Copernicus/Sentinel-1/C-SAR/SLC/2014/2014-10/05S125E-10S130E/S1A_IW_SLC__1SSV_20141015T095954_20141015T100019_002838_003337_97EC.xml
 *  
 *         <?xml version='1.0'?>
 *         <AUSCOPHUB_SAFE_FILEDESCRIPTION>
 *             <SATELLITE name='S1A' />
 *             <CENTROID longitude='99.2799525844' latitude='-1.07725099673' />
 *             <ESA_TILEOUTLINE_FOOTPRINT_WKT>
 *                 POLYGON (([...]))
 *             </ESA_TILEOUTLINE_FOOTPRINT_WKT>
 *             <ACQUISITION_TIME start_datetime_utc='2014-10-04 23:04:48.570950' stop_datetime_utc='2014-10-04 23:05:03.324225' />
 *             <POLARISATION values='VH,VV' />
 *             <SWATH values='IW' />
 *             <ORBIT_NUMBERS relative='164' absolute='2686' />
 *             <ZIPFILE size_bytes='1005024846' md5_local='C372514F33A95DD0F5D38CCFC77E3E64' />
 *             <!-- Last elements added by python script -->
 *             <IDENTIFIER>S1A_IW_SLC__1SSV_20141015T095954_20141015T100019_002838_003337_97EC</IDENTIFIER>
 *             <PATH>/C-SAR/SLC/2014/2014-10/05S125E-10S130E</PATH>
 *         </AUSCOPHUB_SAFE_FILEDESCRIPTION>
 * 
 */
class RestoModel_S1 extends RestoModel {

    public $extendedProperties = array(
        'polarisation' => array(
            'name' => 'polarisation',
            'type' => 'TEXT'
        ),
        'swath' => array(
            'name' => 'swath',
            'type' => 'TEXT'
        ),
        'absoluteOrbitNumber' => array(
            'name' => 'absoluteorbitnumber',
            'type' => 'NUMERIC'
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
                'resourceSize' => trim($zipFile->getAttribute('size_bytes')),
                'resourceChecksum' => 'md5:' . trim($zipFile->getAttribute('md5_local')),
                'productType' => $productType,
                'processingLevel' => 'LEVEL-1',
                'instrument'=> $instrument,
                'polarisation' => trim($dom->getElementsByTagName('POLARISATION')->item(0)->getAttribute('values')),
                'swath' => trim($dom->getElementsByTagName('SWATH')->item(0)->getAttribute('values')),
                'path' => $path
            )
        );

        return $feature;

    }

}