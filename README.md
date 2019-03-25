# Agent Launcher
INSTRUCTIONS FOR USE:
-------------------------------------------------------
*	Prior to launching, verify that you have an 'agents' subdirectory in the same directory where agentlauncher.js is located
*	For Windows: log into the mesh server and download the correct agent for the mesh you want to use and save the mesh agent in the 'agents' subfolder where agentlauncher.js is located
*	The folder structure should look something like this:

*	agentlauncher\
*	agentlauncher\agentlauncher.js
*	agentlauncher\README.md
*	agentlauncher\agents\
*	agentlauncher\agents\MeshAgent-MeshGroup.exe

INSTRUCTIONS TO RUN:
-------------------------------------------------------
*	Open a command prompt and navigate to the agentlauncher directory
*	C:> node agentlauncher.js arguments
*	Valid arguments are 'agents', 'url', 'meshid', and 'cleanup'.  See command line instructions for use.
*	Ex: C:>\agentlauncher\node agentlauncher.js agents 10 url http://mymeshserver.com meshid meshid.txt
*	Ex: C:>\agentlauncher\node agentlauncher.js cleanup 

BEST PRACTICES:
--------------------------------------------------------
*	Stopping and restarting with the same number of agents should work
*	Before changing the number of agents, it's best to run a 'cleanup' operation

