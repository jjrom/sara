<?php

/**
 * resto Sentinel-1 model .
 * 
 * Input metadata is an XML file provided by Geoscience Australia
 *
 *  cat /g/data3/fj7/Copernicus/Sentinel-1/C-SAR/SLC/2017/2017-08/30S135E-35S140E/S1A_IW_SLC__1SDV_20170811T201209_20170811T201239_017880_01DFBE_C3CE.xml
 *
 *  <?xml version='1.0'?>
 *  <AUSCOPHUB_SAFE_FILEDESCRIPTION>
 *    <IDENTIFIER>S1A_IW_SLC__1SDV_20170811T201209_20170811T201239_017880_01DFBE_C3CE</IDENTIFIER>
 *    <PATH>/C-SAR/SLC/2017/2017-08/30S135E-35S140E</PATH>
 *    <SATELLITE name='S1A' />
 *    <INSTRUMENT>C-SAR</INSTRUMENT>
 *    <PRODUCT_TYPE>SLC</PRODUCT_TYPE>
 *    <PROCESSING_LEVEL>LEVEL-1</PROCESSING_LEVEL>
 *   <CENTROID longitude='137.023498309' latitude='-30.723540327' />
 *   <ESA_TILEOUTLINE_FOOTPRINT_WKT>
 *     POLYGON ((138.032639 -31.912498,135.46048 -31.296803,136.042984 -29.527283,138.566879 -30.130522,138.032639 -31.912498))
 *    </ESA_TILEOUTLINE_FOOTPRINT_WKT>
 *    <ACQUISITION_TIME start_datetime_utc='2017-08-11 20:12:09.416341' stop_datetime_utc='2017-08-11 20:12:39.232185' />
 *    <POLARISATION values='VH,VV' />
 *    <SWATH values='IW1,IW2,IW3' />
 *    <MODE value='IW' />
 *    <ORBIT_NUMBERS relative='133' absolute='17880' />
 *    <PASS direction='Descending' />
 *    <ZIPFILE size_bytes='4589962599' md5_local='4F50C2E30CF82F73106F2FD9C1BE7389' />
 *  </AUSCOPHUB_SAFE_FILEDESCRIPTION>
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
    	'orbitDirection' => array(
                'name' => 'orbitDirection',
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

        $this->searchFilters['eo:orbitDirection'] = array(
            'key' => 'orbitDirection',
            'osKey' => 'orbitDirection',
            'operation' => '=',
            'options' => 'auto'
        );

        $this->searchFilters['polarisation'] = array(
            'key' => 'polarisation',
            'osKey' => 'polarisation',
            'operation' => '=',
            'options' => 'auto'
        );

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
        $time = $dom->getElementsByTagName('ACQUISITION_TIME')->item(0);
        $orbits = $dom->getElementsByTagName('ORBIT_NUMBERS')->item(0);
        $zipFile = $dom->getElementsByTagName('ZIPFILE')->item(0);
        $footprint = trim($dom->getElementsByTagName('ESA_TILEOUTLINE_FOOTPRINT_WKT')->item(0)->nodeValue);
        if (stripos($footprint, 'MULTIPOLYGON') !== false) {
            $polygon = RestoGeometryUtil::wktMultiPolygonToArray(trim($dom->getElementsByTagName('ESA_TILEOUTLINE_FOOTPRINT_WKT')->item(0)->nodeValue));
            $footprint_type = 'MultiPolygon';
        } else {
            $polygon = RestoGeometryUtil::wktPolygonToArray(trim($dom->getElementsByTagName('ESA_TILEOUTLINE_FOOTPRINT_WKT')->item(0)->nodeValue));
            $footprint_type = 'Polygon';
        }
	
    	/*
    	 * Compatible with previous xml version
    	 */
    	$instrument = trim($dom->getElementsByTagName('INSTRUMENT')->item(0)->nodeValue);
        if ($instrument->length == 0) {
            $instrument = $explodedPath[1];
        }

        $productType = trim($dom->getElementsByTagName('PRODUCT_TYPE')->item(0)->nodeValue);
        if ($productType->length == 0) {
            $productType = $explodedPath[2];
        }

        $processingLevel = trim($dom->getElementsByTagName('PROCESSING_LEVEL')->item(0)->nodeValue);
    	if ($processingLevel->length == 0) {
            $processingLevel = 'LEVEL-1';
        }

        /*
         * Initialize feature
         */
        $feature = array(
            'type' => 'Feature',
            'geometry' => array(
                'type' => $footprint_type,
                'coordinates' => array($polygon),
            ),
            'properties' => array(
                'productIdentifier' => trim($dom->getElementsByTagName('IDENTIFIER')->item(0)->nodeValue),
                'startDate' => RestoUtil::formatTimestamp(trim($time->getAttribute('start_datetime_utc'))),
                'completionDate' => RestoUtil::formatTimestamp(trim($time->getAttribute('stop_datetime_utc'))),
                'platform' =>  trim($dom->getElementsByTagName('SATELLITE')->item(0)->getAttribute('name')),
                'orbitNumber' => trim($orbits->getAttribute('relative')),
                'absoluteOrbitNumber' => trim($orbits->getAttribute('absolute')),
                'orbitDirection' => ucfirst(trim($dom->getElementsByTagName('PASS')->item(0)->getAttribute('direction'))),
                'resource' => $path,
                'resourceSize' => trim($zipFile->getAttribute('size_bytes')),
                'resourceChecksum' => 'md5=' . trim($zipFile->getAttribute('md5_local')),
                'productType' => $productType,
                'processingLevel' => $processingLevel,
                'instrument'=> $instrument,
                'polarisation' => trim($dom->getElementsByTagName('POLARISATION')->item(0)->getAttribute('values')),
                'swath' => trim($dom->getElementsByTagName('SWATH')->item(0)->getAttribute('values')),
                'sensorMode' => trim($dom->getElementsByTagName('MODE')->item(0)->getAttribute('value'))
            )
        );

        return $feature;

    }

}
