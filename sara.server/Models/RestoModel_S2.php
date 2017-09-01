<?php

/**
 * resto Sentinel-2 single tile model .
 * 
 * Input metadata is an XML file provided by Geoscience Australia
 *
 * cat /g/data/fj7/Copernicus/Sentinel-2/MSI/L1C/2017/2017-07/35S145E-40S150E/S2A_MSIL1C_20170717T001631_N0205_R073_T55HFB_20170717T001626.xml
 *
 * <?xml version='1.0'?>
 * <AUSCOPHUB_SAFE_FILEDESCRIPTION>
 *  <IDENTIFIER>S2A_MSIL1C_20170717T001631_N0205_R073_T55HFB_20170717T001626</IDENTIFIER>
 *  <PATH>/MSI/L1C/2017/2017-07/35S145E-40S150E</PATH>
 *  <SATELLITE name='S2A' />
 *  <INSTRUMENT>MSI</INSTRUMENT>
 *  <PRODUCT_TYPE>S2MSIL1C</PRODUCT_TYPE>
 *  <PROCESSING_LEVEL>L1C</PROCESSING_LEVEL>
 *  <CENTROID longitude='148.502695129' latitude='-35.1187469717' />
 *  <ESA_CLOUD_COVER percentage='42' />
 *  <ESA_TILEOUTLINE_FOOTPRINT_WKT>
 *    POLYGON ((148.093653286991 -34.8287099873146,148.227543480043 -34.8570367083744,148.226747899621 -34.8598491220025,148.471704109543 -34.9143127292077,148.471787347444 -34.914018618938,148.47184265966 -34.9140308920699,148.471892105433 -34.9138562218035,148.474387211521 -34.9144089115764,148.474553666106 -34.9138198639604,148.474664248544 -34.9138442636698,148.474735908606 -34.9135905357651,148.474951876115 -34.9136379893134,148.475558915976 -34.9114845728013,148.579597359253 -34.9343735039642,148.753533076137 -34.9727886100295,148.752599230622 -34.9761372761806,149.025804840369 -35.0403190094919,148.986517855795 -35.1844195679992,148.951069538604 -35.3142642075119,148.100232951971 -35.3262577111961,148.093653286991 -34.8287099873146))
 *  </ESA_TILEOUTLINE_FOOTPRINT_WKT>
 *  <ACQUISITION_TIME start_datetime_utc='2017-07-17 00:16:31.026000' stop_datetime_utc='2017-07-17 00:16:31.026000' />
 *  <ESA_PROCESSING software_version='02.05' processingtime_utc='2017-07-17 00:16:26'/>
 *  <ORBIT_NUMBERS relative='73' />
 *  <ZIPFILE size_bytes='246673280' md5_local='D63BEB381862BD4C61DBA56FF799E188' />
 * </AUSCOPHUB_SAFE_FILEDESCRIPTION>
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
        $time = $dom->getElementsByTagName('ACQUISITION_TIME')->item(0);
        $zipFile = $dom->getElementsByTagName('ZIPFILE')->item(0);
        $processingInfo = $dom->getElementsByTagName('ESA_PROCESSING')->item(0);
        $polygon = RestoGeometryUtil::wktPolygonToArray(trim($dom->getElementsByTagName('ESA_TILEOUTLINE_FOOTPRINT_WKT')->item(0)->nodeValue));

	/*
         * Compatible with previous xml version
         */
        $instrument = trim($dom->getElementsByTagName('INSTRUMENT')->item(0)->nodeValue);
        if (empty($instrument)) {$instrument = $explodedPath[1];}
	$processingLevel = trim($dom->getElementsByTagName('PROCESSING_LEVEL')->item(0)->nodeValue);
        if (empty($processingLevel)) {$processingLevel = $explodedPath[2];}
	$productType = trim($dom->getElementsByTagName('PRODUCT_TYPE')->item(0)->nodeValue);
        if (empty($productType)) {$productType = 'S2' . $instrument . substr($processingLevel, 1);}
                
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