app.controller('Ctrl', ['$document', '$scope', '$timeout', 'cpu', 'memory', 'assembler', function ($document, $scope, $timeout, cpu, memory, assembler) {
    $scope.memory = memory;
    $scope.cpu = cpu;
    $scope.error = '';
    $scope.info = '';
    $scope.warning = '';
    $scope.isRunning = false;
    $scope.halted = false;
    $scope.steps = 0;
    $scope.displayHex = true;
    $scope.displayInstr = true;
    $scope.displayA = false;
    $scope.displayB = false;
    $scope.displayC = false;
    $scope.displayD = false;
    $scope.speeds = [1, 4, 8, 16, 32, 64, 128, 256];
    $scope.speed = 4;
    $scope.outputStartIndex = 232;
    // Upper bound for "Bis HLT" so that endless loops do not freeze the page
    $scope.maxSteps = 10000;

    $scope.rows = [];
    $scope.cols = [];
    for (var n = 0; n < 16; n++) {
        $scope.rows.push(n * 16);
        $scope.cols.push(n);
    }

    $scope.examples = [
        {
            name: "Hallo Welt (Unterprogramm)",
            code: "; Beispiel: Hallo Welt\n; Schreibt \"Hallo Welt!\" in die Ausgabe\n\n" +
                "\tJMP start\n" +
                "hello:\tDB \"Hallo Welt!\"\t; Zeichenkette\n" +
                "\tDB 0\t\t; Endezeichen\n\n" +
                "start:\n" +
                "\tMOV C, hello\t; C zeigt auf die Zeichenkette\n" +
                "\tMOV D, 232\t; D zeigt auf die Ausgabe\n" +
                "\tCALL print\n" +
                "\tHLT\t\t; Programm beenden\n\n" +
                "print:\t\t\t; print(C: Quelle, D: Ziel)\n" +
                "\tPUSH A\n" +
                "\tPUSH B\n" +
                "\tMOV B, 0\n" +
                ".loop:\n" +
                "\tMOV A, [C]\t; Zeichen holen\n" +
                "\tMOV [D], A\t; in die Ausgabe schreiben\n" +
                "\tINC C\n" +
                "\tINC D\n" +
                "\tCMP B, [C]\t; Endezeichen erreicht?\n" +
                "\tJNZ .loop\t; wenn nicht: weiter\n\n" +
                "\tPOP B\n" +
                "\tPOP A\n" +
                "\tRET"
        },
        {
            name: "Countdown (Schleife)",
            code: "; Beispiel: Countdown\n; Schreibt die Ziffern 9 bis 0 in die Ausgabe\n\n" +
                "\tMOV A, '9'\t; Startwert als Zeichen\n" +
                "\tMOV D, 232\t; D zeigt auf die Ausgabe\n" +
                "loop:\n" +
                "\tMOV [D], A\t; Ziffer ausgeben\n" +
                "\tINC D\n" +
                "\tCMP A, '0'\t; schon bei '0'?\n" +
                "\tJZ ende\t\t; ja: fertig\n" +
                "\tDEC A\n" +
                "\tJMP loop\n" +
                "ende:\n" +
                "\tHLT"
        },
        {
            name: "Multiplikation 6 · 7",
            code: "; Beispiel: Multiplikation\n; Berechnet 6 * 7 = 42 und gibt das Ergebnis\n; als zwei Dezimalziffern aus\n\n" +
                "\tMOV A, 6\n" +
                "\tMUL 7\t\t; A = A * 7\n" +
                "\tMOV B, A\t; Ergebnis merken\n" +
                "\tDIV 10\t\t; A = Zehnerstelle\n" +
                "\tMOV C, A\n" +
                "\tADD A, '0'\t; Ziffer -> Zeichen\n" +
                "\tMOV [232], A\n" +
                "\tMOV A, C\n" +
                "\tMUL 10\n" +
                "\tSUB B, A\t; B = Einerstelle\n" +
                "\tADD B, '0'\n" +
                "\tMOV [233], B\n" +
                "\tHLT"
        }
    ];
    $scope.example = $scope.examples[0];
    $scope.code = $scope.example.code;
    $scope.assembledCode = null;

    $scope.loadExample = function () {
        $scope.stop();
        $scope.code = $scope.example.code;
        $scope.assemble();
    };

    $scope.codeChanged = function () {
        return $scope.assembledCode !== null && $scope.assembledCode !== $scope.code;
    };

    $scope.reset = function () {
        cpu.reset();
        memory.reset();
        $scope.error = '';
        $scope.info = '';
        $scope.warning = '';
        $scope.halted = false;
        $scope.steps = 0;
        $scope.selectedLine = -1;
    };

    // "Zurücksetzen": reload the current program into a fresh CPU and memory
    $scope.restart = function () {
        $scope.stop();
        $scope.assemble();
    };

    $scope.executeStep = function () {
        if (!$scope.checkPrgrmLoaded()) {
            $scope.assemble();
            if ($scope.error !== '') {
                return false;
            }
        }

        try {
            var res = cpu.step();

            if (res === true) {
                $scope.steps++;
            } else {
                $scope.halted = true;
                $scope.info = 'Programm beendet (HLT) nach ' + $scope.steps + ' Schritten.';
            }

            // Mark in code
            if (cpu.ip in $scope.mapping) {
                $scope.selectedLine = $scope.mapping[cpu.ip];
            }

            return res;
        } catch (e) {
            $scope.error = e;
            return false;
        }
    };

    var runner;
    $scope.run = function () {
        if (!$scope.checkPrgrmLoaded()) {
            $scope.assemble();
            if ($scope.error !== '') {
                return;
            }
        }

        $scope.isRunning = true;
        runner = $timeout(function () {
            if ($scope.executeStep() === true) {
                $scope.run();
            } else {
                $scope.isRunning = false;
            }
        }, 1000 / $scope.speed);
    };

    $scope.runToEnd = function () {
        $scope.stop();
        for (var i = 0; i < $scope.maxSteps; i++) {
            if ($scope.executeStep() !== true) {
                return;
            }
        }
        $scope.warning = 'Nach ' + $scope.maxSteps + ' Schritten angehalten – möglicherweise eine Endlosschleife.';
    };

    $scope.stop = function () {
        $timeout.cancel(runner);
        $scope.isRunning = false;
    };

    $scope.checkPrgrmLoaded = function () {
        for (var i = 0, l = memory.data.length; i < l; i++) {
            if (memory.data[i] !== 0) {
                return true;
            }
        }

        return false;
    };

    $scope.getChar = function (value) {
        var text = String.fromCharCode(value);

        if (text.trim() === '') {
            return ' ';
        } else {
            return text;
        }
    };

    $scope.assemble = function () {
        try {
            $scope.reset();

            var assembly = assembler.go($scope.code);
            $scope.mapping = assembly.mapping;
            var binary = assembly.code;
            $scope.labels = assembly.labels;

            if (binary.length > memory.data.length)
                throw {error: "Das Programm passt nicht in den Speicher (" + binary.length + " von maximal " + memory.data.length + " Bytes)."};

            for (var i = 0, l = binary.length; i < l; i++) {
                memory.data[i] = binary[i];
            }

            $scope.assembledCode = $scope.code;
            $scope.info = 'Assembliert: ' + binary.length + ' Bytes im Speicher geladen.';
        } catch (e) {
            $scope.assembledCode = null;
            if (e.line !== undefined) {
                $scope.error = 'Zeile ' + (e.line + 1) + ': ' + e.error;
                $scope.selectedLine = e.line;
            } else {
                $scope.error = e.error !== undefined ? e.error : e;
            }
        }
    };

    $scope.jumpToLine = function (index) {
        $scope.selectedLine = $scope.mapping[index];
    };

    $scope.isInstruction = function (index) {
        return $scope.mapping !== undefined &&
            $scope.mapping[index] !== undefined &&
            $scope.displayInstr;
    };

    $scope.getMemoryCellCss = function (index) {
        if (index >= $scope.outputStartIndex) {
            return 'output-bg';
        } else if ($scope.isInstruction(index)) {
            return 'instr-bg';
        } else if (index > cpu.sp && index <= cpu.maxSP) {
            return 'stack-bg';
        } else {
            return '';
        }
    };

    $scope.getMemoryInnerCellCss = function (index) {
        if (index === cpu.ip) {
            return 'marker marker-ip';
        } else if (index === cpu.sp) {
            return 'marker marker-sp';
        } else if (index === cpu.gpr[0] && $scope.displayA) {
            return 'marker marker-a';
        } else if (index === cpu.gpr[1] && $scope.displayB) {
            return 'marker marker-b';
        } else if (index === cpu.gpr[2] && $scope.displayC) {
            return 'marker marker-c';
        } else if (index === cpu.gpr[3] && $scope.displayD) {
            return 'marker marker-d';
        } else {
            return '';
        }
    };

    $scope.objectKeys = function (obj) {
        return obj ? Object.keys(obj).length : 0;
    };

    $scope.openHelp = function () {
        var el = $document[0].getElementById('befehlssatz');
        if (el) {
            el.open = true;
        }
    };

    // Open the instruction reference when linked as index.html#befehlssatz
    if ($document[0].location.hash === '#befehlssatz') {
        $timeout(function () {
            $scope.openHelp();
            $document[0].getElementById('befehlssatz').scrollIntoView();
        });
    }

    $scope.assemble();
}]);
