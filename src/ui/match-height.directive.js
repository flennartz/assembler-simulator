// Stretches the element so that its bottom edge lines up with the bottom of the element
// given by the selector (used to let the code editor end at the same height as the memory table).
// Only applies while both are side by side; in the single-column layout the default height is kept.
// Once the user resizes the element by hand, the automatic height is no longer applied.
app.directive('matchHeight', ['$timeout', '$window', function ($timeout, $window) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var el = element[0];
            var autoHeight = null;

            var update = function () {
                if (autoHeight !== null && el.offsetHeight !== autoHeight) {
                    return; // resized by the user
                }

                var target = $window.document.querySelector(attrs.matchHeight);
                el.style.height = '';
                if (!target) {
                    autoHeight = null;
                    return;
                }

                var elRect = el.getBoundingClientRect();
                var targetRect = target.getBoundingClientRect();
                var sideBySide = targetRect.left >= elRect.right;
                var height = Math.round(targetRect.bottom - elRect.top);

                if (sideBySide && height > el.offsetHeight) {
                    el.style.height = height + 'px';
                    autoHeight = el.offsetHeight;
                } else {
                    autoHeight = null;
                }
            };

            $timeout(update);
            angular.element($window).on('resize', update);
            scope.$on('$destroy', function () {
                angular.element($window).off('resize', update);
            });
        }
    };
}]);
