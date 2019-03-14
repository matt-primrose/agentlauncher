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
const os = require('os');
const { spawn } = require('child_process');
var agentLauncherVersion = '0.0.1';
var currPlatform = {};
var currArguments = {};
var actions = [/*"URL",*/ "AGENTS", "CLEANUP"];
// Execute based on incoming arguments
function run(argv) {
    var args = parseArguements(argv);
    currArguments = validateArguments(args);
    getPlatformInfo();
    if (currArguments.VALID == true) {
        if (currArguments.CLEANUP !== undefined) {
            // Cleanup agents
            cleanupAgents();
        } else {
            // Create Directory and deploy agents
            createDirectory(currArguments, function (data) {
                if (data > 0) {
                    exit(data);
                } else {
                    launchAgents(currArguments.AGENTS);
                }
            });
        }
    }
}
// Parse arguements that are needed and put them in an object.  Discards invalid argument keys
function parseArguements(argv) {
    var r = {};
    for (var i in argv) {
        i = parseInt(i);
        if ((argv[i].toUpperCase() == actions[0]) || (argv[i].toUpperCase() == actions[1]) || (argv[i].toUpperCase() == actions[2])) {
            var key = argv[i].toUpperCase();
            var val = true;
            if ((i + 1) < argv.length) {
                val = argv[i + 1];
            }
            r[key] = val;
        }
    } return r;
}
// Verify that all arguement parameters are valid
function validateArguments(args) {
    if (Object.keys(args).length !== 1) {
        consoleHelp();
        args['VALID'] = false;
        exit(1);
        return args;
    }
    if (Object.keys(args).length == 1) {
        args["AGENTS"] = parseInt(args["AGENTS"], 10);
        if (((args["CLEANUP"] === undefined) || (args["CLEANUP"] !== true)) && ((args["AGENTS"] === undefined) || (args["AGENTS"] === true) || (isNaN(args["AGENTS"])))) {
                consoleHelp();
                args['VALID'] = false;
                exit(1);
                return args;
        } else {
            args['VALID'] = true;
            return args;
        }
    }
}
// Exit code status return
function exit(status) {
    if (status == null) {
        status = 0;
    }
    try {
        console.log("exiting application with code: " + status);
        process.exit(status);
    } catch (e) { }
}

function consoleHelp() {
    console.log('Agent Launcher for MeshCentral 2.  Version: ' + agentLauncherVersion);
    console.log('No action or invalid action specified, use agentlauncher like this:\r\n');
    console.log('  agentlauncher [action] [arguments...]\r\n');
    console.log('Valid agentlauncher actions:\r\n');
    //console.log('  URL              - Sets the URL for the MeshCentral 2 Server to retrieve agents.  Use with Agents.');
    //console.log('                     Example: URL http://www.meshcentral.com');
    console.log('  Agents           - Sets the number of agents to launch locally.  Default is 1.  Use with URL.');
    console.log('                     Example: Agents 10');
    console.log('  Cleanup          - Removes agent directories and files.  Do not use with other arguments');
}

function getPlatformInfo() {
    currPlatform["PLATFORM"] = os.platform();
    currPlatform["RELEASE"] = os.release();
    return currPlatform;
}

function cleanupAgents() {
    var path = __dirname + '\\agents\\';
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + '\\' + file;
            console.log('checking if ' + curPath + ' is a directory');
            if (fs.lstatSync(curPath).isDirectory()) {
                console.log(curPath + ' is a directory');
                removeFiles(curPath);
                if (curPath !== path) {
                    fs.rmdirSync(curPath);
                }
            }
        });
        console.log('all files and folders cleaned up!');
    }
}

function removeFiles(path) {
    if (fs.existsSync(path)) {
        console.log('reading files from ' + path);
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + '\\' + file;
            console.log('removing ' + curPath);
            fs.unlinkSync(curPath);
        });
    }
}

function launchAgents(numAgents) {
    console.log('launching Agents');
    for (var i = 0; i < numAgents; i++){
        startAgent(i);
    }
}

// Start a single Windows agent
function startAgent(directory) {
    var path = __dirname + '\\agents\\';
    fs.readdir(path + '\\' + directory, function (err, items) {
        if (err) { exit(1); return; }
        var file; 
        console.log('Starting agent: ' + directory);
        items.forEach(function (fn) {
            switch (fn.substr(-3)) {
                // Linux Agent
                case '.sh':
                    file = fn;
                    break;
                // Windows Agent
                case 'exe':
                    file = fn;
                    break;
                default:
                    // Not the install file
                    break;
            }
        });
        var meshAgent = spawn(path + '\\' + directory + '\\' + file, ['run'], { stdio: 'inherit' }, (error) => {
            if (error) {
                console.log(error);
                exit(1);
            }
        });
        meshAgent.on('message', (message) => {
            process.stdout.write(message);
        });
        
    });
}

// Create agent install location
function createDirectory(args, callback) {
    var code = 0;
    var cwd = __dirname;
    fs.readdir(__dirname + '/agents/', function (err, items) {
        if (err) { exit(1); return; }
        for (var i = 0; i < args.AGENTS; i++) {
            if (!fs.existsSync(cwd + '/agents/' + i.toString())) {
                console.log('creating ' + i + ' directory');
                fs.mkdirSync(cwd + '/agents/' + i.toString());
                for (var x = 0; x < items.length; x++) {
                    if (!fs.existsSync(cwd + '/agents/' + i.toString() + '/' + items[x].toString())) {
                        console.log('copying ' + items[x].toString());
                        fs.copyFileSync(cwd + '/agents/' + items[x].toString(), cwd + '/agents/' + i.toString() + '/' + items[x].toString());
                    } else {
                        console.log('file ' + items[x].toString() + ' exists');
                    }
                }
            } else {
                console.log('directory ' + i + ' exists');
            }
        }
        callback(code);
    });
}

// Figure out if any arguments were provided, otherwise show help
if (process.argv.length > 2) {
    run(process.argv);
} else {
    consoleHelp();
    exit(1); return;
}