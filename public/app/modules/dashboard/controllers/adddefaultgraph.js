
dashboard.controller('adddefaultgraphController', ['$rootScope', '$scope', '$state', '$location', 'dashboardService', 'Flash','$firebaseObject','$firebaseArray','Upload','$timeout','notification',
function ($rootScope, $scope, $state, $location, dashboardService, Flash, $firebaseObject, $firebaseArray, Upload, $timeout, notification) {
    var vm = this; //controllerAs
    vm.adddefaultgraph = function (graph) {
        //graph.userUid = $rootScope.userDB.uid;
        var ref = firebase.database().ref('graphs/');
        var graphList = $firebaseArray(ref);
        graphList.$loaded().then(() => {
            graphList.$add(graph).then((ref) => {
                swal({
                    title: "The default graph has been added with sucess!",
                    timer: 1700,
                    showConfirmButton: false
                });
            //console.log("The graph: ", graph)
            });
        });
    }
}]);
