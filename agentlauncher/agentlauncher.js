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

var agentLauncherVersion = '0.0.1';
var actions = ["URL", "AGENTS", "STOP"];
// Execute based on incoming arguments
function run(argv) {
    var args = parseArguements(argv);
    validateArguments(args);
}
function parseArguements(argv) {
    var r = {};
    for (var i in argv) {
        i = parseInt(i);
        if ((argv[i].toUpperCase() == actions[0]) || (argv[i].toUpperCase() == actions[1]) || (argv[i].toUpperCase() == actions[2])) {
            var key = argv[i], val = true;
            if ((i + 1) < argv.length) {
                val = argv[i + 1];
            }
            r[key] = val;
        }
    }
    // Debug Check
    console.log("DEBUG:");
    for (var x in r) {
        console.log(x + ": " + r[x]);
    }
    return r;
}
// Verify that all arguements are valid
function validateArguments(args) {
    Object.keys(args).forEach(function(item) {
        if ((item.toUpperCase() !== actions[0]) && (item.toUpperCase() !== actions[1]) && (item.toUpperCase() !== actions[2])) {
            consoleHelp();
            exit(1); return;
        }
    });
}
function exit(status) { if (status == null) { status = 0; } try { console.log("exiting application with code: " + status); process.exit(status); } catch (e) { } }

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

