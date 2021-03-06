#!/bin/bash
function showUsage {
    echo ""
    echo "   Update ST_SplitDateLine function to work with Sentinel-1/2/3"
    echo ""
    echo "   Usage $0 [options]"
    echo ""
    echo "      -u | --user : superuser for database"
    echo "      -d | --database: database to install function"
    echo "      -h | --help : show this help"
    echo ""
    echo ""
}

# Parsing arguments
while [[ $# > 0 ]]
do
        key="$1"

        case $key in
        -u|--user)
            SUPERUSER="$2"
            shift # past argument
            ;;
        -d|--database)
            DB="$2"
            shift # past argument
            ;;   
        -h|--help)
            showUsage
            exit 0
            shift # past argument
            ;;
            *)
        shift # past argument
        # unknown option
        ;;
        esac
done

if [ "${SUPERUSER}" == "" ] || [ "${DB}" == "" ]
then
    showUsage
    echo ""
    echo "   ** Missing arguments ** ";
    echo ""
    exit 0
fi

psql -d $DB -U $SUPERUSER << EOF

CREATE OR REPLACE FUNCTION ST_SplitDateLine(geom_in geometry) 
RETURNS geometry AS \$\$
DECLARE
  multi_geom_out GEOMETRY;
  geom_out GEOMETRY;
  multi_line_geom GEOMETRY;
  line_geom GEOMETRY;
  lastx FLOAT;
  lasty FLOAT;
--  xmin FLOAT := 360;
--  xmax FLOAT := -360;
  xp FLOAT;
  yp FLOAT;
  xoffset FLOAT :=0;
  -- Maximum eastward(westward) longitude change when going eastward(westward); seems to work for Sentinel-3
  -- Also used to check if a change-in-direction, close to either north or south pole, has already occurred 
  xgaplimit FLOAT :=60;
  -- Sentinel-3 polygon crossing north pole starts eastward; a polygon crossing south pole starts westward
  eastward INTEGER :=0;
  -- Only check above for first such big gap
  firstgap BOOLEAN :=TRUE;
  pp INTEGER;
  nn INTEGER;
  -- Densify polygon when necessary
  insertx FLOAT;
  inserty FLOAT;
  insertn INTEGER :=-1;

BEGIN

  -- Works for SRID 4326; Polygon and Multipolygons;
  -- Sentinel-3 large polygons ordered west to east (CCW), close to north pole;
  -- Sentinel-3 large polygons ordered east to west (CCW), close to south pole;

  -- Extract vertices from polygon or multipolygons 
  SELECT INTO multi_line_geom ST_Boundary(geom_in);

  -- Loop through multi polygons
  For pp IN 1 .. ST_NumGeometries(multi_line_geom) LOOP

    SELECT INTO line_geom ST_GeometryN(multi_line_geom, pp); 
    lastx := ST_X(ST_PointN(line_geom,1));
    lasty := ST_Y(ST_PointN(line_geom,1));
    -- reset values
    xoffset := 0;
    insertn := -1;
    eastward := 0;
    firstgap := TRUE;
--    xmin := lastx;
--    xmax := lastx;

    -- Loop through points to eliminate discontinuity
    FOR nn IN 2 .. ST_NPoints(line_geom) LOOP
      xp := ST_X(ST_PointN(line_geom,nn))+xoffset;
      yp := ST_Y(ST_PointN(line_geom,nn));

      -- Two consecutive points shouldn't be more than 180 degrees apart
      IF (xp - lastx < -180) THEN
        xp := xp + 360;
        xoffset := xoffset +360;
      ELSIF (xp - lastx > 180) THEN
        xp := xp -360;
        xoffset := xoffset - 360;
      END IF;

      -- However, the polygon may be sparsely defined close to the poles
      IF firstgap and ((xp - lastx > xgaplimit and eastward <0) or (lastx - xp > xgaplimit and eastward >0)) THEN
        firstgap := FALSE;
      -- If there's no big gap yet
      ELSIF (xp - lastx > xgaplimit and eastward >0 and firstgap) THEN 
        xp := xp -360;
        xoffset := xoffset - 360;
        firstgap := FALSE;
      ELSIF (lastx -xp > xgaplimit and eastward <0 and firstgap) THEN
        xp := xp+360;
        xoffset := xoffset+360;
        firstgap := FALSE;
      END IF;

      -- If the gap is too big, will add a point in between
      -- Use the larger latitude to avoid self-intersection
      IF (ABS(xp - lastx) > 180) THEN
        insertx := (xp + lastx)/2;
        IF yp > 0 THEN 
          inserty := GREATEST(yp, lasty, 90.);
        ELSE
          inserty := LEAST(yp, lasty, -90.);
        END IF;
        insertn := nn-1;
      END IF;

      -- Continue to go through the points
      SELECT INTO line_geom ST_SetPoint(line_geom,nn-1,ST_MakePoint(xp,yp));

--      IF (xp < xmin) THEN
--        xmin := xp;
--      END IF;
--      IF (xp > xmax) THEN
--        xmax := xp;
--      END IF;

      -- Determine if tracing eastward or westward
      -- In the initial track
      IF (eastward = 0 and lastx -xp >0.1) THEN
        eastward := -1;
      ELSIF (eastward = 0 and xp-lastx > 0.1) THEN
        eastward := 1;
      END IF;

      lastx := xp;
      lasty := yp;
    END LOOP;
    
    -- If need to, add the point now at position insertn
    IF insertn > 0 THEN
      SELECT INTO line_geom ST_AddPoint(line_geom, ST_MakePoint(insertx, inserty), insertn);
    END IF;

    -- Convert back to polygon
    -- convert to text first to force consistent rounding in start and end (closed)
    SELECT INTO geom_out ST_MakePolygon(ST_GeomFromEWKT(ST_AsEWKT(line_geom)));
  
    -- Make sure nothing goes below -180
    IF ST_Xmin(geom_out) < -180 THEN    
      SELECT INTO geom_out ST_Translate(geom_out, 360, 0);
    END IF;

    -- Split at 180
    SELECT INTO geom_out ST_Union(
      ST_Intersection( ST_MakeEnvelope(-180,-90,180,90, 4326),geom_out ),
      ST_Translate(ST_Intersection( ST_MakeEnvelope(180,-90,540,90, 4326),geom_out ),-360,0)
      );
    
    -- Support multipolygon
    IF pp = 1 THEN
      SELECT INTO multi_geom_out geom_out;
    ELSE
      SELECT INTO multi_geom_out ST_Union( multi_geom_out, geom_out);
    END IF;
  END LOOP;

  RETURN multi_geom_out;

-- If any of above failed, revert to use original polygon
-- This prevents ingestion error, but may potentially lead to incorrect spatial query.
EXCEPTION  WHEN OTHERS THEN
  RETURN geom_in;

END;
\$\$ LANGUAGE 'plpgsql';

EOF
