var app = angular.module('app', ['ngSanitize', 'queryBuilder']);
app.controller('QueryBuilderCtrl', ['$scope', function ($scope) {
    $scope.fields = [
        { name: 'Firstname' },
        { name: 'Lastname' },
        { name: 'Birthdate' },
        { name: 'City' },
        { name: 'Country' }
    ];

    $scope.query1;
    $scope.queryObj1;

    $scope.query2;
    $scope.queryObj2 = { 
        "operator": "AND", 
        "rules": [
            { 
                "condition": "=", 
                "field": "Firstname", 
                "data": "gsdfg" 
            }, 
            { 
                "group": { 
                    "operator": "AND", 
                    "rules": [
                        { 
                            "condition": "=", 
                            "field": "Firstname", 
                            "data": "fsdfdsfdsf" 
                        }
                    ] 
                } 
            }
        ] 
    };
}]);

var queryBuilder = angular.module('queryBuilder', []);
queryBuilder.run(function($templateCache) {
    $templateCache.put('/queryBuilderDirective.html', 
        '<div class="alert alert-warning alert-group">' +
            '<div class="form-inline">' +
                '<select ng-options="o.name as o.name for o in operators" ng-model="group.operator" class="form-control input-sm"></select>' +
                '<button style="margin-left: 5px" ng-click="addCondition()" class="btn btn-sm btn-success"><span class="glyphicon glyphicon-plus-sign"></span> Add Condition</button>' +
                '<button style="margin-left: 5px" ng-click="addGroup()" class="btn btn-sm btn-success"><span class="glyphicon glyphicon-plus-sign"></span> Add Group</button>' +
                '<button style="margin-left: 5px" ng-click="removeGroup()" class="btn btn-sm btn-danger"><span class="glyphicon glyphicon-minus-sign"></span> Remove Group</button>' +
            '</div>' +
            '<div class="group-conditions">' +
                '<div ng-repeat="rule in group.rules | orderBy:\'index\'" class="condition">' +
                    '<div ng-switch="rule.hasOwnProperty(\'group\')">' +
                        '<div ng-switch-when="true">' +
                            '<query-builder query-json="rule.group" query="query" fields="fields"></query-builder>' +
                        '</div>' +
                        '<div ng-switch-default="ng-switch-default">' +
                            '<div class="form-inline">' +
                                '<select ng-options="t.name as t.name for t in fields" ng-model="rule.field" class="form-control input-sm"></select>' +
                                '<select style="margin-left: 5px" ng-options="c.name as c.name for c in conditions" ng-model="rule.condition" class="form-control input-sm"></select>' +
                                '<input style="margin-left: 5px" type="text" ng-model="rule.data" class="form-control input-sm"/>' +
                                '<button style="margin-left: 5px" ng-click="removeCondition($index)" class="btn btn-sm btn-danger"><span class="glyphicon glyphicon-minus-sign"></span></button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>');
});

queryBuilder.directive('queryBuilder', ['$compile', function ($compile) {
    return {
        restrict: 'E',
        scope: {
            fields: '=',
            conditions: '=?',
            query: '=',
            queryJson: '=?'
        },
        templateUrl: '/queryBuilderDirective.html',
        compile: function (element, attrs) {
            var content, directive;
            content = element.contents().remove();
            return function (scope, element, attrs) {
                var DEFAULT_CONDITIONS = [
                    { name: '=' },
                    { name: '<>' },
                    { name: '<' },
                    { name: '<=' },
                    { name: '>' },
                    { name: '>=' },
                    { name: 'Contains'}
                ];

                scope.operators = [
                    { name: 'AND' },
                    { name: 'OR' }
                ];
                scope.group = scope.queryJson ? scope.queryJson : {
                    "operator": "AND",
                    "rules": []
                };
                scope.query = '';
                scope.conditions = scope.conditions || DEFAULT_CONDITIONS;

                function escape(str) {
                    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
                }

                function computed(group) {
                    if (!group) return "";
                    for (var str = "(", i = 0; i < group.rules.length; i++) {
                        i > 0 && (str += ' '+group.operator+' ');

                        if(group.rules[i].group) {
                            str += computed(group.rules[i].group)
                        }
                        else {
                            if(group.rules[i].condition === 'Contains') {
                                str += group.rules[i].field + " LIKE \"" + escape(group.rules[i].data) + "\"";
                            }
                            else {
                                str += group.rules[i].field + " " + group.rules[i].condition + " \"" + escape(group.rules[i].data) + "\"";
                            }
                        }
                    }

                    return str + ")";
                }

                scope.addCondition = function () {
                    if(!scope.fields || !scope.fields.length) {
                        return;
                    }
                    
                    scope.group.rules.push({
                        condition: '=',
                        field: scope.fields[0].name,
                        data: ''
                    });
                };

                scope.removeCondition = function (index) {
                    scope.group.rules.splice(index, 1);
                };

                scope.addGroup = function () {
                    scope.group.rules.push({
                        group: {
                            operator: 'AND',
                            rules: []
                        }
                    });
                };

                scope.removeGroup = function () {
                    "group" in scope.$parent && scope.$parent.group.rules.splice(scope.$parent.$index, 1);
                };

                scope.$watch(function() {return JSON.stringify(scope.group)}, function (newValue) {
                    scope.query = computed(scope.group);
                    scope.queryJson = angular.copy(scope.group);
                }, true);

                directive || (directive = $compile(content));

                element.append(directive(scope, function ($compile) {
                    return $compile;
                }));
            };
        }
    }
}]);
