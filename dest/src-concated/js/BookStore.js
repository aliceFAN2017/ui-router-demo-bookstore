
var routerApp = angular.module('routerApp', ['ui.router', 'ngGrid', 'BookListModule', 'BookDetailModule']);
/**
 * make $state and $stateParams worked globally by assigning them to $rootScope
 * run once when angular starts up
 * @param  {[type]} $rootScope
 * @param  {[type]} $state
 * @param  {[type]} $stateParams
 * @return {[type]}
 */
routerApp.run(function($rootScope, $state, $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
});

/**
 * Configure ui-router as Router to support view nested
 * @param  {[type]} $stateProvider
 * @param  {[type]} $urlRouterProvider
 * @return {[type]}
 */
routerApp.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/index');
    $stateProvider
        .state('index', {
            url: '/index',
            views: {
                '': {
                    templateUrl: 'tpls/home.html'
                },
                'main@index': {
                    templateUrl: 'tpls/loginForm.html'
                }
            }
        })
        .state('booklist', {
            url: '/{bookType:[0-9]{1,4}}',
            views: { 
                '': {
                    templateUrl: 'tpls/bookList.html'
                },
                'booktype@booklist': {
                    templateUrl: 'tpls/bookType.html'
                },
                'bookgrid@booklist': {
                    templateUrl: 'tpls/bookGrid.html'
                }
            }
        })
        .state('addbook', {
            url: '/addbook',
            templateUrl: 'tpls/addBookForm.html'
        })
        .state('bookdetail', {
            url: '/bookdetail/:bookType/:bookId', 
            templateUrl: 'tpls/bookDetail.html'
        })
});

/**
 * This is book list module
 * @type {[type]}
 */
var bookListModule = angular.module("BookListModule", []);
bookListModule.controller('BookListCtrl', function($scope, $state, $stateParams, bookStoreService) {
    $scope.filterOptions = {
        filterText: "",
        useExternalFilter: true
    };
    $scope.totalServerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [5, 10, 20],
        pageSize: 5,
        currentPage: 1
    };
    $scope.setPagingData = function(data, page, pageSize) {
        var pagedData = data.slice((page - 1) * pageSize, page * pageSize);
        $scope.books = pagedData;
        $scope.totalServerItems = data.length;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };

    //Load corresponding data for the passed in bookType
    $scope.getPagedDataAsync = function(pageSize, page, searchText) {
        setTimeout(function() {
            var data;
            if (searchText) {
                var ft = searchText.toLowerCase();
                bookStoreService.get('../data/books' + $stateParams.bookType + '.json')
                    .success(function(largeLoad) {
                        data = largeLoad.filter(function(item) {
                            return JSON.stringify(item).toLowerCase().indexOf(ft) != -1;
                        });
                        $scope.setPagingData(data, page, pageSize);
                    });
            } else {
                bookStoreService.get('../data/books' + $stateParams.bookType + '.json')
                    .success(function(largeLoad) {
                        $scope.setPagingData(largeLoad, page, pageSize);
                    })
            }
        }, 100);
    };

    $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);

    $scope.$watch('pagingOptions', function(newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
            $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText);
        }
    }, true);
    $scope.$watch('filterOptions', function(newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText);
        }
    }, true);

    $scope.gridOptions = {
        data: 'books',
        rowTemplate: '<div style="height: 100%"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
            '<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
            '<div ng-cell></div>' +
            '</div></div>',
        multiSelect: false,
        enableCellSelection: true,
        enableRowSelection: false,
        enableCellEdit: true,
        enablePinning: true,
        columnDefs: [{
            field: 'index',
            displayName: 'ID',
            width: 60,
            pinnable: false,
            sortable: false
        }, {
            field: 'name',
            displayName: 'Book Name',
            enableCellEdit: true
        }, {
            field: 'author',
            displayName: 'Author',
            enableCellEdit: true,
            width: 220
        }, {
            field: 'pubTime',
            displayName: 'Publish Date',
            enableCellEdit: true,
            width: 120
        }, {
            field: 'price',
            displayName: 'Price',
            enableCellEdit: true,
            width: 120,
            cellFilter: 'currency:"$"'
        }, {
            field: 'bookId',
            displayName: 'Operation',
            enableCellEdit: false,
            sortable: false,
            pinnable: false,
            cellTemplate: '<div><a ui-sref="bookdetail({bookType: $stateParams.bookType, bookId:row.getProperty(col.field)})" id="{{row.getProperty(col.field)}}">Detail</a></div>'
        }],
        enablePaging: true,
        showFooter: true,
        totalServerItems: 'totalServerItems',
        pagingOptions: $scope.pagingOptions,
        filterOptions: $scope.filterOptions
    };
});


/**
 * This is book detail module
 * @type {[type]}
 */
var bookDetailModule = angular.module("BookDetailModule", []);
bookDetailModule.controller('BookDetailCtrl', function($scope, $state, $stateParams, bookStoreService) {
    console.log($stateParams)
    bookStoreService.get('../data/books' + $stateParams.bookType + '.json').success(function(data) {
        $scope.book = data[$stateParams.bookId - 1];
    });
});

bookListModule.factory('bookStoreService', function($http) {
	var bookObj = {};
	bookObj.get = function(url) {
		return $http.get(url);
	}

    return bookObj;
});