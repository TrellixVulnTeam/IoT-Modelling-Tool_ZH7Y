
dashboard.controller('addbelongingController', ['$rootScope', '$scope', '$state', '$location', 'dashboardService', 'Flash', '$firebaseObject', '$firebaseArray', 'Upload', '$timeout', 'notification',
function ($rootScope, $scope, $state, $location, dashboardService, Flash, $firebaseObject, $firebaseArray, Upload) {
    const vm = this;
    function DatabaseException(message) {
        this.message = message;
        this.name = 'dbException';
     }
    vm.addbelonging = function (prefix, type, model, file) { // prefix->type->model
        /* Update Map (component:specificType) */
        const mapTypeComponents = firebase.database().ref('mapTypeComponents/');
        let compType = {};
        if (type === 'ActuatingDevice') {
            compType[model.id] = 'actuator';
        }
        else if (type === 'SensingDevice') {
            compType[model.id] = 'sensor';
        }
        else {
            compType[model.id] = 'device';
        }
        mapTypeComponents.update(compType);
        Upload.base64DataUrl(file).then((base64Url) => {
            model.userUid = $rootScope.userDB.uid; // User who has added the model into the platform
            model.ontology = type === 'ActuatingDevice' ? 'iot-lite' : 'ssn'; // Sensors and Devices have ssn as their ontologies
            var add = false;
            const refImages = firebase.database().ref('images/');
            const imageList = $firebaseArray(refImages);
            const auxType = {};
            const modelKeys = model;
            const auxInfo = {};
            var auxBind = {}; // devComp->prefix->type
            var auxBindPrefix = {}; // devComp->prefix
            var auxBindDevComp = {}; // devComp
            var auxPrefix = {};
            imageList.$loaded().then(() => {
                imageList.$add(base64Url).then((imref) => {
                    model.imageFile = imref.key;
                    const ref = firebase.database().ref('models/');
                    const refDevComp = firebase.database().ref('devComp/');
                    const modelList = $firebaseArray(ref);
                    refDevComp.on('value', (snapshot) => { // The whole object savedModels with all the saved models
                        if (snapshot.val() != null) {
                            if (prefix in snapshot.val() && add === false) {
                                if (type in snapshot.val()[prefix]) {
                                    auxInfo[concatenate((Object.keys(snapshot.val()[prefix][type]).length).toString(), '-', model.id)] = model;                                   
                                    auxBind = Object.assign(snapshot.val()[prefix][type], auxInfo);
                                    auxPrefix[type] = auxBind;
                                    auxBindPrefix[prefix] = Object.assign(snapshot.val()[prefix], auxPrefix);
                                    auxBindDevComp = Object.assign(snapshot.val(), auxBindPrefix);
                                    // Condition for avoiding multiple addings in the database with the same element
                                    const keyPrevious = Object.keys(snapshot.val()[prefix][type])[(Object.keys(snapshot.val()[prefix][type]).length - 1).toString()];
                                    if (add === false && snapshot.val()[prefix][type][keyPrevious].id !== model.id) {
                                        refDevComp.update(auxBindDevComp);
                                        add = true;
                                        return;
                                    }

                                    /* Delete aux objects */
                                    for (const prop of Object.getOwnPropertyNames(auxInfo)) {
                                        delete auxInfo[prop];
                                    }
                                    for (const prop of Object.getOwnPropertyNames(auxType)) {
                                        delete auxType[prop];
                                    }
                                    for (const prop of Object.getOwnPropertyNames(auxBind)) {
                                        delete auxPrefix[prop];
                                    }                                
                                    for (const prop of Object.getOwnPropertyNames(auxPrefix)) {
                                        delete auxPrefix[prop];
                                    }
                                    for (const prop of Object.getOwnPropertyNames(auxBindPrefix)) {
                                        delete auxBindPrefix[prop];
                                    }
                                    add = true;
                                    return;
                                }
                                else { 
                                    // Create type
                                    auxInfo[concatenate('0', '-', model.id)] = model; // First model of the just created type
                                    auxType[type] = auxInfo;
                                    auxPrefix[prefix] = Object.assign(snapshot.val()[prefix], auxType);
                                    refDevComp.update(auxPrefix);
                                    add = true;
                                    /* Delete aux objects */
                                    for (const prop of Object.getOwnPropertyNames(auxInfo)) {
                                        delete auxInfo[prop];
                                    }
                                    for (const prop of Object.getOwnPropertyNames(auxType)) {
                                        delete auxType[prop];
                                    }
                                    for (const prop of Object.getOwnPropertyNames(auxPrefix)) {
                                        delete auxPrefix[prop];
                                    }
                                    add = true;
                                    return;
                                }
                            }
                            else {
                                // Create prefix
                                auxInfo[concatenate('0', '-', model.id)] = model;// First model of the just created type
                                auxType[type] = auxInfo;
                                auxPrefix[prefix] = auxType;
                                refDevComp.update(auxPrefix);
                                add = true;  
                                for (const prop of Object.getOwnPropertyNames(auxType)) {
                                    delete auxInfo[prop];
                                }
                                for (const prop of Object.getOwnPropertyNames(auxPrefix)) {
                                    delete auxType[prop];
                                }
                                return; 
                            } 
                        }
                        else {
                            throw new DatabaseException('Null Snapshot');
                        }
                    });
                    modelKeys.prefixCompany = prefix;
                    modelKeys.type = type;
                    
                    /* $loaded function:
                     * Returns a promise which is resolved when the initial object data has been 
                     * downloaded from the database. The promise resolves to the $firebaseObject itself.
                     */
                    modelList.$loaded().then(() => {
                        /* $add function:
                         * Creates a new record in the database and adds the record to our 
                         * local synchronized array.
                         * This method returns a promise which is resolved after data has been 
                         * saved to the server. The promise resolves to the Firebase reference 
                         * for the newly added record, providing easy access to its key.
                         */
                        swal({
                            title: concatenate('Thse ', compType[model.id], ' has been added successfully!\n'),
                            icon: 'success',
                            button: false,
                            timer: 3000
                        });
                        modelList.$add(modelKeys).then((ref) => {
                        });
                        setTimeout(() => {
                            routeSync();
                        }, 3000); 
                    });
                });
            });
        });
    };
}]);
