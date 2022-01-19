var app = angular.module('doserApp', ['ngMaterial']);

if (!String.prototype.endsWith)
	String.prototype.endsWith = function(searchStr, Position) {
		// This works much better than >= because
		// it compensates for NaN:
		if (!(Position < this.length))
			Position = this.length;
		else
			Position |= 0; // round position
		return this.substr(Position - searchStr.length,
				searchStr.length) === searchStr;
	};

function getCaretPosition(ctrl) {
	var caretPos = 0;

	if (ctrl.selectionStart || ctrl.selectionStart == 0) {// Standard.
		caretPos = ctrl.selectionStart;
	} else if (document.selection) {// Legacy IE
		ctrl.focus ();
		var sel = document.selection.createRange ();
		sel.moveStart ('character', -ctrl.value.length);
		caretPos = sel.text.length;
	}

	return caretPos;
}

function setCaretPosition(elem, caretPos) {
	if (elem !== null) {
		if (elem.createTextRange) {
			var range = elem.createTextRange();
			range.move('character', caretPos);
			range.select();
		} else {
			if (elem.setSelectionRange) {
				elem.focus();
				elem.setSelectionRange(caretPos, caretPos);
			} else
				elem.focus();
		}
	}
}

app.directive('rounded', ['$filter', function ($filter) {
	return {
		require: 'ngModel',
		link: function (scope, element, attrs, ngModel) {
			var f = function (val) {
				var v = val ? val.toString().replace(/[^0-9\.]/g, "") : "";
				v = v.replace(/([^\.]\.\d).*/, "$1");

				if (v.length > 2) {
					v = v.replace(/(.*\..*)\./, "$1");
				}
				var pos = getCaretPosition(element[0]);

				if (v != "" && v != "." && v.indexOf(".", v.length - 1) == -1) {
					var r = Math.round(v * 10) / 10;
					ngModel.$setViewValue(r);
					ngModel.$render();
					setCaretPosition(element[0], pos);
					return r;
				} else if (v != ".") {
					ngModel.$setViewValue(v);
					ngModel.$render();
				}
				return v;
			};
			ngModel.$formatters.push(f);
			ngModel.$parsers.push(f);
		}
	}
}]);

app.directive('rounded2', ['$filter', function ($filter) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function (scope, element, attrs, ngModel) {
			var f = function (val) {
				var v = (val || val === 0) ? val.toString().replace(/[^0-9\.]/g, "") : "";
				v = v.replace(/([^\.]\.\d\d{0,1}).*/, "$1");

				var pos = getCaretPosition(element[0]);

				if (v != "" && v != "0.0" && v.indexOf(".", v.length - 1) == -1 && !v.endsWith(".0")) {
					if (v.search(/^\.\d/) >= 0) {
						pos++;  // because .1 will become 0.1
					}

					var r = Math.round(v * 100) / 100;
					ngModel.$setViewValue(r);
					ngModel.$render();
					setCaretPosition(element[0], pos);
					return r;
				} else if (v == "0.0") {
					ngModel.$setViewValue(v);
					ngModel.$render();

				} else if (v != ".") {
					ngModel.$setViewValue(v);
					ngModel.$render();
				}
				return v;
			};
			ngModel.$formatters.push(f);
			ngModel.$parsers.push(f);
		}
	}
}]);

app.directive('enter', function () {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if (event.which === 13) {
				scope.$apply(function () {
					scope.$eval(attrs.enter);
				});
				event.preventDefault();
			}
		});
	};
});

app.controller('MainController', function($scope, $mdDialog) {
	$scope.data = {
		sex: null,
		units: "metric",
		height: null,
		weight: null,
		heightInMetric: null,
		weightInMetric: null,
		age: null,
		scr: null,
		auc: null,
		bmi: null,
		ibw: null,
		cbw: null,
		crcl: null,
		dose: null
	};

	$scope.changeUnits = function() {
		if ($scope.data.height) {
			if ($scope.data.units == "english") {
				$scope.data.height = $scope.data.height * 0.3937008;
			}
			if ($scope.data.units == "metric") {
				$scope.data.height = $scope.data.height * 2.54;
			}
		}
		if ($scope.data.weight) {
			if ($scope.data.units == "english") {
				$scope.data.weight = $scope.data.weight * 2.2;
			}
			if ($scope.data.units == "metric") {
				$scope.data.weight = $scope.data.weight / 2.2;
			}
		}
	};

	$scope.update = function() {
		if ($scope.data.sex && $scope.data.height && $scope.data.weight) {
			var height = heightInMetric();
			var weight = weightInMetric();
			var meters = height / 100.0;
			var bmi = weight / (meters * meters);
			var c = ($scope.data.sex === "male") ? 50.0 : 45.5;
			var extraHeight = (height >= 152.0) ? height - 152.0 : 0.0;
			var scr = ($scope.data.scr >= 0.7) ? $scope.data.scr : 0.7;
			var ibw = c + (0.91 * extraHeight);
			var underWeight = Math.max(weight - ibw, 0);
			var cbw = ibw + 0.4 * underWeight;

			$scope.data.bmi = round(bmi);
			$scope.data.ibw = round(ibw);
			$scope.data.cbw = round(cbw);
			$scope.data.heightInMetric = height;
			$scope.data.weightInMetric = weight;

			if ($scope.data.age && $scope.data.scr) {
				var w = (bmi < 25.0) ? weight : cbw;
				var f = ($scope.data.sex === "female") ? 0.85 : 1.0;
				var crcl = ((140 - $scope.data.age) * w * f) / (72 * scr);
				$scope.data.crcl = round(Math.min(crcl, 125.0));
			} else {
				$scope.data.crcl = null;
			}

			if ($scope.data.crcl && $scope.data.auc) {
				$scope.data.dose = Math.round(($scope.data.crcl + 25) * $scope.data.auc);
			} else {
				$scope.data.dose = null;
			}
		} else {
			$scope.data.bmi = null;
			$scope.data.ibw = null;
			$scope.data.cbw = null;
			$scope.data.crcl = null;
			$scope.data.dose = null;
		}
	};

	$scope.calcAgeDialog = function(ev) {
		$mdDialog.show({
				templateUrl: 'calc-age-dialog.tmpl.html',
				targetEvent: ev,
				controller: AgeDialogController
			}).then(function(dob) {
				$scope.data.age = age(dob);
			}, function() {
				$scope.alert = 'You cancelled the dialog.';
			});
	};

	$scope.reset = function() {
		$scope.data.sex = null;
		$scope.data.height = null;
		$scope.data.weight = null;
		$scope.data.heightInMetric = null;
		$scope.data.weightInMetric = null;
		$scope.data.age = null;
		$scope.data.scr = null;
		$scope.data.auc = null;
		$scope.data.bmi = null;
		$scope.data.ibw = null;
		$scope.data.cbw = null;
		$scope.data.crcl = null;
		$scope.data.dose = null;
	};

	var heightInMetric = function() {
		return ($scope.data.units == "english") ? $scope.data.height * 2.54 : $scope.data.height;
	};
	var weightInMetric = function() {
		return ($scope.data.units == "english") ? $scope.data.weight / 2.2 : $scope.data.weight;
	};
	var age = function(dateString) {
		var today = new Date();
		var birthDate = new Date(dateString);
		var age = today.getFullYear() - birthDate.getFullYear();
		var m = today.getMonth() - birthDate.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	};
	var round = function(n) {
		return Math.round(n * 10) / 10;
	};
	var ok = function() {
		if (!isNaN(new Date($scope.dob).getTime())) {
			$mdDialog.hide($scope.dob);
		}
	};
});

function AgeDialogController($scope, $mdDialog) {
	$scope.dob = null;

	$scope.cancel = function() {
		$mdDialog.cancel();
	};

	$scope.ok = function() {
		if (!isNaN(new Date($scope.dob).getTime())) {
			$mdDialog.hide($scope.dob);
		}
	};
}
