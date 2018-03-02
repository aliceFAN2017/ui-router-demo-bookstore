bookListModule.factory('bookStoreService', function($http) {
	var bookObj = {};
	bookObj.get = function(url) {
		return $http.get(url);
	}

    return bookObj;
});