// Highlights the line scope.selectedLine in the textarea (used to show the current instruction).
// Based on: http://lostsource.com/2012/11/30/selecting-textarea-line.html
// The textarea is scrolled internally and focused with preventScroll, so the page that embeds
// the simulator (e.g. a Moodle course via iframe) does not jump on every step.
app.directive('selectLine', [function () {
    return {
        restrict: 'A',
        link: function (scope, element) {
            var textarea = element[0];

            scope.$watch('selectedLine', function () {
                if (scope.selectedLine === undefined || scope.selectedLine < 0) {
                    return;
                }

                var lines = textarea.value.split("\n");
                if (scope.selectedLine >= lines.length) {
                    return;
                }

                var startPos = 0;
                for (var x = 0; x < scope.selectedLine; x++) {
                    startPos += lines[x].length + 1;
                }
                var endPos = startPos + lines[scope.selectedLine].length;

                try {
                    textarea.focus({preventScroll: true});
                } catch (e) {
                    textarea.focus();
                }
                textarea.setSelectionRange(startPos, endPos);

                // Keep the selected line visible inside the textarea
                var lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 18;
                var top = scope.selectedLine * lineHeight;
                if (top < textarea.scrollTop || top + lineHeight > textarea.scrollTop + textarea.clientHeight) {
                    textarea.scrollTop = Math.max(0, top - textarea.clientHeight / 3);
                }
            });
        }
    };
}]);
