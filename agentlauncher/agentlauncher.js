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
* @version v0.0.3
*/

'use strict';
const fs = require('fs');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');
var agentLauncherVersion = '0.0.3';
var actions = ['MESHID', 'URL', 'AGENTS', 'CLEANUP', 'TOGGLE'];
var errorCodes = ['No Error.', 'Platform not supported.', 'Arguement(s) not valid.']
var childProcesses = [];
// Execute based on incoming arguments
function run(argv) {
    // Parse the arguements from the command line
    parseArguements(argv, function (err, args) {
        if (err) { exit(err); return; }
        // Validate that the arguements are good
        validateArguments(args, function (err, currArguments) {
            if (err) { exit(err); return; }
            if (currArguments.VALID == true) {
                if (currArguments.CLEANUP !== undefined) {
                    // Cleanup agents
                    cleanupAgents(function (err, message) {
                        if (err) { exit(err); return; }
                        console.log(message);
                    });
                } else {
                    // Download agent and mesh file
                    var platInfo = getPlatformInfo();
                    //debugObjectCheck(platInfo);
                    var platID = getPlatID(platInfo);
                    //console.log('DEBUG: Platform ID: ' + platID);
                    downloadAgent(currArguments.URL, platID, function (err) {
                        if (err) {
                            exit(err);
                        } else {
                            // Parse mesh id from arguments and download mesh file from server
                            parseMeshID(currArguments, function (err, meshID) {
                                if (err) {
                                    exit(err);
                                }
                                downloadMeshFile(currArguments.URL, meshID, function (err) {
                                    if (err) {
                                        exit(err);
                                    }
                                    // Create Directory and deploy agents
                                    createDirectory(currArguments, function (err) {
                                        if (err) {
                                            exit(err);
                                        } else {
                                            launchAgents(currArguments.AGENTS, function (err) {
                                                if (err) {
                                                    exit(err);
                                                }
                                            });
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            }
        });
    });
}
// Parse arguements that are needed and put them in an object.  Discards invalid argument keys
function parseArguements(argv, callback) {
    var r = {};
    for (var i in argv) {
        i = parseInt(i);
        if ((argv[i].toUpperCase() == actions[0]) || (argv[i].toUpperCase() == actions[1]) || (argv[i].toUpperCase() == actions[2]) || (argv[i].toUpperCase() == actions[3]) || (argv[i].toUpperCase() == actions[4])) {
            var key = argv[i].toUpperCase();
            var val = true;
            if ((i + 1) < argv.length) { val = argv[i + 1]; }
            r[key] = val;
        }
    }
    callback(null, r);
}

function debugObjectCheck(object) { for (var i in object) { console.log('DEBUG: ' + i + ' : ' + object[i]); } }

// Verify that all arguement parameters are valid
function validateArguments(args, callback) {
    if (args["AGENTS"] !== undefined) { args["AGENTS"] = parseInt(args["AGENTS"], 10); }
    if (((args["CLEANUP"] === undefined) || (args["CLEANUP"] !== true)) && (((args["AGENTS"] === undefined) || (args["AGENTS"] === true) || (isNaN(args["AGENTS"]))) || ((args["URL"] === undefined) || (args["URL"] === true)) || ((args["MESHID"] === undefined) || (args["MESHID"] === true)))) {
        consoleHelp(); args['VALID'] = false;
        callback(2, args);
    }
    else { args['VALID'] = true; callback(null, args); }
}

// Check MeshID or Mesh file present
function parseMeshID(args, callback) {
    var cwd = __dirname;
    if (args.MESHID.substr(-4) === '.txt') { fs.readFile(cwd + '/' + args.MESHID, function (err, data) { if (err) { exit(err); return; } callback(null, data); }); }
    else { callback(null, args.MESHID); }
}
// Exit code status return
function exit(err) {
    if (err) {
        var message = 'undefined';
        if (err.message !== undefined) {
            message = err.message;
            process.exit(err);
        } else if (errorCodes[err] !== undefined) {
            message = errorCodes[err];
        } else {
            message = err;
        }
        console.log("exiting application with error: " + message);
    }
}

// Console help instructions
function consoleHelp() {
    console.log('Agent Launcher for MeshCentral 2.  Version: ' + agentLauncherVersion);
    console.log('No action or invalid action specified, use agentlauncher like this:\r\n');
    console.log('  agentlauncher [action] [arguments...]\r\n');
    console.log('Valid agentlauncher actions:\r\n');
    console.log('  URL              - Sets the URL for the MeshCentral 2 Server to retrieve agents.  Use with Agents and MeshID.');
    console.log('                     Example: URL http://meshcentral.com');
    console.log('  Agents           - Sets the number of agents to launch locally.  Default is 1.  Use with URL and MeshID.');
    console.log('                     Example: Agents 10');
    console.log('  MeshID           - Specifies the .txt file that contains the MeshID or the 64 character MeshID.  Use with URL and Agents.');
    console.log('                     Example: MeshID text.txt or MeshID Zg5GYnoysKG6QRFa4EVeT498a3lG1k@dpTXf0ijf6g9BNi6aIX92xxo$gW8mYrGK');
    console.log('  Toggle           - Randomly stops and starts agents.  Use with URL, Agents, and MeshID');
    console.log('  Cleanup          - Removes agent directories and files.  Do not use with other arguments');
}

// Console Report of Agent Launch
function reportLaunchSummary(index) {
    console.log('Number of Agents Launched: ' + childProcesses.length);
    console.log('Agent Directory: ' + childProcesses[index].directory);
    console.log('Agent PID: ' + childProcesses[index].child_Process.subprocess.pid);
}

// Queries the os Platform and returns the current platform information
function getPlatformInfo() {
    var currPlatform = {};
    currPlatform["PLATFORM"] = os.platform();
    currPlatform["RELEASE"] = os.release();
    currPlatform["ARCH"] = os.arch();
    return currPlatform;
}

// Figures out which agent to download from the server
function getPlatID(platInfo) {
    if ((platInfo.ARCH === 'x64') || (platInfo.ARCH === 'arm64')) {
        switch (platInfo.PLATFORM) {
            case 'win32':
                return 4;
            case 'linux':
                return 6;
            default:
                return 0;
        }
    } else if ((platInfo.ARCH === 'x32') || (platInfo.ARCH === 'arm')) {
        switch (platInfo.PLATFORM) {
            case 'win32':
                return 3;
            case 'linux':
                return 5;
            default:
                return 0;
        }
    } else {
        exit(2);
    }
}

// Digs through agents directory and removes files and folders
function cleanupAgents(callback) {
    var path = __dirname + '/agents/';
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + '/' + file;
            console.log('checking if ' + curPath + ' is a directory');
            if (fs.lstatSync(curPath).isDirectory()) {
                console.log(curPath + ' is a directory');
                removeFiles(curPath);
                if (curPath !== path) {
                    fs.rmdirSync(curPath);
                }
            }
        });
        callback(null, 'all files and folders cleaned up!');
    }
}

// Removes any files at path location
function removeFiles(path) {
    if (fs.existsSync(path)) {
        console.log('reading files from ' + path);
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + '/' + file;
            console.log('removing ' + curPath);
            fs.unlinkSync(curPath);
        });
    }
}

// Loop for launching a specific number of agents
function launchAgents(numAgents, callback) {
    console.log('launching Agents');
    for (var i = 0; i < numAgents; i++){
        if (i === numAgents - 1) { last = true; }
        startAgent(i, function (err, directory) {
            if (err) { callback(err); return; }
        });
    }
}

// Start a single Windows agent
function startAgent(directory, callback) {
    var path = __dirname + '/agents/' + directory;
    getDirectoryItems(path, function (err, items) {
        if (err) { callback(err); return; }
        var file; 
        console.log('Starting agent: ' + directory);
        items.forEach(function (fn) {
            switch (fn.substr(-3)) {
                // Linux Agent
                case 'ent':
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
        var meshAgent = spawn(path + '/' + file, ['connect'], { stdio: 'inherit' }, function (err) { if (err) { callback(err); } });
        meshAgent.on('message', (message) => { process.stdout.write(message + '\n'); });
        meshAgent.on('exit', (code, signal) => { if (code) { process.stdout.write('Agent exited with code: ' + code + '\n'); } if (signal) { process.stdout.write('Agent exited with signal: ' + signal + '\n'); }});
        meshAgent.on('error', (err) => { if (err) { process.stdout.write('Agent exited with error: ' + err + '\n'); }});
        meshAgent.on('close', (code, signal) => { if (code) { process.stdout.write('Agent closed with code: ' + code + '\n'); } if (signal) { process.stdout.write('Agent closed with signal: ' + signal + '\n'); }});
        meshAgent.on('disconnect', () => { process.stdout.write('Agent disconnected' + '\n'); });
        childProcesses.push({ 'directory': directory, 'child_Process': meshAgent });
        reportLaunchSummary(childProcesses.length - 1);
    });
}

// Kill and restart agent
function toggleChildProcess(index) {
    var directory = childProcesses[index].directory;
    childProcesses[index].child_Process.subprocess.kill(childProcesses[index].child_Process.subprocess.pid);
    childProcesses[index].child_Process.on('exit', function (code, signal) {

    });
}

// Create agent install location
function createDirectory(args, callback) {
    var cwd = __dirname + '/agents/';
    var items = getDirectoryItems(cwd, function (err, list) {
        if (err) { callback(err); return; }
        for (var i = 0; i < args.AGENTS; i++) {
            if (!fs.existsSync(cwd + i.toString())) {
                console.log('creating ' + i + ' directory');
                fs.mkdirSync(cwd + i.toString());
                for (var x = 0; x < list.length; x++) {
                    if (!fs.existsSync(cwd + i.toString() + '/' + list[x].toString())) {
                        console.log('copying ' + list[x].toString());
                        fs.copyFileSync(cwd + list[x].toString(), cwd + i.toString() + '/' + list[x].toString());
                    } else {
                        console.log('file ' + list[x].toString() + ' exists');
                    }
                }
            } else {
                console.log('directory ' + i + ' exists');
            }
        }
        callback(null);
    });
}

// Utility funtcion for getting the contents of a directory
function getDirectoryItems(directory, callback) { fs.readdir(directory, function (err, items) { if (err) { callback(err); return; } callback(null, items); }); }

// Download agent and mesh file
function downloadAgent(url, platID, callback) {
    var agentName = ['0', '1', '2', 'MeshAgent.exe', 'MeshAgent.exe', 'MeshAgent', 'MeshAgent'];
    if (!fs.existsSync(__dirname + '/agents')) {
        console.log('Creating agents directory');
        fs.mkdirSync(__dirname + '/agents');
    }
    var ddest = __dirname + '/agents/' + agentName[platID];
    if (!fs.existsSync(ddest)) {
        var file = fs.createWriteStream(ddest);
        console.log('Downloading Mesh Agent from ' + url + '. Please Wait...');
        var request = http.get(url + '/meshagents?id=' + platID, function (res) {
            res.pipe(file);
            file.on('finish', function () {
                console.log('Download complete!');
                var currPlatform = getPlatformInfo();
                if (currPlatform.PLATFORM === 'linux') {
                    console.log('Setting Permissions on file');
                    fs.chmodSync(ddest, 0o755);
                }
                file.close(callback);
            });
        });
    } else { callback(null); }
}

// Download mesh file from server
function downloadMeshFile(url, meshID, callback) {
    var ddest = __dirname + '/agents/MeshAgent.msh';
    if (!fs.existsSync(ddest)) {
        var file = fs.createWriteStream(ddest);
        console.log('Downloading Mesh Policy from ' + url + '. Please Wait...');
        var request = http.get(url + '/meshsettings?id=' + meshID, function (res) {
            res.pipe(file);
            file.on('finish', function () {
                file.close(callback);
            });
        });
    } else { callback(null); }
}

// Figure out if any arguments were provided, otherwise show help
if (process.argv.length > 2) {
    run(process.argv);
} else {
    consoleHelp();
    exit(2); return;
}