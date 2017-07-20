
var allIcons = {}; //Object with the icons of the devices (basis 64)
var obj_identification = {};
var obj_properties = {};
const default_properties = [
    "id",
    "imageFile",
    "ontology",
    "owlRestriction",
    "prefixCompany",
    "rdfsComment",
    "type",
    "userUid"];
const lstComponenents = {
    Device: [], // list_infos_Devices.type == "Device"
    SensingDevice: [], // list_infos_devices.type == "SensingDevice"
    ActuatingDevice: [], // list_infos_devices.type == "ActuatingDevice"
};


/*********************************************************/
/************************ Objects ************************/
/*********************************************************/

/* Object with default context indormation
 * The default information should have all properies defined
 */
function objContext (elementDefaultContext) {
    this.geo = elementContext.geo;
    this["m3-lite"] = elementContext["m3-lite"];
    this.owl = elementContext.owl;
    this.qu = elementContext.qu;
    this["qu-rec20"] = elementContext["qu-rec20"];
    this.rdf = elementContext.rdf;
    this.rdfs = elementContext.rdfs;
    this.ssn = elementContext.ssn;
    this.time = elementContext.time;
    this.xsd = elementContext.xsd;
    this["iot-lite"] = elementContext["iot-lite"];
    // For non-default information, another method is called
}

/* Object with identification information about a device or component,
 * as id, type and additional properties
 */
function identificationDevice (elementIdentDevice, elementRdfsSubClassOf) {
    this["@id"] = elementIdentDevice.id;
    this["@type"] = elementIdentDevice.type;
    this["rdfs:subClassOf"] = elementRdfsSubClassOf; // List of objects with information as type, number of pins, and so on
}

/* This object contains information as how many pins the device/component has
 */
function propertiesDevice (elementPropertiesDevice) { //, elementObjOwlOnProperty, elementObjOwlOnCardinality
    this["@id"] = elementPropertiesDevice[0]; //CHECK IF CAN BE "ipvs:RaspberryPi3-numberOfPins"
    this["@type"] = elementPropertiesDevice[1];
    this["rdfs:comment"] = elementPropertiesDevice[2];
    /* The properties onProperty and cardinality will be update after the
     *     creation of the object
     */
}


/*****************************************************/
/********************** Functions ********************/
/******* to create/update definitions' objects *******/
/*****************************************************/

/* Function to create/update the object context
 * @parameters:
 * @return: Object: @context for definitions
 */
function createUpdateContext (elementDefaultContext, elementExtraContext) {
    let this_context = {} // IoT object for the @context information (in definitions)
    this_context = new objContext(elementDefaultContext); // Creating an object with default IoT information

    // Updating the created object with extra information in random properties
    for (var property in elementExtraContext) { // property isn't known beforehand
        if (elementExtraContext.hasOwnProperty(property)) {
            this_context[property.toString()] = elementExtraContext[property];
        }
    }
    return this_context; // Object @context
}

/* Function to create/update the object context
 * @parameters: List: with of objects that composes the default part of @graph
 * @return: Object: @graph for definitions, which is updated with devices and
 *          components by other functions
 */
function createGraph (elementDefaultGraph) {
    let this_graph = []; // IoT List for the @graph information (in definitions)
    this_graph.push(elementDefaultGraph); // Updating the IoT graph list of the definitions
    // The storing of devices/components in the graph will be made by the manipulation of the data from thedatabase
    return this_graph;
}

/* Function to create the list rdfs
 *     this list contains at least one object:
 *         -> One with the information about the ontology and the type of the device or component
 *     also, it might have more objects. The amount of other objects depends on
 *         the number of additional properties that the device/component has.
 * This function is called for each device/component, and the device might have
 *     more than one additional property.
 * If the device/component has on or more properties, a function for just
 *     updating the inner object ought be called to insert the properties'
 *     objects into the rdfs list.
 * @parameters: String: ontology, String: type (both retrieved from the database)
 * @return: List: The rdfs list with the identification information (only one object pushed)
 */
function createRdfs (elementOntology, elementType) {
    let this_ontology = elementOntology;
    let this_type = elementType;

    let aux_obj_type = {}; /* Key: "@id"
                            * Value: ontology:type
                            */
    let this_rdfsSubClassOf = [];

    aux_obj_type["@id"] = ("ssn".concat(":")).concat("Device");
    this_rdfsSubClassOf.push(aux_obj_type);
    return this_rdfsSubClassOf; /* This list will be the value for the key "rdfs:subClassOf" in
                 and                  *     the object identificationDevice
                                 */
}

/* Function used for updating the rdfs list with additional properties' objects
 * @parameters: List: current rdfs list, Object: childSnapshot, String: id of the additional property
 * @return: List: the rfds list with one object with a new property pushed into its
 */
function updateRdfsProperties (elementRdfsSubClassOf, elementChildSnapshot, elementIdProperty) {
    let this_rdfsSubClassOf = elementRdfsSubClassOf; /* Current rdfs list for a device/component on an iteration
                                                      *     inside the Firebase's parsing
                                                      */
    let this_prefix_company = elementChildSnapshot.prefixCompany;
    let this_id = elementChildSnapshot.id;
    let this_id_property = elementIdProperty;

    let aux_obj_properties = {}; /* Keys: "@id" for each property
                                  * Value of each key: prefixCompany:Id-id_property
                                  */
    aux_obj_properties["@id"] = (((this_prefix_company.concat(":")).concat(this_id)).concat("-")).concat(this_id_property);
    this_rdfsSubClassOf.push(aux_obj_properties);
    return this_rdfsSubClassOf; // Updating the rdfs list with a additional property
}

/* Function to create the object of IoT Lite definitions
 * @parameters: Object: Iot Lite Context, List: Iot Lite Graph
 * @return: Object: definitions
 */
function createDefinitions(elementContext, elementGraph) {
    let this_definitions = {};
    this_definitions["@context"] = elementContext;
    this_definitions["@graph"] = elementGraph;
    return this_definitions; /* This object's gonna be stored on the browser's
                              *     local storage in each initialization of the
                              *     Platform
                              */
}

/*****************************************************/
/***************** Auxiliar Functions ****************/
/*****************************************************/

/* Function used to verify if a property is default (e.g.: Id) or additional (e.g.: Number of Pins)
 * @parameters: String: property
 * @return: Boolean: true->the property isn't default, false->the property is a default one
 */
function verifyAdditionalProperty(elementProperty_i) {
    let this_is_additional_property = true; // It'll be false just if the property has be found in the default properties' list
    for (var prop = 0; prop < default_properties.length; prop++) {
        if (elementProperty_i.toUpperCase() == default_properties[prop].toUpperCase()) { // the property is a default one
            this_is_additional_property = false; // This means property_i is in the list of default properties
        }
        else {
            continue; // Don't set the variable up to one because all the list of default properties ought to be checked
        }
    }
    return this_is_additional_property;
}

/* Function used to verify if a value is a Integer or not
 * @parameters: Data type
 * @return: Boolean: true->if the data is a non-negative-integer, false->another type of data
 */
function isNonNegativeInteger(elementValue){
    return (typeof elementValue == 'number' && elementValue%1 == 0 && elementValue > 0);
}

/*****************************************************/
/************** Database's manipulation **************/
/*****************************************************/

/* Object Component
 */
function Component(element) {
    this.numberOfPins = element.numberOfPins;
    this.id = element.id;
    this.iconComponentKey = element.imageFile; // This key is used to access the correct image in the another data structure
    this.ownerUser = element.userUid;
}

/* Function which is called for each device/component in worder to create a new
 *     object with their information
 */
function createComponent(element) {
    //if element.type is definied
    return lstComponenents[element.type].push(new Component(element)); // returns a promise
}

/* Reading data from the database (key: images)
 */
firebase.database().ref("images").orderByKey().once("value")
.then(function(snapshot) { // after function(snapshot)
    snapshot.forEach(function(childSnapshot) {
        allIcons[childSnapshot.key] = childSnapshot.val();
        localStorage.setItem(childSnapshot.key, childSnapshot.val());
    });
});

/* Reading data from the database (key: "models")
 */
firebase.database().ref("models").orderByKey().once("value")
.then(function(snapshot) { // after function(snapshot), snapshot is the whole data structure
    //var at_context = createUpdateContext (defaultContext, extraContext);
    //var at_graph = createGraph (defaultGraph);
    snapshot.forEach(function(childSnapshot) {  // Loop into database's information
    //var key = childSnapshot.key;
        switch (childSnapshot.val().type) {
            case "Device":
                let rdfsSubClassOf;
                rdfsSubClassOf = createRdfs (childSnapshot.val().ontology, childSnapshot.val().type);
                let is_add_property;
                /* Starting to get the additional properties of the device/
                 *     component with the key childSnapshot.key
                 */
                for (var property_i in childSnapshot.val()) {
                    if((childSnapshot.val()).hasOwnProperty(property_i)) { // This will check all properties' names on database's key
                        is_add_property = verifyAdditionalProperty(property_i);
                        if (is_add_property == true) {
                            rdfsSubClassOf = updateRdfsProperties (rdfsSubClassOf, childSnapshot.val(), property_i)
                            let auxObjAddProperty = {}; // Auxiliar object for an additional property which will be pushed on thr @graph list
                            let childSnapshotVal_owlRestriction;
                            let auxObj_OwlOnProperty = {};
                            let auxObj_owlCardinality = {};

                            // If the ownRestriction is empty is because the user has prefered the default option for this IoT Lite information
                            childSnapshot.val().owlRestriction == "" ? childSnapshotVal_owlRestriction="owl:Restriction" : childSnapshotVal_owlRestriction=childSnapshot.val().owlRestriction;

                            /* Example:
                             *     auxPropertiesDevice[0] -> 'ipvs' + ':' + 'RaspberryPi' + '-' + 'numberOfPins'
                             *     auxPropertiesDevice[1] -> "owl:Restriction" (default value in case of the user fill this box out with empty)
                             *     auxPropertiesDevice[1] -> "OWL restriction specifying the number of pins of a raspberry pi."
                             */
                            let auxPropertiesDevice = [
                                ((("ipvs").concat(":")).concat(childSnapshot.val().id)).concat("-").concat(property_i),
                                childSnapshotVal_owlRestriction,
                                childSnapshot.val().rdfsComment
                            ];

                            auxObj_OwlOnProperty["@id"] = (childSnapshot.val().prefixCompany.concat(":")).concat(property_i);
                            console.log("MY PROPERTY I HERE:: ", property_i);
                            auxObj_owlCardinality["@value"] = childSnapshot.val()[property_i.toString()];
                            // auxObj_owlCardinality["@type"]
                            isNonNegativeInteger(childSnapshot.val()[property_i.toString()])? auxObj_owlCardinality["@type"] = "xsd:nonNegativeInteger" : auxObj_owlCardinality["@type"] = "xsd:string";


                            auxObjAddProperty = new propertiesDevice(auxPropertiesDevice);
                            auxObjAddProperty["owl:onProperty"] = auxObj_OwlOnProperty;
                            auxObjAddProperty["owl:cardinality"] = auxObj_owlCardinality;

                            console.log("obj:: ", auxObjAddProperty);


                            //at_graph.push(auxObjAddProperty); // Adding a new property (related to a device) to the @graph

                            // , *elementObjOwlOnProperty, *elementObjOwlOnCardinality
                            /*

                            "owl:cardinality": {
                                "@value": "26",
                                "@type": "xsd:nonNegativeInteger"
                            }
                            */

                        }
                    }
                }
                createComponent(childSnapshot.val());
                localStorage.setItem(childSnapshot.key, childSnapshot.val().id); // Key:Id will be able to access from the whole application
                break;
            case "SensingDevice":
                createComponent(childSnapshot.val());
                localStorage.setItem(childSnapshot.key, childSnapshot.val().id);
                break;
            case "ActuatingDevice":
                createComponent(childSnapshot.val());
                localStorage.setItem(childSnapshot.key, childSnapshot.val().id);
                break;
            default:
                window.obj_identification = {};
                window.obj_properties = {};

                createComponent(childSnapshot.val());
                localStorage.setItem(childSnapshot.key, childSnapshot.val().id);
        }
    });
}).then(function(createComponent) { // then the firebase parsing (figure out how...)
    //var definitions = createDefinitions(objContext, objGraph);

    //var global = "across";
    //localStorage.setItem('text', lstComponenents.device["0"].id);
    console.log("THEN (IN CLIENT) ", lstComponenents.ActuatingDevice["0"].id); // Now the value isn't undefined
    var prefixIPVS = "ipvs:";
    var deviceOne = lstComponenents.Device["0"].id;
    var sensorOne = lstComponenents.SensingDevice["0"].id;
    var actuatorOne = lstComponenents.ActuatingDevice["0"].id;
    localStorage.setItem('device', deviceOne);
    localStorage.setItem('sensor', sensorOne);
    localStorage.setItem('actuator', actuatorOne);

    var defObject = {
        "@context": {
            "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
            "m3-lite": "http://purl.org/iot/vocab/m3-lite#",
            "owl": "http://www.w3.org/2002/07/owl#",
            "qu": "http://purl.org/NET/ssnx/qu/qu#",
            "qu-rec20": "http://purl.org/NET/ssnx/qu/qu-rec20#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "ssn": "http://purl.oclc.org/NET/ssnx/ssn#",
            "time": "http://www.w3.org/2006/time#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "iot-lite": "http://purl.oclc.org/NET/UNIS/fiware/iot-lite#",
            "ipvs": "http://www.ipvs.uni-stuttgart.de/iot-lite#",
            "ipvs:hasPin": {
                "@id": "ipvs:hasPin",
                "@container": "@list"
            }
        },

        "@graph": [
            {
                "@id": "iot-lite:altRelative",
                "@type": "owl:AnnotationProperty",
                "rdfs:domain": {
                    "@id": "geo:Point"
                },
                "rdfs:range": {
                    "@id": "xsd:string"
                }
            },
            {
                "@id": "geo:alt",
                "@type": "owl:AnnotationProperty",
                "rdfs:domain": {
                    "@id": "geo:Point"
                }
            },
            {
                "@id": "iot-lite:Service",
                "@type": "owl:Class",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "Service provided by an IoT Device"
                }
            },
            {
                "@id": "iot-lite:exposedBy",
                "@type": "owl:ObjectProperty",
                "rdfs:comment": "A device is exposed by a service.",
                "rdfs:domain": {
                    "@id": "ssn:Device"
                },
                "rdfs:range": {
                    "@id": "iot-lite:Service"
                }
            },
            {
                "@id": "iot-lite:endpoint",
                "@type": "owl:DatatypeProperty",
                "rdfs:comment": "Endpoint of the service. It is usually a URL where the service is available.",
                "rdfs:domain": {
                    "@id": "iot-lite:Service"
                },
                "rdfs:range": {
                    "@id": "xsd:anyURI"
                }
            },
            {
                "@id": "geo:location",
                "@type": "owl:ObjectProperty",
                "rdfs:range": {
                    "@id": "geo:Point"
                }
            },
            {
                "@id": "iot-lite:isAssociatedWith",
                "@type": "owl:ObjectProperty",
                "rdfs:comment": "Defines the associations between objects and sensors (e.g. A table (object) has an attribute (temperature at the table) which is associated with a sensor (the temperature sensor of the room). ",
                "rdfs:domain": [
                    {
                        "@id": "iot-lite:Object"
                    },
                    {
                        "@id": "iot-lite:Entity"
                    }
                ],
                "rdfs:range": {
                    "@id": "iot-lite:Service"
                }
            },
            {
                "@id": "iot-lite:VirtualEntity",
                "@type": "owl:Class",
                "rdfs:subClassOf": {
                    "@id": "iot-lite:Entity"
                }
            },
            {
                "@id": "iot-lite:interfaceType",
                "@type": "owl:DatatypeProperty",
                "rdfs:comment": "Defines the type of interface of the service endpoint.",
                "rdfs:domain": {
                    "@id": "iot-lite:Service"
                },
                "rdfs:range": {
                    "@id": "xsd:string"
                }
            },
            {
                "@id": "iot-lite:Attribute",
                "@type": "owl:Class",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "An attribute of an IoT object that can be exposed by an IoT service (i.e. a room (IoT Object) has a temperature (Attribute), that can be exposed by a temperature sensor (IoT device)."
                }
            },
            {
                "@id": "ssn:SensingDevice",
                "@type": "owl:Class",
                "rdfs:subClassOf": [
                    {
                        "@id": "ssn:Sensor"
                    },
                    {
                        "@id": "ssn:Device"
                    }
                ]
            },
            {
                "@id": "iot-lite:hasMetadata",
                "@type": "owl:ObjectProperty",
                "rdfs:comment": "Links any concept with metadata about that concept.",
                "rdfs:range": {
                    "@id": "iot-lite:Metadata"
                }
            },
            {
                "@id": "ssn:Platform",
                "@type": "owl:Class"
            },
            {
                "@id": "qu:Unit",
                "@type": "owl:Class"
            },
            {
                "@id": "iot-lite:metadataValue",
                "@type": "owl:DatatypeProperty",
                "rdfs:comment": "Value of the metadata",
                "rdfs:domain": {
                    "@id": "iot-lite:Metadata"
                },
                "rdfs:range": {
                    "@id": "xsd:string"
                }
            },
            {
                "@id": "iot-lite:hasAttribute",
                "@type": "owl:ObjectProperty",
                "rdfs:comment": "Links the devices with their attributes.",
                "rdfs:domain": [
                    {
                        "@id": "iot-lite:Object"
                    },
                    {
                        "@id": "iot-lite:Entity"
                    }
                ],
                "rdfs:range": {
                    "@id": "iot-lite:Attribute"
                }
            },
            {
                "@id": "iot-lite:interfaceDescription",
                "@type": "owl:DatatypeProperty",
                "rdfs:comment": "Description of the service.",
                "rdfs:domain": {
                    "@id": "iot-lite:Service"
                },
                "rdfs:range": {
                    "@id": "xsd:anyURI"
                }
            },
            {
                "@id": "iot-lite:Object",
                "@type": "owl:Class",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "IoT entity"
                }
            },
            {
                "@id": "iot-lite:relativeLocation",
                "@type": "owl:AnnotationProperty",
                "rdfs:domain": {
                    "@id": "geo:Point"
                },
                "rdfs:range": {
                    "@id": "xsd:string"
                }
            },
            {
                "@id": "iot-lite:",
                "@type": "owl:Ontology",
                "owl:versionInfo": "0.3 fiesta",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "iot-lite is a lightweight ontology based on SSN to describe Internet of Things (IoT) concepts and relationships."
                },
                "rdfs:label": "iot-lite"
            },
            {
                "@id": "iot-lite:metadataType",
                "@type": "owl:DatatypeProperty",
                "rdfs:comment": "Defines the type pf the metadata value (e.g. resolution of the sensor).",
                "rdfs:domain": {
                    "@id": "iot-lite:Metadata"
                },
                "rdfs:range": {
                    "@id": "xsd:string"
                }
            },
            {
                "@id": "ssn:System",
                "@type": "owl:Class"
            },
            {
                "@id": "geo:Point",
                "@type": "owl:Class",
                "geo:alt": "",
                "geo:lat": "",
                "geo:long": "",
                "iot-lite:altRelative": "",
                "iot-lite:relativeLocation": ""
            },
            {
                "@id": "qu:QuantityKind",
                "@type": "owl:Class"
            },
            {
                "@id": "ssn:hasSubSystem",
                "@type": "owl:ObjectProperty",
                "rdfs:domain": {
                    "@id": "ssn:System"
                },
                "rdfs:range": {
                    "@id": "ssn:System"
                }
            },
            {
                "@id": "iot-lite:Metadata",
                "@type": "owl:Class",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "Class used to describe properties that cannot be described by QuantityKind and Units. i.e. the resolution of a sensor."
                }
            },
            {
                "@id": "iot-lite:Polygon",
                "@type": "owl:Class",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "The coverage is made up by linking several points by strait lines."
                },
                "rdfs:subClassOf": {
                    "@id": "iot-lite:Coverage"
                }
            },
            {
                "@id": "iot-lite:radius",
                "@type": "owl:DatatypeProperty",
                "rdfs:comment": "Specifies the radius of a circle coverage defined by a point -the center of the circle- and its radius.",
                "rdfs:domain": {
                    "@id": "iot-lite:Circle"
                },
                "rdfs:range": {
                    "@id": "xsd:double"
                }
            },
            {
                "@id": "geo:lat",
                "@type": "owl:AnnotationProperty",
                "rdfs:domain": {
                    "@id": "geo:Point"
                }
            },
            {
                "@id": "iot-lite:Coverage",
                "@type": "owl:Class",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "The coverage of an IoT device (i.e. a temperature sensor inside a room has a coverage of that room)."
                }
            },
            {
                "@id": "iot-lite:TagDevice",
                "@type": "owl:Class",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "Tag Device such as QR code or bar code."
                },
                "rdfs:subClassOf": {
                    "@id": "ssn:Device"
                }
            },
            {
                "@id": "iot-lite:exposes",
                "@type": "owl:ObjectProperty",
                "owl:inverseOf": {
                    "@id": "iot-lite:exposedBy"
                },
                "rdfs:comment": "For service-oriented queries. The inverse of exposedBy.",
                "rdfs:domain": {
                    "@id": "iot-lite:Service"
                },
                "rdfs:range": {
                    "@id": "ssn:Device"
                }
            },
            {
                "@id": "ssn:onPlatform",
                "@type": "owl:ObjectProperty",
                "rdfs:domain": {
                    "@id": "ssn:System"
                },
                "rdfs:range": {
                    "@id": "ssn:Platform"
                }
            },
            {
                "@id": "iot-lite:Entity",
                "@type": "owl:Class",
                "owl:equivalentClass": {
                    "@id": "iot-lite:Object"
                }
            },
            {
                "@id": "iot-lite:hasSensingDevice",
                "@type": "owl:ObjectProperty",
                "rdfs:comment": "Links a sensor with a sensing device the same way as SSN.",
                "rdfs:domain": {
                    "@id": "ssn:Sensor"
                },
                "rdfs:range": {
                    "@id": "ssn:SensingDevice"
                }
            },
            {
                "@id": "iot-lite:hasCoverage",
                "@type": "owl:ObjectProperty",
                "rdfs:comment": "Links the devices with their coverages.",
                "rdfs:domain": {
                    "@id": "ssn:Device"
                },
                "rdfs:range": {
                    "@id": "iot-lite:Coverage"
                }
            },
            {
                "@id": "iot-lite:isSubSystemOf",
                "@type": "owl:ObjectProperty",
                "owl:inverseOf": {
                    "@id": "ssn:hasSubSystem"
                },
                "rdfs:domain": {
                    "@id": "ssn:System"
                },
                "rdfs:range": {
                    "@id": "ssn:System"
                }
            },
            {
                "@id": "ssn:Sensor",
                "@type": "owl:Class"
            },
            {
                "@id": "iot-lite:hasQuantityKind",
                "@type": "owl:ObjectProperty",
                "rdfs:comment": "Links a sensor or an attribute with the quantity  kind it measures (e.g. A sensor -sensor1- measures temperature: sensor1 hasQuantityKind temperature).",
                "rdfs:domain": [
                    {
                        "@id": "iot-lite:Attribute"
                    },
                    {
                        "@id": "ssn:Sensor"
                    }
                ],
                "rdfs:range": {
                    "@id": "qu:QuantityKind"
                }
            },
            {
                "@id": "iot-lite:hasUnit",
                "@type": "owl:ObjectProperty",
                "rdfs:comment": "Links the sensor with the units of the quantity kind it measures (e.g. A sensor -sensor1- measures temperature in Celsius: senso1 hasUnit celsius).",
                "rdfs:domain": {
                    "@id": "ssn:Sensor"
                },
                "rdfs:range": {
                    "@id": "qu:Unit"
                }
            },
            {
                "@id": "iot-lite:Rectangle",
                "@type": "owl:Class",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "Teh coverage is made up by giving two points which are the oposite corners of a rentangle."
                },
                "rdfs:subClassOf": {
                    "@id": "iot-lite:Coverage"
                }
            },
            {
                "@id": "iot-lite:id",
                "@type": "owl:DatatypeProperty",
                "rdfs:domain": {
                    "@id": "ssn:Device"
                },
                "rdfs:range": {
                    "@id": "xsd:string"
                }
            },
            {
                "@id": "geo:long",
                "@type": "owl:AnnotationProperty",
                "rdfs:domain": {
                    "@id": "geo:Point"
                }
            },
            {
                "@id": "iot-lite:Circle",
                "@type": "owl:Class",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "Circle coverage it needs the location of the sensor as the centre of the circle and the radius as a DataProperty."
                },
                "rdfs:subClassOf": {
                    "@id": "iot-lite:Coverage"
                }
            },
            {
                "@id": "ssn:Device",
                "@type": "owl:Class",
                "rdfs:subClassOf": {
                    "@id": "ssn:System"
                }
            },
            {
                "@id": "iot-lite:ActuatingDevice",
                "@type": "owl:Class",
                "rdfs:comment": {
                    "@language": "en",
                    "@value": "Device that can actuate over an object or QuantityKind."
                },
                "rdfs:subClassOf": {
                    "@id": "ssn:Device"
                }
            },
            {
                "@id": "iot-lite:isMobile",
                "@type": "owl:DatatypeProperty",
                "rdfs:domain": {
                    "@id": "ssn:Platform"
                },
                "rdfs:range": {
                    "@id": "xsd:boolean"
                }
            },























            //##### Extensions of IoT-Lite Scheme for own Device-Types #####################################################

            {
                "@id": "ipvs:macAddress",     // Define the MacAdress property as Attribute of RaspberryPi
                "@type": "owl:DatatypeProperty",
                "rdfs:domain":{
                    "@id":"ssn:Device"
                },
                "rdfs:range": {
                    //"@id": "ipvs:MacAdress"
                    "@id": "xsd:string"
                }
            },
            {
                "@id": "ipvs:numberOfPins",     // Define the MacAdress property as Attribute of RaspberryPi
                "@type": "owl:DatatypeProperty",
                "rdfs:comment": "To specify the number of pins on a device.",
                "rdfs:domain":{
                    "@id":"ssn:Device"
                },
                "rdfs:range": {
                    //"@id": "ipvs:MacAdress"
                    "@id": "xsd:nonNegativeInteger"
                }
            },
            {
                "@id": "ipvs:gpioMode",     // Define the MacAdress property as Attribute of RaspberryPi
                "@type": "owl:DatatypeProperty",
                "rdfs:comment": "To specify how the GPIO pin numbers are supposed to be interpreted.",
                "rdfs:domain":{
                    "@id":"ssn:Device"
                },
                "rdfs:range": {
                    //"@id": "ipvs:MacAdress"
                    "@id": "xsd:string"
                }
            },
            {
                "@id": "ipvs:modelNumber",     // Define the MacAdress property as Attribute of RaspberryPi
                "@type": "owl:DatatypeProperty",
                "rdfs:comment": "To specify whether it's a RPi model A or B.",
                "rdfs:domain":{
                    "@id":"ssn:Device"
                },
                "rdfs:range": {
                    //"@id": "ipvs:MacAdress"
                    "@id": "xsd:string"
                }
            },

			{
                "@id": sensorOne.toString(),          // Define a Raspberry Pi as SubClass of Device
                "@type": "owl:Class",
                "rdfs:comment": "Temperature Sensor with 3 pins. GND - 1, DQ - 2, VDD -3. Datasheet: https://datasheets.maximintegrated.com/en/ds/DS18B20.pdf",
                "rdfs:subClassOf": [
                    {
                        "@id": "ssn:SensingDevice"
                    }
                    ,
                    {
                        "@id": "ipvs:DS18B20TEST-hasPin"
                    }
                ]
            },
            {
                "@id": "ipvs:hasPin",     // Define the MacAdress property as Attribute of RaspberryPi
                "@type": "owl:DatatypeProperty",
                "rdfs:comment": "To list all pins of a device (sensor, actuator) and to what pins of the super-device they are connected to.",
                "rdfs:domain": {
                    "@id":"ipvs:Device"
                },
                "rdfs:range": {
                    "@id": "xsd:nonNegativeInteger"
                }
            },



            {
                "@id": deviceOne.toString(),          // Define a RaspberryPi as SubClass of Device //(prefixIPVS.concat(lstComponenents.actuator["0"].id)).toString()
                "@type": "owl:Class",
                "rdfs:subClassOf": [
                    {
                        "@id": "ssn:Device"
                    },
                    {
                        "@id" : "ipvs:RaspberryPi-numberOfPins"
                    }
                ]

            },

            {
                "@id" : "ipvs:RaspberryPi-numberOfPins",
                "@type": "owl:Restriction",
                "rdfs:comment": "OWL restriction specifying the number of pins of a raspberry pi.",
                "owl:onProperty": {
                    "@id": "ipvs:numberOfPins"
                },
                "owl:cardinality": {
                    "@value": "1",
                    "@type": "xsd:nonNegativeInteger"
                }
            },


            {
                "@id": "ipvs:actuatosnon",          // Define a RaspberryPi as SubClass of Device
                "@type": "owl:Class",
                "rdfs:comment": "TI Microcontrollor with 16 pins to drive up to two motors. Datasheet: http://www.ti.com/lit/ds/symlink/l293.pdf",
                "rdfs:subClassOf": [
                    {
                        "@id": "iot-lite:ActuatingDevice",
                        "@id": "iot-lite:ActuatingDevice"
                    },
                    {
                        "@id": "ipvs:L293D-hasPin"
                    }
                ]
            },












            {
                "@id": actuatorOne.toString(),          // Define a RaspberryPi as SubClass of Device
                "@type": "owl:Class",
                "rdfs:comment": "TI Microcontrollor with 16 pins to drive up to two motors. Datasheet: http://www.ti.com/lit/ds/symlink/l293.pdf",
                "rdfs:subClassOf": [
                    {
                        "@id": "iot-lite:ActuatingDevice"
                    },
                    {
                        "@id": "ipvs:L293D-hasPin"
                    }
                ]
            },














            {
                "@id" : "ipvs:DS18B20TEST-hasPin",
                "@type": "owl:Restriction",
                "owl:onProperty": {
                    "@id":"ipvs:hasPin"
                },
                "owl:cardinality": {
                    "@value": "3",
                    "@type": "xsd:nonNegativeInteger"
                }
            },

            {
                "@id" : "ipvs:L293D-hasPin",
                "@type": "owl:Restriction",
                "owl:onProperty": {
                    "@id":"ipvs:hasPin"
                },
                "owl:cardinality": {
                    "@value": "16",
                    "@type": "xsd:nonNegativeInteger"
                }
            }
        ] //close graph

    }; // close the object
    // Storing the object into the local storage |
    console.log(defObject);
    localStorage.setItem('defObject', JSON.stringify(defObject));

});

dashboard.controller("myaccountController", ['$rootScope', '$scope', '$state', '$location', 'dashboardService', 'Flash', '$firebaseArray','$firebaseAuth','$firebaseObject',
function ($rootScope, $scope, $state, $location, dashboardService, Flash, $firebaseArray, $firebaseAuth, $firebaseObject) {
    var vm = this;

    $scope.showAccountinfo = function(user) {
        $scope.show = true;
        $scope.Username = user.Username;
        $scope.Email = user.Email;
        $scope.addr = user.addr;
        $scope.id = user.$id;
    }

    /* Function to verify if a @Context has been set for the modelling environment */
    $scope.verifySettingDefaultContext = function() {
        //$scope.defaultContextIsSet = true; // Initialization of the flag variable
        var ref = firebase.database().ref('defaults/defaultcontext'); // Accesing the object context selected by the user
        var contextObj = $firebaseObject(ref);

        setTimeout(function() { // It works as a promise without using any function as parameter
            if (contextObj.$value.toString() == "") {
                $scope.defaultContextIsSet = false;
            }
            else {
                $scope.defaultContextIsSet = true;
            }
        }, 2000);
    }

    $scope.editFormSubmit = function() {
        var user = firebase.auth().currentUser;
        var ref = firebase.database().ref('users/'+$scope.id);
        var userDB = $firebaseObject(ref);

        userDB.$loaded().then(function(){
            userDB.Username = $scope.Username;
            userDB.addr = $scope.addr;
            userDB.Email = $scope.Email;
            userDB.$save().then(function(ref) {
            },
            function(error) {
                console.log("Error:", error);
            });
        });
        user.updateEmail($scope.Email);
    }

    $('#form_id').submit(function() {
        $('#editModal').modal('hide');
    });

}]);
