 angular.module('rocket.filters', [
        'filters.ellipsis',
        'filters.extractlocation',
        'filters.nicedate',
        'filters.notime',
        'filters.prefixcomma',
        'filters.urlencode'
    ]);

    /**
     * Create ellipsis on text to avoid text overflow
     */
    angular.module('filters.ellipsis', []).filter('ellipsis', function () {
        return function (input) {
            return input ? input.substring(0, 15) + '...' : '';
        };
    });

    /**
     * Extract regions/states from flat resto keywords
     */
    angular.module('filters.extractlocation', []).filter('extractlocation', function () {
        return function (keywords) {
            for (var keyword in keywords) {
                if (keywords[keyword].type === 'country') {
                    return keywords[keyword].name;
                }
            }
            return '';
        };
    });

    /**
     * Transform an ISO 8601 date into a human readable date
     */
    angular.module('filters.nicedate', []).filter('nicedate', ['rocketServices', niceDate]);
    function niceDate(rocketServices) {
        return function (input) {

            if (!input) {
                return '';
            }

            var ymd = input.split('T')[0].split('-'),
                day = ymd[2];

            /*
             * English special case - convert to 1st, 2nd, etc.
             */
            if (rocketServices.getLang() === 'en') {
                if (day.charAt(0) === '0') {
                    day = day.substring(1);
                }
                if (day === '1' || day === '21' || day === '31') {
                    day = day + 'st';
                }
                else if (day === '2' || day === '22') {
                    day = day + 'nd';
                }
                else if (day === '3' || day === '23') {
                    day = day + 'rd';
                }
                else {
                    day = day + 'th';
                }
            }

            return rocketServices.translate('nicedate', [ymd[0], rocketServices.translate('month:' + ymd[1]), day]) + ' - ' + input.split('T')[1].substring(0,8);
        };
    }

    /**
     * Remove time from a nice date
     */
    angular.module('filters.notime', []).filter('notime', function () {
        return function (input) {
            return input.substring(0, input.length - 11);
        };
    });

    /**
     * Return input prefixed by a comma
     */
    angular.module('filters.prefixcomma', []).filter('prefixcomma', function () {
        return function (input) {
            return input ? ', ' + input : '';
        };
    });

    /**
     * Encode uri component
     */
    angular.module('filters.urlencode', []).filter('urlencode', function () {
        return function (input) {
            return input ? encodeURIComponent(input) : '';
        };
    });
