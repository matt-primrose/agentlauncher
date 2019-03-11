/*
Copyright 2018-2019 Intel Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/** 
* @description agentlauncher, command line tool for launching MeshCentral 2 agents.
* @author Matt Primrose
* @version v0.0.1
*/

'use strict';
const fs = require('fs');
const https = require('https');
const os = require('os');
const { spawn } = require('child_process');
var agentLauncherVersion = '0.0.1';
var currPlatform = {};
var runningAgents = {};
var actions = ["URL", "AGENTS", "STOP"];
// Execute based on incoming arguments
function run(argv) {
    var args = parseArguements(argv);
    var goodArgs = validateArguments(args);
    //console.log("arguments good? " + goodArgs);
    getPlatformInfo();
}
// Parse arguements that are needed and put them in an object.  Discards invalid argument keys
function parseArguements(argv) { var r = {}; for (var i in argv) { i = parseInt(i); if ((argv[i].toUpperCase() == actions[0]) || (argv[i].toUpperCase() == actions[1]) || (argv[i].toUpperCase() == actions[2])) { var key = argv[i].toUpperCase(); var val = true; if ((i + 1) < argv.length) { val = argv[i + 1]; } r[key] = val; } } return r; }
// Verify that all arguement parameters are valid
function validateArguments(args) { if ((Object.keys(args).length < 1) || (Object.keys(args).length > 2)) { consoleHelp(); exit(1); return; } if (Object.keys(args).length == 1) { if ((args["STOP"] === undefined) || (args["STOP"] !== true)) { consoleHelp(); exit(1); return; } } if (Object.keys(args).length == 2) { args["AGENTS"] = parseInt(args["AGENTS"], 10); if ((args["URL"] === undefined) || (args["URL"] === true) || (args["AGENTS"] === undefined) || (args["AGENTS"] === true) || (isNaN(args["AGENTS"]))) { consoleHelp(); exit(1); return; } } return true; }
// Exit code status return
function exit(status) { if (status == null) { status = 0; } try { console.log("exiting application with code: " + status); process.exit(status); } catch (e) { } }
// Download client agent and mesh policy from server
function getAgentFromServer(args) {

}

function consoleHelp() {
    console.log('Agent Launcher for MeshCentral 2.  Version: ' + agentLauncherVersion);
    console.log('No action or invalid action specified, use agentlauncher like this:\r\n');
    console.log('  agentlauncher [action] [arguments...]\r\n');
    console.log('Valid agentlauncher actions:\r\n');
    console.log('  URL              - Sets the URL for the MeshCentral 2 Server to retrieve agents.  Use with Agents.');
    console.log('                     Example: URL http://www.meshcentral.com');
    console.log('  Agents           - Sets the number of agents to launch locally.  Default is 1.  Use with URL.');
    console.log('                     Example: Agents 10');
    console.log('  Stop             - Stops all locally running MeshCentral 2 agents.  Do not use with other arguments.');
}

function getPlatformInfo() {
    currPlatform["PLATFORM"] = os.platform();
    currPlatform["RELEASE"] = os.release();
    return currPlatform;
}

function stopAgents() {
    fs.readFile('runningAgents.txt', (err, data) => {
        if (err) throw error;
        runningAgents = JSON.parse(data);
    });
    for (var i in runningAgents) {

    }
}

function lauchAgents(numAgents, location) {
    runningAgents = {};
    for (var i = 0; i < numAgents; i++){

    }
    fs.open('runningAgents.txt', JSON.stringify(runningAgents), (err) => {
        if (err) throw err;
        console.log('the file has been saved!');
    });
}

// Start a single agent
function startAgent(location) {
    // Install Agent as service in this location
    var options = {
        cwd: location
    };
    var meshAgent = spawn('MeshAgent-AgentLauncher.exe', ['-install'], options);
    meshAgent.stdout.on('data', (data) => {
        console.log('stdout: ${data}');
    });
    meshAgent.stderr.on('data', (data) => {
        console.log('stderr: ${data}');
    });
    meshAgent.on('close', (code) => {
        console.log('Mesh Agent process exited with code ${code}');
    });

}
// Stop a single agent
function stopAgent(location){
    // Stop Service
    var options = {
        cwd: location
    };
    var meshAgent = spawn('MeshAgent-AgentLauncher.exe', ['-uninstall'], options);
    meshAgent.stdout.on('data', (data) => {
        console.log('stdout: ${data}');
    });
    meshAgent.stderr.on('data', (data) => {
        console.log('stderr: ${data}');
    });
    meshAgent.on('close', (code) => {
        console.log('Mesh Agent process exited with code ${code}');
    });
    // Uninstall Agent from this location
}

// Figure out if any arguments were provided, otherwise show help
if (process.argv.length > 2) {
    run(process.argv);
} else {
    consoleHelp();
    exit(1); return;
}


// Stop all running MC2 agents
function stopAllAgents() {
    console.log('DEBUG: STOP command received');
    exit(0); return;
}

// Start up agents
function startAgents(args) {
    console.log('DEBUG: arguments\r\n');
    console.log('first argument:   ' + args['URL']);
    console.log('second argument:  ' + args['AGENTS']);
    exit(0); return;
}