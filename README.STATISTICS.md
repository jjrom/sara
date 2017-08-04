# SARA statistics 

The following SQL requests are based on ESA requirements found in "Sentinel COLLABORATIVE GS Data ACCESS Annual REPORTING" document


## Total number of distinct users
    
    SELECT count(email) FROM resto.users;
    
## New users since AAAA-MM-JJ (e.g. 2015-12-14)
    
    SELECT count(email) FROM resto.users WHERE registrationdate >= '2015-12-14';

## Utilisation domain (i.e. research, commercial, education, other)
        
    WITH tmp as (SELECT split_part(topics, '|', 1) as domain FROM resto.users WHERE split_part(topics, '|', 1) IS NOT NULL) SELECT distinct domain,count(domain) AS count FROM resto.users, tmp GROUP BY domain;

## Usage field (i.e. atmosphere, emergency, marine, land, security, climate, other)

    WITH tmp as (SELECT split_part(topics, '|', 2) as usage FROM resto.users WHERE split_part(topics, '|', 2) IS NOT NULL) SELECT distinct usage,count(usage) AS count FROM resto.users, tmp GROUP BY usage;
    
## Country of the account user (e.g. joseph.antony@anu.edu.au)
    
    SELECT country FROM resto.users WHERE email='joseph.antony@anu.edu.au';

## Searched queries

    SELECT distinct query, count(query) AS count FROM resto.history GROUP BY query ORDER BY count DESC;
    
## Data delivered per utilisation domain and usage field

    SELECT distinct (u.topics), count(h.resourceid) FROM resto.history AS h, resto.users AS u WHERE u.email = h.email GROUP BY u.topics;

## Data volume in bytes downloaded for user (e.g. joseph.antony@anu.edu.au)

    SELECT SUM(resource_size) FROM resto.features WHERE identifier IN (SELECT resourceid from resto.history where service='download' AND email='joseph.antony@anu.edu.au');

**Note** : data volume downloaded computation assume that there is no aborted download

    