import DeviceStore from '../stores/DeviceStore';
import Dialog from 'material-ui/Dialog';
import * as DropActions from '../actions/DropActions';
import FlatButton from 'material-ui/FlatButton';
import { List, ListItem } from 'material-ui/List';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import React from 'react';
import TextField from 'material-ui/TextField';
import Snackbar from 'material-ui/Snackbar';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import Paper from 'material-ui/Paper';
import Subheader from 'material-ui/Subheader';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from 'material-ui/Toolbar';
import RaisedButton from 'material-ui/RaisedButton';
import * as backend from '../backend/backend';

const style = {
    display: 'inline-block',
    float: 'left',
};

const subHeaderStyle = {
    fontSize: '20px',
    color: 'black'
};

/* Help menu */
function readSingleFile(e) {
    const file = e.target.files[0];
    const fileEnding = e.target.value.match(new RegExp('\\..*'))[0];

    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const contents = e.target.result;

        switch (fileEnding) {
            case '.rdf':
                backend.fire_ajax_import('rdfxml', contents);
                break;

            case '.ttl':
                backend.fire_ajax_import('turtle', contents);
                break;

            default:
                DropActions.importModel(JSON.parse(contents));
        }
    };
    reader.readAsText(file);
}

function loadModel(key) {
    //console.log('Key by the user: ', key);
    const refSavedModels = firebase.database().ref('savedModels');
    const refInfoSaved = firebase.database().ref('infoSavedModels');
    const auxInfoSaved = {};
    refSavedModels.on("value", (snapshot) => {
        //console.log('Value: ', snapshot.val()[key]);
        DeviceStore.setModel(JSON.parse(snapshot.val()[key]));
        /* Save the info of the last loaded model */
        auxInfoSaved.lastLoadedModel = key;
        refInfoSaved.update(auxInfoSaved);
    });
}

function importModel() {
    document.getElementById('import-model').click();
}

function exportModel(exportType) {
    let response = '';

    switch (exportType) {
        case '.ttl':
            response = backend.fire_ajax_export('turtle', DeviceStore.getModel());
            break;

        case '.rdf':
            response = backend.fire_ajax_export('rdfxml', DeviceStore.getModel());
            break;

        default:
            response = JSON.stringify(DeviceStore.getModel());
    }


    const tempDate = new Date();
    const file = new Blob([response]);
    const exportLink = document.getElementById('export-model');
    exportLink.href = URL.createObjectURL(file);
    exportLink.download = `iot_model_${  tempDate.getTime()  }${exportType}`;
    exportLink.click();
}

export default class NavigationBar extends React.Component {
    constructor(props) {
        super(props);
        this.exportModel = this.exportModel.bind(this);
        this.state = {
            openSaveModelAs: false,
            openLoadModel: false,
            openExport: false,
            openHelp: false,
            modelName: '',
            modeType: '',
            savedModels: [],
            saveButtonDisabled: true,
            errorText: null,
            snackBarSaveOpen: false
        };
    }

    /* Open UI when the user clicks on the Load button */
    getSavedModels = () => {
        let auxKeysSavedModels = [];
        const ref = firebase.database().ref('savedModels/');
        ref.on("value", (snapshot) => { // The whole object savedModels with all the saved models
            for (let saved in snapshot.val()) {
                auxKeysSavedModels.push(saved);
                //console.log('Key: ', saved);
            }
            this.setState({ savedModels: auxKeysSavedModels });
        });
    };

    handleCloseSaveModelAs = () => {
        this.setState({
            openSaveModelAs: false,
            saveButtonDisabled: true,
            errorText: null,
            modelName: ''
        });
    };

    handleOpenLoadModel = () => {
        this.getSavedModels();
        this.setState({ openLoadModel: true }); // Make the pop-up with the saved models show up
    };

    handleCloseLoadModel = () => {
        this.setState({ openLoadModel: false });
    };

    handleOpenExport = () => {
        this.setState({ openExport: true }); // Open the box with the options
    };

    handleCloseExport = () => {
        this.setState({ openExport: false });
    };

    handleOpenHelp = () => {
        this.setState({ openHelp: true });
    };

    handleCloseHelp = () => {
        this.setState({ openHelp: false });
    }

    handleCloseSnackBar = () => {
        this.setState({ snackBarSaveOpen: false });
    };

    handleSaveModelAs = () => {
        let response = false;
        if (this.state.modelName !== '') {
            response = backend.fire_ajax_save(this.state.modelName, DeviceStore.getModel());
        }
        if (response === true) {
            this.setState({ snackBarSaveOpen: true });
        }         
        else {
            this.setState({ snackBarSaveOpen: false });
        }
    };

    /* Method for handling the export action:
     * The Frontend receives the model from the backend, 
     * then write it into a file and the user can download it */
    exportModel = () => {
        const tempDate = new Date();
        const file = new Blob(DeviceStore.getExport());
        const exportLink = document.getElementById('export-model');
        exportLink.href = URL.createObjectURL(file);
        exportLink.download = `iot_model_${  tempDate.getTime()  }${this.state.exportType}`;
        exportLink.click();
    };

    handleOpenSaveModel = () => { 
        const refInfoSaved = firebase.database().ref('infoSavedModels');
        const refSavedModels = firebase.database().ref('savedModels/');
        let auxSavedModels = {};
        refInfoSaved.on("value", (snapshot) => {
            //console.log('Last loaded info: ', snapshot.val().lastLoadedModel);
            auxSavedModels[snapshot.val().lastLoadedModel] = JSON.stringify(DeviceStore.getModel()); /* key:last_loaded_model, 
                                                                                                      * value: current model on the digital twin */
            refSavedModels.update(auxSavedModels); // Update the current model on the database
            backend.fire_ajax_save(snapshot.val().lastLoadedModel, DeviceStore.getModel()); /* The DevicesWithSubsystems.lastLoadedModel is overwritten
                                                                                            *  with the current information on the digital twin */
        });
        swal({
            title: 'The current model has been saved',
            timer: 1500,
            showConfirmButton: false
        });
    };

    handleOpenSaveModelAs = () => { //It should be placed after getSavedModels
        this.setState({ openSaveModelAs: true });
    };

    /* Method for checking whether the input field on 'Save' is empty.
     * Also, it might disable the save button */
    isSaveButtonDisabled = () => {
        if (this.state.modelName === '') {
            this.setState({ saveButtonDisabled: true });
            this.setState({ errorText: "Model's name can not be empty!" });
        }         
        else {
            this.setState({ saveButtonDisabled: false });
            this.setState({ errorText: null });
        }
    };

    render() {
        const actionsSaveModelAs = [
            <FlatButton label="Cancel" onTouchTap={this.handleCloseSaveModelAs} />,
            <FlatButton
                label="Save As" primary disabled={this.state.saveButtonDisabled}  // disable the button
                onTouchTap={() => { this.handleSaveModelAs(); this.handleCloseSaveModelAs(); }}
            />
        ];

        const actionsLoadModel = [
            <FlatButton label="Cancel" primary onTouchTap={this.handleCloseLoadModel} />
        ];

        const actionsExport = [
            <FlatButton label="Cancel" onTouchTap={this.handleCloseExport} />
        ];

        const actionsHelp = [
            <FlatButton label="Close" onTouchTap={this.handleCloseHelp} />
        ];

        if (this.state.openSaveModelAs) {
            document.body.addEventListener('keyup', this.handleKeysSaveModelAs);
        }         
        else {
            document.body.removeEventListener('keyup', this.handleKeysSaveModelAs);
        }

        return (
            <MuiThemeProvider>
                <div>
                    <Toolbar>
                        <ToolbarGroup firstChild>
                            <RaisedButton label="Save" onClick={this.handleOpenSaveModel} primary />
                            <RaisedButton label="Save As" onClick={this.handleOpenSaveModelAs} primary />
                            <RaisedButton label="Load" onClick={this.handleOpenLoadModel} primary />
                            <RaisedButton label="Export" onClick={this.handleOpenExport} primary />
                            <RaisedButton label="Import" onClick={importModel} primary />
                            <RaisedButton label="Clear" onClick={DropActions.clearDevices} secondary />
                        </ToolbarGroup>

                        <ToolbarGroup>
                            <ToolbarSeparator />
                            <RaisedButton label="Help" onClick={this.handleOpenHelp} primary />
                        </ToolbarGroup>
                    </Toolbar>


                    <Dialog // Dialog for saving action
                        id="dialog-save-model"
                        title="Save As"
                        actions={actionsSaveModelAs}
                        modal={false}
                        open={this.state.openSaveModelAs}
                        onRequestClose={this.handleCloseSaveModelAs}
                    >
                        <TextField // Text field for entering model's name onto the save action
                            value={this.state.modelName}
                            onChange={(e) => {
                                this.setState({ modelName: e.target.value });
                            }}
                            hintText="Model's Name"
                            floatingLabelText="Enter Model's Name"
                            onBlur={this.isSaveButtonDisabled} // Check for emptiness of input
                            errorText={this.state.errorText}
                        />
                    </Dialog>

                    <Snackbar // Dialog for confation of a successful save
                        open={this.state.snackBarSaveOpen}
                        message="The model has been saved"
                        autoHideDuration={1500}
                        onRequestClose={this.handleCloseSnackBar}
                    />

                    <Dialog // Dialog for loading an action
                        title="Load"
                        actions={actionsLoadModel}
                        modal={false}
                        open={this.state.openLoadModel}
                        autoScrollBodyContent // Enable scrollable here
                        onRequestClose={this.handleCloseLoadModel}
                    >
                        <List>
                            {this.state.savedModels.map(model => (
                                <ListItem
                                    onClick={(e) => { loadModel(model); this.handleCloseLoadModel(); }}
                                    key={this.state.savedModels.indexOf(model)}
                                    primaryText={model}
                                />
                            ))}
                        </List>
                    </Dialog>

                    <Dialog // Dialog for exporting action
                        title="Export"
                        actions={actionsExport} // THE OPTIONS?
                        modal={false}
                        open={this.state.openExport}
                        onRequestClose={this.handleCloseExport}
                    >

                        <List>
                            <ListItem onClick={() => { exportModel('.rdf'); this.handleCloseExport(); }} primaryText="rdf/xml" />
                            <ListItem onClick={() => { exportModel('.jsonld'); this.handleCloseExport(); }} primaryText="json-ld" />
                            <ListItem onClick={() => { exportModel('.ttl'); this.handleCloseExport(); }} primaryText="turtle" />
                        </List>
                    </Dialog>

                    <Dialog  // Dialog for help
                        title="Help"
                        actions={actionsHelp}
                        modal={false}
                        open={this.state.openHelp}
                        onRequestClose={this.handleCloseHelp}
                        autoScrollBodyContent
                    >
                        <Paper style={style} >
                            <Menu desktop width={512} >
                                <Subheader style={subHeaderStyle}>Buttons</Subheader>
                                <Divider />
                                    <MenuItem primaryText="Save" secondaryText="Save the Current Model" />
                                    <MenuItem primaryText="Save as" secondaryText="Save Created Model with a New Id" />
                                    <MenuItem primaryText="Load" secondaryText="Load Previously Saved Model" />
                                    <MenuItem primaryText="Export" secondaryText="Export Model" />
                                    <MenuItem primaryText="Import" secondaryText="Import Model" />
                                    <MenuItem primaryText="Clear" secondaryText="Clear Drop Zone" />
                                    <Subheader style={subHeaderStyle}>Mouse Commands</Subheader>
                                <Divider />
                                    <MenuItem primaryText="Create Device" secondaryText="Drag Device From The 'Palette' To Grid Zone" />
                                    <MenuItem primaryText="Create Subdevice" secondaryText="Drag Subdevice Onto Other Device" />
                                    <MenuItem primaryText="Select Device" secondaryText="Click On Device" />
                                    <MenuItem primaryText="Unselect Device" secondaryText="Click Outside Of Device" />
                                <Divider />
                                    <Subheader style={subHeaderStyle}>Key Commands</Subheader>
                                <Divider />
                                <MenuItem primaryText="Unselect Device" secondaryText="ESC" />
                                <MenuItem primaryText="Delete Device" secondaryText="DEL" />
                                <MenuItem primaryText="Commit Dialog" secondaryText="Enter" />
                                <MenuItem primaryText="Close Dialog" secondaryText="ESC" />
                            </Menu>
                        </Paper>
                    </Dialog>
                    <input id="import-model" type="file" name="name" style={{ display: 'none' }} onChange={readSingleFile} />
                    <a id="export-model" href="" style={{ display: 'none' }} download />
                </div>
            </MuiThemeProvider>
        );
    }
}
